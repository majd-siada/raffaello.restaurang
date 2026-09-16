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
 *
 * Paragraphs may start with "## " for section headings.
 */
export const LEGAL_PAGES = {
  bokningsvillkor: {
    title: 'Bokningsvillkor',
    description:
      'Boknings- och avbokningspolicy för bordsförfrågan på Raffaello Stekhus & Bar i Boden.',
    canonical: 'https://raffaello.se/bokningsvillkor',
    paragraphs: [
      '## Boknings- och avbokningspolicy',
      'Hos Raffaello Stekhus & Bar kan du skicka en bordsförfrågan via webbplatsen. När vi mottagit din förfrågan återkommer vi med bekräftelse — det finns ingen automatisk direktbekräftelse online.',
      '## Hur många kan boka online?',
      'Online kan du boka för upp till 6 gäster. Det finns inget minimiantal. Är ni fler, eller har särskilda önskemål, är ni välkomna att kontakta oss så hjälper vi er med en större bokning. För större sällskap, se även sidan Privata events.',
      '## Avbokning och ändring',
      'Det finns ingen avbokningsavgift och ingen avgift om någon uteblir. Hör av er så snart ni kan om ni behöver avboka eller ändra bokningen — gärna minst en timme före den bokade tiden, så att bordet kan frigöras för andra gäster.',
      '## Kontakt',
      'Vi kan behöva ringa dig angående bokningen. Kontakta oss på 0921-214 010 eller info@raffaello.se.',
    ],
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
