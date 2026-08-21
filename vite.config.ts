import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Vite's current config loader injects a `__dirname`; the native loader that becomes the
// default does not, so the folder this config sits in is derived from the module itself.
const pkgDir = import.meta.dirname

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(pkgDir, './src') },
  },
  build: {
    rollupOptions: {
      input: {
        /* The visual gallery that scripts/visual-check.mjs screenshots, and the
         * only entry this package has: it is a library, and the screens that
         * used to be built beside it now live in apps/showcase, which consumes
         * the system the same way every product does. */
        visual: path.resolve(pkgDir, 'visual/index.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    /* mcp/ is plain .mjs on purpose: it is a Node process, and this package
     * compiles for the browser with `"types": []`, so a `node:child_process`
     * import in a .ts file under src/ has no types to resolve. The protocol test
     * lives next to the server and runs in the same suite. */
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'mcp/**/*.test.mjs', 'scripts/**/*.test.mjs'],
    /* Components are styled by plain CSS files they import. The tests assert
     * classes / data-* / ARIA, never computed styles, so parsing CSS would only
     * cost time. */
    css: false,
    /* A floor, not a target: set to what the suite actually covers today, so the
     * number cannot drift down unnoticed. Raise it when it rises; never lower it
     * to make a change fit.
     *
     * Scope is the layers the system PROMISES — components, blocks, shell, lib.
     * Measured 2026-07-28: 64.6 / 67.3 / 64.8 / 69.5. */
    coverage: {
      provider: 'v8',
      include: ['src/components/**', 'src/blocks/**', 'src/shell/**', 'src/lib/**'],
      exclude: ['src/**/*.test.*', 'src/**/*.example.tsx', 'src/**/index.ts', 'src/main.tsx'],
      thresholds: { statements: 64, branches: 67, functions: 64, lines: 69 },
    },
  },
})
