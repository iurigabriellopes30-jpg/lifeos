import { db } from "../../shared/db";

type Props = {
  onToggleTheme: () => void;
  theme: "light" | "dark";
};

export default function SettingsPage({ onToggleTheme, theme }: Props) {
  async function exportData() {
    const data = {
      tasks: await db.tasks.toArray(),
      habits: await db.habits.toArray(),
      calendar: await db.calendar.toArray(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lifeos-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);

    await db.transaction("rw", db.tasks, db.habits, db.calendar, async () => {
      await db.tasks.clear();
      await db.habits.clear();
      await db.calendar.clear();

      if (data.tasks) await db.tasks.bulkAdd(data.tasks);
      if (data.habits) await db.habits.bulkAdd(data.habits);
      if (data.calendar) await db.calendar.bulkAdd(data.calendar);
    });

    window.location.reload();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) importData(file);
  }

  return (
    <div className="card">
      <h1>Configurações</h1>
      <p className="subtitle">Preferências e backup</p>

      {/* TEMA */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={onToggleTheme}>
          Usar tema {theme === "light" ? "escuro 🌙" : "claro ☀️"}
        </button>
      </div>

      {/* BACKUP */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button onClick={exportData}>📤 Exportar dados</button>

        <label className="import-label">
          📥 Importar dados
          <input
            type="file"
            accept="application/json"
            onChange={handleFile}
            hidden
          />
        </label>
      </div>
    </div>
  );
}
