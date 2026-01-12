type SidebarProps = {
  onNavigate: (page: any) => void;
  active: string;
};

export default function Sidebar({ onNavigate, active }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h1>LifeOS</h1>

      <button
        className={active === "dashboard" ? "active" : ""}
        onClick={() => onNavigate("dashboard")}
      >
        Dashboard
      </button>

      <button
        className={active === "tasks" ? "active" : ""}
        onClick={() => onNavigate("tasks")}
      >
        Tasks
      </button>

      <button
        className={active === "habits" ? "active" : ""}
        onClick={() => onNavigate("habits")}
      >
        Rotina
      </button>

      <button
        className={active === "financeiro" ? "active" : ""}
        onClick={() => onNavigate("financeiro")}
      >
        Financeiro
      </button>

      <button
        className={active === "calendar" ? "active" : ""}
        onClick={() => onNavigate("calendar")}
      >
        Calendar
      </button>

      <button
        className={active === "settings" ? "active" : ""}
        onClick={() => onNavigate("settings")}
      >
        Settings
      </button>
    </aside>
  );
}
