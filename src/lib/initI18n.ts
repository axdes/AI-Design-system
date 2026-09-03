/* Starts the translation layer with the words a product ships.
 *
 * @internal Plumbing rather than a choice: an app calls it once at boot and
 * nobody reaches for it while building a screen, so it stays out of the index
 * an agent reads on every task. (2026-09-03)
 */
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

type Resources = Record<string, { translation: object }>

type Options = {
  /** Start language. Default: the first key of `resources`. */
  lang?: string
  /** localStorage key to read the choice from and persist it to. Omit for a single-language app. */
  storageKey?: string
  /** Languages written right-to-left; drives `<html dir>`. */
  rtl?: readonly string[]
}

/**
 * The one i18n bootstrap, promoted from seven per-app copies (the scout's
 * the second-use finding closed by its own condition). Every app needs
 * this layer even when its own copy is English in the JSX, because shared
 * components ask for keys — Modal wants a11y.close, PageHeader wants a11y.back.
 * The RESOURCES stay per app on purpose: they are the app's words. What was
 * copied — and drifted — is everything below: the init call, `<html lang/dir>`
 * kept true to the active language, and the choice persisted when asked to.
 */
/** @public Called by consuming apps, not from inside this package. */
export function initI18n(resources: Resources, opts: Options = {}) {
  const locales = Object.keys(resources)
  const rtl = new Set(opts.rtl ?? ['ar'])

  let initial = opts.lang ?? locales[0]
  if (opts.storageKey) {
    const stored = localStorage.getItem(opts.storageKey)
    if (stored && locales.includes(stored)) initial = stored
  }

  const applyHtmlAttrs = (lng: string) => {
    document.documentElement.lang = lng
    document.documentElement.dir = rtl.has(lng) ? 'rtl' : 'ltr'
  }

  void i18next.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: locales[0],
    interpolation: { escapeValue: false },
  })

  applyHtmlAttrs(initial)

  i18next.on('languageChanged', (lng) => {
    if (!locales.includes(lng)) return
    applyHtmlAttrs(lng)
    if (opts.storageKey) localStorage.setItem(opts.storageKey, lng)
  })

  return i18next
}
