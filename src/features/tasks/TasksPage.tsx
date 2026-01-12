import { useEffect, useState } from "react";
import { db, Task } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  async function loadTasks() {
    const data = await db.tasks.toArray();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="card">
      <h1>Tarefas</h1>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Este item é gerenciado pelo LifeOS no chat.
      </p>

      {tasks.length === 0 && (
        <p className="empty">Nenhuma task ainda.</p>
      )}

      {tasks.map((task) => (
        <ItemRow
          key={task.id}
          label={task.title}
          checked={task.done}
          onToggle={() => {}}
          onDelete={() => {}}
        />
      ))}
    </div>
  );
}
