# Task: multi-step checkout header

Build the header of a multi-step checkout.

Requirements:

- A progress indicator across four steps: Account, Shipping, Payment, Review.
  The steps already completed read as done, the active one is highlighted, and
  the user can click a completed step to jump back.
- Below the steps, an FAQ the user can expand: a few questions that each reveal
  an answer, one open at a time.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, keep the current step in local state. Follow the project's design-system
rules (`AGENTS.md`, `component-index.md`).
