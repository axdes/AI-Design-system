import { initI18n } from './initI18n'
import en from '@/locales/en.json'
import ar from '@/locales/ar.json'

export const LOCALES = ['en', 'ar'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
}

export const STORAGE_KEY = 'i18n.lang'

/* The bootstrap itself is the shared `initI18n` — the same call every app
 * makes with its own resources. What stays here is only what is this
 * package's: which locales it ships, their labels, and the storage key. */
const i18next = initI18n(
  {
    en: { translation: en },
    ar: { translation: ar },
  },
  { storageKey: STORAGE_KEY },
)

export { i18next }
