import { describe, expect, it } from 'vitest'
import { cn } from './cn'
import { formatDate } from './formatDate'

/* The two helpers every component leans on, and neither had a test: mutation
 * testing scored both at 0%, meaning any change to them would have gone
 * unnoticed by 516 tests. */

describe('cn', () => {
  it('joins the classes it is given', () => {
    expect(cn('btn', 'btn-lg')).toBe('btn btn-lg')
  })

  it('drops the falsy ones, which is the whole point of it', () => {
    // Callers write cn('card', interactive && 'card-interactive'): a false must
    // vanish, not render as "false" or leave a double space.
    expect(cn('card', false, null, undefined, 'card-tight')).toBe('card card-tight')
    expect(cn('card', false)).toBe('card')
  })

  it('returns an empty string when there is nothing to add', () => {
    // className={cn(undefined)} must not put class="undefined" in the DOM.
    expect(cn()).toBe('')
    expect(cn(undefined, false)).toBe('')
  })

  it('keeps the order it was given', () => {
    // Order decides the cascade when two classes set the same property.
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('does not collapse a legitimately empty-looking class', () => {
    expect(cn('a', '', 'b')).toBe('a b')
  })
})

describe('formatDate', () => {
  it('is short: month, day, year — never a bare ISO string', () => {
    const out = formatDate('2026-05-15T10:30:00Z', 'en-US')
    expect(out).toMatch(/May/)
    expect(out).toMatch(/2026/)
    expect(out).not.toMatch(/2026-05-15/)
  })

  it('follows the locale it is given', () => {
    const en = formatDate('2026-05-15T10:30:00Z', 'en-US')
    const ar = formatDate('2026-05-15T10:30:00Z', 'ar')
    expect(ar).not.toBe(en)
  })

  it('carries all three parts, so a dropped option would show', () => {
    const parts = formatDate('2026-01-09T00:00:00Z', 'en-US')
    expect(parts).toMatch(/Jan/)
    expect(parts).toMatch(/\b9\b/)
    expect(parts).toMatch(/2026/)
  })
})
