/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../Button'
import { Dropdown, DropdownItem } from '../Dropdown'
import { IconButton } from '../IconButton'
import { Tooltip } from '../Tooltip'
import { ButtonGroup } from './ButtonGroup'

/* The split button: the ordinary action, and the other ways to take it. `label`
 * names the GROUP, because "Save" next to a bare caret does not say what the
 * caret opens. `size="md"` on the icon half is not optional — IconButton
 * defaults to sm and Button to md, so an unsized pair is 32px beside 40px. */
/* ONE ACTION WITH A SECOND WAY TO DO IT — not two actions side by side. The
 * group welds a button to a menu of its variants: Save, and the other ways to
 * save. Two unrelated actions belong in a <Row> with their own weights, because
 * a group says they are the same thing and the reader believes it.
 *
 * `label` names the pair for a screen reader, which otherwise announces two
 * controls with no relationship. `tone` belongs to the action, not to the group:
 * `primary` when this is what the screen is for, `neutral` when it is one of
 * several things the reader might do here.
 */
export function Example() {
  return (
    <ButtonGroup label="Save options" tone="primary">
      <Button onClick={() => undefined}>Save</Button>
      <Dropdown
        align="end"
        trigger={({ isOpen, ...triggerProps }) => (
          <Tooltip content="Other ways to save">
            <IconButton
              icon="arrow_drop_down"
              size="md"
              variant="filled"
              tone="primary"
              aria-label="Other ways to save"
              data-open={isOpen || undefined}
              {...triggerProps}
            />
          </Tooltip>
        )}
      >
        <DropdownItem icon="content_copy" onClick={() => undefined}>Save a copy</DropdownItem>
        <DropdownItem icon="description" onClick={() => undefined}>Save as template</DropdownItem>
      </Dropdown>
    </ButtonGroup>
  )
}
