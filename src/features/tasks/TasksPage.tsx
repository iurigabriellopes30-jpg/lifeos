import { useEffect, useState } from "react";
import { db, Task } from "../../shared/db";

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
      <h1>Tasks</h1>
      <p className="subtitle">Este item é gerenciado pelo LifeOS no chat.</p>

      {tasks.length === 0 && (
        <p className="empty">Nenhuma task ainda.</p>
      )}

      {tasks.map((task) => (
        <div key={task.id} className="item-row" style={{ pointerEvents: 'none', opacity: 0.7 }}>
          <input
            type="checkbox"
            checked={task.done}
            readOnly
          />
          <span className={task.done ? "done" : ""}>{task.title}</span>
        </div>
      ))}
    </div>
  );
}
