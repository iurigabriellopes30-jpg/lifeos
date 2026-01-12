import { useEffect, useState } from "react";
import { db, CalendarEvent } from "../../shared/db";
import ItemRow from "../../components/ui/ItemRow";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  async function loadEvents() {
    const data = await db.calendar.toArray();
    setEvents(data);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="card">
      <h1>Calendário</h1>

      <p style={{ color: "#666", marginBottom: "20px" }}>
        Este item é gerenciado pelo LifeOS no chat.
      </p>

      {events.length === 0 && (
        <p className="empty">Nenhum evento ainda.</p>
      )}

      {events.map((event) => (
        <ItemRow
          key={event.id}
          label={event.title}
          checked={false}
          onToggle={() => {}}
          onDelete={() => {}}
        />
      ))}
    </div>
  );
}
