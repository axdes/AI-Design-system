import type { Role, User } from '../lib/AuthProvider'

/* Per-role badge tone (label is i18n'd in locales[].role.*). */
export const ROLE_TONE: Record<Role, 'primary' | 'warning' | 'success' | 'neutral'> = {
  admin: 'primary',
  'brand-manager': 'warning',
  editor: 'success',
  'content-creator': 'neutral',
}

/* Seed directory for the Users admin screen. No real backend — this is the
 * showcase dataset, mutated in local state by create/edit/delete on the page.
 * The first four ids match DEMO_USERS so the signed-in user appears here too. */
export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'mohammed', fullName: 'Mohammed Al-Khalid', role: 'admin',           email: 'mohammed@example.com' },
  { id: 'u2', username: 'sarah',    fullName: 'Sarah Al-Mansouri',  role: 'brand-manager',   email: 'sarah@example.com' },
  { id: 'u3', username: 'ahmed',    fullName: 'Ahmed Al-Saud',      role: 'content-creator', email: 'ahmed@example.com' },
  { id: 'u4', username: 'fatima',   fullName: 'Fatima Al-Zahra',    role: 'editor',          email: 'fatima@example.com' },
  { id: 'u5', username: 'noura',    fullName: 'Noura Al-Otaibi',    role: 'editor',          email: 'noura@example.com' },
  { id: 'u6', username: 'khalid',   fullName: 'Khalid Al-Dossari',  role: 'content-creator', email: 'khalid@example.com' },
  { id: 'u7', username: 'layla',    fullName: 'Layla Al-Harbi',     role: 'brand-manager',   email: 'layla@example.com' },
  { id: 'u8', username: 'omar',     fullName: 'Omar Al-Ghamdi',     role: 'content-creator', email: 'omar@example.com' },
  { id: 'u9', username: 'huda',     fullName: 'Huda Al-Qahtani',    role: 'admin',           email: 'huda@example.com' },
]
