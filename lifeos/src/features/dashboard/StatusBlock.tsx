import { useEffect, useState } from "react";
import { getDailyInsights, DailyInsights } from "../../shared/insights";

type StatusBlockProps = {
  tasks: number;
  habits: number;
  events: number;
};

export default function StatusBlock({ tasks, habits, events }: StatusBlockProps) {
  const [insights, setInsights] = useState<DailyInsights | null>(null);

  useEffect(() => {
    let mounted = true;
    getDailyInsights().then((v) => {
      if (mounted) setInsights(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const taskClass = insights && insights.overdueTasksCount > 0 ? "task-attention" : "";
  const habitClass = insights && insights.habitsAtRisk > 0 ? "habit-alert" : "";
  const calendarClass = insights && insights.calendarLoad === "heavy" ? "calendar-heavy" : "";

  return (
    <div className="status-row">
      <div className={`dashboard-card ${taskClass}`}>
        <h4>📝 Tasks</h4>
        <div className="dashboard-number">{tasks}</div>
        <p className="subtitle">pendentes</p>
      </div>

      <div className={`dashboard-card ${habitClass}`}>
        <h4>🔥 Habits</h4>
        <div className="dashboard-number">{habits}</div>
        <p className="subtitle">hábitos</p>
      </div>

      <div className={`dashboard-card ${calendarClass}`}>
        <h4>📅 Calendar</h4>
        <div className="dashboard-number">{events}</div>
        <p className="subtitle">eventos</p>
      </div>
    </div>
  );
}
