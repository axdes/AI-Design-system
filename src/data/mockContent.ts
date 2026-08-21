import type { IconName } from '@/components/Icon'

export type ContentStatus = 'in-progress' | 'in-review' | 'reviewed' | 'in-use'
export type ContentType = 'article' | 'video' | 'document' | 'campaign' | 'social'

export type ContentItem = {
  id: string
  title: string
  type: ContentType
  status: ContentStatus
  updatedAt: string
  authorId: string
  /* Body HTML — rendered inside the article surface on the detail page. */
  body?: string
}

/* Per-type metadata: icon name + visual identity (label is i18n). */
export const CONTENT_TYPE_ICON: Record<ContentType, IconName> = {
  article:  'article',
  video:    'movie',
  document: 'description',
  campaign: 'campaign',
  social:   'share',
}

/* Per-status badge tone (label is i18n). */
export const STATUS_TONE: Record<ContentStatus, 'neutral' | 'warning' | 'success'> = {
  'in-progress': 'neutral',
  'in-review':   'warning',
  reviewed:      'warning',
  'in-use':      'success',
}

const SAMPLE_BODY = `
<p>This document outlines our key strategic priorities and the operational measures
we have put in place to deliver them. The goal is clarity, accountability, and
measurable progress over the coming quarters.</p>

<h2>Overview</h2>
<p>We continue to align our work with the long-term vision while maintaining
the operational discipline that has made our organization a reliable partner
across the region. Each section below covers a specific workstream.</p>

<h2>Key initiatives</h2>
<ul>
  <li>Workforce development and continuous skill renewal.</li>
  <li>Operational efficiency through targeted process automation.</li>
  <li>Sustainability commitments aligned with Vision 2030.</li>
  <li>Community engagement and stakeholder transparency.</li>
</ul>

<h2>Next steps</h2>
<p>Owners of each workstream will publish monthly progress notes. Open
questions and risks should be flagged via the standard escalation channel
so we can address them before they affect downstream timelines.</p>

<blockquote>"Quality is not an act, it is a habit." A reminder we
embed in every review cycle.</blockquote>
`.trim()

export const MOCK_CONTENT: ContentItem[] = [
  { id: 'c1', title: 'Q4 Sustainability Report',        type: 'document', status: 'in-use',      updatedAt: '2026-05-15', authorId: 'u1', body: SAMPLE_BODY },
  { id: 'c2', title: 'Brand Refresh: Internal Memo',   type: 'article',  status: 'reviewed',    updatedAt: '2026-05-14', authorId: 'u2', body: SAMPLE_BODY },
  { id: 'c3', title: 'Leadership Welcome Message',      type: 'video',    status: 'in-review',   updatedAt: '2026-05-12', authorId: 'u1', body: SAMPLE_BODY },
  { id: 'c4', title: 'Saudi Vision 2030 Campaign',      type: 'campaign', status: 'in-progress', updatedAt: '2026-05-10', authorId: 'u3', body: SAMPLE_BODY },
  { id: 'c5', title: 'Employee Spotlight: May',        type: 'social',   status: 'reviewed',    updatedAt: '2026-05-09', authorId: 'u4', body: SAMPLE_BODY },
  { id: 'c6', title: 'Safety Protocol Update',          type: 'document', status: 'in-review',   updatedAt: '2026-05-08', authorId: 'u1', body: SAMPLE_BODY },
  { id: 'c7', title: 'Annual Recap Blog Post',          type: 'article',  status: 'in-progress', updatedAt: '2026-05-05', authorId: 'u3', body: SAMPLE_BODY },
  { id: 'c8', title: 'Onboarding Welcome Video',        type: 'video',    status: 'in-use',      updatedAt: '2026-05-01', authorId: 'u4', body: SAMPLE_BODY },
  { id: 'c9', title: 'Community Outreach Newsletter',   type: 'article',  status: 'in-review',   updatedAt: '2026-05-11', authorId: 'u3', body: SAMPLE_BODY },
  { id: 'c10', title: 'National Day Campaign Brief',    type: 'campaign', status: 'in-review',   updatedAt: '2026-05-07', authorId: 'u2', body: SAMPLE_BODY },
]
