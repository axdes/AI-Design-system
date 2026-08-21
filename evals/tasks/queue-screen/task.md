# Task: expense approvals queue

Build the screen where a reviewer clears the queue of submitted expense reports.

Requirements:

- The queue is handed to the reviewer as it is: every entry has to be looked at,
  nobody searches or filters this screen.
- Each entry shows: report number, who submitted it, their team, the amount,
  when it was submitted, and its status (pending / approved / returned).
- Reviewers pick what to handle first by comparing amounts and dates across
  entries at a glance; entries can be ordered by amount.
- Each pending entry carries one Approve action, applied in place.
- When the queue is clear, the screen says so plainly — that is its good state,
  not a failure.

Deliverable: a single file `Screen.tsx` exporting `Screen()` — no props, no
router, sample rows inline. Follow the project's design-system rules
(`AGENTS.md`, `component-index.md`).
