/* One rendered example per CONTROL kind.
 *
 * `control-rules.json` decides what a FIELD is made of — 24 kinds, each from
 * what the value TAKES. It is the fifth decision layer to get specimens and the
 * first to have been written after the audit that produced it: eight of these
 * components existed and no rule named any of them, which is why every screen
 * that needed one reached for the nearest field it remembered.
 *
 * A control is shown inside its <Field> where the rules say it owes one, because
 * half of what a kind decides is how the value is LABELLED — a switch is named
 * by the setting it is, a search box by what it searches, and everything else by
 * a label tied to it by id.
 *
 * Uncontrolled on purpose, and stateless: these are pictures of a decision, not
 * a form. A specimen is a plain lowercase function, so it is not a component and
 * may not hold a hook — the sliders show a fixed value with `showValue`, which
 * is the part of them the rules are actually about.
 *
 * Imports are RELATIVE: read from outside the package too.
 */
import { type ReactElement } from 'react'
import { ChatComposer } from '../components/ChatComposer'
import { Checkbox } from '../components/Checkbox'
import { CodeInput } from '../components/CodeInput'
import { ColorSwatch } from '../components/ColorSwatch'
import { Combobox } from '../components/Combobox'
import { ConditionalReveal } from '../components/ConditionalReveal'
import { DatePicker } from '../components/DatePicker'
import { DateRangePicker } from '../components/DateRangePicker'
import { Field } from '../components/Field'
import { FileUpload } from '../components/FileUpload'
import { Input } from '../components/Input'
import { InputGroup } from '../components/InputGroup'
import { Row, Stack } from '../components/Layout'
import { NumberInput } from '../components/NumberInput'
import { PasswordInput } from '../components/PasswordInput'
import { Radio } from '../components/Radio'
import { RangeSlider } from '../components/RangeSlider'
import { Rating } from '../components/Rating'
import { SearchInput } from '../components/SearchInput'
import { SegmentedControl } from '../components/SegmentedControl'
import { Select } from '../components/Select'
import { SelectableTile } from '../components/SelectableTile'
import { Slider } from '../components/Slider'
import { Switch } from '../components/Switch'
import { TagInput } from '../components/TagInput'
import { Textarea } from '../components/Textarea'

const noop = () => undefined
/* Fixed dates, built once at module scope: a specimen that calls `new Date()`
   while rendering is a component that is not pure, and the linter says so. */
const DAY = new Date(2026, 2, 19)
const MONTH_START = new Date(2026, 2, 1)
const MONTH_END = new Date(2026, 2, 31)

export const CONTROL_SPECIMENS: Record<string, () => ReactElement> = {
  /* One line the reader writes. The label names the value, not the act of
     entering it. */
  text: () => (
    <Field label="Supplier name" htmlFor="c-text">
      <Input id="c-text" defaultValue="Northwind Paper" />
    </Field>
  ),

  /* Prose, with the cap said as it is typed rather than on submit. */
  'long-text': () => (
    <Field label="Why this exception" htmlFor="c-long" hint="Up to 140 characters.">
      <Textarea id="c-long" rows={3} defaultValue="The supplier missed the window twice in one quarter." />
    </Field>
  ),

  /* The digits are the point, so they can be typed and stepped. */
  number: () => (
    <Field label="People on the team" htmlFor="c-number">
      <NumberInput id="c-number" value={12} onChange={noop} min={1} step={1} label="People on the team" />
    </Field>
  ),

  /* A number that is nothing without its unit, and the unit is attached to the
     field rather than left in the label. */
  amount: () => (
    <Field label="Monthly budget" htmlFor="c-amount">
      <InputGroup prefix="€" suffix="per person">
        <NumberInput id="c-amount" value={24} onChange={noop} min={0} label="Monthly budget" />
      </InputGroup>
    </Field>
  ),

  /* A position on a scale. The readout is not decoration: a track with no number
     beside it is a value the reader cannot check. */
  bounded: () => (
    <Field label="Match threshold" htmlFor="c-bounded">
      <Slider id="c-bounded" value={60} onChange={noop} min={0} max={100} label="Match threshold" showValue />
    </Field>
  ),

  /* Two ends of one decision, ordered against each other. */
  span: () => (
    <RangeSlider value={[20, 70]} onChange={noop} min={0} max={100} label="Price" showValue />
  ),

  /* Few enough that comparing them is part of choosing. */
  choice: () => (
    <Field label="Priority">
      <Stack gap={2}>
        <Radio name="c-choice" value="low" label="Low" defaultChecked />
        <Radio name="c-choice" value="normal" label="Normal" />
        <Radio name="c-choice" value="urgent" label="Urgent" />
      </Stack>
    </Field>
  ),

  /* The same shape when the options are VIEWS of one thing and switching is
     instant — which is what separates a segmented control from a radio group. */
  'choice-visual': () => (
    <Stack gap={4}>
      <Field label="Plan">
        <Row gap={3}>
          <SelectableTile name="c-visual" title="Team" description="Up to 20 people" selected onSelect={noop} />
          <SelectableTile name="c-visual" title="Scale" description="Unlimited people" selected={false} onSelect={noop} />
        </Row>
      </Field>
      {/* The same decision at its smallest: a colour is recognised by its look
          and still carries a name, for anyone who cannot see it. */}
      <Field label="Label colour">
        <Row gap={2}>
          <ColorSwatch value="#4638d3" label="Indigo" selected onSelect={noop} />
          <ColorSwatch value="#0f7b6c" label="Teal" onSelect={noop} />
          <ColorSwatch value="#b54708" label="Amber" onSelect={noop} />
        </Row>
      </Field>
    </Stack>
  ),

  /* Too many to lay out, few enough to scroll. */
  'choice-long': () => (
    <Field label="Area" htmlFor="c-long-choice">
      <Select
        id="c-long-choice"
        label="Area"
        value="central"
        onChange={noop}
        options={[
          { value: 'central', label: 'Central' },
          { value: 'dhahran', label: 'Dhahran' },
          { value: 'northern', label: 'Northern' },
          { value: 'southern', label: 'Southern' },
          { value: 'western', label: 'Western' },
          { value: 'offshore', label: 'Offshore' },
        ]}
      />
    </Field>
  ),

  /* Past a menu's worth, the reader types. */
  'choice-searched': () => (
    <Combobox
      label="Recipient role"
      onChange={noop}
      options={[
        { value: 'sup', label: '911 Supervisor' },
        { value: 'cemac', label: 'CEMAC' },
        { value: 'gadir', label: 'GA DIR' },
        { value: 'frpvp', label: 'FrP VP' },
      ]}
    />
  ),

  /* Several from a set the screen knows. The group carries the question. */
  choices: () => (
    <Field label="Notify by">
      <Stack gap={2}>
        <Checkbox label="Email" defaultChecked />
        <Checkbox label="SMS" />
        <Checkbox label="Teams" defaultChecked />
      </Stack>
    </Field>
  ),

  /* Several the reader invents, each removable on its own. */
  tags: () => (
    <TagInput value={['audit', 'quarterly']} onChange={noop} label="Keywords" />
  ),

  /* Applies the moment it is flipped, so it is named as a state and needs no
     Save beside it — and no Field, because the setting IS the label. */
  toggle: () => <Switch checked onChange={noop} label="Weekly digest" />,

  /* Looks the same, promises the opposite: this one is carried by the form's
     Save. Stated in the positive, and the whole label is the target. */
  agreement: () => (
    <Field label="Terms">
      <Checkbox label="Send me the monthly summary" defaultChecked />
    </Field>
  ),

  /* A day, typed or picked. */
  date: () => (
    <Field label="Effective from" htmlFor="c-date">
      <DatePicker id="c-date" value={DAY} onChange={noop} label="Effective from" />
    </Field>
  ),

  /* Two dates that are one decision, with the band between them painted. */
  'date-span': () => (
    <DateRangePicker value={{ start: MONTH_START, end: MONTH_END }} onChange={noop} label="Reporting period" />
  ),

  /* A clock time. `type="time"` brings the platform's own keyboard with it —
     there is no separate component, and there used to be. */
  time: () => (
    <Field label="Starts at" htmlFor="c-time">
      <Input id="c-time" type="time" defaultValue="09:30" />
    </Field>
  ),

  /* What is accepted and how large, said before the reader picks. */
  file: () => (
    <FileUpload label="Evidence" hint="PDF or PNG, up to 5 MB." accept=".pdf,.png" onFiles={noop} />
  ),

  /* Never a plain field, and always revealable. */
  secret: () => (
    <Field label="Password" htmlFor="c-secret">
      <PasswordInput id="c-secret" defaultValue="correct horse" />
    </Field>
  ),

  /* One box per character, and a paste fills them all. */
  code: () => (
    <CodeInput length={6} value="4172" onChange={noop} label="Verification code" />
  ),

  /* A small familiar scale, said in words as well as in marks. */
  score: () => (
    <Field label="How useful was this">
      <Rating value={4} max={5} onChange={noop} label="How useful was this" />
    </Field>
  ),

  /* Narrows what is on screen, so it carries no Field and no label above it:
     the placeholder says what is searched. */
  query: () => <SearchInput aria-label="Search suppliers" placeholder="Search 240 suppliers" />,

  /* The whole zone is the control, and the answer goes off at once. */
  message: () => <ChatComposer placeholder="Ask about this record…" onSend={noop} />,

  /* Present only while the option it belongs to is chosen, and rendered under
     it so the connection is spatial rather than remembered. */
  dependent: () => (
    <Field label="Reason">
      <Stack gap={2}>
        <Radio name="c-dependent" value="known" label="Known issue" />
        <Radio name="c-dependent" value="other" label="Other" defaultChecked />
        <ConditionalReveal when>
          <Field label="Say which" htmlFor="c-dependent-why">
            <Input id="c-dependent-why" defaultValue="Supplier changed the packaging" />
          </Field>
        </ConditionalReveal>
      </Stack>
    </Field>
  ),

  /* Views of one thing, switched instantly, and applied without a Save — which
     is the whole difference from `choice`. */
  'choice-view': () => (
    <SegmentedControl
      value="board"
      onChange={noop}
      label="View"
      options={[
        { value: 'list', label: 'List' },
        { value: 'board', label: 'Board' },
        { value: 'calendar', label: 'Calendar' },
      ]}
    />
  ),

}
