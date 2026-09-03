import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPageTemplate, SettingsSection, SettingRow } from './SettingsPageTemplate'
import { Switch } from '../../components/Switch'
import { Button } from '../../components/Button'

/* Settings, as sections of rows. The section is a real group with a real name,
 * which is what lets a screen reader say which group a control belongs to
 * instead of reading twenty switches in a row. */

describe('SettingsPageTemplate', () => {
  it('names the page once and holds its sections', () => {
    render(
      <MemoryRouter>
        <SettingsPageTemplate title="Settings">
          <SettingsSection title="Notifications">
            <SettingRow label="Weekly digest">
              <Switch checked onChange={() => {}} label="Weekly digest" />
            </SettingRow>
          </SettingsSection>
        </SettingsPageTemplate>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument()
  })

  it('puts the words beside the control they belong to', () => {
    render(
      <MemoryRouter>
        <SettingsPageTemplate title="Settings">
          <SettingsSection title="Notifications">
            <SettingRow label="Weekly digest" description="Every Monday, what changed.">
              <Switch checked onChange={() => {}} label="Weekly digest" />
            </SettingRow>
          </SettingsSection>
        </SettingsPageTemplate>
      </MemoryRouter>,
    )
    expect(screen.getByText('Every Monday, what changed.')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Weekly digest' })).toBeInTheDocument()
  })

  /* The prop's own comment says "typically nothing: settings save per control or
     per row" — which is exactly why it had never been rendered. It exists for the
     settings screen that does have one page-level action. */
  it('carries a header action for the settings page that has one', () => {
    render(
      <MemoryRouter>
        <SettingsPageTemplate title="Settings" actions={<Button>Restore defaults</Button>}>
          <p>the sections</p>
        </SettingsPageTemplate>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Restore defaults' })).toBeInTheDocument()
  })
})
