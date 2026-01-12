import Dexie, { Table } from "dexie";

/* ===== TYPES ===== */

export type Task = {
  id: number;
  title: string;
  done: boolean;
};

export type Habit = {
  id: number;
  title: string;
  done: boolean;
};

export type CalendarEvent = {
  id: number;
  title: string;
};

/* ===== DATABASE ===== */

class LifeOSDB extends Dexie {
  tasks!: Table<Task, number>;
  habits!: Table<Habit, number>;
  calendar!: Table<CalendarEvent, number>;

  constructor() {
    super("LifeOSDB");

    this.version(1).stores({
      tasks: "id, title, done",
      habits: "id, title, done",
      calendar: "id, title",
    });
  }
}

export const db = new LifeOSDB();
