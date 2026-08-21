import '../../styles/demo.css'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { Chip } from '../components/Chip'
import { Radio, RadioGroup } from '../components/Radio'
import { ExpandButton } from '../components/ExpandButton'
import { Icon, type IconName } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { Input } from '../components/Input'
import { Label } from '../components/Label'
import { Grid, Row, Stack } from '../components/Layout'
import { MetaItem } from '../components/MetaItem'
import { SectionLabel } from '../components/SectionLabel'
import { Switch } from '../components/Switch'
import { Textarea } from '../components/Textarea'
import { Alert } from '../components/Alert'
import { ChatComposer } from '../components/ChatComposer'
import { ChatMessage } from '../components/ChatMessage'
import { Dropdown, DropdownItem } from '../components/Dropdown'
import { EmptyState } from '../components/EmptyState'
import { Field } from '../components/Field'
import { FilterDropdown } from '../components/FilterDropdown'
import { ListItem } from '../components/ListItem'
import { SearchInput } from '../components/SearchInput'
import { Select } from '../components/Select'
import { Tab, TabList, TabPanel, Tabs } from '../components/Tabs'
import { ThemeToggle } from '../shell/ThemeToggle'
import { Tooltip } from '../components/Tooltip'
import { Card, CardHeader, CardMeta, CardTitle } from '../components/Card'
import { FeedbackModal } from '../components/FeedbackModal'
import { Modal } from '../components/Modal'
import { SidePanel } from '../components/SidePanel'
import { SideNav } from '../components/SideNav'
import { Stat } from '../components/Stat'
import { Meter } from '../components/Meter'
import { Table, THead, TBody, Tr, Th, Td } from '../components/Table'
import { Carousel } from '../components/Carousel'
import { CodeInput } from '../components/CodeInput'
import { CopyButton } from '../components/CopyButton'
import { Highlight } from '../components/Highlight'
import { LoadMore } from '../components/LoadMore'
import { PasswordInput } from '../components/PasswordInput'
import { PlanCard } from '../components/PlanCard'
import { Time } from '../components/Time'
import { cn } from '../lib/cn'
import { ROUTES } from '../lib/routes'
import {
  applySettings, clearSettings, loadSettings, defaultSettings, SETTINGS_KEY, type Settings,
} from '../lib/playgroundSettings'
import { useToast } from '../lib/ToastProvider'

const brandStops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
const neutralStops = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
const semanticStops = [50, 300, 500, 700, 900] as const
const typeSteps = ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const
const spaceSteps = [1, 2, 3, 4, 6, 8, 12, 16] as const
const sampleIcons: IconName[] = [
  'add', 'search', 'edit', 'delete', 'folder', 'description', 'message', 'send', 'mic',
  'check', 'close', 'menu', 'more_vert', 'arrow_drop_down', 'calendar', 'volume', 'thumb_up',
  'thumb_down', 'pin', 'archive', 'info', 'warning', 'error', 'check_circle', 'person', 'group',
]
const NAV = ['settings', 'foundation', 'atoms', 'molecules', 'organisms', 'layouts'] as const

/* An atomic-level group: heading + a responsive grid of component spec cards. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="pg-section">
      <h2 className="pg-section-title">{title}</h2>
      <div className="pg-grid">{children}</div>
    </section>
  )
}

/* One component's card: its name + a body of labeled facet rows. */
function Spec({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('pg-spec', wide && 'pg-spec--wide')}>
      <h3 className="pg-spec-title">{title}</h3>
      <div className="pg-spec-body">{children}</div>
    </div>
  )
}

/* A single facet within a spec (e.g. "variants", "sizes", "states"). */
function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pg-demo">
      <SectionLabel>{label}</SectionLabel>
      <Row>{children}</Row>
    </div>
  )
}

const SELECT_OPTS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]
const FILTER_OPTS = [
  { value: 'doc', label: 'Document' },
  { value: 'video', label: 'Video' },
  { value: 'social', label: 'Social' },
]
const BTN_VARIANTS = ['primary', 'secondary', 'dark', 'ghost', 'destructive'] as const
const CHIP_VARIANTS = ['secondary', 'primary', 'dark', 'ghost'] as const   // no destructive — red chips aren't used

export function Playground() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [tab, setTab] = useState('overview')
  const [sw, setSw] = useState(true)
  const [sel, setSel] = useState('review')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string[]>([])
  const [chipSel, setChipSel] = useState('one')
  const [cb, setCb] = useState(true)
  const [radio, setRadio] = useState('email')
  const [code, setCode] = useState('')
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => { applySettings(settings) }, [settings])

  /* Persisted only when the user actually turns a knob. Writing on mount meant
   * that merely LOOKING at this page pinned the brand colour into localStorage,
   * where it would then survive the next rebrand. */
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings((p) => {
      const next = { ...p, [k]: v }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  const reset = () => { clearSettings(); setSettings(defaultSettings()); try { localStorage.removeItem(SETTINGS_KEY) } catch { /* ignore */ } }

  return (
    <>
      {/* Chrome, deliberately OUTSIDE <main>: this page is reached by URL and had
          no way back on a phone. The section list below is page content and does
          not count — the audit used to accept the SideNav DEMO further down as
          this screen's navigation, which is exactly the sort of pass that means
          nothing. */}
      <nav className="pg-topbar" aria-label="Playground">
        <Link to={ROUTES.root} className="pg-topbar-home">
          <Icon name="arrow_back" />
          Back to the app
        </Link>
        <div className="theme-toggle"><ThemeToggle /></div>
      </nav>

      <main className="playground">
        <Stack gap={3}>
          <h1 className="playground-title">Design system gallery</h1>
          <p className="playground-lead">
            Every token, component and layout in one place. Tune <code>styles/settings.css</code> and it all recalculates.
          </p>
        </Stack>
        <nav className="pg-nav" aria-label="Playground sections">
          {NAV.map((s) => <a key={s} href={`#${s}`} className="pg-nav-link">{s}</a>)}
        </nav>

        {/* ─────────────── SETTINGS ─────────────── */}
        <section id="settings" className="pg-section">
          <h2 className="pg-section-title">Settings (live, applies to the whole app)</h2>
          <p className="playground-hint">
            These write to <code>:root</code> CSS variables, so every page recalculates. Saved across reloads.
          </p>
          <div className="pg-controls">
            <label className="pg-control">
              <span>Radius (base) <b>{settings.radius}px</b></span>
              <input type="range" min={0} max={24} step={2} value={settings.radius} onChange={(e) => set('radius', Number(e.target.value))} />
            </label>
            <label className="pg-control">
              <span>Brand colour <b>{settings.primary}</b></span>
              <input type="color" value={settings.primary} onChange={(e) => set('primary', e.target.value)} />
            </label>
            <div className="pg-control">
              <Switch checked={settings.pill} onChange={(v) => set('pill', v)} label="Pill controls (buttons / inputs fully rounded)" />
            </div>
          </div>
          <Row><Button variant="secondary" onClick={reset}>Reset to defaults</Button></Row>
        </section>

        {/* ─────────────── NEW COMPONENTS (verification) ─────────────── */}
        <Section id="new" title="New components">
          <Spec title="Stat: KPI tile">
            <Demo label="Tones">
              <Stat value="2.0" label="Avg maturity" />
              <Stat value="1.4" unit="/3" tone="warning" label="Lowest" />
              <Stat value="2.4" unit="/3" tone="success" label="Highest" />
              <Stat value="5/5" tone="primary" label="Blocked on cost" />
            </Demo>
          </Spec>
          <Spec title="Meter: gauge on a scale">
            <Demo label="value / target / ticks">
              <Stack gap={3} className="pg-gauge-column">
                <Meter value={1.4} max={3} target={2} tone="warning" ticks={[0, 1, 2, 3]} label="Maturity 1.4 of 3" />
                <Meter value={2.1} max={3} target={3} tone="primary" ticks={[0, 1, 2, 3]} label="Maturity 2.1 of 3" />
                <Meter value={2.4} max={3} target={3} tone="success" ticks={[0, 1, 2, 3]} label="Maturity 2.4 of 3" />
              </Stack>
            </Demo>
          </Spec>
          <Spec title="Table" wide>
            <Card flush>
              <Table>
                <THead>
                  <Tr><Th>Dimension</Th><Th>Level 1</Th><Th>Level 2</Th><Th>Level 3</Th></Tr>
                </THead>
                <TBody>
                  <Tr><Td emphasis>AI Capabilities</Td><Td>Assisted</Td><Td>Augmented</Td><Td tone="success">Agentic</Td></Tr>
                  <Tr><Td emphasis>AI Champions</Td><Td>Sporadic</Td><Td>Designated</Td><Td tone="success">Embedded</Td></Tr>
                  <Tr><Td emphasis>Daily Active</Td><Td>Low</Td><Td>&gt;70%</Td><Td tone="success">&gt;80%</Td></Tr>
                </TBody>
              </Table>
            </Card>
          </Spec>
          <Spec title="SideNav: routing-agnostic rail" wide>
            <Demo label="expanded / collapse via bottom control (drag the collapse row)">
              <div style={{ blockSize: '26rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--muted)' }}>
                <SideNav
                  aria-label="Demo"
                  collapseControl="both"
                  logo={<strong style={{ color: 'var(--primary-accent)' }}>AI/Run</strong>}
                  logoMark={<strong>AR</strong>}
                  groups={[
                    { items: [{ id: 'c', label: 'Cockpit', icon: 'dashboard', active: true }] },
                    { label: 'Teams', items: [
                      { id: '1', label: 'IDP OnePass', icon: 'folder', sublabel: 'UBS', trailing: <Badge tone="warning" fill="soft">1.4</Badge> },
                      { id: '2', label: 'GhostForge', icon: 'folder', sublabel: 'ISIO', trailing: <Badge tone="primary" fill="soft">2.3</Badge> },
                    ] },
                  ]}
                />
              </div>
            </Demo>
          </Spec>
        </Section>

        {/* ─────────────── FOUNDATION ─────────────── */}
        <Section id="foundation" title="Foundation">
          <Spec title="Color" wide>
            <Demo label="Brand"><div className="swatch-grid">{brandStops.map((n) => <div key={n} className="swatch" data-token={`brand-${n}`} />)}</div></Demo>
            <Demo label="Neutrals"><div className="swatch-grid">{neutralStops.map((n) => <div key={n} className="swatch" data-token={`neutral-${n}`} />)}</div></Demo>
            <Demo label="Success / Warning / Danger">
              <div className="swatch-grid">
                {(['success', 'warning', 'danger'] as const).flatMap((fam) =>
                  semanticStops.map((n) => <div key={`${fam}-${n}`} className="swatch" data-token={`${fam}-${n}`} />),
                )}
              </div>
            </Demo>
          </Spec>
          <Spec title="Type scale" wide>
            <Stack gap={1}>{typeSteps.map((s) => <div key={s} style={{ fontSize: `var(--font-${s})` }}>{s}: Sample heading</div>)}</Stack>
          </Spec>
          <Spec title="Space scale">
            <div className="space-scale">{spaceSteps.map((n) => <div key={n} className="space-block" data-step={n} />)}</div>
          </Spec>
          <Spec title="Icons" wide>
            <Row>{sampleIcons.map((n) => <Tooltip key={n} content={n}><span className="pg-icon-cell"><Icon name={n} size="md" /></span></Tooltip>)}</Row>
          </Spec>
        </Section>

        {/* ─────────────── ATOMS ─────────────── */}
        <Section id="atoms" title="Atoms">
          <Spec title="Button">
            <Demo label="Variants">
              {BTN_VARIANTS.map((v) => <Button key={v} variant={v === 'primary' ? undefined : v}>{v}</Button>)}
              <Button disabled>disabled</Button>
            </Demo>
            <Demo label="Sizes & icon">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button iconEnd><Icon name="add" />Create</Button>
            </Demo>
          </Spec>

          <Spec title="Chip (button styles + selectable)">
            <Demo label="Variants: same colors as Button">
              {CHIP_VARIANTS.map((v) => <Chip key={v} variant={v === 'secondary' ? undefined : v}>{v}</Chip>)}
            </Demo>
            <Demo label="Sizes">
              <Chip size="sm">Small</Chip>
              <Chip>Default</Chip>
              <Chip size="lg">Large</Chip>
            </Demo>
            <Demo label="Selected (pick-one group)">
              {['one', 'two', 'three'].map((v) => (
                <Chip key={v} selected={chipSel === v} onClick={() => setChipSel(v)}>{v}</Chip>
              ))}
            </Demo>
          </Spec>

          <Spec title="IconButton">
            <Demo label="Variants / tones">
              <IconButton icon="search" aria-label="Search" />
              <IconButton icon="more_vert" size="md" aria-label="More" />
              <IconButton icon="send" size="md" variant="filled" tone="primary" aria-label="Send" />
              <IconButton icon="stop" size="md" variant="filled" tone="destructive" aria-label="Stop" />
              <IconButton icon="close" size="md" variant="quiet" aria-label="Close" />
            </Demo>
          </Spec>

          <Spec title="Badge">
            <Demo label="Solid">
              {(['neutral', 'primary', 'success', 'warning', 'danger'] as const).map((tn) => <Badge key={tn} tone={tn}>{tn}</Badge>)}
            </Demo>
            <Demo label="Soft">
              {(['primary', 'success', 'warning', 'danger'] as const).map((tn) => <Badge key={tn} tone={tn} fill="soft">{tn}</Badge>)}
            </Demo>
            <Demo label="Sizes">
              <Badge tone="primary">Small</Badge>
              <Badge tone="primary" size="md">Medium</Badge>
            </Demo>
          </Spec>

          <Spec title="Avatar">
            <Demo label="Sizes">
              <Avatar name="Mohammed Ali" size="sm" />
              <Avatar name="Mohammed Ali" size="md" />
              <Avatar name="Mohammed Ali" size="lg" />
              <Avatar name="Mohammed Ali" size="xl" />
            </Demo>
          </Spec>

          <Spec title="Label">
            <Demo label="Sizes">
              <Label>Default label (15px)</Label>
              <Label size="sm">Small label (13px)</Label>
            </Demo>
          </Spec>

          <Spec title="Checkbox / Radio">
            <Demo label="Checkbox: states & sizes">
              <Checkbox label="Checked" checked={cb} onChange={(e) => setCb(e.target.checked)} />
              <Checkbox label="Unchecked" defaultChecked={false} />
              <Checkbox label="Indeterminate" indeterminate />
              <Checkbox label="Disabled" disabled />
              <Checkbox label="Small" size="sm" defaultChecked />
              <Checkbox label="Large" size="lg" defaultChecked />
            </Demo>
            <Demo label="Radio group">
              <RadioGroup
                name="pg-contact"
                label="Preferred contact"
                value={radio}
                onChange={setRadio}
                options={[
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'SMS' },
                  { value: 'none', label: 'No contact', disabled: true },
                ]}
              />
            </Demo>
            <Demo label="Radio: sizes">
              <Radio name="pg-size" label="Small" size="sm" defaultChecked />
              <Radio name="pg-size2" label="Large" size="lg" defaultChecked />
            </Demo>
          </Spec>

          <Spec title="Input / Textarea">
            <div className="pg-demo">
              <SectionLabel>States</SectionLabel>
              <Stack gap={2}>
                <Input placeholder="Type something…" />
                <Input placeholder="Invalid" invalid defaultValue="bad" />
                <Textarea placeholder="Multi-line…" rows={2} />
              </Stack>
            </div>
            <div className="pg-demo">
              <SectionLabel>Sizes</SectionLabel>
              <Stack gap={2}>
                <Input size="sm" placeholder="Small" />
                <Input size="md" placeholder="Default" />
                <Input size="lg" placeholder="Large" />
              </Stack>
            </div>
          </Spec>

          <Spec title="Switch / MetaItem / SectionLabel">
            <Demo label="Misc atoms">
              <Switch checked={sw} onChange={setSw} label="Notifications" />
              <MetaItem appearance="eyebrow" icon="description">Document</MetaItem>
              <MetaItem icon="schedule">May 21, 2026</MetaItem>
              <SectionLabel>Section label</SectionLabel>
            </Demo>
          </Spec>

          <Spec title="ExpandButton">
            <Demo label="Default"><ExpandButton icon="add" label="Create" withChevron /></Demo>
          </Spec>
        </Section>

        {/* ─────────────── MOLECULES ─────────────── */}
        <Section id="molecules" title="Molecules">
          <Spec title="Field / Select / SearchInput / FilterDropdown">
            <Stack gap={3}>
              <Field label="Status"><Select label="Status" value={sel} onChange={setSel} options={SELECT_OPTS} /></Field>
              <SearchInput placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
              <FilterDropdown label="Type" allLabel="All types" options={FILTER_OPTS} value={filter} onChange={setFilter} />
            </Stack>
          </Spec>

          <Spec title="Dropdown menu">
            <Demo label="Trigger + items">
              <Dropdown trigger={({ isOpen, ...p }) => <Button variant="secondary" data-open={isOpen || undefined} {...p}>Open menu<Icon name="arrow_drop_down" /></Button>}>
                <DropdownItem icon="edit">Edit</DropdownItem>
                <DropdownItem icon="content_copy">Duplicate</DropdownItem>
                <DropdownItem icon="delete" tone="danger">Delete</DropdownItem>
              </Dropdown>
            </Demo>
          </Spec>

          <Spec title="Tabs">
            <Tabs value={tab} onChange={setTab}>
              <TabList label="Demo tabs">
                <Tab value="overview">Overview</Tab>
                <Tab value="details">Details</Tab>
              </TabList>
              <TabPanel value="overview"><p>Overview panel.</p></TabPanel>
              <TabPanel value="details"><p>Details panel.</p></TabPanel>
            </Tabs>
          </Spec>

          <Spec title="Alert">
            <Stack gap={2}>
              <Alert tone="neutral">Read-only view.</Alert>
              <Alert tone="info">Informational message.</Alert>
              <Alert tone="success" onDismiss={() => undefined}>Saved successfully.</Alert>
              <Alert tone="warning">Heads up, check this.</Alert>
              <Alert tone="danger" role="alert">Something went wrong.</Alert>
            </Stack>
          </Spec>

          <Spec title="ListItem">
            <Stack gap={1}>
              <ListItem>First item</ListItem>
              <ListItem>Second item</ListItem>
            </Stack>
          </Spec>

          <Spec title="Copy / Time / Highlight">
            <Demo label="Clipboard, timestamps, search hits">
              <CopyButton value="sk-live-2f8c41a9" label="Copy key" />
              <CopyButton value="https://example.com/invite/8f2a" />
              <Time value="2026-08-08T09:12:00.000Z" />
              <Highlight text="Onboarding checklist" query="onboard" />
            </Demo>
          </Spec>

          <Spec title="PasswordInput / CodeInput">
            <Stack gap={3}>
              <Field label="Password" htmlFor="pg-password">
                <PasswordInput id="pg-password" defaultValue="hunter2" autoComplete="off" />
              </Field>
              <Field label="Verification code" htmlFor="pg-code">
                <CodeInput value={code} onChange={setCode} label="Verification code" />
              </Field>
            </Stack>
          </Spec>

          <Spec title="LoadMore">
            <Stack gap={1}>
              <ListItem>Update 1</ListItem>
              <ListItem>Update 2</ListItem>
              <LoadMore hasMore label="Load more" onLoad={() => undefined} />
            </Stack>
          </Spec>

          <Spec title="PlanCard" wide>
            <Grid gap={4}>
              <PlanCard
                name="Team"
                price="$12"
                period="per seat, per month"
                features={['Up to 20 seats', 'Shared workspaces']}
                action={<Button variant="secondary" block>Choose Team</Button>}
              />
              <PlanCard
                name="Business"
                price="$29"
                period="per seat, per month"
                features={['Unlimited seats', 'SSO and SCIM', 'Audit log']}
                action={<Button variant="primary" block>Choose Business</Button>}
                recommended
              />
            </Grid>
          </Spec>

          <Spec title="Carousel" wide>
            <Carousel
              label="Customer stories"
              items={[
                { id: 'a', content: <Card><CardTitle as="h3">Nordwind</CardTitle><p>Two weeks from brief to prototype.</p></Card> },
                { id: 'b', content: <Card><CardTitle as="h3">Kestrel Labs</CardTitle><p>The review caught what our checklist did not.</p></Card> },
                { id: 'c', content: <Card><CardTitle as="h3">Aurora Health</CardTitle><p>One system across four products.</p></Card> },
              ]}
            />
          </Spec>

          <Spec title="Tooltip / Toast">
            <Demo label="Triggers">
              <Tooltip content="I'm a tooltip"><Button variant="secondary">Hover me</Button></Tooltip>
              <Button onClick={() => toast({ tone: 'success', title: 'Saved', description: 'Changes stored.' })}>Fire toast</Button>
              {/* A toast carrying an action stays up twice as long, so there is
                  time to reach the Undo before it goes. */}
              <Button
                variant="secondary"
                onClick={() => toast({
                  tone: 'info',
                  title: 'Report archived',
                  action: <Button size="sm" variant="secondary" onClick={() => undefined}>Undo</Button>,
                })}
              >
                Toast with action
              </Button>
            </Demo>
          </Spec>

          <Spec title="EmptyState">
            <Stack gap={4}>
              <EmptyState size="sm" icon="message" title="No conversations" description="Start a new chat." />
              <EmptyState icon="folder" title="No items" description="Nothing here yet." />
              <EmptyState size="lg" icon="check_circle" title="Inbox zero" description="You're all caught up." />
            </Stack>
          </Spec>

          <Spec title="ChatComposer / ChatMessage" wide>
            <Stack gap={3}>
              <ChatMessage role="user">How do I request leave?</ChatMessage>
              <ChatMessage role="assistant" text="Open the leave form and pick a type.">
                <p>Open the leave form and pick a type, then submit.</p>
              </ChatMessage>
              <ChatComposer onSend={(t) => toast({ tone: 'info', title: 'Sent', description: t })} />
            </Stack>
          </Spec>
        </Section>

        {/* ─────────────── ORGANISMS ─────────────── */}
        <Section id="organisms" title="Organisms">
          <Spec title="Card">
            <Card>
              <CardHeader><MetaItem appearance="eyebrow" icon="description">Document</MetaItem></CardHeader>
              <CardTitle>Q4 Sustainability Report</CardTitle>
              <CardMeta><Badge tone="success">Ready</Badge><MetaItem icon="schedule">May 15</MetaItem></CardMeta>
            </Card>
          </Spec>

          <Spec title="Modal / FeedbackModal / SidePanel">
            <Demo label="Open">
              <Button onClick={() => setModalOpen(true)}>Open modal</Button>
              <Button variant="secondary" onClick={() => setFeedbackOpen(true)}>Feedback modal</Button>
              <Button variant="ghost" onClick={() => setPanelOpen(true)}>Open side panel</Button>
            </Demo>
          </Spec>
        </Section>

        {/* ─────────────── LAYOUTS ─────────────── */}
        <Section id="layouts" title="Layouts (route demos)">
          <Spec title="Full-screen templates" wide>
            <p className="playground-hint">Open in a new view:</p>
            <Row>
              <Link className="pg-nav-link" to={ROUTES.login}>Login</Link>
              <Link className="pg-nav-link" to={ROUTES.content}>Content library</Link>
              <Link className="pg-nav-link" to={ROUTES.contentItem.replace(':id', '1')}>Content detail</Link>
              <Link className="pg-nav-link" to={ROUTES.assistant}>Assistant (chat)</Link>
              <Link className="pg-nav-link" to={ROUTES.profile}>Profile</Link>
              <Link className="pg-nav-link" to={ROUTES.forReview}>Placeholder / empty</Link>
            </Row>
          </Spec>
        </Section>
      </main>

      {panelOpen && (
        <SidePanel title="Side panel" onClose={() => setPanelOpen(false)} footer={<Button onClick={() => setPanelOpen(false)}>Done</Button>}>
          <SectionLabel>Body</SectionLabel>
          <p>Header / scrolling body / pinned footer.</p>
        </SidePanel>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm action"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => setModalOpen(false)}>Confirm</Button></>}
      >
        <p>Modal body. ESC, click outside, or × closes.</p>
      </Modal>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmit={() => { setFeedbackOpen(false); toast({ tone: 'success', title: 'Feedback sent' }) }} labels={{ title: 'What went wrong?', close: 'Close', send: 'Send', desc: 'Tell us what was off so we can improve.', detailsLabel: 'Details', detailsPlaceholder: 'Optional details…', reasons: { wrong: 'Wrong', incomplete: 'Incomplete', unclear: 'Unclear', other: 'Other' } }} />
    </>
  )
}
