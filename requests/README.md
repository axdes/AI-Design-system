# Component requests

Escalation channel from CONSTITUTION §12 / PRD §9. When a feature needs a
component that is not in `component-registry.json` (and cannot be composed
from canonical components or added as a variant), the agent does NOT write
inline JSX. It files a request here, stops, and asks the reviewer to decide.

## Flow

1. Agent writes `requests/<YYYY-MM-DD>-<component-name>.json` (format below)
   and stops work on that part of the feature.
2. Reviewer (the user, acting as designer) decides one of:
   - `compose` — an existing composition covers it; the request notes which;
     agent re-implements with it.
   - `approved` — API is agreed; agent creates the component per AGENTS.md
     "Creating a new component", tags it `@experimental` if it needs a
     bake-in period, and re-runs `npm run gen-registry` in the same turn.
   - `rejected` — feature scope is revised.
3. The decision stays in the file (`status`, `decision`, `decidedBy`).
   Resolved requests are kept, not deleted: they are the history of why the
   system looks the way it does.

Escape hatch (CONSTITUTION §9): P1/P2 production fixes may proceed without
waiting, flagged as `constitution-exception: §9` in CHANGELOG-REVIEW.md and
reviewed retroactively.

## Request format

```json
{
  "name": "DatePicker",
  "level": "molecule",
  "date": "2026-07-05",
  "requestedBy": "agent",
  "need": "Profile page requires picking a hire date; free-text input fails validation UX.",
  "consideredAlternatives": [
    { "ref": "molecules/Select", "whyNot": "365+ options per year; no month navigation." },
    { "ref": "atoms/Input", "whyNot": "type=date styling is not themeable across browsers." }
  ],
  "proposedApi": {
    "props": [
      { "name": "value", "type": "string (ISO date)", "required": true },
      { "name": "onChange", "type": "(value: string) => void", "required": true },
      { "name": "min", "type": "string", "required": false },
      { "name": "max", "type": "string", "required": false }
    ]
  },
  "status": "pending",
  "decision": "",
  "decidedBy": ""
}
```

`status`: `pending | approved | compose | rejected`.
`consideredAlternatives` is mandatory: a request without evidence that the
registry was actually searched gets bounced back.
