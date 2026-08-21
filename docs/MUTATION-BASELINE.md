# Mutation baseline

Coverage says a line ran. This says a WRONG line would have failed something.
Stryker edits the source (flips a condition, drops a call, swaps an operator) and
counts how many of those edits the suite killed.

Measured runs are kept here with their conditions, the same way `evals/BASELINE.md`
keeps eval runs. Do not rewrite an old row; add a new one.

Run: `npm run mutation` (minutes, not part of the per-turn gate).

## 2026-07-28 — first run, the stateful components

Scope: the components whose promise is BEHAVIOUR, where a silent break is
invisible. 516 tests, 723 mutants, 3m33s.

| File | Score | Killed | Survived | No coverage |
|---|---|---|---|---|
| **Tabs** | **85.9%** | 55 | 7 | 2 |
| Modal | 55.7% | 49 | 29 | 10 |
| Combobox | 54.4% | 92 | 63 | 14 |
| Select | 53.3% | 16 | 13 | 1 |
| Tree | 48.4% | 75 | 45 | 35 |
| **Dropdown** | **33.2%** | 69 | 116 | 23 |
| cn.ts | 0% | 0 | 3 | 0 |
| formatDate.ts | 0% | 0 | 0 | 5 |
| **All** | **49.3%** | 356 | 276 | 90 |

### What the number actually says

Half of the injected breaks go unnoticed. The spread matters more than the mean:
Tabs at 86% is what a tested component looks like, Dropdown at 33% is the one the
contract advertises hardest ("full keyboard nav, focus trap, ARIA built-in").

The Dropdown survivors are not spread evenly. 60 of 139 sit on eight lines, all
of them **placement geometry**: flip-above-when-it-does-not-fit, pin-to-the-right
near a viewport edge, the RTL mirror, match-trigger-width.

That is not a missing test. **jsdom has no layout engine**, so every
`getBoundingClientRect()` in a test returns zeros: the branch runs, every
measurement is 0, and no assertion can tell the outcomes apart. More tests of the
same kind would not have moved it.

The fix is structural, and it is the first thing this measurement bought:
`Dropdown/placement.ts` takes the measurements as arguments and returns the
position, so the arithmetic is testable without a browser.

### Where the rest of the gap is

`cn.ts` at 0% is a five-line helper every component calls, with no test of its
own. `formatDate.ts` has no coverage at all. Both are cheap.

Modal / Combobox / Select / Tree sit in the 48-56% band, which is roughly "the
happy path is tested, the edge cases are not". Reading their survivor lists is
the next honest piece of work.

## 2026-07-28 — same day, after acting on the first run

Two changes, both driven by what the run showed. Same command, same suite.

| File | Before | After | What changed |
|---|---|---|---|
| Dropdown geometry (`placement.ts`) | — | **89.5%** | Extracted from Dropdown.tsx; the arithmetic now takes measurements as arguments, so 15 tests can check flip / pin / clamp / match-width without a layout engine |
| `Dropdown.tsx` | 33.2% | **46.7%** | Higher because the untestable half left the file, not because more of it is tested |
| Dropdown, combined | 33.2% | **58.5%** | |
| `cn.ts` | 0% | **100%** | 5 tests. Its whole job is dropping falsy values, and nothing checked that |
| `formatDate.ts` | 0% | **100%** | 3 tests |

Suite: 516 -> 531 tests.

The lesson worth keeping: a low score is not automatically "write more tests".
Two thirds of Dropdown's gap was **untestable by construction**, and the fix was
to change the shape of the code, not to add assertions. The other 0%s were exactly
what they looked like and cost fifteen minutes.

Still open, in the order the numbers suggest: Modal 55.7, Combobox 54.4,
Select 53.3, Tree 48.4.

## 2026-07-30 — Dropdown taken from 46.7% to 69.3%

Same scope and command. Whole-suite score 49.3% → **60.1%**; the only file that
changed is Dropdown, plus `cn`/`formatDate` which reached 100% when `lib.test.ts`
landed.

| File | Score | Killed | Survived | No coverage |
|---|---|---|---|---|
| **Tabs** | **85.9%** | 55 | 7 | 2 |
| **Dropdown** | **69.3%** | 104 | 45 | 1 |
| Modal | 55.7% | 49 | 29 | 10 |
| Combobox | 54.4% | 92 | 63 | 14 |
| Select | 53.3% | 16 | 13 | 1 |
| Tree | 48.4% | 75 | 45 | 35 |
| cn.ts | 100% | 3 | 0 | 0 |
| formatDate.ts | 100% | 5 | 0 | 0 |
| **All** | **60.1%** | 399 | 202 | 63 |

Dropdown was the worst score in the system and the widest blast radius: `Select`,
`Combobox` and every `⋮` row menu are built on it. 6 tests → 21.

What the surviving mutants said was untested, in the order it mattered:

- **The portal.** Dropping `createPortal` renders a menu that satisfies every
  ARIA assertion and is invisible inside the first `overflow: hidden` card.
- **`align` defaulting to the trailing edge.** Not decoration: a `⋮` in a card's
  top-inline-end corner opens a menu that must not hang off the card. Flipping
  the default sends every overflow menu the wrong way, silently.
- **Re-measuring on scroll and resize.** An open menu is `position: fixed`
  against numbers taken once; without the listener it sits still while its
  trigger scrolls away underneath it.
- **Tab closing without returning focus.** The one close path that deliberately
  does NOT restore focus to the trigger, because the user is tabbing onward and
  yanking them back would trap them between the two.
- **The inert-key case.** A mutant that drops a `break` or collapses a `case`
  shows up as focus moving on a key that should do nothing.
- **`data-open` on the wrapper, `menuClassName` on the portaled menu, the
  divider's `role="separator"`, the item's `type="button"`** — a menu item inside
  a form submits it without that last one.

Two of the first tests written were wrong about the component rather than about
the mutants: `position: fixed` is in the stylesheet, not in the computed style,
and Escape only reaches the menu's handler once focus has landed on an item a
frame after open. Both were corrected against the source, not asserted around.

Still open, and deliberately: 45 survivors are mostly `?? 0` fallbacks for
geometry jsdom always reports as zero, and memo identity that a test cannot
distinguish from a fresh object. Tree (48.4%) is now the worst score.

## 2026-07-30 (later) — Tree 48.4% → 80.4%, Modal 55.7% → 62.6%

Same scope and command. Whole-suite score 60.1% → **68.5%**. Tree moved because it
was tested; Modal moved as a side effect of the initial-focus fix below.

| File | Score | Killed | Survived | No coverage |
|---|---|---|---|---|
| **Tabs** | **85.9%** | 55 | 7 | 2 |
| **Tree** | **80.4%** | 127 | 30 | 1 |
| **Dropdown** | **69.3%** | 104 | 45 | 1 |
| Modal | 62.6% | 57 | 30 | 4 |
| Combobox | 54.4% | 92 | 63 | 14 |
| Select | 53.3% | 16 | 13 | 1 |
| cn.ts | 100% | 3 | 0 | 0 |
| formatDate.ts | 100% | 5 | 0 | 0 |
| **All** | **68.5%** | 459 | 188 | 23 |

Tree had 35 mutants with NO COVERAGE AT ALL — a third of the component was never
executed by a test. It is a WAI-ARIA tree, which means it is almost entirely
keyboard behaviour, and four tests covered clicking. 4 tests → 17.

The tests found two real defects rather than just killing mutants:

- **DOM focus and the tree's remembered row could disagree.** Nothing synced
  `focusId` when a row was reached by any route other than an arrow key, so
  clicking a row and pressing Down moved focus from wherever the tree last
  remembered instead of from where the user was standing. Now the row reports its
  own focus, and DOM focus is the truth.
- **The first fix was wrong in a way only a test would show:** focus events
  bubble, so a nested row focusing itself walked the handler up every ancestor
  and left the outermost row as the remembered one. Scoped to `e.target ===
  e.currentTarget`.

Also corrected: the first tests selected rows by accessible name, and a
`treeitem`'s name includes its descendants, so the group "src" matched
`/App.tsx/` too. Rows are selected by `data-id` now.

Still open: Combobox (54.4%) and Select (53.3%) are the worst scores, and Select's
16 killed mutants say it is small rather than well tested.

## 2026-07-31 — 49.3% → 80.8%, and why the last 19% is not a to-do list

Same scope and command. 516 → 645 tests.

| File | Score | Killed | Survived | No coverage |
|---|---|---|---|---|
| **Tabs** | **85.9%** | 55 | 7 | 2 |
| **Select** | **84.8%** | 28 | 4 | 1 |
| **Combobox** | **84.0%** | 142 | 27 | 0 |
| **Tree** | **83.5%** | 132 | 25 | 1 |
| **Modal** | **76.9%** | 70 | 20 | 1 |
| Dropdown | 72.7% | 109 | 40 | 1 |
| cn.ts / formatDate.ts | 100% | 8 | 0 | 0 |
| **All** | **80.8%** | 544 | 123 | 6 |

### Where the numbers came from

| | before | after |
|---|---|---|
| Dropdown | 46.7 | 72.7 |
| Tree | 48.4 | 83.5 |
| Select | 53.3 | 84.8 |
| Combobox | 54.4 | 84.0 |
| Modal | 55.7 | 76.9 |
| whole suite | 49.3 | 80.8 |

### Four real defects the tests found

None of these were visible as a failing test before, because there was no test.

1. **Every modal opened with focus on "Close".** `Modal` focused the first
   focusable in document order, and that is the close button in the header. In a
   form dialog a screen reader announced the way out before the first field.
2. **`Select` promised `aria-invalid` and never set it.** Adding it was the wrong
   fix and the linter said so: `aria-invalid` is not supported on `role=button`,
   and this trigger is a button whose popup is a `menu` rather than a `listbox`,
   so calling it a combobox would be a different lie. The attribute was reverted
   and the promise corrected instead. The real gap it exposed: `<Field>` has no
   error slot, so nothing in the system can describe an invalid control at all.
3. **`Select`'s menu did not match the field width**, which both the component and
   the contract table claimed. The `select-menu` class it passed was styled by
   nobody.
4. **`Tree` lost track of which row was focused** whenever a row was reached by
   any route other than an arrow key. Click a row, press Down, and focus jumped
   from wherever the tree last remembered.

### Why not 100%

100% is not the target and cannot be: a mutation score counts mutants killed, and
some mutants are **equivalent** — the edited program behaves identically, so no
test can distinguish it. Chasing them means writing assertions about
implementation rather than behaviour, which is how a suite becomes something
people delete rather than trust.

The 123 survivors, classified:

- **Listener option flags** (`passive: true`) — observable to a browser's
  scheduler, not to any assertion. `capture: true` WAS killable and is now tested,
  because it decides whether a scroll inside a card is heard at all.
- **`?? 0` and `?.` on geometry** — jsdom reports every rect as zero, so the
  fallback and the real value are the same number. A real browser would tell them
  apart; that is what `npm run visual` and `npm run audit:pages` are for.
- **Guard clauses that only skip work** (`if (!open) return` at the top of an
  effect) — removing them attaches a listener that then does nothing.
- **Memo and callback identity** — `useMemo`/`useCallback` dropped still returns a
  correct value; only render counts differ, and asserting render counts is
  asserting implementation.

What is NOT on that list is behaviour. Everything the surviving mutants touch is
either invisible in jsdom or invisible by construction. The next honest increase
comes from moving some of these checks into a real browser, not from more unit
tests.
