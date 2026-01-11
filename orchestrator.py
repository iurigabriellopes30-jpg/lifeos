import os
import sys
from datetime import datetime


# =========================
# UTILIDADES
# =========================

def log(msg: str):
    print(f"[ORCHESTRATOR] {msg}")


BASE_DIR = os.path.abspath(os.getcwd())


# =========================
# COMANDOS
# =========================

def criar_esqueleto_lifeos():
    log("Criando esqueleto do LifeOS...")

    estrutura = [
        "lifeos/src/features/tasks",
        "lifeos/src/features/habits",
        "lifeos/src/features/calendar",
        "lifeos/src/shared/ui",
        "lifeos/src/shared/db",
        "lifeos/src/shared/crypto",
        "lifeos/src/shared/types",
        "lifeos/src/shared/utils",
        "lifeos/public",
    ]

    for pasta in estrutura:
        caminho = os.path.join(BASE_DIR, pasta)
        os.makedirs(caminho, exist_ok=True)
        log(f"Pasta criada: {pasta}")

    arquivos = {
        "lifeos/src/main.jsx": """\
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
""",
        "lifeos/index.html": """\
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>LifeOS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
""",
        "lifeos/README.md": "# LifeOS\n\nSistema operacional pessoal.",
    }

    for caminho_rel, conteudo in arquivos.items():
        caminho = os.path.join(BASE_DIR, caminho_rel)
        if not os.path.exists(caminho):
            with open(caminho, "w", encoding="utf-8") as f:
                f.write(conteudo)
            log(f"Arquivo criado: {caminho_rel}")

    log("✅ Esqueleto do LifeOS criado com sucesso.")


def criar_app_base():
    log("Criando App base com layout simples...")

    app_tsx = """\
import React from "react";

export default function App() {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside style={{ width: 220, background: "#111", color: "#fff", padding: 16 }}>
        <h2>LifeOS</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>Dashboard</li>
          <li>Tarefas</li>
          <li>Hábitos</li>
          <li>Agenda</li>
        </ul>
      </aside>

      <main style={{ flex: 1, padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Bem-vindo ao LifeOS. O sistema está funcionando.</p>
      </main>
    </div>
  );
}
"""

    caminho = os.path.join(BASE_DIR, "lifeos/src/App.tsx")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(app_tsx)

    log("Arquivo criado: lifeos/src/App.tsx")
    log("✅ App base criado com sucesso.")


# =========================
# DISPATCHER
# =========================

def executar_comando(comando: str):
    comando = comando.lower()

    if "esqueleto" in comando:
        criar_esqueleto_lifeos()

    elif "app base" in comando or "layout" in comando:
        criar_app_base()

    else:
        log("❌ Comando não reconhecido.")


# =========================
# ENTRY POINT
# =========================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        log("❌ Nenhum comando informado.")
        sys.exit(1)

    comando_usuario = sys.argv[1]
    log(f"Comando recebido: {comando_usuario}")
    executar_comando(comando_usuario)
