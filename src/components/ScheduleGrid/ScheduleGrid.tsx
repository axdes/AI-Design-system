import './ScheduleGrid.css'
import { useId, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Table, TableScroll, THead, TBody, Tr, Th, Td } from '../Table'

export type ScheduleResource = { key: string; label: ReactNode }
export type ScheduleSlot = { key: string; label: ReactNode }

export type ScheduleEvent = {
  id: string
  /** Which resource's row it belongs to. */
  resource: string
  /** The first slot it occupies, and the last one. A booking is a RANGE: two
   *  hours is one block across two slots, not the same badge printed twice. */
  from: string
  to: string
  label: ReactNode
  /** What kind of booking it is. `neutral` is the default; the status tones are
   *  for a schedule that carries one (held, cancelled, over-running). */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
}

type Props = {
  label: string
  captionHidden?: boolean
  /** The rows: rooms, people, machines. What is being booked. */
  resources: readonly ScheduleResource[]
  /** The columns: evenly spaced units of time, in order. */
  slots: readonly ScheduleSlot[]
  /** What is booked. Overlapping bookings on one resource stack into lanes, the
   *  way every scheduler does it, rather than covering each other. */
  events: readonly ScheduleEvent[]
  /** The slot that is happening now. Marks the column, so "where are we" is not
   *  a thing the reader has to work out from the clock. */
  now?: string
  /** The word for a slot with nothing in it. Read by assistive technology: an
   *  empty cell is silence, and silence is not the same as free. */
  freeLabel?: string
  resourceHeader?: ReactNode
  className?: string
}

/* Lanes: the greedy interval partition every scheduler uses. An event joins the
 * first lane whose last booking has already ended; if none has, it opens a new
 * one. Two bookings at the same hour therefore SHOW as two rows of that room,
 * instead of one covering the other. */
function laneOf(events: { from: number; to: number }[]) {
  const lanes: { from: number; to: number }[][] = []
  for (const e of [...events].sort((a, b) => a.from - b.from)) {
    const lane = lanes.find((l) => (l[l.length - 1]?.to ?? -1) < e.from)
    if (lane) lane.push(e)
    else lanes.push([e])
  }
  return lanes
}

/**
 * A resource against time: rooms by hour, people by day, machines by week.
 * Resources are the rows and time runs along the columns, which is the shape
 * that makes a GAP visible — and a gap is what a schedule is read for.
 *
 * A booking spans the slots it actually occupies (one block, `colSpan`), and a
 * merged cell names its headers so a screen reader can still say which room and
 * which hours it is. `Calendar` picks a date; this shows what is in the dates.
 *
 * Copy: an entry says what is happening and for whom, in that order — the time
 * is already the grid's.
 */
export function ScheduleGrid({
  label, captionHidden, resources, slots, events, now, freeLabel = 'Free', resourceHeader, className,
}: Props) {
  const id = useId()
  const slotId = (i: number) => `${id}-slot-${i}`
  const rowId = (key: string) => `${id}-row-${key}`
  const index = new Map(slots.map((s, i) => [s.key, i]))
  const nowIndex = now === undefined ? -1 : index.get(now) ?? -1

  return (
    <TableScroll label={label}>
      {/* The resource column freezes: a schedule scrolled sideways with the
        * names gone is a grid of bookings belonging to nobody. */}
      <Table caption={label} captionHidden={captionHidden} stickyColumn layout="fixed" className={cn('schedule-grid', className)}>
        <THead>
          <Tr>
            <Th scope="col" width="10rem" id={rowId('head')}>{resourceHeader}</Th>
            {slots.map((s, i) => (
              <Th key={s.key} scope="col" id={slotId(i)} align="center" data-now={i === nowIndex || undefined}>
                {s.label}
              </Th>
            ))}
          </Tr>
        </THead>
        <TBody>
          {resources.map((resource) => {
            const mine = events
              .filter((e) => e.resource === resource.key)
              .map((e) => ({ ...e, from: index.get(e.from) ?? 0, to: index.get(e.to) ?? index.get(e.from) ?? 0 }))
            const lanes = mine.length ? laneOf(mine) : [[]]

            return lanes.map((lane, laneNo) => {
              const cells: ReactNode[] = []
              let cursor = 0
              for (const e of lane as (typeof mine)) {
                for (; cursor < e.from; cursor++) {
                  cells.push(
                    <Td key={`free-${cursor}`} className="schedule-cell" data-free data-now={cursor === nowIndex || undefined} headers={`${rowId(resource.key)} ${slotId(cursor)}`}>
                      <span className="sr-only">{freeLabel}</span>
                    </Td>,
                  )
                }
                const span = e.to - e.from + 1
                /* `headers` rather than scope: a cell that spans columns cannot
                 * be resolved from scope alone, and this is the one shape where
                 * that matters (ADG, MDN on complex tables). */
                const spanned = Array.from({ length: span }, (_, k) => slotId(e.from + k)).join(' ')
                cells.push(
                  <Td
                    key={e.id}
                    className="schedule-event"
                    colSpan={span}
                    data-tone={e.tone}
                    data-now={nowIndex >= e.from && nowIndex <= e.to || undefined}
                    headers={`${rowId(resource.key)} ${spanned}`}
                  >
                    <span className="schedule-event-body">{e.label}</span>
                  </Td>,
                )
                cursor = e.to + 1
              }
              for (; cursor < slots.length; cursor++) {
                cells.push(
                  <Td key={`free-${cursor}`} className="schedule-cell" data-free data-now={cursor === nowIndex || undefined} headers={`${rowId(resource.key)} ${slotId(cursor)}`}>
                    <span className="sr-only">{freeLabel}</span>
                  </Td>,
                )
              }

              return (
                <Tr key={`${resource.key}-${laneNo}`}>
                  {/* One header for the resource, however many lanes it needs. */}
                  {laneNo === 0 && (
                    <Th scope="row" id={rowId(resource.key)} emphasis rowSpan={lanes.length}>{resource.label}</Th>
                  )}
                  {cells}
                </Tr>
              )
            })
          })}
        </TBody>
      </Table>
    </TableScroll>
  )
}
