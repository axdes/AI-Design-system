import './SystemPageTemplate.css'
import { type ReactNode } from 'react'
import { Page } from '../Page'
import { cn } from '../../lib/cn'

type Props = {
  /** The plain fact, GOV.UK style: "Page not found", "Sorry, there is a problem with the service". Never a code, never "Oops". */
  title: string
  /** The body: for a not-found page, the triage of the ways the user got here; for a failure, what to do and what happened to their answers. */
  children?: ReactNode
  /** How to reach a human — the recovery that always works. */
  contact?: ReactNode
  /** One onward action (home, search) for products where self-service recovery fits. */
  action?: ReactNode
  className?: string
}

/**
 * The SYSTEM page skeleton — not found, service unavailable, something broke:
 * a narrow centred column with the fact as its h1, the triage or the
 * consequences as body text, then contact and one onward action. No
 * breadcrumbs, no error codes, no apology graphics: the reader's questions
 * are "what happened, did you keep my answers, what do I do", in that order.
 *
 * Copy: say what happened and what the reader can do, in that order, without
 * blame or apology — "This page has moved" then the way onward. Never a
 * status code as the headline.
 */
export function SystemPageTemplate({ title, children, contact, action, className }: Props) {
  /* The geometry (narrow column, centred, the container context) is the
     `status` archetype's, held once in <Page> and in page-rules.json. What is
     left here is the ARRANGEMENT of a status page's content, which is this
     block's own subject. */
  return (
    <Page archetype="system" className={cn('system-page', className)}>
      <h1 className="system-page-title">{title}</h1>
      <div className="system-page-body">{children}</div>
      {contact && <div className="system-page-contact">{contact}</div>}
      {action && <div className="system-page-action">{action}</div>}
    </Page>
  )
}
