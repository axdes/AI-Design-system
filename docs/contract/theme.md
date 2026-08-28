# How the two themes are built

*Reference for `packages/design-system/AGENTS.md`. The contract stays short enough to read
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
