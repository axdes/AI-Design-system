/* Shared render map: how to instantiate each component with its required props +
 * children, so a caller can render it with any single variant prop overridden.
 * ONE source of truth, used by both registry.contract.test.tsx (asserts each
 * declared variant lands as a data-* attribute) and the visual gallery's
 * "Variants" mode (renders every variant value for a component). Keeping it here
 * avoids duplicating "how do I build a <Combobox>?" in two places. */
import type { ReactElement, ReactNode } from 'react'

import { Alert } from '@/components/Alert'
import { AuthTemplate } from '@/blocks/AuthTemplate'
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { AppLayout } from '@/components/AppLayout'
import { Avatar } from '@/components/Avatar'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Badge } from '@/components/Badge'
import { CountBadge } from '@/components/CountBadge'
import { DatePicker } from '@/components/DatePicker'
import { DateRangePicker } from '@/components/DateRangePicker'
import { Kbd } from '@/components/Kbd'
import { ProgressCircle } from '@/components/ProgressCircle'
import { RangeSlider } from '@/components/RangeSlider'
import { TagInput } from '@/components/TagInput'
import { TimeInput } from '@/components/TimeInput'
import { Descriptions } from '@/components/Descriptions'
import { Divider } from '@/components/Divider'
import { FileUpload } from '@/components/FileUpload'
import { NumberInput } from '@/components/NumberInput'
import { ProgressBar } from '@/components/ProgressBar'
import { Rating } from '@/components/Rating'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ChatShell } from '@/components/ChatShell'
import { Checkbox } from '@/components/Checkbox'
import { Chip } from '@/components/Chip'
import { Combobox } from '@/components/Combobox'
import { SearchInput } from '@/components/SearchInput'
import { EmptyState } from '@/components/EmptyState'
import { ExpandButton } from '@/components/ExpandButton'
import { Icon } from '@/components/Icon'
import { IconButton } from '@/components/IconButton'
import { Input } from '@/components/Input'
import { Label } from '@/components/Label'
import { MetaItem } from '@/components/MetaItem'
import { Modal } from '@/components/Modal'
import { PasswordInput } from '@/components/PasswordInput'
import { PlanCard } from '@/components/PlanCard'
import { Radio } from '@/components/Radio'
import { Select } from '@/components/Select'
import { SideNav } from '@/components/SideNav'
import { Skeleton } from '@/components/Skeleton'
import { Spinner } from '@/components/Spinner'
import { Tab, TabList, Tabs } from '@/components/Tabs'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { Tag } from '@/components/Tag'
import { SessionPill } from '@/components/SessionPill'
import { ContentRow } from '@/components/ContentRow'
import { Identity } from '@/components/Identity'
import { Textarea } from '@/components/Textarea'

export type RenderProps = Record<string, unknown>

/* Children default to a plain fixture, but a caller may pass its own: the
 * gallery needs an icon inside a Button to show what `iconEnd` does, and a real
 * header inside a Card to show what `tight` does. JSX children would win over
 * `{...p}`, so the override has to be read explicitly. */
const kids = (p: RenderProps, fallback: ReactNode): ReactNode =>
  (p.children as ReactNode) ?? fallback

export const RENDER: Record<string, (p: RenderProps) => ReactElement> = {
  Alert: (p) => <Alert {...p}>Changes saved</Alert>,
  /* themeLock lands as data-theme-lock on the wrapper, which is what pins an
   * auth screen to one theme against a branded background. */
  AuthTemplate: (p) => (
    <AuthTemplate title="Sign in" brand={<strong>Acme</strong>} submitLabel="Sign in" onSubmit={() => {}} {...p}>
      <input aria-label="Email" />
    </AuthTemplate>
  ),
  AppLayout: (p) => <AppLayout nav={<nav aria-label="Primary" />} {...p}>Body</AppLayout>,
  Avatar: (p) => <Avatar name="Sarah Al-Mansouri" {...p} />,
  Badge: (p) => <Badge {...p}>Draft</Badge>,
  Button: (p) => <Button {...p}>{kids(p, 'Save')}</Button>,
  Card: (p) => <Card {...p}>{kids(p, 'Body')}</Card>,
  ChatShell: (p) => <ChatShell {...p}>Thread</ChatShell>,
  Checkbox: (p) => <Checkbox label="Notify me" {...p} />,
  Chip: (p) => <Chip {...p}>Filter</Chip>,
  Combobox: (p) => (
    <Combobox label="Fruit" onChange={() => undefined} options={[{ value: 'apple', label: 'Apple' }]} {...p} />
  ),
  SearchInput: (p) => <SearchInput aria-label="Search" {...p} />,
  EmptyState: (p) => <EmptyState title="Nothing here" {...p} />,
  ExpandButton: (p) => <ExpandButton icon="add" label="More" {...p} />,
  Icon: (p) => <Icon name="add" {...p} />,
  IconButton: (p) => <IconButton icon="add" aria-label="Add" {...p} />,
  Input: (p) => <Input aria-label="Name" {...p} />,
  Label: (p) => <Label {...p}>Name</Label>,
  MetaItem: (p) => <MetaItem {...p}>Updated today</MetaItem>,
  Modal: (p) => <Modal open onClose={() => undefined} title="Rename" {...p}>Body</Modal>,
  Radio: (p) => <Radio name="pick" label="One" {...p} />,
  Select: (p) => (
    <Select label="Role" value="editor" onChange={() => undefined} options={[{ value: 'editor', label: 'Editor' }]} {...p} />
  ),
  Skeleton: (p) => <Skeleton {...p} />,
  Spinner: (p) => <Spinner label="Loading" {...p} />,
  Divider: (p) => <Divider {...p} />,
  DatePicker: (p) => <DatePicker label="Date" onChange={() => undefined} {...p} />,
  DateRangePicker: (p) => <DateRangePicker label="Dates" onChange={() => undefined} {...p} />,
  Kbd: (p) => <Kbd {...p}>K</Kbd>,
  ProgressCircle: (p) => <ProgressCircle value={60} label="Progress" {...p} />,
  RangeSlider: (p) => <RangeSlider label="Range" value={[20, 60]} onChange={() => undefined} {...p} />,
  TagInput: (p) => <TagInput label="Tags" value={['design']} onChange={() => undefined} {...p} />,
  TimeInput: (p) => <TimeInput aria-label="Time" {...p} />,
  ProgressBar: (p) => <ProgressBar label="Uploading" value={40} {...p} />,
  NumberInput: (p) => <NumberInput label="Qty" value={1} onChange={() => undefined} {...p} />,
  CountBadge: (p) => <CountBadge count={3} {...p}><span>x</span></CountBadge>,
  AvatarGroup: (p) => <AvatarGroup items={[{ name: 'A B' }, { name: 'C D' }]} {...p} />,
  SegmentedControl: (p) => (
    <SegmentedControl label="View" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} {...p} />
  ),
  Rating: (p) => <Rating label="Score" value={3} {...p} />,
  Descriptions: (p) => <Descriptions items={[{ term: 'K', value: 'V' }]} {...p} />,
  FileUpload: (p) => <FileUpload onFiles={() => undefined} {...p} />,
  ListPageTemplate: (p) => (
    <ListPageTemplate title="Projects" {...p}>
      <Card>Row</Card>
    </ListPageTemplate>
  ),
  Table: (p) => (
    <Table {...p}>
      <THead>
        <Tr>
          <Th>Name</Th>
        </Tr>
      </THead>
      <TBody>
        <Tr>
          <Td>Row</Td>
        </Tr>
      </TBody>
    </Table>
  ),
  Tabs: (p) => (
    <Tabs value="a" onChange={() => undefined} {...p}>
      <TabList label="Sections"><Tab value="a">A</Tab></TabList>
    </Tabs>
  ),
  SideNav: (p) => (
    <SideNav
      aria-label="Primary"
      logo={<span>Acme</span>}
      groups={[{ items: [{ id: 'library', label: 'Library', icon: 'folder', active: true }] }]}
      {...p}
    />
  ),
  PasswordInput: (p) => <PasswordInput aria-label="Password" {...p} />,
  PlanCard: (p) => (
    <PlanCard name="Team" price="$12" features={['Up to 20 seats']} action={<Button>Choose</Button>} {...p} />
  ),
  Tag: (p) => <Tag {...p}>Sarah</Tag>,
  SessionPill: (p) => <SessionPill label="Recording" onClick={() => undefined} {...p} />,
  ContentRow: (p) => <ContentRow title="Quarterly safety review" onOpen={() => undefined} {...p} />,
  Identity: (p) => <Identity name="Sarah Al-Mansouri" secondary="Product designer" {...p} />,
  Textarea: (p) => <Textarea aria-label="Notes" {...p} />,
}

/* Components whose variants cannot be exercised by rendering the component
 * alone. Each needs a reason; the list is meant to stay this short. */
export const NOT_RENDERABLE: Record<string, string> = {
  FilterBar: 'data-active is driven by the filterBar context, covered by FilterBar usage in layouts',
  FilterDropdown: 'data-active comes from the surrounding FilterBar context',
  Layout: 'data-gap is asserted in the Layout golden example',
  Meter: 'tone/size selectors carry no enumerated values in the registry',
  Stat: 'tone/size selectors carry no enumerated values in the registry',
  DetailPageTemplate: 'data-has-aside is set from the aside prop, covered by the block example',
  Pagination: 'no enumerated variant props; behaviour covered by Pagination.test.tsx',
  Breadcrumb: 'no enumerated variant props; covered by its golden example',
  Accordion: 'no enumerated variant props; keyboard/ARIA covered by Accordion.test.tsx',
  Slider: 'no enumerated variant props; covered by Slider.test.tsx',
  Stepper: 'no enumerated variant props; state comes from `current`, covered by Stepper.test.tsx',
  Popover: 'no enumerated variant props; open/ARIA covered by Popover.test.tsx',
  Timeline: 'no enumerated variant props; covered by its golden example',
  HoverCard: 'no enumerated variant props; hover/focus covered by its golden example',
  Calendar: 'no enumerated variant props; keyboard/i18n covered by Calendar.test.tsx',
  Tree: 'no enumerated variant props; keyboard/ARIA covered by Tree.test.tsx',
  DataGrid: 'no enumerated variant props; windowing covered by DataGrid.test.tsx',
  CommandPalette: 'no enumerated variant props; search/keyboard covered by CommandPalette.test.tsx',
  ContextMenu: 'no enumerated variant props; open/keyboard covered by ContextMenu.test.tsx',
}
