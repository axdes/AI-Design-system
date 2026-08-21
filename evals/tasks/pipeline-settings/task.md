# Task: notification relay settings — the whole pipeline

We are adding the configuration screen of a small notification relay. One
screen — and the DECISIONS travel with the code: this task delivers the
content model and the screen spec alongside the screen, in the formats the
design system's screen-specs machinery documents (`screen-specs/README.md`,
`screen-specs/models/`). The spec comes first; the code matches the spec.

The brief:

An operator configures how the relay sends notifications, and comes back to
this screen rarely — to change one thing deliberately, months apart. The
knobs: the SMTP host, the sender name shown on outgoing mail, the relay API
token, the digest frequency (immediately / hourly / daily), and whether
quiet hours are on. Every knob must say what changing it actually affects,
because the operator finds things by scanning labels.

The API token is a SECRET: once saved it must never be readable from this
screen again — the operator can only replace it, and the screen says whether
one is configured.

Before trusting the setup, the operator runs a connection test from the same
screen; its result names what failed and how to fix it.

This is a place the operator LIVES IN occasionally and revisits — it is not
a one-time setup flow: any knob can be changed alone, in any order, at any
time.

Deliverable, three files:

1. `model.json` — the product's content model (content-model format, project
   id `notify-relay`).
2. The screen spec, in a file NAMED BY ITS ID (`<id>.json` — the validator
   refuses a file whose name and id disagree), declaring archetype,
   primaryQuestion, zone task + data, states and acceptance.
3. `Screen.tsx` exporting `Screen()` — no props, no router, current values
   inline. Follow the project's design-system rules (`AGENTS.md`,
   `component-index.md`).
