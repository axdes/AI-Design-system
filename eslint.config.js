import globals from 'globals'
import { config } from './eslint.base.js'

/* The design-system package. Everything shared lives in the monorepo root
 * (eslint.base.js); only what is specific to this package belongs here. */
export default config(
  /* .stryker-tmp is a sandbox of INSTRUMENTED copies of every source file that
   * mutation testing writes while it runs; linting it reports hundreds of
   * problems that exist only in Stryker's transform. reports/ is its output. */
  /* `evals/.work` is what an agent produced while being MEASURED, and
   * `evals/fixtures/bad` is deliberately wrong code the scorers have to catch.
   * Linting either one turns the project red for the sin of having run an eval,
   * which is the measuring apparatus contaminating what it measures. */
  /* `evals/.drift` joins `evals/.work` and `src/__eval__`: all three hold what an
   AGENT wrote during a measurement, kept for inspection and gitignored. Linting
   them turns somebody else's unused variable into this repository's red gate. */
  { ignores: ['dist', 'coverage', 'brand', 'public', '.stryker-tmp', 'reports', 'evals/.work', 'evals/.drift', 'src/__eval__'] },

  {
    /* Golden examples — doc snippets rendered by the registry and by the example
     * tests. They deliberately use throwaway handlers and fixture data. */
    files: ['src/**/*.example.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'sonarjs/no-commented-code': 'off',
    },
  },

  {
    /* The visual checker is a Node script whose page.evaluate() callbacks are
     * serialised and run inside the browser, so it legitimately mentions window
     * and document. */
    files: ['scripts/visual-check.mjs', 'scripts/ink-check.mjs', 'scripts/heights-check.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
)
