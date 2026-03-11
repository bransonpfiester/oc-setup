import type { Stat, StatHistoryPoint } from "@/types/api";

export const statsStore = new Map<string, Stat>();
export const statHistoryStore = new Map<string, StatHistoryPoint[]>();
