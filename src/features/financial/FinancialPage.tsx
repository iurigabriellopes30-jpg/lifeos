import Card from "../../components/ui/Card";

export default function FinancialPage() {
  return (
    <div style={{ maxWidth: "900px" }}>
      {/* BLOCO 1 - CABEÇALHO */}
      <header style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, margin: "0 0 8px 0" }}>FINANCEIRO</h1>
        <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>FASE ATUAL DO ANO — PRIORIDADE MÁXIMA</p>
      </header>

      {/* BLOCO 2 - VISÃO RÁPIDA */}
      <Card>
        <h3 style={{ margin: "0 0 16px 0" }}>VISÃO RÁPIDA</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div><strong>Total:</strong> R$ 5.000</div>
          <div><strong>Prazo alvo:</strong> 12 meses</div>
          <div><strong>Ritmo:</strong> R$ 416,67 / mês</div>
          <div style={{ opacity: 0.7 }}>(R$ 13,89 / dia)</div>
        </div>
      </Card>

      {/* BLOCO 3 - MAPA MENTAL */}
      <Card>
        <h3 style={{ margin: "0 0 24px 0" }}>MAPA MENTAL — ESTRATÉGIA</h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* DÍVIDA */}
          <div style={{
            padding: "12px 16px",
            background: "#dc2626",
            color: "white",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            fontWeight: 600,
            marginBottom: 12
          }}>
            DÍVIDA
          </div>

          {/* Seta */}
          <div style={{ fontSize: 20, marginBottom: 12 }}>↓</div>

          {/* FASE 1 */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            marginBottom: 12
          }}>
            <strong>FASE 1</strong><br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>parar sangria</span>
          </div>

          {/* Seta */}
          <div style={{ fontSize: 20, marginBottom: 12 }}>↓</div>

          {/* FASE 2 */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            marginBottom: 12
          }}>
            <strong>FASE 2</strong><br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>valor total / prazo alvo</span>
          </div>

          {/* Seta */}
          <div style={{ fontSize: 20, marginBottom: 12 }}>↓</div>

          {/* FASE 3 */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            marginBottom: 12
          }}>
            <strong>FASE 3</strong><br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>R$ 416,67 / mês (R$ 13,89 / dia)</span>
          </div>

          {/* Seta */}
          <div style={{ fontSize: 20, marginBottom: 12 }}>↓</div>

          {/* FASE 4 */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(0,0,0,0.05)",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            marginBottom: 12
          }}>
            <strong>FASE 4</strong><br />
            <span style={{ fontSize: 12, opacity: 0.7 }}>repetir plano até concluir</span>
          </div>

          {/* Seta */}
          <div style={{ fontSize: 20, marginBottom: 12 }}>↓</div>

          {/* FASE 5 */}
          <div style={{
            padding: "12px 16px",
            background: "#16a34a",
            color: "white",
            borderRadius: 8,
            minWidth: "200px",
            textAlign: "center",
            fontWeight: 600
          }}>
            FASE 5 — ZERADO
          </div>
        </div>
      </Card>

      {/* BLOCO 4 - ORDEM DE ATAQUE */}
      <Card>
        <h3 style={{ margin: "0 0 16px 0" }}>ORDEM DE ATAQUE</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Dívida 1 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong>Dívida 1</strong>
              <span>70%</span>
            </div>
            <div style={{
              width: "100%",
              height: 8,
              background: "rgba(0,0,0,0.1)",
              borderRadius: 4,
              overflow: "hidden"
            }}>
              <div style={{
                width: "70%",
                height: "100%",
                background: "#2563eb",
                borderRadius: 4
              }}></div>
            </div>
          </div>

          {/* Dívida 2 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong>Dívida 2</strong>
              <span>30%</span>
            </div>
            <div style={{
              width: "100%",
              height: 8,
              background: "rgba(0,0,0,0.1)",
              borderRadius: 4,
              overflow: "hidden"
            }}>
              <div style={{
                width: "30%",
                height: "100%",
                background: "#2563eb",
                borderRadius: 4
              }}></div>
            </div>
          </div>

          {/* Dívida 3 */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <strong>Dívida 3</strong>
              <span>0%</span>
            </div>
            <div style={{
              width: "100%",
              height: 8,
              background: "rgba(0,0,0,0.1)",
              borderRadius: 4,
              overflow: "hidden"
            }}>
              <div style={{
                width: "0%",
                height: "100%",
                background: "#2563eb",
                borderRadius: 4
              }}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* BLOCO 5 - FOCO ATUAL */}
      <Card>
        <h3 style={{ margin: "0 0 16px 0" }}>FOCO ATUAL</h3>
        <div style={{ lineHeight: 1.6 }}>
          <p><strong>Esta semana:</strong></p>
          <p style={{ margin: "8px 0 0 0" }}>→ manter R$ 13,89 / dia</p>
        </div>
      </Card>
    </div>
  );
}
