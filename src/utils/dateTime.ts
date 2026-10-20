const pad = (n: number) => String(n).padStart(2, "0");

export function timeToDate(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export function dateToTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** format "AAAA-MM-JJ" (heure locale) */
export function todayIso(): string {
  return dateToIso(new Date());
}

/**
 * Dates par défaut
 */
export function defaultAdventDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const year =
    now.getMonth() === 11 && now.getDate() > 24
      ? now.getFullYear() + 1
      : now.getFullYear();
  return { startDate: `${year}-12-01`, endDate: `${year}-12-24` };
}
