// What a screenshot cannot tell you: WHY the pixels moved.
//
// The component gate compares PNGs, and a PNG conflates two different events. A
// card that lost its padding and a machine that hints text half a pixel narrower
// both come out as "3.4% of pixels changed". visual/README.md has had to say
// "that is look at this, not you broke it" ever since, which is an honest label
// for a check that cannot tell the difference and a bad one for a gate.
//
// So this measures the same rendered frame a second way, from the DOM instead of
// the framebuffer: where every box is and what it resolved to. Geometry and
// resolved styles do not depend on the rasteriser. The fonts are self-hosted
// woff2 and Chromium shapes them with HarfBuzz on every platform, so advance
// widths are the same number on macOS and on Linux even though the pixels that
// paint them are not.
//
// That splits one signal into two:
//
//   structure differs  →  a real change, on any machine, always a failure
//   pixels differ only →  the rasteriser, if the run is on another machine
//
// It does NOT replace the pixels. Antialiasing, gradients, icon paths and the
// inside of an SVG live only in the framebuffer, and structure is blind to all
// of them. It is the second opinion that makes the first one readable.
//
// Used by scripts/visual-check.mjs. Screens have their own machine-independent
// counterparts already (layout-parity.mjs, page-audit.mjs); the 162 golden
// examples had none, which is why this starts here.

/* The body of `snapshot()` below is serialised and run INSIDE the page, so it
 * speaks browser and this file is linted as Node. Declaring the two globals it
 * uses is the honest fix — the alternative is teaching the shared config that
 * every script is also a browser, which is not true of any other one. */
/* global getComputedStyle, document */

/* Not inherited: recorded wherever they are not at their initial value. */
const BOX_PROPS = [
  'display', 'position', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
  'gap', 'grid-template-columns', 'grid-template-rows',
  'padding', 'margin', 'border-radius',
  'background-color', 'background-image', 'box-shadow', 'opacity', 'transform',
  'overflow', 'z-index',
]

/* Inherited: recorded only where an element CHANGES the value it was given, so a
 * body-level font size is one entry instead of four hundred identical ones. A
 * regression still lands, on the element that caused it. `font-family` is in here
 * for one job: if a self-hosted face fails to load, every box that holds text
 * moves, and this says why in one line instead of leaving it to be inferred. */
const INHERITED_PROPS = [
  'color', 'font-family', 'font-size', 'font-weight', 'line-height',
  'letter-spacing', 'text-align',
]

/**
 * Read the structure of the page as currently rendered.
 *
 * Runs in the browser, so it must stay self-contained: Playwright ships the
 * function source across, not its closure.
 */
export async function measure(page, limit = 600) {
  return page.evaluate(
    ([boxProps, inheritedProps, max]) => {
      /* Values that mean "nothing was said here". Recording them would triple the
       * file and say nothing: an element with no shadow is the normal case. */
      const BORING = new Set([
        '0px', 'none', 'normal', 'auto', 'visible', 'static', '1', '0',
        'rgba(0, 0, 0, 0)', 'start', 'medium',
      ])
      const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT'])

      const elements = {}
      let count = 0
      let truncated = 0

      const walk = (el, path, parent) => {
        if (SKIP.has(el.tagName)) return
        if (count >= max) {
          truncated++
          return
        }
        count++

        const cs = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        const entry = {
          box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        }

        for (const p of boxProps) {
          const v = cs.getPropertyValue(p)
          if (v && !BORING.has(v)) entry[p] = v
        }
        /* Chromium resolves border-color to the used colour even where there is
         * no border to paint, so asking for it unconditionally records a colour
         * on every element in the tree. The border only exists if it has a style. */
        const borderStyle = cs.getPropertyValue('border-style')
        if (borderStyle && borderStyle !== 'none') {
          entry['border-style'] = borderStyle
          entry['border-width'] = cs.getPropertyValue('border-width')
          entry['border-color'] = cs.getPropertyValue('border-color')
        }
        for (const p of inheritedProps) {
          const v = cs.getPropertyValue(p)
          if (!v || BORING.has(v)) continue
          if (parent && parent.getPropertyValue(p) === v) continue
          entry[p] = v
        }

        const cls = el.classList[0] ? `.${el.classList[0]}` : ''
        elements[`${el.tagName.toLowerCase()}${cls}@${path || 'root'}`] = entry

        let i = 0
        for (const child of el.children) {
          const childPath = path === '' ? String(i) : `${path}/${i}`
          i++
          walk(child, childPath, cs)
        }
      }

      walk(document.body, '', null)
      return { elements, truncated }
    },
    [BOX_PROPS, INHERITED_PROPS, limit],
  )
}

/**
 * Compare two measurements. Returns human-readable differences, most structural
 * first (an element that appeared or vanished explains every number after it).
 *
 * `tolerance` is in whole pixels and defaults to 1. A box can land on 100.4 in
 * one run and 100.6 in the next from ordinary subpixel accumulation, which
 * rounds to a difference of one and means nothing. Layout breakage is never one
 * pixel: the misalignment that produced screens-check was seven percent of a
 * page. Anything above the tolerance is reported in full.
 */
export function compareStructure(now, base, { tolerance = 1 } = {}) {
  const a = now?.elements ?? {}
  const b = base?.elements ?? {}
  const gone = []
  const added = []
  const changed = []

  for (const key of Object.keys(b)) if (!(key in a)) gone.push(`${key} is gone`)
  for (const key of Object.keys(a)) if (!(key in b)) added.push(`${key} is new`)

  const AXIS = ['x', 'y', 'width', 'height']
  for (const key of Object.keys(a)) {
    if (!(key in b)) continue
    const x = a[key]
    const y = b[key]
    for (let i = 0; i < 4; i++) {
      const delta = x.box[i] - y.box[i]
      if (Math.abs(delta) > tolerance) {
        changed.push(`${key} ${AXIS[i]} ${y.box[i]} -> ${x.box[i]} (${delta > 0 ? '+' : ''}${delta})`)
      }
    }
    const props = new Set([...Object.keys(x), ...Object.keys(y)])
    props.delete('box')
    for (const p of props) {
      if (x[p] === y[p]) continue
      changed.push(`${key} ${p}: ${y[p] ?? '(unset)'} -> ${x[p] ?? '(unset)'}`)
    }
  }

  return [...gone, ...added, ...changed]
}
