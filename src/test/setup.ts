/* FIRST, and it has to stay first: it installs Web Storage, which the i18n import below reads
 * while it is still being evaluated. The shared harness module has no imports of its own, so it
 * executes top to bottom before any module-graph side effect here. */
import './harness/polyfills'

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/* Real i18n with the bundled en/ar resources — components that call t() must
 * render their actual copy, not a stub. */
import '@/lib/i18n'

afterEach(() => {
  cleanup()
  document.body.removeAttribute('style')
})
