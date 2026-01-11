from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import httpx
import os
import json
from pathlib import Path
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="LifeOS Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


@app.on_event("startup")
async def startup_event():
    print("🔥 BACKEND LIFEOS INICIADO COM CORS ATIVO (http://localhost:5173)")
    print("✅ Endpoint /chat disponível em http://127.0.0.1:8000/chat")

MEMORY_FILE = Path("memory.json")
FINANCE_FILE = Path("financeiro.json")
FINANCE_CONV_FILE = Path("financial_conversation_state.json")


MEMORY_FILE = Path("memory.json")
FINANCE_FILE = Path("financeiro.json")
MAX_RECENT_MESSAGES = 10


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class PendingAction(BaseModel):
    """Structured action proposal from AI requiring user confirmation."""
    type: str  # "financeiro" | "tarefa" | "rotina" | "calendario"
    operation: str  # "create" | "update" | "delete"
    payload: dict  # structured data for the action
    description: str  # human-readable description of what will happen
    
    class Config:
        populate_by_name = True


class ChatResponse(BaseModel):
    reply: str
    action: Optional[PendingAction] = Field(None)
    
    model_config = ConfigDict(populate_by_name=True)


class Memory(BaseModel):
    summary: str = ""
    recent_messages: List[Dict[str, str]] = []


class FinanceiroState(BaseModel):
    id: int = 1  # singleton
    faseAtual: Optional[int] = None  # 1=Parar sangria | 2=Definir total e prazo | 3=Calcular ritmo | 4=Executar | 5=Dívida zerada
    totalDivida: Optional[float] = None
    prazoAlvoMeses: Optional[int] = None
    ritmoMensal: Optional[float] = None
    ritmoDiario: Optional[float] = None
    focoAtual: Optional[str] = None
    atualizadoEm: int = 0  # timestamp
    ultimaAtualizacao: int = 0


class FinancialConversationState(BaseModel):
    """Estado persistente da conversação financeira para evitar loops"""
    isActive: bool = False
    collectedData: dict = {
        "debts": [],
        "totalDivida": None,
        "urgencia": None,
        "prazo": None
    }
    questionsAsked: list = []  # Perguntas já feitas
    dataComplete: bool = False
    readyToExecute: bool = False
    executed: bool = False


def load_memory() -> Memory:
    """Load memory from file or create empty memory."""
    if MEMORY_FILE.exists():
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return Memory(**data)
        except Exception:
            pass
    return Memory()


def save_memory(memory: Memory) -> None:
    """Save memory to file."""
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(memory.model_dump(), f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def load_financeiro() -> FinanceiroState:
    """Load financeiro state from file; initialize empty if missing."""
    if FINANCE_FILE.exists():
        try:
            with open(FINANCE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return FinanceiroState(**data)
        except Exception:
            pass
    # initialize empty
    state = FinanceiroState(ultimaAtualizacao=int(__import__("time").time()))
    try:
        with open(FINANCE_FILE, "w", encoding="utf-8") as f:
            json.dump(state.model_dump(), f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    return state


def save_financeiro(state: FinanceiroState) -> None:
    try:
        with open(FINANCE_FILE, "w", encoding="utf-8") as f:
            json.dump(state.model_dump(), f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def load_conversation_state() -> FinancialConversationState:
    """Load financial conversation state from file."""
    if FINANCE_CONV_FILE.exists():
        try:
            with open(FINANCE_CONV_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return FinancialConversationState(**data)
        except Exception:
            pass
    return FinancialConversationState()


def save_conversation_state(state: FinancialConversationState):
    """Save financial conversation state."""
    try:
        with open(FINANCE_CONV_FILE, "w", encoding="utf-8") as f:
            json.dump(state.model_dump(), f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def reset_conversation_state():
    """Reset conversation state after execution."""
    state = FinancialConversationState()
    save_conversation_state(state)


def set_financial_planning_init() -> FinanceiroState:
    """Enter planning mode: set status and clear strategy fields without inventing values."""
    state = load_financeiro()
    state.status = "planning"
    state.step = "initial_questions"
    state.faseAtual = None
    state.totalDivida = None
    state.prazoAlvoMeses = None
    state.ritmoMensal = None
    state.ritmoDiario = None
    state.focoAtual = None
    state.ultimaAtualizacao = int(__import__("time").time())
    save_financeiro(state)
    return state


def determine_financial_phase(state: FinanceiroState, user_message: str) -> int:
    """Determine which phase the user is in based on state and message."""
    import re
    
    user_lower = user_message.lower()
    
    # Detect financial intent
    has_financial_intent = any(word in user_lower for word in ["dívida", "divida", "financeiro", "devo", "pagar", "débito", "cartão", "nubank", "credores"])
    
    if not has_financial_intent:
        return state.faseAtual or 0
    
    # If no phase yet, start at phase 1
    if state.faseAtual is None or state.faseAtual == 0:
        return 1
    
    # If in phase 1, check if we have urgency info (mention of delay, interest, etc)
    if state.faseAtual == 1:
        has_urgency_info = any(word in user_lower for word in ["atrasado", "atraso", "juros", "vence", "urgente", "dias"])
        if has_urgency_info and state.totalDivida:
            return 2  # Move to phase 2
        return 1
    
    # If in phase 2, check if we have total and timeline
    if state.faseAtual == 2:
        if state.totalDivida and state.prazoAlvoMeses:
            return 3  # Move to phase 3
        return 2
    
    # If in phase 3, check if we have rhythm defined
    if state.faseAtual == 3:
        if state.ritmoMensal or state.ritmoDiario:
            return 4  # Move to phase 4
        return 3
    
    # Phase 4 and 5 managed by system
    return state.faseAtual


def orchestrate_financeiro(state: FinanceiroState, user_message: str) -> tuple[FinanceiroState, str]:
    """
    Orchestrate financial strategy with persistent conversation state.
    Returns: (updated_state, response_text_for_chat)
    """
    import re
    
    user_lower = user_message.lower()
    
    # Detect if this is a financial reading request
    is_read_request = any(word in user_lower for word in ["como está", "o que tem", "mostre", "status", "meu financeiro"])
    
    if is_read_request:
        # Read financial state
        if state.totalDivida or state.faseAtual:
            parts = []
            if state.faseAtual:
                parts.append(f"Fase: {state.faseAtual}")
            if state.totalDivida:
                parts.append(f"Dívida: R$ {state.totalDivida:.2f}")
            if state.prazoAlvoMeses:
                parts.append(f"Prazo: {state.prazoAlvoMeses} meses")
            if state.ritmoMensal:
                parts.append(f"Ritmo mensal: R$ {state.ritmoMensal:.2f}")
            if state.focoAtual:
                parts.append(f"Foco: {state.focoAtual}")
            response = "Seu financeiro: " + " | ".join(parts)
            return state, response
        else:
            return state, "Seu financeiro ainda não tem dados. Quer começar a organizar?"
    
    # Detect if this is a financial conversation
    has_financial_intent = any(word in user_lower for word in ["dívida", "divida", "financeiro", "devo", "pagar", "débito", "cartão", "nubank", "credores"])
    
    if not has_financial_intent:
        return state, None  # Not a financial topic
    
    # Load conversation state
    conv_state = load_conversation_state()
    
    # If already executed, reset and start fresh
    if conv_state.executed:
        reset_conversation_state()
        conv_state = load_conversation_state()
    
    # Activate conversation
    if not conv_state.isActive:
        conv_state.isActive = True
        save_conversation_state(conv_state)
    
    # Extract data from message
    amount_match = re.search(r'r?\$?\s*(\d+(?:[.,]\d+)?)', user_lower)
    if amount_match and "totalDivida" not in conv_state.questionsAsked:
        amount_str = amount_match.group(1).replace(',', '.')
        conv_state.collectedData["totalDivida"] = float(amount_str)
        state.totalDivida = float(amount_str)
    
    # Extract urgency
    if any(word in user_lower for word in ["atrasado", "atraso", "juros", "urgente"]):
        if "urgencia" not in conv_state.questionsAsked:
            conv_state.collectedData["urgencia"] = "atrasada"
    elif any(word in user_lower for word in ["vence", "próximo", "breve"]):
        if "urgencia" not in conv_state.questionsAsked:
            conv_state.collectedData["urgencia"] = "vence_em_breve"
    
    # Extract deadline
    days_match = re.search(r'(\d+)\s*(dias?|semanas?|meses?)', user_lower)
    if days_match and "prazo" not in conv_state.questionsAsked:
        num = int(days_match.group(1))
        unit = days_match.group(2).lower()
        
        if 'dia' in unit:
            conv_state.collectedData["prazo"] = max(1, num // 30)
        elif 'semana' in unit:
            conv_state.collectedData["prazo"] = max(1, (num * 7) // 30)
        else:
            conv_state.collectedData["prazo"] = num
        
        state.prazoAlvoMeses = conv_state.collectedData["prazo"]
    
    # Check if data is complete
    has_debt = conv_state.collectedData.get("totalDivida") is not None
    has_urgency = conv_state.collectedData.get("urgencia") is not None
    has_prazo = conv_state.collectedData.get("prazo") is not None
    
    conv_state.dataComplete = has_debt and has_urgency and has_prazo
    
    # Build response based on missing data
    response = None
    
    if not has_debt and "totalDivida" not in conv_state.questionsAsked:
        response = "Qual é o valor total da dívida?"
        conv_state.questionsAsked.append("totalDivida")
    elif not has_urgency and "urgencia" not in conv_state.questionsAsked:
        response = "Essa dívida está atrasada ou vence em breve?"
        conv_state.questionsAsked.append("urgencia")
    elif not has_prazo and "prazo" not in conv_state.questionsAsked:
        response = "Em quanto tempo você quer quitar? (ex: 6 meses)"
        conv_state.questionsAsked.append("prazo")
    elif conv_state.dataComplete and not conv_state.readyToExecute:
        # Data complete, calculate and prepare to execute
        conv_state.readyToExecute = True
        
        # Calculate rhythm
        state.faseAtual = 3
        state.focoAtual = "Calcular ritmo"
        state.ritmoMensal = state.totalDivida / state.prazoAlvoMeses
        state.ritmoDiario = state.ritmoMensal / 30
        
        response = f"Pronto! Dados completos:\n- Dívida: R$ {state.totalDivida:.2f}\n- Prazo: {state.prazoAlvoMeses} meses\n- Ritmo mensal: R$ {state.ritmoMensal:.2f}\n- Ritmo diário: R$ {state.ritmoDiario:.2f}\n\nVou atualizar seu Financeiro."
        
    elif conv_state.readyToExecute and not conv_state.executed:
        # Execute and finalize
        state.faseAtual = 4
        state.focoAtual = "Executar e repetir"
        conv_state.executed = True
        
        response = "Financeiro atualizado! Meta definida. Deseja analisar outra área?"
    
    # Save states
    save_conversation_state(conv_state)
    save_financeiro(state)
    
    return state, response


def build_context_messages(memory: Memory, user_message: str, context: Optional[dict], financeiro: FinanceiroState) -> List[Dict[str, str]]:
    """Build messages array with full context including financial state."""
    messages = []
    
    # Core LifeOS system prompt - NO JSON VISIBLE TO USER
    system_core = (
        "Você é o LifeOS, um assistente de vida pessoal integrado e inteligente.\n"
        "REGRA FUNDAMENTAL: Tudo no LifeOS é controlado via conversa com você. "
        "As abas (Tarefas, Rotina, Calendário, Financeiro) apenas EXIBEM o que você decide. "
        "O usuário NÃO pode editar manualmente.\n\n"
        "TOME DECISÕES INTELIGENTES:\n"
        "1. Leia o estado atual do usuário\n"
        "2. Faça NO MÁXIMO UMA pergunta por mensagem\n"
        "3. Responda em linguagem natural e amigável\n"
        "4. Nunca mostre JSON, código ou estruturas internas\n"
        "5. Quando identificar intenção clara, execute internamente sem pedir confirmação\n"
        "6. Seja firme mas humano - não robótico\n\n"
        "ESTRATÉGIA FINANCEIRA (5 FASES):\n"
        "- Fase 1: Parar sangria (identificar urgência)\n"
        "- Fase 2: Definir valor total e prazo\n"
        "- Fase 3: Calcular ritmo mensal/diário\n"
        "- Fase 4: Executar e acompanhar\n"
        "- Fase 5: Dívida zerada\n"
        "Progrida nas fases conforme o usuário compartilha informações.\n"
    )
    
    # Compose system context including app state
    system_parts: List[str] = [system_core]
    
    if memory.summary:
        system_parts.append(f"Contexto da conversa: {memory.summary}")

    # Financial context
    if financeiro.faseAtual or financeiro.totalDivida or financeiro.focoAtual:
        fin_parts = []
        if financeiro.faseAtual:
            fin_parts.append(f"Fase: {financeiro.faseAtual}")
        if financeiro.totalDivida is not None:
            fin_parts.append(f"Dívida total: R$ {financeiro.totalDivida:.2f}")
        if financeiro.prazoAlvoMeses is not None:
            fin_parts.append(f"Prazo: {financeiro.prazoAlvoMeses} meses")
        if financeiro.ritmoMensal is not None:
            fin_parts.append(f"Ritmo mensal: R$ {financeiro.ritmoMensal:.2f}")
        if financeiro.ritmoDiario is not None:
            fin_parts.append(f"Ritmo diário: R$ {financeiro.ritmoDiario:.2f}")
        if financeiro.focoAtual:
            fin_parts.append(f"Foco: {financeiro.focoAtual}")
        system_parts.append(f"ESTRATÉGIA FINANCEIRA ATIVA: {'; '.join(fin_parts)}")
    else:
        system_parts.append("FINANCEIRO: Nenhuma estratégia definida ainda.")

    # Tasks, routines, calendar context
    if context:
        rotina_list = context.get("routines", [])
        tasks = context.get("tasks", [])
        events = context.get("calendar", [])

        rotina_text = (
            "Rotina: vazia" if not rotina_list else f"Rotina: {', '.join([str(x) for x in rotina_list])}"
        )
        task_titles = [t.get("title") for t in tasks if isinstance(t, dict)]
        tasks_text = (
            f"Tarefas: {', '.join([str(x) for x in task_titles])}" if task_titles else "Tarefas: nenhuma"
        )
        event_titles = [e.get("title") for e in events if isinstance(e, dict)]
        cal_text = (
            f"Calendário: {', '.join([str(x) for x in event_titles])}" if event_titles else "Calendário: sem eventos"
        )

        system_parts.append(f"{rotina_text} | {tasks_text} | {cal_text}")

    if system_parts:
        messages.append({"role": "system", "content": "\n\n".join(system_parts)})
    
    for msg in memory.recent_messages[-6:]:
        messages.append(msg)
    
    messages.append({"role": "user", "content": user_message})
    
    return messages


def update_memory(memory: Memory, user_message: str, ai_reply: str) -> None:
    """Update memory with new interaction."""
    memory.recent_messages.append({"role": "user", "content": user_message})
    memory.recent_messages.append({"role": "assistant", "content": ai_reply})
    
    if len(memory.recent_messages) > MAX_RECENT_MESSAGES:
        memory.recent_messages = memory.recent_messages[-MAX_RECENT_MESSAGES:]
    
    if len(memory.recent_messages) >= 4:
        facts = []
        if "lifeos" in user_message.lower() or "lifeos" in ai_reply.lower():
            facts.append("trabalhando no projeto LifeOS")
        if any(word in user_message.lower() for word in ["backend", "frontend", "api"]):
            facts.append("desenvolvendo aplicação web")
        if any(word in user_message.lower() for word in ["rápido", "direto", "objetivo"]):
            facts.append("prefere respostas diretas")
        
        if facts and not memory.summary:
            memory.summary = f"Usuário está {', '.join(facts)}."
        elif facts and memory.summary:
            existing_facts = set(memory.summary.lower().split())
            new_facts = [f for f in facts if not any(word in existing_facts for word in f.split())]
            if new_facts:
                memory.summary = memory.summary.rstrip('.') + f", {', '.join(new_facts)}."


def parse_action_from_reply(ai_reply: str, user_message: str, financeiro: FinanceiroState) -> Optional[PendingAction]:
    """Parse AI reply and user message to detect and structure action proposals."""
    import re
    
    user_lower = user_message.lower()
    reply_lower = ai_reply.lower()
    
    print(f"[PARSE_ACTION] user_msg='{user_message[:50]}' reply='{ai_reply[:100]}'")
    
    # Financial actions
    if any(word in user_lower for word in ["dívida", "divida", "financeiro", "devo", "pagar"]) or \
       any(word in reply_lower for word in ["financeiro", "dívida", "registrar no financeiro"]):
        print("[PARSE_ACTION] Detected financial intent")
        
        # Try to extract amount from user message first, then from reply
        for text in [user_lower, reply_lower]:
            amount_match = re.search(r'r?\$?\s*(\d+(?:[.,]\d+)?)', text)
            if amount_match:
                amount_str = amount_match.group(1).replace(',', '.')
                amount = float(amount_str)
                print(f"[PARSE_ACTION] Extracted amount: {amount}")
                
                description = user_message[:100]
                
                return PendingAction(
                    type="financeiro",
                    operation="update",
                    payload={"totalDivida": amount, "description": description},
                    description=f"Registrar dívida de R${amount:.2f}"
                )
    
    # Task actions
    if any(word in user_lower for word in ["tarefa", "fazer", "preciso", "tenho que"]) or \
       "tarefa" in reply_lower:
        print("[PARSE_ACTION] Detected task intent")
        return PendingAction(
            type="tarefa",
            operation="create",
            payload={"title": user_message[:100], "priority": "important"},
            description=f"Criar tarefa: {user_message[:50]}"
        )
    
    # Routine actions
    if any(word in user_lower for word in ["rotina", "acordar", "dormir", "sempre", "todo dia"]) or \
       "rotina" in reply_lower:
        print("[PARSE_ACTION] Detected routine intent")
        return PendingAction(
            type="rotina",
            operation="create",
            payload={"text": user_message[:100]},
            description=f"Registrar na rotina: {user_message[:50]}"
        )
    
    # Calendar actions
    if any(word in user_lower for word in ["reunião", "reuniao", "evento", "compromisso", "amanhã", "hoje"]) or \
       "calendário" in reply_lower or "calendario" in reply_lower:
        print("[PARSE_ACTION] Detected calendar intent")
        return PendingAction(
            type="calendario",
            operation="create",
            payload={"title": user_message[:100]},
            description=f"Criar evento: {user_message[:50]}"
        )
    
    print("[PARSE_ACTION] No action detected")
    return None


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/financeiro", response_model=FinanceiroState)
def get_financeiro_state():
    """Return current financeiro singleton state (read-only)."""
    return load_financeiro()


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Pure AI chat endpoint - intelligent orchestration without showing JSON to user."""
    print("[CHAT] User message:", request.message)
    
    # Load current state
    financeiro_state = load_financeiro()
    
    # Orchestrate financial conversation (if applicable)
    orchestrated_state, fin_response = orchestrate_financeiro(financeiro_state, request.message)
    
    # If financial orchestration provided a response, use it directly
    if fin_response:
        print(f"[ORCHESTRATOR] Using financial response: {fin_response}")
        response = ChatResponse(reply=fin_response, action=None)
        update_memory(load_memory(), request.message, fin_response)
        save_memory(load_memory())
        return response.model_dump()
    
    # Otherwise, call AI for general conversation
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("[ERROR] OPENROUTER_API_KEY not configured in .env")
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY not configured in .env")

    memory = load_memory()

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "LifeOS",
    }

    messages = build_context_messages(memory, request.message, request.context, orchestrated_state)
    payload = {"model": "openai/gpt-4o-mini", "messages": messages}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=30.0)
            resp.raise_for_status()
            data = resp.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if not reply:
                raise HTTPException(status_code=500, detail="Empty response from AI")
            
            update_memory(memory, request.message, reply)
            save_memory(memory)
            
            # For now, never show actions to user (all orchestrated via backend)
            response = ChatResponse(reply=reply.strip(), action=None)
            print(f"[RESPONSE] Returning: action={response.action}")
            result = response.model_dump()
            print(f"[RESPONSE] Serialized: {result}")
            return result
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"OpenRouter error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/action/confirm")
async def confirm_action(action: PendingAction):
    """Execute a confirmed action from user."""
    print(f"[ACTION CONFIRMED] type={action.type} operation={action.operation} payload={action.payload}")
    
    try:
        if action.type == "financeiro":
            state = load_financeiro()
            print(f"[DEBUG] Loaded state: totalDivida={state.totalDivida}")
            
            if action.operation == "update":
                # Update financial data
                if "totalDivida" in action.payload:
                    state.totalDivida = float(action.payload["totalDivida"])
                    print(f"[DEBUG] Updated totalDivida to {state.totalDivida}")
                if "prazoAlvoMeses" in action.payload:
                    state.prazoAlvoMeses = action.payload["prazoAlvoMeses"]
                if "faseAtual" in action.payload:
                    state.faseAtual = action.payload["faseAtual"]
                if "focoAtual" in action.payload:
                    state.focoAtual = action.payload["focoAtual"]
                
                state.ultimaAtualizacao = int(__import__("time").time())
                save_financeiro(state)
                print(f"[DEBUG] Saved financeiro state to file")
                
                # Reload to verify
                state_verify = load_financeiro()
                print(f"[DEBUG] Verification - totalDivida={state_verify.totalDivida}")
                
                return {"status": "success", "message": "Financeiro atualizado."}
        
        elif action.type == "tarefa":
            tasks = load_tasks()
            if action.operation == "create":
                new_task = Task(
                    id=int(__import__("time").time() * 1000),
                    title=action.payload.get("title", "Nova tarefa"),
                    priority=action.payload.get("priority", "important"),
                    done=False
                )
                tasks.append(new_task)
                save_tasks(tasks)
                return {"status": "success", "message": "Tarefa criada."}
            elif action.operation == "delete":
                task_id = action.payload.get("id")
                tasks = [t for t in tasks if t.id != task_id]
                save_tasks(tasks)
                return {"status": "success", "message": "Tarefa removida."}
        
        elif action.type == "rotina":
            if action.operation == "create":
                # Save to routines via db (IndexedDB on frontend will handle)
                # For now, just acknowledge - frontend will handle via context
                return {"status": "success", "message": "Rotina registrada."}
        
        elif action.type == "calendario":
            if action.operation == "create":
                # Save to calendar events
                return {"status": "success", "message": "Evento criado."}
        
        return {"status": "error", "message": "Tipo de ação não suportado"}
    
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao executar ação: {str(e)}")


# ===== Action Execution: Focus on essentials =====
TASKS_FILE = Path("tasks.json")


class Task(BaseModel):
    id: int
    title: str
    done: bool = False
    priority: Optional[str] = None  # "essential" | "important" | "optional"
    deferredToday: Optional[bool] = False


def load_tasks() -> List[Task]:
    if TASKS_FILE.exists():
        try:
            with open(TASKS_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
                # Accept either list of dicts or wrapped object
                if isinstance(raw, dict) and "tasks" in raw:
                    raw_list = raw.get("tasks", [])
                else:
                    raw_list = raw
                return [Task(**t) for t in raw_list if isinstance(t, dict)]
        except Exception:
            pass
    return []


def save_tasks(tasks: List[Task]) -> None:
    try:
        with open(TASKS_FILE, "w", encoding="utf-8") as f:
            json.dump([t.model_dump() for t in tasks], f, ensure_ascii=False, indent=2)
    except Exception:
        pass


def perform_focus_essentials(tasks: List[Task]) -> List[Task]:
    updated: List[Task] = []
    for t in tasks:
        # Non-essential if not explicitly marked essential and not done
        is_non_essential = (t.priority != "essential") and (not t.done)
        if is_non_essential:
            # Simple flag to defer non-essentials for today
            t.deferredToday = True
            # Optionally nudge priority down if set
            if t.priority == "important":
                t.priority = "optional"
        updated.append(t)
    return updated


class ActionRequest(BaseModel):
    type: str


@app.post("/action")
def execute_action(req: ActionRequest):
    if req.type != "FOCUS_ESSENTIALS":
        raise HTTPException(status_code=400, detail="Unsupported action type")

    tasks = load_tasks()
    tasks_updated = perform_focus_essentials(tasks)
    save_tasks(tasks_updated)

    return {"message": "Feito. Ajustei seu foco para hoje."}
