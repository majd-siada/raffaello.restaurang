/**
 * Display hygiene for CMS offer text — does not invent new claims.
 */
export function formatOfferIntroText(text) {
  if (!text || !String(text).trim()) return ''
  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^Tillveckans\b/i, 'Till veckans')
}

export function formatDishDescription(text) {
  if (!text) return ''
  return String(text).replace(/\r\n/g, '\n').trim()
}
