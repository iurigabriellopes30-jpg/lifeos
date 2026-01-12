import "./SimpleSidebar.css";

interface SimpleSidebarProps {
  active: "controle" | "settings";
  onNavigate: (page: "controle" | "settings") => void;
}

export default function SimpleSidebar({ active, onNavigate }: SimpleSidebarProps) {
  return (
    <aside className="simple-sidebar">
      <div className="sidebar-header">
        <h2>LifeOS</h2>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${active === "controle" ? "active" : ""}`}
          onClick={() => onNavigate("controle")}
        >
          Controle Financeiro
        </button>

        <button
          className={`nav-item ${active === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          Settings
        </button>
      </nav>
    </aside>
  );
}
