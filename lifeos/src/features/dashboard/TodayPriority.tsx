import { useEffect, useRef, useState } from "react";

export default function TodayPriority() {
  const [highlight, setHighlight] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onFocusPriority() {
      setHighlight(true);
      btnRef.current?.focus();
      const t = setTimeout(() => setHighlight(false), 1400);
      return () => clearTimeout(t);
    }

    function handler() {
      onFocusPriority();
    }

    window.addEventListener("app:focusPriority", handler as EventListener);
    return () => window.removeEventListener("app:focusPriority", handler as EventListener);
  }, []);

  return (
    <div className={`dashboard-card priority-card ${highlight ? "highlight" : ""}`}>
      <h3>Prioridade de hoje</h3>
      <p className="empty">Nenhuma prioridade definida.</p>
      <div style={{ marginTop: 12 }}>
        <button ref={btnRef}>Definir prioridade</button>
      </div>
    </div>
  );
}
