import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function FinancialPage() {
  return (
    <div className="dashboard">
      <PageHeader
        title="Financeiro"
        subtitle="Visão financeira do mês"
      />

      {/* Fase Atual */}
      <Card>
        <h3>📊 Fase Atual</h3>
        <div style={{ marginTop: 12, padding: "12px", background: "rgba(0,0,0,0.05)", borderRadius: 8 }}>
          <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>Análise mensal em andamento</p>
          <div style={{ fontSize: 12, opacity: 0.6 }}>Aguardando entrada de dados...</div>
        </div>
      </Card>

      {/* Visão Rápida */}
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <Card>
          <h3>💰 Receita</h3>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>R$ 0,00</div>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Total do mês</p>
        </Card>

        <Card>
          <h3>💸 Despesa</h3>
          <div style={{ fontSize: 24, fontWeight: "bold", marginTop: 8 }}>R$ 0,00</div>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Total do mês</p>
        </Card>

        <Card>
          <h3>💵 Saldo</h3>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#16a34a", marginTop: 8 }}>R$ 0,00</div>
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Disponível</p>
        </Card>
      </div>

      {/* Mapa Mental por Fases */}
      <Card>
        <h3>🗺️ Mapa Mental por Fases</h3>
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8, marginBottom: 8 }}>
            <strong>Fase 1: Planejamento</strong>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0 0" }}>Definir orçamento e metas</p>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8, marginBottom: 8 }}>
            <strong>Fase 2: Controle</strong>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0 0" }}>Monitorar gastos diários</p>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
            <strong>Fase 3: Análise</strong>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0 0" }}>Revisar e otimizar gastos</p>
          </div>
        </div>
      </Card>

      {/* Ordem de Ataque */}
      <Card>
        <h3>🎯 Ordem de Ataque</h3>
        <div style={{ marginTop: 12 }}>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>1. Contas Essenciais</strong>
              <span style={{ fontSize: 12, opacity: 0.6 }}>Prioridade Máxima</span>
            </div>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>2. Investimentos</strong>
              <span style={{ fontSize: 12, opacity: 0.6 }}>Prioridade Alta</span>
            </div>
          </div>
          <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.03)", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>3. Lazer</strong>
              <span style={{ fontSize: 12, opacity: 0.6 }}>Prioridade Baixa</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Foco Atual da Semana */}
      <Card>
        <h3>🔍 Foco Atual da Semana</h3>
        <div style={{ marginTop: 12, padding: "12px", background: "rgba(37, 99, 235, 0.1)", borderRadius: 8 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Revisar e categorizar gastos</p>
          <p style={{ fontSize: 12, opacity: 0.7, margin: "8px 0 0 0" }}>
            Classificar transações por categoria para melhor entendimento do padrão de gastos
          </p>
        </div>
      </Card>
    </div>
  );
}
