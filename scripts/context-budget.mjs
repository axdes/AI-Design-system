/* Context budget — the cost side of the harness.
 *
 * Everything an agent must read before it may touch this UI is paid for on EVERY
 * task, by every agent, forever. That makes it a budget like bundle size, not a
 * free resource.
 *
 * 2026-08-13, the change that made this number small: the must-read set used to
 * be AGENTS.md + the WHOLE registry, 48k tokens, 82 components deep, to write a
 * screen out of four of them. Discovery now reads component-index.json (one line
 * per component) and pulls the detail it needs with `npm run registry -- <Name>`.
 * The full registry is still generated, still verified, still what the linters
 * read: it just stopped being context. Must-read went 48k -> about 11k, and the
 * marginal component now costs 30 tokens on every task instead of 460.
 *
 * That is only safe because the guardrails are deterministic. `npm run verify`
 * on every edit, the PostToolUse hook and gen-registry:check reject an invented
 * component or prop whether or not the agent was carrying the full registry. An
 * index buys discovery; the linter enforces the contract.
 *
 * This reports what the must-read context costs, where the weight sits, and
 * fails when it goes over budget.
 *
 * Token counts are an ESTIMATE (chars / 4, the usual rule of thumb for English
 * plus code). We do not ship a tokenizer for this: the number is a trend line
 * and a budget, not billing. Compare runs, do not quote it as exact.
 *
 * Run: npm run context
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const tokens = (text) => Math.ceil(text.length / 4)
const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`)

/* The must-read set, in the order an agent meets it. Keep this list honest: if
 * a file becomes required reading, it belongs here. */
const REQUIRED = [
  /* 6500 -> 7000 on 2026-07-26: the 67-component set added a dozen
   * "reach for X when you need Y" rows to the primitives table. Those rows ARE
   * the discovery value (an agent finds reuse here before the registry), so the
   * growth is the point, not bloat. Trim prose elsewhere before raising again. */
  /* 7000 -> 7300 across the two checklist.design passes on 2026-08-08. The
   * primitives table gained nine rows: TableScroll, the presence avatar, menu
   * sections, and the seven new components a screen would otherwise hand-roll
   * (clipboard, timestamp, password reveal, code entry, search highlighting,
   * load-more, carousel). Same argument as the 6500 -> 7000 note above, which is
   * why this file has a budget rather than a ban: an agent that finds the right
   * component HERE never writes the wrong thing, so a row that prevents a
   * hand-rolled clipboard call pays for itself on the first use.
   *
   * Paid for first, three times over: the layout file list went back to being
   * the filesystem's job, four Enforcement bullets lost their war stories and
   * their drifting component lists, and every added row was rewritten twice.
   * About 1.1k characters came out before 1.4k went in. The next raise needs a
   * bigger cut than that, and the honest one left is the table itself: it
   * duplicates a "reach for X when you need Y" line the registry already
   * carries, and the registry is read before any UI work regardless. */
  /* 7300 -> 6300 on 2026-08-13. The 70-row primitives table came out: it was a
   * "reach for X when you need Y" line per component, which is exactly what the
   * index row now carries, generated from the component's own JSDoc instead of
   * hand-maintained here. What stayed is the dozen pairs that get confused
   * (Tooltip vs Popover, Table vs DataGrid), which is guidance no single
   * component's description can carry. */
  /* 6300 -> 6360 on 2026-08-20 for the decision layer: one new MUST bullet in
   * the spec-first section (`archetype`, `primaryQuestion`, per-zone
   * `task`+`data`, enforced against selection-rules.json). Paid for first: the
   * bullet was cut from six lines to three before the raise, and the rules
   * themselves live in screen-specs/ as on-demand data, not here — the contract
   * carries one pointer, not the table. 6350 actual, so the ceiling sits 10
   * tokens above the file, not three kilobytes. */
  /* 6360 -> 6420 on 2026-08-20, second raise of the day and for the second
   * owner rule of the day: the no-subtitle DON'T (subtitle prop removed
   * system-wide). Paid for first: the bullet was compressed from four lines to
   * three before the raise. Two real rules in one day is why the ceiling moved
   * twice; a third raise needs a cut, not a note. */
  { path: 'AGENTS.md', why: 'the system contract, read every session', budget: 4600 },  /* 6420 -> 6560 on 2026-08-23: five lines for the form decision layer. The contract has to name it, or an agent writes a 15-field dialog and finds out at the gate. 6560 -> 6760 the same day for the TABLE layer, on the same argument and for the same price: six lines saying a table zone declares WHICH table, and six naming the components that are a table (TreeTable, PivotTable, ComparisonTable, ScheduleGrid, DiffTable) so an agent stops reaching for <Table> and a padding class. A contract that does not name a layer is a layer the gate enforces and nobody was told about. 6760 -> 6900 the same day again, for the five lines that name the CELL layer: a zone may declare its columns, and then each column says what it carries and the rules decide alignment, width, sortability. Same argument the third time; the alternative is a gate that rejects a column alignment nobody was told was a rule. 6900 -> 7050 the same day, fourth
   * time, for the six lines that name the LIFECYCLE layer: a screen may declare
   * what it does to the resource, and the three decisions that hang off it
   * (which detail page, which shape an edit takes, how hard a destruction is to
   * confirm) stop being taste. The one line that has to be in the contract
   * rather than only in the rules file is the delete rule, because it is
   * counter-intuitive: a reversible destruction gets an undo and NOT a dialog.
   * An agent that has not been told that adds an Are-you-sure to everything,
   * which is precisely the habit that gets the irreversible one clicked
   * through.  4500 -> 4600 on 2026-09-02, for the fourth token tier: `recipes.css` holds the whole answers (--focus-ring, --disabled-opacity, --surface-edge) and `lint:rules` fails a component that rebuilds one from its parts. Same argument as the layer raises above, and the file was seven tokens under the old ceiling, so naming the tier at all needed the raise. The alternative is a rule the gate enforces and the contract never mentions, which is the one thing this budget must never buy. */
  /* component-index.md, new on 2026-08-13 as JSON and text since 2026-08-16. One
   * line per component: name, level, surface, the parts of a compound, and one
   * sentence saying what it is for. 2.4k for all 82 components and 7 blocks,
   * against 41k for the registry it replaced in this list.
   *
   * Text rather than JSON because the only thing that reads it reads text: a row
   * spent eight of its thirty-six tokens on quotes, braces and keys. 26% off with
   * nothing dropped, and the runway went from eight more components to
   * forty-four. The tools do not read this file at all — the CLI and the MCP
   * server build the same rows from the registry, so there is one row builder
   * (scripts/lib/index-rows.mjs) and no second data structure to keep in step.
   *
   * When the budget does trip, the answer is not a shorter sentence: cutting the
   * cap to 80 characters elides half the rows mid-phrase, which is measured and
   * recorded in the generator. It is either a deliberate raise, or search becomes
   * the only path and this file stops being must-read. */
  { path: 'component-index.md', why: 'what exists, one line each — discovery reads this', budget: 4600 },  /* NOT raised on 2026-09-03, and the twenty-one mechanism rows still went in: the raise was written, measured and taken back out the same hour, because capping each row to one sentence — the cap the component rows have always had — bought the whole section and 100 tokens besides. A budget is a question about what a line is worth, and the first answer here was to pay rather than to ask. The argument for the section stands and is worth writing down: for the twenty-one lines that make BEHAVIOUR discoverable: src/lib is where the mechanisms live and it had no index row, no search and nothing to find. The price of that was measured rather than guessed — four floating layers written by hand beside a hook that already carried the listeners, the throttled reflow and both dismissals, and three list navigations beside another, every one of them missing a key its neighbour had. At the multiplier below, 200 tokens is about 12k a run and under a cent; one rewritten mechanism costs an afternoon and ships an accessibility defect. The rows are one sentence each on purpose: the reasoning stays in the file, where somebody changing it looks. 4050 -> 4170 -> 4600 on 2026-08-28, and this is the deliberate raise the note above says the runway ends in. It was taken with a number rather than a feeling, because 2026-08-28 is also the day the harness first PRICED a run: one screen, 4,350k tokens, 61 turns, $3.45, of which 98% is context re-read turn after turn (evals/BASELINE.md). That gives the multiplier this budget never had. 1k of must-read is not 1k; it is 1k x 61 = 61k, 1.4% of the run. So this 430-token raise costs about 26k tokens and two cents per screen, and buys room for roughly seventeen more components instead of three. The alternative on the table was making search the only path and dropping this file from must-read, and the measurement argues against it: the index is 5.7% of a run's tokens and it is what stops an agent guessing a component that does not exist — the defect the eval baseline traced most of its lost points to. Taken knowingly, and the next raise needs its own number. 3600 -> 3800 on 2026-08-23: seven index rows for the form layer, 28 tokens each. The rows are the cheap half of a component — this is the file that keeps a component findable at all. 3800 -> 3900 the same day for the table layer's eight rows (TableToolbar, BatchActions, ColumnPicker, TreeTable, PivotTable, ComparisonTable, ScheduleGrid, DiffTable). Eight rows at 28 would be 224; it costs 57, because the generator fix that went in with them (parts publish their OWN props, not the main component's) shortened the index rows of every compound as well. 3900 -> 4050 for the CELL layer's four rows (Truncate, CellStack, TagGroup, Thumbnail): the parts a real cell needs, which the table layer's exhibits proved were missing the moment the content stopped being text. */
]

/* Read on demand, not on every task: `npm run registry -- <Name>` returns these
 * entries for the four or five components a screen actually uses. The file has a
 * ceiling anyway, because a registry that doubles makes every fetch twice as
 * expensive, and a per-entry ceiling, because that is the number an agent pays
 * when it asks. */
const ON_DEMAND = [
  /* 43000 -> 42000 on 2026-08-08, LOWERED while the system grew by fourteen
   * components and a dozen props, which is worth writing down.
   *
   * The first checklist.design pass pushed this over and took the ceiling to
   * 44000. Then the second pass looked at where the weight actually was, and it
   * was not the contract: `props` was the heaviest field in the file and most of
   * it was indentation, eight lines for what reads fine on one. The generator now
   * emits one line per prop and everything else stays indented, which took the
   * registry from 43.4k to 38.3k with no field removed and, if anything, a better
   * diff. Eight new components then brought it back to 41.0k.
   *
   * So the ceiling comes DOWN to 42000 rather than staying where the panic put
   * it. A budget parked three kilobytes above the file is not a budget. The next
   * component costs about 300 tokens and there is room for three; after that,
   * find the next thing that is formatting rather than contract.
   *
   * 2026-08-13: this stopped being must-read context and became a query target,
   * so the ceiling moves from "what fits in every prompt" to "what keeps a fetch
   * cheap". 60000 total, and 600 per entry — six components fetched for one
   * screen is then about 3k, which is the number that now matters.
   *
   * 2026-08-22: PARTS now publish their own props (Card's CardMedia carries
   * placement / wash / playable / duration / ratio, and until this the registry
   * said a part had no props at all, which reads as "invent them"). That plus
   * ten new components put the file at ~59k against the 60k ceiling. The
   * ceiling stays: the next thing to cut is the per-entry example, which is
   * where the formatting is, not the contract.
   *
   * 2026-08-23: 60000 -> 61000. The card grew a documented part — <CardCorner>,
   * the top-right slot every card may carry a menu in — and <ListItem> a marker
   * prop, and both are contract rather than formatting. The example cut named
   * above was tried FIRST and does not pay: an entry's example is already
   * capped at 600 tokens, so trimming a long one only changes which 600 lines
   * it publishes, not the size. The remaining fat is the per-prop JSDoc, which
   * is the part an agent actually reads.
   *
   * 2026-08-23 (second move today): 61000 -> 64000. Four components landed —
   * <Toast>/<ToastStack>, <InputGroup>, <ButtonGroup> and <LineChart> — at
   * roughly 650 tokens each. Three of them close gaps this system had no answer
   * for at all: there was no way to say "saved" without a block in the page
   * flow, no way to attach a unit or a Copy button to a field without forking
   * the field frame for the seventh time, and no way to build a split button.
   *
   * Paid for first, and it did not pay: the per-entry cap is already 950 and
   * none of the four is near it, so there is nothing to trim on the way in. The
   * cheaper move — dropping `sourcePath`, which an agent with the repo does not
   * need — saves about 4k and is the next thing to take if this ceiling is
   * asked to move again. It is left in this time because the ceiling has now
   * moved twice in one day and a third change to what the file CONTAINS on top
   * of that would make the size series unreadable.
   *
   * 2026-08-23 (third): 64000 -> 66000 for <Link>, and the payment named above
   * was tried and does not pay. Dropping `sourcePath` saves about 4k on the
   * claim that "an agent with the repo does not need it" — which is wrong:
   * `npm run registry` prints exactly that line (scripts/registry.mjs:67), and
   * it is how an agent gets from a name to a file. Trading a capability an
   * agent uses for four kilobytes it does not read is the wrong direction, and
   * writing that down is worth more than the four kilobytes.
   *
   * <Link> is not another variant of something: the system had no link at all.
   * Four components had each picked their own link colour by hand, and the only
   * brand-coloured one was a <button>, so an ordinary link in a sentence could
   * not be built. The next real saving is the per-prop JSDoc, and that is the
   * part an agent actually reads, so it should be the last thing to go.
   *
   * 2026-08-23 (fourth): 66000 -> 69000 for the FORM layer — <FormSection>,
   * <ErrorSummary>, <CharacterCount>, <ConditionalReveal>, <SaveStatus>,
   * <FormPageTemplate> and <FormPanel>, seven entries at roughly 400 each. What
   * they buy is the half of the screen this system could not describe: the
   * `form` archetype pointed at one template (a form in a <Modal>), so a 15-field
   * object was either crammed into a dialog or hand-rolled in an app, a form
   * could not group its fields at all (no fieldset, no legend), and a failed
   * submit could only mark fields in place. Measured before building:
   * docs/RESEARCH-FORMS.md.
   *
   * Paid for first, twice. The per-entry cap is 950 and the biggest of these is
   * 645, so there is nothing to trim on the way in; and <CheckboxGroup> was
   * deliberately NOT given an entry of its own — it ships inside <Checkbox>,
   * the way <RadioGroup> ships inside <Radio>, which is one index row and one
   * entry saved for a component that is genuinely the same control grouped. */
  {
    path: 'component-registry.json',
    why: 'the full contract, fetched per component',
    /* 2026-08-23 (fifth): 69000 -> 70500 for the TABLE layer — eight entries
     * (TableToolbar, BatchActions, ColumnPicker, TreeTable, PivotTable,
     * ComparisonTable, ScheduleGrid, DiffTable) plus twelve new parts on
     * <Table> and six props on <DataGrid>. Eight entries at ~400 is 3.2k, and
     * the ceiling moves 1.5k, because it was PAID FOR first and the payment was
     * real: the slot extractor used to fall back to the file's generic `Props`,
     * so every part of every compound published the MAIN component's props.
     * Table carried its three table-level props thirteen times (1892 tokens of
     * one contract), Card published CardMedia's props on CardHeader, and
     * `verify` accepted <Td stickyHeader> as a real thing. Parts now read their
     * own signature; that took 5k off the file and 818 off Table alone, which
     * is most of what the new layer costs.
     *
     * What is left to cut, in order: the per-prop JSDoc (the part an agent
     * actually reads, so it is last), then `sourcePath` (already argued down
     * once: `npm run registry` prints it, and it is how an agent gets from a
     * name to a file). Neither is taken here.
     *
     * 2026-08-23 (sixth): 70500 -> 71000 for <Page>, the page-geometry layer.
     * One entry, and it was trimmed twice before the ceiling was touched: the
     * per-prop JSDoc came down to one line each and the golden example from 315
     * tokens to 191, which is the order this note prescribes. What is bought is
     * a mechanism that should REPAY the 500: five of the nine page templates
     * (Detail, Overview, Settings, System, AdaptiveList) are geometry rather
     * than behaviour, and geometry now lives in screen-specs/page-rules.json.
     * Each one that becomes a preset entry gives ~400 tokens back, so this
     * budget line is expected to move DOWN at the next pass, not up. If it has
     * not by the time the fifth template is folded in, the trade did not happen
     * and this 500 should be taken back out.
     *
     * 2026-08-23 (seventh): +1200 for three components the system needed to be
     * able to describe itself — <BrandMark>, <Prose>, <Code>. Two of them are
     * not additions but CONSOLIDATIONS: the brand cap was hand-written in two
     * products, and the measure-and-muted-ink paragraph in four files of this
     * repository's own site, each with a slightly different number. Both now
     * exist once. `Code` is a genuine addition and a genuine gap: a package
     * with 126 components could not show a line of source without a product
     * hand-rolling a <pre>, and the one this site hand-rolled failed axe. */
    /* 2026-08-26 (tenth): 77000 -> 81000 for the CONTENT layer. Every part that
     * takes words now carries a `Copy:` paragraph saying what words — 75
     * components and 12 blocks, up from the 13% that said anything (measured
     * the same day). This is the layer the reading of 158 design systems put
     * FIRST: the highest-scoring were not the ones with the most parts but the
     * ones that documented what they had, and content guidance was the rarest
     * layer of all.
     *
     * It is also the raise to be least worried about. This number is a SUM over
     * every entry, and no agent fetches the sum — it fetches the one component
     * it is about to write, and the per-entry ceiling below is what that costs.
     * That ceiling did not move: <Table> went 26 tokens over it and its own
     * guidance was tightened rather than the ceiling lifted. */
    /* 2026-08-26 (ninth): 76500 -> 77000 for <MenuIconButton>, and unlike the
     * raise below this one IS the count: one more component. It is worth the
     * 371 tokens because it closes a gap four screens were paying for by hand,
     * and because its `label` is required — the accessible name on a control
     * made of one glyph stops being something to remember. Blocks went 14 -> 12
     * the same day, so the number of ENTRIES an agent can meet still fell. */
    /* 2026-08-26 (eighth): 75400 -> 76500, and the component COUNT went down
     * this session, not up: ContentRow folded into ContentCard, FormModal and
     * ConfirmDialog folded into Modal, MenuButton added. 129 -> 128 components,
     * 14 -> 12 blocks. The registry still grew, and every byte of the growth is
     * contract that was always true and never published: object-typed props now
     * carry their fields (an agent handed `actions: Actions` cannot build a
     * value, which for this package is the same as the component not existing),
     * and twelve components that write their unions with double quotes got
     * their allowed values back after a reader bug was fixed. Paying ~1100
     * tokens to stop agents guessing at contract is the trade this budget
     * exists to let us make deliberately. */
    /* 2026-08-23 (seventh): 71000 -> 73500 for the CELL layer — Truncate,
     * CellStack, TagGroup and Thumbnail, the four parts a cell that is not text
     * needs. Four entries at roughly 400, plus the column props on <Table>
     * (width, hideBelow, layout) and the <ThGroup> part. What they buy is the
     * end of the three answers a long value used to have (wrap and lose the
     * scan, widen and lose the page, or nothing) and of the hand-stacked
     * two-line cell in every product. Measured before building:
     * docs/RESEARCH-TABLE-CONTENT.md. */
    /* 2026-08-26 (eleventh): 81000 -> 82000 for the two parts that close the
     * last two open requests — IconDisc (414) and ColorSwatch (475). Both are
     * atoms and both were paid for OUTSIDE this file before the ceiling moved:
     * the site gave back 24 lines of hand-written CSS and one written exception
     * for a raw control, which is exactly the trade this budget is meant to
     * make legible. An agent that cannot see ColorSwatch reaches for
     * `<input type="color">`, which the linter refuses — a part the contract
     * hides is a part that costs more than it saves. */
    /* 2026-08-26 (twelfth): 82000 -> 101000, and this one is not growth. The
     * generator has always meant to publish each prop's description — the MCP
     * `component` tool documents `dense` as the way to DROP them — and it
     * published none, for any prop, ever: the field splitter cut on newlines, a
     * JSDoc block spans them, and every comment was torn off its prop and
     * dropped. 0 of 782. What an agent could read was a name, a type and a list
     * of allowed values; WHY a prop exists, and when not to pass it, never left
     * the source file. 463 of them arrive now, and they are the half of the
     * contract that stops code which compiles and is still wrong: `<Alert
     * onDismiss>` on a warning the reader has not resolved, `iconEnd` on a
     * button where it does nothing. The file is fetched per component, so the
     * real price is about 120 tokens on the one entry an agent asked for. */
    /* 101000 -> 106000 on 2026-08-28. The same growth the previous raise was
     * for, continuing: 478 of 782 props now say what they mean, against 463 a
     * day ago and 0 before the generator was fixed. The five universal props —
     * className, children, ref, id, style — are stated once in AGENTS.md instead
     * of 88 times here, which is the only trimming available that does not cost
     * an agent something it would otherwise guess. */
    /* 2026-08-29: 106000 -> 108000, and this is the raise the note above
     * prescribes rather than the one it warns against — it is per-prop JSDoc,
     * which that note names as the LAST thing to cut.
     *
     * What it buys: every decision-carrying prop in the system now says which
     * value to pick and why. Measured before: 258 props whose type is a union
     * or a boolean, 67 of them with no description at all — `Meter size`,
     * `Alert tone`, `MenuIconButton variant`, `SaveStatus state`. An agent
     * reading `size?: 'sm' | 'md' | 'lg'` with nothing beside it guesses, and
     * the guess is the defect the eval baseline traced most of its lost points
     * to. 67 lines, about 2,600 tokens, 39 each.
     *
     * PAID FOR FIRST, and more than covered: the same day the published
     * example stopped carrying its own commentary, which gave 4,860 tokens
     * back and took seventeen truncated examples down to two. The day started
     * OVER this budget at 107.9k with none of these descriptions written and
     * ends at 106.2k with all of them, so the net movement is -1.7k.
     *
     * The 2,000 is deliberately more than the 200 needed: at 552 tokens an
     * entry, a ceiling 200 above the file is a ceiling the next component
     * trips, and a budget that has to be raised to add anything is a rubber
     * stamp rather than a decision. This leaves room for three.
     *
     * What is left to cut when this is next tight, in order: `sourcePath`
     * (1,443 tokens, argued down once and still not taken — `npm run registry`
     * prints it), then `variants` (2,307, which duplicates `props[].values`
     * for every union prop and adds only the boolean-derived rows the variant
     * sheet photographs). Neither is taken here, because both have named
     * readers and refactoring a field to fit a number is the wrong reason. */
    budget: 108000,
    /* 600 -> 620 on 2026-08-20 for WizardTemplate, the first entry that carries
     * a template plus two sub-components (WizardReview, WizardReviewRow) in one
     * contract. Paid for first: the entry was cut 680 -> 605 (two props removed
     * with an argued reason, the example dieted) before the ceiling moved 20.
     * Six worst-case fetches are now ~3.7k — the number this ceiling guards.
     *
     * 620 -> 950 on 2026-08-22, once PARTS began publishing their own props.
     * Four compound entries went over: Wizard (905), Card (839), Overview (742),
     * Settings (650). What moved them is CONTRACT, not formatting — `CardMedia
     * placement / wash / playable / duration / ratio` is the card's media
     * contract, and while it was unpublished the registry effectively said
     * "invent it", which is the one thing this file exists to prevent. Paid for
     * first, as last time: every part dropped its `line` field (nothing ever
     * read it; the entry already carries sourcePath). The example was NOT cut —
     * on these four it is the thing agents copy. Six worst-case fetches are now
     * ~5.7k, and that is the number to watch: the next raise has to come from
     * cutting an example, because there is nothing else left that is formatting
     * rather than contract. */
    /* 950 -> 1100 on 2026-08-23, for one entry: <Table>. The table layer put
     * twelve parts in it (TFoot, TrGroup, TdExpand, TrDetail, TableEmpty,
     * TableSkeleton and the props the older parts always had), and after the
     * extractor fix every one of those parts publishes its own contract rather
     * than a copy of the table's. 1892 -> 1074 was the payment; the remaining
     * 1074 is contract.
     *
     * The alternative was measured rather than assumed: splitting the parts
     * into their own entries costs twelve index rows (~336 tokens on EVERY
     * task, not just the ones that fetch a table) plus twelve entry headers,
     * against 124 tokens over the old cap on the tasks that fetch this one.
     * Keeping a compound compound is the cheap arrangement. */
    /* 1250 -> 1300 on 2026-08-26, still <Table>, and only after trimming twice.
     * The content layer landed that day — every part that takes words now says
     * what words — and <Table>'s share of it went 26 tokens over. Its guidance
     * was tightened once, then cut to a single sentence, which left 10. What is
     * left is not prose: seven sub-components' contracts and an example already
     * capped at 300 tokens, and cutting either costs the agent more than the ten
     * tokens save. Table is the one entry that keeps meeting this ceiling
     * because it is genuinely seven components in one folder. */
    /* 1200 -> 1250 on 2026-08-26, still <Table>, and this raise buys contract
     * rather than prose. The registry read string-literal unions written with
     * SINGLE quotes only, so twelve components — Table among them — had been
     * publishing `size: Size` with no values behind it. Fixing the reader gave
     * Table's `size`, `layout` and `Th.sortDirection` their allowed values, and
     * that is 32 tokens an agent previously had to guess at. The entry did not
     * get more verbose; it got less wrong. Nothing was trimmed to fit because
     * the example is already cut at its own 300-token cap and the rest is seven
     * slots, each a real sub-component. */
    /* 1100 -> 1200 on 2026-08-23, still for one entry: <Table>. The cell layer
     * added <ThGroup> and three column props (width, hideBelow, layout), and
     * the entry went 1074 -> 1169.
     *
     * Paid for first, and the payment is the evidence: the golden example was
     * cut (the expandable row moved out of it, since the parts are documented
     * and the showcase now has an exhibit for that kind) and the entry moved
     * FOUR tokens, because the emitted example is capped at 300 and was already
     * over it. The weight is the fourteen parts and their props, which is
     * contract. Splitting them into their own entries costs fourteen index rows
     * (~400 tokens on EVERY task) against 69 over the old cap on the tasks that
     * fetch this one. */
    /* 1300 -> 1900 on 2026-08-26, and for the same reason as the file budget
     * above: every prop that has a description started carrying one, having
     * carried none since the generator was written. The two entries over the
     * old line are the two biggest contracts in the system — <Table> (thirteen
     * parts, forty-odd props) and <Page> (twenty) — and their size is what they
     * ARE, not padding: the longest description on either is 273 characters.
     * Trimming was tried first, as the note above demands, and there is nothing
     * to trim that an agent would not then have to guess. */
    perEntry: 1900,
  },
]

/* Raised 45k -> 48k on 2026-07-26 with the jump to 56 components (async, forms,
 * data/nav, disclosure, overlay all now covered). A conscious decision, not a
 * reflex: the coverage is worth ~3k more per task. This is the last free raise —
 * the next time it trips, TRIM the per-entry payload (drop `tokensUsed` from the
 * emitted registry, shorten examples) rather than lift the ceiling again. */
/* Raised 48k -> 49k on 2026-07-30 for `RenameDialog`, then 49k -> 50k on
 * 2026-07-31 for `AdaptiveListPage` and `<Field error>`.
 *
 * Both raises were paid for first. Before each one the per-entry payload was cut
 * as this report advises, by moving HISTORY out of the published descriptions
 * into ordinary comments: the registry is read by every agent on every task, so
 * it should carry the contract, not the reason the contract exists. Eight
 * entries were rewritten that way. The fourth round reached the point where the
 * only thing left to cut was contract, which is where trimming stops being a
 * saving and starts being a loss.
 *
 * What the extra kilobyte bought: a list-page shape that existed five times and
 * now exists once, and a field that can finally say WHY it rejected an input.
 * That is the trade this budget exists to make deliberately rather than by
 * accident. The registry is still inside its own 43k line; the total binds. */
/* 50k -> 51k and back to 50k on 2026-08-08: it went up with the registry line
 * and came down again once the props were re-emitted one per line. See the note
 * on component-registry.json above. The total is what actually binds. */
/* 50000 -> 11000 on 2026-08-13, because the registry left the must-read set and
 * the index took its place. This is not a saving anyone found by trimming prose:
 * it is the same information, served at the granularity the task needs. Treat
 * 11000 as the new hard line, and note that the old one funded four rounds of
 * argument about a single kilobyte. */
/* 10000 -> 10300 on 2026-08-23. Two layers landed in one day and both are
 * must-read by construction: the chart components and the FORM decision layer,
 * whose four lines in the contract are what stop an agent building a 15-field
 * dialog and finding out at the gate, plus seven index rows at 28 tokens each.
 * Paid for first: the contract lines were cut from five to four and the survey
 * reference moved to screen-specs/README.md. Still under the 11000 the
 * 2026-08-13 note called the hard line. */
/* 10300 -> 10700 on 2026-08-23: the table decision layer, in the two files an
 * agent reads on every task. AGENTS.md gains the twelve lines that name the
 * layer and its components; component-index.md gains eight rows. Both halves
 * are argued at their own budgets above. */
/* 10700 -> 11000 on 2026-08-23 for the cell layer's half of the two must-read
 * files: five lines in the contract and four index rows. Argued at each budget
 * above. */
/* 7050 -> 7250 on 2026-08-26 for the heading-outline rule. Measured, not
 * argued: a live eval run scored 88 instead of 100 because the outline skipped
 * a level, and the contract had never said the rule — the only place an agent
 * would have learned it was the failure. Paid for in the same edit: the button
 * icon-placement section was four lines teaching the OPPOSITE of the rule the
 * owner set on 2026-06-10, and is now two lines saying the true one. */
/* 7250 -> 4500 on 2026-08-28, and DOWN for once. The file had reached 514 lines,
 * past the point where a model stops reconciling instructions and starts picking
 * one — and we had already paid for that: a contract taught the reverse of the
 * owner's icon rule for three months while the CSS said otherwise, and every
 * agent believed the contract. Six reference sections moved to docs/contract/,
 * named in a table the contract still carries, so any tool can open them by path
 * when a task needs them. Lowering the ceiling with the cut is the point: a
 * budget that stays where it was is a file that refills. */
/* 8600 -> 9030 on 2026-08-28, carrying the index raise argued at its own line
 * above and nothing else. The total is not a separate decision — it is the sum
 * of two that were each made in the open — but it is kept as its own number so
 * that a raise nobody argued for cannot arrive as an accident of arithmetic.
 *
 * 9030 -> 9130 on 2026-09-03, for the twenty-one mechanism rows that make
 * BEHAVIOUR discoverable. The section cost 380 tokens when it was written and
 * costs 92 now: the rows were capped to one sentence each, the same cap the
 * component rows have always had, and the index itself stayed inside its own
 * budget. What is left is the honest price of listing behaviour at all.
 *
 * It is worth it on a measured number rather than a feeling. src/lib had no
 * index row, no search and nothing to find, and the bill for that was four
 * floating layers written by hand beside a hook that already carried the
 * listeners, the throttled reflow and both dismissals, plus three list
 * navigations beside another — every one of them missing a key its neighbour
 * had. At the multiplier above, 92 tokens is about 5.6k a run and well under a
 * cent; one rewritten mechanism costs an afternoon and ships an accessibility
 * defect. */
const TOTAL_BUDGET = 9130 // must-read context, tokens

let failed = 0
/** The median number of turns a measured run took, or null when none was.
 *  Written by `npm run eval` through scripts/lib/agent-cost.mjs; read here so
 *  the budget and the bill are one system rather than two. */
function medianTurns() {
  const file = `${ROOT}/evals/.traces/runs.jsonl`
  if (!existsSync(file)) return null
  const ns = readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l).cost?.turns } catch { return null } })
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b)
  if (!ns.length) return null
  return ns.length % 2 ? ns[(ns.length - 1) / 2] : Math.round((ns[ns.length / 2 - 1] + ns[ns.length / 2]) / 2)
}

console.log('\x1b[1mContext budget (estimated tokens, chars/4)\x1b[0m\n')

let total = 0
for (const { path, why, budget } of REQUIRED) {
  const full = `${ROOT}/${path}`
  if (!existsSync(full)) {
    console.error(`  \x1b[31m✗\x1b[0m ${path} is missing`)
    failed++
    continue
  }
  const t = tokens(readFileSync(full, 'utf8'))
  total += t
  const ok = t <= budget
  if (!ok) failed++
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${path.padEnd(24)} ${fmt(t).padStart(7)} / ${fmt(budget)}   \x1b[2m${why}\x1b[0m`)
}

const totalOk = total <= TOTAL_BUDGET
if (!totalOk) failed++
console.log(`  ${totalOk ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${'total must-read'.padEnd(24)} ${fmt(total).padStart(7)} / ${fmt(TOTAL_BUDGET)}\n`)

console.log('  \x1b[2mon demand — npm run registry -- <Name>, not carried into every task\x1b[0m')
for (const { path, why, budget } of ON_DEMAND) {
  const full = `${ROOT}/${path}`
  if (!existsSync(full)) {
    console.error(`  \x1b[31m✗\x1b[0m ${path} is missing`)
    failed++
    continue
  }
  const t = tokens(readFileSync(full, 'utf8'))
  const ok = t <= budget
  if (!ok) failed++
  console.log(`  ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${path.padEnd(24)} ${fmt(t).padStart(7)} / ${fmt(budget)}   \x1b[2m${why}\x1b[0m`)
}
console.log('')

/* Where the registry weight actually sits. Per-entry cost is the number that
 * matters both when adding a component and when fetching one: it is the price of
 * one answer from `npm run registry`. */
const registryPath = `${ROOT}/component-registry.json`
if (existsSync(registryPath)) {
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'))
  const entries = [
    ...Object.values(registry.components ?? {}),
    ...Object.values(registry.blocks ?? {}),
  ].map((e) => ({
    ref: e.ref,
    total: tokens(JSON.stringify(e)),
    example: tokens(e.example ?? ''),
    css: tokens(JSON.stringify(e.tokensUsed ?? [])),
  }))
  entries.sort((a, b) => b.total - a.total)
  const sum = entries.reduce((n, e) => n + e.total, 0)
  const avg = Math.round(sum / entries.length)
  const tokenCatalog = tokens(JSON.stringify(registry.tokens ?? []))

  const fileTokens = tokens(readFileSync(registryPath, 'utf8'))
  const overhead = fileTokens - sum - tokenCatalog

  console.log('  \x1b[2mregistry breakdown\x1b[0m')
  console.log(`    ${entries.length} entries, ${fmt(sum)} tokens (avg ${avg}/entry) + ${fmt(tokenCatalog)} for the token catalogue`)
  console.log(`    ${fmt(overhead)} tokens are JSON formatting (indentation, keys, punctuation)`)
  console.log('    \x1b[2mindented on purpose (committed, reviewed in diffs); props are one per line\x1b[0m')
  console.log('    heaviest entries:')
  for (const e of entries.slice(0, 6)) {
    console.log(`      ${String(e.total).padStart(5)}  ${e.ref.padEnd(22)} \x1b[2mexample ${e.example}, tokensUsed ${e.css}\x1b[0m`)
  }
  const perEntry = ON_DEMAND.find((o) => o.path === 'component-registry.json')?.perEntry
  const over = perEntry ? entries.filter((e) => e.total > perEntry) : []
  if (over.length) {
    failed++
    console.log(`\n    \x1b[31m✗ ${over.length} entr${over.length === 1 ? 'y is' : 'ies are'} over the ${perEntry}-token per-entry ceiling:\x1b[0m`)
    for (const e of over) console.log(`      ${String(e.total).padStart(5)}  ${e.ref}`)
    console.log(`    \x1b[2mThat is what an agent pays to look one of them up. Shorten the example or the prop descriptions.\x1b[0m`)
  }

  /* Two marginal costs now, and they are different by a factor of fifteen. The
   * index one is what a new component costs EVERY task; the registry one is what
   * it costs the tasks that actually use it. Splitting them is the whole point of
   * the index, so the report says both.
   *
   * And the RUNWAY, which is the number that turns a budget into a plan: at a
   * known price per row, how many more components fit before this trips? A
   * ceiling you meet on the day it goes red is a ceiling nobody planned for; one
   * that says "room for nine more" is a decision somebody can take a month
   * earlier, and the decision at the end of this runway is not a shorter sentence
   * (tried, and it elides half the rows mid-phrase) but asking the index instead
   * of reading it: `npm run registry -- --search`, or the MCP tool. */
  const indexPath = `${ROOT}/component-index.md`
  const indexBudget = REQUIRED.find((r) => r.path === 'component-index.md')?.budget
  if (existsSync(indexPath)) {
    const raw = readFileSync(indexPath, 'utf8')
    /* A row is a line with the ` · ` separator in it; everything above the first
     * one is the header, which is paid once however many components there are. */
    const rows = raw.split('\n').filter((l) => l.includes(' · '))
    const perRow = rows.reduce((n, l) => n + tokens(l) + 1, 0) / rows.length
    const idxAvg = Math.round(perRow)
    console.log(`\n    \x1b[2mMarginal cost of one more component: ${idxAvg} tokens on every task (its index row),\x1b[0m`)
    console.log(`    \x1b[2mplus about ${avg} tokens on the tasks that fetch it. Before the index it was ${avg} on every task.\x1b[0m`)
    /* And what that actually costs, from a run that was billed rather than from
     * this file's chars/4. Must-read context is not paid once per task: it is
     * paid once and re-read on every turn, so the real multiplier is the number
     * of turns a task takes — 61 on the first run this harness ever priced. A
     * budget argued without it undercounts itself by two orders of magnitude.
     *
     * Optional on purpose. A clone with no traces still gets its budget; it just
     * does not get the multiplier, and saying so is better than defaulting to a
     * number from somebody else's machine. */
    const turns = medianTurns()
    if (turns) {
      console.log(`    \x1b[2mMeasured: a task takes ${turns} turns and re-reads its must-read context on each,`)
      console.log(`    so 1k of must-read costs about ${fmt(turns * 1000)} tokens per task. This index costs ${fmt(turns * tokens(raw))}.\x1b[0m`)
    }
    if (indexBudget) {
      const room = Math.floor((indexBudget - tokens(raw)) / perRow)
      const colour = room <= 5 ? '\x1b[31m' : room <= 15 ? '\x1b[33m' : '\x1b[2m'
      console.log(`    ${colour}Runway: room for ${room} more component(s) before the index budget trips.\x1b[0m`)
      if (room <= 15) {
        console.log(`    \x1b[2mAt the end of it: raise the budget deliberately, or make search the primary path.\x1b[0m`)
      }
    }
  }
  console.log(`    \x1b[2mIf this gets tight, cut the per-entry payload (shorter examples, drop tokensUsed) before cutting components.\x1b[0m\n`)
}

if (failed) {
  console.error(`\x1b[31m✗ context over budget.\x1b[0m Either trim the payload, or raise the budget in scripts/context-budget.mjs with a reason.`)
  process.exit(1)
}
console.log('\x1b[32m✓ context within budget.\x1b[0m')
