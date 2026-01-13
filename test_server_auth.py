#!/usr/bin/env python3
"""Backend LifeOS com autenticação real SQLite"""

from fastapi import FastAPI, Depends, HTTPException, status, Cookie
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
import json
import re
import sqlite3
import bcrypt
from typing import Optional
import secrets

STATE_FILE = Path("lifeos_state.json")
HISTORY_FILE = Path("financeiro_history.json")
DB_FILE = Path("lifeos.db")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ==================== DATABASE ====================
def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()
    print("[DB] Database initialized")

# ==================== MODELS ====================
class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

# ==================== AUTH FUNCTIONS ====================
def hash_password(password: str) -> str:
    """Hash password with bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password."""
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def get_current_user(token: Optional[str] = Cookie(None)):
    """Get current user from token."""
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM sessions WHERE token = ?", (token,))
    session = cursor.fetchone()
    conn.close()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    return session["user_id"]

# ==================== AUTH ENDPOINTS ====================
@app.post("/auth/signup")
def signup(req: SignupRequest):
    """Create new user."""
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (req.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create user
    password_hash = hash_password(req.password)
    cursor.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", 
                   (req.email, password_hash))
    conn.commit()
    
    user_id = cursor.lastrowid
    
    # Create session
    token = secrets.token_urlsafe(32)
    cursor.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", 
                   (user_id, token))
    conn.commit()
    conn.close()
    
    return AuthResponse(
        user=UserResponse(id=user_id, email=req.email),
        token=token
    )

@app.post("/auth/login")
def login(req: LoginRequest):
    """Login user."""
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Find user
    cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (req.email,))
    user = cursor.fetchone()
    
    if not user or not verify_password(req.password, user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = user["id"]
    
    # Create session
    token = secrets.token_urlsafe(32)
    cursor.execute("INSERT INTO sessions (user_id, token) VALUES (?, ?)", 
                   (user_id, token))
    conn.commit()
    conn.close()
    
    return AuthResponse(
        user=UserResponse(id=user_id, email=req.email),
        token=token
    )

@app.get("/auth/me")
def get_me(user_id: int = Depends(get_current_user)):
    """Get current user."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(id=user["id"], email=user["email"])

@app.post("/auth/logout")
def logout(user_id: int = Depends(get_current_user)):
    """Logout user."""
    return {"status": "logged out"}

# ==================== STATE FUNCTIONS ====================
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

# ==================== PROTECTED ROUTES ====================
@app.get("/health")
def health():
    print("[HEALTH] Called")
    return {"status": "ok"}

@app.get("/financeiro")
def financeiro(user_id: int = Depends(get_current_user)):
    print("[FINANCEIRO] Reading lifeos_state.json")
    return get_financeiro()

@app.get("/financeiro/historico")
def financeiro_historico(user_id: int = Depends(get_current_user)):
    print("[HISTORY] Reading financeiro_history.json")
    history = load_history()
    return history

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None

@app.post("/chat")
def chat(request: ChatRequest, user_id: int = Depends(get_current_user)):
    """Processa mensagens do chat, EXECUTA ação real e responde após persistir."""
    try:
        message = request.message
        print(f"\n[CHAT] Mensagem recebida: '{message}'")
        message_lower = message.lower()

        before_state = load_state()
        intention = ""
        action = ""
        success = False
        reply_text = ""
        new_state: dict | None = None

        # ===== DELETAR DÍVIDA =====
        if "apagar" in message_lower or "remover" in message_lower or "excluir" in message_lower:
            if "divida" in message_lower or "dívida" in message_lower:
                intention = "remover_divida"
                match = re.search(r"(\d+(?:[.,]\d+)?)", message)
                if match:
                    value_str = match.group(1).replace(",", ".")
                    value = float(value_str)
                    try:
                        removed_fin, removed_item = remove_divida(valor=value)
                        new_state = load_state()
                        action = "FINANCEIRO_DELETE"
                        reply_text = f"Dívida de R$ {value:.2f} removida. Estado atualizado: {new_state.get('financeiro', {})}"
                        success = True
                        record_event("REMOVE_DIVIDA", value, removed_item.get("descricao", ""), before_state, new_state)
                    except Exception as e:
                        new_state = load_state()
                        log_interaction(intention, "FINANCEIRO_DELETE", before_state, new_state, False, str(e))
                        return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}
                else:
                    intention = "remover_todas_dividas"
                    try:
                        state = load_state()
                        fin = state.get("financeiro", {})
                        if not fin.get("dividas"):
                            raise ValueError("Não há dívidas para remover")
                        fin["dividas"] = []
                        fin["ultima_atualizacao"] = current_ts()
                        state["financeiro"] = fin
                        save_state(state)
                        new_state = load_state()
                        action = "FINANCEIRO_DELETE_ALL"
                        reply_text = f"Todas as dívidas removidas. Estado atualizado: {new_state.get('financeiro', {})}"
                        success = True
                        record_event("REMOVE_ALL_DIVIDAS", None, "Todas as dívidas removidas", before_state, new_state)
                    except Exception as e:
                        new_state = load_state()
                        log_interaction(intention, "FINANCEIRO_DELETE_ALL", before_state, new_state, False, str(e))
                        return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        # ===== ADICIONAR DÍVIDA =====
        if "adicionar" in message_lower or "criar" in message_lower or "nova" in message_lower:
            if "divida" in message_lower or "dívida" in message_lower:
                intention = "adicionar_divida"
                match = re.search(r"(\d+(?:[.,]\d+)?)", message)
                if match:
                    value_str = match.group(1).replace(",", ".")
                    value = float(value_str)
                    try:
                        added_fin, added_item = add_divida(valor=value, descricao="Dívida")
                        new_state = load_state()
                        action = "FINANCEIRO_ADD"
                        reply_text = f"Dívida de R$ {value:.2f} adicionada. Estado atualizado: {new_state.get('financeiro', {})}"
                        success = True
                        record_event("ADD_DIVIDA", value, "Dívida", before_state, new_state)
                    except Exception as e:
                        new_state = load_state()
                        log_interaction(intention, "FINANCEIRO_ADD", before_state, new_state, False, str(e))
                        return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}
                else:
                    intention = "adicionar_divida_sem_valor"
                    new_state = load_state()
                    log_interaction(intention, "FINANCEIRO_ADD", before_state, new_state, False, "Valor não informado")
                    return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        # ===== CONSULTAR FINANCEIRO =====
        if not success and ("financeiro" in message_lower or ("divida" in message_lower or "dívida" in message_lower)):
            intention = "ler_financeiro"
            try:
                estado = get_financeiro()
                new_state = load_state()
                action = "FINANCEIRO_READ"
                reply_text = f"Estado financeiro atual: {estado}"
                success = True
            except Exception as e:
                new_state = load_state()
                log_interaction(intention, "FINANCEIRO_READ", before_state, new_state, False, str(e))
                return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        # ===== LER HISTÓRICO FINANCEIRO =====
        if not success and ("histórico" in message_lower or "extrato" in message_lower or "pago" in message_lower):
            intention = "ler_historico_financeiro"
            try:
                reply_text = format_history_reply()
                new_state = load_state()
                action = "FINANCEIRO_HISTORICO_READ"
                success = True
            except Exception as e:
                new_state = load_state()
                print(f"[ERROR] Erro ao ler histórico: {e}")
                return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        if not intention:
            new_state = load_state()
            log_interaction("intenção_não_mapeada", "NONE", before_state, new_state, False, "Nenhuma action derivada")
            return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        if not success or new_state is None:
            new_state = load_state()
            log_interaction(intention or "", action or "", before_state, new_state, False, "Ação não executada")
            return {"reply": "Não foi possível executar a ação. Estado não alterado.", "action": None}

        log_interaction(intention, action, before_state, new_state, True)
        return {"reply": reply_text, "action": action}

    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return {"reply": f"Erro ao executar ação: {str(e)}", "action": None}

if __name__ == "__main__":
    import uvicorn
    import signal
    
    # Initialize database
    init_db()
    
    def signal_handler(sig, frame):
        print("\n[SERVER] Recebeu sinal de término, ignorando...")
        pass
    
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
