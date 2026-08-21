/* i18n for the gallery: the keys this package's own components ask for, so an
 * example screenshots its real copy instead of a raw key. An APP supplies its
 * own resources through the same initI18n — see src/locales/README.md. */
import { initI18n } from '../src/lib/initI18n'
import en from '../src/locales/en.json'
import ar from '../src/locales/ar.json'

initI18n({ en: { translation: en }, ar: { translation: ar } }, { lang: 'en' })
