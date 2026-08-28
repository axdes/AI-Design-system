/* The arithmetic every chart in this system shares.
 *
 * It lives here and not in a component because two charts that compute their
 * scale differently draw the same numbers at two heights, and a reader compares
 * them anyway. One scale, one set of ticks, one rounding rule. */

/** A "nice" step: 1, 2, 5 or 10 times a power of ten. What a person would have
 *  picked — 0/25/50/75/100, never 0/23/46/69/92. */
function niceStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(rough))
  const scaled = rough / power
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10
  return step * power
}

export type Scale = {
  /** Top of the axis: the first nice number at or above the data. */
  max: number
  /** The values to draw a grid line and a label at, bottom to top. */
  ticks: number[]
  /** Where a value sits on the axis, 0 (floor) to 1 (top). */
  at: (value: number) => number
}

/**
 * The axis for a set of values. `count` is a TARGET number of gaps, not a
 * promise: the step is rounded to a nice number first, because a readable
 * scale matters more than an exact tick count.
 *
 * The floor is always zero. A bar chart that starts anywhere else lies about
 * the ratio between its bars, and that is the single most common way a chart
 * misleads without saying anything false.
 */
export function scaleFor(values: number[], count = 4): Scale {
  const peak = Math.max(0, ...values)
  if (peak === 0) return { max: 1, ticks: [0, 1], at: () => 0 }
  const step = niceStep(peak / count)
  const max = Math.ceil(peak / step) * step
  const ticks: number[] = []
  for (let t = 0; t <= max + step / 2; t += step) ticks.push(Number(t.toFixed(10)))
  return { max, ticks, at: (v) => Math.max(0, Math.min(1, v / max)) }
}

/** Thousands separated, decimals kept only when the number has them. Charts
 *  print a lot of numbers and they all have to line up. */
export function formatValue(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}

/** The path through a series of points, as an SVG `d`. */
export function linePath(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
}

/** The same path closed down to a baseline, for the area under a line. */
export function areaPath(points: readonly (readonly [number, number])[], baseline: number): string {
  if (!points.length) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath(points)} L${last[0].toFixed(2)} ${baseline} L${first[0].toFixed(2)} ${baseline} Z`
}
