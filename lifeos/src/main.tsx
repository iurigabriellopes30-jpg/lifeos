import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  const win = window as typeof window & { __SW_CLEARED__?: boolean };
  if (!win.__SW_CLEARED__) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length > 0) {
          registrations.forEach((reg) => reg.unregister());
          win.__SW_CLEARED__ = true;
          console.log("Service workers removidos no modo dev. Recarregando...");
          window.location.reload();
        }
      })
      .catch((err) => {
        console.warn("Falha ao remover service workers:", err);
      });
  }
}

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
