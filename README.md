# LifeOS

> **LifeOS não organiza sua vida.  
> Ele te devolve o controle sobre ela.**

LifeOS é um **sistema operacional pessoal com IA**, criado para ajudar pessoas a **manter disciplina, clareza e controle da própria vida**.

Não é apenas sobre tarefas, hábitos ou agenda.  
Isso é apenas o **começo**.

O objetivo do LifeOS é se tornar um **companheiro inteligente**, capaz de entender contexto, rotina, responsabilidades e decisões — e ajudar o usuário a **agir**, não apenas planejar.

---

## 🧠 Visão

A maioria das ferramentas atuais apenas **organiza informação**.  
O LifeOS existe para **organizar comportamento**.

No futuro, o LifeOS será capaz de:

- Ajudar você a **pagar contas em dia**
- Cobrar hábitos que você disse que queria manter
- Alertar quando sua rotina começa a sair do controle
- Ajudar a planejar semanas, meses e decisões importantes
- Servir como uma **IA disciplinadora**, não apenas reativa
- Evoluir junto com o usuário

O LifeOS não substitui decisões.  
Ele **te lembra do que você decidiu ser**.

---

## 🚧 Estado atual (MVP)

O projeto está em **fase inicial**, focado em construir a base sólida sobre a qual a IA irá atuar.

Funcionalidades atuais:

- ✅ **Tasks**
  - Criar, concluir e remover tarefas
  - Persistência local (IndexedDB)

- 🔁 **Habits**
  - Criar hábitos
  - Marcar progresso
  - Visual simples e direto

- 📅 **Calendar**
  - Registrar eventos e compromissos
  - Histórico local

- 📊 **Dashboard**
  - Visão geral do dia
  - Indicadores simples de pendências

- 🌗 **Tema Claro / Escuro**
- 💾 **Backup local (export/import)**

Essas features **não são o produto final** — são a fundação.

---

## 🤖 O papel da IA (futuro do projeto)

A IA no LifeOS não será um chatbot genérico.

Ela terá funções como:

- Analisar padrões de comportamento
- Detectar ciclos de procrastinação
- Ajudar a priorizar decisões reais
- Confrontar incoerências entre objetivos e ações
- Ajudar a reconstruir disciplina quando ela quebra

A IA **não substitui o usuário**.  
Ela atua como um **espelho inteligente e persistente**.

---

## 🔒 Filosofia

- **Local-first**
- **Sem login**
- **Sem dependência de cloud**
- **Sem dark patterns**
- **Privacidade total**
- **Controle sempre do usuário**

A vida do usuário **não é um produto**.

---

## 🛠️ Stack atual

- React + TypeScript
- Vite
- Dexie.js (IndexedDB)
- CSS puro
- Arquitetura baseada em features

A stack irá evoluir conforme a IA for introduzida.

---

## 🧱 Estrutura do projeto

```txt
src/
 ├─ components/
 ├─ features/
 │  ├─ tasks
 │  ├─ habits
 │  ├─ calendar
 │  ├─ dashboard
 │  └─ settings
 ├─ shared/
 ├─ styles/
 ├─ App.tsx
 └─ main.tsx

ATUALIZADO 10.01