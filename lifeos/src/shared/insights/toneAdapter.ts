import { Tone } from "../tone";

export type Adapted = {
  message: string;
  actions: string[];
};

export function adaptInsight(insightType: string, baseMessage: string, tone: Tone): Adapted {
  const msg = baseMessage.toLowerCase();

  // Helper to map actions per tone
  function mapActions(base: string[], t: Tone) {
    // actions disabled until IA is integrated — no action buttons in the UI
    return [];
  }

  // HABITS
  if (msg.includes("hábito") || msg.includes("hábitos")) {
    if (tone === "calm") {
      return {
        message: "Talvez seja um bom momento para desacelerar.",
        actions: [],
      }; 
    }

    if (tone === "balanced") {
      return {
        message: "Há itens da rotina em risco hoje. Considere priorizar o essencial.",
        actions: [],
      }; 
    }

    return {
      message: "Há itens da rotina em risco — corrija hoje.",
      actions: [],
    }; 
  }

  // OVERLOAD / CARGA
  if (msg.includes("carga") || msg.includes("carga alta") || msg.includes("carga moderada") || msg.includes("overload")) {
    if (tone === "calm") {
      return {
        message: "Talvez seja um bom momento para desacelerar.",
        actions: [],
      }; 
    }

    if (tone === "balanced") {
      return {
        message: "Carga moderada — considere reorganizar hoje.",
        actions: [],
      }; 
    }

    return {
      message: "Carga alta — reorganize suas prioridades.",
      actions: [],
    }; 
  }

  // TASKS
  if (msg.includes("tarefas") || msg.includes("tarefas abertas") || msg.includes("tarefas em aberto")) {
    if (tone === "calm") {
      return {
        message: "Você tem algumas tarefas pendentes; vá devagar.",
        actions: [],
      }; 
    }

    if (tone === "balanced") {
      return {
        message: "Há tarefas em aberto — foque nas prioridades.",
        actions: [],
      }; 
    }

    return {
      message: "Muitas tarefas abertas — organize imediatamente.",
      actions: [],
    }; 
  }

  // fallback: use base message but adapt small prefix
  if (tone === "calm") {
    return { message: `Observação: ${baseMessage}`, actions: [] };
  }
  if (tone === "balanced") {
    return { message: baseMessage, actions: [] };
  }
  return { message: `Atenção — ${baseMessage}`, actions: [] };
}

export function adaptActionConfirmation(action: string, tone: Tone) {
  const a = action.toLowerCase();

  if (a.includes("reorganizar tarde") || a.includes("reorganizar agora")) {
    if (tone === "calm") {
      return {
        prompt: "Posso mover tarefas não essenciais para amanhã. Quer que eu faça isso?",
        confirmLabel: "Sim, por favor",
        cancelLabel: "Cancelar",
        successMessage: "Feito. Ajustei sua tarde.",
      };
    }

    if (tone === "balanced") {
      return {
        prompt: "Posso mover tarefas não essenciais para amanhã?",
        confirmLabel: "Confirmar",
        cancelLabel: "Cancelar",
        successMessage: "Feito. Ajustei sua tarde.",
      };
    }

    return {
      prompt: "Mover tarefas não essenciais para amanhã?",
      confirmLabel: "Confirmar",
      cancelLabel: "Cancelar",
      successMessage: "Feito. Ajustei sua tarde.",
    };
  }

  // default
  if (tone === "calm") {
    return {
      prompt: `Quer que eu execute: ${action}?`,
      confirmLabel: "Sim",
      cancelLabel: "Cancelar",
      successMessage: "Feito.",
    };
  }

  if (tone === "balanced") {
    return {
      prompt: `Deseja executar: ${action}?`,
      confirmLabel: "Confirmar",
      cancelLabel: "Cancelar",
      successMessage: "Feito.",
    };
  }

  return {
    prompt: `${action}?`,
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
    successMessage: "Feito.",
  };
}
