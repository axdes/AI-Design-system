# Task: save settings with async feedback

Build a small "Notification settings" panel that saves over the network.

Requirements:

- A switch for "Email digest" and a switch for "Push alerts".
- A Save button. While the save is in flight the button shows a busy state and
  cannot be pressed again; when it finishes, it returns to normal.
- While the initial settings are still loading, show placeholder rows in place of
  the switches rather than an empty box or a layout jump.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, fake the network with a timer. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
