# Where everything lives

*Reference for `AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

## File map
```
styles/                  ← foundation only
  settings.css           ← THE place to tune the system (knobs)
  primitives.css         ← computed tokens (do not edit)
  semantic.css           ← role tokens (--primary, --background) via light-dark()
  reset.css              ← + prefers-reduced-motion
  fonts.css              ← @font-face, written by rebrand
  index.css              ← imports the foundation in order

src/components/          ← FLAT component layer (one folder per component)
  levels.json            ← the atomic level of every component (atom/molecule/
                           organism). Metadata, not a folder: the registry and
                           the linter read it, so a new component MUST be
                           classified here.
  surfaces.json          ← surface context per component: `page` (owns viewport) /
                           `region` (own surface) / `card` (inside a card/form).
                           Registry emits it as `context`; linter requires it.
  <Name>/                ← one folder per component. component-registry.json is
                           the authoritative list; it is not repeated here.
                           Each folder: Name.tsx + Name.css + Name.example.tsx
                           + index.ts. Card / Dropdown / Tabs / Table / Layout
                           export several parts — see their index.ts

src/blocks/              ← product-agnostic COMPOSITIONS bigger than a component
  AuthTemplate/ DetailPageTemplate/ ListPageTemplate/ WizardTemplate/
  Page structure lives here; build screens from these, do not hand-roll chrome.

src/shell/               ← app chrome wired to routing/providers (not the DS)
  AppShell/ ChatHistory/ Sidebar/ ThemeToggle/ UserMenu/

src/lib/                 ← utilities, providers, hooks. filterBarContext.ts lets
                            FilterBar (organism) and FilterDropdown (molecule)
                            talk without an atomic-direction violation.

src/test/                ← the harness and the system-wide tests: every golden
                            example renders and is axe-clean, and every variant
                            the registry advertises lands as `data-*`.

evals/                   ← does an agent's output actually use this system?
                            One-shot scores in run.mjs, the long-session drift
                            curve in drift.mjs, measured runs in BASELINE.md.

visual/                  ← pixel baselines for every golden example, both themes.

tokens/                  ← the DTCG export, generated from styles/ by
                            `npm run tokens`. How anything outside this repo
                            (Style Dictionary, Tokens Studio, Figma) reads the
                            system. Never edit it.

screen-specs/            ← agreed screen structure, validated against the registry
  schema.json  documents-list.json          (see screen-specs/README.md)

intake/                  ← somebody else's requirements document, reconciled
                            against this system BEFORE a spec is written: every
                            value it pins looked up and answered carried /
                            refused / brand. `npm run intake -- <file>`, guarded
                            by `check:intake` (see intake/README.md).

brand/<name>/            ← the one legitimate home for a foreign colour or
                            typeface. `npm run rebrand` writes it into the
                            token layer; nothing else may.

scripts/adoption.mjs     ← how much of each product's UI is actually this
                            system, against floors at the monorepo root that
                            only rise. `npm run adoption`.

scripts/cost.mjs         ← what a task costs in tokens and money, from the
                            agent's own account of it in the eval traces.
                            `npm run cost`. The other half of the context
                            budget: that one guards the input, this one bills it.

src/layouts/             ← route-level layout templates named `*Page`. The
                            routes ARE the template demos; Playground is the
                            gallery.
```
