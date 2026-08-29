# Intake — supplier-portal

Read: 2026-08-29 · Source: `intake/fixtures/supplier-portal.md` · 45 lines · 19 findings

Written by `npm run intake`. It reports what it can CITE and nothing else: every
line below names the token or the registry entry it was decided against. What the
document says that is not a pinned value was not read and is not here — that part
is the requirement, and it is in [`supplier-portal.requirements.md`](./supplier-portal.requirements.md).

## Carried (4)

The document names something the system already has. Nothing to decide.

### `20px` — line 23

on the spacing scale: `--space-5`.

### `15px` — line 24

on the type scale: `--font-base`.

### `DataGrid` — line 30

exists: organism, import from `@/components/DataGrid`.

### `EmptyState` — line 34

exists: molecule, import from `@/components/EmptyState`.

## Refused, with the substitute (10)

Each of these must change before it reaches code. Answer it by writing the
decision after `> decision:` — take the substitute, or say why the system should
change instead and file it in `requests/`. `npm run check:intake` turns red on an
answer that never came, because a refusal nobody answers stops being a process.

### R1 · `10px` — line 22

not a step on the radius scale. Nearest: `--radius-md` (8px) or `--radius-lg` (12px).

> decision: take `--radius-lg` (12px). The brand book asks for rounded corners, not for 10 exactly, and 12 is the step the cards already sit on.

### R2 · `18px` — line 23

not a step on the spacing scale. Nearest: `--space-4` (16px) or `--space-5` (20px).

> decision: take `--space-4` (16px). 18 was picked to sit between two of their own numbers; on a 4pt grid that gap does not exist.

### R3 · `22px` — line 24

not a step on the type scale. Nearest: `--font-lg` (20px) or `--font-xl` (24px).

> decision: take `--font-xl` (24px). 22 is not a step, and dropping to `--font-lg` would leave the section heading the same size as the body's large step.

### R4 · `InfoBox` — line 28

not in the registry, and nothing in it shares a word with this name. Search it (`npm run registry -- --search <word>`), and if the need is real file it in requests/ rather than hand-rolling.

> decision: `Alert tone="info"` at the top of the page. The intake could not find this one: no registry name shares a word with InfoBox. That is the machine's limit, not a gap in the system.

### R5 · `FilterPanel` — line 29

not in the registry. The Filter‑ family this system does have: `FilterBar`, `FilterDropdown` — one of those, or the need is genuinely new.

> decision: `FilterBar` carrying the date range, which is what a toolbar above a list is for.

### R6 · `StatusPicker` — line 29

not in the registry, and nothing in it shares a word with this name. Search it (`npm run registry -- --search <word>`), and if the need is real file it in requests/ rather than hand-rolling.

> decision: `FilterDropdown`, not `Select`: this filters a list rather than setting a field. The pair is in docs/contract/choosing.md.

### R7 · `ButtonBar` — line 31

not in the registry. The Button‑ family this system does have: `Button`, `ButtonGroup` — one of those, or the need is genuinely new.

> decision: `ButtonGroup`. Two related actions on one row is exactly what it is for.

### R8 · `variant=huge` — line 32

no component has `variant="huge"`. The values that exist: `primary`, `secondary`, `ghost`, `destructive`, `success`, `dark`, `link`, `ai`, `filled`, `quiet`, `bare`.

> decision: `variant="primary"`. Weight is the variant; the size is a separate prop and is answered in R9.

### R9 · `size=giant` — line 32

no component has `size="giant"`. The values that exist: `md`, `lg`, `sm`, `xl`, `2xl`.

> decision: `size="lg"`. There is no viewport-conditional size: a control does not change tier on desktop, the layout around it does.

### R10 · `tone=critical` — line 33

no component has `tone="critical"`. The values that exist: `neutral`, `danger`, `warning`, `success`, `info`, `primary`, `ai`, `destructive`.

> decision: `tone="danger"` with `role="alert"`. Alert's own description says to pass role for an error, and never to make an unresolved error dismissible.

## Questions this could not answer (1)

Not findings — the places where a mechanical read runs out. Each one names a
line that is certainly about the system's vocabulary and that this cannot decide
from the text alone. Answer them with the person who wrote the document.

### `- Headings in Frutiger Neue, body text in Arial.` — line 21

this line pins type in prose. Declarations (`font-family: X`) and quoted names are read; a family named inside a sentence is not, because the only thing separating it from a person's name is knowing the answer. Confirm which families are meant, then add them to the brand fragment with their source.

## Brand (4)

Not errors. These are the client's own colour and type, which this system has a
place for: `brand/<name>/manifest.json`, applied by `npm run rebrand`. A fragment
is written beside this file ready to merge. Nothing here belongs in a component.

### `#E4002B` — line 18

nothing in the layer is this colour (nearest `--danger-900` #b13e29, distance 150). Belongs in the brand manifest, not in a component.

### `#00A3E0` — line 19

nothing in the layer is this colour (nearest `--series-3` #1baf7a, distance 181). Belongs in the brand manifest, not in a component.

### `#2E7D32` — line 20

nothing in the layer is this colour (nearest `--success-800` #527700, distance 100). Belongs in the brand manifest, not in a component.

### `#F9A825` — line 20

nothing in the layer is this colour (nearest `--warning-800` #fcb03e, distance 39). Belongs in the brand manifest, not in a component.

