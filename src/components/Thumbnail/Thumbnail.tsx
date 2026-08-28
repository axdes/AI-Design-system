import './Thumbnail.css'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Icon, type IconName } from '../Icon'

type Size = 'sm' | 'md'

/* SPAN attributes, not image ones, and the difference is not pedantry. The
   contract used to inherit `ImgHTMLAttributes` and spread them onto the `<img>`,
   which meant that a thumbnail with no `src` — the fallback branch, which is the
   whole reason this component exists — silently dropped everything the caller
   passed: the `id` a label pointed at, an `aria-describedby`, a `data-*` hook.
   Found 2026-08-28 by a test asserting the passthrough across every component
   that declares one. A Thumbnail IS the span; the image inside it is an
   implementation of one branch. */
type Props = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** The picture. Leave it out and the fallback icon stands in, which is what
   *  a row with no image needs: the column still has one width. */
  src?: string
  /** Always required, and empty when the picture repeats the text beside it. */
  alt: string
  /** The stand-in when there is no picture. */
  icon?: IconName
  /** sm (24px, a dense table) / md (40px, the default). */
  size?: Size
  /** Square (the default) for a thing, 16/9 for a frame of video. */
  ratio?: '1/1' | '16/9'
}

/**
 * The picture that identifies a row: a product, a document, a frame of a
 * recording. A fixed box, so it never becomes the row's height driver and every
 * row in the column is the same height whatever the image is.
 *
 * `Avatar` is the one for a person (it is round and falls back to initials);
 * `CardMedia` is the one for a card, where the frame IS the content.
 *
 * Copy: the `alt` says what the picture shows, not that it is a picture; an
 * empty alt is correct only when the image adds nothing the words do not
 * already carry.
 */
export function Thumbnail({ src, alt, icon = 'insert_drive_file', size, ratio, className, ...rest }: Props) {
  return (
    <span className={cn('thumbnail', className)} data-size={size} data-ratio={ratio} {...rest}>
      {src
        ? <img src={src} alt={alt} loading="lazy" />
        : (
          /* The fallback is not empty space: a column of images with a hole in
           * it reads as a broken image, not as a record without one. */
          /* With an alt it is an image that happens to be a glyph; with an
             empty alt it is decoration, and a role="img" with no name is a
             promise of a label that is not there (axe: role-img-alt). */
          <span
            className="thumbnail-fallback"
            role={alt ? 'img' : undefined}
            aria-label={alt || undefined}
            aria-hidden={alt ? undefined : true}
          >
            <Icon name={icon} />
          </span>
        )}
    </span>
  )
}
