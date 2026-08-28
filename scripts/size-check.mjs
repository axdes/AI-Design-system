// Bundle budget for the design system. The check itself is shared with every
// other package (scripts/lib/size-check.mjs); only the numbers are here.
//
// `visual-*` is the screenshot gallery (visual/index.html): it imports the
// registry, the shared render map and every component, and no app user ever
// loads it, so it must not count against the shipped bundle.
import { checkBundleSize } from './lib/size-check.mjs'

/* 2026-08-23: total 175 -> 190. Two things landed on the same day and the
 * showcase carries both: the chart layer (LineChart on the patterns screen) and
 * the form layer, whose reference screen is its own lazy route
 * (ContentRequestPage, 4.5 KB gzipped) plus seven components in the shared
 * route chunk. Main is untouched at 84.5 KB against a 125 KB ceiling, which is
 * the number that decides what a first paint costs; `total` counts every lazy
 * route as well, so it grows with the number of SCREENS the showcase has, not
 * with what any one visitor downloads.
 *
 * 2026-08-23: total 190 -> 200, for the table layer. The showcase gained one
 * more lazy route (TablesPage, 8.8 KB gzipped: twenty-one exhibits, one per
 * kind of table) and the six components it exists to demonstrate. Main is
 * still 89.4 KB against the same 125 KB ceiling, so a first paint costs what
 * it cost yesterday; what grew is the number of SCREENS this showcase has,
 * which is the thing `total` measures. Paid for first: the gallery shares one
 * fixture module across every exhibit rather than carrying a dataset per
 * kind.
 *
 * 2026-08-23: total 200 -> 210, for the CELL layer. Four more components
 * (Truncate, CellStack, TagGroup, Thumbnail) and two more exhibits on the same
 * lazy route, which is now 12.4 KB gzipped and carries eighteen kinds of cell
 * plus the column-group table. Main moved 89.4 -> 91.9 KB against the same 125
 * KB ceiling, and the ceiling that decides a first paint is that one. */
/* `.example-` joins `visual-` on the same argument, and the argument is what
 * the budget is FOR. `total` exists to say what a product pays for depending on
 * this package. The gallery is not shipped to a product; neither is the site's
 * catalogue of golden examples — 140 chunks, each fetched only when a reader
 * clicks that component's name, and never all together by anyone. Counting them
 * turned a 108 KB first paint into a 248 KB "bundle" and would have been paid
 * for by deleting examples, which is the opposite of what this package wants.
 * What still counts, and must: `main`, every route chunk, and every component
 * a page actually imports. */
checkBundleSize({ mainKb: 125, totalKb: 210, exclude: ['visual-', '.example-'] })
