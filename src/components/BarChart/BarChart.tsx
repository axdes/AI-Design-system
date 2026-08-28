import '../../lib/chart.css'
import './BarChart.css'
import { type CSSProperties, useState } from 'react'
import { cn } from '../../lib/cn'
import { formatValue, scaleFor } from '../../lib/chart'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
type Size = 'sm' | 'md' | 'lg'
type Orientation = 'vertical' | 'horizontal'

export type Bar = {
  /** What this column is: a period, a category, a site. */
  label: string
  /** The one measure, when the chart carries one. */
  value?: number
  /** One number per entry of `series`, when it carries several. */
  values?: number[]
}

export type BarSeries = {
  /** What this measure is. It names the colour in the legend and in the readout. */
  label: string
  /** A status tone instead of the next series colour — for shares that MEAN
   *  open / late / done. Mixing the two makes one series look like a warning. */
  tone?: Extract<Tone, 'success' | 'warning' | 'danger'>
}

type Props = {
  /** The columns, in the order they are read. */
  data: Bar[]
  /** Names the measures in `values`. Two or more turn the chart into a grouped
   *  (or `stacked`) one and bring a legend with them. */
  series?: BarSeries[]
  /** Segments of one column instead of columns side by side: for parts of a
   *  whole per period. Only with `series`. */
  stacked?: boolean
  /** Bars run across instead of up. The answer for long category names and for
   *  a ranking, where the eye compares lengths down a column of labels. */
  orientation?: Orientation
  /** Top of the scale. Defaults to the first nice number above the data; pass
   *  it when several charts must share one scale. */
  max?: number
  /** A goal drawn across the columns, so a bar can be short OF something. Its
   *  own label is deliberately not a prop: a word printed inside the plot sits
   *  on the data (owner, 23.08). Name the goal in the card's meta line. */
  target?: number
  /** The one column that carries the accent — the current period, the site
   *  under discussion. Single-series charts only; the others stay quiet. */
  emphasis?: string
  tone?: Tone
  size?: Size
  /** The scale down the side, and the grid lines with it. On by default: a bar
   *  with no scale is a shape, and the reader cannot say how big it is. */
  axis?: boolean
  /** Values printed on every bar. Off by default — the readout under the
   *  pointer says it for the one bar being read, which is what a reader asks. */
  showValues?: boolean
  /** What the chart measures. Required in practice: it names the chart for a
   *  screen reader, which then reads the table this component renders for it. */
  label?: string
  /** BCP-47 tag for the numbers. Omit to follow the browser. */
  locale?: string
  className?: string
}

/* Which way the readout hangs off its column. Centred over the middle of the
 * plot, and pinned by one edge over the first and last columns, so it never
 * leaves the card it is being read in. */
function side(at: number, count: number): 'start' | 'center' | 'end' {
  if (count < 3) return 'center'
  if (at === 0) return 'start'
  if (at === count - 1) return 'end'
  return 'center'
}

/* "Aug: Closed 52, Open 8" — the column's whole readout as one string, built
 * outside the JSX because a template inside a template inside a map is not
 * something anyone reads twice. */
function readout(category: string, parts: [string, string][]): string {
  const said = parts.map(([name, value]) => (name ? `${name} ${value}` : value)).join(', ')
  return `${category}: ${said}`
}

/** A value per category, as bars: the analytical card's second form after
 *  <Sparkline> (a value over time). Carries its own scale, grid, legend and
 *  hover readout, and reads as a table to a screen reader. Reach for <Meter>
 *  when there is one value against one target, and for a <Table> when the
 *  numbers are compared exactly rather than at a glance. 
 *
 * Copy: category labels are the categories' own names, short enough to sit under
 * a bar without turning. The accessible label says what is being counted
 * and over what.
 */
export function BarChart({
  data,
  series,
  stacked,
  orientation = 'vertical',
  max,
  target,
  emphasis,
  tone = 'primary',
  size,
  axis = true,
  showValues,
  label,
  locale,
  className,
}: Props) {
  const [at, setAt] = useState<number | null>(null)

  if (!data.length) return null

  /* One measure or several, the rest of the component works on the same shape.
   * The unnamed single series stays unnamed: a readout that says "Findings
   * closed per month 52" repeats the card's own title at the reader. */
  const measures: { label: string; tone?: BarSeries['tone'] }[] = series ?? [{ label: '' }]
  const rows = data.map((d) => ({
    label: d.label,
    values: d.values ?? [d.value ?? 0],
  }))

  /* Stacked columns are read as their total, so that is what the scale has to
   * hold; grouped ones are read bar by bar. */
  const peaks = rows.map((r) => (stacked ? r.values.reduce((sum, v) => sum + v, 0) : Math.max(...r.values)))
  const scale = scaleFor([...peaks, ...(max != null ? [max] : []), ...(target != null ? [target] : [])])
  const top = max ?? scale.max
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / top) * 100))}%`

  const format = (v: number) => formatValue(v, locale)
  const ticks = max != null ? scaleFor([max]).ticks : scale.ticks

  return (
    <figure
      className={cn('bar-chart', className)}
      data-tone={tone}
      data-size={size}
      data-orientation={orientation}
      data-stacked={stacked ? '' : undefined}
      data-axis={axis ? '' : undefined}
      onMouseLeave={() => setAt(null)}
    >
      <div className="chart-frame">
        {axis && (
          <div className="chart-scale" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="chart-tick" style={{ '--tick-at': pct(t) } as CSSProperties}>
                {format(t)}
              </span>
            ))}
          </div>
        )}

        <div className="bar-chart-plot">
          {axis &&
            ticks.map((t) => (
              <span key={t} className="chart-grid" style={{ '--tick-at': pct(t) } as CSSProperties} aria-hidden="true" />
            ))}

          {target != null && (
            <span className="chart-target" style={{ '--tick-at': pct(target) } as CSSProperties} aria-hidden="true" />
          )}

          {rows.map((row, i) => (
            /* A button, not a div with a mouse handler: the readout is reachable
               by keyboard and announced, and the whole column is the hit area. */
            <button
              type="button"
              key={row.label}
              className="bar-chart-column"
              data-active={at === i ? '' : undefined}
              aria-label={readout(row.label, row.values.map((v, k) => [measures[k]?.label ?? '', format(v)]))}
              onMouseEnter={() => setAt(i)}
              onFocus={() => setAt(i)}
              onBlur={() => setAt(null)}
            >
              {/* Lying down, the name sits OVER its own bar rather than in a
                  column beside it: a names column costs the bars a sixth of the
                  card's width, and the bar is the thing being compared (owner,
                  23.08: why is it not the full width). */}
              {orientation === 'horizontal' && (
                <span className="bar-chart-head">
                  <span className="bar-chart-name">{row.label}</span>
                  {showValues && <span className="bar-chart-head-value">{format(row.values[0])}</span>}
                </span>
              )}
              <span className="bar-chart-bars">
                {row.values.map((v, k) => (
                  <span
                    key={measures[k]?.label ?? k}
                    className="bar-chart-bar"
                    data-series={k + 1}
                    data-tone={measures[k]?.tone}
                    data-emphasis={emphasis === row.label ? '' : undefined}
                    style={{ '--bar-size': pct(v), '--bar-delay': `${i * 40}ms` } as CSSProperties}
                  >
                    {showValues && orientation === 'vertical' && <span className="bar-chart-value">{format(v)}</span>}
                  </span>
                ))}
              </span>
            </button>
          ))}

          {at != null && (
            <div
              className="chart-readout"
              data-side={side(at, rows.length)}
              style={{ '--readout-at': `${((at + 0.5) / rows.length) * 100}%` } as CSSProperties}
              aria-hidden="true"
            >
              <span className="chart-readout-label">{rows[at].label}</span>
              {rows[at].values.map((v, k) => (
                <span key={measures[k]?.label ?? k} className="chart-readout-row">
                  {series && <span className="chart-key" data-series={k + 1} data-tone={measures[k]?.tone} />}
                  {series && <span>{measures[k]?.label}</span>}
                  <span className="chart-readout-value">{format(v)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {orientation === 'vertical' && (
        <div className="chart-labels" aria-hidden="true">
          {rows.map((row, i) => (
            <span key={row.label} data-active={at === i ? '' : undefined}>
              {row.label}
            </span>
          ))}
        </div>
      )}

      {series && series.length > 1 && (
        <ul className="chart-legend" aria-hidden="true">
          {series.map((s, k) => (
            <li key={s.label}>
              <span className="chart-key" data-series={k + 1} data-tone={s.tone} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      {/* The data itself, for a screen reader and for anyone who cannot use
          colour: a chart is a rendering of a table, so the table is what is
          announced rather than a sentence somebody wrote about the shape. */}
      <table className="sr-only">
        {label && <caption>{label}</caption>}
        <thead>
          <tr>
            <th scope="col">Category</th>
            {measures.map((m, k) => (
              <th scope="col" key={m.label || k}>
                {m.label || label || 'Value'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((v, k) => (
                <td key={measures[k]?.label ?? k}>{format(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
