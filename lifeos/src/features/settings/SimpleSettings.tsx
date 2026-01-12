import { useRef, useState } from "react";
import "./SimpleSettings.css";

type Tone = "calmo" | "direto" | "rigido";

interface SimpleSettingsProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export default function SimpleSettings({ theme, onToggleTheme }: SimpleSettingsProps) {
  const [tone, setTone] = useState<Tone>(() => {
    const saved = localStorage.getItem("lifeos-tone");
    return (saved as Tone) || "direto";
  });

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone);
    localStorage.setItem("lifeos-tone", newTone);
  };

  const handleExport = async () => {
    try {
      // Fetch state
      const stateResponse = await fetch("http://localhost:8001/financeiro");
      const state = await stateResponse.json();

      // Fetch history if exists
      let history = null;
      try {
        const historyResponse = await fetch("http://localhost:8001/financeiro/historico");
        if (historyResponse.ok) {
          history = await historyResponse.json();
        }
      } catch {}

      // Create export object
      const exportData = {
        state: { financeiro: state },
        history: history,
        exportedAt: new Date().toISOString(),
      };

      // Download as JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lifeos-export-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Dados exportados com sucesso!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      setMessage({ type: "error", text: "Erro ao exportar dados." });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate structure
      if (!importData.state || !importData.state.financeiro) {
        throw new Error("Estrutura de arquivo inválida");
      }

      // Prepare update payload
      const payload = {
        message: "importei meus dados",
        context: {
          importedState: importData.state.financeiro,
          importedHistory: importData.history,
        },
      };

      // Send to backend for processing
      const response = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao processar importação no backend");
      }

      // Dispatch update event
      window.dispatchEvent(new CustomEvent("lifeosStateUpdated"));

      setMessage({ type: "success", text: "Dados importados com sucesso!" });
      setTimeout(() => setMessage(null), 3000);

      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Erro ao importar:", error);
      setMessage({ type: "error", text: "Erro ao importar dados." });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Configurações</h1>
        <p className="settings-subtitle">Personalização do LifeOS</p>
      </div>

      <div className="settings-container">
        {/* CARD 1: APARÊNCIA */}
        <div className="settings-card">
          <h2>Aparência</h2>
          
          <div className="settings-content">
            <div className="setting-row">
              <span className="setting-label">Tema</span>
              <button 
                onClick={onToggleTheme}
                className="theme-toggle"
              >
                {theme === "light" ? "☀️ Claro" : "🌙 Escuro"}
              </button>
            </div>

            <div className="setting-row">
              <span className="setting-label">Tom do LifeOS</span>
              <div className="tone-selector">
                <button
                  className={`tone-btn ${tone === "calmo" ? "active" : ""}`}
                  onClick={() => handleToneChange("calmo")}
                >
                  Calmo
                </button>
                <button
                  className={`tone-btn ${tone === "direto" ? "active" : ""}`}
                  onClick={() => handleToneChange("direto")}
                >
                  Direto
                </button>
                <button
                  className={`tone-btn ${tone === "rigido" ? "active" : ""}`}
                  onClick={() => handleToneChange("rigido")}
                >
                  Rígido
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: DADOS */}
        <div className="settings-card">
          <h2>Dados</h2>
          
          <div className="settings-content">
            <div className="data-buttons">
              <button 
                onClick={handleExport}
                className="btn-data btn-export"
              >
                📥 Exportar Dados
              </button>
              <button 
                onClick={handleImport}
                className="btn-data btn-import"
              >
                📤 Importar Dados
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            <p className="data-description">
              Salva seu estado financeiro e histórico de transações
            </p>
          </div>
        </div>

        {/* CARD 3: SISTEMA */}
        <div className="settings-card">
          <h2>Sistema</h2>
          
          <div className="settings-content">
            <div className="system-info">
              <div className="info-row">
                <span className="info-label">Versão</span>
                <span className="info-value">LifeOS v1.0</span>
              </div>
              <div className="info-row">
                <span className="info-label">Módulo</span>
                <span className="info-value">Controle Financeiro</span>
              </div>
              <div className="info-row">
                <span className="info-label">Atualizado</span>
                <span className="info-value">{new Date().toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MENSAGEM DE STATUS */}
      {message && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
