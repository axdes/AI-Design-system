# How the two themes are built

*Reference for `AGENTS.md`. The contract stays short enough to read
in full on every task; this is what it points at when a task needs it.*

## Theme

Two blocks in `styles/semantic.css`, not `light-dark()` in the token layer:
`:root` (shared with `[data-theme-lock="light"]`) holds the light role values,
`[data-theme="dark"]` holds the dark ones, and an `@media (prefers-color-scheme:
dark)` block repeats the dark set for a visitor who has chosen no theme.
`ThemeProvider` sets `data-theme` on `<html>`.

```css
:root { color-scheme: light dark; }
[data-theme="light"] { color-scheme: light; }
[data-theme="dark"]  { color-scheme: dark; }
```

That third block is a duplicate by necessity and has drifted twice, which is why
`npm run tokens:check` now fails when the same token is declared twice in one
theme with two different values. `light-dark()` is still the right tool INSIDE a
component's own CSS, where a single declaration needs both values.

## In dark, the card is DARKER than the page

The two themes are not mirrors of each other, and the surface order is the place
that shows it:

| role | light | dark |
|---|---|---|
| page (`--background`, `--muted`) | `neutral-0` / `neutral-100` | `neutral-820` `#363a3f` — the LIGHTEST large area |
| card (`--card`, `--popover`) | `neutral-0` white | `neutral-850` `#25292f` — a step darker than the page |
| quiet fill (`--secondary`) | `neutral-100` | `neutral-950` `#0e1217` |
| edge, hover, popover row (`--border`, `--accent`, `--popover-hover`) | `neutral-200/300` | `neutral-800` `#464a4f` |

Two rules behind that table, and both are measurements rather than taste:

**The step is bigger in dark.** Light separates its page from its cards at
1.086:1 and that reads. The dark theme used the same ratio — 1.081:1 — and it
did not: a page of cards came out as one grey wash. The eye reads a difference,
not a ratio, and near the black end a 1.08 ratio is almost no difference. Every
dark surface step is 1.28:1 now.

**The card goes darker, not lighter.** Putting the two brightest greys next to
each other (a light card on a slightly darker page) leaves neither winning. A
well — content sunk below the page it sits on — reads immediately, and it also
gives the tinted status surfaces somewhere to stand.

The consequence to remember when writing a component: in dark, `--muted` is
LIGHTER than `--card`, where in light it is darker. The ROLE is unchanged — the
surface a chip, a meter track or a table head takes so that it is not the card —
so keep using the role and never reach for a neutral stop directly.

And the soft status tints (`--success-soft` and friends) are tints, not ink. In
dark they sit at one luminance, `--success-900`'s, so all four tone the surface
by the same amount; the `-950` ink stops are ink and measured 1.05:1 as a tint.
`npm run contrast` and `npm run boundary` hold both halves of this.
