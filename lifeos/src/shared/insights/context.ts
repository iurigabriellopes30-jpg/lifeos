import { db, Habit } from "../db";

export type OverloadLevel = "baixo" | "médio" | "alto";

export type LifeContext = {
  openTasks: number;
  habitsAtRisk: number;
  todayEvents: number;
  overloadLevel: OverloadLevel;
};

function formatDateToYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfDayTs(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Deterministic function to determine if a habit is "at risk".
 * - daily: not done in the last 48h
 * - weekly: not done in the last 14 days
 */
function isHabitAtRisk(h: Habit, now: number) {
  const freq = h.frequency ?? ("daily" as const);
  const last = h.lastDoneAt ?? 0;

  if (freq === "daily") return now - last > 48 * 60 * 60 * 1000;
  if (freq === "weekly") return now - last > 14 * 24 * 60 * 60 * 1000;
  return false;
}

/**
 * Read-only snapshot of the user's current life context.
 * - openTasks: number of tasks not done
 * - habitsAtRisk: number of habits considered at risk
 * - todayEvents: number of calendar events on today's date
 * - overloadLevel: low/medium/high based on simple thresholds
 */
export async function getLifeContext(): Promise<LifeContext> {
  const [tasks, habits, events] = await Promise.all([
    db.tasks.toArray(),
    db.habits.toArray(),
    db.calendar.toArray(),
  ]);

  const now = Date.now();
  const todayKey = formatDateToYMD(new Date());

  const openTasks = tasks.filter((t) => !t.done).length;

  const habitsAtRisk = habits.filter((h) => isHabitAtRisk(h, now)).length;

  // Normalize events without date to today for backward compatibility
  const normalizedEvents = events.map((ev) => ({ ...ev, date: ev.date ?? todayKey }));
  const todayEvents = normalizedEvents.filter((ev) => ev.date === todayKey).length;

  // Simple, predictable thresholds for overload
  // High: any of the counts exceeds a high threshold
  // Medium: any exceeds medium threshold
  // Otherwise: low
  const HIGH = { tasks: 15, habits: 6, events: 6 };
  const MEDIUM = { tasks: 8, habits: 3, events: 3 };

  let overloadLevel: OverloadLevel = "baixo";

  if (openTasks >= HIGH.tasks || habitsAtRisk >= HIGH.habits || todayEvents >= HIGH.events) {
    overloadLevel = "alto";
  } else if (openTasks >= MEDIUM.tasks || habitsAtRisk >= MEDIUM.habits || todayEvents >= MEDIUM.events) {
    overloadLevel = "médio";
  }

  return {
    openTasks,
    habitsAtRisk,
    todayEvents,
    overloadLevel,
  };
}
