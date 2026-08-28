# Forms: the research, the rules, and what this system is missing

Measured against the registry on 2026-08-23. Every "have" below was read out of
`registry/*.json` and the component source, not remembered.

**Status: P1 and P2 of section 5 were built the same day** (owner's call), so the
gaps this survey found are closed and the rules are in the gate:
`screen-specs/form-rules.json` plus `check:spec`, `FormPageTemplate`, `FormPanel`,
`FormSection`, `ErrorSummary`, `CheckboxGroup`, `CharacterCount`,
`ConditionalReveal`, `SaveStatus`, `useAutosave`, `useUnsavedChanges`, `Field`
gaining `optional` and moving hint and error above the control, and a lint rule
for `autocomplete`. The live reference is the showcase's `content-request`
screen. What is still open is P3, and each of its five kinds is recorded as
`planned` in the rules file with the condition that would open it.

This is the same move the card layer made: `selection-rules.json` decides which
REPRESENTATION a collection gets, `card-rules.json` decides WHICH CARD once the
answer is cards. Forms have neither layer. The archetype table already lists
`form`, and it points at exactly one template (`FormModal`), so today the system
can answer "this screen captures input" and then has nothing to say about which
kind of form that is, how the fields sit, or when it saves.

## 1. What the system has today

Controls (atoms and molecules) are close to complete:

| Need | Have |
| --- | --- |
| Text, long text, password, code | `Input`, `Textarea`, `PasswordInput`, `CodeInput` |
| Choice from a set | `Select`, `Combobox`, `Radio` + `RadioGroup`, `SegmentedControl`, `SelectableTile` |
| Boolean | `Checkbox`, `Switch` |
| Number, range | `NumberInput`, `Slider`, `RangeSlider`, `Rating` |
| Date and time | `DatePicker`, `DateRangePicker`, `TimeInput`, `Calendar` |
| Files, tags, search | `FileUpload`, `TagInput`, `SearchInput` |
| Affixes | `InputGroup` (prefix / suffix) |
| Field wiring | `Field` (label, required mark, hint or error, `aria-describedby`) |
| Rhythm | `FormStack` (one column, `--space-6`, controls stretched to full width) |
| Containers | `Modal` (footer, focus trap), `SidePanel` (footer), `Popover` |
| Compositions | `FormModal`, `RenameDialog`, `ConfirmDialog`, `WizardTemplate` + `WizardReview`, `SettingsPageTemplate` + `SettingsSection` + `SettingRow`, `AuthTemplate` |

Gaps that are already visible from the props table alone:

- No `CheckboxGroup`. `RadioGroup` exists, its checkbox twin does not, so every
  multi-select set of checkboxes is hand-stacked with no group label.
- No grouping inside a form. `FormStack` is flat: no `fieldset` / `legend`, no
  section heading, no way to say "these six fields answer one question".
- No error summary. On submit a long form can only mark fields in place, which
  a keyboard or screen reader user has to go hunting for.
- No page-level form. `form` maps to `FormModal` only, so a 15-field object has
  to be crammed into a dialog or hand-rolled in an app.
- No `autocomplete` attribute anywhere in the system (grep: zero hits outside
  `aria-autocomplete`), so WCAG 1.3.5 is unmet by construction.
- No unsaved-changes guard anywhere in the monorepo (grep: zero hits for
  `beforeunload` / `unsaved`).
- No character count, no conditional reveal, no repeatable field set, no save
  status line, no inline edit.

## 2. The taxonomy: eighteen kinds of form

A form is picked by four questions, in this order: how many fields, how familiar
the task is, whether the surrounding context must stay visible, and who commits
the change. Everything else is decoration.

| # | Kind | Use when | Do not use when | This system |
| --- | --- | --- | --- | --- |
| 1 | Dialog form | 1 to 6 fields, routine, reversible, the list behind it is the context | The record has sections, or the user needs the page to compare against | `FormModal` |
| 2 | Panel form | Editing while the record or the list stays readable next to it | The form is longer than the panel scrolls comfortably | `FormPanel` |
| 3 | Page form | 7+ fields, or the object has named sections, or it is the screen's whole job | Three fields, which a dialog does without a route change | `FormPageTemplate` |
| 4 | Wizard | Long, unfamiliar, order matters, and a summary is owed at the end | Two steps, or a routine the user repeats weekly | `WizardTemplate` |
| 5 | Question page | One question per screen: public, infrequent, branching, low confidence | Internal users who repeat the flow daily and would hate the clicking | missing |
| 6 | Review step | Before an irreversible submit: every answer, each with a Change link | Nothing is irreversible and the form is short | `WizardReview` |
| 7 | Settings form | Configuration read rarely, changed deliberately, each row applied on its own | The rows are really records to manage, which is a list | `SettingsPageTemplate` |
| 8 | Auth form | Sign in, sign up, reset, verify | Anything with a second purpose on the same screen | `AuthTemplate` |
| 9 | Inline edit | One field, edited where it is read (a title, an owner, a status) | Several fields at once, which is a panel or a dialog | missing (`RenameDialog` is the dialog fallback) |
| 10 | Grid edit | Editing across many records is the primary task | One record at a time | `DataGrid` |
| 11 | Bulk edit | One change applied to N selected records, with the count in the copy | The change differs per record | missing |
| 12 | Filter form | Narrow a collection, applied live, never "saved" | The values persist as a record, which is a real form | `FilterBar`, `FilterDropdown` |
| 13 | Search form | One query field, submitted to find | More than one criterion, which is a filter | `SearchInput` |
| 14 | Composer | Free text plus attachments, sent rather than saved | The result is a record with fields | `ChatComposer` |
| 15 | Confirm | Yes or no on a stated consequence | Anything the user has to type | `ConfirmDialog` |
| 16 | Verified confirm | Destructive and unrecoverable: the user types the name to proceed | Recoverable actions, where typing is theatre | missing |
| 17 | Upload form | Files plus the metadata that describes them | Files alone, which is the control | `FileUpload` inside a form kind |
| 18 | Draft form | Long, resumable, saved as you go, "continue later" is expected | Short forms, where autosave surprises more than it helps | `FormPageTemplate` + `SaveStatus` + `useAutosave` |

Two of these are not forms and are listed so the decision layer can say so:
filter and search never commit a record, so they own no Save, no dirty state and
no error summary.

## 3. Where the content goes

**One column.** Multi-column forms are read in a Z that no two users trace the
same way. The only exception is a pair of short fields that are one answer (city
and postcode, expiry month and year), and they stay on one row only above the
form column's own breakpoint.

**Field order follows the user's story, not the database.** Identity first
(what is this thing called), then the fields that describe it, then the ones
that place it in the org (owner, area, status), then consents, then the action.
Easy before hard: an early field the user cannot answer stops the whole form.

**Group when a group has a name.** A section earns a heading when a sentence can
say who or what these fields affect. Three to seven fields per section. More
than two sections on one screen means the form is a page form (sections and a
sticky footer) or a wizard (steps), not a taller dialog.

**Label above the control, always visible.** No placeholder-as-label: it
disappears on focus, fails contrast, and defeats autofill. `Field` already
enforces this shape.

**Hint before the control, error before the control.** This is the one open
decision in the system: `Field` currently renders both under the control. GOV.UK
puts the hint between label and input and the error message above the input, so
a magnified viewport reads the instruction before typing. Material and Carbon
keep both below. The rule matters less than picking one, but the hint at least
belongs above: an instruction the user reads after typing is not an instruction.

**Field width tells the truth about the answer.** A postcode field the width of
an address invites the wrong entry. Width is a data-length token, not a layout
accident, and the form column caps at the reading measure (about 480 to 560px)
regardless.

**Mark the minority.** If most fields are required, mark the optional ones with
"(optional)" in the label. If most are optional, mark the required ones. Marking
every field with a star tells nobody anything. `Field` today has `required` and
no `optional`, so it can only do the second half.

**Actions.** Primary trails secondary, right-aligned, matching `Modal`'s footer.
On a page form the form itself is the surface: a card that takes the remaining
height, scrolls its own body, and carries the actions on its bottom edge, so the
commit is always reachable and belongs to the form rather than floating over the
page (Fiori's footer bar for create and edit mode).
The primary button names the event ("Add user", "Send invite"), never "Submit".
A destructive action does not sit next to Save: it belongs in the header's
overflow or its own section.

**Never change the layout between read and edit mode.** A field that moves when
edit is pressed makes the user re-find everything they were about to change.

## 4. Rules of behaviour

**Validation timing.** Validate a field on blur, after the user has been in it,
never on the first keystroke. Once a field has an error, revalidate on change so
the error clears as it is fixed. On submit, validate everything, render the
error summary, move focus to it, and mark each field. This is the pattern the
usability data supports: Baymard finds inline validation missing on 31% of sites
and wrong on a further 20%, and "wrong" is nearly always premature.

**Error summary.** More than three fields, or a dialog whose fields scroll: on a
failed submit, render a list of the failures at the top of the form, each item a
link to its field. It gives the keyboard user a route and the screen reader user
a count.

**Message content.** Say what is wrong and what to do: "Enter a work email
address" beats "Invalid email". No error text that only makes sense next to a red
border, since a colour-blind or screen-reader user never sees the border.

**Do not disable the submit button to enforce validity.** A disabled button with
no explanation is a dead end. Let the submit run and answer with the summary.
`busy` is different: during submission the primary carries the spinner and the
rest disables, which `WizardTemplate` already does.

**Saving is a choice per screen, and never mixed.** Records commit explicitly
(Save, named for the event). Settings apply per row on change, with the row
carrying its own feedback. A draft form autosaves on blur and after a pause in
typing, and says so with a status line ("Saved 14:32"). One screen picks one of
the three: a page that autosaves some controls and asks for Save on others is a
page nobody trusts.

**Leaving with unsaved work.** Any explicit-save form that is dirty warns on
route change and on tab close. The system has no such guard today.

**Never ask twice.** Anything the user already entered in this process arrives
prefilled or is shown as a read-only answer (WCAG 2.2, 3.3.7 Redundant Entry).
The wizard review step is where this is usually broken and where `WizardReview`
already does it correctly.

**Autofill and authentication.** Every field with a known purpose gets its
`autocomplete` token, plus `inputMode` where the mobile keyboard differs. Paste
into password fields stays allowed (WCAG 2.2, 3.3.8). The system currently ships
neither.

**Server errors are content, not toasts.** A failure the user must act on
belongs in an `Alert` inside the form, above the actions. A toast that scrolls
away is only for a success the user does not need to act on.

## 5. What to build, in order

**P1: the rules layer and the missing spine.**

1. `screen-specs/form-rules.json` plus a `check:spec` validator, exactly like
   `card-rules.json`: a spec zone that captures input declares its `formKind`,
   its field count and its save mode, and the rules decide whether the template
   it named is allowed. This is what turns the table above into something the
   gate enforces instead of prose an agent may or may not read.
2. `FormPageTemplate` (block): page header, capped column, `FormSection` stack,
   sticky footer actions, error summary slot. The archetype `form` gains its
   page-sized template and stops pretending everything fits a dialog.
3. `FormSection` (molecule): `fieldset` plus `legend`, an optional description,
   a `FormStack` inside. Grouping becomes possible at all.
4. `ErrorSummary` (molecule): the on-submit list, focusable, each row linking to
   its field.
5. `CheckboxGroup` (molecule): the missing twin of `RadioGroup`.
6. `Field` gains `optional` (renders "(optional)") and moves the hint above the
   control; the error stays where the system already puts it.

**P2: the behaviours the products are already hand-rolling.**

7. `FormPanel` (block): `SidePanel` plus `FormStack` plus footer actions.
8. `SaveStatus` (atom) plus a `useAutosave` hook for draft forms.
9. `useUnsavedChanges` hook: the route and tab-close guard.
10. `CharacterCount` on `Textarea`, and `ConditionalReveal` for the dependent
    field under a radio option.
11. `autocomplete` and `inputMode` documented per control in the registry, with
    a lint rule for the fields whose purpose is known (email, name, phone).

**P3: the long tail, each waiting for a second use.**

12. `InlineEdit`, `RepeatableFields` ("Add another"), the verified destructive
    confirm, bulk edit, and the one-question-per-page template.

**The proof:** a `forms` screen in the showcase, next to `content-patterns`,
rendering each form kind with real content, so the choice can be looked at
rather than argued about.

## Sources

GOV.UK Design System (question pages, one thing per page, error summary,
optional marking), Baymard Institute (label placement, inline validation
failure rates), SAP Fiori (object page edit and create mode, footer bar, draft
handling), NN/g (form layout, efficiency versus expectations), GitLab Pajamas
(saving and feedback), WCAG 2.2 (1.3.5, 3.3.1, 3.3.7, 3.3.8), and the registry
and source of this package as measured above.
