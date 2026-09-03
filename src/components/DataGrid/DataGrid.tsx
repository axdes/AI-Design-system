import './DataGrid.css'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type UIEvent } from 'react'
import { cn } from '../../lib/cn'
import { Icon } from '../Icon'
import { Input } from '../Input'
import { Select } from '../Select'
import { Spinner } from '../Spinner'

export type DataGridColumn<Row> = {
  key: string
  header: ReactNode
  /** Cell renderer. */
  cell: (row: Row) => ReactNode
  /** Column width (any CSS length). Default 1fr. */
  width?: string
  /** Let this column's text run onto a second line instead of ending in an ellipsis half a word
   *  in. For a column of sentences — what a team is building, a note, a title — one line at 11rem
   *  is a value the grid is hiding. The row height is FIXED (the windowing needs it), so the text
   *  is clamped rather than allowed to grow: raise `rowHeight` to give it the second line. */
  wrap?: boolean
  align?: 'start' | 'end' | 'center'
  /** The header becomes a sort control. The grid does not sort: it reports the
   *  column and the sort direction, and the caller owns the order. */
  sortable?: boolean
  /** This column's cells take a value, and ONE CLICK opens the editor — plus
   *  Enter, F2, or simply typing. It was "deliberately, never on a stray
   *  click", which sounded careful and meant that a click did nothing visible:
   *  the reader clicked again, and again, and met the editor on the third press
   *  (owner, 23.08 and again 26.08 — the same report twice, which is how a
   *  design decision is told it was wrong). With `options` there is nothing to
   *  enter, because the cell IS the control. */
  editable?: boolean
  /** A closed list of what this cell may hold. Given, the cell renders a select
   *  and one click opens it — no editor state, no way in to discover. It is a
   *  list and not a text box because that is the difference between a value a
   *  counter downstream can read and one somebody spelled their own way. A
   *  stored value the list does not offer is shown, never offered. */
  options?: readonly string[]
  /** The value the editor opens with. Required for an editable column: the
   *  rendered cell may be formatted, and an editor must show what is stored. */
  value?: (row: Row) => string
}

export type DataGridSort = { key: string; sortDirection: 'asc' | 'desc' }

/** Long enough to be read, short enough that the grid is not a field of ticks a minute later. */
const SAVED_FOR_MS = 2500

/** Is this width already a `minmax()` track, carrying its own floor? */
const isMinmax = (w?: string) => !!w && /^minmax\(/i.test(w.trim())

/* The lower bound of a `minmax(a, b)`: `a`, however many brackets it contains.
   Split at the first comma at depth zero rather than the first comma, because
   `minmax(calc(8rem + 2ch), 1fr)` is a legal width and cutting it at the wrong
   comma yields a length that is not one. */
function lowerBound(width: string) {
  const w = width.trim()
  const inner = w.slice(w.indexOf('(') + 1, w.lastIndexOf(')'))
  let depth = 0
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (ch === '(') depth++
    else if (ch === ')') depth--
    else if (ch === ',' && depth === 0) return inner.slice(0, i).trim()
  }
  return inner.trim()
}

/* WHAT IS STORED, WHEN IT IS NOT ONE OF THE OFFERED ANSWERS. A choice control
   handed a value it has no option for shows nothing, so the cell would quietly
   report a value the row does not hold. It is carried at the head of the list,
   so the cell always says what it actually holds. */
function choiceOptions(options: readonly string[], value: string) {
  const known = options.map((o) => ({ value: o, label: o || '—' }))
  return options.includes(value) ? known : [{ value, label: value }, ...known]
}

/** What became of one cell, at the end of that cell. Nothing at all when nothing has happened. */
function cellMark(at?: { state: 'saving' | 'saved' | 'failed'; error?: string }) {
  if (!at) return null
  if (at.state === 'saving') return <Spinner size="sm" className="dg-cell-mark" label="Saving" />
  /* The span carries the state, not the Icon. That used to be forced — <Icon> took a name and a
   * size and passed nothing else through, so a `data-` attribute written on it never reached the
   * DOM (fixed 2026-08-29, after the same silence cost <Rating> its stars). It stays on the span
   * because the state belongs to the CELL: the glyph is what the state chose, not what carries it. */
  if (at.state === 'saved') return <span className="dg-cell-mark" data-state="saved"><Icon name="check" /></span>
  /* The words go on `title` and to a screen reader: a cell is one line of a grid and has no room
   * for a sentence, and the caller shows the same message above the grid where there is. */
  return (
    <span className="dg-cell-mark" data-state="failed" title={at.error} role="alert" aria-label={at.error}>
      <Icon name="error" />
    </span>
  )
}

type Props<Row> = {
  columns: readonly DataGridColumn<Row>[]
  rows: readonly Row[]
  rowKey: (row: Row) => string
  /** Fixed row height in px — required for windowing. Default 40. */
  rowHeight?: number
  /** Visible viewport height in px. Default 400. */
  /* `viewportHeight`, because the grid already publishes `rowHeight` beside it
   * and `height` elsewhere in this system is a CSS length. Two numbers in
   * pixels under one word, one of them named, is how a caller sets the wrong
   * one. (2026-09-03) */
  viewportHeight?: number
  /** Extra rows rendered above/below the viewport to smooth scrolling. Default 6. */
  overscan?: number
  /** Accessible name for the grid. */
  label: string
  /** The current sort, for the column that carries it. */
  sort?: DataGridSort
  /** Asked for when a sortable header is activated. */
  onSortChange?: (sort: DataGridSort) => void
  /**
   * Called when an editable cell is committed.
   *
   * Return a promise and the grid says what happened to that cell: writing, written, or the words
   * the caller resolves with. A cell that goes somewhere real — a shared sheet, an API — is a cell
   * whose value on screen is a claim until something confirms it, and a grid that stays silent
   * leaves the reader to guess which of fifty rows landed. Resolve with `null` for "it went", or
   * with the message to show against that cell.
   */
  onCellChange?: (row: Row, key: string, value: string) => void | Promise<string | null>
  /** What the grid shows instead of rows: an <EmptyState>, with the action that
   *  would fill it. A grid that renders nothing reads as broken. */
  empty?: ReactNode
  className?: string
}

/* A virtualized table: only the rows in view (plus a small overscan) are in the
 * DOM, so tens of thousands of rows scroll smoothly. Rows are a fixed height (the
 * windowing needs it); a spacer sizes the scroll area to the full list. For a
 * short, static table use <Table>; reach for this when the row count is large.
 *
 * It is a GRID, and the ARIA pattern is a contract rather than a name: one tab
 * stop for the whole thing, arrow keys between cells, Home and End along the
 * row, Ctrl+Home and Ctrl+End to the corners. A grid role with no keyboard is
 * worse than a plain table, because it promises a model that is not there. 
   *
   * Copy: the accessible name says WHICH collection this is — "Invoices due", not
   * "Data grid". Column headers are the field's own name, short enough to
   * sit above its values.
   */
export function DataGrid<Row>({
  columns, rows, rowKey, rowHeight = 40, viewportHeight: height = 400, overscan = 6, label,
  sort, onSortChange, onCellChange, empty, className,
}: Props<Row>) {
  const [scrollTop, setScrollTop] = useState(0)
  /* The roving tab stop: which cell holds it. Never null, so the grid is always
   * enterable, and the first cell is where a keyboard lands. */
  const [active, setActive] = useState({ r: 0, c: 0 })
  const [editing, setEditing] = useState<{ r: number; c: number; value: string } | null>(null)
  /* What became of the cells that were committed, keyed by row and column. Only the ones in flight
   * or just settled are in here — a grid of ten thousand rows must not accumulate a map of them. */
  const [saved, setSaved] = useState<Record<string, { state: 'saving' | 'saved' | 'failed'; error?: string }>>({})
  const [moved, setMoved] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  /* One place that both commits and reports, so the two cell editors cannot disagree about what a
   * caller's answer means. A caller that returns nothing is a caller that does not want to be
   * reported on: nothing is shown, which is what every grid did before this existed. */
  const commitCell = (row: Row, key: string, value: string) => {
    const answer = onCellChange?.(row, key, value)
    if (!answer || typeof (answer as Promise<string | null>).then !== 'function') return
    const at = `${rowKey(row)}:${key}`
    setSaved((s) => ({ ...s, [at]: { state: 'saving' } }))
    void (answer as Promise<string | null>).then((error) => {
      if (error) { setSaved((s) => ({ ...s, [at]: { state: 'failed', error } })); return }
      setSaved((s) => ({ ...s, [at]: { state: 'saved' } }))
      /* A tick is a flash, not a state to sit in: a column of them a minute later says nothing. */
      setTimeout(() => setSaved((s) => { const next = { ...s }; delete next[at]; return next }), SAVED_FOR_MS)
    })
  }

  const total = rows.length
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2
  const endIndex = Math.min(total, startIndex + visibleCount)
  const slice = rows.slice(startIndex, endIndex)

  /* A COLUMN WITH NO WIDTH TAKES A FLOOR, AND THE SHEET SCROLLS SIDEWAYS RATHER
     THAN COMPRESSING. `1fr` alone lets a track shrink to nothing, and on a phone
     it did: five columns squeezed into 390px turned "NAME" into "NAM", every
     value into "Cust" and "SAR 3,663" into "63" (owner, 2026-08-30). A sheet the
     reader scrolls sideways is readable; a sheet compressed to fit is not,
     whatever it fits into — which is what <Table> has always done through
     <TableScroll>.

     `--dg-min-width` is the same set of floors added up, and BOTH the header and
     the body take it, so the two are one width and the frame scrolls them
     together. Without that the body scrolls alone — `overflow-y: auto` makes the
     other axis `auto` too — and the header stays put while the columns walk out
     from under it, which is exactly what the first attempt at this did. */
  const AUTO_MIN = '8rem'
  /* A WIDTH IN `fr` IS NOT A WIDTH. It is a share of what is left, so it says
     nothing about how narrow the column may get and it cannot be added up: the
     first version of this summed the declared widths straight into a `calc`,
     which with `1.5fr` in it is not a length, so the whole declaration was
     dropped and the floor never arrived. A track declared in fractions gets the
     same floor as one declared with nothing. */
  /* A COLUMN THAT ALREADY DECLARES ITS OWN `minmax()` IS LEFT ALONE. It contains
     `fr`, so the test above claims it — and wrapping it gives
     `minmax(8rem, minmax(11rem, 1fr))`, which is not a track: nested `minmax()`
     is invalid, so the browser drops the WHOLE `grid-template-columns`
     declaration and the grid falls back to one column. Every header stacks and
     the rows land on top of each other, which is what a coordinator saw on a
     six-column sheet whose SOLUTION column was declared that way (owner,
     2026-08-31). A width that says its own floor needs nothing from us. */
  const share = (w?: string) => !w || (w.includes('fr') && !isMinmax(w))
  const template = columns.map((c) => (share(c.width) ? `minmax(${AUTO_MIN}, ${c.width ?? '1fr'})` : c.width)).join(' ')
  /* The floor of each track, added up: AUTO_MIN for a share of what is left, the
     lower bound of a `minmax()` that states one, and the width itself when it is
     a plain length. */
  const floorOf = (w?: string) => {
    if (share(w)) return AUTO_MIN
    return isMinmax(w) ? lowerBound(w as string) : (w as string)
  }
  const minWidth = `calc(${columns.map((c) => floorOf(c.width)).join(' + ')})`
  /* Whether this grid edits at all: it decides whether a read-only cell is
   * worth saying so about. */
  const editable = columns.some((c) => c.editable)

  const onScroll = (e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)

  /* Moving the tab stop has to move the WINDOW too: the cell a keyboard user
   * just stepped onto may not be rendered at all, which is the one thing a
   * virtualized grid gets wrong that a plain table cannot. */
  const move = useCallback((r: number, c: number) => {
    const row = Math.max(0, Math.min(total - 1, r))
    const col = Math.max(0, Math.min(columns.length - 1, c))
    setActive({ r: row, c: col })
    setMoved((n) => n + 1)
    /* The window is moved through STATE, not by nudging the DOM and waiting for
     * a scroll event: the event is what renders the row, so a keyboard step to
     * a row outside the window would land on a cell that does not exist yet. */
    const top = row * rowHeight
    let next = scrollTop
    if (top < next) next = top
    else if (top + rowHeight > next + height) next = top + rowHeight - height
    if (next === scrollTop) return
    setScrollTop(next)
    if (bodyRef.current) bodyRef.current.scrollTop = next
  }, [columns.length, height, rowHeight, scrollTop, total])

  /* Focus follows the tab stop, after the row it names has been rendered. The
   * window may have had to scroll first, so this also runs on the scroll that
   * brings the row in. */
  useEffect(() => {
    if (!moved) return
    const el = bodyRef.current?.querySelector<HTMLElement>(`[data-r="${active.r}"][data-c="${active.c}"]`)
    /* A cell that IS a control hands the focus to the control: the tab stop is one
     * per grid either way, and landing on the wrapper instead would leave the
     * keyboard one press short of the value. */
    ;(el?.querySelector<HTMLElement>('.select-trigger') ?? el)?.focus()
  }, [active.r, active.c, moved, startIndex])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (editing) return
    const { r, c } = active
    /* On a choice cell the arrows still walk the GRID rather than the list: a
     * closed <select> changes its value on an arrow press, and here that press
     * is a write to the sheet somebody only meant to scroll past. Alt+Down is
     * left alone — that is the platform's own "open the list". */
    if (e.altKey) return
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(r + 1, c),
      ArrowUp: () => move(r - 1, c),
      ArrowRight: () => move(r, c + 1),
      ArrowLeft: () => move(r, c - 1),
      Home: () => move(e.ctrlKey ? 0 : r, 0),
      End: () => move(e.ctrlKey ? total - 1 : r, columns.length - 1),
      PageDown: () => move(r + Math.floor(height / rowHeight), c),
      PageUp: () => move(r - Math.floor(height / rowHeight), c),
    }
    const run = keys[e.key]
    if (run) {
      e.preventDefault()
      run()
      return
    }
    /* Enter and F2 open an editor only where there is one to open. A choice cell
     * carries its control already; Enter and Space open the browser's list. */
    if (columns[c]?.options && columns[c]?.editable) return
    if (e.key === 'Enter' || e.key === 'F2') { startEdit(r, c); return }
    /* TYPING STARTS EDITING, seeded with what was typed. This is the half of
     * the model that makes a grid feel like a grid: without it the only way in
     * was a double click, which is not discoverable and which the owner found
     * by clicking three times (23.08 — and reported again on 26.08, because
     * typing-to-edit is no more discoverable than double-click when the first
     * click answers with nothing; a click now opens it). Enter and F2 stay, and a modifier
     * combination is a shortcut, not a value. */
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const column = columns[c]
      if (!column?.editable) return
      e.preventDefault()
      startEdit(r, c, e.key)
    }
  }

  const startEdit = (r: number, c: number, seed?: string) => {
    const column = columns[c]
    const row = rows[r]
    if (!column?.editable || column.options || !row) return
    /* Already editing this cell: leave it alone. Re-entering would reset the
       field to the row's stored value and throw away what has been typed —
       which is what happened the moment a click could open the editor, because
       committing with Enter also synthesises a click on the cell underneath
       (caught by this component's own keyboard test, 2026-08-26). */
    if (editing && editing.r === r && editing.c === c) return
    setEditing({ r, c, value: seed ?? column.value?.(row) ?? '' })
  }

  const commit = () => {
    if (!editing) return
    const column = columns[editing.c]
    const row = rows[editing.r]
    if (column && row) commitCell(row, column.key, editing.value)
    setEditing(null)
    move(editing.r, editing.c)
  }

  const sortIcon = (key: string) => {
    if (sort?.key !== key) return 'arrow_downward'
    return sort.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'
  }
  const ariaSort = (key: string) => {
    if (sort?.key !== key) return 'none' as const
    return sort.sortDirection === 'asc' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div
      className={cn('datagrid', className)}
      style={{ '--dg-min-width': minWidth } as CSSProperties}
      role="grid"
      aria-label={label}
      aria-rowcount={total}
      aria-colcount={columns.length}
    >
      <div className="datagrid-header" style={{ gridTemplateColumns: template }} role="row" aria-rowindex={1}>
        {columns.map((col, i) => (
          <span
            key={col.key}
            className="datagrid-cell datagrid-th"
            data-align={col.align}
            role="columnheader"
            aria-colindex={i + 1}
            aria-sort={col.sortable ? ariaSort(col.key) : undefined}
          >
            {col.sortable
              ? (
                <button
                  type="button"
                  className="datagrid-sort"
                  data-active={sort?.key === col.key || undefined}
                  onClick={() => onSortChange?.({
                    key: col.key,
                    sortDirection: sort?.key === col.key && sort.sortDirection === 'asc' ? 'desc' : 'asc',
                  })}
                >
                  {col.header}
                  <Icon name={sortIcon(col.key)} className="datagrid-sort-icon" />
                </button>
              )
              : col.header}
          </span>
        ))}
      </div>
      {total === 0 && empty ? <div className="datagrid-empty">{empty}</div> : null}
      <div className="datagrid-body" ref={bodyRef} style={{ height }} onScroll={onScroll} onKeyDown={onKeyDown}>
        {/* Spacer sizes the scroll range to the full list; the window is offset into it. */}
        <div className="datagrid-spacer" style={{ height: total * rowHeight }}>
          <div className="datagrid-window" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {slice.map((row, i) => {
              const r = startIndex + i
              return (
                <div
                  key={rowKey(row)}
                  className="datagrid-row"
                  role="row"
                  /* +1: the header is row 1, so the first record is row 2. */
                  aria-rowindex={r + 2}
                  style={{ gridTemplateColumns: template, height: rowHeight }}
                >
                  {columns.map((col, c) => (
                    <span
                      key={col.key}
                      className="datagrid-cell"
                      data-align={col.align}
                      data-editable={col.editable || undefined}
                      data-wrap={col.wrap || undefined}
                      /* A cell that IS a control: the control wears the focus and the ring, the
                       * cell wears neither, or the two rings stack into the box the owner saw. */
                      data-choice={(col.options && col.editable) || undefined}
                      data-editing={editing?.r === r && editing.c === c || undefined}
                      data-r={r}
                      data-c={c}
                      /* The ACTIVE cell is marked whatever brought the focus
                       * there. `:focus-visible` does not fire for a mouse, so
                       * after a click the grid looked inert and Enter opened an
                       * editor out of nowhere (owner, 23.08: the editable grid
                       * works strangely, or rather does not). A grid's current
                       * cell is a visible box in every spreadsheet there has
                       * ever been. */
                      data-active={active.r === r && active.c === c || undefined}
                      role="gridcell"
                      aria-colindex={c + 1}
                      /* Says which cells take a value and which do not, for a
                       * reader who cannot see the cursor change (APG grid). */
                      aria-readonly={editable && !col.editable ? true : undefined}
                      /* The roving tab stop: one cell in the whole grid is
                       * tabbable, which is what makes a grid one stop in the
                       * page's tab order instead of ten thousand. */
                      tabIndex={col.options && col.editable ? -1 : (active.r === r && active.c === c ? 0 : -1)}
                      onFocus={() => setActive({ r, c })}
                      /* ONE CLICK OPENS THE EDITOR. It was a double click, and
                         the single click before it did nothing visible — so a
                         reader who clicked a cell the way one clicks a cell got
                         no answer, clicked again, and reached the editor on the
                         third press (owner, 2026-08-26: "editing starts only
                         after the third click"). Measured in a real browser: a
                         clean double click took two presses, click-then-double
                         took three, and a lone click took as many as you liked.
                         A choice column already opens on one click by the
                         owner's earlier ruling; this is the same rule for the
                         other columns. Double click still works — it is the
                         same handler — so nobody's habit breaks. */
                      onClick={() => startEdit(r, c)}
                    >
                      {col.options && col.editable
                        /* A CHOICE COLUMN IS A SELECT, always. Not a value that turns into an
                         * editor when you find the way in: the cell simply is the control it
                         * takes, so one click opens the list and that is the whole interaction
                         * (owner, 26.08: clicked, the list opens, that is all).
                         *
                         * It is the SYSTEM'S <Select>, since 2026-08-29. It was a native
                         * `<select>` before, on the argument that a cell editor must open and
                         * commit without a portal or a second tab stop of its own — and the owner
                         * read the result off the gallery and said what it looks like: the
                         * browser's own control, with the browser's own tick and the browser's
                         * own rounding, inside a sheet built out of this system.
                         *
                         * Both worries turned out to be answerable rather than true. The tab stop
                         * is the same one: `tabIndex` moves with the active cell, exactly as it
                         * did on the native element, and <Select> gained that prop for this. The
                         * portal unmounts with the row it belongs to, because it is a child of
                         * that row in the React tree whatever the DOM does — which is also why
                         * virtualising the row that owns an open menu takes the menu with it. And
                         * a closed <Select> does not change its value on an arrow press, which
                         * removes the hazard the grid's own key handler was written around. */
                        ? (
                          <span className="dg-choice-wrap">
                            <Select
                              className="dg-choice"
                              size="sm"
                              label={`${String(col.header)} for row ${r + 1}`}
                              value={col.value?.(row) ?? ''}
                              /* ONE TAB STOP PER GRID, and it moves with the active
                                 cell. Everything else in the sheet is -1, which is
                                 what makes a thousand rows one stop rather than
                                 thousands. */
                              tabIndex={active.r === r && active.c === c ? 0 : -1}
                              options={choiceOptions(col.options, col.value?.(row) ?? '')}
                              onChange={(next) => commitCell(row, col.key, next)}
                            />
                            {/* Where a cell has just been committed, what became of it.
                              * The trigger draws its own caret, so the mark takes its
                              * place rather than standing beside it — one mark at the
                              * end of the cell, never two fighting for it. */}
                            {cellMark(saved[`${rowKey(row)}:${col.key}`])}
                          </span>
                        )
                        : editing && editing.r === r && editing.c === c
                        ? (
                          <Input
                            autoFocus
                            aria-label={`Edit ${String(col.header)}`}
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onBlur={commit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit()
                              if (e.key === 'Escape') { setEditing(null); move(r, c) }
                            }}
                          />
                        )
                        /* A wrapping column's content is put in a box of its own: the clamp is a
                         * block property and the cell is a flex row, so it has nowhere to apply
                         * otherwise — and a bare string cell has no element to hang it on. */
                        : col.wrap ? <span className="datagrid-clamp">{col.cell(row)}</span>
                        : col.cell(row)}
                      {/* For every other kind of cell the mark sits after the value; the choice
                        * cell has it in the caret's place already. */}
                      {!(col.options && col.editable) && cellMark(saved[`${rowKey(row)}:${col.key}`])}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
