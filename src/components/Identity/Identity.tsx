import './Identity.css'
import { type ReactNode } from 'react'
import { Avatar } from '../Avatar'
import { cn } from '../../lib/cn'

type Props = {
  /** The person's (or team's) name — the identity's strongest line. ReactNode so a card can pass its own CardTitle. */
  name: ReactNode
  /** The plain-string name the Avatar falls back to when `name` is rich markup. Required then. */
  avatarName?: string
  /** The second line: a role, an email — one, not both. */
  secondary?: ReactNode
  src?: string
  size?: 'sm' | 'md' | 'lg'
  /** A person is recognised face-BESIDE-name; `vertical` is for the one place a profile is the hero (a profile card), never for lists. */
  vertical?: boolean
  className?: string
}

/**
 * A person as one glance: avatar beside name and secondary line — the face
 * next to the name, never a face floating a row above it. Consolidated from
 * the showcase's and a second product's hand-rolled identity blocks.
 */
export function Identity({ name, avatarName, secondary, src, size = 'md', vertical, className }: Props) {
  const plain = avatarName ?? (typeof name === 'string' ? name : '')
  return (
    <span className={cn('identity', className)} data-size={size} data-vertical={vertical || undefined}>
      <Avatar name={plain} src={src} size={size} />
      <span className="identity-who">
        <span className="identity-name">{name}</span>
        {secondary && <span className="identity-secondary">{secondary}</span>}
      </span>
    </span>
  )
}
