import { useEffect, useState } from "react";
import { db, Task } from "../../shared/db";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [optionalOpen, setOptionalOpen] = useState(false);

  async function loadTasks() {
    const data = await db.tasks.toArray();
    setTasks(data);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const essentialTasks = tasks.filter((t) => !t.done && ((t.priority as any) === undefined ? true : t.priority === "essential"));
  const importantTasks = tasks.filter((t) => !t.done && t.priority === "important");
  const optionalTasks = tasks.filter((t) => !t.done && t.priority === "optional");

  return (
    <div className="page-container">
      <div className="card">
        <h1>Tarefas</h1>
        <p className="subtitle">Organize o que realmente importa hoje</p>

        <div style={{
          padding: "16px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          marginBottom: "24px",
          color: "#856404",
          fontWeight: 600
        }}>
          ⚠️ As tarefas são gerenciadas pelo LifeOS. Use o Chat para alterar.
        </div>

        <section className="tasks-section essential">
          <h2>ESSENCIAL</h2>
          {essentialTasks.length === 0 ? (
            <p className="empty">Nenhuma tarefa essencial no momento.</p>
          ) : (
            <div className="list">
              {essentialTasks.map((task) => (
                <div key={task.id} style={{
                  padding: "12px",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  marginBottom: "8px"
                }}>
                  <div style={{ fontWeight: 600 }}>{task.title}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="tasks-section important">
          <h2>IMPORTANTE</h2>
          {importantTasks.length === 0 ? (
            <p className="empty">Nenhuma tarefa importante.</p>
          ) : (
            <div className="list">
              {importantTasks.map((task) => (
                <div key={task.id} style={{
                  padding: "12px",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  marginBottom: "8px"
                }}>
                  <div style={{ fontWeight: 600 }}>{task.title}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`tasks-section optional ${optionalOpen ? "open" : ""}`}>
          <div className="optional-header">
            <h2>OPCIONAL</h2>
            <button className="toggle-optional" onClick={() => setOptionalOpen((s) => !s)} aria-expanded={optionalOpen}>
              {optionalOpen ? "⬇️" : "➡️"}
            </button>
          </div>

          {optionalOpen && (
            <div>
              {optionalTasks.length === 0 ? (
                <p className="empty">Nenhuma tarefa opcional.</p>
              ) : (
                <div className="list">
                  {optionalTasks.map((task) => (
                    <div key={task.id} style={{
                      padding: "12px",
                      background: "#f8f9fa",
                      borderRadius: "6px",
                      marginBottom: "8px"
                    }}>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
