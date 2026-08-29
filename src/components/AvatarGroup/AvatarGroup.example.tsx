/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { AvatarGroup } from './AvatarGroup'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'

const TEAM = [
  { name: 'Ada Meridian', src: `${import.meta.env.BASE_URL}demo/avatar-ada.jpg` },
  { name: 'Cleo Nakamura', src: `${import.meta.env.BASE_URL}demo/avatar-cleo.jpg` },
  /* One without a picture on purpose: a real team always has one, and the stack
     has to stay a stack when a face is missing. */
  { name: 'Dev Okonkwo' },
  { name: 'Eve Lindqvist', src: `${import.meta.env.BASE_URL}demo/avatar-eve.jpg` },
  { name: 'Finn Barros', src: `${import.meta.env.BASE_URL}demo/avatar-finn.jpg` },
]

/* WHO, NOT HOW MANY. An overlapping stack says a handful of named people are on
 * this thing, and it is worth the room only while the reader might recognise a
 * face. Once the answer is a number — "142 members" — it is a number, and a
 * stack of five strangers plus "+137" is a count wearing a costume.
 *
 * `max` is where the faces stop and the count starts, and past about five they
 * stop being recognisable anyway. Everything over it collapses into one "+N"
 * disc that still announces the hidden people, so nobody is silently dropped.
 *
 * `size` follows the ROLE of the group on the screen, the same rule <Identity>
 * keeps: `sm` inside a row or a card's meta line, `lg` when the team is what
 * the block is about. There is no middle position — an `lg` stack in a list row
 * reads as that row mattering more than the ones around it.
 */
export function Example() {
  return (
    <Row gap={8} align="start">
      <Card>
        <Stack gap={2}>
          <SectionLabel as="h3">On this project</SectionLabel>
          <AvatarGroup size="lg" max={3} items={TEAM} />
        </Stack>
      </Card>

      {/* In a row, where the faces are one fact among several. */}
      <Card>
        <Row gap={3} align="center">
          <span>Q3 delivery review</span>
          <AvatarGroup size="sm" max={3} items={TEAM} />
        </Row>
      </Card>
    </Row>
  )
}
