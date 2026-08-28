/* The five tools this package answers over MCP, as DATA.
 *
 * Their own module because the server has side effects on import — it speaks
 * stdio the moment it loads — and the list is also read by the site, which
 * describes what an agent may call. One list, two readers: a tool renamed here
 * is renamed in both, in the same commit.
 *
 * The enums in the schemas are read from the same rules files the gate uses, so
 * a tool cannot offer a task, a card kind or a form kind the system dropped.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { TASKS, ITEM_KINDS, CARDINALITIES, COMMIT_MODELS, FORM_CONTEXTS, FAMILIARITY, ROW_UNITS } from '../scripts/lib/spec-rules.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
const read = (p) => JSON.parse(readFileSync(`${ROOT}/${p}`, 'utf8'))
const CONTENT_KINDS = Object.keys(read('screen-specs/card-rules.json').contentKinds ?? {})
const FORM_KINDS = Object.keys(read('screen-specs/form-rules.json').formKinds ?? {})

export const TOOLS = [
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
      'Which representation fits this zone, BEFORE you write it: pass the user task (one verb) and the shape of the data, get what the selection rules choose — table, list, cards, grid or stats — with the reason and a right/wrong pair. Add data.carries and the answer goes one level deeper: WHICH card family, its parts, what builds it and what it owes. With task=input the other layer answers instead: which KIND of form (dialog, panel, page, wizard, settings, draft, …) for this many fields, this familiarity, this context and this commit model, and what that kind is built from. Pass `lifecycle` instead and it answers the questions that are not about looks: how hard this destruction should be to confirm, which shape this edit takes, which variant of a detail page this record earns. Optionally pass the components you plan to use to have the plan checked, or an archetype name for when-to-use guidance. The same rules check:spec enforces on screen specs, so an answer here is a rejection avoided.',
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
            carries: { type: 'string', enum: CONTENT_KINDS, description: 'What ONE card carries — the content type. Given, the answer goes one level deeper and names the card family, its parts and what builds it (screen-specs/card-rules.json).' },
            rowUnit: { type: 'string', enum: ROW_UNITS, description: 'Table zones: what ONE ROW is. Defaults to record. It is what picks the kind of table, together with the task (screen-specs/table-rules.json).' },
            axes: { type: 'string', enum: ['rows', 'cross'], description: 'Table zones: one axis (columns are fields) or two (columns are a second category and the cell is a measure, which is a matrix).' },
            cells: { type: 'string', enum: ['static', 'interactive'], description: 'Table zones: whether a CELL is operated. interactive makes it an ARIA grid, which owes one tab stop and arrow keys between cells.' },
            select: { type: 'string', enum: ['none', 'single', 'batch'], description: 'Table zones: how rows are picked. batch means one action applies to several rows, which needs a count, a select-all and a way out.' },
            nesting: { type: 'string', enum: ['flat', 'grouped', 'hierarchy'], description: 'Table zones: flat rows, named collapsible groups, or rows inside rows (a treegrid).' },
            aggregate: { type: 'boolean', description: 'Table zones: true when totals or subtotals are part of what the table is read for.' },
            rowDetail: { type: 'boolean', description: 'Table zones: true when a row carries a second layer read in place.' },
            commit: { type: 'string', enum: COMMIT_MODELS, description: 'task=input only: how the input becomes real. explicit (a named button), per-row (each control applies on change), autosave (saves itself after a pause), none (a filter or a search, which commits nothing).' },
            context: { type: 'string', enum: FORM_CONTEXTS, description: 'task=input only: what is behind the form and whether it must stay readable.' },
            familiarity: { type: 'string', enum: FAMILIARITY, description: 'task=input only: whether the user has done this before. Long AND unfamiliar is the one case that earns a wizard.' },
            audience: { type: 'string', description: 'task=input only: expert | public | mixed. A public audience is what sends a long form to one question per page.' },
            form: { type: 'string', enum: FORM_KINDS, description: 'task=input only: the form kind you plan, checked with `components` against the rules.' },
          },
        },
        components: { type: 'array', items: { type: 'string' }, description: 'The components you plan for the zone — checked against the rules.' },
        archetype: { type: 'string', description: 'A screen archetype (list, worklist, detail, hub, …) for use-when / not-when guidance.' },
        lifecycle: {
          type: 'object',
          description: 'What the screen DOES to the resource, for the decisions that are not about looks: how hard a destruction is to confirm, which shape an edit takes, which variant of a detail page. Answered from screen-specs/lifecycle-rules.json.',
          properties: {
            stage: { type: 'string', enum: ['create', 'read', 'update', 'delete'], description: 'create | read | update | delete.' },
            reversible: { type: 'boolean', description: 'delete: can the reader get it back? Reversible destruction earns an undo and NOT a dialog — a confirmation over something reversible is what trains people to click through the one that matters.' },
            blastRadius: { type: 'string', enum: ['one', 'many'], description: 'delete: does it remove one record, or other people\'s work / a container with things inside it?' },
            scope: { type: 'string', enum: ['record', 'collection'], description: 'update: one record, or the same field across many.' },
            fields: { type: 'number', description: 'update: how many values change. One value in place is not a form.' },
            context: { type: 'string', description: 'update: "in-place" when the reader is already looking at the value.' },
            sections: { type: 'number', description: 'detail: how many sections the record has. Past about five, stacking stops being readable and tabs are earned.' },
            acts: { type: 'string', enum: ['here', 'elsewhere'], description: 'detail: where the actions on this record live. Everything elsewhere makes the page a hub.' },
          },
        },
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
