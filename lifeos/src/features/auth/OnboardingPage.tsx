import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/AuthContext";
import { apiUrl } from "../../shared/api";
import "./OnboardingPage.css";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { checkOnboardingStatus } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartConsultation = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("lifeos:token");
      const response = await fetch(apiUrl("/auth/onboarding"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          monthly_income: 0,
          fixed_expenses: 0,
          has_debts: false,
          debts: [],
          main_priority: "",
          control_level: "",
        }),
      });

      if (response.ok) {
        // Recarregar estado de autenticação para atualizar onboardingCompleted
        await checkOnboardingStatus();
        // Ir para chat
        setTimeout(() => navigate("/chat"), 100);
      } else {
        console.error("Erro:", response.status);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>🎯 Bem-vindo ao LifeOS!</h1>
          <p className="subtitle">Seu assistente pessoal de organização financeira</p>
        </div>

        <div className="onboarding-content">
          <div className="info-section">
            <div className="info-icon">💬</div>
            <h2>Consultoria Personalizada</h2>
            <p>
              Para começar a usar o LifeOS e ter acesso a todas as funcionalidades,
              você precisa fazer uma <strong>consultoria rápida</strong> com nosso assistente.
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Análise da sua situação financeira atual</span>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Identificação de dívidas e prioridades</span>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Plano personalizado de 90 dias</span>
            </div>
            <div className="feature-item">
              <span className="check-icon">✓</span>
              <span>Acesso ao painel de controle financeiro</span>
            </div>
          </div>

          <div className="cta-section">
            <p className="cta-text">
              A consultoria é <strong>simples e conversacional</strong> - 
              responda às perguntas do assistente e seu plano será criado automaticamente!
            </p>
            
            <button 
              className="btn-primary"
              onClick={handleStartConsultation}
              disabled={loading}
            >
              {loading ? "Iniciando..." : "Iniciar Consultoria"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
