import { useEffect, useState } from "react";
import { db, Habit } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";

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

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Este item é gerenciado pelo LifeOS no chat.
      </p>

      {habits.length === 0 && (
        <p className="empty">Nenhum hábito ainda.</p>
      )}

      {habits.map((habit) => (
        <ItemRow
          key={habit.id}
          label={habit.title}
          checked={habit.done}
          onToggle={() => {}}
          onDelete={() => {}}
        />
      ))}
    </div>
  );
}
