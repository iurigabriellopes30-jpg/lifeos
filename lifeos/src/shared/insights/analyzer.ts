import { getLifeContext } from "./context";

export type InsightType = "info" | "warning";
export type Insight = { type: InsightType; message: string };

/**
 * Analyze the life context and produce a list of neutral, objective insights.
 */
export async function analyzeLifeContext(): Promise<Insight[]> {
  const ctx = await getLifeContext();
  const insights: Insight[] = [];

  // Provide a short summary insight
  insights.push({ type: "info", message: `Tarefas abertas: ${ctx.openTasks}` });

  // Habits at risk
  if (ctx.habitsAtRisk > 0) {
    insights.push({ type: "warning", message: `Há ${ctx.habitsAtRisk} hábito(s) em risco hoje.` });
  }

  // Overload level
  if (ctx.overloadLevel === "alto") {
    insights.push({ type: "warning", message: `Carga alta hoje — avalie prioridades.` });
  } else if (ctx.overloadLevel === "médio") {
    insights.push({ type: "info", message: `Carga moderada hoje.` });
  } else {
    insights.push({ type: "info", message: `Dia tranquilo.` });
  }

  // If there are many open tasks, signal it
  if (ctx.openTasks >= 10) {
    insights.push({ type: "warning", message: `Número elevado de tarefas em aberto: ${ctx.openTasks}.` });
  } else if (ctx.openTasks >= 5) {
    insights.push({ type: "info", message: `Há várias tarefas em aberto.` });
  }

  return insights;
}
