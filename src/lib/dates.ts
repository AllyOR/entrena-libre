import type { Lang } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as `YYYY-MM-DD`. */
export const isoDate = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** `YYYY-MM` for a date. */
export const monthKey = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

export function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  return monthKey(new Date(y, m - 1 + delta, 1))
}

/**
 * "noviembre de 2026" / "November 2026", as the language writes it inside a sentence.
 * `title` capitalises it for a heading; `short` gives the month's abbreviation alone.
 */
export function formatMonth(key: string, lang: Lang, style: 'sentence' | 'title' | 'short' = 'sentence'): string {
  const [y, m] = key.split('-').map(Number)
  const options: Intl.DateTimeFormatOptions = style === 'short' ? { month: 'short' } : { month: 'long', year: 'numeric' }
  const text = new Intl.DateTimeFormat(lang, options).format(new Date(y, m - 1, 1))
  return style === 'sentence' ? text : text.charAt(0).toUpperCase() + text.slice(1)
}

/** `dd/mm/yyyy` in Spanish, `Mon d, yyyy` in English. */
export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-BO' : 'en-US', { day: '2-digit', month: lang === 'es' ? '2-digit' : 'short', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

export function dayOfYear(d: Date = new Date()): number {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86_400_000)
}
