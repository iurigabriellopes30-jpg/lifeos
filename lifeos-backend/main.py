from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEMORY_FILE = Path("memory.json")
MAX_RECENT_MESSAGES = 10


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class ActionSuggestion(BaseModel):
    type: str
    label: str


class ChatResponse(BaseModel):
    reply: str
    action: Optional[ActionSuggestion] = None


class Memory(BaseModel):
    summary: str = ""
    recent_messages: List[Dict[str, str]] = []


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


def build_context_messages(memory: Memory, user_message: str, context: Optional[dict]) -> List[Dict[str, str]]:
    """Build messages array with context from memory."""
    messages = []
    
    # Compose system context including app state
    system_parts: List[str] = []
    if memory.summary:
        system_parts.append(f"Contexto da conversa: {memory.summary}")

    if context:
        rotina_list = context.get("routines", [])
        tasks = context.get("tasks", [])
        events = context.get("calendar", [])

        rotina_text = (
            "Você não possui rotinas cadastradas." if not rotina_list else "Rotina atual: " + ", ".join([str(x) for x in rotina_list])
        )
        task_titles = [t.get("title") for t in tasks if isinstance(t, dict)]
        tasks_text = (
            f"Tarefas: {', '.join([str(x) for x in task_titles])}" if task_titles else "Tarefas: nenhuma registrada."
        )
        event_titles = [e.get("title") for e in events if isinstance(e, dict)]
        cal_text = (
            f"Calendário: {', '.join([str(x) for x in event_titles])}" if event_titles else "Calendário: sem eventos."
        )

        rules = (
            "Responda somente com base nesses dados locais. "
            "Se o usuário perguntar pela rotina e ela estiver vazia, responda literalmente: 'Sua rotina está vazia no momento.'. "
            "Não peça informações que já estão no sistema e não sugira ações automaticamente."
        )

        system_parts.append(f"{rotina_text}\n{tasks_text}\n{cal_text}\n{rules}")

    if system_parts:
        messages.append({"role": "system", "content": "\n".join(system_parts)})
    
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


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    api_key = os.getenv("OPENROUTER_API_KEY")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    memory = load_memory()
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "LifeOS",
    }
    
    messages = build_context_messages(memory, request.message, request.context)
    
    payload = {
        "model": "openai/gpt-4o-mini",
        "messages": messages,
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            
            if not reply:
                raise HTTPException(status_code=500, detail="Empty response from AI")
            
            update_memory(memory, request.message, reply)
            save_memory(memory)

            # Suggest a single actionable option with explicit confirmation flow
            action = ActionSuggestion(type="FOCUS_ESSENTIALS", label="Focar no essencial hoje")
            return ChatResponse(reply=reply.strip(), action=action)
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"OpenRouter error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


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
