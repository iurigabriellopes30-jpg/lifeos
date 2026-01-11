import { db } from "../db";

export type CalendarLoad = "light" | "balanced" | "heavy";

export type DailyInsights = {
  overdueTasksCount: number;
  habitsAtRisk: number;
  calendarLoad: CalendarLoad;
  hasPriorityToday: boolean;
};

// Thresholds (easy to tweak)
const OVERDUE_DAYS = 7; // tasks older than this and not done are "overdue"
const PRIORITY_WINDOW_MS = 24 * 60 * 60 * 1000; // tasks created within last 24h count as "priority today"

export async function getDailyInsights(): Promise<DailyInsights> {
  const [tasks, habits, events] = await Promise.all([
    db.tasks.toArray(),
    db.habits.toArray(),
    db.calendar.toArray(),
  ]);

  const now = Date.now();

  const overdueTasksCount = tasks.filter((t) => {
    if (t.done) return false;
    // some tasks use timestamp ids; if id looks like a timestamp, use it to determine age
    const createdAt = typeof t.id === "number" ? t.id : 0;
    const age = now - createdAt;
    return age > OVERDUE_DAYS * 24 * 60 * 60 * 1000;
  }).length;

  // Without historical habit completion data, consider a habit "at risk" if it's currently not marked as done.
  const habitsAtRisk = habits.filter((h) => !h.done).length;

  // Determine calendar load by total event count as a simple, deterministic proxy
  const eventsCount = events.length;
  let calendarLoad: CalendarLoad = "balanced";
  if (eventsCount <= 2) calendarLoad = "light";
  else if (eventsCount >= 6) calendarLoad = "heavy";

  // hasPriorityToday: heuristically true if there is at least one open task created within the last 24 hours
  const hasPriorityToday = tasks.some((t) => {
    if (t.done) return false;
    const createdAt = typeof t.id === "number" ? t.id : 0;
    return now - createdAt <= PRIORITY_WINDOW_MS;
  });

  return {
    overdueTasksCount,
    habitsAtRisk,
    calendarLoad,
    hasPriorityToday,
  };
}

export { getLifeContext, type LifeContext } from "./context";
export { analyzeLifeContext, type Insight, type InsightType } from "./analyzer";
export { adaptInsight, adaptActionConfirmation } from "./toneAdapter";


