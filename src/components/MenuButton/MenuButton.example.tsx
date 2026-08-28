/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { MenuButton } from './MenuButton'
import { DropdownItem, DropdownDivider } from '../Dropdown'
import { Row } from '../Layout'

/* Both forms, side by side, because the choice between them is the whole
 * decision this component asks the caller to make.
 *
 * Left: nothing is promoted, so the whole button opens the menu — the right
 * shape when the options are peers and none of them is the usual answer.
 * Right: `onClick` lifts the common action onto its own half, so saving costs
 * one press and the alternatives are still one press away. `menuLabel` names
 * the chevron half, which is otherwise a control with no words in it. */
export function Example() {
  return (
    <Row gap={3}>
      <MenuButton label="Create">
        <DropdownItem icon="description" onClick={() => undefined}>Blank document</DropdownItem>
        <DropdownItem icon="content_copy" onClick={() => undefined}>From a template</DropdownItem>
        <DropdownDivider />
        <DropdownItem icon="upload" onClick={() => undefined}>Upload a file</DropdownItem>
      </MenuButton>

      <MenuButton label="Save" menuLabel="Other ways to save" onClick={() => undefined}>
        <DropdownItem icon="content_copy" onClick={() => undefined}>Save a copy</DropdownItem>
        <DropdownItem icon="description" onClick={() => undefined}>Save as template</DropdownItem>
      </MenuButton>
    </Row>
  )
}
