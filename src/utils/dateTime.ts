const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

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

/** "2026-12-01" -> "Mardi 1er décembre" */
export function formatDayLong(iso: string): string {
  const d = isoToDate(iso);
  const day = d.getDate() === 1 ? "1er" : String(d.getDate());
  const text = `${WEEKDAYS[d.getDay()]} ${day} ${MONTHS[d.getMonth()]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** gère les changements de mois et d'année */
export function addDays(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return dateToIso(d);
}

/** Nombre de jours entre deux dates */
export function diffDays(fromIso: string, toIso: string): number {
  const ms = isoToDate(toIso).getTime() - isoToDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Date du jour "AAAA-MM-JJ" dans un fuseau donné (ex. "Europe/Paris"),
 * quel que soit le fuseau du téléphone. Corrige le décalage autour de minuit.
 */
export function todayInTimeZone(timeZone: string): string {
  try {
    const value = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  } catch {
    // Fuseau inconnu ou Intl indisponible : on retombe sur l'heure du téléphone
  }
  return todayIso();
}
