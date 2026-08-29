import './AvatarGroup.css'
import { cn } from '../../lib/cn'
import { Avatar } from '../Avatar'

type Size = 'sm' | 'md' | 'lg'

export type AvatarGroupItem = { name: string; src?: string }

type Props = {
  items: AvatarGroupItem[]
  /** Show at most this many, then a "+N" overflow disc. Default 4. */
  max?: number
  /** The group's role on the screen: `sm` inside a row or a meta line, `lg` when the team is
   *  what the block is about. No middle position.
   */
  size?: Size
  className?: string
}

/* Overlapping stack of avatars with a "+N" overflow — a team, the people on a
 * thread. Presentational; the caller supplies the list. The overflow disc
 * carries the hidden count so it is not silent to a screen reader. */
export function AvatarGroup({ items, max = 4, size = 'md', className }: Props) {
  const shown = items.slice(0, max)
  const overflow = items.length - shown.length
  return (
    <div className={cn('avatar-group', className)} data-size={size}>
      {shown.map((item) => (
        <span className="avatar-group-item" key={item.name}>
          <Avatar name={item.name} src={item.src} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span className="avatar-group-item avatar-group-overflow" data-size={size}>
          +{overflow}
          <span className="sr-only">{overflow} more</span>
        </span>
      )}
    </div>
  )
}
