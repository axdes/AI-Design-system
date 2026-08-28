import './Identity.css'
import { type ReactNode } from 'react'
import { Avatar } from '../Avatar'
import { cn } from '../../lib/cn'

type Props = {
  /** The person's (or team's) name — the identity's strongest line. ReactNode so a card can pass its own CardTitle. */
  name: ReactNode
  /** The plain-string name the Avatar falls back to when `name` is rich markup. Required then. */
  avatarName?: string
  /**
   * Under the name: a role, an email. One line below `2xl`, where the row has
   * to stay one row; at `2xl` the identity IS the subject of the page and the
   * lines stack, because a profile shows the role AND the address and neither
   * is the other's tail.
   */
  secondary?: ReactNode
  src?: string
  /** How big the face is. `xl` is the hero: a portrait a card is built around,
   *  which is what the vertical form is for. Avatar carries the scale; Identity
   *  only refused to ask for the top of it (owner, 2026-08-22). */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** A person is recognised face-BESIDE-name; `vertical` is for the one place a profile is the hero (a profile card), never for lists. */
  vertical?: boolean
  /**
   * One control pinned to the face's trailing-bottom corner — changing the
   * picture, and nothing else. It carries a ring in the surface colour so it
   * reads as sitting ON the avatar rather than beside it. Three products had
   * hand-rolled the same overlay before this existed.
   */
  action?: ReactNode
  className?: string
}

/**
 * A person as one glance: avatar beside name and secondary line — the face
 * next to the name, never a face floating a row above it. Consolidated from
 * the showcase's and a second product's hand-rolled identity blocks.
 *
 * Copy: the name as the person writes it, and the secondary line is what they do
 * here, not their whole title. Two lines, both short: this is a face with
 * a name, not a profile.
 */
export function Identity({ name, avatarName, secondary, src, size = 'md', vertical, action, className }: Props) {
  const plain = avatarName ?? (typeof name === 'string' ? name : '')
  return (
    <span className={cn('identity', className)} data-size={size} data-vertical={vertical || undefined}>
      {action ? (
        <span className="identity-face">
          <Avatar name={plain} src={src} size={size} />
          <span className="identity-action">{action}</span>
        </span>
      ) : (
        <Avatar name={plain} src={src} size={size} />
      )}
      <span className="identity-who">
        <span className="identity-name">{name}</span>
        {secondary && <span className="identity-secondary">{secondary}</span>}
      </span>
    </span>
  )
}
