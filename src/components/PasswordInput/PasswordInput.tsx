import './PasswordInput.css'
import { useState, type ComponentPropsWithRef } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { IconButton } from '../IconButton'
import { Input } from '../Input'
import { Tooltip } from '../Tooltip'

type Props = Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> & {
  /** A STATE, not a style: it turns the border and hands <Field> the hook it needs to read the
   *  error out as part of the field.
   */
  invalid?: boolean
  /** Names what is BEHIND the field. On a --muted ground the white fill already separates it, so
   *  the resting border comes off; on a card the surface is white too, and `base` keeps the
   *  border that does the separating.
   */
  surface?: 'base' | 'muted'
  /** Follows the form it sits in; the reveal button follows it too. */
  size?: 'sm' | 'md' | 'lg'
}

/** A password field that can be read back.
 *
 *  Every login checklist asks for this and no field in this system had it, so
 *  ten of them shipped as a bare `type="password"`: a typo in a masked field is
 *  invisible, and the only recovery is to clear it and start again. The toggle
 *  is a button rather than a checkbox because it does not change what will be
 *  submitted, only what is on screen. */
export function PasswordInput({ className, size, ...rest }: Props) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(false)
  const label = shown ? t('a11y.hidePassword') : t('a11y.showPassword')

  return (
    <div className={cn('password-input', className)} data-size={size}>
      <Input
        type={shown ? 'text' : 'password'}
        size={size}
        className="password-input-field"
        {...rest}
      />
      <Tooltip content={label}>
        <IconButton
          icon={shown ? 'visibility_off' : 'visibility'}
          variant="quiet"
          /* The field's height, not the icon-button default of sm: the page
           * audit measures both as controls on one line, and 32 inside 40 is
           * the mismatch it exists to catch. `quiet` has no hover fill, so a
           * full-height hit area does not draw a circle over the field. */
          size={size ?? 'md'}
          className="password-input-toggle"
          aria-label={label}
          aria-pressed={shown}
          /* The field keeps the caret: revealing is about reading what is
           * already typed, so taking focus away from it would interrupt. */
          onMouseDown={(e) => { e.preventDefault() }}
          onClick={() => { setShown((v) => !v) }}
        />
      </Tooltip>
    </div>
  )
}
