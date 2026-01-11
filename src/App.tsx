import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import Toast from "./components/ui/Toast";

import DashboardPage from "./features/dashboard/DashboardPage";
import TasksPage from "./features/tasks/TasksPage";
import HabitsPage from "./features/habits/HabitsPage";
import CalendarPage from "./features/calendar/CalendarPage";
import SettingsPage from "./features/settings/SettingsPage";

import { useToastProvider } from "./shared/useToast";

type Page =
  | "dashboard"
  | "tasks"
  | "habits"
  | "calendar"
  | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  /* =========================
     🌗 TEMA (REAL)
  ========================= */
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("lifeos-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("lifeos-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  /* =========================
     🔔 TOAST GLOBAL
  ========================= */
  const { toast, clearToast } = useToastProvider();

  function renderPage() {
    switch (page) {
      case "tasks":
        return <TasksPage />;
      case "habits":
        return <HabitsPage />;
      case "calendar":
        return <CalendarPage />;
      case "settings":
        return (
          <SettingsPage
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      default:
        return <DashboardPage />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar onNavigate={setPage} active={page} />
      <Main>{renderPage()}</Main>

      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}
    </div>
  );
}
