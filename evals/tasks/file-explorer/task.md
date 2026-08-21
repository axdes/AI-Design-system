# Task: file explorer screen

Build a two-pane file explorer.

Requirements:

- A left sidebar that shows the folder hierarchy as an expand/collapse tree,
  keyboard navigable, with single selection.
- A main pane listing the files in the selected folder as a data table. The
  folder can hold thousands of files, so the list must stay responsive (only
  what is on screen should be in the DOM).
- Right-clicking a file row opens a menu at the pointer with Open, Rename and
  Delete (Delete is destructive).

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, sample data inline. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
