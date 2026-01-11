import { useEffect, useState } from "react";
import { db, Habit } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";
import { useToast } from "../../shared/useToast";

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isSameDay(ts: number) {
  const now = new Date();
  return startOfDay(ts) === startOfDay(now.getTime());
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const isDisabled = !title.trim();

  const toast = useToast();

  async function loadHabits() {
    const data = await db.habits.toArray();
    setHabits(data);

    // registros automáticos removidos do UI
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function addHabit() {
    if (isDisabled) return;

    const now = Date.now();

    await db.habits.add({
      id: now,
      title: title.trim(),
      done: false,
      frequency,
      createdAt: now,
      scheduledWeekday: frequency === "weekly" ? new Date().getDay() : undefined,
    });

    setTitle("");
    setFrequency("daily");
    loadHabits();
    toast.showToast("Registro adicionado ✅");
  }

  async function toggleHabit(habit: Habit) {
    const now = Date.now();
    // determine if habit is done today
    const doneToday = habit.lastDoneAt ? isSameDay(habit.lastDoneAt) : false;

    if (doneToday) {
      await db.habits.update(habit.id, { lastDoneAt: undefined, done: false });
    } else {
      await db.habits.update(habit.id, { lastDoneAt: now, done: true });
    }

    loadHabits();
  }

  async function removeHabit(id: number) {
    await db.habits.delete(id);
    loadHabits();
    toast.showToast("Registro removido 🗑️", "error");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      addHabit();
    }
  }

  // compute today's habits
  const today = new Date();
  const weekday = today.getDay();

  const todayHabits = habits.filter((h) => {
    const freq = h.frequency ?? "daily";
    if (freq === "daily") return true;
    if (freq === "weekly") return h.scheduledWeekday === weekday;
    return true;
  });

  // at risk: daily not done in last 48h, weekly not done in last 14 days
  const now = Date.now();
  const habitsAtRisk = habits.filter((h) => {
    const freq = h.frequency ?? "daily";
    const last = h.lastDoneAt ?? 0;
    if (freq === "daily") return now - last > 48 * 60 * 60 * 1000; // >48h
    if (freq === "weekly") return now - last > 14 * 24 * 60 * 60 * 1000; // >14 days
    return false;
  });

  return (
    <div className="page-container">
      <div className="card">
        <h1>Rotina</h1>
        <p className="subtitle">Registros observados pelo LifeOS</p>

      {/* HOJE */}
      <section className="habits-section today">
        <h2>HOJE</h2>

        {todayHabits.length === 0 ? (
          <p className="empty">Nenhum registro para hoje.</p>
        ) : (
          <div className="list">
            {todayHabits.map((habit) => (
              <div className="item-row" key={habit.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{habit.title}</div>
                    <div className="subtitle" style={{ marginTop: 4, fontWeight: 500 }}>
                      {habit.lastDoneAt ? `Última observação: ${new Date(habit.lastDoneAt).toLocaleDateString()}` : "Sem registro recente"}
                    </div>
                  </div>
                </div>

                <button className="remove-btn" onClick={() => removeHabit(habit.id)}>Remover</button>
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
              <div key={habit.id} className="item-row habit-risk">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 16 }}>⚠️</div>
                  <div>{habit.title}</div>
                </div>

                <button className="remove-btn" onClick={() => removeHabit(habit.id)}>Remover</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Registros automáticos removidos */}

      {/* criação no final da página */}
      <div style={{ marginTop: 18 }} className="card">
        <h3>+ Novo hábito</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            placeholder="Qual hábito você quer criar?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="frequency-select" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label>
              <input type="radio" name="frequency" value="daily" checked={frequency === "daily"} onChange={() => setFrequency("daily")} />{' '}
              <strong>Diário</strong>
            </label>

            <label>
              <input type="radio" name="frequency" value="weekly" checked={frequency === "weekly"} onChange={() => setFrequency("weekly")} />{' '}
              Semanal
            </label>
          </div>

          <div>
            <button disabled={isDisabled} onClick={addHabit}>
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
