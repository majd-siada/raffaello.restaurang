/**
 * Menu Admin helpers — price as string for Django Decimal (no float math).
 */

/** Keep user input as decimal string; strip currency noise. */
export function normalizePriceInput(raw) {
  if (raw == null) return ''
  let s = String(raw).trim().replace(/\s*kr\s*$/i, '').trim()
  s = s.replace(',', '.')
  if (s === '') return ''
  if (!/^-?\d+(\.\d{1,2})?$/.test(s) && !/^\d+$/.test(s)) {
    return s // leave for server validation
  }
  return s
}

export function splitCsv(value) {
  if (!value || !String(value).trim()) return []
  return String(value)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
}

export function joinCsv(parts) {
  if (Array.isArray(parts)) return parts.map((p) => String(p).trim()).filter(Boolean).join(', ')
  return String(parts || '').trim()
}

export function categoryLabel(cat, byId = {}) {
  if (!cat) return '—'
  if (typeof cat === 'object') {
    if (cat.parent && byId[cat.parent]) {
      return `${byId[cat.parent].name} → ${cat.name}`
    }
    return cat.name || `#${cat.id}`
  }
  const row = byId[cat]
  if (!row) return `#${cat}`
  if (row.parent && byId[row.parent]) {
    return `${byId[row.parent].name} → ${row.name}`
  }
  return row.name
}

export const MENU_ITEM_WRITABLE_FIELDS = [
  'category',
  'name',
  'description',
  'price',
  'is_available',
  'order',
  'allergens',
  'tags',
  'image',
  'is_featured',
]

export const MENU_ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif'
