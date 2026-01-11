import { useEffect, useState } from "react";
import { db, Habit } from "../../shared/db";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);

  async function loadHabits() {
    const data = await db.habits.toArray();
    setHabits(data);
  }

  useEffect(() => {
    loadHabits();
  }, []);
  const today = new Date();
  const weekday = today.getDay();

  const todayHabits = habits.filter((h) => {
    const freq = h.frequency ?? "daily";
    if (freq === "daily") return true;
    if (freq === "weekly") return h.scheduledWeekday === weekday;
    return true;
  });

  const now = Date.now();
  const habitsAtRisk = habits.filter((h) => {
    const freq = h.frequency ?? "daily";
    const last = h.lastDoneAt ?? 0;
    if (freq === "daily") return now - last > 48 * 60 * 60 * 1000;
    if (freq === "weekly") return now - last > 14 * 24 * 60 * 60 * 1000;
    return false;
  });

  return (
    <div className="page-container">
      <div className="card">
        <h1>Rotina</h1>
        <p className="subtitle">Registros observados pelo LifeOS</p>

        {/* AVISO DE MODO EXECUÇÃO */}
        <div style={{
          padding: "16px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          marginBottom: "24px",
          color: "#856404",
          fontWeight: 600
        }}>
          ⚠️ A rotina é registrada automaticamente pelo LifeOS via Chat.
        </div>

      {/* HOJE */}
      <section className="habits-section today">
        <h2>HOJE</h2>

        {todayHabits.length === 0 ? (
          <p className="empty">Nenhum registro para hoje.</p>
        ) : (
          <div className="list">
            {todayHabits.map((habit) => (
              <div key={habit.id} style={{
                padding: "12px",
                background: "#f8f9fa",
                borderRadius: "6px",
                marginBottom: "8px"
              }}>
                <div style={{ fontWeight: 600 }}>{habit.title}</div>
                <div style={{ marginTop: 4, fontSize: "14px", color: "#666" }}>
                  {habit.lastDoneAt ? `Última observação: ${new Date(habit.lastDoneAt).toLocaleDateString()}` : "Sem registro recente"}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* EM RISCO */}
      <section className="habits-section at-risk">
        <h2>EM RISCO ⚠️</h2>

        {habitsAtRisk.length === 0 ? (
          <p className="empty">Nenhuma rotina em risco.</p>
        ) : (
          <div className="list">
            {habitsAtRisk.map((habit) => (
              <div key={habit.id} style={{
                padding: "12px",
                background: "#fff3cd",
                borderRadius: "6px",
                marginBottom: "8px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚠️</span>
                  <span style={{ fontWeight: 600 }}>{habit.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
