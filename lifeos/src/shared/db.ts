import Dexie, { Table } from "dexie";

/* ===== TYPES ===== */

export type Priority = "essential" | "important" | "optional";

export type Task = {
  id: number;
  title: string;
  done: boolean;
  priority?: Priority; // optional for backward compatibility
};

export type Frequency = "daily" | "weekly";

export type Habit = {
  id: number;
  title: string;
  done: boolean; // kept for compatibility
  frequency?: Frequency;
  lastDoneAt?: number; // timestamp of last completion
  createdAt?: number;
  scheduledWeekday?: number; // 0-6 (used for weekly habits)
};

export type Energy = 'alta' | 'media' | 'baixa';

export type CalendarEvent = {
  id: number;
  title: string;
  date: string; // formato YYYY-MM-DD
  time?: string; // HH:MM
  energy?: Energy;
};

/* ===== DATABASE ===== */

export type RoutineRecord = {
  id: number;
  text: string;
  date: number; // timestamp
  origin: "chat" | "manual";
  confirmed?: boolean; // explicit user confirmation required for chat-origin
};

class LifeOSDB extends Dexie {
  tasks!: Table<Task, number>;
  habits!: Table<Habit, number>;
  calendar!: Table<CalendarEvent, number>;
  routines!: Table<RoutineRecord, number>;

  constructor() {
    super("LifeOSDB");

    // versão 3: adiciona campos de data/horário/energia nos eventos do calendário
    this.version(3).stores({
      tasks: "id, title, done, priority, scheduledFor",
      habits: "id, title, done, frequency, lastDoneAt",
      calendar: "id, title, date, time, energy",
    });

    // versão 4: registra entradas de rotina (origin: chat/manual)
    this.version(4).stores({
      tasks: "id, title, done, priority, scheduledFor",
      habits: "id, title, done, frequency, lastDoneAt",
      calendar: "id, title, date, time, energy",
      routines: "id, date, origin",
    });

    // versão 5: adiciona confirmed flag para rotinas oriundas de chat
    this.version(5).stores({
      tasks: "id, title, done, priority, scheduledFor",
      habits: "id, title, done, frequency, lastDoneAt",
      calendar: "id, title, date, time, energy",
      routines: "id, date, origin, confirmed",
    });
  }
}

export const db = new LifeOSDB();

// === Cleanup: remove registros automáticos não confirmados ou testes ===
export async function cleanupRoutines(): Promise<number> {
  const testRegex = /^(oi|olá|ola|ok|teste|test|hello|hi)$/i;
  const toDelete: number[] = [];
  const all = await db.routines.toArray();
  for (const r of all) {
    const text = (r.text || "").trim();
    const isVeryShort = text.length < 4;
    const isTest = testRegex.test(text);
    const unconfirmedChat = r.origin === "chat" && r.confirmed !== true;
    if (unconfirmedChat || isVeryShort || isTest) {
      toDelete.push(r.id);
    }
  }
  if (toDelete.length) await db.routines.bulkDelete(toDelete);
  return toDelete.length;
}
