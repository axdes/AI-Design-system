import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPageTemplate, SettingsSection, SettingRow } from './SettingsPageTemplate'
import { Switch } from '../../components/Switch'

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
})
