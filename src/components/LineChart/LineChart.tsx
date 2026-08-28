import '../../lib/chart.css'
import './LineChart.css'
import { type CSSProperties, type PointerEvent, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { areaPath, formatValue, linePath, scaleFor } from '../../lib/chart'

type Size = 'sm' | 'md' | 'lg'

export type LineSeries = {
  /** What this line is. Names it in the legend and in the crosshair readout. */
  label: string
  /** One value per point of `labels`, in the same order. */
  values: number[]
  /** A status tone instead of the next series colour — for a line that MEANS
   *  late or over budget. Otherwise the slot colour, in fixed order. */
  tone?: 'success' | 'warning' | 'danger'
}

type Props = {
  /** The x axis, oldest first: months, weeks, sites. */
  labels: string[]
  /** One entry per line. Two or more bring a legend with them. */
  series: LineSeries[]
  /** Fills under the line. For ONE series only: two filled areas overlapping
   *  is a chart nobody can read. */
  area?: boolean
  /** Top of the scale. Defaults to the first nice number above the data. */
  max?: number
  /** A goal drawn across the plot. Its own label is deliberately not a prop: a
   *  word printed inside the plot sits on the lines (owner, 23.08). Name the
   *  goal in the card's meta line. */
  target?: number
  size?: Size
  /** The scale down the side and the grid with it. On by default. */
  axis?: boolean
  /** What the chart measures. Names it for a screen reader, which reads the
   *  table this component renders for it. */
  label?: string
  /** BCP-47 tag for the numbers. Omit to follow the browser. */
  locale?: string
  className?: string
}

/* The drawing space. The viewBox is fixed and the SVG stretches to the card;
 * strokes are held even with vector-effect so a wide card does not draw a fat
 * line and a narrow one a thin one. */
const W = 100
const H = 40

/** A value over time, as a line: the analytical card's first form when the
 *  question is "which way is it going". Carries its own scale, grid, legend and
 *  a crosshair readout, and reads as a table to a screen reader. Reach for
 *  <Sparkline> when the shape sits beside a number and needs no axis, and for
 *  <BarChart> when the x axis is categories rather than time. 
 *
 * Copy: the accessible label says what the line measures and over what period.
 * Series names are the things themselves, because a legend of "Series 1"
 * is a legend of nothing.
 */
export function LineChart({
  labels,
  series,
  area,
  max,
  target,
  size,
  axis = true,
  label,
  locale,
  className,
}: Props) {
  const [at, setAt] = useState<number | null>(null)
  const plotRef = useRef<HTMLDivElement>(null)

  if (!labels.length || !series.length) return null

  const all = series.flatMap((s) => s.values)
  const scale = scaleFor([...all, ...(max != null ? [max] : []), ...(target != null ? [target] : [])])
  const top = max ?? scale.max
  const ticks = max != null ? scaleFor([max]).ticks : scale.ticks
  const format = (v: number) => formatValue(v, locale)

  const step = labels.length > 1 ? W / (labels.length - 1) : 0
  const pointsOf = (values: number[]) =>
    values.map((v, i) => [labels.length > 1 ? i * step : W / 2, H - (Math.max(0, Math.min(top, v)) / top) * H] as const)
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / top) * 100))}%`

  /* Which point the pointer is nearest. One crosshair for every line at once,
   * because the reader is comparing them at that x — not hunting one dot. */
  const track = (e: PointerEvent<HTMLDivElement>) => {
    const box = plotRef.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const ratio = (e.clientX - box.left) / box.width
    const flipped = getComputedStyle(plotRef.current as Element).direction === 'rtl' ? 1 - ratio : ratio
    setAt(Math.max(0, Math.min(labels.length - 1, Math.round(flipped * (labels.length - 1)))))
  }

  return (
    <figure
      className={cn('line-chart', className)}
      data-size={size}
      data-axis={axis ? '' : undefined}
      data-area={area && series.length === 1 ? '' : undefined}
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

        <div
          className="line-chart-plot"
          ref={plotRef}
          onPointerMove={track}
          onPointerLeave={() => setAt(null)}
        >
          {axis &&
            ticks.map((t) => (
              <span key={t} className="chart-grid" style={{ '--tick-at': pct(t) } as CSSProperties} aria-hidden="true" />
            ))}

          {target != null && (
            <span className="chart-target" style={{ '--tick-at': pct(target) } as CSSProperties} aria-hidden="true" />
          )}

          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            {series.map((s, k) => {
              const pts = pointsOf(s.values)
              return (
                <g key={s.label} className="line-chart-series" data-series={k + 1} data-tone={s.tone}>
                  {area && series.length === 1 && <path className="line-chart-area" d={areaPath(pts, H)} />}
                  <path className="line-chart-line" d={linePath(pts)} vectorEffect="non-scaling-stroke" />
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
                className="line-chart-dot"
                data-series={k + 1}
                data-tone={s.tone}
                style={
                  {
                    '--dot-x': `${(at / Math.max(1, labels.length - 1)) * 100}%`,
                    '--dot-y': `${(1 - Math.max(0, Math.min(top, s.values[at] ?? 0)) / top) * 100}%`,
                  } as CSSProperties
                }
                aria-hidden="true"
              />
            ))}

          {at != null && (
            <span
              className="line-chart-crosshair"
              style={{ '--dot-x': `${(at / Math.max(1, labels.length - 1)) * 100}%` } as CSSProperties}
              aria-hidden="true"
            />
          )}

          {at != null && (
            <div
              className="chart-readout"
              data-side={at > labels.length / 2 ? 'start' : 'end'}
              style={{ '--dot-x': `${(at / Math.max(1, labels.length - 1)) * 100}%` } as CSSProperties}
              aria-hidden="true"
            >
              <span className="chart-readout-label">{labels[at]}</span>
              {series.map((s, k) => (
                <span key={s.label} className="chart-readout-row">
                  <span className="chart-key" data-shape="dot" data-series={k + 1} data-tone={s.tone} />
                  {series.length > 1 && <span>{s.label}</span>}
                  <span className="chart-readout-value">{format(s.values[at] ?? 0)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chart-labels" aria-hidden="true">
        {labels.map((l, i) => (
          <span key={l} data-active={at === i ? '' : undefined}>
            {l}
          </span>
        ))}
      </div>

      {series.length > 1 && (
        <ul className="chart-legend" aria-hidden="true">
          {series.map((s, k) => (
            <li key={s.label}>
              <span className="chart-key" data-shape="dot" data-series={k + 1} data-tone={s.tone} />
              {s.label}
            </li>
          ))}
        </ul>
      )}

      <table className="sr-only">
        {label && <caption>{label}</caption>}
        <thead>
          <tr>
            <th scope="col">Point</th>
            {series.map((s) => (
              <th scope="col" key={s.label}>
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l}>
              <th scope="row">{l}</th>
              {series.map((s) => (
                <td key={s.label}>{format(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
