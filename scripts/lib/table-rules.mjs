/* ── the layer under "table" ───────────────────────────────────────────────
 *
 * selection-rules.json says a zone is a table; this says WHICH table. The
 * four questions are the ones a spec author can answer and a reviewer can
 * approve: what a row IS, what the reader DOES, how many rows there are, and
 * whether a cell interacts. Everything else about a table (density, alignment,
 * where the total goes) is a rule of craft, and lives in docs/RESEARCH-TABLES.md
 * rather than in a decision the gate can compute.
 *
 * Same three consumers as the layers above: the gate, the test that proves it
 * can fail, and the MCP `decide` tool for agents that never run the gate.
 */

export const ROW_UNITS = ['record', 'fact', 'field', 'attribute', 'crossing', 'event', 'change', 'resource']
export const TABLE_AXES = ['rows', 'cross']
export const CELL_MODES = ['static', 'interactive']
export const SELECT_MODES = ['none', 'single', 'batch']
export const NESTING = ['flat', 'grouped', 'hierarchy']

export function makeTableEngine(tableDoc) {
  const kinds = new Map(Object.entries(tableDoc.tableKinds ?? {}))

  function shapeOf(zone) {
    const d = zone.data ?? {}
    return {
      task: zone.task,
      cardinality: d.cardinality,
      fields: d.fields,
      editable: d.editable,
      /* Defaults are the common case, so a plain list table declares its kind
       * and nothing else: rows of records, one axis, flat, nothing picked. */
      rowUnit: d.rowUnit ?? 'record',
      axes: d.axes ?? 'rows',
      cells: d.cells ?? 'static',
      select: d.select ?? 'none',
      nesting: d.nesting ?? 'flat',
      aggregate: d.aggregate ?? false,
      rowDetail: d.rowDetail ?? false,
    }
  }

  function matches(when = {}, shape) {
    if (when.task && !(shape.task && when.task.includes(shape.task))) return false
    if (when.cardinality && !(shape.cardinality && when.cardinality.includes(shape.cardinality))) return false
    if (when.rowUnit && !when.rowUnit.includes(shape.rowUnit)) return false
    if (when.axes && !when.axes.includes(shape.axes)) return false
    if (when.cells && !when.cells.includes(shape.cells)) return false
    if (when.select && !when.select.includes(shape.select)) return false
    if (when.nesting && !when.nesting.includes(shape.nesting)) return false
    if (when.editable !== undefined && Boolean(shape.editable) !== when.editable) return false
    if (when.aggregate !== undefined && Boolean(shape.aggregate) !== when.aggregate) return false
    if (when.rowDetail !== undefined && Boolean(shape.rowDetail) !== when.rowDetail) return false
    if (when.minFields !== undefined && !(typeof shape.fields === 'number' && shape.fields >= when.minFields)) return false
    if (when.maxFields !== undefined && !(typeof shape.fields === 'number' && shape.fields <= when.maxFields)) return false
    return true
  }

  /* The verdict as data, for whoever asks BEFORE writing. */
  function chooseKind(shape = {}) {
    const full = { rowUnit: 'record', axes: 'rows', cells: 'static', select: 'none', nesting: 'flat', aggregate: false, rowDetail: false, ...shape }
    const matched = (tableDoc.rules ?? []).filter((r) => matches(r.when, full))
    const allowed = [...new Set(matched.flatMap((r) => r.choose))]
    const forbidden = (tableDoc.hard ?? [])
      .filter((h) => matches(h.when, full))
      .map((h) => ({ id: h.id, forbid: h.forbid, instead: h.instead, because: h.because }))
    const permitted = allowed.filter((id) => !forbidden.some((h) => h.forbid.includes(id)))
    /* A hard rule that forbids everything still has to say what to use: the
     * `instead` of the first one that fired is the answer, not an empty list. */
    const fallback = forbidden.find((h) => h.instead)?.instead
    if (!permitted.length && fallback) permitted.push(fallback)
    return { matched, allowed, permitted, forbidden, kinds: permitted.map((id) => kinds.get(id)).filter(Boolean) }
  }

  function describeShape(shape) {
    const parts = [shape.task ?? 'no task', `rows are ${shape.rowUnit}`]
    if (shape.cardinality) parts.push(shape.cardinality)
    if (typeof shape.fields === 'number') parts.push(`${shape.fields} fields`)
    if (shape.axes === 'cross') parts.push('two axes')
    if (shape.nesting !== 'flat') parts.push(shape.nesting)
    if (shape.select !== 'none') parts.push(`select=${shape.select}`)
    if (shape.editable) parts.push('editable')
    if (shape.aggregate) parts.push('aggregated')
    if (shape.rowDetail) parts.push('row detail')
    if (shape.cells === 'interactive') parts.push('interactive cells')
    return parts.join(', ')
  }

  /* A zone whose representation is a table or a grid, whatever its author
   * called it: the components are the evidence the declaration is about. */
  /* Descriptions is here because the key-value table IS a kind of table: one
   * record's fields, read top to bottom. Leaving it out would let the one shape
   * the layer is most often asked for slip past undeclared. */
  const TABLE_COMPONENTS = new Set(['Table', 'DataGrid', 'TreeTable', 'PivotTable', 'ComparisonTable', 'ScheduleGrid', 'DiffTable', 'Descriptions'])
  function detect(zone) {
    return (zone.components ?? []).some((c) => TABLE_COMPONENTS.has(String(c).split(' ')[0]))
  }

  function checkTableZone(zone, rep) {
    const problems = []
    const notes = []
    let unchecked = false
    const at = (msg) => `zone "${zone.name}": ${msg}`
    const declared = zone.table
    const shape = shapeOf(zone)
    const isTable = rep === 'table' || rep === 'grid' || detect(zone)

    if (declared && !kinds.has(declared)) {
      problems.push(at(`table kind "${declared}" does not exist — use ${[...kinds.keys()].join(' | ')}`))
      return { problems, notes, unchecked }
    }
    const enums = [
      ['rowUnit', ROW_UNITS], ['axes', TABLE_AXES], ['cells', CELL_MODES],
      ['select', SELECT_MODES], ['nesting', NESTING],
    ]
    for (const [key, allowed] of enums) {
      const value = zone.data?.[key]
      if (value !== undefined && !allowed.includes(value)) problems.push(at(`data.${key} "${value}" — use ${allowed.join(' | ')}`))
    }
    if (problems.length) return { problems, notes, unchecked }

    if (declared && !isTable) {
      problems.push(at(`declares table kind "${declared}" while it shows no table — a table kind belongs to a zone built from ${[...TABLE_COMPONENTS].join(', ')}`))
      return { problems, notes, unchecked }
    }
    if (!isTable) return { problems, notes, unchecked }

    if (!declared) {
      /* A zone with no task at all is the other layers' business too: it gets
       * counted rather than failed, the same way an unlabelled collection is. */
      if (!zone.task) { unchecked = true; return { problems, notes, unchecked } }
      const { permitted } = chooseKind(shape)
      problems.push(at(`a table zone must name its kind (table) — ${permitted.length ? `for this shape the rules choose ${permitted.join(' | ')}` : 'see screen-specs/table-rules.json'}`))
      return { problems, notes, unchecked }
    }

    const kind = kinds.get(declared)
    if (kind.status === 'planned') {
      problems.push(at(`table kind "${declared}" is planned, not built${kind.waitingFor ? ` (waiting for: ${kind.waitingFor})` : ''} — agree the parts first (requests/), then the screen`))
    }
    if (kind.rowUnit?.length && !kind.rowUnit.includes(shape.rowUnit)) {
      problems.push(at(`"${declared}" is a table whose row is ${kind.rowUnit.join(' or ')}; this zone says its row is ${shape.rowUnit} — ${kind.means}`))
    }

    const { matched, permitted, forbidden } = chooseKind(shape)
    for (const h of forbidden) {
      if (h.forbid.includes(declared)) problems.push(at(`"${declared}" is ruled out here — ${h.because} Use "${h.instead}".`))
    }
    if (matched.length && !permitted.includes(declared)) {
      const cite = matched[0]
      problems.push(
        at(`this shape (${describeShape(shape)}) — "${declared}" is not what any matching rule chooses (${matched.map((r) => r.id).join(', ')} choose ${permitted.join(' | ') || 'nothing left'}). ${cite.id}: ${cite.because}`),
      )
    }
    if (!matched.length) {
      notes.push(at('no table rule matches this shape — either the declaration is off, or table-rules.json is missing a rule and should gain one'))
    }

    const named = new Set((zone.components ?? []).map((c) => String(c).split(' ')[0]))
    const comps = kind.components ?? {}
    const missing = (comps.required ?? []).filter((c) => !named.has(c))
    if (missing.length) {
      problems.push(at(`table kind "${declared}" is built from ${comps.required.join(' + ')}; the zone never names ${missing.join(', ')}`))
    }
    if (comps.expect?.length && !comps.expect.some((c) => named.has(c))) {
      notes.push(at(`a "${declared}" table has ${comps.expect.join(' / ')} for exactly this — hand-rolling it is how the same shape gets built twice`))
    }
    for (const n of tableDoc.notes ?? []) {
      if (n.if !== 'any' && n.if !== declared) continue
      if (!matches(n.when ?? {}, shape)) continue
      if ((n.unless ?? []).some((c) => named.has(c))) continue
      notes.push(at(n.say))
    }
    return { problems, notes, unchecked }
  }

  return {
    chooseKind,
    checkTableZone,
    detect,
    kindIds: [...kinds.keys()],
    kind: (id) => kinds.get(id),
    kindComponents: [...TABLE_COMPONENTS],
    doc: tableDoc,
  }
}

/* ── the layer under the table: what a COLUMN is made of ───────────────────
 *
 * table-rules.json says which table; this says what its columns are. A column
 * carries one kind of value for every row, and the kind decides the four things
 * that used to be argued per screen: alignment, whether the width is fixed,
 * whether it may sort, and what it owes. Data in screen-specs/cell-rules.json;
 * the survey behind it is docs/RESEARCH-TABLE-CONTENT.md.
 */

export function makeCellEngine(cellDoc) {
  const kinds = new Map(Object.entries(cellDoc.cellKinds ?? {}))

  /* The verdict as data, for whoever asks BEFORE writing. */
  function describe(id) {
    return kinds.get(id)
  }

  function checkColumns(zone) {
    const problems = []
    const notes = []
    const columns = zone.columns ?? []
    if (!columns.length) return { problems, notes, unchecked: false }
    const at = (msg) => `zone "${zone.name}": ${msg}`

    const ids = columns.map((c) => c.cell)
    for (const [i, col] of columns.entries()) {
      const kind = kinds.get(col.cell)
      if (!kind) {
        problems.push(at(`column "${col.name}" carries "${col.cell}", which is not a cell kind — use ${[...kinds.keys()].join(' | ')}`))
        continue
      }
      /* Alignment, width and sortability are the kind's, not the column's:
       * declaring them per column is how two money columns end up aligned
       * differently on one screen. What a column MAY say is that it sorts. */
      if (col.align && col.align !== kind.align) {
        problems.push(at(`column "${col.name}" carries ${col.cell}, which aligns ${kind.align} — ${kind.owes[0] ?? kind.means}`))
      }
      if (col.sortable && !kind.sortable) {
        problems.push(at(`column "${col.name}" carries ${col.cell} and cannot be sorted: a sortable header promises an order this column has none of`))
      }
      for (const c of kind.components?.required ?? []) {
        if (!(zone.components ?? []).some((x) => String(x).split(' ')[0] === c)) {
          problems.push(at(`column "${col.name}" carries ${col.cell}, which is built from <${c}>; the zone never names it`))
        }
      }
      const expect = kind.components?.expect ?? []
      if (expect.length && !expect.some((c) => (zone.components ?? []).some((x) => String(x).split(' ')[0] === c))) {
        notes.push(at(`a ${col.cell} column has ${expect.join(' / ')} for exactly this — hand-rolling it is how the same cell gets built twice`))
      }
      /* Position rules read the whole list, so they live out here. */
      if (col.cell === 'identifier' && i !== ids.indexOf('select') + 1 && i !== 0) {
        problems.push(at(`the identifier column ("${col.name}") is column ${i + 1}: it is the first column of a table, after the checkbox when there is one (C1)`))
      }
      if (col.cell === 'actions' && i !== columns.length - 1) {
        problems.push(at(`the actions column ("${col.name}") is not last (C3): the row is read from its name to what can be done about it`))
      }
      if (col.cell === 'select' && i !== 0) {
        problems.push(at(`the checkbox column ("${col.name}") is not first (C3)`))
      }
    }

    if (!ids.includes('identifier')) {
      problems.push(at('no column carries the identifier (C1): a table whose first column is not the record\'s own name is a grid of values belonging to nobody'))
    }
    if (ids.filter((id) => id === 'identifier').length > 1) {
      problems.push(at('two identifier columns (C1): a record has one name'))
    }
    const stacked = columns.filter((c) => c.stacked)
    if (stacked.length > 1) {
      problems.push(at(`${stacked.length} columns carry two lines (C5): one column may stack a value over its secondary line, or the row stops being a row`))
    }
    for (const c of stacked) {
      const kind = kinds.get(c.cell)
      if (kind && !['identifier', 'identity'].includes(c.cell)) {
        notes.push(at(`"${c.name}" stacks two lines on a ${c.cell} column — the two-line cell is for the identifier and the person (C5)`))
      }
    }
    for (const n of cellDoc.notes ?? []) {
      if (n.when?.minColumns !== undefined && columns.length < n.when.minColumns) continue
      if (n.if !== 'any' && !ids.includes(n.if)) continue
      notes.push(at(n.say))
    }
    return { problems, notes, unchecked: false }
  }

  return { checkColumns, describe, cellIds: [...kinds.keys()], doc: cellDoc }
}
