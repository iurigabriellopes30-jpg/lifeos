import { useEffect, useState } from "react";
import { apiUrl } from "../../shared/api";

type FinanceiroState = {
  id: number;
  faseAtual: number | null;
  totalDivida: number | null;
  prazoAlvoMeses: number | null;
  ritmoMensal: number | null;
  ritmoDiario: number | null;
  focoAtual: string | null;
  atualizadoEm: number;
};

export default function FinanceiroPage() {
  const [estado, setEstado] = useState<FinanceiroState | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFinanceiro() {
    try {
      const timestamp = Date.now();
      const res = await fetch(apiUrl(`/financeiro?t=${timestamp}`), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" }
      });
      const data: any = await res.json();
      const mapped: FinanceiroState = {
        id: 1,
        faseAtual: data?.fase ?? null,
        totalDivida: Array.isArray(data?.dividas) ? data.dividas.reduce((acc: number, d: any) => acc + (d.valor || 0), 0) : null,
        prazoAlvoMeses: null,
        ritmoMensal: null,
        ritmoDiario: null,
        focoAtual: data?.foco ?? null,
        atualizadoEm: data?.ultima_atualizacao ?? 0,
      };
      setEstado(mapped);
    } catch (err) {
      console.error("[FINANCEIRO] Erro ao carregar:", err);
      setEstado(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceiro();
    
    // Debounce para evitar múltiplos fetches simultâneos
    let timeoutId: NodeJS.Timeout | null = null;
    const handleStateUpdated = () => {
      console.log("[FINANCEIRO] Evento lifeosStateUpdated recebido, agendando refresh...");
      if (timeoutId) clearTimeout(timeoutId);
      // Refetch imediatamente, sem esperar
      loadFinanceiro();
      // Também refetch novamente após 500ms para garantir sincronização
      timeoutId = setTimeout(() => {
        console.log("[FINANCEIRO] Refresh agendado sendo executado...");
        loadFinanceiro();
      }, 500);
    };
    window.addEventListener("lifeosStateUpdated", handleStateUpdated);
    
    // Refetch every 2 seconds when page is visible
    const interval = setInterval(() => {
      loadFinanceiro();
    }, 2000);
    
    // Also listen for visibility changes
    const handleVisibility = () => {
      if (!document.hidden) {
        console.log("[FINANCEIRO] Página voltou visível, refazendo fetch...");
        loadFinanceiro();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("lifeosStateUpdated", handleStateUpdated);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const hasEstrategia = estado && (
    estado.faseAtual !== null ||
    estado.totalDivida !== null ||
    estado.focoAtual !== null
  );

  const phaseLabels: { [key: number]: string } = {
    1: "Parar sangria",
    2: "Definir total e prazo",
    3: "Calcular ritmo",
    4: "Executar e repetir",
    5: "Dívida zerada! 🎉"
  };

  return (
    <div className="page-container">
      <div className="card">
        <h1>FINANCEIRO</h1>
        <p className="subtitle">Fase atual do ano · Prioridade máxima</p>

        <div style={{
          padding: "16px",
          background: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          marginBottom: "24px",
          color: "#856404",
          fontWeight: 600
        }}>
          ✓ Gerenciado pelo LifeOS via Chat. Nenhuma edição manual permitida.
        </div>

        {!hasEstrategia ? (
          <div style={{
            padding: "32px",
            textAlign: "center",
            background: "#f8f9fa",
            borderRadius: "8px",
            color: "#666"
          }}>
            <p style={{ fontSize: "18px", marginBottom: "12px" }}>
              Nenhuma estratégia financeira iniciada.
            </p>
            <p style={{ fontSize: "14px" }}>
              Vá ao Chat e converse sobre seu financeiro para começar.
            </p>
          </div>
        ) : (
          <>
            {/* FASE ATUAL */}
            <section style={{ marginBottom: "24px" }}>
              <h2 style={{ marginBottom: "12px" }}>FASE ATUAL</h2>
              <div style={{
                padding: "20px",
                background: estado.faseAtual ? "#e3f2fd" : "#f8f9fa",
                border: estado.faseAtual ? "2px solid #1976d2" : "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "20px",
                fontWeight: 700,
                color: estado.faseAtual ? "#1976d2" : "#999"
              }}>
                {estado.faseAtual && phaseLabels[estado.faseAtual] ? (
                  <div>Fase {estado.faseAtual}: {phaseLabels[estado.faseAtual]}</div>
                ) : (
                  <div>Aguardando informações...</div>
                )}
              </div>
            </section>

            {/* DADOS PRINCIPAIS */}
            {(estado.totalDivida !== null || estado.prazoAlvoMeses !== null || estado.ritmoMensal !== null || estado.ritmoDiario !== null) && (
              <section style={{ marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "12px" }}>DADOS COLETADOS</h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px"
                }}>
                  {estado.totalDivida !== null && (
                    <div style={{
                      padding: "16px",
                      background: "#fff8e1",
                      borderRadius: "6px"
                    }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Total da dívida</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "#d32f2f" }}>R$ {estado.totalDivida.toFixed(2)}</div>
                    </div>
                  )}
                  {estado.prazoAlvoMeses !== null && (
                    <div style={{
                      padding: "16px",
                      background: "#e8f5e9",
                      borderRadius: "6px"
                    }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Prazo alvo</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "#388e3c" }}>{estado.prazoAlvoMeses} meses</div>
                    </div>
                  )}
                  {estado.ritmoMensal !== null && (
                    <div style={{
                      padding: "16px",
                      background: "#f3e5f5",
                      borderRadius: "6px"
                    }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Ritmo mensal</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "#7b1fa2" }}>R$ {estado.ritmoMensal.toFixed(2)}</div>
                    </div>
                  )}
                  {estado.ritmoDiario !== null && (
                    <div style={{
                      padding: "16px",
                      background: "#e1f5fe",
                      borderRadius: "6px"
                    }}>
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Ritmo diário</div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: "#0277bd" }}>R$ {estado.ritmoDiario.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* FOCO ATUAL */}
            {estado.focoAtual && (
              <section style={{ marginBottom: "24px" }}>
                <h2 style={{ marginBottom: "12px" }}>FOCO ATUAL</h2>
                <div style={{
                  padding: "16px",
                  background: "#eceff1",
                  border: "2px solid #455a64",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#455a64"
                }}>
                  → {estado.focoAtual}
                </div>
              </section>
            )}

            {/* ROADMAP DE FASES */}
            <section style={{ marginBottom: "24px" }}>
              <h2 style={{ marginBottom: "12px" }}>ROADMAP DE FASES</h2>
              <div style={{
                padding: "16px",
                background: "#f8f9fa",
                borderRadius: "8px"
              }}>
                {[1, 2, 3, 4, 5].map(phase => (
                  <div
                    key={phase}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      background: estado.faseAtual === phase ? "#e3f2fd" : estado.faseAtual && estado.faseAtual > phase ? "#c8e6c9" : "#fff",
                      border: estado.faseAtual === phase ? "2px solid #1976d2" : "1px solid #e0e0e0",
                      borderRadius: "6px",
                      fontWeight: estado.faseAtual === phase ? 700 : 500,
                      color: estado.faseAtual === phase ? "#1976d2" : estado.faseAtual && estado.faseAtual > phase ? "#2e7d32" : "#666"
                    }}>
                    <strong>Fase {phase}</strong> — {phaseLabels[phase] || ""}
                    {estado.faseAtual === phase && " ← aqui"}
                    {estado.faseAtual && estado.faseAtual > phase && " ✓"}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
