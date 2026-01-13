import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* LOGO / TITULO */}
        <div className="landing-header">
          <h1 className="landing-logo">LifeOS</h1>
          <p className="landing-tagline">Controle começa pela clareza.</p>
        </div>

        {/* DESCRIÇÃO */}
        <div className="landing-description">
          <p>
            LifeOS é um sistema de controle financeiro pessoal. 
            Aqui você planeja, executa e acompanha sua estratégia fiscal dia a dia.
          </p>
          <p>
            Sem complicações. Só clareza e ação.
          </p>
        </div>

        {/* BOTÕES */}
        <div className="landing-buttons">
          <button 
            className="btn-primary-large"
            onClick={() => navigate("/login")}
          >
            Entrar
          </button>
          <button 
            className="btn-secondary-large"
            onClick={() => navigate("/signup")}
          >
            Criar conta
          </button>
        </div>

        {/* FOOTER */}
        <div className="landing-footer">
          <p>LifeOS v1.0 — Controle Financeiro</p>
        </div>
      </div>
    </div>
  );
}
