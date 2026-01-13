import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ControlePage.css";

interface Divida {
  id?: number;
  descricao?: string;
  nome?: string;
  valor: number;
  juros?: number;
}

interface FinanceiroState {
  fase: string | number;
  dividas: Divida[];
  foco: string;
  renda_mensal?: number;
  gastos_fixos?: number;
  gastos_variaveis?: number;
  investimentos?: number;
  disponivel?: number;
  ultima_atualizacao: number | null;
}

export default function ControlePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<FinanceiroState | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Formata o texto da estratégia para ficar "clean"
  const formatEstrategia = (text: string) => {
    return text
      // remover negrito markdown **titulo**
      .replace(/\*\*(.*?)\*\*/g, "$1")
      // transformar hifens em bullets
      .replace(/^\s*-\s+/gm, "• ")
      // normalizar múltiplas quebras de linha
      .replace(/\n{3,}/g, "\n\n");
  };
  
  // Campos editáveis
  const [tipoRenda, setTipoRenda] = useState<"mensal" | "diaria">("mensal");
  const [renda, setRenda] = useState("");
  const [gastosFixos, setGastosFixos] = useState("");
  const [gastosVariaveis, setGastosVariaveis] = useState("");
  const [investimentos, setInvestimentos] = useState("");
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [novaDivida, setNovaDivida] = useState({ nome: "", valor: "" });

  // Load state from backend
  useEffect(() => {
    const loadState = async () => {
      try {
        const token = sessionStorage.getItem("lifeos:token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const response = await fetch("http://localhost:8001/financeiro", {
          headers
        });
        const data = await response.json();
        console.log("[CONTROLE] Dados recebidos do backend:", data);
        setState(data);
        
        // Preencher campos editáveis com dados existentes
        if (data.renda_mensal) setRenda(String(data.renda_mensal));
        if (data.gastos_fixos) setGastosFixos(String(data.gastos_fixos));
        if (data.gastos_variaveis) setGastosVariaveis(String(data.gastos_variaveis || 0));
        if (data.investimentos) setInvestimentos(String(data.investimentos || 0));
        if (data.dividas) setDividas(data.dividas);
      } catch (error) {
        console.error("Erro ao carregar estado:", error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, []);
  
  const handleSalvar = async () => {
    try {
      const token = sessionStorage.getItem("lifeos:token");
      const rendaMensal = tipoRenda === "diaria" ? parseFloat(renda || "0") * 30 : parseFloat(renda || "0");
      
      const payload = {
        monthly_income: rendaMensal,
        fixed_expenses: parseFloat(gastosFixos || "0"),
        variable_expenses: parseFloat(gastosVariaveis || "0"),
        investments: parseFloat(investimentos || "0"),
        has_debts: dividas.length > 0,
        debts: dividas.map(d => ({
          name: d.nome || d.descricao || "Dívida",
          amount: d.valor
        }))
      };
      
      await fetch("http://localhost:8001/financeiro/atualizar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      // Recarregar dados
      const response = await fetch("http://localhost:8001/financeiro", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setState(data);
      setEditMode(false);
      alert("Dados salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar dados");
    }
  };
  
  const handleAdicionarDivida = () => {
    if (novaDivida.nome && novaDivida.valor) {
      setDividas([...dividas, {
        nome: novaDivida.nome,
        valor: parseFloat(novaDivida.valor)
      }]);
      setNovaDivida({ nome: "", valor: "" });
    }
  };
  
  const handleRemoverDivida = (index: number) => {
    setDividas(dividas.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="controle-page">Carregando...</div>;
  }

  const totalDivida = dividas.reduce((sum, d) => sum + d.valor, 0);
  const rendaMensal = parseFloat(renda || "0");
  const totalGastos = parseFloat(gastosFixos || "0") + parseFloat(gastosVariaveis || "0");
  const disponivel = rendaMensal - totalGastos;
  
  const faseNum = state?.fase ? Number(state.fase) : 1;
  const faseTexto = faseNum === 1 ? "ATAQUE" : 
                     faseNum === 2 ? "PLANEJAMENTO" : 
                     faseNum === 3 ? "CRESCIMENTO" : "CRESCIMENTO";

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
                <span className="info-valor">{faseTexto}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Disponível:</span>
                <span className="info-valor">${disponivel.toFixed(2)} / mês</span>
              </div>
            </div>
          </div>

          {/* DADOS FINANCEIROS */}
          <div className="bloco">
            <h3 className="bloco-titulo">DADOS FINANCEIROS</h3>
            <div className="bloco-conteudo">
              {!editMode ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Renda:</span>
                    <span className="info-valor">${rendaMensal.toFixed(2)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gastos Fixos:</span>
                    <span className="info-valor">${parseFloat(gastosFixos || "0").toFixed(2)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gastos Variáveis:</span>
                    <span className="info-valor">${parseFloat(gastosVariaveis || "0").toFixed(2)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Investimentos:</span>
                    <span className="info-valor">${parseFloat(investimentos || "0").toFixed(2)}</span>
                  </div>
                  <button 
                    style={{marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer'}}
                    onClick={() => setEditMode(true)}
                  >
                    Editar Dados
                  </button>
                </>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9em'}}>
                      Tipo de Renda:
                    </label>
                    <select 
                      value={tipoRenda} 
                      onChange={(e) => setTipoRenda(e.target.value as "mensal" | "diaria")}
                      style={{width: '100%', padding: '0.5rem'}}
                    >
                      <option value="mensal">Mensal (Fixo)</option>
                      <option value="diaria">Diária (Autônomo)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9em'}}>
                      Renda {tipoRenda === "diaria" ? "Diária" : "Mensal"} (R$):
                    </label>
                    <input 
                      type="number" 
                      value={renda}
                      onChange={(e) => setRenda(e.target.value)}
                      style={{width: '100%', padding: '0.5rem'}}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9em'}}>
                      Gastos Fixos (R$):
                    </label>
                    <input 
                      type="number" 
                      value={gastosFixos}
                      onChange={(e) => setGastosFixos(e.target.value)}
                      style={{width: '100%', padding: '0.5rem'}}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9em'}}>
                      Gastos Variáveis (R$):
                    </label>
                    <input 
                      type="number" 
                      value={gastosVariaveis}
                      onChange={(e) => setGastosVariaveis(e.target.value)}
                      style={{width: '100%', padding: '0.5rem'}}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.25rem', fontSize: '0.9em'}}>
                      Investimentos (R$):
                    </label>
                    <input 
                      type="number" 
                      value={investimentos}
                      onChange={(e) => setInvestimentos(e.target.value)}
                      style={{width: '100%', padding: '0.5rem'}}
                      placeholder="0.00"
                    />
                  </div>
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
                    <button onClick={handleSalvar} style={{flex: 1, padding: '0.5rem', cursor: 'pointer'}}>
                      Salvar
                    </button>
                    <button onClick={() => setEditMode(false)} style={{flex: 1, padding: '0.5rem', cursor: 'pointer'}}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VISÃO FINANCEIRA / DÍVIDAS */}
          <div className="bloco">
            <h3 className="bloco-titulo">DÍVIDAS</h3>
            <div className="bloco-conteudo">
              {dividas.length > 0 ? (
                <div className="dividas-secao">
                  {dividas.map((d, idx) => (
                    <div key={idx} className="divida-linha" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>{d.nome || d.descricao || "Dívida"}</span>
                      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                        <span className="valor">${d.valor.toFixed(2)}</span>
                        {editMode && (
                          <button onClick={() => handleRemoverDivida(idx)} style={{fontSize: '0.8em', padding: '0.25rem 0.5rem', cursor: 'pointer'}}>
                            ❌
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="divida-separador"></div>
                  <div className="divida-linha destaque">
                    <span><strong>Total em risco</strong></span>
                    <span className="valor"><strong>${totalDivida.toFixed(2)}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="sem-dividas">Nenhuma dívida cadastrada</p>
              )}
              
              {editMode && (
                <div style={{marginTop: '1rem', padding: '1rem', border: '1px dashed #666', borderRadius: '4px'}}>
                  <h4 style={{marginBottom: '0.5rem'}}>Adicionar Dívida</h4>
                  <input 
                    type="text" 
                    placeholder="Nome da dívida"
                    value={novaDivida.nome}
                    onChange={(e) => setNovaDivida({...novaDivida, nome: e.target.value})}
                    style={{width: '100%', padding: '0.5rem', marginBottom: '0.5rem'}}
                  />
                  <input 
                    type="number" 
                    placeholder="Valor"
                    value={novaDivida.valor}
                    onChange={(e) => setNovaDivida({...novaDivida, valor: e.target.value})}
                    style={{width: '100%', padding: '0.5rem', marginBottom: '0.5rem'}}
                  />
                  <button onClick={handleAdicionarDivida} style={{width: '100%', padding: '0.5rem', cursor: 'pointer'}}>
                    Adicionar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="painel-direito">
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

          {/* ESTRATÉGIA ATUAL */}
          <div className="bloco">
            <h3 className="bloco-titulo">ESTRATÉGIA ATUAL</h3>
            <div className="bloco-conteudo">
              <div className="foco-principal" style={{whiteSpace: 'pre-wrap', lineHeight: '1.8'}}>
                {state?.foco ? formatEstrategia(state.foco) : "Configure seus dados e converse com a IA para criar sua estratégia"}
              </div>
              {state?.foco && (
                <p className="objetivo" style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #333'}}>Renda: ${rendaMensal.toFixed(2)} | Gastos: ${totalGastos.toFixed(2)} | Disponível: ${disponivel.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* AÇÃO ÚNICA DO DIA */}
          <div className="bloco">
            <h3 className="bloco-titulo">AÇÃO ÚNICA DO DIA</h3>
            <div className="bloco-conteudo">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Separei $20 hoje</span>
              </label>
            </div>
          </div>

          {/* CONFIRMAÇÕES */}
          <div className="bloco">
            <h3 className="bloco-titulo">CONFIRMAÇÕES</h3>
            <div className="bloco-conteudo">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Não criei novos gastos hoje</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Segui o plano definido</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========== AÇÕES FIXAS ========== */}
      <div className="acoes-fixas">
        <button className="btn-primary" onClick={() => navigate("/chat")}>
          Falar com a IA para criar estratégia
        </button>
        <button className="btn-secondary" onClick={() => setEditMode(true)}>
          Ajustar Dados
        </button>
        <button className="btn-tertiary">
          Encerrar Dia
        </button>
      </div>
    </div>
  );
}
