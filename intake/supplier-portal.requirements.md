# Requirements left after intake — supplier-portal

Source: `intake/fixtures/supplier-portal.md`. Every line the intake had something to say about carries a
marker; everything unmarked is the requirement, untouched. Markers: **[carried]**
the system already has it, **[refused]** it must change, **[brand]** it belongs in
the brand manifest.

Full reasoning, with citations: [`supplier-portal.findings.md`](./supplier-portal.findings.md)

---

# Supplier onboarding portal — UI requirements

## 1. Purpose

Procurement receives supplier applications from the sourcing team. Every
application in the queue must be reviewed and either approved or sent back for
correction. Nothing is skipped. The team clears the queue weekly and does not
search this screen.

## 2. Data per application

Supplier legal name, registration country, annual spend commitment, the
sourcing manager who raised it, the submission date, and its state (awaiting
review / approved / returned).

## 3. Visual requirements (from the corporate brand book)

- Primary brand colour is #E4002B. All primary actions use it.
  <!-- [brand] #E4002B — nothing in the layer is this colour (nearest `--danger-900` #b13e29, distance 150). Belongs in the brand manifest, not in a component -->
- Secondary accent #00A3E0 for links and selected states.
  <!-- [brand] #00A3E0 — nothing in the layer is this colour (nearest `--series-3` #1baf7a, distance 181). Belongs in the brand manifest, not in a component -->
- Success state uses #2E7D32, warning #F9A825.
  <!-- [brand] #2E7D32 — nothing in the layer is this colour (nearest `--success-800` #527700, distance 100). Belongs in the brand manifest, not in a component -->
  <!-- [brand] #F9A825 — nothing in the layer is this colour (nearest `--warning-800` #fcb03e, distance 39). Belongs in the brand manifest, not in a component -->
- Headings in Frutiger Neue, body text in Arial.
  <!-- [question] - Headings in Frutiger Neue, body text in Arial. — this line pins type in prose. Declarations (`font-family: X`) and quoted names are read; a family named inside a sentence is not, because the only thing separating it from a person's name is knowing the answer. Confirm which families are meant, then add them to the brand fragment with their source -->
- Corner radius must be 10px throughout. Buttons are fully rounded.
  <!-- [refused] 10px — not a step on the radius scale. Nearest: `--radius-md` (8px) or `--radius-lg` (12px) -->
- Card padding 20px, gap between cards 18px.
  <!-- [carried] 20px — on the spacing scale: `--space-5` -->
  <!-- [refused] 18px — not a step on the spacing scale. Nearest: `--space-4` (16px) or `--space-5` (20px) -->
- Base font size 15px, section headings 22px.
  <!-- [carried] 15px — on the type scale: `--font-base` -->
  <!-- [refused] 22px — not a step on the type scale. Nearest: `--font-lg` (20px) or `--font-xl` (24px) -->

## 4. Layout

- The page opens with an InfoBox explaining the review policy.
  <!-- [refused] InfoBox — not in the registry, and nothing in it shares a word with this name. Search it (`npm run registry -- --search <word>`), and if the need is real file it in requests/ rather than hand-rolling -->
- Below it a FilterPanel with a StatusPicker and a date range.
  <!-- [refused] FilterPanel — not in the registry. The Filter‑ family this system does have: `FilterBar`, `FilterDropdown` — one of those, or the need is genuinely new -->
  <!-- [refused] StatusPicker — not in the registry, and nothing in it shares a word with this name. Search it (`npm run registry -- --search <word>`), and if the need is real file it in requests/ rather than hand-rolling -->
- The applications themselves render in a DataGrid.
  <!-- [carried] DataGrid — exists: organism, import from `@/components/DataGrid` -->
- Each row exposes two actions rendered as a ButtonBar.
  <!-- [refused] ButtonBar — not in the registry. The Button‑ family this system does have: `Button`, `ButtonGroup` — one of those, or the need is genuinely new -->
- Use Button variant=huge for the primary approve action, size=giant on desktop.
  <!-- [refused] variant=huge — no component has `variant="huge"`. The values that exist: `primary`, `secondary`, `ghost`, `destructive`, `success`, `dark`, `link`, `ai`, `filled`, `quiet`, `bare` -->
  <!-- [refused] size=giant — no component has `size="giant"`. The values that exist: `md`, `lg`, `sm`, `xl`, `2xl` -->
- An Alert tone=critical appears when the queue cannot be loaded.
  <!-- [refused] tone=critical — no component has `tone="critical"`. The values that exist: `neutral`, `danger`, `warning`, `success`, `info`, `primary`, `ai`, `destructive` -->
- The empty queue shows an EmptyState with an illustration.
  <!-- [carried] EmptyState — exists: molecule, import from `@/components/EmptyState` -->

## 5. Behaviour

Sorting by submission date, oldest first, is the default. Approving an
application removes it from the queue in place, with no page reload. A returned
application must capture a reason, which is mandatory.

## 6. Not in scope

Supplier self-service, document upload, and anything on mobile.

