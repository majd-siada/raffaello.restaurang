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
      'Hur Raffaello Stekhus & Bar i Boden hanterar personuppgifter vid bokning och kontakt.',
    canonical: 'https://raffaello.se/integritet',
    paragraphs: [
      '## Personuppgifter hos Raffaello',
      'Raffaello Stekhus & Bar (Drottninggatan 18, 961 35 Boden) ansvarar för personuppgifter som du lämnar via vår webbplats. Kontakta oss på 0921-214 010 eller info@raffaello.se om du har frågor om hur vi hanterar dina uppgifter.',
      '## Vilka uppgifter samlar vi in?',
      'När du skickar en bordsförfrågan eller en förfrågan om privata events samlar vi in de uppgifter du själv fyller i: namn, telefonnummer, e-postadress samt uppgifter om datum, tid, antal gäster och eventuellt meddelande. Vi skapar inte gästkonton på webbplatsen.',
      '## Varför behandlar vi uppgifterna?',
      'Uppgifterna används för att ta emot och hantera din förfrågan, kontakta dig om bokningen eller eventet, och för att restaurangen ska kunna planera besöket. Behandlingen sker för att kunna fullgöra steg inför ett avtal (bordsbokning/event) och för vårt berättigade intresse att driva verksamheten.',
      '## Vem får ta del av uppgifterna?',
      'Uppgifterna lagras i vårt bokningssystem och kan visas för behörig personal. När en bokningsförfrågan kommer in skickas en intern notifiering till restaurangen via Telegram — endast till restaurangens mottagare. Gäster får inga Telegram-meddelanden från oss. Vi säljer inte dina personuppgifter.',
      '## Cookies och teknik',
      'Den publika webbplatsen använder nödvändiga tekniska cookies för säkerhet (till exempel CSRF-skydd) när det behövs. Inloggning för personal använder sessionscookies. Vi använder inte marknadsföringscookies eller tredjepartsanalys på den publika sajten i nuvarande version.',
      '## Hur länge sparas uppgifterna?',
      'Boknings- och eventuppgifter sparas så länge det behövs för att hantera förfrågan, genomföra besöket och eventuell uppföljning eller bokförings-/verksamhetsbehov. Därefter raderas eller avidentifieras uppgifterna när de inte längre behövs.',
      '## Dina rättigheter',
      'Du har rätt att begära tillgång till, rättelse av eller radering av dina personuppgifter, samt att invända mot behandling i den utsträckning lagen medger. Kontakta oss på info@raffaello.se eller 0921-214 010. Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY).',
      '## Ändringar',
      'Denna information kan uppdateras om hur vi samlar in eller använder uppgifter förändras. Senaste versionen publiceras på denna sida.',
    ],
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
