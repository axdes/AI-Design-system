/* Relay settings — the configuration screen of the notification relay.
 * Spec: relay-settings (project notify-relay).
 *
 * The SETTINGS archetype on its template: grouped sections of explained rows,
 * revisited rarely, any knob alone in any order. Deliberately NOT a wizard —
 * the brief smells like setup, but a wizard walks once and adds clicks
 * forever after. The token is write-only: the screen holds a boolean and a
 * draft, never the saved value. See the spec's _why. */
import { useState } from 'react'
import { SettingsPageTemplate, SettingsSection, SettingRow } from '@/blocks/SettingsPageTemplate'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { PasswordInput } from '@/components/PasswordInput'
import { Select } from '@/components/Select'
import { Switch } from '@/components/Switch'

type TestResult = { ok: boolean; detail: string } | null

export function Screen() {
  const [host, setHost] = useState('smtp.notify.example')
  const [sender, setSender] = useState('Acme Notifications')
  /* The saved token never reaches this screen: a boolean says one exists,
   * and the draft below only ever REPLACES it. */
  const [tokenConfigured, setTokenConfigured] = useState(true)
  const [tokenDraft, setTokenDraft] = useState('')
  const [digest, setDigest] = useState('hourly')
  const [quietHours, setQuietHours] = useState(true)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<TestResult>(null)

  const runTest = () => {
    setTesting(true)
    /* Inline mock: the check answers from the current draft state, so the
     * button really flips the result. */
    setTest(
      host.trim()
        ? { ok: true, detail: 'Connected to the relay and sent a probe message.' }
        : { ok: false, detail: 'No SMTP host set. Enter the host in Delivery below, then run the check again.' },
    )
    setTesting(false)
  }

  const save = () => {
    if (tokenDraft.trim()) {
      setTokenConfigured(true)
      setTokenDraft('')
    }
  }

  return (
    <SettingsPageTemplate
      title="Relay settings"
      actions={<Button variant="primary" onClick={save}>Save</Button>}
    >
      <SettingsSection
        title="Connection check"
        description="Run this before trusting the setup: it sends a probe through the relay and says what failed."
      >
        <SettingRow
          label="Test the relay"
          description="Sends one probe message with the settings below. Nothing is delivered to recipients."
          badge={test ? <Badge tone={test.ok ? 'success' : 'warning'} fill="soft" size="sm">{test.ok ? 'Working' : 'Needs attention'}</Badge> : undefined}
        >
          <Button variant="secondary" onClick={runTest} loading={testing} loadingLabel="Testing">
            Run check
          </Button>
        </SettingRow>
        {test && (
          <SettingRow label="Result" description={test.detail}>
            <Badge tone={test.ok ? 'success' : 'warning'}>{test.ok ? 'Probe sent' : 'Probe failed'}</Badge>
          </SettingRow>
        )}
      </SettingsSection>

      <SettingsSection
        title="Delivery"
        description="Where outgoing notifications go, and the name recipients see."
      >
        <SettingRow
          label="SMTP host"
          description="Every notification leaves through this host. Changing it takes effect on the next send."
          htmlFor="relay-host"
        >
          <Input id="relay-host" value={host} onChange={(e) => setHost(e.target.value)} />
        </SettingRow>
        <SettingRow
          label="Sender name"
          description="The from-name on outgoing mail. Recipients reply to this identity."
          htmlFor="relay-sender"
        >
          <Input id="relay-sender" value={sender} onChange={(e) => setSender(e.target.value)} />
        </SettingRow>
        <SettingRow
          label="API token"
          description="Write-only: paste a new token to replace the saved one. The saved value never shows here."
          htmlFor="relay-token"
          badge={tokenConfigured ? <Badge tone="success" fill="soft" size="sm">Configured</Badge> : <Badge tone="warning" fill="soft" size="sm">Missing</Badge>}
        >
          <PasswordInput
            id="relay-token"
            aria-label="API token"
            value={tokenDraft}
            placeholder={tokenConfigured ? 'Paste to replace' : 'nr_...'}
            onChange={(e) => setTokenDraft(e.target.value)}
          />
        </SettingRow>
      </SettingsSection>

      <SettingsSection
        title="Cadence"
        description="How often recipients hear from the relay."
      >
        <SettingRow
          label="Digest frequency"
          description="Immediately sends each notification alone; hourly and daily bundle them into one message."
        >
          <Select
            label="Digest frequency"
            value={digest}
            onChange={setDigest}
            options={[
              { value: 'immediately', label: 'Immediately' },
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
            ]}
          />
        </SettingRow>
        <SettingRow
          label="Quiet hours"
          description="Holds non-urgent notifications overnight and delivers them with the morning digest."
        >
          <Switch checked={quietHours} onChange={setQuietHours} label="Quiet hours" />
        </SettingRow>
      </SettingsSection>
    </SettingsPageTemplate>
  )
}
