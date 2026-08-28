/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { DateBlock } from './DateBlock'

/* Beside the title of an event, never under it: a list of sessions is scanned
 * by date, so the date is the thing the eye lands on. */
export function Example() {
  return <DateBlock value="2026-09-30T09:00:00Z" />
}
