import { useEffect, useState } from "react";
import { db, CalendarEvent } from "../../shared/db";

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
      <p className="subtitle">Este item é gerenciado pelo LifeOS no chat.</p>

      {events.length === 0 && (
        <p className="empty">Nenhum evento ainda.</p>
      )}

      {events.map((event) => (
        <div key={event.id} className="item-row" style={{ pointerEvents: 'none', opacity: 0.7 }}>
          <span>{event.title}</span>
        </div>
      ))}
    </div>
  );
}
