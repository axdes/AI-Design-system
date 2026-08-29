/* Golden example. The producer sends SHAPES, never HTML — the fixture below is
 * exactly what a chat server or an AI answer hands over. */
import { RichMessage, type RichBlock } from './RichMessage'

const BLOCKS: RichBlock[] = [
  { t: 'h', text: 'Quarterly numbers' },
  { t: 'p', text: 'The **headline**: usage doubled, and `beta` holds.' },
  { t: 'li', items: ['Usage *2.1x* over Q2', 'Churn flat'] },
  { t: 'table', head: true, rows: [['Metric', 'Q3'], ['Sessions', '48k']] },
  { t: 'quote', text: 'Ship the report as written.' },
]

/* SHAPES, NOT HTML, AND THAT IS THE POINT. A producer says "this is a heading,
 * this is a list, this is a table" and the design system decides what those
 * look like. The moment a producer can send markup it is deciding the type
 * scale, the spacing and the colours from the other side of a network call, and
 * a model that hallucinates a `<style>` tag is a model that repaints the app.
 *
 * Inline marks are the small, closed set a writer actually reaches for —
 * emphasis, strong, code. Everything else is a BLOCK, because a block is a
 * decision the system is allowed to make and a tag is not.
 *
 * `text` IS NOT OPTIONAL IN PRACTICE. It is the flat version of the same
 * message, and it is what survives when a producer only has plain words, what
 * a copy button copies, and what gets read aloud. Blocks with no `text` behind
 * them render beautifully and cannot be quoted anywhere else.
 */
export function Example() {
  return <RichMessage blocks={BLOCKS} text="Quarterly numbers: usage doubled, beta holds." />
}
