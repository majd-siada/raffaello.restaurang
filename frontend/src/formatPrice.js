/**
 * Shared Swedish price display for menu / lunch / offer / home.
 * Uses "kr" consistently (guest-facing SV).
 */
export function formatPrice(price) {
  if (price == null || price === '') return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} kr`
  const body = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.00$/, '')
  return `${body} kr`
}
