import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { cleanupRoutines } from "../shared/db";
import SimpleSidebar from "../components/SimpleSidebar";
import Toast from "../components/ui/Toast";
import ControlePage from "../features/controle/ControlePage";
import ChatPage from "../features/chat/ChatPage";
import SimpleSettings from "../features/settings/SimpleSettings";
import { useToastProvider } from "../shared/useToast";

export default function LifeOSLayout() {

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

  return (
    <div className="app-layout">
      <SimpleSidebar />
      <div className="app-content">
        <Routes>
          <Route path="/controle" element={<ControlePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<SimpleSettings theme={theme} onToggleTheme={toggleTheme} />} />
          <Route path="/" element={<Navigate to="/controle" replace />} />
          <Route path="*" element={<Navigate to="/controle" replace />} />
        </Routes>
        {toast.message && (
          <Toast message={toast.message} type={toast.type} onClose={clearToast} />
        )}
      </div>
    </div>
  );
}
