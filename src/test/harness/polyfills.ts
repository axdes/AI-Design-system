/* The shared jsdom polyfills, ONE story instead of eight retellings.
 *
 * CANONICAL COPY: packages/design-system/src/test/harness/polyfills.ts.
 * Every app carries a byte-identical copy at src/test/polyfills.ts so its suite
 * runs standalone; `check:harness` in the design-system gate fails on drift.
 * Edit the canonical file, then re-copy — never edit a copy.
 *
 * Runs before any other setup. No imports here, so this executes top to bottom
 * before any module-graph side effect in setup.ts (i18n reads localStorage on
 * import). Everything is conditional: a runtime that grows the real thing makes
 * the stub disappear by itself.
 *
 * - matchMedia: jsdom has none; useMediaQuery reads it (FilterBar decides
 *   between the desktop row and the mobile sheet). A stub that never matches
 *   keeps every test on the desktop layout, the one the assertions describe.
 * - ResizeObserver / scrollIntoView: jsdom implements neither; both are inert
 *   here because the tests assert markup and ARIA, not geometry.
 * - localStorage / sessionStorage: jsdom 30 exposes them as accessors on
 *   Window.prototype; Vitest builds its global from a fixed key list plus own
 *   property names, so both can read as undefined — and a screen that remembers
 *   a choice then dies on first render with "Cannot read properties of
 *   undefined". A Map is enough: nothing tests the storage itself, only
 *   components that remember a choice in it. The check reads the DESCRIPTOR,
 *   never the property: Node ships its own `localStorage` accessor that prints
 *   "not available because --localstorage-file was not provided" the moment it
 *   is touched, and a warning on every run is noise nobody reads twice. */

if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

/* `typeof Element` first: some suites (an app's server half) run in plain Node,
 * where there is no DOM at all and touching Element throws. */
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => undefined
}

function memoryStorage(): Storage {
  const cells = new Map<string, string>()
  return {
    get length() { return cells.size },
    key: (i) => [...cells.keys()][i] ?? null,
    getItem: (k) => cells.get(k) ?? null,
    setItem: (k, v) => { cells.set(k, String(v)) },
    removeItem: (k) => { cells.delete(k) },
    clear: () => { cells.clear() },
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  const own = Object.getOwnPropertyDescriptor(globalThis, name)
  if (!own || !own.value || typeof (own.value as Storage).getItem !== 'function') {
    Object.defineProperty(globalThis, name, { value: memoryStorage(), configurable: true, writable: true })
  }
}
