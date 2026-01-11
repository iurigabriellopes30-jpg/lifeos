import { useEffect, useMemo, useState } from "react";
import { db, CalendarEvent, Energy } from "../../shared/db";
import { useToast } from "../../shared/useToast";

const WEEKDAY_ABBR = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const WEEKDAY_NAME = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_ALMOST_FULL = 5; // limiar para exibir aviso sutil

function formatDateToYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  // ajusta para segunda-feira como início da semana
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const toast = useToast();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [energy, setEnergy] = useState<Energy>("media");

  const isDisabled = title.trim() === "";

  async function loadEvents() {
    const data = await db.calendar.toArray();

    // backward compatibility: if an event has no date, treat as today
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

  function addEventToDB() {
    if (isDisabled) return;

    const payload: CalendarEvent = {
      id: Date.now(),
      title: title.trim(),
      date: formatDateToYMD(selectedDate),
      time: time || undefined,
      energy,
    };

    db.calendar.add(payload).then(() => {
      setTitle("");
      setTime("");
      setEnergy("media");
      loadEvents();
      toast.showToast("Evento adicionado 📅");
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addEventToDB();
  }

  function removeEvent(id: number) {
    db.calendar.delete(id).then(() => {
      loadEvents();
      toast.showToast("Evento removido 🗑️", "error");
    });
  }

  return (
    <div className="page-container">
      <div className="card calendar-card">
        <h1>Calendário</h1>
        <p className="subtitle">Planeje sua semana com consciência</p>

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
              <div className="day-abbr">{WEEKDAY_ABBR[d.getDay() === 0 ? 6 : d.getDay() - 1] /* adjust */}</div>
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
              <div key={ev.id} className="item-row event-row">
                <div>
                  <div style={{ fontWeight: 700 }}>{ev.title}</div>
                  <div className="event-meta">
                    <span className={`energy energy-${ev.energy ?? "media"}`}>
                      {ev.energy === "alta" ? "Alta" : ev.energy === "baixa" ? "Baixa" : "Média"}
                    </span>
                    {ev.time && <span className="muted"> — {ev.time}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="remove-btn" onClick={() => removeEvent(ev.id)} aria-label="Remover evento">
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CRIAÇÃO DE EVENTO (NO FINAL) */}
      <div style={{ marginTop: 14 }}>
        <h2>+ Adicionar evento</h2>
        <div className="form-row">
          <input
            placeholder="O que vai acontecer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }} className="priority-select">
          <label>
            <input type="radio" name="energy" checked={energy === "alta"} onChange={() => setEnergy("alta")} /> <strong>Alta</strong>
          </label>
          <label>
            <input type="radio" name="energy" checked={energy === "media"} onChange={() => setEnergy("media")} /> <strong>Média</strong>
          </label>
          <label>
            <input type="radio" name="energy" checked={energy === "baixa"} onChange={() => setEnergy("baixa")} /> <strong>Baixa</strong>
          </label>
          <div style={{ marginLeft: "auto" }}>
            <button disabled={isDisabled} onClick={addEventToDB}>
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

