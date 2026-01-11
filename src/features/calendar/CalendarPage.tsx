import { useEffect, useState } from "react";
import { db, CalendarEvent } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";
import { useToast } from "../../shared/useToast";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const isDisabled = !title.trim();

  const toast = useToast();

  async function loadEvents() {
    const data = await db.calendar.toArray();
    setEvents(data);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function addEvent() {
    if (isDisabled) return;

    await db.calendar.add({
      id: Date.now(),
      title: title.trim(),
    });

    setTitle("");
    loadEvents();
    toast.showToast("Evento adicionado 📅");
  }

  async function removeEvent(id: number) {
    await db.calendar.delete(id);
    loadEvents();
    toast.showToast("Evento removido 🗑️", "error");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      addEvent();
    }
  }

  return (
    <div className="card">
      <h1>Calendar</h1>

      <div className="input-row">
        <input
          placeholder="Novo evento..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button disabled={isDisabled} onClick={addEvent}>
          Adicionar
        </button>
      </div>

      {events.length === 0 && (
        <p className="empty">Nenhum evento ainda.</p>
      )}

      {events.map((event) => (
        <ItemRow
          key={event.id}
          label={event.title}
          checked={false}
          onToggle={() => {}}
          onDelete={() => removeEvent(event.id)}
        />
      ))}
    </div>
  );
}
