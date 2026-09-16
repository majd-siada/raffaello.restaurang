/**
 * Weekly Offer Admin helpers — price as string for Django Decimal.
 */

import { normalizePriceInput } from './menuHelpers.js'

export { normalizePriceInput }

export const OFFER_WEEK_WRITABLE = ['week_start', 'intro_text', 'is_published']

export const OFFER_DISH_WRITABLE = [
  'offer',
  'name',
  'description',
  'price',
  'is_available',
  'order',
]

/** No image fields on WeeklyOffer / OfferDish. */
export const OFFER_IMAGE_SUPPORTED = false

/**
 * ISO week identity from a YYYY-MM-DD (or Date). Browser used only for display
 * comparison; public API uses Django TIME_ZONE Europe/Stockholm.
 */
export function isoWeekFromDateString(value) {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(`${value}T12:00:00`) : value
  if (Number.isNaN(d.getTime())) return null
  // Copy ISO week algorithm (UTC noon-safe via T12:00)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  return { year: date.getUTCFullYear(), week }
}

export function isCurrentIsoWeek(offer, today = new Date()) {
  if (!offer?.year || offer.week_number == null) return false
  const iso = isoWeekFromDateString(today.toISOString().slice(0, 10))
  if (!iso) return false
  return offer.year === iso.year && offer.week_number === iso.week
}

export function publishLabel(published) {
  return published ? 'PUBLICERAD' : 'EJ PUBLICERAD'
}
