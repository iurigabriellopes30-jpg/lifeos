#!/usr/bin/env python3
"""Backend mínimo - Fonte única de verdade: lifeos_state.json + financeiro_history.json"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timedelta
import json
import re
import sqlite3
import bcrypt
import jwt
import os
import requests
from dotenv import load_dotenv

# Carregar variáveis do arquivo .env
load_dotenv()

STATE_FILE = Path("lifeos_state.json")
HISTORY_FILE = Path("financeiro_history.json")
DB_FILE = Path("lifeos_users.db")
SECRET_KEY = "lifeos-secret-key-change-in-production"
ALGORITHM = "HS256"
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

security = HTTPBearer()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Database initialization
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            onboarding_completed INTEGER DEFAULT 0,
            consultation_started INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_financial_profile (
            user_id INTEGER PRIMARY KEY,
            income REAL DEFAULT 0,
            expenses REAL DEFAULT 0,
            has_debts INTEGER DEFAULT 0,
            savings_goal TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            interest_rate REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    conn.commit()
    conn.close()
    print(f"[DB] Database initialized: {DB_FILE}")

init_db()

# Auth helpers
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload

# Pydantic models
class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class OnboardingData(BaseModel):
    monthly_income: float
    fixed_expenses: float
    has_debts: bool
    debts: list = []
    main_priority: str = ""
    control_level: str = ""
    savingsGoal: str = ""

def load_state():
    if not STATE_FILE.exists():
        return {
            "financeiro": {
                "fase": 1,
                "dividas": [],
                "foco": "Parar sangria",
                "ultima_atualizacao": None,
            }
        }
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(state: dict):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def load_history():
    if not HISTORY_FILE.exists():
        return {"eventos": []}
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_history(history: dict):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def record_event(tipo: str, valor: float | None, descricao: str, estado_antes: dict, estado_depois: dict):
    """Registra um evento IMUTÁVEL no histórico após confirmar mudança real."""
    history = load_history()
    if not history.get("eventos"):
        history["eventos"] = []
    
    event_id = (history["eventos"][-1].get("id", 0) + 1) if history["eventos"] else 1
    
    event = {
        "id": event_id,
        "tipo": tipo,
        "valor": valor,
        "descricao": descricao,
        "timestamp": current_ts(),
        "estado_antes": estado_antes.get("financeiro", {}),
        "estado_depois": estado_depois.get("financeiro", {}),
    }
    
    history["eventos"].append(event)
    save_history(history)
    print(f"[HISTORY] Evento registrado: {tipo} (id={event_id})")


def format_history_reply():
    """Formata histórico para resposta amigável."""
    history = load_history()
    eventos = history.get("eventos", [])
    
    if not eventos:
        return "Nenhum evento financeiro registrado até agora."
    
    lines = []
    for evento in eventos:
        ts = evento.get("timestamp", 0)
        dt = datetime.fromtimestamp(ts)
        data_fmt = dt.strftime("%d/%m")
        tipo = evento.get("tipo", "")
        valor = evento.get("valor", 0)
        descricao = evento.get("descricao", "")
        
        if tipo == "ADD_DIVIDA":
            lines.append(f"{data_fmt} - Dívida adicionada: R${valor:.2f} ({descricao})")
        elif tipo == "REMOVE_DIVIDA":
            lines.append(f"{data_fmt} - Dívida quitada: R${valor:.2f} ({descricao})")
        else:
            lines.append(f"{data_fmt} - {tipo}: R${valor:.2f}" if valor else f"{data_fmt} - {tipo}")
    
    return "\n".join(lines)



def current_ts():
    import time
    return int(time.time())


def get_financeiro():
    state = load_state()
    return state.get("financeiro", {})


def add_divida(valor: float, descricao: str = "Dívida"):
    state = load_state()
    fin = state.get("financeiro", {})
    if valor <= 0:
        raise ValueError("Valor deve ser maior que zero")
    dividas = fin.get("dividas", [])
    new_id = (dividas[-1]["id"] + 1) if dividas else 1
    dividas.append({"id": new_id, "descricao": descricao, "valor": valor})
    fin.update({
        "dividas": dividas,
        "ultima_atualizacao": current_ts(),
    })
    state["financeiro"] = fin
    save_state(state)
    return fin, {"id": new_id, "descricao": descricao, "valor": valor}


def remove_divida(valor: float | None = None, id: int | None = None):
    state = load_state()
    fin = state.get("financeiro", {})
    dividas = fin.get("dividas", [])
    if not dividas:
        raise ValueError("Não há dívidas para remover")
    before_len = len(dividas)
    removed_divida = None
    if id is not None:
        for d in dividas:
            if d.get("id") == id:
                removed_divida = d
                break
        dividas = [d for d in dividas if d.get("id") != id]
    elif valor is not None:
        target = None
        for d in dividas:
            if abs(d.get("valor", 0) - valor) < 1e-6:
                target = d
                break
        if target:
            removed_divida = target
            dividas.remove(target)
    else:
        raise ValueError("Informe id ou valor para remover")

    if len(dividas) == before_len:
        raise ValueError("Nenhuma dívida correspondente encontrada")
    fin.update({
        "dividas": dividas,
        "ultima_atualizacao": current_ts(),
    })
    state["financeiro"] = fin
    save_state(state)
    return fin, removed_divida


def log_interaction(intention: str, action: str, before: dict, after: dict, success: bool, error: str | None = None):
    print("\n[DEBUG] intenção:", intention)
    print("[DEBUG] action:", action)
    print("[DEBUG] sucesso:", success)
    if error:
        print("[DEBUG] erro:", error)
    print("[DEBUG] estado_antes:", json.dumps(before, ensure_ascii=False))
    print("[DEBUG] estado_depois:", json.dumps(after, ensure_ascii=False))


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

# Auth endpoints
@app.post("/auth/signup")
def signup(data: SignupRequest):
    print(f"[SIGNUP] Email: {data.email}")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (data.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    cursor.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (data.email, password_hash)
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Create token
    token = create_access_token({"user_id": user_id, "email": data.email})
    
    print(f"[SIGNUP] User created: {user_id}")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "onboardingCompleted": False,
            "consultationStarted": False
        }
    }

@app.post("/auth/login")
def login(data: LoginRequest):
    print(f"[LOGIN] Email: {data.email}")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, email, password_hash, onboarding_completed, consultation_started FROM users WHERE email = ?",
        (data.email,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id, email, password_hash, onboarding_completed, consultation_started = row
    
    # Verify password
    if not bcrypt.checkpw(data.password.encode('utf-8'), password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token({"user_id": user_id, "email": email})
    
    print(f"[LOGIN] Success: {user_id}")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "onboardingCompleted": bool(onboarding_completed),
            "consultationStarted": bool(consultation_started)
        }
    }

@app.get("/auth/me")
def get_me(request: Request):
    user = get_current_user(request)
    user_id = user["user_id"]
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, email, onboarding_completed, consultation_started FROM users WHERE id = ?",
        (user_id,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id, email, onboarding_completed, consultation_started = row
    
    return {
        "id": user_id,
        "email": email,
        "onboardingCompleted": bool(onboarding_completed),
        "consultationStarted": bool(consultation_started)
    }

@app.post("/auth/logout")
def logout():
    return {"message": "Logged out successfully"}

@app.post("/auth/onboarding")
def complete_onboarding(data: OnboardingData, request: Request):
    user = get_current_user(request)
    user_id = user["user_id"]
    
    print(f"[ONBOARDING] User {user_id}: income={data.monthly_income}, expenses={data.fixed_expenses}")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # Save financial profile
    cursor.execute("""
        INSERT OR REPLACE INTO user_financial_profile 
        (user_id, income, expenses, has_debts, savings_goal)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, data.monthly_income, data.fixed_expenses, int(data.has_debts), data.savingsGoal))
    
    # Save debts
    if data.has_debts and data.debts:
        cursor.execute("DELETE FROM user_debts WHERE user_id = ?", (user_id,))
        for debt in data.debts:
            cursor.execute("""
                INSERT INTO user_debts (user_id, name, amount, interest_rate)
                VALUES (?, ?, ?, ?)
            """, (user_id, debt.get("name", ""), debt.get("amount", 0), debt.get("interestRate", 0)))
    
    # Mark onboarding as complete
    cursor.execute(
        "UPDATE users SET onboarding_completed = 1 WHERE id = ?",
        (user_id,)
    )
    
    conn.commit()
    conn.close()
    
    print(f"[ONBOARDING] Complete for user {user_id}")
    return {"message": "Onboarding completed", "success": True}

@app.post("/auth/mark-consultation-started")
def mark_consultation_started(request: Request):
    user = get_current_user(request)
    user_id = user["user_id"]
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE users SET consultation_started = 1 WHERE id = ?",
        (user_id,)
    )
    
    conn.commit()
    conn.close()
    
    print(f"[CONSULTATION] Marked as started for user {user_id}")
    return {"message": "Consultation started", "success": True}

@app.get("/health")
def health():
    print("[HEALTH] Called")
    return {"status": "ok"}

@app.get("/financeiro")
def financeiro(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Retorna dados financeiros do usuário autenticado"""
    try:
        token = credentials.credentials
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_email = payload.get("email")  # Extrair email do payload
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Buscar user_id
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
        user_row = cursor.fetchone()
        if not user_row:
            conn.close()
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        user_id = user_row[0]
        
        # Buscar perfil financeiro
        cursor.execute("""
            SELECT income, expenses, has_debts, savings_goal
            FROM user_financial_profile WHERE user_id = ?
        """, (user_id,))
        profile = cursor.fetchone()
        
        # Buscar dívidas
        cursor.execute("""
            SELECT id, name, amount FROM user_debts WHERE user_id = ?
        """, (user_id,))
        debts_rows = cursor.fetchall()
        
        conn.close()
        
        if not profile:
            # Usuário sem consultoria ainda
            return {
                "fase": 1,
                "dividas": [],
                "foco": "Iniciar consultoria",
                "renda_mensal": 0,
                "gastos_fixos": 0,
                "disponivel": 0,
                "ultima_atualizacao": None
            }
        
        renda, despesas, has_debts, savings_goal = profile
        
        dividas_list = [
            {"id": d[0], "descricao": d[1], "valor": d[2]}
            for d in debts_rows
        ]
        
        total_dividas = sum(d["valor"] for d in dividas_list)
        disponivel = renda - despesas
        
        # Determinar fase baseado na situação
        if total_dividas > renda * 3:
            fase = 1  # ATAQUE - muitas dívidas
        elif total_dividas > 0:
            fase = 2  # PLANEJAMENTO - algumas dívidas
        else:
            fase = 3  # CRESCIMENTO - sem dívidas
        
        return {
            "fase": fase,
            "dividas": dividas_list,
            "foco": savings_goal or "Organizar finanças",
            "renda_mensal": renda,
            "gastos_fixos": despesas,
            "disponivel": disponivel,
            "ultima_atualizacao": int(datetime.now().timestamp() * 1000)
        }
        
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/financeiro/atualizar")
async def atualizar_financeiro(request: Request):
    """Endpoint para atualizar dados financeiros manualmente"""
    user = get_current_user(request)
    user_id = user["user_id"]
    
    try:
        data = await request.json()
        print(f"[UPDATE] Atualizando dados do user {user_id}: {data}")
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Preservar a estratégia existente (savings_goal) ao atualizar valores
        cursor.execute(
            "SELECT savings_goal FROM user_financial_profile WHERE user_id = ?",
            (user_id,)
        )
        row = cursor.fetchone()
        monthly_income = data.get("monthly_income", 0)
        total_expenses = data.get("fixed_expenses", 0) + data.get("variable_expenses", 0)
        has_debts = int(data.get("has_debts", False))
        
        if row is not None:
            # Atualiza somente números, mantém savings_goal
            cursor.execute(
                """
                UPDATE user_financial_profile
                SET income = ?, expenses = ?, has_debts = ?
                WHERE user_id = ?
                """,
                (monthly_income, total_expenses, has_debts, user_id)
            )
        else:
            # Cria registro novo sem sobrescrever estratégia futura
            cursor.execute(
                """
                INSERT INTO user_financial_profile
                (user_id, income, expenses, has_debts, savings_goal)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user_id, monthly_income, total_expenses, has_debts, "")
            )
        
        # Atualizar dívidas
        cursor.execute("DELETE FROM user_debts WHERE user_id = ?", (user_id,))
        for debt in data.get("debts", []):
            cursor.execute("""
                INSERT INTO user_debts (user_id, name, amount)
                VALUES (?, ?, ?)
            """, (user_id, debt["name"], debt["amount"]))
        
        conn.commit()
        conn.close()
        
        print(f"[UPDATE] Dados atualizados para user {user_id}")
        return {"success": True, "message": "Dados atualizados com sucesso"}
    except Exception as e:
        print(f"[ERROR] Erro ao atualizar: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/financeiro/historico")
def financeiro_historico():
    print("[HISTORY] Reading financeiro_history.json")
    history = load_history()
    return history

def extract_and_save_financial_data(user_id):
    """Extrai dados financeiros da conversa de consultoria e salva no banco"""
    import re
    
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Carregar histórico de chat em ordem cronológica
        cursor.execute("""
            SELECT content, role FROM chat_history 
            WHERE user_id = ? 
            ORDER BY created_at ASC
        """, (user_id,))
        messages = [(row[0], row[1]) for row in cursor.fetchall()]
        
        income = 0
        expenses = 0
        debts = []
        
        # Processar mensagens do usuário para extrair dados
        for content, role in messages:
            if role == "user":
                # Procura por menção de RENDA (com keywords)
                renda_match = re.search(r'(?:renda|ganho|salário|recebo|ganho)\s+(?:de\s+)?(?:um?|R\$)?\s*(\d+(?:[.,]\d{2})?)', content, re.IGNORECASE)
                if renda_match and income == 0:
                    income = float(renda_match.group(1).replace(',', '.'))
                    print(f"[EXTRACT] Renda encontrada: {income}")
                
                # Procura por DESPESAS TOTAIS
                despesa_match = re.search(r'(?:despesa|gasto|total.*gasto|custo)\s+(?:total|fixa|d)?(?:.*?)(?:de\s+|é\s+)?(?:R\$)?\s*(\d+(?:[.,]\d{2})?)', content, re.IGNORECASE)
                if despesa_match and expenses == 0:
                    expenses = float(despesa_match.group(1).replace(',', '.'))
                    print(f"[EXTRACT] Despesa encontrada: {expenses}")
                
                # Se não encontrou com keywords, tenta extrair números do contexto
                if income == 0 and ('renda' in content.lower() or 'ganho' in content.lower() or 'recebo' in content.lower()):
                    nums = re.findall(r'(\d+(?:[.,]\d{2})?)', content)
                    if nums:
                        income = float(nums[0].replace(',', '.'))
                        print(f"[EXTRACT] Renda (fallback): {income}")
                
                # Procura dívidas mencionadas (cartão, multa, etc)
                debt_patterns = [
                    r'(?:cartão|nubank).*?(\d+(?:[.,]\d{2})?)',
                    r'(?:multa).*?(\d+(?:[.,]\d{2})?)',
                    r'(?:empréstim).*?(\d+(?:[.,]\d{2})?)',
                    r'(?:dívida?).*?(\d+(?:[.,]\d{2})?)',
                ]
                
                for pattern in debt_patterns:
                    debt_match = re.search(pattern, content, re.IGNORECASE)
                    if debt_match:
                        amount = float(debt_match.group(1).replace(',', '.'))
                        if amount > 0 and not any(d['amount'] == amount for d in debts):
                            debts.append({"name": "Dívida", "amount": amount})
                            print(f"[EXTRACT] Dívida encontrada: {amount}")
        
        # Fallback: se não encontrou nada, procura pelos números maiores
        if income == 0 or expenses == 0:
            all_text = " ".join([c for c, r in messages])
            numbers = []
            for match in re.finditer(r'(\d+(?:[.,]\d{2})?)', all_text):
                try:
                    num = float(match.group(1).replace(',', '.'))
                    if num > 0:
                        numbers.append(num)
                except:
                    pass
            
            # Remover duplicatas mantendo ordem
            unique_numbers = []
            for n in numbers:
                if n not in unique_numbers:
                    unique_numbers.append(n)
            
            if income == 0 and len(unique_numbers) > 0:
                income = unique_numbers[0]
                print(f"[EXTRACT] Renda (último recurso): {income}")
            
            if expenses == 0 and len(unique_numbers) > 1:
                expenses = unique_numbers[1]
                print(f"[EXTRACT] Despesa (último recurso): {expenses}")
        
        print(f"[EXTRACT] User {user_id}: income={income}, expenses={expenses}, debts={len(debts)}")
        
        # Validar dados (renda > despesas em geral)
        if income > 0 and expenses > income * 5:
            # Provável que os valores estão trocados
            print(f"[EXTRACT] Valores possivelmente trocados, invertendo...")
            income, expenses = expenses, income
        
        # Salvar no banco de dados
        if income > 0 or expenses > 0 or debts:
            cursor.execute("""
                INSERT OR REPLACE INTO user_financial_profile 
                (user_id, income, expenses, has_debts, savings_goal)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, income, expenses, int(len(debts) > 0), "Plano da consultoria"))
            
            # Salvar dívidas
            if debts:
                cursor.execute("DELETE FROM user_debts WHERE user_id = ?", (user_id,))
                for debt in debts:
                    cursor.execute("""
                        INSERT INTO user_debts (user_id, name, amount)
                        VALUES (?, ?, ?)
                    """, (user_id, debt["name"], debt["amount"]))
            
            conn.commit()
            print(f"[EXTRACT] Dados salvos para user {user_id}")
        else:
            print(f"[EXTRACT] Nenhum dado válido encontrado para user {user_id}")
        
        conn.close()
    except Exception as e:
        print(f"[EXTRACT] Erro ao extrair dados: {e}")
        import traceback
        traceback.print_exc()

@app.post("/chat")
def chat(request: ChatRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Processa mensagens do chat com IA REAL + Consultoria estruturada"""
    try:
        # Validar autenticação
        token = credentials.credentials
        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_email = payload.get("email")  # Extrair email do payload
        print(f"[CHAT] Token payload: {payload}")
        print(f"[CHAT] User email from token: {user_email}")
        
        # Buscar user_id
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, email FROM users")
        all_users = cursor.fetchall()
        print(f"[CHAT] All users in DB: {[(u['id'], u['email']) for u in all_users]}")
        
        cursor.execute("SELECT id, consultation_started FROM users WHERE email = ?", (user_email,))
        user_row = cursor.fetchone()
        if not user_row:
            conn.close()
            print(f"[ERROR] User not found. Email searched: '{user_email}'")
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        user_id = user_row["id"]
        
        message = request.message
        print(f"\n[CHAT] User {user_id} - Mensagem: '{message}'")
        
        # Buscar dados financeiros do usuário
        conn_finance = sqlite3.connect(DB_FILE)
        cursor_finance = conn_finance.cursor()
        cursor_finance.execute("""
            SELECT income, expenses, has_debts FROM user_financial_profile 
            WHERE user_id = ?
        """, (user_id,))
        finance_data = cursor_finance.fetchone()
        print(f"[DEBUG] finance_data encontrado: {finance_data}")
        
        cursor_finance.execute("""
            SELECT name, amount FROM user_debts WHERE user_id = ?
        """, (user_id,))
        debts_data = cursor_finance.fetchall()
        print(f"[DEBUG] debts_data encontrado: {debts_data}")
        conn_finance.close()
        
        # Buscar histórico de conversa do usuário (últimas 20 mensagens)
        cursor.execute("""
            SELECT role, content FROM chat_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        """, (user_id,))
        history_rows = cursor.fetchall()
        history_rows.reverse()  # Mais antigas primeiro
        
        conn.close()
        
        if not OPENROUTER_API_KEY:
            print("[ERROR] OPENROUTER_API_KEY não configurada")
            return {"reply": "Erro: Chave de API não configurada", "action": None}
        
        # Verificar se usuário está pedindo estratégia e tem dados
        criar_estrategia = any(palavra in message.lower() for palavra in ["estratégia", "estrategia", "plano", "criar", "ajuda", "dividas"])
        print(f"[DEBUG] criar_estrategia detectado: {criar_estrategia}")
        print(f"[DEBUG] Condição (finance_data and criar_estrategia): {bool(finance_data and criar_estrategia)}")
        
        # Verificar se usuário está PEDINDO DIRETAMENTE para adicionar/salvar estratégia
        pedir_adicionar = any(palavra in message.lower() for palavra in ["adicione", "adiciona", "salve", "salva", "coloque", "coloca", "guarde", "guarda"]) and any(palavra in message.lower() for palavra in ["financeiro", "página", "pagina", "controle", "estratégia", "estrategia", "plano"])
        print(f"[DEBUG] pedir_adicionar detectado: {pedir_adicionar}")
        
        # Se usuário está pedindo para adicionar, disparar salvar imediatamente
        if pedir_adicionar and finance_data:
            print("[CHAT] Usuário pediu DIRETAMENTE para adicionar estratégia na página")
            # Buscar a estratégia completa do histórico (últimas mensagens do assistente)
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT content FROM chat_history 
                WHERE user_id = ? AND role = 'assistant'
                ORDER BY created_at DESC 
                LIMIT 10
            """, (user_id,))
            recent_messages = cursor.fetchall()
            
            # Extrair apenas as partes estruturadas da estratégia
            import re
            estrategia_limpa = []
            
            for msg in reversed(recent_messages):
                texto = msg[0]
                
                # Remover introduções e perguntas
                linhas_remover = [
                    r"com base nas.*?personalizada:?",
                    r"aqui está.*?personalizada:?",
                    r"ficou alguma dúvida.*?\?",
                    r"claro!.*?informações:?",
                    r"vamos detalhar.*?informações:?",
                    r"para criar.*?informações",
                    r"fico feliz.*?dúvidas",
                    r"infelizmente.*?orientação"
                ]
                
                for padrao in linhas_remover:
                    texto = re.sub(padrao, "", texto, flags=re.IGNORECASE | re.DOTALL)
                
                # Extrair apenas seções numeradas e estruturadas
                secoes = re.findall(r'(\d+\.\s*\*\*[^*]+\*\*:?.*?)(?=\d+\.\s*\*\*|$)', texto, re.DOTALL)
                
                if secoes:
                    for secao in secoes:
                        secao_limpa = secao.strip()
                        # Evitar duplicatas
                        if secao_limpa and secao_limpa not in estrategia_limpa:
                            estrategia_limpa.append(secao_limpa)
            
            # Montar estratégia final
            estrategia_completa = "\n\n".join(estrategia_limpa[:4])  # Máximo 4 seções
            
            # Se não conseguiu extrair estruturadamente, usar fallback mais agressivo
            if not estrategia_completa or len(estrategia_completa) < 100:
                for msg in reversed(recent_messages[:3]):
                    texto = msg[0]
                    # Pegar apenas do primeiro "1." ou "**" até o final
                    match = re.search(r'(1\.\s*\*\*.*)', texto, re.DOTALL)
                    if match:
                        estrategia_completa = match.group(1).strip()
                        break
            
            # Limitar tamanho
            if len(estrategia_completa) > 1200:
                estrategia_completa = estrategia_completa[:1200] + "..."
            
            cursor.execute("""
                UPDATE user_financial_profile 
                SET savings_goal = ? 
                WHERE user_id = ?
            """, (estrategia_completa.strip(), user_id))
            conn.commit()
            conn.close()
            print(f"[CHAT] Estratégia salva diretamente (pedido explícito do usuário)")
            
            return {"reply": "Perfeito! Estratégia adicionada com sucesso na sua página de Controle Financeiro! 🎯", "action": "ESTRATEGIA_SALVA"}
        
        # Verificar se usuário está confirmando para colocar na página (antigo fluxo)
        confirmar_salvar = any(palavra in message.lower() for palavra in ["sim", "pode", "coloca", "adiciona", "salva", "confirmo", "ok", "yes", "claro"])
        
        # System prompt - adaptado se tem dados financeiros ou não
        if finance_data and criar_estrategia:
            print("[DEBUG] Usando system prompt COM DADOS FINANCEIROS")
            renda, despesas, has_debts = finance_data
            dividas_texto = ""
            total_dividas = 0
            if debts_data:
                total_dividas = sum(d[1] for d in debts_data)
                dividas_lista = [f"{d[0]}: R$ {d[1]:.2f}" for d in debts_data]
                dividas_texto = f"\nDívidas: {', '.join(dividas_lista)} (Total: R$ {total_dividas:.2f})"
            
                system_prompt = f"""Leo, consultor financeiro do LifeOS.

DADOS DO USUÁRIO:
Renda: R$ {renda:.2f} | Despesas: R$ {despesas:.2f} | Disponível: R$ {(renda - despesas):.2f}{dividas_texto}

INSTRUÇÕES OBRIGATÓRIAS:

1. Crie estratégia personalizada com:
   - Análise da situação
   - 3 passos práticos
   - Foco do mês
   - Meta diária

 FORMATAÇÃO (obrigatória):
 - Use texto simples, sem markdown
 - NÃO use negrito, itálico ou **asteriscos**
 - Mantenha as seções numeradas como "1.", "2.", "3.", "4."
 - Separe seções com uma linha em branco
 - Para subitens, use "- " no início da linha

2. TERMINE SUA RESPOSTA COM ESTA PERGUNTA EXATA:
   "Ficou alguma dúvida sobre o plano?"

3. Se usuário tiver dúvidas, esclareça detalhadamente.

4. Quando usuário disser "entendi/gostei/ta bom/ok/sem dúvidas", PERGUNTE:
   "Posso adicionar essa estratégia na sua página de Controle Financeiro?"

5. Se usuário disser SIM/PODE/ADICIONA, responda:
   "Perfeito! SALVAR_ESTRATEGIA"

IMPORTANTE: Após esclarecer dúvidas, SEMPRE pergunte sobre adicionar na página."""
        else:
            print("[DEBUG] Usando system prompt PADRÃO (sem dados ou sem palavra-chave)")
            system_prompt = """Você é um consultor financeiro profissional do LifeOS chamado Leo. Seja empático e conversacional.

Conduza uma consultoria em 3 etapas:

ETAPA 1 - RENDA: Pergunte: "Primeiro, me conta quanto você ganha por mês?"
ETAPA 2 - DESPESAS: Quando souber a renda, pergunte: "E quanto você gasta com despesas fixas (aluguel, contas, etc)?"
ETAPA 3 - DÍVIDAS: Quando souber despesas, pergunte: "Você tem dívidas ativas? Se sim, quanto deve no total?"

Após coletar TODAS as 3 informações, agradeça e diga: "Vou processar essas informações e criar seu plano! CONSULTORIA_FINALIZADA"

IMPORTANTE:
- Faça UMA pergunta por vez
- Confirme os valores que o usuário informou antes de passar para próxima etapa
- Seja breve e objetivo
- Use tom amigável e motivacional
- NUNCA repita perguntas que já foram respondidas
- Quando responder com listas, use texto simples sem markdown (sem **, _, títulos em negrito)."""

        # Construir array de mensagens com histórico
        messages = [{"role": "system", "content": system_prompt}]
        
        # Adicionar histórico
        for row in history_rows:
            messages.append({"role": row[0], "content": row[1]})
        
        # Se tem dados financeiros, adicionar lembrete do sistema antes da mensagem atual
        if finance_data and criar_estrategia:
            renda, despesas, has_debts = finance_data
            reminder = f"LEMBRETE: Usuário JÁ forneceu dados - Renda: R${renda:.0f}, Despesas: R${despesas:.0f}, Disponível: R${renda-despesas:.0f}. NÃO PEÇA essas informações novamente. CRIE A ESTRATÉGIA AGORA e termine com 'Ficou alguma dúvida sobre o plano?'"
            messages.append({"role": "system", "content": reminder})
            print(f"[DEBUG] Adicionado lembrete do sistema sobre dados existentes")
        
        # Adicionar mensagem atual
        messages.append({"role": "user", "content": message})
        
        print(f"[CHAT] Enviando {len(messages)} mensagens para IA (histórico: {len(history_rows)})")
        
        # Chamar IA
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 400,
        }
        
        print(f"[CHAT] Chamando OpenRouter...")
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"[ERROR] OpenRouter retornou {response.status_code}")
            return {"reply": f"Erro ao conectar com IA: {response.status_code}", "action": None}
        
        result = response.json()
        ai_reply = result.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        if not ai_reply:
            return {"reply": "Desculpe, não consegui processar", "action": None}
        
        print(f"[CHAT] IA Response: {ai_reply[:100]}...")
        
        # Salvar histórico da conversa
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_history (user_id, role, content) 
            VALUES (?, ?, ?)
        """, (user_id, "user", message))
        cursor.execute("""
            INSERT INTO chat_history (user_id, role, content) 
            VALUES (?, ?, ?)
        """, (user_id, "assistant", ai_reply))
        conn.commit()
        conn.close()
        print(f"[CHAT] Histórico salvo para user {user_id}")
        
        # Detectar se usuário confirmou salvar estratégia
        if "SALVAR_ESTRATEGIA" in ai_reply.upper():
            print("[CHAT] Usuário confirmou salvar estratégia na página")
            # Buscar a estratégia completa do histórico (últimas mensagens do assistente)
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT content FROM chat_history 
                WHERE user_id = ? AND role = 'assistant'
                ORDER BY created_at DESC 
                LIMIT 10
            """, (user_id,))
            recent_messages = cursor.fetchall()
            
            # Extrair apenas as partes estruturadas da estratégia
            import re
            estrategia_limpa = []
            
            for msg in reversed(recent_messages[1:]):  # Pular última (confirmação)
                texto = msg[0]
                
                # Remover introduções e perguntas
                linhas_remover = [
                    r"com base nas.*?personalizada:?",
                    r"aqui está.*?personalizada:?",
                    r"ficou alguma dúvida.*?\?",
                    r"claro!.*?informações:?",
                    r"vamos detalhar.*?informações:?",
                    r"para criar.*?informações",
                    r"fico feliz.*?dúvidas",
                    r"infelizmente.*?orientação",
                    r"salvar_estrategia"
                ]
                
                for padrao in linhas_remover:
                    texto = re.sub(padrao, "", texto, flags=re.IGNORECASE | re.DOTALL)
                
                # Extrair apenas seções numeradas e estruturadas
                secoes = re.findall(r'(\d+\.\s*\*\*[^*]+\*\*:?.*?)(?=\d+\.\s*\*\*|$)', texto, re.DOTALL)
                
                if secoes:
                    for secao in secoes:
                        secao_limpa = secao.strip()
                        # Evitar duplicatas
                        if secao_limpa and secao_limpa not in estrategia_limpa:
                            estrategia_limpa.append(secao_limpa)
            
            # Montar estratégia final
            estrategia_completa = "\n\n".join(estrategia_limpa[:4])  # Máximo 4 seções
            
            # Se não conseguiu extrair estruturadamente, usar fallback
            if not estrategia_completa or len(estrategia_completa) < 100:
                for msg in reversed(recent_messages[1:4]):
                    texto = msg[0]
                    # Pegar apenas do primeiro "1." ou "**" até o final
                    match = re.search(r'(1\.\s*\*\*.*)', texto, re.DOTALL)
                    if match:
                        estrategia_completa = match.group(1).strip()
                        break
            
            # Limitar tamanho
            if len(estrategia_completa) > 1200:
                estrategia_completa = estrategia_completa[:1200] + "..."
            
            # Limpar marcadores residuais
            estrategia_completa = estrategia_completa.replace("SALVAR_ESTRATEGIA", "").replace("Perfeito!", "").strip()
            
            cursor.execute("""
                UPDATE user_financial_profile 
                SET savings_goal = ? 
                WHERE user_id = ?
            """, (estrategia_completa, user_id))
            conn.commit()
            conn.close()
            print(f"[CHAT] Estratégia completa salva para user {user_id}")
            
            return {"reply": ai_reply.replace("SALVAR_ESTRATEGIA", "").replace("SALVAR_ESTRATEGIA", "").strip(), "action": "ESTRATEGIA_SALVA"}
        
        # Detectar consultoria antiga (manter compatibilidade)
        if "CONSULTORIA FINALIZADA" in ai_reply.upper():
            print("[CHAT] Consultoria detectada como finalizada")
            extract_and_save_financial_data(user_id)
            return {"reply": ai_reply.replace("CONSULTORIA FINALIZADA", "").replace("CONSULTORIA_FINALIZADA", "").strip(), "action": "CONSULTORIA_FINALIZADA"}
        
        return {"reply": ai_reply, "action": None}

    except requests.exceptions.Timeout:
        return {"reply": "Erro: Timeout ao conectar com IA. Tente novamente.", "action": None}
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return {"reply": f"Erro: {str(e)}", "action": None}

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys
    
    def signal_handler(sig, frame):
        print("\n[SERVER] Recebeu sinal de término, ignorando...")
        pass
    
    # Ignorar sinais de término
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("[SERVER] Iniciando com proteção contra shutdown...")
    print("LifeOS state foundation established")
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8001,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("[SERVER] KeyboardInterrupt capturado, continuando...")
        pass
    except Exception as e:
        print(f"[SERVER] Erro: {e}, continuando...")
        pass
