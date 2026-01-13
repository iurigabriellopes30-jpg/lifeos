import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import "./SimpleSidebar.css";

export default function SimpleSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="simple-sidebar">
      <div className="sidebar-header">
        <h2>LifeOS</h2>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${isActive("/controle") ? "active" : ""}`}
          onClick={() => navigate("/controle")}
        >
          Controle Financeiro
        </button>

        <button
          className={`nav-item ${isActive("/chat") ? "active" : ""}`}
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>

        <button
          className={`nav-item ${isActive("/settings") ? "active" : ""}`}
          onClick={() => navigate("/settings")}
        >
          Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <p>{user.email}</p>
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </aside>
  );
}
