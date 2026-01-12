/**
 * FINANCEIRO ACTION LAYER
 * 
 * Camada de execução real para operações financeiras.
 * Todas as mudanças no estado financeiro DEVEM passar por aqui.
 */

import { db } from "../shared/db";

/* ===== TYPES ===== */

export type Debt = {
  id: string;
  name: string;
  value: number;
};

export type FinanceState = {
  faseAtual: string | null;
  totalDivida: number | null;
  prazoAlvoMeses: number | null;
  ritmoMensal: number | null;
  ritmoDiario: number | null;
  focoAtual: string | null;
  ultimaAtualizacao: number;
};

/* ===== ACTIONS ===== */

/**
 * Adiciona uma dívida ao financeiro
 */
export async function addDebt(name: string, value: number): Promise<void> {
  if (value <= 0) {
    throw new Error("Valor deve ser maior que zero");
  }

  const current = await db.financeiro.get(1);
  const currentTotal = current?.totalDivida || 0;
  
  await db.financeiro.put({
    id: 1,
    faseAtual: "1", // Fase 1: Parar sangria
    totalDivida: currentTotal + value,
    prazoAlvoMeses: current?.prazoAlvoMeses || null,
    ritmoMensal: current?.ritmoMensal || null,
    ritmoDiario: current?.ritmoDiario || null,
    focoAtual: "Parar sangria",
    ultimaAtualizacao: Date.now(),
  });
}

/**
 * Remove uma dívida específica pelo valor
 */
export async function removeDebtByValue(value: number): Promise<void> {
  const current = await db.financeiro.get(1);
  
  if (!current || !current.totalDivida) {
    throw new Error("Não há dívidas para remover");
  }

  const newTotal = current.totalDivida - value;
  
  await db.financeiro.put({
    id: 1,
    faseAtual: newTotal > 0 ? current.faseAtual : null,
    totalDivida: newTotal > 0 ? newTotal : null,
    prazoAlvoMeses: current.prazoAlvoMeses,
    ritmoMensal: current.ritmoMensal,
    ritmoDiario: current.ritmoDiario,
    focoAtual: newTotal > 0 ? current.focoAtual : null,
    ultimaAtualizacao: Date.now(),
  });
}

/**
 * Remove TODAS as dívidas (zera o financeiro)
 */
export async function clearAllDebts(): Promise<void> {
  await db.financeiro.put({
    id: 1,
    faseAtual: null,
    totalDivida: null,
    prazoAlvoMeses: null,
    ritmoMensal: null,
    ritmoDiario: null,
    focoAtual: null,
    ultimaAtualizacao: Date.now(),
  });
}

/**
 * Retorna o estado atual do financeiro
 */
export async function getFinanceState(): Promise<FinanceState | null> {
  const state = await db.financeiro.get(1);
  
  if (!state) {
    return null;
  }
  
  return {
    faseAtual: state.faseAtual,
    totalDivida: state.totalDivida,
    prazoAlvoMeses: state.prazoAlvoMeses,
    ritmoMensal: state.ritmoMensal,
    ritmoDiario: state.ritmoDiario,
    focoAtual: state.focoAtual,
    ultimaAtualizacao: state.ultimaAtualizacao,
  };
}
