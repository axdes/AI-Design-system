# The keys this system's components ask for

These are not an app's words. They are the 33 keys the components in this
package call `t()` with — `Modal` wants `a11y.close`, `PageHeader` wants
`a11y.back`, `ChatComposer` wants the `agent.*` set — and an app that does not
supply them renders the raw key on screen.

Two uses, and no third:

- **A consumer copies them** as the floor of its own resources, then translates
  and extends. The RESOURCES stay per app on purpose: they are the app's words,
  and `initI18n` (in `src/lib`) takes them as an argument for exactly that
  reason.
- **The visual gallery loads them** so a golden example screenshots its real
  copy rather than a key.

`ar.json` exists because the system is RTL-ready and the gallery shoots both
directions; a missing translation there is a missing translation, not a bug in
the component.
