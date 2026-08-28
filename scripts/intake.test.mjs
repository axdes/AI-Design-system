/* The intake, held to the document it was built against.
 *
 * The fixture is a requirements document of the ordinary kind: a corporate brand
 * book's colours, a radius nobody derived from anything, four component names
 * that do not exist here, three prop values nothing publishes, and — underneath
 * all of it — a real requirement worth building. Every assertion below is about
 * telling those apart.
 *
 * These are the failures worth catching, and each one has been seen: a hex read
 * as a component name, a substitute suggested on a coincidence of letters, a
 * question answered with a guess, and a decision erased by a re-run. */
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const run = (...args) => JSON.parse(execFileSync('node', ['scripts/intake.mjs', ...args, '--json'], { encoding: 'utf8' }))
const report = run('intake/fixtures/supplier-portal.md')
const find = (quote) => report.findings.find((f) => f.quote === quote)

describe('what the document pins', () => {
  it('carries a value the system already has, and names it', () => {
    expect(find('20px')).toMatchObject({ verdict: 'carried', kind: 'length' })
    expect(find('20px').says).toContain('--space-5')
    expect(find('DataGrid')).toMatchObject({ verdict: 'carried', kind: 'component' })
  })

  it('refuses a length off the scale and names the steps either side', () => {
    const gap = find('18px')
    expect(gap.verdict).toBe('refused')
    expect(gap.says).toContain('--space-4')
    expect(gap.says).toContain('--space-5')
  })

  it('sends a colour the layer has nothing like to the brand manifest, not to a component', () => {
    expect(find('#E4002B')).toMatchObject({ verdict: 'brand', kind: 'colour' })
  })

  it('does not read a hex as a component name', () => {
    /* #E4002B is CamelCase-shaped and was reported as a missing component
     * alongside being reported as a colour: one string, two contradictory
     * findings, and the report told a reader their brand red was a typo. */
    const asName = report.findings.filter((f) => f.kind === 'component' && f.quote.includes('E4002B'))
    expect(asName).toEqual([])
  })

  it('refuses a prop value nothing publishes, and lists the ones that exist', () => {
    const tone = find('tone=critical')
    expect(tone.verdict).toBe('refused')
    expect(tone.says).toContain('danger')
  })
})

describe('what it says instead', () => {
  it('offers the family when the name shares a word with one', () => {
    expect(find('FilterPanel').says).toContain('FilterBar')
    expect(find('ButtonBar').says).toContain('ButtonGroup')
  })

  it('says nothing rather than a name it cannot defend', () => {
    /* Letter-overlap scoring answered InfoBox with Combobox and StatusPicker
     * with DatePicker. A wrong component name in a cited report is read as an
     * answer; "search it" is read as a question, which is what this has. */
    for (const q of ['InfoBox', 'StatusPicker']) {
      expect(find(q).says).toContain('nothing in it shares a word')
      expect(find(q).cite).toBeNull()
    }
  })

  it('asks about a typeface named in prose instead of guessing at it', () => {
    const asked = report.findings.filter((f) => f.verdict === 'question')
    expect(asked).toHaveLength(1)
    expect(asked[0].quote).toContain('Frutiger')
  })

  it('does not turn a resolved length into an open question', () => {
    /* "Base font size 15px" contains the word font and is not about a family.
     * It is already answered as a length, and asking about it again undoes that. */
    expect(report.findings.some((f) => f.verdict === 'question' && f.quote.includes('Base font size'))).toBe(false)
  })
})

describe('the worked example that ships with it', () => {
  const findings = readFileSync('intake/supplier-portal.findings.md', 'utf8')

  it('answers every refusal it raises', () => {
    const refusals = findings.match(/^### R\d+ · /gm) ?? []
    const answered = findings.match(/^> decision: \S/gm) ?? []
    expect(refusals.length).toBe(report.counts.refused)
    expect(answered.length).toBe(refusals.length)
  })

  it('carries its decisions across a re-run', () => {
    /* A brief gets revised and the intake gets run again. Before this, the
     * second run erased every answer the first one collected. */
    const before = readFileSync('intake/supplier-portal.findings.md', 'utf8')
    execFileSync('node', ['scripts/intake.mjs', 'intake/fixtures/supplier-portal.md'], { encoding: 'utf8' })
    const after = readFileSync('intake/supplier-portal.findings.md', 'utf8')
    expect(after.match(/^> decision: \S/gm)?.length).toBe(before.match(/^> decision: \S/gm)?.length)
  })
})

describe('what it refuses to read', () => {
  it('names a binary document rather than parsing it badly', () => {
    /* A .docx read as text is a page of XML this would then find colours in,
     * and a report full of findings that are not in the document is worse than
     * no report at all. */
    const path = `${tmpdir()}/intake-fixture.docx`
    writeFileSync(path, 'PK\u0003\u0004 not really a document')
    let failed = null
    try { execFileSync('node', ['scripts/intake.mjs', path], { encoding: 'utf8', stdio: 'pipe' }) }
    catch (e) { failed = String(e.stderr) }
    rmSync(path, { force: true })
    expect(failed).toContain('binary document')
  })
})
