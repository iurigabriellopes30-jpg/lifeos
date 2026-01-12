import { useEffect, useState } from "react";
import "./ControlePage.css";

interface FinanceiroState {
  fase: string;
  dividas: Array<{ id: number; descricao: string; valor: number }>;
  foco: string;
  ultima_atualizacao: number | null;
}

export default function ControlePage() {
  const [state, setState] = useState<FinanceiroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [acaoDiaCheck, setAcaoDiaCheck] = useState(false);
  const [confirmacoes, setConfirmacoes] = useState({
    semGastos: false,
    seguiuPlano: false,
  });

  // Load state from backend
  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await fetch("http://localhost:8001/financeiro");
        const data = await response.json();
        setState(data);
      } catch (error) {
        console.error("Erro ao carregar estado:", error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
    const interval = setInterval(loadState, 5000); // Reload a cada 5s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="controle-page">Carregando...</div>;
  }

  if (!state) {
    return <div className="controle-page">Erro ao carregar dados</div>;
  }

  const totalDivida = state.dividas.reduce((sum, d) => sum + d.valor, 0);
  const reserva = 100; // Valor base fixo

  const handleAcaoDia = () => {
    setAcaoDiaCheck(!acaoDiaCheck);
  };

  const handleConfirmacao = (key: "semGastos" | "seguiuPlano") => {
    setConfirmacoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFalarComLifeOS = () => {
    const event = new CustomEvent("app:navigate", {
      detail: "chat",
    });
    window.dispatchEvent(event);
  };

  const handleAjustarPlano = () => {
    const event = new CustomEvent("app:navigate", {
      detail: "chat",
    });
    window.dispatchEvent(event);
  };

  const handleEncerrarDia = () => {
    // Reset checkboxes for next day
    setAcaoDiaCheck(false);
    setConfirmacoes({ semGastos: false, seguiuPlano: false });
  };

  return (
    <div className="controle-page">
      {/* ========== TOPO ========== */}
      <div className="controle-header">
        <h1>LifeOS</h1>
        <p className="subtitulo">Controle Financeiro</p>
      </div>

      {/* ========== CARDS PRINCIPAIS ========== */}
      <div className="controle-cards">
        {/* CARD 1: FASE ATUAL */}
        <div className="card">
          <h2>Fase Atual</h2>
          <div className="card-content">
            <div className="fase-grid">
              <div className="fase-item">
                <span className="label">Fase</span>
                <span className="valor-grande">{String(state.fase) === "1" ? "ATAQUE" : "PROTEÇÃO"}</span>
              </div>
              <div className="fase-item">
                <span className="label">Ritmo</span>
                <span className="valor-grande">$20/dia</span>
              </div>
              <div className="fase-item">
                <span className="label">Status</span>
                <span className="valor-grande">Em Progresso</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: FOCO DO DIA */}
        <div className="card">
          <h2>Foco do Dia</h2>
          <div className="card-content">
            <ul className="foco-list">
              <li>Separar $20</li>
              <li>Não criar novos gastos</li>
            </ul>
          </div>
        </div>

        {/* CARD 3: ESTRATÉGIA */}
        <div className="card">
          <h2>Estratégia do LifeOS</h2>
          <div className="card-content">
            <ol className="estrategia-list">
              <li>Separar $20 todos os dias até criar fôlego</li>
              <li>Quitar dívidas por blocos</li>
              <li>Evitar novos gastos na fase ATAQUE</li>
              <li>Recalcular plano a cada dívida quitada</li>
            </ol>
            <p className="estrategia-objetivo">
              Objetivo: sair do risco e ganhar controle
            </p>
          </div>
        </div>

        {/* CARD 4: VISÃO FINANCEIRA */}
        <div className="card">
          <h2>Visão Financeira</h2>
          <div className="card-content">
            <div className="financeiro-section">
              <h3>Dívidas Ativas</h3>
              {state.dividas.length > 0 ? (
                <ul className="dividas-list">
                  {state.dividas.map((d) => (
                    <li key={d.id} className="divida-row">
                      <span>{d.descricao}</span>
                      <span className="divida-valor">R$ {d.valor.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sem-dividas">Nenhuma dívida ativa</p>
              )}
            </div>

            <div className="financeiro-totals">
              <div className="total-linha">
                <span>Total em risco</span>
                <span className="total-valor">R$ {totalDivida.toFixed(2)}</span>
              </div>
              <div className="total-linha">
                <span>Reserva atual</span>
                <span className="total-valor">R$ {reserva.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 5: AÇÃO ÚNICA DO DIA */}
        <div className="card card-acao">
          <h2>Ação Única do Dia</h2>
          <div className="card-content">
            <label className="checkbox-grande">
              <input
                type="checkbox"
                checked={acaoDiaCheck}
                onChange={handleAcaoDia}
              />
              <span>Separei $20 hoje</span>
            </label>
          </div>
        </div>

        {/* CARD 6: CONFIRMAÇÕES */}
        <div className="card">
          <h2>Confirmações</h2>
          <div className="card-content">
            <label className="checkbox-simples">
              <input
                type="checkbox"
                checked={confirmacoes.semGastos}
                onChange={() => handleConfirmacao("semGastos")}
              />
              <span>Não criei novos gastos hoje</span>
            </label>
            <label className="checkbox-simples">
              <input
                type="checkbox"
                checked={confirmacoes.seguiuPlano}
                onChange={() => handleConfirmacao("seguiuPlano")}
              />
              <span>Segui o plano definido</span>
            </label>
          </div>
        </div>

        {/* CARD 7: REFLEXÃO FINAL */}
        <div className="card card-manifesto">
          <div className="card-content">
            <p className="manifesto-texto">
              Você não precisa pensar no plano.
              <br />
              <strong>Só executar o dia.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ========== AÇÕES FIXAS ========== */}
      <div className="acoes-fixas">
        <button className="btn-primary" onClick={handleFalarComLifeOS}>
          Falar com o LifeOS
        </button>
        <button className="btn-secondary" onClick={handleAjustarPlano}>
          Ajustar Plano
        </button>
        <button className="btn-tertiary" onClick={handleEncerrarDia}>
          Encerrar Dia
        </button>
      </div>
    </div>
  );
}
