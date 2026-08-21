# Task: contract renewals desk — the whole pipeline

We are starting a small internal tool for the legal operations team. First
screen only — and the DECISIONS travel with the code: this task delivers the
content model and the screen spec alongside the screen, in the formats the
design system's screen-specs machinery documents (`screen-specs/README.md`,
`screen-specs/models/`). The spec comes first; the code matches the spec.

The brief:

Legal ops receives a stream of contracts approaching their end date. Every
contract in the window must be looked at and either sent for renewal or let
lapse — nothing is skipped, nobody searches this screen; the team works the
window down to zero every week.

Each contract carries: the contract id, the counterparty company, the owning
account manager, the annual value, the end date, and where it stands
(awaiting review / renewal sent / lapsing).

The team decides what to handle first by comparing values and end dates
across the whole window at a glance; ordering by end date matters. An
"awaiting review" contract carries the two decisions (send for renewal /
let lapse), applied in place. When the window is empty, that is the good
state — the week's work is done.

The audience is the legal ops specialists who live in this tool daily.

Deliverable, three files:

1. `model.json` — the product's content model (content-model format, project
   id `renewals-desk`).
2. The screen spec, in a file NAMED BY ITS ID (`<id>.json` — the validator
   refuses a file whose name and id disagree), declaring archetype,
   primaryQuestion, zone task + data, states and acceptance.
3. `Screen.tsx` exporting `Screen()` — no props, no router, 8-10 realistic
   contracts inline. Follow the project's design-system rules (`AGENTS.md`,
   `component-index.md`).
