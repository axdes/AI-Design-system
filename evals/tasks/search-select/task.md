# Task: searchable country picker

Add a country field to a shipping form.

Requirements:

- There are ~200 countries, so the field must let the user type to filter, not
  scroll a giant list.
- Keyboard: arrow keys move through the matches, Enter picks the highlighted one.
- When the query matches nothing, say so inside the list.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, a short inline country list is fine. Follow the project's design-system
rules (`AGENTS.md`, `component-index.md`).
