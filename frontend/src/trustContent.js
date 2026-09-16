/**
 * P1-D trust/content contracts.
 * Never invent FAQ answers, legal copy, reviews, or positioning.
 * Empty collections → honest CONTENT REQUIRED UI + noindex (SEO G2).
 */

/** CLIENT CONFIRMATION / CONTENT REQUIRED — set approvedLine when restaurant signs off. */
export const POSITIONING = {
  status: 'CONTENT_REQUIRED',
  /** When non-null non-empty, hero may use this as the approved positioning line. */
  approvedLine: null,
}

/**
 * FAQ items: only entries with both question + answer are renderable.
 * Leave empty until restaurant supplies real Q&A.
 */
export const FAQ_ITEMS = [
  // Example shape (do not invent answers):
  // { id: 'booking', question: '…', answer: '…' },
]

/**
 * Legal page bodies. Null/empty → CONTENT REQUIRED empty state + noindex.
 * Do not paste unverified GDPR/terms text.
 */
export const LEGAL_PAGES = {
  bokningsvillkor: {
    title: 'Bokningsvillkor',
    description:
      'Villkor för bordsbokning på Raffaello. Text publiceras när den är godkänd.',
    canonical: 'https://raffaello.se/bokningsvillkor',
    /** Markdown-ish plain paragraphs when ready; empty = CONTENT REQUIRED */
    paragraphs: [],
  },
  integritet: {
    title: 'Integritetspolicy',
    description:
      'Information om hur Raffaello hanterar personuppgifter. Text publiceras när den är godkänd.',
    canonical: 'https://raffaello.se/integritet',
    paragraphs: [],
  },
}

export function faqItemsReady(items = FAQ_ITEMS) {
  return items.filter(
    (item) =>
      item &&
      typeof item.question === 'string' &&
      item.question.trim() &&
      typeof item.answer === 'string' &&
      item.answer.trim(),
  )
}

export function legalPageReady(key, pages = LEGAL_PAGES) {
  const page = pages[key]
  if (!page) return false
  return Array.isArray(page.paragraphs) && page.paragraphs.some((p) => String(p).trim())
}

export function positioningLineReady(pos = POSITIONING) {
  return Boolean(pos?.approvedLine && String(pos.approvedLine).trim())
}
