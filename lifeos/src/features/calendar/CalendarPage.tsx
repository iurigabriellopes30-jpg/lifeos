import { useEffect, useMemo, useState } from "react";
import { db, CalendarEvent } from "../../shared/db";

const WEEKDAY_ABBR = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const WEEKDAY_NAME = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_ALMOST_FULL = 5;

function formatDateToYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  async function loadEvents() {
    const data = await db.calendar.toArray();
    const normalized = data.map((ev) => ({
      ...ev,
      date: ev.date ?? formatDateToYMD(new Date()),
    }));
    setEvents(normalized);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const week = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ev of events) {
      map[ev.date] = (map[ev.date] || 0) + 1;
    }
    return map;
  }, [events]);

  const eventsForSelectedDay = useMemo(() => {
    const key = formatDateToYMD(selectedDate);
    return events
      .filter((ev) => ev.date === key)
      .sort((a, b) => (a.time || "") > (b.time || "") ? 1 : -1);
  }, [events, selectedDate]);

  function isToday(date: Date) {
    const now = new Date();
    return formatDateToYMD(now) === formatDateToYMD(date);
  }

  return (
    <div className="page-container">
      <div className="card calendar-card">
        <h1>Calendário</h1>
        <p className="subtitle">Planeje sua semana com consciência</p>

        {/* AVISO DE MODO EXECUÇÃO */}
        <div style={{
          padding: "16px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          marginBottom: "24px",
          color: "#856404",
          fontWeight: 600
        }}>
          ⚠️ O calendário reflete decisões tomadas pelo LifeOS.
        </div>

      {/* VISÃO SEMANAL */}
      <div className="calendar-week" role="list">
        {week.map((d) => {
          const key = formatDateToYMD(d);
          const count = countsByDate[key] || 0;
          const isSelected = formatDateToYMD(selectedDate) === key;
          const today = isToday(d);
          return (
            <button
              key={key}
              className={`calendar-day ${isSelected ? "selected" : ""} ${today ? "today" : ""}`}
              onClick={() => setSelectedDate(d)}
              aria-pressed={isSelected}
            >
              <div className="day-abbr">{WEEKDAY_ABBR[d.getDay() === 0 ? 6 : d.getDay() - 1]}</div>
              <div className="day-number">{d.getDate()}</div>
              <div className="day-dots">
                {Array.from({ length: Math.min(3, count) }).map((_, i) => (
                  <span key={i} className="dot" />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* DIA SELECIONADO (FOCO) */}
      <div className="calendar-focus">
        <h2>
          {isToday(selectedDate) ? "Hoje — " : ""}
          {`${WEEKDAY_NAME[selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1]}, ${selectedDate.getDate()}`}
        </h2>

        {countsByDate[formatDateToYMD(selectedDate)] >= DAY_ALMOST_FULL && (
          <div className="calendar-warning">Dia quase cheio. Evite adicionar mais coisas.</div>
        )}

        <div className="list">
          {eventsForSelectedDay.length === 0 ? (
            <p className="empty">Nenhum evento para este dia.</p>
          ) : (
            eventsForSelectedDay.map((ev) => (
              <div key={ev.id} style={{
                padding: "12px",
                background: "#f8f9fa",
                borderRadius: "6px",
                marginBottom: "8px"
              }}>
                <div style={{ fontWeight: 700 }}>{ev.title}</div>
                <div style={{ marginTop: 4, fontSize: "14px", color: "#666" }}>
                  <span className={`energy energy-${ev.energy ?? "media"}`}>
                    {ev.energy === "alta" ? "Alta" : ev.energy === "baixa" ? "Baixa" : "Média"}
                  </span>
                  {ev.time && <span> — {ev.time}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </div>
  );
}

