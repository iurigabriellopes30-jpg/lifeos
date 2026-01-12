import { useEffect, useState } from "react";
import { db } from "../../shared/db";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function DashboardPage() {
  const [tasksCount, setTasksCount] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  async function load() {
    const allTasks = await db.tasks.toArray();

    setTasksCount(allTasks.filter(task => !task.done).length);
    setHabitsCount(await db.habits.count());
    setEventsCount(await db.calendar.count());
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="dashboard">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do seu dia"
      />

      <div style={{ display: "flex", gap: 16 }}>
        <Card>
          <h3>📝 Tasks</h3>
          <p>
            <strong>{tasksCount}</strong> pendentes
          </p>
        </Card>

        <Card>
          <h3>🔥 Habits</h3>
          <p>
            <strong>{habitsCount}</strong> hábitos
          </p>
        </Card>

        <Card>
          <h3>📅 Calendar</h3>
          <p>
            <strong>{eventsCount}</strong> eventos
          </p>
        </Card>
      </div>
    </div>
  );
}
