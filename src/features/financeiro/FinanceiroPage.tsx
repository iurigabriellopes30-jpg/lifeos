import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

export default function FinanceiroPage() {
  return (
    <div className="financeiro">
      <PageHeader
        title="Financeiro"
        subtitle="Gestão financeira integrada ao LifeOS"
      />

      {/* Fase Atual */}
      <div style={{ marginBottom: 32 }}>
        <Card>
          <h2>📊 Fase Atual</h2>
          <p style={{ color: "#666" }}>
            Este item é gerenciado pelo LifeOS no chat.
          </p>
        </Card>
      </div>

      {/* Visão Rápida */}
      <div style={{ marginBottom: 32 }}>
        <Card>
          <h2>👁️ Visão Rápida</h2>
          <p style={{ color: "#666" }}>
            Este item é gerenciado pelo LifeOS no chat.
          </p>
        </Card>
      </div>

      {/* Mapa Mental por Fases */}
      <div style={{ marginBottom: 32 }}>
        <Card>
          <h2>🗺️ Mapa Mental por Fases</h2>
          <p style={{ color: "#666" }}>
            Este item é gerenciado pelo LifeOS no chat.
          </p>
        </Card>
      </div>

      {/* Ordem de Ataque */}
      <div style={{ marginBottom: 32 }}>
        <Card>
          <h2>⚔️ Ordem de Ataque</h2>
          <p style={{ color: "#666" }}>
            Este item é gerenciado pelo LifeOS no chat.
          </p>
        </Card>
      </div>

      {/* Foco Atual da Semana */}
      <div style={{ marginBottom: 32 }}>
        <Card>
          <h2>🎯 Foco Atual da Semana</h2>
          <p style={{ color: "#666" }}>
            Este item é gerenciado pelo LifeOS no chat.
          </p>
        </Card>
      </div>
    </div>
  );
}
