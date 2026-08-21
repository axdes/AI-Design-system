/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { AvatarGroup } from '@/components/AvatarGroup'
import { Badge } from '@/components/Badge'
import { Descriptions } from '@/components/Descriptions'
import { SectionLabel } from '@/components/SectionLabel'
import { Stack } from '@/components/Layout'
import { Timeline } from '@/components/Timeline'

export function Screen() {
  return (
    <Stack gap={6}>
      <Descriptions
        items={[
          { term: 'Owner', value: 'Sarah Al-Mansouri' },
          { term: 'Status', value: <Badge tone="success" fill="soft">On track</Badge> },
          { term: 'Due', value: '30 September 2026' },
          { term: 'Budget', value: 'SAR 240,000' },
        ]}
      />

      <Stack gap={2}>
        <SectionLabel>Team</SectionLabel>
        <AvatarGroup
          max={4}
          items={[
            { name: 'Sarah Al-Mansouri' },
            { name: 'Ahmed Al-Saud' },
            { name: 'Fatima Al-Zahra' },
            { name: 'Mohammed Al-Khalid' },
            { name: 'Noura Al-Otaibi' },
            { name: 'Khalid Al-Harbi' },
          ]}
        />
      </Stack>

      <Stack gap={2}>
        <SectionLabel>Activity</SectionLabel>
        <Timeline
          items={[
            { id: '1', title: 'Milestone approved', time: 'Today', tone: 'success', icon: 'check_circle' },
            { id: '2', title: 'Design review', time: 'Yesterday' },
            { id: '3', title: 'Project created', time: '2 weeks ago', tone: 'primary' },
          ]}
        />
      </Stack>
    </Stack>
  )
}
