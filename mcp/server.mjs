#!/usr/bin/env node
/* The design system as an MCP server: the same contract, served instead of read.
 *
 * component-index.md and `npm run registry` already give an agent discovery at
 * 2.4k tokens instead of 41k. That works when the agent is in this repository. A
 * client working in Cursor or Copilot on their own codebase has neither file and
 * no terminal into ours, so the system was still something to copy rather than
 * something to consume. This is the same three answers over a protocol every one
 * of those tools already speaks:
 *
 *   design_system_index   what exists, one line each (filterable)
 *   component             props, allowed values, variants, the golden example
 *   tokens                the token catalogue, by name or by intent
 *   verify                does this code use the system, answered on the code
 *   decide                which representation fits this task and data, BEFORE
 *                         writing — the selection rules the gate enforces,
 *                         served as an answer instead of a rejection
 *
 * `verify` is the one that changes behaviour rather than saving tokens. Over 27
 * measured agent runs, 22 of 39 failures were things the agent could have been
 * told about before anyone read the diff. A tool call that answers "you invented
 * <DataGrid density>" in a tenth of a second closes that loop for a client who
 * will never run our gate.
 *
 * No dependencies, deliberately. MCP over stdio is newline-delimited JSON-RPC
 * 2.0, which is about eighty lines; an SDK here would be a build step and a
 * version to keep in step for something this file can do in full.
 *
 * Run:  node packages/design-system/mcp/server.mjs      (or `npm run mcp`)
 * Wire: see mcp/README.md — .mcp.json in this repo already registers it.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'
import { staticScore, DIMENSIONS } from '../evals/scorers.mjs'
import { indexRow, renderRow } from '../scripts/lib/index-rows.mjs'
import { makeRuleEngine, TASKS, ITEM_KINDS, CARDINALITIES } from '../scripts/lib/spec-rules.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const PROTOCOL_VERSION = '2025-06-18'

const read = (rel) => JSON.parse(readFileSync(`${ROOT}/${rel}`, 'utf8'))
const registry = read('component-registry.json')
const rulesDoc = read('screen-specs/selection-rules.json')
const engine = makeRuleEngine(rulesDoc)
const all = { ...registry.components, ...registry.blocks }
/* Built from the registry, not parsed out of component-index.md: that file is a
 * rendering for an agent that reads files, and this server answers the same
 * question to an agent that can ask. One row builder for both. */
const rows = Object.values(all).map(indexRow)

/* ── the answers ─────────────────────────────────────────────────────── */

function renderIndex({ query, level, context } = {}) {
  const q = (query ?? '').toLowerCase()
  const hits = rows.filter(
    (r) =>
      (!q || r.ref.toLowerCase().includes(q) || r.use.toLowerCase().includes(q)) &&
      (!level || r.level === level) &&
      (!context || (r.context ?? 'card') === context),
  )
  if (!hits.length) return `Nothing matches. Call design_system_index with no arguments for the whole list of ${rows.length}.`
  const lines = hits.map(renderRow)
  return [
    `${hits.length} of ${rows.length} entries. This is the whole system: a component that is not here does not exist.`,
    'Ask `component` for the props, the allowed values and the golden example of the ones you will actually write.',
    '',
    ...lines,
  ].join('\n')
}

function bigrams(s) {
  const out = new Set()
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2))
  return out
}

function nearest(name) {
  const q = name.toLowerCase()
  const qb = bigrams(q)
  return Object.keys(all)
    .map((ref) => {
      const rb = bigrams(ref.toLowerCase())
      let shared = 0
      for (const g of qb) if (rb.has(g)) shared++
      return [ref, (2 * shared) / (qb.size + rb.size || 1)]
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ref]) => ref)
}

function renderComponent(names, dense) {
  const out = []
  for (const name of names) {
    const e = all[name]
    if (!e) {
      out.push(`${name} is not in this design system. Nearest: ${nearest(name).join(', ')}.\nIf nothing here covers the need, say so and stop; do not hand-roll it.`)
      continue
    }
    const lines = [`${e.ref}  (${[e.level, e.context ?? 'card', e.status].filter(Boolean).join(' · ')})`, e.description]
    if (e.from) {
      const app = e.from.replace('@/components/', '@ds/').replace('@/blocks/', '@blocks/')
      lines.push(`import from: '${e.from}' inside the design system, '${app}' from an app`)
    }
    const parts = (e.exports ?? []).filter((n) => n !== e.main)
    if (parts.length) lines.push(`parts: ${parts.join(', ')}`)
    if (e.props?.length) {
      lines.push('props:')
      for (const p of e.props) {
        const values = p.values?.length ? `  one of: ${p.values.join(' | ')}` : ''
        lines.push(`  ${p.name}${p.required ? ' (required)' : ''}: ${p.type}${values}`)
        if (p.description && !dense) lines.push(`    ${p.description}`)
      }
    }
    if (e.variants && Object.keys(e.variants).length) {
      lines.push('variants (data-* the CSS actually styles):')
      for (const [attr, v] of Object.entries(e.variants)) {
        const values = Array.isArray(v) ? v : (v.values ?? Object.values(v).flat())
        lines.push(`  data-${attr}: ${[...new Set(values)].join(' | ')}`)
      }
    }
    if (e.uses?.length) lines.push(`composes: ${e.uses.join(', ')}`)
    if (e.example && !dense) lines.push('golden example (real code, compiled and rendered by the test suite):', e.example)
    out.push(lines.join('\n'))
  }
  return out.join('\n\n---\n\n')
}

function renderTokens(filter) {
  const q = (filter ?? '').toLowerCase()
  const catalog = Array.isArray(registry.tokens) ? registry.tokens : Object.values(registry.tokens ?? {})
  const hits = catalog.filter((t) => !q || JSON.stringify(t).toLowerCase().includes(q))
  if (!hits.length) return `No token matches "${filter}". Call tokens with no filter for all ${catalog.length}.`
  const name = (t) => t.name ?? t.token ?? String(t)
  const width = Math.max(...hits.map((t) => name(t).length))
  return [
    `${hits.length} of ${catalog.length} tokens. Components use semantic roles; never a raw px or hex.`,
    'The same values in DTCG, for a pipeline rather than a prompt: tokens/design.tokens.json.',
    '',
    ...hits.map((t) => `${name(t).padEnd(width)}  ${t.value ?? ''}${t.description ? `   ${t.description}` : ''}`),
  ].join('\n')
}

/* The conformance scorers, pointed at code the caller has not written to disk.
 * Same four dimensions `npm run verify` reports: the two the evals add
 * (required-used, no-hand-rolling) are per-task expectations and mean nothing
 * for an arbitrary file. */
const VERIFY_DIMENSIONS = DIMENSIONS.filter((d) => !['required-used', 'no-hand-rolling'].includes(d))

function renderVerify(files) {
  const named = {}
  for (const f of files) named[f.name ?? 'Screen.tsx'] = f.code ?? ''

  const imported = new Set()
  for (const src of Object.values(named)) {
    for (const m of src.matchAll(/import\s+(?:type\s+)?(?:(\w+)\s*,\s*)?(?:\{([^}]*)\}|(\w+))\s+from\s+["'][^"']+["']/g)) {
      for (const n of [m[1], m[3], ...(m[2] ?? '').split(',')].filter(Boolean)) {
        const id = n.trim().split(/\s+as\s+/).pop()
        if (/^[A-Z]/.test(id)) imported.add(id)
      }
    }
  }

  const { findings } = staticScore(named, { registry })
  /* A tag the caller imported from their own app is their component, not an
   * invented one. Whether that import resolves is the compiler's question. */
  findings['components-exist'] = (findings['components-exist'] ?? []).filter(
    (line) => !imported.has(/<([A-Za-z][\w.]*)/.exec(line)?.[1]?.split('.')[0]),
  )

  const reported = VERIFY_DIMENSIONS.map((d) => [d, findings[d] ?? []])
  const total = reported.reduce((n, [, v]) => n + v.length, 0)
  if (!total) return `✓ ${Object.keys(named).join(', ')}: every component and prop is real, no inline styles, no raw values.`
  const lines = [`✗ ${total} problem(s) in ${Object.keys(named).join(', ')}:`]
  for (const [d, hits] of reported) {
    if (!hits.length) continue
    lines.push(`\n${d}:`)
    for (const h of hits) lines.push(`  ${h}`)
  }
  lines.push('\nFix these before the code is reviewed: each one is a rule this system enforces mechanically, not a preference.')
  return lines.join('\n')
}

/* The decision layer, served as an answer instead of a rejection: the same
 * rules check:spec enforces on specs, asked BEFORE anything is written. */
function renderDecide({ task, data, components, archetype } = {}) {
  const out = []

  if (archetype) {
    const a = (rulesDoc.archetypes ?? {})[archetype]
    if (!a) return `No archetype "${archetype}". The taxonomy: ${Object.keys(rulesDoc.archetypes ?? {}).join(', ')}.`
    out.push(
      `archetype ${archetype}`,
      `  use when: ${a.useWhen}`,
      `  not when: ${a.notWhen}`,
      a.templates?.length ? `  carried by: ${a.templates.join(' or ')}` : '  carried by: no single block — template "custom" with a customReason',
    )
    if (a.forbidComponents?.length) out.push(`  forbids: ${a.forbidComponents.join(', ')}`)
  }

  if (task) {
    if (!TASKS.includes(task)) return `No task "${task}". One verb per zone: ${TASKS.join(' | ')}.`
    const d = data ?? {}
    const { matched, allowed, forbidden } = engine.decide(task, d)
    if (out.length) out.push('')
    const shape = [d.item, d.cardinality, d.fields !== undefined ? `${d.fields} fields` : null, d.editable ? 'editable' : null]
      .filter(Boolean).join(', ')
    out.push(`task ${task}${shape ? ` over ${shape}` : ''}:`)
    if (!matched.length) {
      out.push(
        '  no rule matches this task and shape. Say more (data.item, data.cardinality, data.fields) —',
        '  or this pair genuinely has no rule yet, in which case the spec review decides and',
        '  screen-specs/selection-rules.json should gain the rule.',
      )
    } else {
      for (const r of matched) {
        out.push(`  ${r.id} ${r.title}: use ${r.choose.map((rep) => `${rep} (${(rulesDoc.representations[rep]?.components ?? []).join(', ')})`).join(' or ')}`)
        out.push(`      ${r.because}`)
        if (r.good) out.push(`      right: ${r.good}`)
        if (r.bad) out.push(`      wrong: ${r.bad}`)
      }
      const reps = [...new Set(allowed)]
      out.push(`  anything outside ${reps.join(' | ')} fails check:spec for this zone.`)
    }
    for (const h of forbidden) out.push(`  ruled out: ${h.forbid.join(', ')} — ${h.because} Use ${h.instead}.`)

    if (components?.length) {
      const zone = { name: 'zone', task, data: d, components }
      const { problems, notes } = engine.checkZone(zone)
      out.push('', 'your plan:')
      if (!problems.length) out.push(`  ✓ ${components.join(', ')} — passes these rules.`)
      for (const p of problems) out.push(`  ✗ ${p}`)
      for (const n of notes) out.push(`  ! ${n}`)
    }
  }

  if (!out.length) {
    return [
      'Pass a task (and the data shape), an archetype, or both.',
      `tasks: ${TASKS.join(' | ')}`,
      `archetypes: ${Object.keys(rulesDoc.archetypes ?? {}).join(' | ')}`,
    ].join('\n')
  }
  return out.join('\n')
}

/* ── the protocol ────────────────────────────────────────────────────── */

const TOOLS = [
  {
    name: 'design_system_index',
    description:
      'Every component and block in the design system, one line each: what it is for, its atomic level, the surface it belongs on. Start here before writing any UI. Optionally filter by a search term, a level or a surface context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Match against the name and the one-line purpose, e.g. "table", "date", "empty".' },
        level: { type: 'string', enum: ['atom', 'molecule', 'organism', 'block'], description: 'Atomic level.' },
        context: { type: 'string', enum: ['page', 'region', 'card'], description: 'Surface it may live on: page owns the viewport, region brings its own surface, card sits inside one.' },
      },
    },
  },
  {
    name: 'component',
    description:
      'The full contract for named components: props with their types, the allowed values of every union, the data-* variants the CSS really styles, what it composes, and a golden example that is real compiled code. Ask for the two or three you are about to write, not for everything.',
    inputSchema: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }, description: 'Component names exactly as the index spells them.' },
        dense: { type: 'boolean', description: 'Drop the examples and prop descriptions. Half the tokens, same contract.' },
      },
      required: ['names'],
    },
  },
  {
    name: 'tokens',
    description:
      'The token catalogue: semantic roles, spacing, type, radius, motion. A component uses these; a raw px or hex is a defect the linter rejects. Filter by name or by intent.',
    inputSchema: {
      type: 'object',
      properties: { filter: { type: 'string', description: 'e.g. "space", "danger", "radius", "muted".' } },
    },
  },
  {
    name: 'decide',
    description:
      'Which representation fits this zone, BEFORE you write it: pass the user task (one verb) and the shape of the data, get what the selection rules choose — table, list, cards, grid or stats — with the reason and a right/wrong pair. Optionally pass the components you plan to use to have the plan checked, or an archetype name for when-to-use guidance. The same rules check:spec enforces on screen specs, so an answer here is a rejection avoided.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', enum: TASKS, description: 'What the user DOES in the zone, one verb.' },
        data: {
          type: 'object',
          description: 'The shape of what the zone shows.',
          properties: {
            item: { type: 'string', enum: ITEM_KINDS, description: 'What one item is: structured fields (record), text to read (prose), an image that carries the decision (visual), a number on a scale (metric).' },
            cardinality: { type: 'string', enum: CARDINALITIES, description: 'How many items. unbounded forbids Table.' },
            fields: { type: 'number', description: 'How many attributes per item matter to the task. 4+ comparable fields is what earns columns.' },
            editable: { type: 'boolean', description: 'true only when editing values IS the task.' },
          },
        },
        components: { type: 'array', items: { type: 'string' }, description: 'The components you plan for the zone — checked against the rules.' },
        archetype: { type: 'string', description: 'A screen archetype (list, worklist, detail, hub, …) for use-when / not-when guidance.' },
      },
    },
  },
  {
    name: 'verify',
    description:
      'Check code against the design system BEFORE anyone reviews it: invented components, props that do not exist, values outside a union, inline styles, raw px and hex. Answers in a tenth of a second and does not need the file to exist. Run it on what you just wrote.',
    inputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          description: 'The files that together make one screen or component.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'File name, e.g. Screen.tsx or Screen.css.' },
              code: { type: 'string', description: 'The file contents.' },
            },
            required: ['code'],
          },
        },
      },
      required: ['files'],
    },
  },
]

function call(name, args = {}) {
  switch (name) {
    case 'design_system_index':
      return renderIndex(args)
    case 'component': {
      const names = Array.isArray(args.names) ? args.names : [args.names].filter(Boolean)
      if (!names.length) return 'Name at least one component. `design_system_index` lists them all.'
      return renderComponent(names, Boolean(args.dense))
    }
    case 'tokens':
      return renderTokens(args.filter)
    case 'decide':
      return renderDecide(args)
    case 'verify': {
      const files = Array.isArray(args.files) ? args.files : []
      if (!files.length) return 'Pass at least one file: { name, code }.'
      return renderVerify(files)
    }
    default:
      throw new Error(`unknown tool: ${name}`)
  }
}

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')
const result = (id, value) => send({ jsonrpc: '2.0', id, result: value })
const failure = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

function handle(msg) {
  const { id, method, params } = msg
  /* A notification has no id and takes no answer. */
  if (id === undefined) return

  switch (method) {
    case 'initialize':
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'design-system', version: String(registry.schemaVersion ?? 1) },
        instructions:
          'The design system this project builds UI from. Call design_system_index first to see what exists, ' +
          'decide before laying out a zone (task + data shape in, the representation the rules choose out), ' +
          'component for the props of the ones you will write, and verify on the code before you hand it over. ' +
          'Never invent a component or a prop: if the index does not list it, it does not exist.',
      })
    case 'notifications/initialized':
      return
    case 'ping':
      return result(id, {})
    case 'tools/list':
      return result(id, { tools: TOOLS })
    case 'tools/call':
      try {
        return result(id, { content: [{ type: 'text', text: call(params?.name, params?.arguments) }] })
      } catch (e) {
        /* A tool failure is a result with isError, not a protocol error: the
         * model has to see it and correct itself, not have the call disappear. */
        return result(id, { content: [{ type: 'text', text: String(e.message ?? e) }], isError: true })
      }
    default:
      return failure(id, -32601, `method not found: ${method}`)
  }
}

if (!existsSync(`${ROOT}/component-registry.json`)) {
  process.stderr.write('component-registry.json is missing. Run `npm run gen-registry` first.\n')
  process.exit(1)
}

createInterface({ input: process.stdin }).on('line', (line) => {
  const text = line.trim()
  if (!text) return
  let msg
  try {
    msg = JSON.parse(text)
  } catch {
    return failure(null, -32700, 'parse error')
  }
  try {
    handle(msg)
  } catch (e) {
    failure(msg?.id ?? null, -32603, String(e.message ?? e))
  }
})
