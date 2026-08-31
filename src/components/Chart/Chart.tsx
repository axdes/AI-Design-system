import '../../lib/chart.css'
import './Chart.css'
import { type CSSProperties, type PointerEvent, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { areaPath, formatValue, linePath, scaleFor } from '../../lib/chart'

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export type ChartSeries = {
  /** What this measure is. It names the colour in the legend, in the readout
   *  and in the table a screen reader is given. */
  label: string
  /** One value per entry of `labels`, in the same order. */
  values: number[]
  /** A status tone instead of the next series colour — for a measure that MEANS
   *  late, over budget, or done. Otherwise the slot colour, in fixed order. */
  tone?: Extract<Tone, 'success' | 'warning' | 'danger'>
}

type Props = {
  /** Which mark carries the data: `bar` for a value per category, `line` for a
   *  value over time. Everything else on this component is the same furniture. */
  type?: 'bar' | 'line'
  /** The categories, or the x axis oldest first: months, weeks, sites. */
  labels: string[]
  /** One entry per measure. Two or more bring a legend with them. */
  series: ChartSeries[]
  /** `bar`: segments of one column instead of columns side by side, for parts
   *  of a whole per period. Ignored with one series. */
  stacked?: boolean
  /** `bar`: bars run across instead of up. The answer for long category names
   *  and for a ranking, where the eye compares lengths down a column. */
  orientation?: 'vertical' | 'horizontal'
  /** `line`: fills under the line. For ONE series only — two filled areas
   *  overlapping is a chart nobody can read. */
  area?: boolean
  /** Top of the scale. Defaults to the first nice number above the data; pass
   *  it when several charts must share one scale. */
  max?: number
  /** A goal drawn across the plot, so a value can be short OF something. Its
   *  own label is deliberately not a prop: a word printed inside the plot sits
   *  on the data (owner, 23.08). Name the goal in the card's meta line. */
  target?: number
  /** `bar`: the one category that carries the accent — the current period, the
   *  site under discussion. Single-series only; the others stay quiet. */
  emphasis?: string
  /** What the whole measure MEANS, from the metric and not the numbers:
   *  findings closed rising is `success`, incidents rising is `danger`, and the
   *  same marks carry both. */
  tone?: Tone
  /** How much of the page the chart is worth: `md` when it is the block, `sm`
   *  when it is one card in a grid of them. */
  size?: Size
  /** The scale down the side, and the grid lines with it. On by default: a mark
   *  with no scale is a shape, and the reader cannot say how big it is. */
  axis?: boolean
  /** `bar`: values printed on every bar. Off by default — the readout under the
   *  pointer says it for the one being read, which is what a reader asks. */
  showValues?: boolean
  /** What the chart measures. Required in practice: it names the chart for a
   *  screen reader, which then reads the table this component renders for it. */
  label?: string
  /** BCP-47 tag for the numbers. Omit to follow the browser. */
  locale?: string
  className?: string
}

/* The line's drawing space. The viewBox is fixed and the SVG stretches to the
 * card; strokes are held even with vector-effect so a wide card does not draw a
 * fat line and a narrow one a thin one. */
const W = 100
const H = 40

/* Which way a bar's readout hangs off its column. Centred over the middle of
 * the plot, and pinned by one edge over the first and last columns, so it never
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

/**
 * A measure across categories or over time, with the scale that says by how
 * much: `type="bar"` for a value per category, `type="line"` for a value over
 * time. Carries its own scale, grid, goal line, legend and hover readout, and
 * reads as a TABLE to a screen reader.
 *
 * Reach for <Sparkline> when the shape sits beside a number and needs no axis,
 * <DonutChart> for a whole split into named shares, <Meter> for one value
 * against one target, and a <Table> when the numbers are compared exactly
 * rather than at a glance.
 *
 * Copy: labels are the categories' or periods' own names, short enough to sit
 * under a mark without turning. Series names are the things themselves, because
 * a legend of "Series 1" is a legend of nothing. The accessible label says what
 * is being counted and over what.
 */
export function Chart({
  type = 'bar',
  labels,
  series,
  stacked,
  orientation = 'vertical',
  area,
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
  const plotRef = useRef<HTMLDivElement>(null)

  if (!labels.length || !series.length) return null

  const format = (v: number) => formatValue(v, locale)
  const valuesAt = (i: number) => series.map((s) => s.values[i] ?? 0)

  /* Stacked columns are read as their total, so that is what the scale has to
   * hold; everything else is read mark by mark. */
  const peaks = labels.map((_, i) => {
    const row = valuesAt(i)
    return stacked && type === 'bar' ? row.reduce((sum, v) => sum + v, 0) : Math.max(...row)
  })
  const scale = scaleFor([...peaks, ...(max != null ? [max] : []), ...(target != null ? [target] : [])])
  const top = max ?? scale.max
  const ticks = max != null ? scaleFor([max]).ticks : scale.ticks
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / top) * 100))}%`

  const single = series.length === 1
  /* Derived into named consts rather than written inline in the JSX, because
   * the registry reads `data-x={binding}` and follows the binding to the prop
   * it comes from: a ternary inline resolves to whatever identifier happens to
   * come first, and the generator then holds the CSS to the wrong prop's union
   * (it held [data-orientation] against `type` and refused to build).
   *
   * And the attributes are NOT gated on `type`. A data attribute says what the
   * caller asked for; which mark acts on it is the CSS's business, and every
   * selector that reads them is already qualified by [data-type]. Gating them
   * here made `orientation` unreachable on a line and `area` unreachable on a
   * bar, which is how the registry contract test reads a variant that cannot be
   * rendered — a prop the registry publishes and the component ignores. */
  const areaFilled = area && single
  const keyShape = type === 'line' ? 'dot' : undefined

  const step = labels.length > 1 ? W / (labels.length - 1) : 0
  const pointsOf = (values: number[]) =>
    values.map(
      (v, i) => [labels.length > 1 ? i * step : W / 2, H - (Math.max(0, Math.min(top, v)) / top) * H] as const,
    )
  const atX = `${(Number(at) / Math.max(1, labels.length - 1)) * 100}%`

  /* Which point the pointer is nearest, for a line. One crosshair for every
   * series at once, because the reader is comparing them at that x — not
   * hunting one dot. */
  const track = (e: PointerEvent<HTMLDivElement>) => {
    const box = plotRef.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const ratio = (e.clientX - box.left) / box.width
    const flipped = getComputedStyle(plotRef.current as Element).direction === 'rtl' ? 1 - ratio : ratio
    setAt(Math.max(0, Math.min(labels.length - 1, Math.round(flipped * (labels.length - 1)))))
  }

  /* The scale column and the grid behind the marks: identical on both types,
   * which is half of why this is one component. */
  const gridLines = axis
    ? ticks.map((t) => (
        <span key={t} className="chart-grid" style={{ '--tick-at': pct(t) } as CSSProperties} aria-hidden="true" />
      ))
    : null

  return (
    <figure
      className={cn('chart', className)}
      data-type={type}
      data-tone={tone}
      data-size={size}
      data-orientation={orientation}
      data-stacked={stacked && type === 'bar' ? '' : undefined}
      data-axis={axis ? '' : undefined}
      data-area={areaFilled ? '' : undefined}
      onMouseLeave={type === 'bar' ? () => setAt(null) : undefined}
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

        {type === 'bar' ? (
          <div className="chart-bar-plot">
            {gridLines}
            {target != null && (
              <span className="chart-target" style={{ '--tick-at': pct(target) } as CSSProperties} aria-hidden="true" />
            )}

            {labels.map((name, i) => (
              /* A button, not a div with a mouse handler: the readout is
                 reachable by keyboard and announced, and the whole column is
                 the hit area. */
              <button
                type="button"
                key={name}
                className="chart-bar-column"
                data-active={at === i ? '' : undefined}
                aria-label={readout(name, valuesAt(i).map((v, k) => [single ? '' : series[k].label, format(v)]))}
                onMouseEnter={() => setAt(i)}
                onFocus={() => setAt(i)}
                onBlur={() => setAt(null)}
              >
                {/* Lying down, the name sits OVER its own bar rather than in a
                    column beside it: a names column costs the bars a sixth of
                    the card's width, and the bar is the thing being compared
                    (owner, 23.08: why is it not the full width). */}
                {orientation === 'horizontal' && (
                  <span className="chart-bar-head">
                    <span className="chart-bar-name">{name}</span>
                    {showValues && <span className="chart-bar-head-value">{format(valuesAt(i)[0])}</span>}
                  </span>
                )}
                <span className="chart-bar-bars">
                  {valuesAt(i).map((v, k) => (
                    <span
                      key={series[k].label || k}
                      className="chart-bar-bar"
                      data-series={k + 1}
                      data-tone={series[k].tone}
                      data-emphasis={emphasis === name ? '' : undefined}
                      style={{ '--bar-size': pct(v), '--bar-delay': `${i * 40}ms` } as CSSProperties}
                    >
                      {showValues && orientation === 'vertical' && <span className="chart-bar-value">{format(v)}</span>}
                    </span>
                  ))}
                </span>
              </button>
            ))}

            {at != null && (
              <div
                className="chart-readout"
                data-side={side(at, labels.length)}
                style={{ '--readout-at': `${((at + 0.5) / labels.length) * 100}%` } as CSSProperties}
                aria-hidden="true"
              >
                <span className="chart-readout-label">{labels[at]}</span>
                {valuesAt(at).map((v, k) => (
                  <span key={series[k].label || k} className="chart-readout-row">
                    {!single && <span className="chart-key" data-series={k + 1} data-tone={series[k].tone} />}
                    {!single && <span>{series[k].label}</span>}
                    <span className="chart-readout-value">{format(v)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="chart-line-plot" ref={plotRef} onPointerMove={track} onPointerLeave={() => setAt(null)}>
            {gridLines}
            {target != null && (
              <span className="chart-target" style={{ '--tick-at': pct(target) } as CSSProperties} aria-hidden="true" />
            )}

            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {series.map((s, k) => {
                const pts = pointsOf(s.values)
                return (
                  <g key={s.label} className="chart-line-series" data-series={k + 1} data-tone={s.tone}>
                    {areaFilled && <path className="chart-line-area" d={areaPath(pts, H)} />}
                    <path className="chart-line-line" d={linePath(pts)} vectorEffect="non-scaling-stroke" />
                  </g>
                )
              })}
            </svg>

            {/* The dots ride on top as real elements, so stretching the plot
                cannot turn a circle into an ellipse. */}
            {at != null &&
              series.map((s, k) => (
                <span
                  key={s.label}
                  className="chart-line-dot"
                  data-series={k + 1}
                  data-tone={s.tone}
                  style={
                    {
                      '--dot-x': atX,
                      '--dot-y': `${(1 - Math.max(0, Math.min(top, s.values[at] ?? 0)) / top) * 100}%`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
              ))}

            {at != null && (
              <span
                className="chart-line-crosshair"
                style={{ '--dot-x': atX } as CSSProperties}
                aria-hidden="true"
              />
            )}

            {at != null && (
              <div
                className="chart-readout"
                data-side={at > labels.length / 2 ? 'start' : 'end'}
                style={{ '--dot-x': atX } as CSSProperties}
                aria-hidden="true"
              >
                <span className="chart-readout-label">{labels[at]}</span>
                {series.map((s, k) => (
                  <span key={s.label} className="chart-readout-row">
                    <span className="chart-key" data-shape="dot" data-series={k + 1} data-tone={s.tone} />
                    {!single && <span>{s.label}</span>}
                    <span className="chart-readout-value">{format(s.values[at] ?? 0)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lying down, every bar carries its own name, so the row below would say
          each of them twice. */}
      {!(type === 'bar' && orientation === 'horizontal') && (
        <div className="chart-labels" aria-hidden="true">
          {labels.map((name, i) => (
            <span key={name} data-active={at === i ? '' : undefined}>
              {name}
            </span>
          ))}
        </div>
      )}

      {!single && (
        <ul className="chart-legend" aria-hidden="true">
          {series.map((s, k) => (
            <li key={s.label}>
              <span className="chart-key" data-shape={keyShape} data-series={k + 1} data-tone={s.tone} />
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
            <th scope="col">{type === 'line' ? 'Point' : 'Category'}</th>
            {series.map((s, k) => (
              <th scope="col" key={s.label || k}>
                {s.label || label || 'Value'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((name, i) => (
            <tr key={name}>
              <th scope="row">{name}</th>
              {valuesAt(i).map((v, k) => (
                <td key={series[k].label || k}>{format(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
