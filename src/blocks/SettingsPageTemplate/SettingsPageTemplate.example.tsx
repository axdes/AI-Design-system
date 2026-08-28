/* Golden example. A real module: tsc compiles it, the test suite renders it,
 * the registry publishes the usage. The shape to copy: sections grouped by who
 * a knob affects, every row explaining what it changes, a write-only secret
 * marked "configured" instead of echoed, and a destructive action as a plain
 * row — no red frame around the section. */
import { useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { PasswordInput } from '../../components/PasswordInput'
import { Select } from '../../components/Select'
import { Switch } from '../../components/Switch'
import { Modal } from '../../components/Modal'
import { SettingsPageTemplate, SettingsSection, SettingRow } from './SettingsPageTemplate'

export function Example() {
  const [language, setLanguage] = useState('en')
  const [digest, setDigest] = useState(true)
  const [confirming, setConfirming] = useState(false)
  return (
    <SettingsPageTemplate title="Settings">
      <SettingsSection
        title="Preferences"
        description="How this workspace looks and speaks, for you only."
      >
        <SettingRow
          label="Language"
          description="The interface language. Documents keep the language they were written in."
        >
          {/* Select carries its own label, so the row's htmlFor stays unused here. */}
          <Select
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English' },
              { value: 'ar', label: 'العربية' },
            ]}
          />
        </SettingRow>
        <SettingRow
          label="Weekly digest"
          description="One summary mail on Monday morning. Applies the moment it is flipped."
        >
          <Switch checked={digest} onChange={setDigest} label="Weekly digest" />
        </SettingRow>
      </SettingsSection>
      <SettingsSection
        title="Connections"
        description="Keys this workspace uses on your behalf. Values are write-only: paste to replace, never read back."
        /* "configured" beside the label answers the only question a write-only
           field cannot: is something set already? */
      >
        <SettingRow
          label="Transcription key"
          description="Used by the recorder. Stored on this machine, sent only to the provider."
          htmlFor="set-key"
          badge={<Badge tone="success" fill="soft">configured</Badge>}
        >
          {/* A machine secret, not a credential: a password manager offering to
            * fill it would be offering the wrong thing. */}
          <PasswordInput id="set-key" autoComplete="off" placeholder="dg_..." />
        </SettingRow>
      </SettingsSection>
      <SettingsSection
        title="Danger zone"
        description="Actions that remove data. Each one confirms first."
      >
        <SettingRow
          label="Delete workspace"
          description="Removes the workspace and its recordings for every member. There is no undo."
        >
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            Delete workspace
          </Button>
        </SettingRow>
      </SettingsSection>
      {/* A confirmation is a Modal at `sm` with a sentence in it. `tone` colours
          the commitment so a delete never reads as a save. */}
      <Modal
        open={confirming}
        title="Delete this workspace?"
        size="sm"
        onClose={() => setConfirming(false)}
        actions={{
          onConfirm: () => setConfirming(false),
          confirmLabel: 'Delete workspace',
          tone: 'destructive',
        }}
      >
        Every member loses its recordings. There is no undo.
      </Modal>
    </SettingsPageTemplate>
  )
}
