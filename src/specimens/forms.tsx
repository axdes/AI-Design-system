/* One rendered example per form KIND.
 *
 * `form-rules.json` decides WHICH form a zone gets — 18 kinds, each with the
 * parts it may not ship without. What it could not do is SHOW one: a kind is a
 * composition, not a component, so nothing in the system rendered a bulk edit,
 * a check-answers step or a filter bar as the RULES describe them. The card
 * families got their 31 specimens on 2026-08-26; forms and tables had none at
 * all, which is the same gap one layer over (owner, the same day).
 *
 * Imports are RELATIVE: this module is read from outside the package too, and
 * `@` means a different root there.
 *
 * Every specimen is built ONLY from registry parts, the rule a product is held
 * to. Page-sized kinds show their SHAPE rather than a whole screen — the point
 * is which form this is, not a second copy of the template's own example.
 *
 * A dialog is drawn as a SURFACE, not opened as one. `<Modal open>` portals a
 * full-screen overlay, so a specimen that really opens one blankets whatever
 * page is showing it and swallows every click on the rest of the screen —
 * measured on the patterns page, 2026-08-26. What the kind is about is the
 * shape of the question and its two answers, and that survives being shown flat.
 */
import { type ReactElement } from 'react'
import { Alert } from '../components/Alert'
import { BatchActions } from '../components/BatchActions'
import { Button } from '../components/Button'
import { Card, CardTitle } from '../components/Card'
import { ChatComposer } from '../components/ChatComposer'
import { Chip } from '../components/Chip'
import { Field } from '../components/Field'
import { FileUpload } from '../components/FileUpload'
import { FilterBar } from '../components/FilterBar'
import { FormSection } from '../components/FormSection'
import { FormStack } from '../components/FormStack'
import { Input } from '../components/Input'
import { InlineText } from '../components/InlineText'
import { Row, Stack } from '../components/Layout'
import { Prose } from '../components/Prose'
import { SaveStatus } from '../components/SaveStatus'
import { SearchInput } from '../components/SearchInput'
import { Select } from '../components/Select'
import { Stepper } from '../components/Stepper'
import { Switch } from '../components/Switch'
import { Textarea } from '../components/Textarea'
import { WizardReview, WizardReviewRow } from '../blocks/WizardTemplate'

const noop = () => undefined

export const FORM_SPECIMENS: Record<string, () => ReactElement> = {
  /* Opened from a list, so the list stays the context behind it. Up to eight
     routine fields; past that a dialog scrolls its own actions off screen. */
  dialog: () => (
    <Card>
      <Stack gap={4}>
        <CardTitle as="h3">Add a supplier</CardTitle>
        <FormStack>
          <Field label="Name" htmlFor="f-dialog-name"><Input id="f-dialog-name" defaultValue="Northwind Paper" /></Field>
          <Field label="Country" htmlFor="f-dialog-country">
            <Select label="Country" id="f-dialog-country" value="no" onChange={noop} options={[{ value: 'no', label: 'Norway' }]} />
          </Field>
        </FormStack>
        <Row gap={2}><Button variant="ghost" onClick={noop}>Cancel</Button><Button onClick={noop}>Add supplier</Button></Row>
      </Stack>
    </Card>
  ),

  /* The same form beside the record instead of over it, for when the context
     has to stay readable while the answer is written. */
  panel: () => (
    <Card>
      <CardTitle as="h3">Edit supplier</CardTitle>
      <FormStack>
        <Field label="Name" htmlFor="f-panel-name"><Input id="f-panel-name" defaultValue="Northwind Paper" /></Field>
        <Row gap={2}><Button onClick={noop}>Save</Button><Button variant="ghost" onClick={noop}>Cancel</Button></Row>
      </FormStack>
    </Card>
  ),

  /* Page-sized: sections under a header, the commitment in a foot that stays.
     The shape, not the whole page — FormPageTemplate's own example is that. */
  page: () => (
    <Stack gap={6}>
      <FormSection title="Identity" description="What this supplier is called, and who owns the relationship.">
        <FormStack>
          <Field label="Name" htmlFor="f-page-name"><Input id="f-page-name" defaultValue="Northwind Paper" /></Field>
          <Field label="Account owner" htmlFor="f-page-owner"><Input id="f-page-owner" autoComplete="name" defaultValue="Ada Meridian" /></Field>
        </FormStack>
      </FormSection>
      <Row gap={2}><Button onClick={noop}>Save supplier</Button><Button variant="ghost" onClick={noop}>Cancel</Button></Row>
    </Stack>
  ),

  /* One task, revealed a step at a time, with the map always visible. */
  wizard: () => (
    <Stack gap={6}>
      <Stepper steps={[{ label: 'Details' }, { label: 'Terms' }, { label: 'Check' }]} current={1} label="Onboarding" />
      <FormStack>
        <Field label="Payment terms" htmlFor="f-wiz-terms">
          <Select label="Payment terms" id="f-wiz-terms" value="30" onChange={noop} options={[{ value: '30', label: 'Net 30' }]} />
        </Field>
      </FormStack>
      <Row gap={2}><Button variant="secondary" onClick={noop}>Back</Button><Button onClick={noop}>Next</Button></Row>
    </Stack>
  ),

  /* One question per screen: the whole surface asks one thing, and Continue
     sits under it. For a decision that deserves no distraction. */
  question: () => (
    <Stack gap={6}>
      <CardTitle as="h2">Does this supplier ship outside the EU?</CardTitle>
      <Row gap={2}><Button onClick={noop}>Yes</Button><Button variant="secondary" onClick={noop}>No</Button></Row>
    </Stack>
  ),

  /* Every answer restated before an irreversible commit, each one changeable
     from here — re-asking what was answered is the WCAG 2.2 redundant-entry
     failure, and the summary is where it is usually broken. */
  review: () => (
    <Stack gap={4}>
      <CardTitle as="h3">Check your answers</CardTitle>
      <WizardReview>
        <WizardReviewRow label="Name" onEdit={noop}>Northwind Paper</WizardReviewRow>
        <WizardReviewRow label="Country" onEdit={noop}>Norway</WizardReviewRow>
        <WizardReviewRow label="Payment terms" onEdit={noop}>Net 30</WizardReviewRow>
      </WizardReview>
      <Button onClick={noop}>Create supplier</Button>
    </Stack>
  ),

  /* Grouped knobs, each applied on its own — no submit, because a settings page
     that batches its changes makes the reader remember what they turned. */
  settings: () => (
    <Card>
      <CardTitle as="h3">Notifications</CardTitle>
      <Stack gap={4}>
        <Switch label="Weekly digest" checked onChange={noop} />
        <Switch label="Someone mentions me" checked onChange={noop} />
      </Stack>
    </Card>
  ),

  /* Sign in, sign up, reset, verify: one column, one job, no navigation. */
  auth: () => (
    <Card>
      <Stack gap={4}>
        <CardTitle as="h2">Sign in</CardTitle>
        <FormStack>
          <Field label="Work email" htmlFor="f-auth-email"><Input id="f-auth-email" type="email" autoComplete="email" /></Field>
          <Field label="Password" htmlFor="f-auth-pw"><Input id="f-auth-pw" type="password" autoComplete="current-password" /></Field>
        </FormStack>
        <Button block onClick={noop}>Sign in</Button>
      </Stack>
    </Card>
  ),

  /* One field edited where it is read: the same element becomes editable, so
     nothing moves and the reader keeps their place. */
  inline: () => (
    <Card>
      <Stack gap={2}>
        <CardTitle as="h3"><InlineText value="Quarterly safety review" onSave={noop} label="Recording title" /></CardTitle>
      </Stack>
    </Card>
  ),

  /* One change applied to the rows the reader picked. The count is the subject
     of the sentence: what is about to happen, and to how many. */
  bulk: () => (
    <Stack gap={4}>
      <BatchActions count={4} onClear={noop}>
        <Button variant="secondary" size="sm" onClick={noop}>Approve</Button>
      </BatchActions>
      <Card>
        <Stack gap={3}>
          <CardTitle as="h3">Approve 4 invoices?</CardTitle>
          <Prose size="sm">They move to Paid and the suppliers are notified. This cannot be undone.</Prose>
          <Row gap={2}><Button variant="ghost" onClick={noop}>Cancel</Button><Button onClick={noop}>Approve 4</Button></Row>
        </Stack>
      </Card>
    </Stack>
  ),

  /* Editing across a collection, in the cells themselves — the grid IS the
     form, so there is no separate one. */
  grid: () => (
    <Card flush>
      <Alert tone="info" compact>Cells with a value open on a click; Enter and typing work too.</Alert>
    </Card>
  ),

  /* Yes or no on a stated consequence. Small by design: one question, two
     answers, and the sentence says what is lost. */
  confirm: () => (
    <Card>
      <Stack gap={3}>
        <CardTitle as="h3">Delete this recording?</CardTitle>
        <Prose size="sm">&quot;Quarterly safety review&quot; and its transcript are deleted. This cannot be undone.</Prose>
        <Row gap={2}><Button variant="ghost" onClick={noop}>Cancel</Button><Button variant="destructive" onClick={noop}>Delete</Button></Row>
      </Stack>
    </Card>
  ),

  /* Destruction gated behind typing the thing's own name: the pause is the
     point, and the button stays disabled until the words match. */
  'verified-confirm': () => (
    <Card>
      <Stack gap={3}>
        <CardTitle as="h3">Delete the Bergen workspace?</CardTitle>
        <FormStack>
          <Field label="Type Bergen to confirm" htmlFor="f-vc"><Input id="f-vc" placeholder="Bergen" /></Field>
        </FormStack>
        <Row gap={2}><Button variant="ghost" onClick={noop}>Cancel</Button><Button variant="destructive" disabled onClick={noop}>Delete workspace</Button></Row>
      </Stack>
    </Card>
  ),

  /* Files plus the metadata that describes them — the limits stated before the
     choosing, not discovered by failing. */
  upload: () => (
    <FileUpload
      label="Evidence"
      hint="PDF or PNG, up to 10 MB each."
      accept=".pdf,.png"
      multiple
      onChange={noop}
    />
  ),

  /* A long form that saves itself and can be left. The status is the promise:
     a draft with no visible save state is a form nobody dares leave. */
  draft: () => (
    <Stack gap={4}>
      <Row gap={3} align="center"><CardTitle as="h3">Incident report</CardTitle><SaveStatus state="saved" at="2 minutes ago" /></Row>
      <FormStack>
        <Field label="What happened" htmlFor="f-draft"><Textarea id="f-draft" rows={4} /></Field>
      </FormStack>
    </Stack>
  ),

  /* Free text plus attachments, SENT rather than saved — which is why it has a
     send control and no submit button. */
  composer: () => (
    <ChatComposer value="" onChange={noop} onSend={noop} placeholder="Ask about a supplier, a finding or an invoice" />
  ),

  /* Input that narrows a collection already on screen. It never navigates: the
     result appears behind it, so the reader sees what their choice did. */
  filter: () => (
    <FilterBar activeCount={2} onClear={noop}>
      <Chip selected onClick={noop}>Overdue</Chip>
      <Chip selected onClick={noop}>Bergen</Chip>
    </FilterBar>
  ),

  /* One query field, submitted to find. It names what it searches, so a screen
     with two searches is two different controls. */
  search: () => (
    <SearchInput placeholder="Search invoices" onClear={noop} />
  ),
}
