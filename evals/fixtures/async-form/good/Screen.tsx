/* Reference solution — what "used the design system" looks like for this task.
 * Doubles as a regression fixture: the scorers must give it a perfect score. */
import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Field } from '@/components/Field'
import { Icon } from '@/components/Icon'
import { Skeleton } from '@/components/Skeleton'
import { Stack } from '@/components/Layout'
import { Switch } from '@/components/Switch'

type Settings = { digest: boolean; push: boolean }

export function Screen() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  /* Fake the initial load: null settings means "still loading". */
  useEffect(() => {
    const timer = setTimeout(() => setSettings({ digest: true, push: false }), 800)
    return () => clearTimeout(timer)
  }, [])

  const save = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1200)
  }

  return (
    <Stack gap={4} aria-busy={settings === null}>
      {settings === null ? (
        <Stack gap={4}>
          <Skeleton height="1.5rem" shape="block" width="14rem" />
          <Skeleton height="1.5rem" shape="block" width="14rem" />
        </Stack>
      ) : (
        <>
          <Field label="Email digest" htmlFor="digest">
            <Switch
              label="Email digest"
              checked={settings.digest}
              onChange={(digest) => setSettings({ ...settings, digest })}
            />
          </Field>
          <Field label="Push alerts" htmlFor="push">
            <Switch
              label="Push alerts"
              checked={settings.push}
              onChange={(push) => setSettings({ ...settings, push })}
            />
          </Field>
        </>
      )}

      <Button variant="primary" loading={saving} loadingLabel="Saving settings" onClick={save} disabled={settings === null}>
        <Icon name="save" />Save
      </Button>
    </Stack>
  )
}
