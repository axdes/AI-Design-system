/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useState } from 'react'
import { Chip } from '@/components/Chip'
import { Dropdown, DropdownItem } from '@/components/Dropdown'
import { Icon } from '@/components/Icon'
import { IconButton } from '@/components/IconButton'
import { Row } from '@/components/Layout'
import { Tooltip } from '@/components/Tooltip'

type Scope = 'all' | 'shared' | 'archived'

const FILTERS: { value: Scope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'shared', label: 'Shared' },
  { value: 'archived', label: 'Archived' },
]

/* Icon-only controls carry BOTH: the aria-label is the accessible name, the
 * Tooltip is the visible one on hover and focus. Neither replaces the other. */
const ACTIONS = [
  { icon: 'download', label: 'Download' },
  { icon: 'share', label: 'Share' },
  { icon: 'delete', label: 'Delete' },
] as const

export function Screen() {
  const [scope, setScope] = useState<Scope>('all')

  return (
    <Row gap={3} align="center">
      {FILTERS.map((f) => (
        <Chip
          key={f.value}
          variant="secondary"
          selected={scope === f.value}
          onClick={() => setScope(f.value)}
        >
          {f.label}
        </Chip>
      ))}

      {ACTIONS.map((a) => (
        <Tooltip key={a.icon} content={a.label}>
          <IconButton
            icon={a.icon}
            aria-label={a.label}
            tone={a.icon === 'delete' ? 'destructive' : undefined}
            onClick={() => undefined}
          />
        </Tooltip>
      ))}

      <Dropdown
        align="end"
        trigger={({ isOpen, ...triggerProps }) => (
          <Tooltip content="More actions">
            <IconButton
              icon="more_vert"
              aria-label="More actions"
              data-open={isOpen || undefined}
              {...triggerProps}
            />
          </Tooltip>
        )}
      >
        <DropdownItem icon="edit" onClick={() => undefined}>Rename</DropdownItem>
        <DropdownItem icon="content_copy" onClick={() => undefined}>Duplicate</DropdownItem>
      </Dropdown>

      <Icon name="info" size="sm" />
    </Row>
  )
}
