/**
 * FAQ / Legal Admin contracts.
 */

export const FAQ_WRITABLE_FIELDS = [
  'question',
  'answer',
  'order',
  'is_published',
]

export const LEGAL_KEYS = ['bokningsvillkor', 'integritet']

export const LEGAL_WRITABLE_FIELDS = [
  'key',
  'title',
  'description',
  'body',
  'is_published',
]

/** Matches backend TRUST_CONTENT_SOURCE; FE fallback is trustContent.js */
export const TRUST_CONTENT_FALLBACK = 'trustContent.js'

export function publishLabel(isPublished) {
  return isPublished ? 'PUBLICERAD' : 'EJ PUBLICERAD'
}

export function formatAdminApiError(err, AdminApiError) {
  const status = err instanceof AdminApiError ? err.status : null
  if (status === 403) return { status, message: '403 — saknar behörighet.' }
  if (status === 401) return { status, message: 'Session utgången. Logga in igen.' }
  if (status === 404) return { status, message: '404 — hittades inte.' }
  const message =
    err instanceof AdminApiError ? err.message : err?.message || 'Något gick fel.'
  return { status, message }
}
