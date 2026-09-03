/* The MCP server is a contract with clients that are not this repository, so what
 * is worth testing is the protocol, not the prose: a renamed tool or a changed
 * handshake breaks a Cursor session somewhere, with no error anybody here would
 * ever see. The answers themselves come from the registry, which the gate already
 * verifies, so this checks the shape, the refusal, and one real verdict.
 *
 * Plain .mjs next to the server rather than .ts under src/: this package compiles
 * for the browser with `"types": []`, so `node:child_process` has no types there.
 * vite.config.ts includes mcp/**\/*.test.mjs in the same suite. */
import { describe, it, expect } from 'vitest'
import { execFile } from 'node:child_process'

/* A path relative to the package root, not one derived from import.meta.url:
 * this suite runs under jsdom (the shared setup file needs a document), and
 * there import.meta.url is an http: URL that fileURLToPath rightly refuses.
 * vitest runs with the package as its working directory. */
const SERVER = 'mcp/server.mjs'

/* One process per exchange: the server is newline-delimited JSON-RPC on stdin,
 * and a client that closes stdin is a client that has finished. */
function talk(requests) {
  return new Promise((resolve, reject) => {
    /* process.execPath, not 'node': the runtime already running this suite,
     * rather than whatever PATH happens to resolve to. */
    const child = execFile(process.execPath, [SERVER], { timeout: 20_000, cwd: process.cwd() }, (err, stdout) => {
      if (err && !stdout) return reject(err)
      resolve(stdout.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)))
    })
    child.stdin.end(requests.map((r) => JSON.stringify(r)).join('\n') + '\n')
  })
}

const init = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2025-06-18', capabilities: {} },
}
const callTool = (id, name, args) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } })
const textOf = (m) => m?.result?.content?.[0]?.text ?? ''

describe('the design system over MCP', () => {
  it('answers the handshake and lists exactly the five tools', async () => {
    const [hello, tools] = await talk([init, { jsonrpc: '2.0', id: 2, method: 'tools/list' }])
    expect(hello.result.protocolVersion).toBe('2025-06-18')
    expect(hello.result.serverInfo.name).toBe('design-system')
    expect(tools.result.tools.map((t) => t.name)).toEqual([
      'design_system_index',
      'component',
      'tokens',
      'decide',
      'verify',
    ])
  })

  it('decides a representation from task and data, and rejects a wrong plan', async () => {
    const [, verdict, plan, guide] = await talk([
      init,
      callTool(2, 'decide', { task: 'compare', data: { item: 'record', cardinality: 'many', fields: 6 } }),
      callTool(3, 'decide', {
        task: 'compare',
        data: { item: 'record', cardinality: 'many', fields: 6 },
        components: ['Card', 'CardTitle', 'MetaItem'],
      }),
      callTool(4, 'decide', { archetype: 'worklist' }),
    ])
    expect(textOf(verdict)).toContain('R1')
    expect(textOf(verdict)).toContain('Table')
    expect(textOf(plan)).toContain('✗')
    expect(textOf(plan)).toContain('not what any matching rule chooses')
    expect(textOf(guide)).toContain('use when')
    expect(textOf(guide)).toContain('FilterBar')
  })

  it('decides WHICH table once the answer is a table, and rejects a wrong kind', async () => {
    const [, verdict, plan] = await talk([
      init,
      callTool(2, 'decide', {
        task: 'process',
        data: { item: 'record', cardinality: 'many', fields: 6, select: 'batch' },
      }),
      callTool(3, 'decide', {
        task: 'find',
        data: { item: 'record', cardinality: 'unbounded', fields: 6 },
        table: 'list',
        components: ['Table'],
      }),
    ])
    /* The queue with a batch action: the layer names the kind, what builds it
     * and what it owes, without being asked a second question. */
    expect(textOf(verdict)).toContain('selection')
    expect(textOf(verdict)).toContain('BatchActions')
    expect(textOf(verdict)).toContain('owes')
    /* Unbounded rows rule every Table kind out, and the answer says so. */
    expect(textOf(plan)).toContain('virtualized')
  })

  it('decides a form kind from the shape of the input, and rejects a wrong plan', async () => {
    const [, verdict, plan] = await talk([
      init,
      callTool(2, 'decide', {
        task: 'input',
        data: { fields: 14, commit: 'explicit', context: 'standalone', familiarity: 'routine' },
      }),
      callTool(3, 'decide', {
        task: 'input',
        data: { fields: 14, commit: 'explicit', context: 'standalone', familiarity: 'routine', form: 'dialog' },
        components: ['FormModal', 'Field'],
      }),
    ])
    expect(textOf(verdict)).toContain('page')
    expect(textOf(verdict)).toContain('FormPageTemplate')
    expect(textOf(plan)).toContain('✗')
    expect(textOf(plan)).toContain('ruled out')
  })

  it('serves the index and the contract of one component', async () => {
    const [, list, one] = await talk([
      init,
      callTool(2, 'design_system_index', { query: 'badge' }),
      callTool(3, 'component', { names: ['Badge'], dense: true }),
    ])
    expect(textOf(list)).toContain('Badge')
    expect(textOf(one)).toContain('data-tone')
    /* dense drops the example, which is the whole point of the flag */
    expect(textOf(one)).not.toContain('golden example')
  })

  /* The wiring, not the wording: guidance is a separate module with its own unit
     tests, and what this proves is that a nudge actually crosses the protocol and
     that a session gets it once rather than on every answer. */
  it('appends one decision-time nudge, and does not repeat it', async () => {
    const [, first, second] = await talk([
      init,
      callTool(2, 'design_system_index', { query: 'badge' }),
      callTool(3, 'design_system_index', { query: 'table' }),
    ])
    expect(textOf(first)).toContain('→ ')
    expect(textOf(first)).toMatch(/names, not contracts/)
    expect(textOf(second)).not.toContain('→ ')
  })

  it('names the nearest real components instead of accepting an invented one', async () => {
    const [, answer] = await talk([init, callTool(2, 'component', { names: ['DataTable'] })])
    expect(textOf(answer)).toContain('not in this design system')
    expect(textOf(answer)).toMatch(/Table|DataGrid/)
  })

  it('verifies code it was handed, with no file on disk', async () => {
    const bad = 'export function Screen(){ return <div style={{padding:12}}><Badge tone="nope">x</Badge></div> }'
    const good = 'import { Badge } from "@ds/Badge"\nexport function Screen(){ return <Badge tone="warning">Late</Badge> }'
    const [, red, green] = await talk([
      init,
      callTool(2, 'verify', { files: [{ name: 'Screen.tsx', code: bad }] }),
      callTool(3, 'verify', { files: [{ name: 'Screen.tsx', code: good }] }),
    ])
    expect(textOf(red)).toContain('props-exist')
    expect(textOf(red)).toContain('inline style')
    expect(textOf(green)).toContain('✓')
  })

  /* The failure this whole harness exists for, and the one an agent walks into
     by doing the most natural thing available: it makes up a component and then
     writes the import for it. The import used to buy silence unconditionally —
     the exemption is for the caller's OWN components, and `@ds/…` is not one of
     those. Found by an audit on 2026-08-26; the tool called this file clean. */
  it('an invented component is not excused by an import from the system itself', async () => {
    const invented = 'import { DataTable } from "@ds/DataTable"\nexport function Screen(){ return <DataTable rows={[]} /> }'
    const theirs = 'import { OrderTable } from "../components/OrderTable"\nexport function Screen(){ return <OrderTable /> }'
    const [, red, green] = await talk([
      init,
      callTool(2, 'verify', { files: [{ name: 'Screen.tsx', code: invented }] }),
      callTool(3, 'verify', { files: [{ name: 'Screen.tsx', code: theirs }] }),
    ])
    expect(textOf(red)).toContain('components-exist')
    expect(textOf(red)).toContain('DataTable')
    /* And the reason the exemption exists still holds: a component from the
       caller's own app is theirs, and whether the import resolves is tsc's
       question, not this tool's. */
    expect(textOf(green)).toContain('✓')
  })

  it('reports an unknown tool as a result the model can read, not as a dropped call', async () => {
    const [, answer] = await talk([init, callTool(2, 'nonesuch', {})])
    expect(answer.result.isError).toBe(true)
    expect(textOf(answer)).toContain('unknown tool')
  })
})
