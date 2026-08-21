# Task: notification settings

Build the notification settings panel of a workspace.

Requirements:

- A text field for the address digests are sent to, with its own label.
- An on/off control for the weekly digest.
- A choice of digest density: Compact, Normal or Detailed. One of the three is
  always chosen, and all three are visible at once.
- How long to keep read notifications, in days, entered as a number with
  increment and decrement controls.
- A quiet-hours threshold picked along a range, showing the chosen value.
- A visible separation between the delivery settings and the retention ones.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, sample data inline. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
