/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MenuButton } from './MenuButton'
import { DropdownItem, DropdownDivider } from '../Dropdown'
import { Row } from '../Layout'

/* `onClick` OR NOT IS THE WHOLE DECISION, and it is a question about the
 * options rather than about the button.
 *
 * WITHOUT it the whole button opens the menu: right when the options are peers
 * and none of them is the usual answer. "Create" is not an action, it is a
 * question about what to create.
 *
 * WITH it the common action gets its own half, so it costs one press and the
 * alternatives are still one press away. Promote something only when it really
 * is what people pick — a promoted half that is usually wrong makes the common
 * case two presses and looks like a misfire.
 *
 * `menuLabel` names the chevron half, which is otherwise a control with no
 * words in it. It only exists in the split form, and it is not optional there.
 *
 * `variant` follows the same rule as any button: `primary` for the one action
 * the screen is for, `secondary` for a real action that is not that one,
 * `ghost` where a filled pill would shout — a toolbar, a card header, a row.
 *
 * `align` is which edge the menu lines up with, and it follows where the button
 * SITS, not taste. The default `end` is right for a button on the right of its
 * container, which is where actions usually are; `start` when the button is on
 * the left, so the menu opens into the page instead of off its edge.
 */
export function Example() {
  return (
    <Row gap={3}>
      <MenuButton label="Create" align="start">
        <DropdownItem icon="description" onClick={() => undefined}>Blank document</DropdownItem>
        <DropdownItem icon="content_copy" onClick={() => undefined}>From a template</DropdownItem>
        <DropdownDivider />
        <DropdownItem icon="upload" onClick={() => undefined}>Upload a file</DropdownItem>
      </MenuButton>

      <MenuButton label="Save" menuLabel="Other ways to save" onClick={() => undefined}>
        <DropdownItem icon="content_copy" onClick={() => undefined}>Save a copy</DropdownItem>
        <DropdownItem icon="description" onClick={() => undefined}>Save as template</DropdownItem>
      </MenuButton>

      {/* In a toolbar or a card header, where a filled pill would shout. */}
      <MenuButton label="Export" variant="ghost" size="sm">
        <DropdownItem icon="table" onClick={() => undefined}>Export as CSV</DropdownItem>
        <DropdownItem icon="description" onClick={() => undefined}>Export as PDF</DropdownItem>
      </MenuButton>
    </Row>
  )
}
