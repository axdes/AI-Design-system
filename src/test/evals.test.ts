import { describe, expect, it } from 'vitest'
import { DIMENSIONS, readTags, staticScore, type Rubric } from '../../evals/scorers.mjs'
import registry from '../../component-registry.json'

/* The evals measure agents; these tests measure the evals. A scorer that stops
 * reporting is worse than no scorer at all — every future run would come back
 * green and the harness would quietly stop being evidence. Kept in the main
 * suite (fast, static only); `npm run eval` adds the compile + render pass.
 *
 * Fixtures are pulled in through the bundler rather than fs so the test needs no
 * Node types and no cwd assumptions. */
const RUBRICS = import.meta.glob('../../evals/tasks/*/rubric.json', {
  eager: true,
  import: 'default',
}) as Record<string, Rubric>

const EXPECTATIONS = import.meta.glob('../../evals/fixtures/*/bad/expect.json', {
  eager: true,
  import: 'default',
}) as Record<string, { mustFail: string[] }>

const SOURCES = import.meta.glob('../../evals/fixtures/*/*/*.{tsx,ts,css}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const taskId = (path: string) => path.split('/evals/')[1].split('/')[1]

const tasks = Object.entries(RUBRICS).map(([path, rubric]) => ({ id: taskId(path), rubric }))

function filesOf(id: string, kind: 'good' | 'bad') {
  const prefix = `/evals/fixtures/${id}/${kind}/`
  return Object.fromEntries(
    Object.entries(SOURCES)
      .filter(([path]) => path.includes(prefix))
      .map(([path, src]) => [path.split('/').pop()!, src]),
  )
}

describe('eval scorers', () => {
  it('there is at least one task, and every task has both fixtures', () => {
    expect(tasks.length).toBeGreaterThan(0)
    for (const { id } of tasks) {
      expect(Object.keys(filesOf(id, 'good')).length, `${id}/good`).toBeGreaterThan(0)
      expect(Object.keys(filesOf(id, 'bad')).length, `${id}/bad`).toBeGreaterThan(0)
    }
  })

  it.each(tasks)('$id: the reference solution scores 100%', ({ id, rubric }) => {
    const result = staticScore(filesOf(id, 'good'), { rubric, registry })
    expect(result.findings).toEqual({
      'components-exist': [],
      'props-exist': [],
      'props-complete': [],
      'required-used': [],
      'no-hand-rolling': [],
      'style-hygiene': [],
    })
    expect(result.score).toBe(1)
  })

  it.each(tasks)('$id: the wrong solution still trips every dimension it should', ({ id, rubric }) => {
    const expected = Object.entries(EXPECTATIONS).find(([p]) => taskId(p) === id)![1].mustFail
    const result = staticScore(filesOf(id, 'bad'), { rubric, registry })
    /* This test replays the STATIC scorers only; a pipeline task's spec-valid
     * and model-valid dimensions run the gate's own validators and are proven
     * by the `eval` gate step's fixture self-check, which fails when a scorer
     * goes blind on them. Filtering here keeps the two harnesses honest about
     * what each one actually exercises. */
    const staticExpected = expected.filter((d) => (DIMENSIONS as readonly string[]).includes(d))
    /* Sorted comparison, not "contains": a scorer that suddenly flags MORE than
     * the fixture was built for is also a signal worth looking at. */
    expect([...result.failed].sort()).toEqual([...staticExpected].sort())
  })
})

describe('JSX reader', () => {
  it('does not mistake a type argument for a component', () => {
    expect(readTags('const [v, set] = useState<Status[]>([])\nconst m = new Map<string, Role>()')).toEqual([])
  })

  it('reads a component that carries a type argument', () => {
    const tags = readTags('<FilterDropdown<Status> label="Status" multi />')
    expect(tags[0].name).toBe('FilterDropdown')
    expect(tags[0].attrs.map((a) => a.name)).toEqual(['label', 'multi'])
  })

  it("keeps a nested element's props out of its parent", () => {
    const tags = readTags(
      '<ListPageTemplate title="Docs" actions={<Button variant="primary" iconEnd>New</Button>}>x</ListPageTemplate>',
    )
    expect(tags[0].name).toBe('ListPageTemplate')
    expect(tags[0].attrs.map((a) => a.name)).toEqual(['title', 'actions'])
    expect(tags[1].name).toBe('Button')
    expect(tags[1].attrs.map((a) => a.name)).toEqual(['variant', 'iconEnd'])
  })

  it('survives a > inside an expression or a string', () => {
    const tags = readTags("<Card onClick={() => open('a>b')} tight>body</Card>")
    expect(tags[0].attrs.map((a) => a.name)).toEqual(['onClick', 'tight'])
  })
})
