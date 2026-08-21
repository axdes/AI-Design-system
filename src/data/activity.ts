import type { IconName } from '@/components/Icon'

/* Activity event kinds — visual tone + icon per kind. */
export type ActivityKind =
  | 'created'         /* you created a new piece */
  | 'sentForReview'   /* you submitted for review */
  | 'reviewed'        /* you reviewed somebody else */
  | 'inUse'           /* your content went live */
  | 'commented'       /* you commented on a doc */
  | 'shared'          /* you shared something */

export const ACTIVITY_ICON: Record<ActivityKind, IconName> = {
  created:       'edit',
  sentForReview: 'rate_review',
  reviewed:      'check',
  inUse:         'campaign',
  commented:     'message',
  shared:        'share',
}

/* Tone hints picked up by ActivityItem CSS (color-coded icons). */
export const ACTIVITY_TONE: Record<ActivityKind, 'neutral' | 'success' | 'warning' | 'primary'> = {
  created:       'primary',
  sentForReview: 'warning',
  reviewed:      'success',
  inUse:         'success',
  commented:     'neutral',
  shared:        'neutral',
}

export type ActivityEvent = {
  id: string
  /* User this event belongs to (matches User.id from AuthProvider). */
  actorId: string
  kind: ActivityKind
  /* Subject: usually a content title — used in the localized event string. */
  subject: string
  /* ISO timestamp. */
  at: string
}

/* Hand-curated mock events. In a real app this would come from an API.
 * Dates clustered around the mock content updatedAt dates so they read as
 * a coherent history. */
export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 'a1', actorId: 'u1', kind: 'inUse',         subject: 'Q4 Sustainability Report',      at: '2026-05-15T14:20:00Z' },
  { id: 'a2', actorId: 'u1', kind: 'sentForReview', subject: 'Leadership Welcome Message',    at: '2026-05-12T09:15:00Z' },
  { id: 'a3', actorId: 'u1', kind: 'sentForReview', subject: 'Safety Protocol Update',        at: '2026-05-08T11:40:00Z' },
  { id: 'a4', actorId: 'u1', kind: 'commented',     subject: 'Brand Refresh: Internal Memo', at: '2026-05-07T16:05:00Z' },
  { id: 'a5', actorId: 'u1', kind: 'created',       subject: 'Safety Protocol Update',        at: '2026-05-06T08:30:00Z' },

  { id: 'a6', actorId: 'u2', kind: 'reviewed',      subject: 'Brand Refresh: Internal Memo', at: '2026-05-14T13:00:00Z' },
  { id: 'a7', actorId: 'u2', kind: 'created',       subject: 'Brand Refresh: Internal Memo', at: '2026-05-13T10:00:00Z' },

  { id: 'a8', actorId: 'u3', kind: 'created',       subject: 'Saudi Vision 2030 Campaign',    at: '2026-05-10T15:30:00Z' },
  { id: 'a9', actorId: 'u3', kind: 'created',       subject: 'Annual Recap Blog Post',        at: '2026-05-05T09:00:00Z' },

  { id: 'a10', actorId: 'u4', kind: 'inUse',        subject: 'Onboarding Welcome Video',      at: '2026-05-01T12:00:00Z' },
  { id: 'a11', actorId: 'u4', kind: 'created',      subject: 'Employee Spotlight: May',      at: '2026-05-09T08:00:00Z' },
]
