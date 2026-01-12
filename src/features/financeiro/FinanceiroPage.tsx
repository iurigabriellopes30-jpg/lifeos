export default function FinanceiroPage() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* HEADER PRINCIPAL */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", margin: "0 0 12px", fontWeight: "bold" }}>
          FINANCEIRO
        </h1>
        <p style={{ fontSize: "18px", color: "#666", margin: 0 }}>
          FASE ATUAL DO ANO — PRIORIDADE MÁXIMA
        </p>
      </div>

      {/* CARD 1 — VISÃO RÁPIDA */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>VISÃO RÁPIDA</h2>
        <div style={{ lineHeight: "1.8", color: "#333" }}>
          <p style={{ margin: "8px 0" }}>• Total: R$ 5.000</p>
          <p style={{ margin: "8px 0" }}>• Prazo alvo: 12 meses</p>
          <p style={{ margin: "8px 0" }}>• Ritmo: R$ 416 / mês (R$ 14 / dia)</p>
        </div>
      </div>

      {/* CARD 2 — MAPA MENTAL */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "24px" }}>MAPA MENTAL — ESTRATÉGIA</h2>
        <div style={{ lineHeight: "2.2", color: "#333", fontSize: "16px", textAlign: "center" }}>
          <p style={{ margin: 0 }}>DÍVIDA</p>
          <p style={{ margin: 0, fontSize: "20px" }}>↓</p>
          <p style={{ margin: 0 }}>FASE 1 — parar sangria</p>
          <p style={{ margin: 0, fontSize: "20px" }}>↓</p>
          <p style={{ margin: 0 }}>FASE 2 — valor total / prazo alvo</p>
          <p style={{ margin: 0, fontSize: "20px" }}>↓</p>
          <p style={{ margin: 0 }}>FASE 3 — R$ X por mês (R$ Y por dia)</p>
          <p style={{ margin: 0, fontSize: "20px" }}>↓</p>
          <p style={{ margin: 0 }}>FASE 4 — repetir plano</p>
          <p style={{ margin: 0, fontSize: "20px" }}>↓</p>
          <p style={{ margin: 0, fontWeight: "bold" }}>FASE 5 — ZERADO</p>
        </div>
      </div>

      {/* CARD 3 — ORDEM DE ATAQUE */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>ORDEM DE ATAQUE</h2>
        <div style={{ lineHeight: "1.8", color: "#333" }}>
          <p style={{ margin: "8px 0" }}>• Dívida 1 — 70%</p>
          <p style={{ margin: "8px 0" }}>• Dívida 2 — 30%</p>
          <p style={{ margin: "8px 0" }}>• Dívida 3 — 0%</p>
        </div>
      </div>

      {/* CARD 4 — FOCO ATUAL */}
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: "16px" }}>FOCO ATUAL</h2>
        <div style={{ lineHeight: "1.8", color: "#333" }}>
          <p style={{ margin: "8px 0" }}>Esta semana:</p>
          <p style={{ margin: "8px 0", fontWeight: "bold" }}>→ manter R$ 14 / dia</p>
        </div>
      </div>
    </div>
  );
}
