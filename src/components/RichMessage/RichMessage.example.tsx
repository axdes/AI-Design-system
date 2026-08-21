/* Golden example. The producer sends SHAPES, never HTML — the fixture below is
 * exactly what a chat server or an AI answer hands over, and the fallback
 * `text` keeps the words when a producer only has the flat form. */
import { RichMessage, type RichBlock } from './RichMessage'

const BLOCKS: RichBlock[] = [
  { t: 'h', text: 'Quarterly numbers' },
  { t: 'p', text: 'The **headline**: usage doubled, and `beta` holds.' },
  { t: 'li', items: ['Usage *2.1x* over Q2', 'Churn flat'] },
  { t: 'table', head: true, rows: [['Metric', 'Q3'], ['Sessions', '48k']] },
  { t: 'quote', text: 'Ship the report as written.' },
]

export function Example() {
  return <RichMessage blocks={BLOCKS} text="Quarterly numbers: usage doubled, beta holds." />
}
