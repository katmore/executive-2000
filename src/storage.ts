import type { GameState } from "./state";

export interface SaveStore {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

const SAVE_KEY = "executive2000.save.v1";

export class LocalStorageStore implements SaveStore {
  load(): GameState | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GameState;
    } catch {
      return null;
    }
  }

  save(state: GameState): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
