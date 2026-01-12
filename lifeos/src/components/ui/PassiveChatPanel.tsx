import { useEffect, useState } from "react";
import { getDailyInsights, DailyInsights } from "../../shared/insights";
import { getTone } from "../../shared/tone";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PassiveChatPanel({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<DailyInsights | null>(null);

  const [conversation, setConversation] = useState<Array<{ from: "life" | "user"; text: string }>>([
    { from: "life", text: "Avaliando…" },
  ]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const ins = await getDailyInsights();
        if (!mounted) return;
        setInsights(ins);
        // replace the initial message with a real one
        setConversation([{ from: "life", text: formatMessage(ins, getTone()) }]);
      } catch (e) {
        if (!mounted) return;
        setConversation([{ from: "life", text: "Não foi possível avaliar seus dados agora." }]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (open) {
      // always ensure there's at least one message
      setConversation([{ from: "life", text: "Avaliando…" }]);
      load();

      // react to tone changes while open
      function onTone(e: Event) {
        const detail = (e as CustomEvent).detail as string;
        setConversation((prev) => {
          if (!insights) return prev;
          // update last life message to new tone
          const newMsg = formatMessage(insights, detail);
          const copy = [...prev];
          // find last life message index
          const li = copy.map((c) => c.from).lastIndexOf("life");
          if (li >= 0) copy[li] = { from: "life", text: newMsg };
          return copy;
        });
      }

      window.addEventListener("toneChange", onTone as EventListener);

      return () => {
        mounted = false;
        window.removeEventListener("toneChange", onTone as EventListener);
      };
    } else {
      setConversation([{ from: "life", text: "Avaliando…" }]);
      setLoading(false);
      setInsights(null);
      setQuery("");
    }

    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    // push user message
    setConversation((prev) => [...prev, { from: "user", text: q }]);
    setQuery("");

    // handle only predefined questions
    handleQuery(q.toLowerCase());
  }

  async function handleQuery(q: string) {
    // ensure we have insights
    let ins = insights;
    if (!ins) {
      setLoading(true);
      try {
        ins = await getDailyInsights();
        setInsights(ins);
      } catch (e) {
        setConversation((prev) => [...prev, { from: "life", text: "Desculpe, não consegui acessar os dados." }]);
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    const tone = getTone();

    // simple matching
    if (/foco|prioridad(e|em)/.test(q)) {
      const text = ins.hasPriorityToday
        ? tone === "direct"
          ? "Há prioridade definida para hoje."
          : tone === "calm"
          ? "Existe uma prioridade para hoje — considere focar nela com calma."
          : "Existe uma prioridade para hoje."
        : tone === "direct"
        ? "Nenhuma prioridade definida hoje."
        : tone === "calm"
        ? "Nenhuma prioridade definida hoje — siga tranquilo."
        : "Nenhuma prioridade definida hoje.";

      setConversation((prev) => [...prev, { from: "life", text }] );
      return;
    }

    if (/carga|agenda|calend(a|ário)/.test(q)) {
      const text = ins.calendarLoad === "heavy"
        ? tone === "direct"
          ? "Dia carregado no calendário."
          : tone === "calm"
          ? "Seu calendário está carregado hoje. Lembre-se de pequenas pausas."
          : "Dia com carga alta no calendário."
        : ins.calendarLoad === "light"
        ? "Calendário leve hoje."
        : "Carga do dia balanceada.";

      setConversation((prev) => [...prev, { from: "life", text }] );
      return;
    }

    if (/pend|atrasad|tarefa/.test(q)) {
      const n = ins.overdueTasksCount;
      const text = n > 0
        ? tone === "direct"
          ? `${n} tarefa(s) em atraso.`
          : tone === "calm"
          ? `Há ${n} tarefa(s) em atraso. Talvez priorizar uma ou duas ajude.`
          : `${n} tarefa(s) em atraso.`
        : "Nenhuma tarefa em atraso.";

      setConversation((prev) => [...prev, { from: "life", text }] );
      return;
    }

    // not recognized
    setConversation((prev) => [...prev, { from: "life", text: "Desculpe, não entendi. Tente: foco do dia, carga do dia, pendências." }] );
  }

  return (
    <div className="card passive-chat-panel" role="dialog" aria-label="Painel do Life">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20 }}>💬</div>
          <div>
            <strong>Life</strong>
            <div className="subtitle" style={{ marginTop: 2 }}>Observando</div>
          </div>
        </div>

        <button onClick={onClose} aria-label="Fechar" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18 }}>
          ✕
        </button>
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="passive-message">
          {/* conversation */}
          <div className="passive-conversation">
            {conversation.map((c, i) => (
              <div key={i} className={`passive-msg ${c.from === "user" ? "user-msg" : "life-msg"}`}>
                <div className="passive-msg-text">{c.text}</div>
              </div>
            ))}
          </div>

          {/* Suggested actions (max 2) */}
          <div style={{ marginTop: 12 }}>
            <div className="passive-actions">
              {renderActions()}
            </div>
          </div>

          {/* guided input */}
          <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input aria-label="Perguntar ao Life" placeholder="Pergunte (ex: foco do dia)" value={query} onChange={(e) => setQuery(e.target.value)} className="passive-input" />
            <button type="submit" className="passive-action-btn">Perguntar</button>
          </form>
        </div>
      </div>
    </div>
  );

  function renderActions() {
    if (!insights) return null;

    const actions: Array<{ key: string; label: string; onClick: () => void }> = [];

    // Prioritize overdue tasks
    if (insights.overdueTasksCount > 0) {
      actions.push({ key: "tasks", label: "Ir para Tasks", onClick: () => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "tasks" })) });
    }

    // Suggest setting priority only if there's no priority today
    if (!insights.hasPriorityToday) {
      actions.push({ key: "priority", label: "Definir prioridade do dia", onClick: () => window.dispatchEvent(new CustomEvent("app:focusPriority")) });
    }

    // Calendar heavy
    if (insights.calendarLoad === "heavy") {
      actions.push({ key: "calendar", label: "Ver agenda de hoje", onClick: () => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "calendar" })) });
    }

    // Rotina at risk
    if (insights.habitsAtRisk > 0) {
      actions.push({ key: "habits", label: "Ir para Rotina", onClick: () => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "habits" })) });
    }

    // limit to 2 actions
    const picked = actions.slice(0, 2);

    return picked.map((a) => (
      <button key={a.key} className="passive-action-btn" onClick={a.onClick}>
        {a.label}
      </button>
    ));
  }
}

function formatMessage(insights: any, tone: string) {
  // Prioritize the most relevant insight and keep message short
  if (insights.overdueTasksCount > 0) {
    const n = insights.overdueTasksCount;
    if (tone === "calm") return `${n} tarefa(s) atrasada(s). Considere priorizar com calma.`;
    if (tone === "direct") return `${n} tarefa(s) atrasada(s). Priorize agora.`;
    return `${n} tarefa(s) atrasada(s) — pode ser bom focar nelas hoje.`;
  }

  if (insights.habitsAtRisk > 0) {
    const n = insights.habitsAtRisk;
    if (tone === "calm") return `${n} item(s) da rotina em risco. Um pequeno ajuste já ajuda.`;
    if (tone === "direct") return `${n} item(s) da rotina em risco.`;
    return `${n} item(s) da rotina em risco — atenção leve.`;
  }

  if (insights.calendarLoad === "heavy") {
    if (tone === "calm") return `Hoje está carregado no calendário. Planeje pausas curtas.`;
    if (tone === "direct") return `Dia carregado no calendário.`;
    return `Dia com muita carga no calendário.`;
  }

  // default
  if (tone === "calm") return `Tudo equilibrado — mantenha o ritmo.`;
  if (tone === "direct") return `Nenhuma atenção imediata necessária.`;
  return `Tudo equilibrado hoje.`;
}