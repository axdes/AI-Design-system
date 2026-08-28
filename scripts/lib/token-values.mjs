/* The token layer as comparable NUMBERS and COLOURS.
 *
 * The registry publishes every token with the value it is DECLARED with, which
 * is what a reviewer wants to read: `--space-6` says `calc(var(--grid-unit) * 6)`
 * because that is the fact about it. It is not what a check wants, though. A
 * check asking "is 20px a step on this scale, and if not which steps sit either
 * side of it" has to resolve that expression the way a browser would, and
 * nothing here did — so no check could answer a question about a NUMBER a
 * document names.
 *
 * Resolution is deliberately partial. `var()` chains, `calc()` arithmetic, px
 * and rem all resolve; `clamp()`, `min()`, `max()` and anything in viewport
 * units do not, and come back as null rather than as a guess. A token whose
 * whole point is that it responds to the viewport has no single px value, and
 * inventing one would put a wrong number into a report that exists to be
 * trusted.
 */

/** The root font size px and rem are converted against. Not read from the token
 *  layer because it is a BROWSER default the layer never restates. */
const ROOT_FONT_PX = 16

/** How close two colours have to be before this calls them the same intent.
 *
 * Measured with the redmean approximation below, whose range is 0 to about 765.
 * 25 is roughly "a person looking at both would call it the same colour, off by
 * a shade" — close enough that a document naming it almost certainly means the
 * token, far enough that a genuinely different brand colour is not swallowed.
 * It is a judgment, so it is a named constant and callers may override it. */
export const SAME_COLOUR = 25

/* ── expression evaluation ─────────────────────────────────────────────── */

/** A length literal in px, or null when it is not one this understands. */
function literalPx(text) {
  const m = /^\s*(-?[\d.]+)\s*(px|rem|em)?\s*$/.exec(text)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n)) return null
  if (!m[2] || m[2] === 'px') return n
  return n * ROOT_FONT_PX
}

/** Arithmetic over already-resolved numbers: + - * / , parentheses, and the two
 *  CSS functions that are pure functions of their arguments.
 *
 * Hand-written rather than handed to `Function`, because the input is a token
 * value out of a generated file and a check that evaluates strings is a check
 * that can be made to run code. Forty lines is a cheap price for that.
 *
 * `min()` and `max()` resolve because they are arithmetic — `--radius-sm` is
 * `max(0px, ...)` and dropping it would lose a real step off the scale.
 * `clamp()` does not, and neither does anything in viewport units: those have no
 * one value, and a report that invents one is worse than a report that says it
 * does not know. */
function arithmetic(text) {
  let i = 0
  /* `calc()` is a parenthesised expression and nothing more, so it is spelled as
   * one before parsing rather than given a case of its own. */
  const src = String(text).replace(/\bcalc\(/g, '(')
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++ }
  const fail = Symbol('fail')

  function primary() {
    ws()
    const fn = /^(min|max)\(/i.exec(src.slice(i))
    if (fn) {
      i += fn[0].length
      const args = []
      for (;;) {
        const v = expr()
        if (v === fail) return fail
        args.push(v)
        ws()
        if (src[i] === ',') { i++; continue }
        if (src[i] === ')') { i++; break }
        return fail
      }
      return fn[1].toLowerCase() === 'min' ? Math.min(...args) : Math.max(...args)
    }
    if (src[i] === '(') {
      i++
      const v = expr()
      ws()
      if (src[i] !== ')') return fail
      i++
      return v
    }
    const m = /^-?[\d.]+(px|rem|em)?/.exec(src.slice(i))
    if (!m) return fail
    i += m[0].length
    return literalPx(m[0])
  }

  function term() {
    let v = primary()
    if (v === fail) return fail
    for (;;) {
      ws()
      const op = src[i]
      if (op !== '*' && op !== '/') return v
      i++
      const rhs = primary()
      if (rhs === fail) return fail
      /* A bare multiplier (`* 6`) arrives through literalPx as a plain number,
       * which is exactly right: the units belong to the other operand. */
      v = op === '*' ? v * rhs : rhs === 0 ? fail : v / rhs
      if (v === fail) return fail
    }
  }

  function expr() {
    let v = term()
    if (v === fail) return fail
    for (;;) {
      ws()
      const op = src[i]
      if (op !== '+' && op !== '-') return v
      i++
      const rhs = term()
      if (rhs === fail) return fail
      v = op === '+' ? v + rhs : v - rhs
    }
  }

  const value = expr()
  ws()
  return value === fail || i < src.length ? null : value
}

/* ── colours ───────────────────────────────────────────────────────────── */

/** `#abc`, `#aabbcc` or `rgb(r g b)` / `rgb(r, g, b)` as {r,g,b}, else null. */
export function parseColour(text) {
  const s = String(text ?? '').trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(s)
  if (!rgb) return null
  const [r, g, b] = rgb.slice(1, 4).map(Number)
  return r > 255 || g > 255 || b > 255 ? null : { r, g, b }
}

export const toHex = ({ r, g, b }) => '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')

/** Distance between two colours, redmean — the cheap approximation that tracks
 *  perception far better than plain RGB distance and needs no colour library.
 *  Range 0 to about 765. */
export function colourDistance(a, b) {
  const rm = (a.r + b.r) / 2
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
}

/* ── the layer ─────────────────────────────────────────────────────────── */

/**
 * Every token resolved as far as it goes.
 *
 * @param {{name:string,value:string,group:string,layer:string,role?:string}[]} tokens
 *        the registry's own `tokens` array
 * @returns {{ lengths: {name:string,px:number,group:string,layer:string}[],
 *             colours: {name:string,rgb:{r:number,g:number,b:number},hex:string,layer:string,role?:string}[],
 *             fonts: {name:string,families:string[]}[],
 *             resolve: (name:string) => string|null }}
 */
export function tokenValues(tokens) {
  const by = new Map(tokens.map((t) => [t.name, t]))

  /** A value with every `var()` substituted, or null on a cycle or a gap. */
  const resolve = (name, seen = new Set()) => {
    if (seen.has(name)) return null
    seen.add(name)
    const token = by.get(name)
    if (!token) return null
    return substitute(token.value, seen)
  }

  const substitute = (value, seen) => {
    let out = String(value ?? '')
    for (let pass = 0; pass < 10 && out.includes('var('); pass++) {
      let changed = false
      out = out.replace(/var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)/gi, (whole, ref) => {
        const inner = resolve(ref, new Set(seen))
        if (inner === null) return whole
        changed = true
        return `(${inner})`
      })
      if (!changed) break
    }
    return out.includes('var(') ? null : out
  }

  const lengths = []
  const colours = []
  const fonts = []

  for (const token of tokens) {
    const value = resolve(token.name)
    if (value === null) continue

    if (token.group === 'color') {
      const rgb = parseColour(value.replace(/^\(|\)$/g, ''))
      if (rgb) colours.push({ name: token.name, rgb, hex: toHex(rgb), layer: token.layer, role: token.role })
      continue
    }

    if (token.name.startsWith('--font-family')) {
      fonts.push({ name: token.name, families: value.split(',').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) })
      continue
    }

    /* Only the groups that MEASURE something. A z-index or a stroke width is a
     * number too, and offering `--z-modal` as the nearest step to a 100px gap
     * would be worse than saying nothing. */
    if (!['spacing', 'radius', 'size', 'type', 'grid'].includes(token.group)) continue
    const px = arithmetic(value)
    if (px !== null && px > 0) lengths.push({ name: token.name, px, group: token.group, layer: token.layer })
  }

  return { lengths, colours, fonts, resolve }
}

/**
 * Where a length sits on the scale.
 *
 * @returns {{ exact: object|null, below: object|null, above: object|null }}
 *          `exact` is a token with this very value; otherwise the nearest step
 *          either side, so a report can say what to use INSTEAD rather than only
 *          that the number is wrong.
 */
export function nearestLength(px, lengths, { group = null } = {}) {
  /* One token per VALUE. The layer is full of semantic aliases that resolve to a
   * step a primitive already names (`--popover-item-radius` is `--radius-md`),
   * and offering both as the answer to "what should 10px be" describes the
   * system's plumbing instead of answering the question. The primitive wins,
   * then the shorter name — which is the one a person would have written. */
  const best = new Map()
  for (const l of group ? lengths.filter((x) => x.group === group) : lengths) {
    const key = `${l.group}:${l.px}`
    const held = best.get(key)
    const better = !held
      || (held.layer !== 'primitive' && l.layer === 'primitive')
      || (held.layer === l.layer && l.name.length < held.name.length)
    if (better) best.set(key, l)
  }
  const pool = [...best.values()].sort((a, b) => a.px - b.px)
  const exact = pool.find((l) => Math.abs(l.px - px) < 0.01) ?? null
  if (exact) return { exact, below: null, above: null }
  let below = null, above = null
  for (const l of pool) {
    if (l.px < px) below = below && below.px >= l.px ? below : l
    else if (above === null) above = l
  }
  return { exact: null, below, above }
}

/**
 * The token closest to a colour the document names.
 *
 * @returns {{ exact: object|null, nearest: object|null, distance: number,
 *             same: boolean }} `same` is the judgment: close enough that the
 *             document almost certainly meant this token.
 */
export function nearestColour(rgb, colours, { threshold = SAME_COLOUR } = {}) {
  let nearest = null, distance = Infinity
  for (const c of colours) {
    const d = colourDistance(rgb, c.rgb)
    /* A primitive wins a tie with a semantic alias pointing at it: the primitive
     * IS the value, and naming the alias would answer a question about a colour
     * with a question about a role. */
    if (d < distance || (d === distance && nearest?.layer !== 'primitive' && c.layer === 'primitive')) {
      nearest = c
      distance = d
    }
  }
  return { exact: distance === 0 ? nearest : null, nearest, distance, same: distance <= threshold }
}
