# Task: create-user dialog

Add the "Invite user" dialog to the Users screen.

Requirements:

- Opens from a button on the page.
- Fields: full name (required), email (required), role (a choice of Editor,
  Viewer, Admin).
- The confirm action is disabled or reports an error while a required field is
  empty; cancelling closes the dialog without saving.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, state kept locally. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
