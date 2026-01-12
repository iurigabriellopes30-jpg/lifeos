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
      {/* ========== HEADER ========== */}
      <div className="controle-header">
        <h1>LifeOS</h1>
        <p className="subtitulo">Controle Financeiro</p>
      </div>

      {/* ========== LAYOUT EM DOIS PAINÉIS ========== */}
      <div className="controle-layout">
        {/* PAINEL ESQUERDO */}
        <div className="painel-esquerdo">
          {/* FASE ATUAL */}
          <div className="bloco">
            <h3 className="bloco-titulo">FASE ATUAL</h3>
            <div className="bloco-conteudo">
              <div className="info-row">
                <span className="info-label">Fase:</span>
                <span className="info-valor">{String(state.fase) === "1" ? "ATAQUE" : "PROTEÇÃO"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ritmo:</span>
                <span className="info-valor">$20 / dia</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-valor">em progresso</span>
              </div>
            </div>
          </div>

          {/* FOCO DO DIA */}
          <div className="bloco">
            <h3 className="bloco-titulo">FOCO DO DIA</h3>
            <div className="bloco-conteudo">
              <ul className="lista-simples">
                <li>• Separar $20</li>
                <li>• Não criar novos gastos</li>
              </ul>
            </div>
          </div>

          {/* VISÃO FINANCEIRA */}
          <div className="bloco">
            <h3 className="bloco-titulo">VISÃO FINANCEIRA</h3>
            <div className="bloco-conteudo">
              {state.dividas.length > 0 ? (
                <div className="dividas-secao">
                  {state.dividas.map((d) => (
                    <div key={d.id} className="divida-linha">
                      <span>{d.descricao}</span>
                      <span className="valor">${d.valor}</span>
                    </div>
                  ))}
                  <div className="divida-separador"></div>
                  <div className="divida-linha destaque">
                    <span><strong>Total en risco</strong></span>
                    <span className="valor"><strong>${totalDivida}</strong></span>
                  </div>
                  <div className="divida-linha">
                    <span>Reserva atual:</span>
                    <span className="valor">${reserva}</span>
                  </div>
                  <p className="info-pequena">(Función: não voltar ao zero)</p>
                </div>
              ) : (
                <p className="sem-dividas">Nenhuma dívida ativa</p>
              )}
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="painel-direito">
          {/* FOCO DO DIA (repetido no painel direito) */}
          <div className="bloco">
            <h3 className="bloco-titulo">FOCO DO DIA</h3>
            <div className="bloco-conteudo">
              <ul className="lista-simples">
                <li>• Separar $20</li>
                <li>• Não criar novos gastos</li>
              </ul>
            </div>
          </div>

          {/* ESTRATÉGIA ATUAL */}
          <div className="bloco">
            <h3 className="bloco-titulo">ESTRATÉGIA ATUAL</h3>
            <div className="bloco-conteudo">
              <ol className="lista-numerada">
                <li>Separar $20 tokos os dias até criar fôlego</li>
                <li>Quitar dívidas por blocos, cemcadada pelo Catrão Nubank</li>
                <li>Evitar novos gastos enquanto durar a fase ATAQUE</li>
                <li>Recalcular o plano sempre que uma dívida for quitada.</li>
              </ol>
              <p className="objetivo">Objetivo da fase: sair do risco e ganhar controle</p>
            </div>
          </div>

          {/* AÇÃO ÚNICA DO DIA */}
          <div className="bloco">
            <h3 className="bloco-titulo">AÇÃO ÚNICA DO DIA</h3>
            <div className="bloco-conteudo">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={acaoDiaCheck}
                  onChange={handleAcaoDia}
                />
                <span>Separei $20 hoje</span>
              </label>
            </div>
          </div>

          {/* CONFIRMAÇÕES */}
          <div className="bloco">
            <h3 className="bloco-titulo">CONFIRMAÇÕES</h3>
            <div className="bloco-conteudo">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={confirmacoes.semGastos}
                  onChange={() => handleConfirmacao("semGastos")}
                />
                <span>Não criei novos gastos hoje</span>
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={confirmacoes.seguiuPlano}
                  onChange={() => handleConfirmacao("seguiuPlano")}
                />
                <span>Segui o plano definido</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========== AÇÕES FIXAS ========== */}
      <div className="acoes-fixas">
        <button className="btn-primary" onClick={handleFalarComLifeOS}>
          Falar com o LifeOS
        </button>
        <button className="btn-secondary" onClick={handleAjustarPlano}>
          Ajustar plano
        </button>
        <button className="btn-tertiary" onClick={handleEncerrarDia}>
          Encerrar dia
        </button>
      </div>
    </div>
  );
}
