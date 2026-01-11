import { useEffect, useRef, useState } from "react";
import { db, cleanupRoutines } from "../../shared/db";
import { sendMessageToAI, AIResponse } from "../../shared/ai/ai";

type PendingAction = {
  type: string;
  operation: string;
  payload: any;
  description: string;
};

type Message = {
  id: string;
  sender: "user" | "lifeos";
  text: string;
  ts: number;
  pendingAction?: PendingAction;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", sender: "lifeos", text: "Olá! Como posso ajudar hoje?", ts: Date.now() - 60000 },
  ]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

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
      
      // Only display reply text - no actions shown to user (all backend orchestrated)
      console.log("[CHAT] AI Response:", JSON.stringify(aiRes));
      
      const reply: Message = {
        id: `l-${Date.now()}`,
        sender: "lifeos",
        text: aiRes.reply,
        ts: Date.now(),
      };
      setMessages((m) => [...m, reply]);
    } catch (err) {
      console.error("[CHAT] Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const reply: Message = {
        id: `l-${Date.now()}`,
        sender: "lifeos",
        text: `Erro ao conectar com backend: ${errorMsg}`,
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
            <div key={m.id}>
              <div className={`message ${m.sender === "user" ? "user" : "system"}`}> 
                <div className="bubble">{m.text}</div>
                <div className="msg-ts">{new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          ))}
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
