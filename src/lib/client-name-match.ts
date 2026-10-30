/**
 * Finds which client a free text refers to (a logo's file name, a name read from a document):
 * by RUT digits first, then by name ignoring case, accents, punctuation and legal suffixes
 * (S.A., S.R.L.…), acronyms included ("ASSE" ↔ "Administración de los Servicios de Salud del Estado").
 * Mirrors the backend's billing client matcher.
 */

export interface NamedClient {
  id: string | number
  name: string
  identifier?: string | null
}

const LEGAL_SUFFIXES = /\b(S\s?A\s?S|S\s?R\s?L|S\s?A|LTDA|SOCIEDAD ANONIMA|SOCIEDAD DE RESPONSABILIDAD LIMITADA|LIMITADA)\b/g
const STOPWORDS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y', 'E', 'EN', 'PARA', 'POR'])
/** Words that are often added to logo file names and say nothing about the client */
const FILE_WORDS = /\b(LOGO|LOGOTIPO|ISOLOGO|FINAL|NUEVO|COPIA|COPY|PNG|JPG|JPEG|WEBP|COLOR|BLANCO|NEGRO|HD|\d{1,3}PX)\b/g

export function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[.,]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(LEGAL_SUFFIXES, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const words = (name: string) => name.split(' ').filter((word) => word && !STOPWORDS.has(word))
const acronym = (name: string) => words(name).map((word) => word[0]).join('')

function nameScore(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b || a.replace(/ /g, '') === b.replace(/ /g, '')) return 1
  if (!a.includes(' ') && a.length >= 3 && acronym(b) === a) return 0.95
  if (!b.includes(' ') && b.length >= 3 && acronym(a) === b) return 0.95
  const wordsA = new Set(words(a))
  const wordsB = new Set(words(b))
  const common = [...wordsA].filter((word) => wordsB.has(word)).length
  if (common === 0) return 0
  const smaller = Math.min(wordsA.size, wordsB.size)
  if (common === smaller && smaller >= 2) return 0.9
  if (common === smaller && smaller === 1 && Math.min(a.replace(/ /g, '').length, b.replace(/ /g, '').length) >= 6) return 0.85
  return common / Math.max(wordsA.size, wordsB.size)
}

const THRESHOLD = 0.85

/** "Hospital_de_Clinicas-logo (1).png" → "Hospital de Clinicas" */
export function nameFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\(\d+\)/g, ' ')
    .replace(/[_\-+]+/g, ' ')
}

/** The client the text refers to, or null when none (or more than one) fits. */
export function findClient<T extends NamedClient>(text: string, clients: readonly T[]): T | null {
  const digits = text.replace(/\D/g, '')
  if (digits.length >= 8) {
    const byRut = clients.filter((client) => (client.identifier ?? '').replace(/\D/g, '') === digits)
    if (byRut.length === 1) return byRut[0]
  }
  const name = normalizeName(text).replace(FILE_WORDS, ' ').replace(/\s+/g, ' ').trim()
  if (name.length < 2) return null
  let best: { client: T; score: number } | null = null
  let tie = false
  for (const client of clients) {
    const score = nameScore(name, normalizeName(client.name))
    if (score < THRESHOLD) continue
    if (!best || score > best.score) {
      best = { client, score }
      tie = false
    } else if (score === best.score) {
      tie = true
    }
  }
  return best && !tie ? best.client : null
}
