/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Button } from '../Button'
import { Dropdown, DropdownItem } from '../Dropdown'
import { IconButton } from '../IconButton'
import { Row } from '../Layout'
import { Tooltip } from '../Tooltip'
import { ButtonGroup } from './ButtonGroup'

/* ONE ACTION WITH A SECOND WAY TO DO IT — not two actions side by side. The
 * group welds a button to a menu of its own variants: Save, and the other ways
 * to save. Two unrelated actions belong in a <Row> with their own weights,
 * because a group says they are the same thing and the reader believes it.
 *
 * `tone` belongs to the action, not to the group. `primary` is the one thing
 * the screen exists for, and a screen has one; `neutral` is everything a reader
 * MIGHT do here, and a page can carry several without any of them shouting. Two
 * primary groups on one screen is two answers to "what am I meant to do".
 *
 * `label` names the pair for a screen reader, which otherwise announces two
 * controls with nothing tying them together. `size="md"` on the icon half is
 * not optional: IconButton defaults to sm and Button to md, so an unsized pair
 * renders 32px beside 40px.
 */
export function Example() {
  return (
    <Row gap={4} align="center">
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

      <ButtonGroup label="Export options" tone="neutral">
        <Button variant="secondary" onClick={() => undefined}>Export</Button>
        <Dropdown
          align="end"
          trigger={({ isOpen, ...triggerProps }) => (
            <Tooltip content="Other export formats">
              <IconButton
                icon="arrow_drop_down"
                size="md"
                variant="filled"
                aria-label="Other export formats"
                data-open={isOpen || undefined}
                {...triggerProps}
              />
            </Tooltip>
          )}
        >
          <DropdownItem icon="table" onClick={() => undefined}>Export as CSV</DropdownItem>
          <DropdownItem icon="description" onClick={() => undefined}>Export as PDF</DropdownItem>
        </Dropdown>
      </ButtonGroup>
    </Row>
  )
}
