# Task: the three states of a results panel

Build the results panel of a report screen. The report is fetched, so the panel
has to answer for itself in three situations, not just the happy one.

Requirements:

- While the report is being fetched: a busy indicator with a readable label.
- If the fetch failed: an error message the user can act on, with a "Try again"
  control next to it.
- If the report came back with no rows: an empty state that says what would put
  something here, with a "Create a report" action.

A control at the top switches between the three for the purpose of this task.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, sample data inline. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
