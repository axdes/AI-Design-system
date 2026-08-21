/* Shared ESLint configuration for every package in the monorepo.
 *
 * A package's own eslint.config.js should be thin: import this, add its ignores,
 * and add ONLY rules that are genuinely specific to it (a Node script that also
 * touches browser globals, a folder of fixtures). Do not restate these rules.
 *
 * Rule policy (the user is firm on this): never switch a rule off to dodge a real
 * bug. OFF is only for exact duplicates of an already-enforced rule. Contested
 * style and tool false-positives become WARN, which is a visible tracked backlog
 * reported on every run, to be burned down and promoted back to error.
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import eslintReact from '@eslint-react/eslint-plugin'
import sonarjs from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'

/* Correctness baseline for all TS/React code in a package. */
export const typescriptReact = {
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2022,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    /* eslint-plugin-react-hooks 7 promoted three checks from the compiler to
     * errors: setState in an effect body, ref writes during render, and mutating
     * a ref object you were handed. They are right, and the 19 places they light
     * up are real (a latest-value ref set at render time, the cloneElement ref
     * merge in Tooltip/HoverCard, subscribe-then-set in useMediaQuery).
     *
     * They are held at `warn` because clearing them is a refactor of the ref
     * plumbing in the most-used components, not a lint fix, and doing it under a
     * red gate invites exactly the silent breakage the gate exists to stop. The
     * plan is in MUTATION-BASELINE.md's "still open" list; shrink these to zero,
     * then delete this block. Do not add rules here to clear red. */
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/immutability': 'warn',
    /* Same family: the compiler reporting that it cannot prove a hand-written
     * useMemo/useCallback dependency list is safe to keep. Advice about future
     * auto-memoization, not a defect in code that runs correctly today. */
    'react-hooks/preserve-manual-memoization': 'warn',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    /* Allow underscore-prefixed and destructure-omit "unused" bindings, e.g.
     * `const { password: _password, ...safe } = user`. */
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
  },
}

/* Strict React correctness + accessibility + code quality. Applied to SOURCE only:
 * Node tooling is not React and gets `nodeTooling` below. */
export const strictSource = {
  files: ['src/**/*.{ts,tsx}'],
  extends: [
    jsxA11y.flatConfigs.recommended,
    eslintReact.configs.recommended,
    sonarjs.configs.recommended,
  ],
  rules: {
    /* OFF — exact duplicates of an already-enforced rule (not a relaxation):
     * unused vars/imports -> @typescript-eslint/no-unused-vars; duplicate
     * strings -> jscpd. */
    'sonarjs/no-unused-vars': 'off',
    'sonarjs/unused-import': 'off',
    'sonarjs/no-duplicate-string': 'off',

    /* (a) tool false-positives — the rule misreads our code:
     *   void-use: `void promise` is the idiomatic floating-promise marker.
     *   no-hardcoded-passwords: demo credentials are public showcase values
     *     (no backend); they are printed on the login screen on purpose.
     *   super-linear-regex: /<[^>]+>/g cannot backtrack (the class excludes
     *     its own terminator). */
    'sonarjs/void-use': 'warn',
    'sonarjs/no-hardcoded-passwords': 'warn',
    'sonarjs/super-linear-regex': 'warn',
    /* (b) contested style we use deliberately in JSX/data: */
    'sonarjs/no-nested-conditional': 'warn',
    'sonarjs/cognitive-complexity': 'warn',
    'sonarjs/no-nested-functions': 'warn',
    'sonarjs/no-dead-store': 'warn',
    /* (c) jsx-a11y false-positives on code that is actually correct:
     *   <Label> receives htmlFor at runtime. */
    /* aria-role fired on `<ChatMessage role="assistant">` and
     * `<UserMenu role="Brand manager">`, where `role` is a component's own prop
     * and not the DOM attribute. `ignoreNonDOM` is the option for exactly that,
     * so the rule goes back to being an ERROR on real elements instead of a
     * warning everyone has learned to scroll past. */
    'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
    /* A pane that SCROLLS must be a tab stop, or its content is unreachable to
     * anyone not using a mouse (WCAG 2.1.1, and axe fails it as serious). This
     * rule allows a tab stop only on role="tabpanel" by default, which puts it
     * directly at odds with that: salim's call attributes and transcript panes
     * both scroll, both were unreachable, and both needed a disable comment to
     * be fixed. Allowing `region` — the role a named scroll container should
     * carry anyway — is the decision, written once here instead of four times
     * in the code. */
    'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true }],
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-autofocus': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',
    '@eslint-react/unsupported-syntax': 'warn',
  },
}

/* Context providers legitimately export both the Provider component and its hook
 * from one file; the Fast Refresh rule does not apply to them. */
export const providers = {
  files: ['src/**/*Provider.tsx'],
  rules: { 'react-refresh/only-export-components': 'off' },
}

/* Vitest files + setup: test globals; relax what is noise in tests (non-null on
 * queried nodes, fixture index keys). */
export const tests = {
  files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.node,
      vi: 'readonly',
      describe: 'readonly',
      it: 'readonly',
      test: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
    },
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@eslint-react/no-array-index-key': 'off',
    'react-refresh/only-export-components': 'off',
    'sonarjs/no-nested-functions': 'off',
  },
}

/* Node tooling — gate scripts, harnesses, backends. Basic JS lint with Node
 * globals; no React, no a11y. */
export const nodeTooling = {
  files: ['scripts/**/*.mjs', 'evals/**/*.mjs', 'tools/**/*.mjs', 'server/**/*.mjs', '**/*.mjs'],
  extends: [js.configs.recommended],
  languageOptions: { globals: globals.node },
  rules: {
    /* `try { … } catch {}` is the idiom these scripts are written in: probe
     * something optional, carry on when it is not there. That is a decision, not
     * an oversight, and the rule ships this option for exactly it. UI code under
     * src/ keeps the strict version — swallowing an error there hides a bug. */
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
}

/* The usual stack, in order. A package composes this and appends its own blocks. */
export const base = [typescriptReact, strictSource, providers, tests, nodeTooling]

/* Helper so a package config reads as one call. */
export const config = (...extra) => tseslint.config(...base, ...extra)

export default base
