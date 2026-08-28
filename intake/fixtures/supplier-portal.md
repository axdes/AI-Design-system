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
- Secondary accent #00A3E0 for links and selected states.
- Success state uses #2E7D32, warning #F9A825.
- Headings in Frutiger Neue, body text in Arial.
- Corner radius must be 10px throughout. Buttons are fully rounded.
- Card padding 20px, gap between cards 18px.
- Base font size 15px, section headings 22px.

## 4. Layout

- The page opens with an InfoBox explaining the review policy.
- Below it a FilterPanel with a StatusPicker and a date range.
- The applications themselves render in a DataGrid.
- Each row exposes two actions rendered as a ButtonBar.
- Use Button variant=huge for the primary approve action, size=giant on desktop.
- An Alert tone=critical appears when the queue cannot be loaded.
- The empty queue shows an EmptyState with an illustration.

## 5. Behaviour

Sorting by submission date, oldest first, is the default. Approving an
application removes it from the queue in place, with no page reload. A returned
application must capture a reason, which is mandatory.

## 6. Not in scope

Supplier self-service, document upload, and anything on mobile.
