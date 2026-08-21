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

  it('reports an unknown tool as a result the model can read, not as a dropped call', async () => {
    const [, answer] = await talk([init, callTool(2, 'nonesuch', {})])
    expect(answer.result.isError).toBe(true)
    expect(textOf(answer)).toContain('unknown tool')
  })
})
