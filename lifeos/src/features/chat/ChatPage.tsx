import { useEffect, useRef, useState } from "react";
import { db, cleanupRoutines } from "../../shared/db";
import { sendMessageToAI, AIResponse } from "../../shared/ai/ai";

type Message = {
  id: string;
  sender: "user" | "lifeos";
  text: string;
  ts: number;
  kind?: "conversation" | "suggestion" | "action_proposal";
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", sender: "lifeos", text: "Olá! Como posso ajudar hoje?", ts: Date.now() - 60000 },
  ]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  function classifyAIText(text: string): "conversation" | "suggestion" | "action_proposal" {
    const t = text.toLowerCase();
    const hasConfirm = t.includes("deseja confirmar?") || t.includes("quer que eu faça isso?");
    const hasExplicitActionVerb = /(apagar|excluir|remover|alterar|ajustar|executar|limpar|criar|mover)/.test(t);
    const hasObjectTarget = /(registros|tarefas|rotina|prioridade|data|hoje)/.test(t);
    const isSuggestive = /(posso|poderia|sugiro|talvez|vamos)/.test(t);

    if (hasConfirm && hasExplicitActionVerb && hasObjectTarget) return "action_proposal";
    if (isSuggestive) return "suggestion";
    return "conversation";
  }

  useEffect(() => {
    // scroll to bottom when messages change
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Automatic cleanup of routine noise
    (async () => {
      try { await cleanupRoutines(); } catch {}
    })();
  }, []);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: `u-${Date.now()}`, sender: "user", text: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setText("");

    try {
      // Build local context: rotina (hoje), tarefas (abertas), calendário (hoje)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const rotinaToday = await db.routines.where("date").between(start, end).and(r => r.origin === "manual" || r.confirmed === true).toArray();
      const rotinaList = rotinaToday.map(r => r.text).filter(Boolean);

      const allTasks = await db.tasks.toArray();
      const openTasks = allTasks.filter(t => !t.done).map(t => ({ id: t.id, title: t.title, priority: t.priority }));

      const eventsToday = await db.calendar.where("date").equals(todayStr).toArray();
      const calendarList = eventsToday.map(e => ({ id: e.id, title: e.title, time: e.time }));

      const context = {
        routines: rotinaList,
        tasks: openTasks,
        calendar: calendarList,
      };

      const aiRes: AIResponse = await sendMessageToAI(trimmed, context);
      const kind = classifyAIText(aiRes.reply);
      const reply: Message = {
        id: `l-${Date.now()}`,
        sender: "lifeos",
        text: aiRes.reply,
        ts: Date.now(),
        kind,
      };
      setMessages((m) => [...m, reply]);
      // Nunca mostrar botões para perguntas do usuário ou sugestões genéricas.
    } catch (err) {
      const reply: Message = {
        id: `l-${Date.now()}`,
        sender: "lifeos",
        text: "IA temporariamente indisponível. Verifique se o backend está rodando.",
        ts: Date.now(),
      };
      setMessages((m) => [...m, reply]);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="page-container chat-page">
      <div className="card" style={{ maxWidth: 820, margin: "24px auto", padding: 0, display: "flex", flexDirection: "column", height: "72vh" }}>
        <div style={{ padding: 18, borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          <h1>Chat</h1>
          <p className="subtitle">Converse com o LifeOS</p>
        </div>

        <div ref={listRef} className="messages-list" style={{ padding: 18, overflowY: "auto", flex: 1 }}>
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.sender === "user" ? "user" : "system"}`}> 
              <div className="bubble">{m.text}</div>
              <div className="msg-ts">{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}

          {/* Mostrar botões somente quando a última mensagem da IA for uma proposta explícita */}
          {messages.length > 0 && messages[messages.length - 1].sender === "lifeos" && messages[messages.length - 1].kind === "action_proposal" && (
            <div className="action-confirm" style={{ marginTop: 12, padding: 12, border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 8 }}>
              <div style={{ marginBottom: 10 }}>
                <strong>Confirmação de ação</strong>
                <div style={{ color: "#555", marginTop: 6 }}>A IA descreveu uma ação específica. Deseja confirmar?</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={async () => {
                    // Register the last meaningful user message as routine, with explicit confirmation
                    const lastUser = [...messages].reverse().find(m => m.sender === "user");
                    const candidate = (lastUser?.text || "").trim();
                    if (candidate && candidate.length >= 4) {
                      try {
                        await db.routines.add({
                          id: Date.now(),
                          text: candidate,
                          date: Date.now(),
                          origin: "chat",
                          confirmed: true,
                        });
                        const reply: Message = {
                          id: `l-${Date.now()}`,
                          sender: "lifeos",
                          text: "Confirmado. Registrei na sua rotina.",
                          ts: Date.now(),
                        };
                        setMessages((m) => [...m, reply]);
                      } catch {
                        const reply: Message = {
                          id: `l-${Date.now()}`,
                          sender: "lifeos",
                          text: "Não foi possível registrar sua rotina agora.",
                          ts: Date.now(),
                        };
                        setMessages((m) => [...m, reply]);
                      }
                    } else {
                      const reply: Message = {
                        id: `l-${Date.now()}`,
                        sender: "lifeos",
                        text: "Texto insuficiente para registrar uma rotina.",
                        ts: Date.now(),
                      };
                      setMessages((m) => [...m, reply]);
                    }
                  }}
                >Confirmar</button>
                <button
                  onClick={() => {
                    const reply: Message = {
                      id: `l-${Date.now()}`,
                      sender: "lifeos",
                      text: "Entendido. Ação cancelada.",
                      ts: Date.now(),
                    };
                    setMessages((m) => [...m, reply]);
                  }}
                >Cancelar</button>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-bar" style={{ padding: 14, borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} placeholder="Digite uma mensagem..." />
            <button onClick={sendMessage} disabled={!text.trim()}>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
