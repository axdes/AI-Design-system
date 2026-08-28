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
