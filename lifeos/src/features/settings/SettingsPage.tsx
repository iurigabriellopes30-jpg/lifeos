import { db } from "../../shared/db";
import { useEffect, useState } from "react";
import { getTone, setTone, Tone } from "../../shared/tone";

type Props = {
  onToggleTheme: () => void;
  theme: "light" | "dark";
};

export default function SettingsPage({ onToggleTheme, theme }: Props) {
  const [tone, setLocalTone] = useState<Tone>(getTone());

  useEffect(() => {
    function onToneChange(e: Event) {
      const detail = (e as CustomEvent).detail as Tone;
      setLocalTone(detail);
    }

    window.addEventListener("toneChange", onToneChange as EventListener);
    return () => window.removeEventListener("toneChange", onToneChange as EventListener);
  }, []);

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

  function handleToneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target.value as Tone;
    setTone(t);
    setLocalTone(t);
  }

  function handleThemeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value; // 'claro' or 'escuro'
    if (value === "claro" && theme === "dark") onToggleTheme();
    if (value === "escuro" && theme === "light") onToggleTheme();
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Configurações</h1>
        <p className="subtitle">Ajuste o LifeOS ao seu jeito</p>
      </div>

      <div className="card settings-section">
        <h2>Aparência</h2>
        <div className="subtitle">Escolha o tema</div>

        <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
          <label>
            <input
              type="radio"
              name="theme"
              value="claro"
              checked={theme === "light"}
              onChange={handleThemeChange}
            />{' '}
            <strong>Claro</strong>
          </label>

          <label>
            <input
              type="radio"
              name="theme"
              value="escuro"
              checked={theme === "dark"}
              onChange={handleThemeChange}
            />{' '}
            <strong>Escuro</strong>
          </label>
        </div>
      </div>

      <div className="card settings-section">
        <h2>Tom do Life</h2>
        <p className="subtitle">Como você prefere que o Life fale com você?</p>

        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
          <label>
            <input type="radio" name="tone" value="calm" checked={tone === "calm"} onChange={handleToneChange} />{' '}
            <strong>Calmo</strong>
            <div className="subtitle" style={{ marginTop: 4 }}>gentil, acolhedor</div>
          </label>

          <label>
            <input type="radio" name="tone" value="balanced" checked={tone === "balanced"} onChange={handleToneChange} />{' '}
            <strong>Equilibrado</strong>
            <div className="subtitle" style={{ marginTop: 4 }}>direto, sem pressão</div>
          </label>

          <label>
            <input type="radio" name="tone" value="direct" checked={tone === "direct"} onChange={handleToneChange} />{' '}
            <strong>Direto</strong>
            <div className="subtitle" style={{ marginTop: 4 }}>confrontador, sem rodeios</div>
          </label>
        </div>
      </div>

      <div className="card settings-section">
        <h2>Dados</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button onClick={exportData}>Exportar dados</button>
          <label className="import-label" style={{ display: "inline-flex", alignItems: "center" }}>
            Importar dados
            <input type="file" accept="application/json" onChange={handleFile} hidden />
          </label>
        </div>
      </div>

      <div className="card settings-section">
        <h2>Sobre</h2>
        <p>LifeOS não organiza sua vida.
          Ele te devolve o controle sobre ela.</p>
        <p className="subtitle">Versão: MVP local-first</p>
      </div>
    </div>
  );
}
