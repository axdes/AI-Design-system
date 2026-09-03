/* One rendered example per card family.
 *
 * Imports are RELATIVE, not through the `@` alias: this module is read from
 * outside the package too — the showcase's patterns page renders these — and
 * `@` means a different root there (2026-08-26).
 *
 * `card-rules.json` decides WHICH card a zone gets — 31 families, each with the
 * parts it may not ship without. What it could not do until now is SHOW one: a
 * family is a composition, not a component, so nothing in the system rendered a
 * cover card with its text on the picture, a person card with the face above
 * the name, or a card that opens. The site fell back to whichever component the
 * family names first, which for a third of them is <Card> — the same empty
 * surface over and over (owner, 2026-08-25).
 *
 * Every specimen is built ONLY from registry components, the same rule a
 * product is held to. If a family cannot be composed from them, that is a
 * finding about the system and belongs in `requests/`, not a div here.
 */
import { type ReactElement } from 'react'
import { Accordion } from '../components/Accordion'
import { ActionCard } from '../components/ActionCard'
import { CardStack } from '../components/CardStack'
import { ContentCard } from '../components/ContentCard'
import { DateBlock } from '../components/DateBlock'
import { Descriptions } from '../components/Descriptions'
import { EntityLink } from '../components/EntityLink'
import { Field } from '../components/Field'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { ListItem } from '../components/ListItem'
import { PlanCard } from '../components/PlanCard'
import { Progress } from '../components/Progress'
import { Quote } from '../components/Quote'
import { SelectableTile } from '../components/SelectableTile'
import { SetupGuide } from '../components/SetupGuide'
import { Table, TBody, Td, Th, THead, TableScroll, Tr } from '../components/Table'
import { Timeline } from '../components/Timeline'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card, CardMedia, CardMeta, CardTitle } from '../components/Card'
import { Identity } from '../components/Identity'
import { MetaItem } from '../components/MetaItem'
import { Prose } from '../components/Prose'
import { Sparkline } from '../components/Sparkline'
import { Stat } from '../components/Stat'
import { Row, Stack } from '../components/Layout'

const PHOTO = `${import.meta.env.BASE_URL}demo/coast.webp`
const FACE = `${import.meta.env.BASE_URL}demo/avatar-cleo.jpg`

export const CARD_SPECIMENS: Record<string, () => ReactElement> = {
  /* The face IS the card: portrait above the name, the role under it, one way
     to act. `vertical` is the one place <Identity> stands up. */
  person: () => (
    <Card>
      <Stack gap={4}>
        <Identity vertical size="xl" src={FACE} name="Cleo Nakamura" secondary="Field engineer" />
        <Button variant="secondary" block>Message</Button>
      </Stack>
    </Card>
  ),

  /* Text ON the picture, not beside it. The scrim is the component's, not a
     colour picked here: contrast over an unknown photograph is the hard part
     and it is exactly what the placement exists to solve. */
  cover: () => (
    <Card flush>
      <CardMedia placement="cover">
        <img src={PHOTO} alt="" width={640} height={360} />
        <Stack gap={1}>
          <Badge tone="primary" fill="soft">Field note</Badge>
          <CardTitle as="h3">Where the coast road ends</CardTitle>
          <MetaItem icon="schedule">Six minutes</MetaItem>
        </Stack>
      </CardMedia>
    </Card>
  ),

  /* ── one record ─────────────────────────────────────────────────────────── */

  /* What it is, what state it is in, the few fields that decide, one way in.
     Six fields is the ceiling: past that the reader is comparing, and comparing
     is a table's job (R1). */
  object: () => (
    <Card interactive>
      <Row gap={2} align="center">
        <CardTitle onSelect={() => undefined}>Northwind Paper</CardTitle>
        <Badge tone="success" fill="soft">Active</Badge>
      </Row>
      <Descriptions
        layout="inline"
        items={[
          { term: 'Account', value: 'ACC-4180' },
          { term: 'Owner', value: 'Ada Meridian' },
          { term: 'Renews', value: '12 September' },
        ]}
      />
    </Card>
  ),

  /* The state of one thing against its promise. The badge carries the verdict
     and the sentence carries the number it was measured against — a colour
     alone says "bad" without saying how bad or by how much. */
  health: () => (
    <Card>
      <Row gap={2} align="center">
        <CardTitle as="h3">Checkout latency</CardTitle>
        <Badge tone="warning" fill="soft">At risk</Badge>
      </Row>
      <Prose size="sm">420ms at the 95th percentile against a 300ms promise, for the last two hours.</Prose>
    </Card>
  ),

  /* A question put to THIS reader, answered on the spot. The card carries the
     context the answer needs, so nobody has to open anything to decide. */
  action: () => (
    <ActionCard
      eyebrow="Needs you"
      title="Approve the September rate card?"
      meta={<MetaItem icon="schedule">Raised 2 days ago</MetaItem>}
      actions={
        <>
          <Button size="sm">Approve</Button>
          <Button size="sm" variant="secondary">Ask a question</Button>
        </>
      }
    >
      <Prose size="sm">Three lines changed; the rest is last year&apos;s card unaltered.</Prose>
    </ActionCard>
  ),

  /* ── several things in one card ──────────────────────────────────────────── */

  /* A few items of one kind under a name for the set and a way to the rest.
     The count belongs on the link, not floating: "all 9" is the promise. */
  collection: () => (
    <Card flush>
      {/* No Stack: rows in a flush card carry their own rhythm and draw their
          own hairlines — wrapping them in a gapped column adds a second one. */}
      <ListItem icon="description">Q3 safety review</ListItem>
      <ListItem icon="description">Site access audit</ListItem>
      <ListItem icon="description">Contractor briefing</ListItem>
      <Button variant="link" size="sm">View all 9</Button>
    </Card>
  ),

  /* Rows with two or three comparable values each. A table inside a card, not a
     list pretending: the moment values line up in columns they are compared. */
  dataset: () => (
    <Card flush>
      <TableScroll label="Sites by open findings">
        <Table caption="Sites by open findings" captionHidden size="sm">
          <THead>
            <Tr><Th>Site</Th><Th align="end">Open</Th><Th align="end">Closed</Th></Tr>
          </THead>
          <TBody>
            <Tr><Th scope="row" emphasis>Bergen</Th><Td align="end">4</Td><Td align="end">31</Td></Tr>
            <Tr><Th scope="row" emphasis>Kestrel</Th><Td align="end">1</Td><Td align="end">28</Td></Tr>
            <Tr><Th scope="row" emphasis>Northwind</Th><Td align="end">7</Td><Td align="end">19</Td></Tr>
          </TBody>
        </Table>
      </TableScroll>
    </Card>
  ),

  /* What happened to one thing, in order, with who and when. */
  history: () => (
    <Card>
      <CardTitle as="h3">Contract ACC-4180</CardTitle>
      <Timeline
        items={[
          { id: '1', title: 'Signed', time: '12 August', icon: 'check' },
          { id: '2', title: 'Sent for counter-signature', time: '9 August', content: 'Ada Meridian' },
          { id: '3', title: 'Drafted', time: '2 August' },
        ]}
      />
    </Card>
  ),

  /* What changed in a period: unlike items under one date, which is what makes
     it a digest rather than a list of one kind. */
  digest: () => (
    <Card>
      <CardTitle as="h3">Since Monday</CardTitle>
      <Stack gap={3}>
        <ContentCard layout="row" density="dense" title="Two audits closed" meta={<MetaItem icon="check">Bergen, Kestrel</MetaItem>} />
        <ContentCard layout="row" density="dense" title="One contract signed" meta={<MetaItem icon="schedule">12 August</MetaItem>} />
        <ContentCard layout="row" density="dense" title="Three findings raised" meta={<MetaItem icon="warning">Northwind</MetaItem>} />
      </Stack>
    </Card>
  ),

  /* Many cards of one kind shown as one: the top card, the count, the way in. */
  stack: () => (
    <CardStack count={9} label="Open findings" onSelect={() => undefined} openLabel="Open all 9">
      <Card>
        <CardTitle as="h3">Access route blocked at gate 3</CardTitle>
        <CardMeta><MetaItem icon="schedule">Raised 2 days ago</MetaItem></CardMeta>
      </Card>
    </CardStack>
  ),

  /* ── a card that is a control ────────────────────────────────────────────── */

  /* One choice in a set, chosen by pressing the card itself. The whole surface
     is the control, which is why it is a component and not a card with a
     click handler. */
  option: () => (
    <SelectableTile
      name="plan"
      title="Team"
      icon="group"
      description="Up to 20 people, shared workspaces."
      meta="€24 per person"
      selected
      onSelect={() => undefined}
    />
  ),

  /* A place to go, saying what is waiting inside it. */
  entry: () => (
    <EntityLink
      view="card"
      href="#"
      icon="folder"
      title="Bergen site"
      status={<Badge tone="warning" fill="soft">4 open</Badge>}
      meta={<MetaItem icon="schedule">Visited yesterday</MetaItem>}
    />
  ),

  /* The steps of a first run, with the state of each and one control per step. */
  checklist: () => (
    <SetupGuide
      title="Finish setting up"
      steps={[
        { id: '1', label: 'Add your team', detail: 'They see the same board.', done: true },
        { id: '2', label: 'Connect a calendar', detail: 'Meetings arrive on their own.', action: <Button size="sm" variant="secondary">Connect</Button> },
        { id: '3', label: 'Set a weekly digest', action: <Button size="sm" variant="secondary">Choose a day</Button> },
      ]}
    />
  ),

  /* A learning unit: what it is, how long, how far the reader got, and the one
     control that continues. Progress is the point — a course card without it is
     a story card with a duration. */
  course: () => (
    <Card>
      <CardTitle as="h3">Reading a site audit</CardTitle>
      <Progress value={40} max={100} label="4 of 10 lessons" showValue />
      <CardMeta>
        <MetaItem icon="schedule">35 minutes left</MetaItem>
        <Button variant="link" size="sm">Continue</Button>
      </CardMeta>
    </Card>
  ),

  /* A card that opens: the summary is always readable, the detail is one press
     away, and nothing is hidden that a reader needs to decide. */
  expandable: () => (
    <Card>
      <Accordion
        items={[
          { id: 'a', title: 'Retention', content: 'Kept for seven years, then removed automatically.' },
          { id: 'b', title: 'Access', content: 'Two named roles, reviewed each quarter.' },
        ]}
      />
    </Card>
  ),

  /* A number and its shape over time. The trend is the point: a figure without
     one says how much and never whether that is good. */
  analytical: () => (
    <Card>
      <Stack gap={3}>
        <CardTitle as="h3">Weekly submissions</CardTitle>
        <Row gap={4} align="end">
          <Stat size="lg" value="1,284" caption="this week" />
          <Sparkline values={[8, 11, 9, 14, 13, 18, 21]} label="Submissions over seven weeks" area />
        </Row>
        <CardMeta><MetaItem icon="schedule">Updated an hour ago</MetaItem></CardMeta>
      </Stack>
    </Card>
  ),

  /* One value, read at a glance and acted on elsewhere. */
  kpi: () => (
    <Card>
      <Stat size="lg" value="98.4%" caption="within target" />
    </Card>
  ),

  /* The picture identifies the thing; the words only name it. */
  media: () => (
    <Card flush>
      <CardMedia placement="top">
        <img src={PHOTO} alt="" width={640} height={360} />
      </CardMedia>
      <Stack gap={1}>
        <CardTitle as="h3">Coast survey, plate 4</CardTitle>
        <Prose size="sm">Shot at first light, before the tide turned.</Prose>
      </Stack>
    </Card>
  ),
  /* ── the card lends its chrome ───────────────────────────────────────────── */

  /* Content that is not ours — a video, a map, a slide deck. The card carries
     the title and the frame; the thing inside keeps its own aspect. */
  embed: () => (
    <Card flush>
      <CardMedia placement="top" ratio="16/9" playable duration="4:12">
        <img src={PHOTO} alt="" width={640} height={360} />
      </CardMedia>
      <Stack gap={1}>
        <CardTitle as="h3">Walking the coast road</CardTitle>
        <MetaItem icon="schedule">4 minutes</MetaItem>
      </Stack>
    </Card>
  ),

  /* A pointer to something that lives elsewhere, with enough of it to decide
     whether to follow. The meta says WHERE, which is the whole difference
     between a preview and a story card. */
  preview: () => (
    <Card interactive>
      <Row gap={3} align="start">
        <Icon name="article" />
        <Stack gap={1}>
          <CardTitle onSelect={() => undefined}>Site access is changing in October</CardTitle>
          <Prose size="sm">Contractors will badge in at gate 1 only.</Prose>
          <MetaItem icon="folder">Operations handbook</MetaItem>
        </Stack>
      </Row>
    </Card>
  ),

  /* ── the marketing set ──────────────────────────────────────────────────── */

  /* Picture, headline, the first sentences, one way in. */
  story: () => (
    <ContentCard
      eyebrow="Field note"
      title="Where the coast road ends"
      excerpt="Two sites closed their findings early, and the reason turned out to be the same in both."
      media={<img src={PHOTO} alt="" width={640} height={360} />}
      meta={<MetaItem icon="schedule">19 February</MetaItem>}
      onSelect={() => undefined}
    />
  ),

  /* One thing the product does: a mark, a name, one line. It lives in a set of
     three or four, so it says one thing and stops. */
  feature: () => (
    <Card>
      <Stack gap={2}>
        <Icon name="auto_awesome" />
        <CardTitle as="h3">Findings close themselves</CardTitle>
        <Prose size="sm">When the evidence arrives, the finding moves. Nobody chases it.</Prose>
      </Stack>
    </Card>
  ),

  /* Client, task, result in a number. The number is the argument; the sentence
     is what makes it believable. */
  case: () => (
    <Card>
      <Stack gap={3}>
        <MetaItem appearance="eyebrow">Northwind Paper</MetaItem>
        <Stat value="21 → 6" caption="Days to close a finding" />
        <Prose size="sm">One change: the evidence is attached where the work happens.</Prose>
      </Stack>
    </Card>
  ),

  /* One number as an argument, in a row of three or four. No card: a proof
     point standing on its own surface is a Stat, and wrapping it in a box makes
     a row of four look like a dashboard. */
  proof: () => (
    <Stat value="99.95%" caption="Uptime, last twelve months" size="lg" />
  ),

  /* The words of someone who used the thing, with who they are. The attribution
     is not optional: an unattributed quote is copy. */
  testimonial: () => (
    <Card>
      <Quote by="Ada Meridian" source="Head of operations, Northwind Paper">
        We stopped arguing about whether a finding was closed. The evidence is on the finding.
      </Quote>
    </Card>
  ),


  /* One plan in a pricing row. */
  plan: () => (
    <PlanCard
      name="Team"
      price="€24"
      period="per person, per month"
      description="For a site team that shares one board."
      features={['Up to 20 people', 'Shared findings', 'Weekly digest', 'Single sign-on']}
      action={<Button block>Choose Team</Button>}
      recommended
    />
  ),

  /* What we give, on what condition, until when, and one action. The condition
     and the deadline are the card: an offer without them is a feature. */
  offer: () => (
    <Card>
      <Stack gap={3}>
        <Badge tone="primary" fill="soft">Until 30 September</Badge>
        <CardTitle as="h3">Two months free on an annual plan</CardTitle>
        <Prose size="sm">For teams of ten or more. The discount applies to the first invoice.</Prose>
        <Button block>Start an annual plan</Button>
      </Stack>
    </Card>
  ),

  /* When it happens, what it is, where, and how to be there. The date is a
     block the eye lands on first — that is what <DateBlock> is for. */
  event: () => (
    <Card>
      <Row gap={4} align="start">
        <DateBlock value="2026-09-18" />
        <Stack gap={1}>
          <CardTitle as="h3">Site audit walkthrough</CardTitle>
          <MetaItem icon="location_on">Bergen, gate 1</MetaItem>
          <Button size="sm" variant="secondary">Add to calendar</Button>
        </Stack>
      </Row>
    </Card>
  ),

  /* Two columns in one card: before and after, ours and theirs. Two columns,
     never three — at three it is a comparison TABLE and belongs in one. */
  comparison: () => (
    <Card>
      <CardTitle as="h3">Before and after</CardTitle>
      <Descriptions
        columnCount={2}
        items={[
          { term: 'Days to close', value: '21 → 6' },
          { term: 'Chasing emails', value: '14 → 0' },
          { term: 'Evidence attached', value: '38% → 96%' },
          { term: 'Reopened', value: '9 → 1' },
        ]}
      />
    </Card>
  ),

  /* One promise, one field, one button, and the truth about what arrives. The
     last part is the one that gets left off, and it is the one that decides
     whether the address is real. */
  capture: () => (
    <Card>
      <Stack gap={3}>
        <CardTitle as="h3">The weekly digest</CardTitle>
        <Field label="Work email" htmlFor="capture-email" hint="One email on Mondays. Nothing else, ever.">
          <Input id="capture-email" type="email" autoComplete="email" placeholder="ada@example.com" />
        </Field>
        <Button block>Subscribe</Button>
      </Stack>
    </Card>
  ),
}
