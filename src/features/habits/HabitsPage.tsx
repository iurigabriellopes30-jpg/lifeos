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

  return (
    <div className="card">
      <h1>Hábitos</h1>
      <p className="subtitle">Este item é gerenciado pelo LifeOS no chat.</p>

      {habits.length === 0 && (
        <p className="empty">Nenhum hábito ainda.</p>
      )}

      {habits.map((habit) => (
        <div key={habit.id} className="item-row" style={{ pointerEvents: 'none', opacity: 0.7 }}>
          <input
            type="checkbox"
            checked={habit.done}
            readOnly
          />
          <span className={habit.done ? "done" : ""}>{habit.title}</span>
        </div>
      ))}
    </div>
  );
}
