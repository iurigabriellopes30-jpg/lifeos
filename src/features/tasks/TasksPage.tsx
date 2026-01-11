import { useEffect, useState } from "react";
import { db, Task } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";
import { useToast } from "../../shared/useToast";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const isDisabled = !title.trim();

  const toast = useToast();

  async function loadTasks() {
    const data = await db.tasks.toArray();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function addTask() {
    if (isDisabled) return;

    await db.tasks.add({
      id: Date.now(),
      title: title.trim(),
      done: false,
    });

    setTitle("");
    loadTasks();
    toast.showToast("Task adicionada ✅");
  }

  async function toggleTask(task: Task) {
    await db.tasks.update(task.id, { done: !task.done });
    loadTasks();
  }

  async function deleteTask(id: number) {
    await db.tasks.delete(id);
    loadTasks();
    toast.showToast("Task removida 🗑️", "error");
  }

  return (
    <div className="card">
      <h1>Tasks</h1>

      <div className="input-row">
        <input
          placeholder="Nova task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
        />
        <button disabled={isDisabled} onClick={addTask}>
          Adicionar
        </button>
      </div>

      {tasks.length === 0 && (
        <p className="empty">Nenhuma task ainda.</p>
      )}

      {tasks.map((task) => (
        <ItemRow
          key={task.id}
          label={task.title}
          checked={task.done}
          onToggle={() => toggleTask(task)}
          onDelete={() => deleteTask(task.id)}
        />
      ))}
    </div>
  );
}
