import { useEffect, useState } from "react";
import { db, Task } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";
import { useToast } from "../../shared/useToast";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"essential" | "important" | "optional">("essential");
  const [optionalOpen, setOptionalOpen] = useState(false);
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
      priority,
    });

    setTitle("");
    setPriority("essential");
    loadTasks();
    toast.showToast("Task adicionada ✅");
  }

  async function toggleTask(task: Task) {
    const newDone = !task.done;
    await db.tasks.update(task.id, { done: newDone });
    loadTasks();
    if (newDone) {
      toast.showToast("Task concluída.");
    }
  }

  async function deleteTask(id: number) {
    await db.tasks.delete(id);
    loadTasks();
    toast.showToast("Task removida 🗑️", "error");
  }

  const essentialTasks = tasks.filter((t) => !t.done && ((t.priority as any) === undefined ? true : t.priority === "essential"));
  const importantTasks = tasks.filter((t) => !t.done && t.priority === "important");
  const optionalTasks = tasks.filter((t) => !t.done && t.priority === "optional");

  return (
    <div className="page-container">
      <div className="card">
        <h1>Tasks</h1>
        <p className="subtitle">Organize o que realmente importa hoje</p>

      {/* ESSENCIAL */}
      <section className="tasks-section essential">
        <h2>ESSENCIAL</h2>
        {essentialTasks.length === 0 ? (
          <p className="empty">Nenhuma tarefa essencial no momento.</p>
        ) : (
          <div className="list">
            {essentialTasks.map((task) => (
              <ItemRow
                key={task.id}
                label={task.title}
                checked={task.done}
                onToggle={() => toggleTask(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* IMPORTANTE */}
      <section className="tasks-section important">
        <h2>IMPORTANTE</h2>
        {importantTasks.length === 0 ? (
          <p className="empty">Nenhuma tarefa importante.</p>
        ) : (
          <div className="list">
            {importantTasks.map((task) => (
              <ItemRow
                key={task.id}
                label={task.title}
                checked={task.done}
                onToggle={() => toggleTask(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* OPCIONAL (recolhível) */}
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
                  <ItemRow
                    key={task.id}
                    label={task.title}
                    checked={task.done}
                    onToggle={() => toggleTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* criação no final da página */}
      <div style={{ marginTop: 18 }} className="card">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />

          <div className="priority-select" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label>
              <input type="radio" name="priority" value="essential" checked={priority === "essential"} onChange={() => setPriority("essential")} />{' '}
              <strong>Essencial</strong>
            </label>

            <label>
              <input type="radio" name="priority" value="important" checked={priority === "important"} onChange={() => setPriority("important")} />{' '}
              Importante
            </label>

            <label>
              <input type="radio" name="priority" value="optional" checked={priority === "optional"} onChange={() => setPriority("optional")} />{' '}
              Opcional
            </label>
          </div>

          <div>
            <button disabled={isDisabled} onClick={addTask}>
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
