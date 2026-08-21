import type { Role } from '../lib/AuthProvider'

/* Role → permission keys (i18n'd in locales[].permission.*). */
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  admin: [
    'manageContent', 'uploadFiles', 'reviewContent',
    'manageUsers', 'manageRoles', 'manageContentTypes',
  ],
  'brand-manager': [
    'manageContent', 'uploadFiles', 'reviewContent', 'manageContentTypes',
  ],
  editor: [
    'manageContent', 'uploadFiles', 'reviewContent',
  ],
  'content-creator': [
    'manageContent', 'uploadFiles',
  ],
}
