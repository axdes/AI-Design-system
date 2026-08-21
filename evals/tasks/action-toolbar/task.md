# Task: document toolbar

Build the toolbar that sits above a document list.

Requirements:

- Quick filters the user can switch on and off: All, Shared, Archived. Each is
  independent — any number of them can be on at once — and the ones that are on
  read as on.
- Three icon-only actions: download, share, delete. Each has to be usable by
  someone who cannot see the icon, and has to name itself on hover.
- Everything else goes behind one "More" control that opens a menu with Rename
  and Duplicate.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, sample data inline. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
