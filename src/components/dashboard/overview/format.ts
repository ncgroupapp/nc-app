/** "$ 1,28 M", "US$ 3.180", "$ 86.400": short amounts for the dashboard. */
export function formatCompactMoney(value: number, currency: 'UYU' | 'USD' | string | null = 'UYU'): string {
  const symbol = currency === 'USD' ? 'US$' : '$';
  const abs = Math.abs(value);
  const sign = value < 0 ? '− ' : '';
  if (abs >= 1_000_000) {
    return `${sign}${symbol}\u00a0${(abs / 1_000_000).toLocaleString('es-UY', { maximumFractionDigits: 2 })} M`;
  }
  return `${sign}${symbol}\u00a0${abs.toLocaleString('es-UY', { maximumFractionDigits: 0 })}`;
}

/** "$ 1.284.500" */
export function formatFullMoney(value: number, currency: 'UYU' | 'USD' | string | null = 'UYU'): string {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${value < 0 ? '− ' : ''}${symbol}\u00a0${Math.abs(value).toLocaleString('es-UY', { maximumFractionDigits: 0 })}`;
}

/** Percentage change, null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-10" → "oct" */
export const shortMonth = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1] ?? month;
/** "2026-10" → "octubre" */
export const longMonth = (month: string) => MONTHS_LONG[Number(month.slice(5, 7)) - 1] ?? month;

/** "hace 12 min", "hace 3 h", "ayer 16:20", "28/10 09:15" */
export function timeAgo(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60_000));
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 6 * 60) return `hace ${Math.round(minutes / 60)} h`;
  const time = date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return `hoy ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `ayer ${time}`;
  return `${date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })} ${time}`;
}

/** 220 → "3 h 40 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours >= 48) return `${Math.round(hours / 24)} días`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** "2026-10-30" → "Viernes 30 de octubre" */
export function formatLongDay(isoDay: string): string {
  const [year, month, day] = isoDay.split('-').map(Number);
  const text = new Date(year, month - 1, day).toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
