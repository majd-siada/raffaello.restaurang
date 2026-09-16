/**
 * Gallery / Reviews Admin contracts (staff serializers + models).
 * MAX_PUBLISHED must match backend gallery.models.MAX_PUBLISHED (server enforces).
 */

export const MAX_PUBLISHED = 6

export const GALLERY_STAFF_FIELDS = [
  'id',
  'image',
  'src',
  'alt_text',
  'order',
  'is_published',
]

export const GALLERY_WRITABLE_FIELDS = [
  'image',
  'alt_text',
  'order',
  'is_published',
]

/** Upload defaults to unpublished (Ops + Admin convention) */
export const GALLERY_UPLOAD_DEFAULT_PUBLISHED = false

export const GALLERY_DELETE_SUPPORTED = true

export const REVIEW_STAFF_FIELDS = [
  'id',
  'quote',
  'author_name',
  'source',
  'rating',
  'is_published',
  'order',
  'created_at',
  'updated_at',
]

export const REVIEW_WRITABLE_FIELDS = [
  'quote',
  'author_name',
  'source',
  'rating',
  'is_published',
  'order',
]

/** Free-text source — no enum; do not invent values */
export const REVIEW_SOURCE_CHOICES = null

export const REVIEW_DELETE_SUPPORTED = true

export function publishLabel(isPublished) {
  return isPublished ? 'PUBLICERAD' : 'EJ PUBLICERAD'
}

export function formatAdminApiError(err, AdminApiError) {
  const status = err instanceof AdminApiError ? err.status : null
  if (status === 403) return { status, message: '403 — saknar behörighet.' }
  if (status === 401) return { status, message: 'Session utgången. Logga in igen.' }
  if (status === 404) return { status, message: '404 — hittades inte.' }
  if (status === 409) return { status, message: '409 — konflikt.' }
  const message =
    err instanceof AdminApiError ? err.message : err?.message || 'Något gick fel.'
  return { status, message }
}
