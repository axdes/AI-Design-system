/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Thumbnail } from './Thumbnail'
import { Card } from '../Card'
import { Row, Stack } from '../Layout'
import { SectionLabel } from '../SectionLabel'
import { Table, TableScroll, TBody, Td, Th, THead, Tr } from '../Table'

const ROWS = [
  { id: 'Quarterly report', kind: 'PDF', icon: 'description' as const },
  { id: 'Site walkthrough', kind: 'Video', icon: 'movie' as const },
]

/* THE BOX IS ALWAYS THE SAME SIZE, WITH OR WITHOUT A PICTURE. That is the whole
 * job: `src` is optional, and with none the fallback icon fills the same box,
 * so a row without a preview does not collapse and a grid does not go ragged.
 * An `<img>` with a missing file does the opposite of this.
 *
 * `ratio` FOLLOWS WHAT IS INSIDE, not the space available. `1/1` is for a thing
 * whose shape is unknown — a file, an attachment, an avatar-like preview — and
 * a square crops every picture the same amount. `16/9` is for something that
 * genuinely IS wide: a video still, a screenshot, a cover. A square crop of a
 * video frame cuts the two ends off every one of them.
 *
 * `size` follows the row: `sm` in a table, where the column is as wide as the
 * box and no wider, and `md` in a card where the preview is doing real work.
 *
 * `alt` is empty when the row already names the thing — the picture then adds
 * nothing a screen reader needs, and repeating the title is noise.
 */
export function Example() {
  return (
    <Stack gap={6}>
      <TableScroll label="Files">
        <Table caption="Files" captionHidden>
          <THead>
            <Tr>
              {/* The thumbnail column is as wide as the box and no wider. */}
              <Th width="4rem"><span className="sr-only">Preview</span></Th>
              <Th>File</Th>
              <Th>Kind</Th>
            </Tr>
          </THead>
          <TBody>
            {ROWS.map((r) => (
              <Tr key={r.id}>
                {/* No src: the fallback keeps the column one width, which is
                    what stops a row without a picture from collapsing. */}
                <Td><Thumbnail alt="" icon={r.icon} size="sm" /></Td>
                <Th scope="row" emphasis>{r.id}</Th>
                <Td>{r.kind}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </TableScroll>

      {/* A video still is genuinely wide, so a square would crop both ends. */}
      <Card>
        <Stack gap={3}>
          <SectionLabel as="h3">Recording</SectionLabel>
          <Row gap={3} align="center">
            <Thumbnail alt="" icon="movie" ratio="16/9" />
            <span>Site walkthrough, 14 minutes</span>
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}
