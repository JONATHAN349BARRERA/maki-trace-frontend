/** Utilidades de fecha puras; reciben "ahora" para poder probarse de forma determinista. */
export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

export const hoursBetween = (fromIso: string, to: Date | string) =>
  (new Date(to).getTime() - new Date(fromIso).getTime()) / HOUR_MS;

export const daysBetween = (fromIso: string, to: Date | string) =>
  Math.floor((new Date(to).getTime() - new Date(fromIso).getTime()) / DAY_MS);

export const todayIso = (now: Date = new Date()) => now.toISOString().slice(0, 10);
