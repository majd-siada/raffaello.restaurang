/**
 * Lunch Admin helpers — status labels from lunch.models import statuses.
 * Do not invent SUCCESS; backend uses PUBLISHED.
 */

export const WEEKDAY_LABELS = [
  'Måndag',
  'Tisdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lördag',
  'Söndag',
]

export const WEEKDAY_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

/** Exact backend ImportRun / last_import_status values used by sync_from_matochmat */
export const LUNCH_IMPORT_STATUSES = [
  'FETCHED',
  'VALIDATED',
  'PUBLISHED',
  'NOT_PUBLISHED',
  'FETCH_FAILED',
  'PARSE_FAILED',
  'STALE',
  'UNCHANGED',
  'SKIPPED_OVERRIDE',
]

export const LUNCH_WEEK_WRITABLE_FIELDS = [
  'week_start',
  'intro_text',
  'notes',
  'lunch_hours_text',
  'is_published',
  'skip_auto_sync',
]

/** Dish write API: not exposed on Ops/Admin ViewSets (Django Admin only). */
export const LUNCH_DISH_WRITE_API = false

const FAILURE = new Set(['FETCH_FAILED', 'PARSE_FAILED'])
const WARNING = new Set(['STALE', 'NOT_PUBLISHED'])
const OKISH = new Set(['PUBLISHED', 'UNCHANGED', 'SKIPPED_OVERRIDE'])

/**
 * Classify sync_from_matochmat result.status for Admin feedback.
 * Note: POST /lunch/sync/ always returns HTTP 200 with ok:true — inspect status.
 */
export function classifySyncResult(result) {
  const status = result?.status || ''
  const message = result?.message || ''
  if (FAILURE.has(status)) {
    return {
      kind: 'error',
      headline: status === 'FETCH_FAILED' ? 'Hämtning misslyckades' : 'Tolkningsfel',
      detail: message || status,
      treatAsSuccess: false,
    }
  }
  if (status === 'STALE') {
    return {
      kind: 'warning',
      headline: 'STALE — aktuell vecka saknas i källan',
      detail: message || status,
      treatAsSuccess: false,
    }
  }
  if (status === 'NOT_PUBLISHED') {
    return {
      kind: 'warning',
      headline: 'Synk utan publicerbara rätter',
      detail: message || status,
      treatAsSuccess: false,
    }
  }
  if (status === 'UNCHANGED') {
    return {
      kind: 'info',
      headline: 'Oförändrad (hash match)',
      detail: message || 'Ingen ny publicering.',
      treatAsSuccess: true,
    }
  }
  if (status === 'SKIPPED_OVERRIDE') {
    return {
      kind: 'info',
      headline: 'Manuell override — synk hoppade över',
      detail: message || 'Automatisk synk skrev inte över veckan.',
      treatAsSuccess: true,
    }
  }
  if (status === 'PUBLISHED') {
    return {
      kind: result?.changed ? 'success' : 'info',
      headline: result?.changed ? 'Publicerad (ändrad)' : 'Publicerad',
      detail: message || status,
      treatAsSuccess: true,
    }
  }
  return {
    kind: 'info',
    headline: status || 'Synk klar',
    detail: message,
    treatAsSuccess: OKISH.has(status),
  }
}

export function isImportFailureStatus(status) {
  return FAILURE.has(status)
}

export function statusToneClass(status) {
  if (FAILURE.has(status)) return 'text-red-200'
  if (WARNING.has(status)) return 'text-amber-200'
  if (status === 'SKIPPED_OVERRIDE') return 'text-sky-200'
  if (status === 'PUBLISHED') return 'text-emerald-200'
  if (status === 'UNCHANGED') return 'text-white/70'
  return 'text-white/80'
}

export function weekdayLabel(weekday) {
  if (weekday == null) return 'Hela veckan'
  return WEEKDAY_LABELS[weekday] || WEEKDAY_SHORT[weekday] || String(weekday)
}

export function groupDishesByWeekday(dishes) {
  const map = new Map()
  for (const d of dishes || []) {
    const key = d.weekday == null ? 'all' : d.weekday
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(d)
  }
  return map
}

export function isManualOverride(week) {
  return Boolean(week?.skip_auto_sync || week?.manual_override)
}
