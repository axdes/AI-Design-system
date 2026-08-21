import './UsersPage.css'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../shell/AppShell'
import { Identity } from '../components/Identity'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card, CardHeader, CardMeta, CardTitle } from '../components/Card'
import { Dropdown, DropdownItem } from '../components/Dropdown'
import { Field } from '../components/Field'
import { FilterBar } from '../components/FilterBar'
import { FilterDropdown } from '../components/FilterDropdown'
import { Icon } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { Input } from '../components/Input'
import { MetaItem } from '../components/MetaItem'
import { Modal } from '../components/Modal'
import { ListPageTemplate } from '../blocks/ListPageTemplate'
import { ConfirmDialog } from '../blocks/ConfirmDialog'
import { SearchInput } from '../components/SearchInput'
import { Select } from '../components/Select'
import { Stack } from '../components/Layout'
import { ROLES, type Role, type User } from '../lib/AuthProvider'
import { MOCK_USERS, ROLE_TONE } from '../data/mockUsers'
import { ROLE_PERMISSIONS } from '../data/permissions'
import { useToast } from '../lib/ToastProvider'

/* invite = create a new user; edit = change an existing user's name/email/role. */
type Editor = { mode: 'invite' } | { mode: 'edit'; user: User }

export function UsersPage() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role[]>([])
  const [editor, setEditor] = useState<Editor | null>(null)
  /* The user a delete is about, not a boolean: the dialog names them, and a
     boolean would need a second piece of state to carry who. */
  const [toRemove, setToRemove] = useState<User | null>(null)

  const roleOptions = ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))

  const visible = useMemo<User[]>(() => {
    let list = users
    if (roleFilter.length) list = list.filter((u) => roleFilter.includes(u.role))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (u) => u.fullName.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [users, query, roleFilter])

  const removeUser = (u: User) => {
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
    toast({ tone: 'info', title: t('users.removed'), description: u.fullName })
  }

  const saveUser = (data: { fullName: string; email: string; role: Role }) => {
    if (editor?.mode === 'edit') {
      const id = editor.user.id
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)))
      toast({ tone: 'success', title: t('users.updated'), description: data.fullName })
    } else {
      const username = data.email.split('@')[0] || `user-${users.length + 1}`
      setUsers((prev) => [{ id: `new-${Date.now()}`, username, ...data }, ...prev])
      toast({ tone: 'success', title: t('users.invited'), description: data.fullName })
    }
    setEditor(null)
  }

  const inviteButton = (
    <Button iconEnd onClick={() => setEditor({ mode: 'invite' })}>
      <Icon name="person_add" />
      {t('users.invite')}
    </Button>
  )

  return (
    <AppShell>
      {/* The list-page skeleton comes from the block: header (title, the search
          and filters inline, the invite action), then either the grid or the
          right empty state. */}
      <ListPageTemplate
        title={t('users.title')}
        inline={
          <>
            <SearchInput
              placeholder={t('users.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
            />
            <FilterBar activeCount={roleFilter.length} onClear={() => setRoleFilter([])}>
              <FilterDropdown
                label={t('users.filters.role')}
                allLabel={t('users.filters.allRoles')}
                options={roleOptions}
                value={roleFilter}
                onChange={setRoleFilter}
              />
            </FilterBar>
          </>
        }
        actions={inviteButton}
        isEmpty={visible.length === 0}
        empty={
          users.length === 0
            ? {
                icon: 'group',
                title: t('users.empty.title'),
                description: t('users.empty.desc'),
                action: (
                  <Button size="lg" iconEnd onClick={() => setEditor({ mode: 'invite' })}>
                    <Icon name="person_add" />
                    {t('users.invite')}
                  </Button>
                ),
              }
            : {
                icon: 'search',
                title: t('users.empty.searchTitle'),
                description: t('users.empty.searchDesc'),
                /* The search box and the role filter are what emptied this
                   screen, and they are in the header. */
                reason: 'no-matches',
              }
        }
        contentClassName="users-grid"
      >
        {visible.map((u) => (
              <Card
                key={u.id}
                interactive
                fill
                tight
                onClick={() => setEditor({ mode: 'edit', user: u })}
              >
                <CardHeader>
                  {/* The card head IS the person: the shared Identity unit,
                      with the card's own title as its name line. */}
                  <Identity
                    name={<CardTitle>{u.fullName}</CardTitle>}
                    avatarName={u.fullName}
                    secondary={u.email}
                    src={u.avatar}
                    size="lg"
                  />
                  {/* Stop clicks here from also triggering the card's open-on-click. */}
                  <span className="users-card-menu" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      align="end"
                      trigger={({ isOpen, ...triggerProps }) => (
                        <IconButton
                          icon="more_vert"
                          aria-label={t('users.moreActions')}
                          data-open={isOpen || undefined}
                          {...triggerProps}
                        />
                      )}
                    >
                      <DropdownItem icon="edit" onClick={() => setEditor({ mode: 'edit', user: u })}>
                        {t('users.edit')}
                      </DropdownItem>
                      <DropdownItem icon="delete" tone="danger" onClick={() => setToRemove(u)}>
                        {t('users.remove')}
                      </DropdownItem>
                    </Dropdown>
                  </span>
                </CardHeader>

                <CardMeta>
                  <Badge tone={ROLE_TONE[u.role]}>{t(`role.${u.role}`)}</Badge>
                  <MetaItem icon="verified">
                    {ROLE_PERMISSIONS[u.role].length} {t('users.permissions')}
                  </MetaItem>
                </CardMeta>
              </Card>
        ))}
      </ListPageTemplate>

      {/* Removing someone is destructive and one click deep in a menu. Nothing
          in this system deletes without asking first. */}
      <ConfirmDialog
        open={!!toRemove}
        title={t('users.removeTitle')}
        message={t('users.removeMessage', { name: toRemove?.fullName ?? '' })}
        confirmLabel={t('users.remove')}
        cancelLabel={t('users.removeCancel')}
        confirmVariant="destructive"
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) removeUser(toRemove)
          setToRemove(null)
        }}
      />

      {editor && (
        <UserEditorModal
          key={editor.mode === 'edit' ? editor.user.id : 'invite'}
          editor={editor}
          roleOptions={roleOptions}
          onClose={() => setEditor(null)}
          onSave={saveUser}
        />
      )}
    </AppShell>
  )
}

type EditorModalProps = {
  editor: Editor | null
  roleOptions: { value: Role; label: string }[]
  onClose: () => void
  onSave: (data: { fullName: string; email: string; role: Role }) => void
}

/* Shape check only (a real address is verified by sending mail, not by a regex).
 * Written as splits rather than /^[^\s@]+@[^\s@]+\.[^\s@]+$/ because that pattern
 * backtracks quadratically on a long local part with no dot. */
function isEmail(value: string) {
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || /\s/.test(local)) return false
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every((l) => l.length > 0 && !/\s/.test(l))
}

function UserEditorModal({ editor, roleOptions, onClose, onSave }: EditorModalProps) {
  const { t } = useTranslation()
  const seed = editor?.mode === 'edit' ? editor.user : undefined

  /* Keyed remount (below) re-seeds these from the opened user, so plain useState
   * is enough — no effect needed. */
  const [fullName, setFullName] = useState(seed?.fullName ?? '')
  const [email, setEmail] = useState(seed?.email ?? '')
  const [role, setRole] = useState<Role>(seed?.role ?? 'content-creator')
  const [error, setError] = useState<string | null>(null)

  if (!editor) return null

  const isEdit = editor.mode === 'edit'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const name = fullName.trim()
    const mail = email.trim()
    if (!name) { setError(t('users.form.nameRequired')); return }
    if (!isEmail(mail)) { setError(t('users.form.emailInvalid')); return }
    onSave({ fullName: name, email: mail, role })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('users.editTitle') : t('users.inviteTitle')}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('users.form.cancel')}</Button>
          <Button type="submit" form="user-editor-form">
            {isEdit ? t('users.form.save') : t('users.form.sendInvite')}
          </Button>
        </>
      }
    >
      <form id="user-editor-form" onSubmit={submit}>
        <Stack gap={4}>
          <Field label={t('users.form.fullName')} htmlFor="user-fullname" required>
            <Input
              id="user-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('users.form.fullNamePlaceholder')}
              autoComplete="off"
            />
          </Field>

          <Field label={t('users.form.email')} htmlFor="user-email" required>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('users.form.emailPlaceholder')}
              autoComplete="off"
            />
          </Field>

          <Field label={t('users.form.role')} htmlFor="user-role" error={error}>
            <Select
              label={t('users.form.role')}
              value={role}
              onChange={setRole}
              options={roleOptions}
              className="users-form-role"
            />
          </Field>

        </Stack>
      </form>
    </Modal>
  )
}
