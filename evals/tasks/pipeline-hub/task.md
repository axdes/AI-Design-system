# Task: client workspace hub — the whole pipeline

We are adding the landing screen of a client-project workspace. First screen
only — and the DECISIONS travel with the code: this task delivers the content
model and the screen spec alongside the screen, in the formats the design
system's screen-specs machinery documents (`screen-specs/README.md`,
`screen-specs/models/`). The spec comes first; the code matches the spec.

The brief:

A consultant opens their client workspace and goes where the work is. The
workspace has five areas — documents, meetings, decisions, people, reports —
and every one of them is a DESTINATION: nothing on this screen is read,
compared or processed, the screen exists to be left through the right door.

Each area carries: its name, one line saying what waits inside, and a live
count of what it holds (documents: files; meetings: sessions this month;
decisions: open decisions; people: teammates; reports: published reports).

Nobody works through the areas in order, nobody compares their counts, and
five entries never need searching. A brand-new workspace has all five areas
from day one — they are the workspace's shape, not its content.

The audience is consultants who open this workspace daily.

Deliverable, three files:

1. `model.json` — the product's content model (content-model format, project
   id `client-workspace`).
2. The screen spec, in a file NAMED BY ITS ID (`<id>.json` — the validator
   refuses a file whose name and id disagree), declaring archetype,
   primaryQuestion, zone task + data, states and acceptance.
3. `Screen.tsx` exporting `Screen()` — no props, no router, the five areas
   inline. Follow the project's design-system rules (`AGENTS.md`,
   `component-index.md`).
