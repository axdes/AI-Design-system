/* How to instantiate each component with its required props and children, so a
 * caller can render it with any single variant prop overridden.
 *
 * ONE source of truth for "how do I build a <Combobox>?", and it now has three
 * consumers: registry.contract.test.tsx (asserts each declared variant lands as
 * a data-* attribute), the visual gallery's Variants mode, and the system's own
 * site, which lets a reader switch a variant on and off rather than showing one
 * frozen example per component. It lived in src/test/ while the first two were
 * both tests; the third is not one, and a product importing a folder called
 * `test` is a smell that outlives the reason for it (2026-08-25). */
import type { ReactElement, ReactNode } from 'react'

import { Alert } from '@/components/Alert'
import { AuthTemplate } from '@/blocks/AuthTemplate'
import { ListPageTemplate } from '@/blocks/ListPageTemplate'
import { Page } from '@/blocks/Page'
import { Prose } from '@/components/Prose'
import { AppLayout } from '@/components/AppLayout'
import { Avatar } from '@/components/Avatar'
import { SectionLabel } from '@/components/SectionLabel'
import { Slider } from '@/components/Slider'
import { Switch } from '@/components/Switch'
import { AvatarGroup } from '@/components/AvatarGroup'
import { Badge } from '@/components/Badge'
import { Chart } from '@/components/Chart'
import { ColorSwatch } from '@/components/ColorSwatch'
import { CountBadge } from '@/components/CountBadge'
import { DatePicker } from '@/components/DatePicker'
import { DateRangePicker } from '@/components/DateRangePicker'
import { Kbd } from '@/components/Kbd'
import { Progress } from '@/components/Progress'
import { RangeSlider } from '@/components/RangeSlider'
import { TagInput } from '@/components/TagInput'
import { Descriptions } from '@/components/Descriptions'
import { Divider } from '@/components/Divider'
import { FileUpload } from '@/components/FileUpload'
import { NumberInput } from '@/components/NumberInput'
import { InputGroup } from '@/components/InputGroup'
import { Link } from '@/components/Link'
import { ToastStack } from '@/components/Toast'
import { Rating } from '@/components/Rating'
import { SaveStatus } from '@/components/SaveStatus'
import { SegmentedControl } from '@/components/SegmentedControl'
import { Button } from '@/components/Button'
import { ButtonGroup } from '@/components/ButtonGroup'
import { Card } from '@/components/Card'
import { ChatShell } from '@/components/ChatShell'
import { Checkbox } from '@/components/Checkbox'
import { Chip } from '@/components/Chip'
import { Combobox } from '@/components/Combobox'
import { SearchInput } from '@/components/SearchInput'
import { EmptyState } from '@/components/EmptyState'
import { ExpandButton } from '@/components/ExpandButton'
import { Icon } from '@/components/Icon'
import { IconDisc } from '@/components/IconDisc'
import { Tooltip } from '@/components/Tooltip'
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
import { SelectableTile } from '@/components/SelectableTile'
import { Skeleton } from '@/components/Skeleton'
import { Sparkline } from '@/components/Sparkline'
import { Spinner } from '@/components/Spinner'
import { Tab, TabList, Tabs } from '@/components/Tabs'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import { TagGroup } from '@/components/TagGroup'
import { Thumbnail } from '@/components/Thumbnail'
import { Truncate } from '@/components/Truncate'
import { SessionPill } from '@/components/SessionPill'
import { ContentCard } from '@/components/ContentCard'
import { MenuIconButton } from '@/components/MenuIconButton'
import { SidePanel } from '@/components/SidePanel'
import { DropdownItem } from '@/components/Dropdown'
import { DateBlock } from '@/components/DateBlock'
import { DonutChart } from '@/components/DonutChart'
import { EntityLink } from '@/components/EntityLink'
import { Quote } from '@/components/Quote'
import { Identity } from '@/components/Identity'
import { Textarea } from '@/components/Textarea'

export type RenderProps = Record<string, unknown>

/* Children default to a plain fixture, but a caller may pass its own: the
 * gallery needs an icon inside a Button to show where an icon lands, and a real
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
  Avatar: (p) => <Avatar name="Ada Meridian" {...p} />,
  Badge: (p) => <Badge {...p}>Draft</Badge>,
  /* Controlled parts need a value to render at all; these three carry the
     smallest one that is still real, so the passthrough test can reach them. */
  SectionLabel: (p) => <SectionLabel {...p}>This quarter</SectionLabel>,
  Slider: (p) => <Slider value={20} onChange={() => undefined} label="Volume" {...p} />,
  Switch: (p) => <Switch checked onChange={() => undefined} label="Notify me" {...p} />,
  ColorSwatch: (p) => <ColorSwatch value="#4638d3" label="Indigo" {...p} />,
  IconDisc: (p) => <IconDisc icon="campaign" {...p} />,
  Button: (p) => <Button {...p}>{kids(p, 'Save')}</Button>,
  /* The split form is the fixture: a menu AND a half is the shape with the most
     to get wrong (two targets, the seam between them, the name on the chevron),
     so it is the one the variant sheet photographs. */
  ButtonGroup: (p) => (
    <ButtonGroup
      label="Save options"
      menuLabel="Other ways to save"
      menu={<DropdownItem onClick={() => undefined}>Save a copy</DropdownItem>}
      {...p}
    >
      {kids(p, <Button>Save</Button>)}
    </ButtonGroup>
  ),
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
  /* Wrapped, because an icon-only control owes a tooltip everywhere — including
     in a specimen a reader copies. Tooltip passes the variant through, so the
     data-* the contract test looks for still lands. */
  IconButton: (p) => (
    <Tooltip content="Add">
      <IconButton icon="add" aria-label="Add" {...p} />
    </Tooltip>
  ),
  Input: (p) => <Input aria-label="Name" {...p} />,
  Label: (p) => <Label {...p}>Name</Label>,
  MetaItem: (p) => <MetaItem {...p}>Updated today</MetaItem>,
  Modal: (p) => <Modal open onClose={() => undefined} title="Rename" {...p}>Body</Modal>,
  InputGroup: (p) => <InputGroup prefix="https://" {...p}><Input aria-label="Address" /></InputGroup>,
  Link: (p) => <Link href="/reports" {...p}>report library</Link>,
  Toast: (p) => (
    <ToastStack toasts={[{ id: 'a', title: 'Report published', duration: 0 }]} onDismiss={() => undefined} {...p} />
  ),
  Radio: (p) => <Radio name="pick" label="One" {...p} />,
  /* A fixed instant: `state` is the variant under test, and a relative time
     that moves would make the variants gallery differ between runs. */
  SaveStatus: (p) => <SaveStatus state="saved" at="2026-08-23T09:14:00.000Z" {...p} />,
  Select: (p) => (
    <Select label="Role" value="editor" onChange={() => undefined} options={[{ value: 'editor', label: 'Editor' }]} {...p} />
  ),
  /* `layout` is the variant that matters: every value has to reach the DOM as
     data-layout, because that is what the container queries select on. */
  ContentCard: (p) => <ContentCard title="The quarter in numbers" media={<img src="data:," alt="" />} {...p} />,
  /* These four declared their variants all along and published none of them:
     their unions are written with double quotes, and the registry only read
     single ones until 2026-08-26. The contract became visible, so it becomes
     photographed. */
  MenuIconButton: (p) => (
    <MenuIconButton label="Actions for the March invoice" {...p}>
      <DropdownItem onClick={() => undefined}>Rename</DropdownItem>
    </MenuIconButton>
  ),
  /* `hideBelow` drops the panel under a width, so the variant sheet needs one
     to photograph. The content is a sentence: the panel is the subject. */
  SidePanel: (p) => <SidePanel title="On this page" {...p}>Sections of this record.</SidePanel>,
  DateBlock: (p) => <DateBlock value="2026-02-19" {...p} />,
  DonutChart: (p) => (
    <DonutChart label="Spend by area" segments={[{ label: 'Build', value: 62 }, { label: 'Run', value: 38 }]} {...p} />
  ),
  EntityLink: (p) => <EntityLink title="Quarterly safety review" href="#" icon="description" {...p} />,
  Quote: (p) => <Quote by="Ada Meridian" {...p}>The number moved because two sites closed early.</Quote>,
  /* One mark is enough to prove the normalisation lands: `colour` is the variant
     that opts out of it. */
  /* selected/onSelect are required: the tile is a controlled control, and the
     spread comes last so each variant case can flip what it is testing. */
  SelectableTile: (p) => <SelectableTile name="region" title="Europe" selected onSelect={() => {}} {...p} />,
  Skeleton: (p) => <Skeleton {...p} />,
  Chart: (p) => (
    <Chart labels={['Apr', 'May']} series={[{ label: 'Closed', values: [34, 41] }]} label="Findings closed" {...p} />
  ),
  Sparkline: (p) => <Sparkline values={[3, 5, 4, 8, 6, 9]} {...p} />,
  Spinner: (p) => <Spinner label="Loading" {...p} />,
  Divider: (p) => <Divider {...p} />,
  DatePicker: (p) => <DatePicker label="Date" onChange={() => undefined} {...p} />,
  DateRangePicker: (p) => <DateRangePicker label="Dates" onChange={() => undefined} {...p} />,
  Kbd: (p) => <Kbd {...p}>K</Kbd>,
  /* The RING by default: `size` only means something on a ring (a bar takes the
     width it is given), so a bar fixture would make the size variants land
     nowhere. The `shape` override still renders the bar. */
  Progress: (p) => <Progress shape="ring" value={64} label="Documents processed" {...p} />,
  RangeSlider: (p) => <RangeSlider label="Range" value={[20, 60]} onChange={() => undefined} {...p} />,
  TagInput: (p) => <TagInput label="Tags" value={['design']} onChange={() => undefined} {...p} />,
  NumberInput: (p) => <NumberInput label="Qty" value={1} onChange={() => undefined} {...p} />,
  CountBadge: (p) => <CountBadge count={3} {...p}><span>x</span></CountBadge>,
  AvatarGroup: (p) => <AvatarGroup items={[{ name: 'A B' }, { name: 'C D' }]} {...p} />,
  SegmentedControl: (p) => (
    <SegmentedControl label="View" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} {...p} />
  ),
  Rating: (p) => <Rating label="Score" value={3} {...p} />,
  Descriptions: (p) => <Descriptions items={[{ term: 'K', value: 'V' }]} {...p} />,
  Prose: (p) => <Prose {...p}>A sentence, at a measure.</Prose>,
  FileUpload: (p) => <FileUpload onFiles={() => undefined} {...p} />,
  ListPageTemplate: (p) => (
    <ListPageTemplate title="Projects" {...p}>
      <Card>Row</Card>
    </ListPageTemplate>
  ),
  /* Every archetype, shape, width and alignment lands as a data-* attribute the
     CSS selects on, so the whole preset table is exercised from here. */
  Page: (p) => (
    <Page {...p}>
      <Card>Row</Card>
    </Page>
  ),
  /* The caption is here because `captionHidden` has nothing to hide without
     one: the variant contract is checked by rendering, so the fixture has to
     carry what the variant acts on. */
  TagGroup: (p) => <TagGroup items={['Finance', 'Q3', 'Reviewed']} {...p} />,
  Thumbnail: (p) => <Thumbnail alt="Quarterly report" {...p} />,
  Truncate: (p) => <Truncate {...p}>A value long enough that a narrow column has to cut it</Truncate>,
  Table: (p) => (
    <Table caption="Rows" {...p}>
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
  SessionPill: (p) => <SessionPill label="Recording" onClick={() => undefined} {...p} />,
  Identity: (p) => <Identity name="Ada Meridian" secondary="Product designer" {...p} />,
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
