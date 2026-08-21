/* Golden example. A real module: tsc compiles it, src/test/examples.test.tsx
 * renders it, and the registry publishes the usage below to agents. */
import { Dropdown, DropdownItem, DropdownSection, DropdownDivider } from './Dropdown'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { Tooltip } from '../Tooltip'

/* Spread `triggerProps` onto your trigger so keyboard nav, ARIA and the portal
 * all wire up; `isOpen` lets the trigger reflect state. */
export function Example() {
  return (
    <Dropdown
      align="end"
      trigger={({ isOpen, ...triggerProps }) => (
        <Button data-open={isOpen || undefined} {...triggerProps}>
          Actions
          <Icon name="arrow_drop_down" />
        </Button>
      )}
    >
      {/* Label a section once the menu holds more than a handful of actions. */}
      <DropdownSection label="Edit">
        <DropdownItem icon="edit" shortcut="⌘E" onClick={() => undefined}>Rename</DropdownItem>
        {/* Disabled items stay hoverable so the tooltip can say why. */}
        <Tooltip content="Only the owner can move this">
          <DropdownItem icon="folder" disabled>Move to folder</DropdownItem>
        </Tooltip>
      </DropdownSection>
      {/* Destructive last, behind a divider: nothing to misclick on the way. */}
      <DropdownDivider />
      <DropdownItem icon="delete" tone="danger" onClick={() => undefined}>Delete</DropdownItem>
    </Dropdown>
  )
}
