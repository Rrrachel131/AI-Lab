import type { DataSnapshot } from "./types";

/**
 * Persistence boundary. Phase 1 ships the local adapter (localStorage + IndexedDB).
 * A cloud adapter (Lovable Cloud database / auth / storage) implements the same
 * interface so pages never talk to storage directly.
 */
export interface DataAdapter {
  mode: "local" | "cloud";
  label: string;
  load(): Promise<DataSnapshot | null>;
  save(snapshot: DataSnapshot): Promise<void>;
}

export const DATA_MODE: DataAdapter["mode"] = "local";
