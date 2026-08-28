# Is this one thing? A pass over all 142 parts

Made 2026-08-26, on the owner's instruction to stop reasoning from what the
products happen to use and reason from what the system should be. Nothing below
counts usage; every verdict is about whether two names describe one thing.

## The outside measure first

Two external readings framed it.

**The 158-design-system analysis** measures seven documentation layers. 89% of
systems ship code examples, 37% ship usage guidance, 21% document accessibility,
13% document content. Only three of 158 cover all seven. Its conclusion is
blunt: more components is not better, the highest-scoring systems are the ones
that documented what they have, and **60% of failures are systems that became
warehouses of unused parts — the debt of never refusing anything**.

**Counts.** Polaris ships 90+, Primer 40+. This system had 142. That is the top
of the range and the side of it that fails.

Measured against the seven layers, this system reads: examples 100% (and they
are compiled modules, not snippets), accessibility enforced on ~100% but
described on 30%, usage rules computed by seven decision layers but present in
only 18% of component descriptions, content guidance 12%.

So the gap is not that the system is undocumented. It is that the system is
LARGE, and that what it knows lives in the rules rather than beside the part.

## The method

For each pair inside a category: is this one thing in two forms, or two things?
Prop similarity alone answers badly — every form control shares `value`,
`onChange`, `label`, `invalid`, and that shared contract is a virtue, not
duplication. Subtracting the category's own contract before comparing is what
made the measure mean anything: it took the candidate list from 45 pairs to 7.

The strongest single signal turned out to be the components' own descriptions:
five of them call another component their counterpart, the same thing in another
form, or the same six slots.

## Merged earlier in the same pass

**ProgressBar + ProgressCircle → Progress**. HTML makes the
meaningful split elsewhere — `<progress>` is work moving toward done, `<meter>`
is a value on a scale that does not move — and this system keeps that as
`Progress` and `Meter`. Line versus ring is a choice about the room available,
not about what is being said, so it is `shape`. 129 components became 128.

## What the pass actually returned

Five pairs looked like merges when judged by SHAPE — overlapping slots, overlapping
props, and in five cases a component's own description calling another its
counterpart. One survived the second test and four did not.

The second test is the one that matters, and it is not prop overlap: **what does
this component DO that the other cannot?** A description says what a part is
assembled from; it does not say why the part exists.

### Merged

**`ContentRow` → `ContentCard layout="row"`** (done 2026-08-26). The same six
slots in the same order. The check that could have killed it was the prop
matrix, and it held: `layout` (where the media sits) and `density` (how much of
the anatomy survives) are orthogonal, and `auto` was already dropping the
excerpt under 360px — density applied automatically. So density now reads on a
tile as well as on a row. The row form paints no surface of its own, because a
list of entries lives in one card and draws its own hairlines; a card per row is
a stack of boxes. `bare` went with it: it meant "a card with no media", which is
what omitting `media` already means, and on one axis with `row` it was answering
a different question. 128 → 127.

### Withdrawn, with the reason

| Pair | Behaviour the second one cannot supply |
| --- | --- |
| `RenameDialog` → `FormModal` | Reseed-on-open by remount key (instead of a cascading effect), focus-and-select exactly once, Enter to submit, and the submit semantics: empty cannot submit, unchanged closes without `onSave`. FormModal takes arbitrary `children` and can supply none of it — folding makes every caller rewrite all four. |
| `HoverCard` → `Popover` | Different accessibility contracts, not one with a flag. Popover is `role="dialog"` with `aria-haspopup`/`expanded`/`controls`, opened by click, closed by Escape. HoverCard is `aria-describedby` with no dialog role and two timers: an open delay and a 120ms close grace so the pointer can travel onto the card. |
| `ContextMenu` → `Dropdown` | The anchor differs in kind. Dropdown builds all of its positioning from the trigger's rect; ContextMenu anchors to a POINT, suppresses the native menu and runs its own roving index. 319 lines against 115, sharing only "a menu in a layer". |
| `Sparkline` → `LineChart` | 78 stateless lines against 229 with pointer tracking, a readout, grid, target line, labels and a legend. Turning the second into the first takes five props switched off, and five props switched off is the definition of two things. |

### The mistake worth recording

Four verdicts out of five were reached from shape and all four failed the
behaviour test. That is the same error as judging by prop overlap, one level up:
a self-description tells you what a part is made of, not what it is for.

## What the pass found instead

The real duplication is not in the public layer, it is underneath it.
**`Dropdown`, `HoverCard`, `Popover` and `Tooltip` each compute their own
position in a floating layer, and `Dropdown`, `ContextMenu` and `Popover` each
wire their own dismiss listeners.** There is no shared helper for either in
`src/lib/`. Five public names stay five; one internal is missing.

That is the next decision, and it is a different kind of change from a merge: it
adds an abstraction rather than removing a name, so it is the owner's call.

## Keep, and here is the reason

| Pair | Verdict | Why |
| --- | --- | --- |
| `Meter` / `Progress` | keep | Only Meter has `target` and `ticks`, because only a fixed scale can have them. A gauge with no target is not a meter; progress with one is a deadline. |
| `Tag` / `Chip` | keep | One is data, the other a control: Chip has `ref` and `selected`, is focusable and announced as a control. Folding gives a label a pressed state it must never have. |
| `Textarea` / `Input` | keep | Different elements, and not cosmetically: rows, autogrow and reader-resize belong to one and not the other. A `multiline` prop returns a different element from the same name, which the caller cannot see in the type. |
| `ConfirmDialog` / `FormModal` | keep | One asks, the other collects. Merged, `message` and `children` become mutually exclusive — a discriminated props union, which the registry parser cannot express. Same wall Slider/RangeSlider hit. |
| `PivotTable` / `ScheduleGrid` | keep | A pivot cell holds one measure; a schedule cell holds an interval that spans cells, plus a `now` marker. The shapes look alike and the contents do not. |
| `DateBlock` / `Time` | keep | A block the eye lands on first versus a timestamp inside a sentence. Same data, different job. |
| `Button` / `IconButton` | keep | IconButton exists to make `aria-label` and a Tooltip unavoidable. The constraint is the whole component. |
| `Avatar` / `AvatarGroup` | keep | One face versus a stack with an overflow count. Every system that tried to fold these regretted the items API on the single case. |

## What this does not fix

The one merge that held takes 142 to 127 alongside the Progress merge, which is still above Polaris. The size is
not mostly duplication — it is coverage: seven kinds of table, four charts, a
chat subsystem, eighteen form controls. Each earns its place by a rule that
chooses it. The honest lever is not another merge pass, it is the second finding
above: **usage guidance sits in 18% of descriptions**, and a system whose parts
do not say when to reach for them reads as bigger than it is.
