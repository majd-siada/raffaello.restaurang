/**
 * Opening hours — JSON file remains available; prefer GET /api/restaurant/ when hydrated.
 * Keep FE JSON in sync with backend JSON for parity/rollback tests.
 */
import openingHours from './data/openingHours.json'

function mapSchedule(rows) {
  return rows.map((row) => ({
    label: row.label,
    days: row.days_js ?? row.days,
    opens: row.opens,
    closes: row.closes,
  }))
}

/** Mutable so API hydrate can update without a second static source of truth. */
export let HOURS_SCHEDULE = mapSchedule(openingHours.schedule)
export let MAX_GUESTS_ONLINE = openingHours.max_guests_online
export let SLOT_INTERVAL_MINUTES = openingHours.slot_interval_minutes
export let HOURS_HYDRATED_FROM_API = false

export function openingHoursDisplayRows() {
  return HOURS_SCHEDULE.map(({ label, opens, closes }) => ({
    label,
    hours: `${opens} – ${closes}`,
  }))
}

/** Schema.org OpeningHoursSpecification list from active schedule. */
export function openingHoursToSchema() {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]
  return HOURS_SCHEDULE.map((row) => {
    const days = row.days.map((d) => `https://schema.org/${dayNames[d]}`)
    return {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: days.length === 1 ? days[0] : days,
      opens: row.opens,
      closes: row.closes,
    }
  })
}

function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Öppettider för ett datum (YYYY-MM-DD), eller null. */
export function getHoursForDate(isoDate) {
  const day = new Date(`${isoDate}T12:00:00`).getDay()
  return HOURS_SCHEDULE.find((row) => row.days.includes(day)) ?? null
}

/**
 * Bokningsbara tider under öppettid för datumet.
 * Första slot = öppning, därefter interval t.o.m. stängning.
 */
export function bookingSlotsForDate(isoDate) {
  const hours = getHoursForDate(isoDate)
  if (!hours) return []

  const start = hhmmToMinutes(hours.opens)
  const end = hhmmToMinutes(hours.closes)
  const step = SLOT_INTERVAL_MINUTES
  const slots = [minutesToHHMM(start)]

  let t = Math.ceil((start + 1) / step) * step
  while (t <= end) {
    slots.push(minutesToHHMM(t))
    t += step
  }
  return slots
}

/** Apply public GET /api/restaurant/ payload (same shape as JSON). */
export function applyRestaurantApiPayload(payload) {
  if (!payload?.schedule) return false
  HOURS_SCHEDULE = mapSchedule(payload.schedule)
  if (payload.max_guests_online != null) {
    MAX_GUESTS_ONLINE = payload.max_guests_online
  }
  if (payload.slot_interval_minutes != null) {
    SLOT_INTERVAL_MINUTES = payload.slot_interval_minutes
  }
  HOURS_HYDRATED_FROM_API = true
  return true
}

/**
 * Hydrate from public API so display + JSON-LD + booking slots match server SoT.
 * On failure, leave JSON defaults (honest fallback).
 */
export async function hydrateOpeningHoursFromApi() {
  const base = import.meta.env.VITE_API_URL || ''
  try {
    const res = await fetch(`${base}/api/restaurant/`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return false
    const data = await res.json()
    return applyRestaurantApiPayload(data)
  } catch {
    return false
  }
}
