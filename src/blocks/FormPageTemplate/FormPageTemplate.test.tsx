import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormPageTemplate } from './FormPageTemplate'
import { Input } from '../../components/Input'

/* A page that is one form. The errors are the half worth testing: a summary
 * that appears above the fields is how somebody who cannot see red borders
 * finds out what is wrong, and it must not be there when nothing is. */

const page = (props: Partial<Parameters<typeof FormPageTemplate>[0]> = {}) =>
  render(
    <MemoryRouter>
      <FormPageTemplate title="New session" submitLabel="Create" onSubmit={vi.fn()} {...props}>
        <Input aria-label="Name" />
      </FormPageTemplate>
    </MemoryRouter>,
  )

describe('FormPageTemplate', () => {
  it('offers exactly one commit, named for what it does', () => {
    page()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('commits when the commit is pressed', async () => {
    const onSubmit = vi.fn()
    page({ onSubmit })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('says nothing about errors while there are none', () => {
    page()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('gathers the errors above the fields where they can be found', () => {
    page({ errors: [{ id: 'name', message: 'Give the session a name.' }] })
    expect(screen.getByText('Give the session a name.')).toBeInTheDocument()
  })

  it('offers a way out only when there is somewhere to go', () => {
    const { unmount } = page()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    unmount()

    page({ onCancel: vi.fn() })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
