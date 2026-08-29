/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MenuIconButton } from './MenuIconButton'
import { DropdownItem, DropdownDivider } from '../Dropdown'
import { Card } from '../Card'
import { Row } from '../Layout'

/* THE ROW'S OVERFLOW MENU: the actions that belong to ONE thing, folded behind
 * one glyph so the row stays readable. If the actions belong to the screen
 * rather than to a row, they are a <MenuButton> with words on it — a glyph is
 * only affordable where the surrounding row already says what it acts on.
 *
 * `label` IS THE ACCESSIBLE NAME AND THE TOOLTIP IN ONE, and it names WHOSE
 * actions these are. "More actions" repeated down six rows tells a screen
 * reader user nothing about which row they have landed on, which is the one
 * thing they cannot see. Put the subject in it.
 *
 * `variant` follows the surface, and this is the prop that decides whether the
 * control is discoverable. `ghost` is the default and the right answer in a
 * list: quiet until wanted, and it never competes with the row's own content.
 * `filled` is for a control on a busy or coloured surface — a media card, a
 * toolbar over an image — where a transparent glyph simply disappears. `quiet`
 * answers with ink only, for a dense inline toolbar where even a hover fill
 * would flash on every pass of the pointer.
 *
 * `align` follows where the button sits: the default `end` for a control at the
 * right edge of a row, so the menu opens back into the page rather than off it.
 */
export function Example() {
  return (
    <Row gap={4} align="center">
      <Card>
        <Row gap={4} align="center" justify="between">
          <span>March invoice</span>
          <MenuIconButton label="Actions for the March invoice">
            <DropdownItem icon="edit" onClick={() => undefined}>Rename</DropdownItem>
            <DropdownItem icon="content_copy" onClick={() => undefined}>Duplicate</DropdownItem>
            <DropdownDivider />
            <DropdownItem icon="delete" tone="danger" onClick={() => undefined}>Delete</DropdownItem>
          </MenuIconButton>
        </Row>
      </Card>

      {/* On a busy surface a transparent glyph disappears, so it takes a fill. */}
      <MenuIconButton label="Actions for the cover image" variant="filled" size="sm">
        <DropdownItem icon="visibility" onClick={() => undefined}>Preview</DropdownItem>
        <DropdownItem icon="download" onClick={() => undefined}>Download</DropdownItem>
      </MenuIconButton>
    </Row>
  )
}
