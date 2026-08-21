import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Icon, type IconName } from '../components/Icon'
import { AppShell } from '../shell/AppShell'
import { ListPageTemplate } from '../blocks/ListPageTemplate'
import { useToast } from '../lib/ToastProvider'

type Props = {
  /** i18n key segment under `placeholder.*` (e.g. "forReview" → title + desc + cta). */
  name: string
  icon: IconName
  /** Icon for the primary CTA button. */
  ctaIcon: IconName
  /** If set, the CTA navigates there; otherwise it fires a demo toast. */
  ctaTo?: string
}

/* Stub screen for nav destinations that don't have a real layout yet — keeps
 * the sidebar navigation complete and offers the section's primary action. */
export function PlaceholderPage({ name, icon, ctaIcon, ctaTo }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const ctaLabel = t(`placeholder.${name}.cta`)

  const onCta = () =>
    ctaTo ? navigate(ctaTo) : toast({ tone: 'info', title: ctaLabel })

  /* The whole screen IS the template's empty branch: a bare header bar, then a
   * centred EmptyState. It was hand-written here first and the block was written
   * from it, which is the wrong way round — the copy stayed. */
  return (
    <AppShell>
      <ListPageTemplate
        isEmpty
        empty={{
          icon,
          title: t(`placeholder.${name}.title`),
          description: t(`placeholder.${name}.desc`),
          action: (
            <Button size="lg" iconEnd={!ctaTo} onClick={onCta}>
              <Icon name={ctaIcon} />
              {ctaLabel}
            </Button>
          ),
        }}
      />
    </AppShell>
  )
}
