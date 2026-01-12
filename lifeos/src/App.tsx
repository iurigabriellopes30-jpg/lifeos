import { useEffect, useState } from "react";
import { cleanupRoutines } from "./shared/db";

import SimpleSidebar from "./components/SimpleSidebar";
import Toast from "./components/ui/Toast";

import ControlePage from "./features/controle/ControlePage";
import ChatPage from "./features/chat/ChatPage";
import SimpleSettings from "./features/settings/SimpleSettings";

import { useToastProvider } from "./shared/useToast";

type Page = "controle" | "chat" | "settings";

export default function App() {
  const [page, setPage] = useState<Page>("controle");

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
      case "chat":
        return <ChatPage />;
      case "settings":
        return (
          <SimpleSettings
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        );
      default:
        return <ControlePage />;
    }
  }

  return (
    <div className="app-layout">
      <SimpleSidebar active={page === "controle" ? "controle" : page === "settings" ? "settings" : "controle"} onNavigate={(p) => setPage(p)} />
      <div className="app-content">
        {renderPage()}
      </div>

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
