import { useEffect, useState } from "react";
import { db, Habit } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";
import { useToast } from "../../shared/useToast";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [title, setTitle] = useState("");
  const isDisabled = !title.trim();

  const toast = useToast();

  async function loadHabits() {
    const data = await db.habits.toArray();
    setHabits(data);
  }

  useEffect(() => {
    loadHabits();
  }, []);

  async function addHabit() {
    if (isDisabled) return;

    await db.habits.add({
      id: Date.now(),
      title: title.trim(),
      done: false,
    });

    setTitle("");
    loadHabits();
    toast.showToast("Hábito adicionado ✅");
  }

  async function toggleHabit(habit: Habit) {
    await db.habits.update(habit.id, {
      done: !habit.done,
    });
    loadHabits();
  }

  async function removeHabit(id: number) {
    await db.habits.delete(id);
    loadHabits();
    toast.showToast("Hábito removido 🗑️", "error");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      addHabit();
    }
  }

  return (
    <div className="card">
      <h1>Habits</h1>

      <div className="input-row">
        <input
          placeholder="Novo hábito..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button disabled={isDisabled} onClick={addHabit}>
          Adicionar
        </button>
      </div>

      {habits.length === 0 && (
        <p className="empty">Nenhum hábito ainda.</p>
      )}

      {habits.map((habit) => (
        <ItemRow
          key={habit.id}
          label={habit.title}
          checked={habit.done}
          onToggle={() => toggleHabit(habit)}
          onDelete={() => removeHabit(habit.id)}
        />
      ))}
    </div>
  );
}
