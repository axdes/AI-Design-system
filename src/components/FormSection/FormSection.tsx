import './FormSection.css'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { FormStack } from '../FormStack'

type Props = {
  /** The group's name: who or what these fields are about. */
  title: ReactNode
  /** One sentence on why the group exists, when the title cannot carry it. */
  description?: ReactNode
  /** The Field rows. */
  children: ReactNode
  className?: string
}

/* A form longer than a handful of fields is read in groups, and a group only
 * exists if it has a name. `<fieldset>` + `<legend>` is what makes that name
 * reach a screen reader: it is announced with every field inside, which a plain
 * heading above a div never is. This is the part hand-rolled sections always
 * drop, and the reason a hand-rolled section reads as one long undifferentiated
 * column to anyone not looking at it. */

/** One named group of fields inside a form: a `fieldset` with a visible legend,
 *  an optional sentence, and a `<FormStack>` of Fields inside. 
 *
 * Copy: the section title groups the questions under it in the reader's terms,
 * and the description says why they are asked together.
 */
export function FormSection({ title, description, children, className }: Props) {
  return (
    <fieldset className={cn('form-section', className)}>
      <legend className="form-section-title">{title}</legend>
      {description && <p className="form-section-desc">{description}</p>}
      <FormStack>{children}</FormStack>
    </fieldset>
  )
}
