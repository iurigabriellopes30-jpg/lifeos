import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/AuthContext";
import "./WelcomePage.css";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, markConsultationStarted } = useAuth();

  const handleStartConsultation = async () => {
    // NÃO marca como consultoria iniciada aqui - só navega pro chat
    // A consultoria só marca como completa quando o chat terminar
    navigate("/chat");
  };

  const handleSkip = async () => {
    await markConsultationStarted();
    navigate("/controle");
  };

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>🎉 Bem-vindo(a) ao LifeOS, {user?.email?.split('@')[0]}!</h1>
          <p className="subtitle">Seus dados iniciais foram salvos com sucesso</p>
        </div>

        <div className="welcome-content">
          <div className="info-box">
            <h2>📊 Seus Dados Iniciais</h2>
            <p>
              As informações que você preencheu na pesquisa já estão disponíveis 
              na aba <strong>Controle Financeiro</strong>.
            </p>
            <p>
              Esses dados são apenas uma <strong>base inicial</strong> para começarmos 
              a trabalhar juntos.
            </p>
          </div>

          <div className="info-box highlight">
            <h2>💬 Próximo Passo: Consultoria Completa</h2>
            <p>
              Agora, vamos ao <strong>Chat</strong> para uma consultoria personalizada!
            </p>
            <ul className="benefits-list">
              <li>✓ A LifeOS vai entender melhor sua situação financeira</li>
              <li>✓ Vamos coletar detalhes importantes sobre suas dívidas</li>
              <li>✓ Você receberá uma estratégia personalizada e realista</li>
              <li>✓ Todos os dados serão atualizados automaticamente</li>
            </ul>
          </div>

          <div className="info-box">
            <h2>🎯 Como Funciona</h2>
            <p>
              Durante a consultoria no chat, a LifeOS vai:
            </p>
            <ol className="steps-list">
              <li>Fazer perguntas sobre sua situação financeira atual</li>
              <li>Entender suas prioridades e objetivos</li>
              <li>Criar um plano de ação sob medida para você</li>
              <li>Atualizar o <strong>Controle Financeiro</strong> com todos os detalhes</li>
            </ol>
          </div>
        </div>

        <div className="welcome-actions">
          <button 
            className="btn-primary" 
            onClick={handleStartConsultation}
          >
            🚀 Iniciar Consultoria Agora
          </button>
          <button 
            className="btn-secondary" 
            onClick={handleSkip}
          >
            Ver Controle Financeiro (Dados Básicos)
          </button>
        </div>

        <p className="note">
          💡 <strong>Dica:</strong> Recomendamos fazer a consultoria agora para aproveitar 
          ao máximo o LifeOS e ter uma estratégia financeira completa e personalizada.
        </p>
      </div>
    </div>
  );
}
