import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthTemplate } from './AuthTemplate'
import { Input } from '../../components/Input'

/* The sign-in page. One thing about it is not decoration: a failed sign-in is
 * an alert rather than a status, because it interrupts — somebody typed a
 * password and is waiting, and a polite region says nothing until they move. */

describe('AuthTemplate', () => {
  it('announces a failure loudly enough to interrupt', () => {
    render(
      <AuthTemplate brand={<span>Acme</span>} title="Sign in" submitLabel="Sign in" onSubmit={vi.fn()} error="That password is not right.">
        <Input aria-label="Password" type="password" />
      </AuthTemplate>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('That password is not right.')
  })

  it('says nothing at all when nothing went wrong', () => {
    render(
      <AuthTemplate brand={<span>Acme</span>} title="Sign in" submitLabel="Sign in" onSubmit={vi.fn()}>
        <Input aria-label="Password" type="password" />
      </AuthTemplate>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('submits the form rather than only the button', async () => {
    const onSubmit = vi.fn()
    render(
      <AuthTemplate brand={<span>Acme</span>} title="Sign in" submitLabel="Sign in" onSubmit={onSubmit}>
        <Input aria-label="Password" type="password" />
      </AuthTemplate>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('names the page with its one heading', () => {
    render(
      <AuthTemplate brand={<span>Acme</span>} title="Sign in" submitLabel="Sign in" onSubmit={vi.fn()}>
        <Input aria-label="Password" type="password" />
      </AuthTemplate>,
    )
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })
})
