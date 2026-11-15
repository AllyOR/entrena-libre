import { useMemo } from 'react'
import { useStore } from '../state/store'
import type { L10n, Lang } from '../types'
import { en } from './en'
import { es, type MessageKey, type Messages } from './es'

const MESSAGES: Record<Lang, Messages> = { es, en }

export interface I18n {
  lang: Lang
  /** Interface string, with `{name}` placeholders filled from `vars`. */
  t(key: MessageKey, vars?: Record<string, string | number>): string
  /** Picks the current language from bilingual content. */
  l(text: L10n): string
  /** A number with the language's decimal mark and no thousands separator: `1,5` in Spanish, `1.5` in English. */
  n(value: number): string
}

export function useI18n(): I18n {
  const lang = useStore().state.lang
  return useMemo(() => {
    const format = new Intl.NumberFormat(lang === 'es' ? 'es-BO' : 'en-US', { maximumFractionDigits: 2, useGrouping: false })
    return {
      lang,
      t: (key, vars) => MESSAGES[lang][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars?.[name] ?? '')),
      l: (text) => text[lang],
      n: (value) => format.format(value),
    }
  }, [lang])
}
