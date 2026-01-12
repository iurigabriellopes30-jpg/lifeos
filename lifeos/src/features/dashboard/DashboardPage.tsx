import { useEffect, useMemo, useState } from "react";
import { db } from "../../shared/db";
import PageHeader from "../../components/ui/PageHeader";
import ContextMessage from "./ContextMessage";
import TodayPriority from "./TodayPriority";
import StatusBlock from "./StatusBlock";
import FloatingChatButton from "./FloatingChatButton";

export default function DashboardPage() {
  const [tasksCount, setTasksCount] = useState(0);
  const [habitsCount, setHabitsCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  async function load() {
    const allTasks = await db.tasks.toArray();

    setTasksCount(allTasks.filter((task) => !task.done).length);
    setHabitsCount(await db.habits.count());
    setEventsCount(await db.calendar.count());
  }

  useEffect(() => {
    load();
  }, []);



  return (
    <div className="dashboard">
      <PageHeader title="Dashboard" subtitle="Visão geral do seu dia" />

      <ContextMessage />



      <div style={{ marginTop: 12 }}>
        <TodayPriority />
      </div>

      <div className="status-row" style={{ marginTop: 16 }}>
        <StatusBlock tasks={tasksCount} habits={habitsCount} events={eventsCount} />
      </div>

      <FloatingChatButton onClick={() => window.dispatchEvent(new CustomEvent("app:navigate", { detail: "chat" }))} />
    </div>
  );
}
