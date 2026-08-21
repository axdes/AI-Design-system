/* Golden example. The copy IS the pattern (GOV.UK's problem-page): the fact as
 * the title, what to do, what happened to the user's answers — the question
 * every failure page gets asked — then contact. For a not-found page the body
 * becomes the three-way triage (typed it / pasted it / followed a link). */
import { Button } from '../../components/Button'
import { SystemPageTemplate } from './SystemPageTemplate'

export function Example() {
  return (
    <SystemPageTemplate
      title="Sorry, there is a problem with the service"
      contact={<p>If it keeps happening, contact the service desk and name this page.</p>}
      action={<Button variant="secondary">Back to the start</Button>}
    >
      <p>Try again later.</p>
      <p>We saved your answers. They will be available for 30 days.</p>
    </SystemPageTemplate>
  )
}
