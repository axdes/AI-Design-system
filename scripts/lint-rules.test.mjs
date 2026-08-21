/* The custom linter, rule by rule, against code written to break it.
 *
 * `lint:rules` is the one check in this repository that encodes what no
 * off-the-shelf tool knows: tokens instead of raw px, logical properties because
 * the system ships Arabic, a real primitive instead of a bare <input>, an
 * aria-label and a Tooltip on a control whose label is a picture. It has run on
 * every commit for months and nothing ever proved it still bites.
 *
 * Each test builds a tiny package in a temp directory, breaks one rule in it,
 * and asserts that rule reports — and that its neighbours stay quiet, because a
 * rule that fires on everything is as useless as one that fires on nothing.
 *
 * The rules are pure functions of a context, which is why this can be fast: no
 * process, no repository, no fixtures to keep in step with the real components.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createContext,
  rSpacingPx,
  rLogicalProps,
  rSemanticOnly,
  rRawControls,
  rIconButtonA11y,
  rIconButtonTooltip,
  rInlineStyle,
  rFileSize,
  rBreakpointScale,
} from './lint-rules/rules.mjs'

let root

/** A one-component package: whatever the test writes, plus nothing else. */
function pkg(files) {
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, body)
  }
  return createContext({ root, srcDir: 'src' })
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ds-rules-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('tokens instead of raw values', () => {
  it('reports a raw px on a spacing property, and not on a border width', () => {
    const c = pkg({
      'src/components/Probe/Probe.css': '.probe {\n  padding: 18px;\n  border-width: 1px;\n}\n',
      'src/components/Probe/Probe.tsx': 'export function Probe() { return <div className="probe" /> }\n',
    })
    const out = rSpacingPx(c)
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('18px')
  })

  it('stays quiet when the spacing comes from the scale', () => {
    const c = pkg({
      'src/components/Probe/Probe.css': '.probe {\n  padding: var(--space-4);\n  gap: var(--space-2);\n}\n',
      'src/components/Probe/Probe.tsx': 'export function Probe() { return <div className="probe" /> }\n',
    })
    expect(rSpacingPx(c)).toEqual([])
  })

  it('reports a tonal primitive where a semantic role belongs', () => {
    const c = pkg({
      'src/components/Probe/Probe.css': '.probe {\n  color: var(--danger-500);\n}\n',
      'src/components/Probe/Probe.tsx': 'export function Probe() { return <div className="probe" /> }\n',
    })
    const out = rSemanticOnly(c)
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('danger-500')
  })
})

describe('right-to-left', () => {
  it('reports a physical property and leaves the logical one alone', () => {
    const c = pkg({
      'src/components/Probe/Probe.css': '.probe {\n  margin-left: var(--space-2);\n  padding-inline-start: var(--space-2);\n}\n',
      'src/components/Probe/Probe.tsx': 'export function Probe() { return <div className="probe" /> }\n',
    })
    const out = rLogicalProps(c)
    /* One finding, on the line with the physical property and not on the one
     * below it: the rule has to tell them apart, which is the whole job. */
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('Probe.css:2')
  })
})

describe('primitives instead of bare elements', () => {
  it('reports a raw <input> in a screen', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx': 'export function ProbePage() { return <input placeholder="Search" /> }\n',
    })
    const out = rRawControls(c)
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('raw <input>')
  })

  it('leaves a file picker alone, because no primitive covers it', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx': 'export function ProbePage() { return <input type="file" /> }\n',
    })
    expect(rRawControls(c)).toEqual([])
  })
})

describe('a control whose label is a picture', () => {
  it('reports an icon-only button with no accessible name', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx': 'export function ProbePage() { return <button className="x"><Icon name="close" /></button> }\n',
    })
    expect(rIconButtonA11y(c).length).toBeGreaterThan(0)
  })

  it('reports an IconButton that names itself and never says so on hover', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx': 'export function ProbePage() { return <IconButton icon="close" aria-label="Close" /> }\n',
    })
    expect(rIconButtonTooltip(c).length).toBeGreaterThan(0)
  })

  it('stays quiet when the same control is wrapped in a Tooltip', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx':
        'export function ProbePage() {\n  return (\n    <Tooltip content="Close">\n      <IconButton icon="close" aria-label="Close" />\n    </Tooltip>\n  )\n}\n',
    })
    expect(rIconButtonTooltip(c)).toEqual([])
  })
})

describe('decisions belong in CSS', () => {
  it('reports a static inline style and allows a computed one', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx':
        'export function ProbePage({ x }: { x: number }) {\n  return (\n    <>\n      <div style={{ padding: 12 }} />\n      <div style={{ transform: `translateX(${x}px)` }} />\n    </>\n  )\n}\n',
    })
    const out = rInlineStyle(c)
    /* The static one, not the one computed from a prop — an animation position
     * cannot live in a stylesheet and the rule knows it. */
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('ProbePage.tsx:4')
  })
})

describe('the breakpoint scale', () => {
  const SETTINGS = ':root {\n  --bp-md: 48rem;\n  --bp-lg: 62rem;\n}\n'

  it('reports a width off the scale and leaves the ones on it alone', () => {
    const c = pkg({
      'styles/settings.css': SETTINGS,
      'src/components/Probe/Probe.css':
        '@media (max-width: 48rem) {\n  .probe { display: none; }\n}\n@media (min-width: 67rem) {\n  .probe { display: block; }\n}\n',
    })
    const out = rBreakpointScale(c)
    /* A max-width query at a min-width breakpoint is the same decision seen from
     * below — it is the NUMBER that has to be on the scale, not the direction. */
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('67rem')
  })

  it('stays quiet where the width is recorded as content-driven', () => {
    const c = pkg({ 'styles/settings.css': SETTINGS, 'src/components/Probe/Probe.css': '@media (min-width: 67rem) {\n  .probe { display: block; }\n}\n' })
    expect(rBreakpointScale({ ...c, allowList: (k) => (k === 'breakpointScale' ? ['67rem'] : []) })).toHaveLength(0)
  })

  it('says nothing at all in a package that declares no scale', () => {
    /* An app that has no --bp-* tokens of its own has no scale to be off. */
    const c = pkg({ 'src/components/Probe/Probe.css': '@media (min-width: 67rem) {\n  .probe { display: block; }\n}\n' })
    expect(rBreakpointScale(c)).toHaveLength(0)
  })
})

describe('size', () => {
  it('reports a file past the ceiling', () => {
    const c = pkg({
      'src/layouts/ProbePage.tsx': `export function ProbePage() { return <div /> }\n${'// filler\n'.repeat(700)}`,
    })
    expect(rFileSize({ ...c, fileSizeMax: 600 }).length).toBeGreaterThan(0)
  })
})
