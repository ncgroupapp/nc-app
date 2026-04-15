import { format, isValid, parseISO } from 'date-fns'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const ISO_CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseCalendarDate(value?: string): Date | undefined {
  if (!value) return undefined

  const calendarMatch = value.match(ISO_CALENDAR_DATE_PATTERN)
  if (calendarMatch) {
    const [, year, month, day] = calendarMatch
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return isValid(parsed) ? parsed : undefined
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function formatCalendarDate(value?: string, dateFormat = 'dd/MM/yyyy'): string {
  const parsed = parseCalendarDate(value)
  return parsed ? format(parsed, dateFormat) : '—'
}

export function isTokenExpired(token: string) {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    
    if (exp) {
      return Date.now() >= exp * 1000;
    }
    return false;
  } catch (error) {
    return true;
  }
}

export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export function removeClientCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

