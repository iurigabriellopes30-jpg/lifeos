import { useEffect, useState } from "react";
import { cleanupRoutines } from "./shared/db";

import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import Toast from "./components/ui/Toast";

import DashboardPage from "./features/dashboard/DashboardPage";
import TasksPage from "./features/tasks/TasksPage";
import HabitsPage from "./features/habits/HabitsPage";
import CalendarPage from "./features/calendar/CalendarPage";
import SettingsPage from "./features/settings/SettingsPage";
import ChatPage from "./features/chat/ChatPage";
import FinanceiroPage from "./features/financeiro/FinanceiroPage";

import { useToastProvider } from "./shared/useToast";

type Page =
  | "dashboard"
  | "tasks"
  | "habits"
  | "calendar"
  | "financeiro"
  | "settings"
  | "chat";

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

  // listen for global navigation events from small helpers (ex: passive chat)
  useEffect(() => {
    function onNavigate(e: Event) {
      const page = (e as CustomEvent).detail as Page;
      if (page) setPage(page);
    }

    window.addEventListener("app:navigate", onNavigate as EventListener);
    return () => window.removeEventListener("app:navigate", onNavigate as EventListener);
  }, []);

  // One-time forced cleanup on app start
  useEffect(() => {
    const key = "lifeos:cleanup:v1";
    const done = localStorage.getItem(key);
    if (!done) {
      (async () => {
        try {
          await cleanupRoutines();
        } finally {
          localStorage.setItem(key, "1");
        }
      })();
    }
  }, []);

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
      case "financeiro":
        return <FinanceiroPage />;
      case "settings":
        return (
          <SettingsPage
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      case "chat":
        return <ChatPage />;
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
