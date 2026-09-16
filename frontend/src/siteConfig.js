/**
 * Raffaello Restaurang — offentlig sajtinfo (adress följer Google Place).
 * Uppdatera telefon/e-post om de ändras.
 *
 * Öppettider och kapacitet för privata events: verifiera mot restaurangen innan go-live.
 */
import { HOURS_SCHEDULE, openingHoursDisplayRows } from './openingHours'

export const SITE = {
  name: 'Raffaello Restaurang',
  shortName: 'Raffaello',
  /** Övre rad i hero (versaler). */
  tagline: 'Stekhus & bar · Boden',
  /** Rad under logotypen i navbar och hero (kursiv). */
  brandSubtitle: 'Stekhus & Bar',
  /** Restaurang- och matfoton för hero och sektioner (WebP). */
  images: {
    hero: '/images/hero-interior.webp',
    heroMobile: '/images/hero-interior-800.webp',
    heroLcp: '/images/hero-interior-480.webp',
    dining: '/images/interior-dining.webp',
    ambiance: '/images/interior-ambiance.webp',
    bar: '/images/interior-bar.webp',
    steak: '/images/dish-steak.webp',
    salad: '/images/dish-salad.webp',
  },
  /** Alt-texter för SEO och tillgänglighet — unikt per bild. */
  imageAlts: {
    hero: 'Raffaello Stekhus & Bar — restauranginteriör i centrala Boden',
    dining: 'Matsal på Raffaello restaurang Boden',
    ambiance: 'Mysig atmosfär på Raffaello Stekhus & Bar i Boden',
    bar: 'Bar på Raffaello Stekhus & Bar i Boden',
    steak: 'Grillad steak på Raffaello steakhouse i Boden',
    salad: 'Färsk sallad på Raffaello restaurang i Boden',
    logo: 'Raffaello Restaurang logotyp',
  },
  /** Rotating gallery (~4s) for heroes and section photos. */
  gallery: [
    {
      src: '/images/hero-interior.webp',
      srcSet:
        '/images/hero-interior-480.webp 480w, /images/hero-interior-800.webp 800w, /images/hero-interior.webp 1024w',
      sizes: '100vw',
      alt: 'Raffaello Stekhus & Bar — restauranginteriör i centrala Boden',
      objectPosition: 'center 35%',
    },
    {
      src: '/images/interior-dining.webp',
      srcSet:
        '/images/interior-dining-480.webp 480w, /images/interior-dining-800.webp 800w, /images/interior-dining.webp 1024w',
      sizes: '100vw',
      alt: 'Matsal på Raffaello restaurang Boden',
      objectPosition: 'center 40%',
    },
    {
      src: '/images/interior-ambiance.webp',
      srcSet:
        '/images/interior-ambiance-480.webp 480w, /images/interior-ambiance-800.webp 800w, /images/interior-ambiance.webp 1024w',
      sizes: '100vw',
      alt: 'Mysig atmosfär på Raffaello Stekhus & Bar i Boden',
      objectPosition: 'center center',
    },
    {
      src: '/images/interior-bar.webp',
      srcSet:
        '/images/interior-bar-480.webp 480w, /images/interior-bar-800.webp 800w, /images/interior-bar.webp 1024w',
      sizes: '100vw',
      alt: 'Bar på Raffaello Stekhus & Bar i Boden',
      objectPosition: 'center 30%',
    },
    {
      src: '/images/dish-steak.webp',
      srcSet:
        '/images/dish-steak-480.webp 480w, /images/dish-steak-800.webp 800w, /images/dish-steak.webp 1024w',
      sizes: '100vw',
      alt: 'Grillad steak på Raffaello steakhouse i Boden',
      objectPosition: 'center 45%',
    },
    {
      src: '/images/dish-salad.webp',
      srcSet:
        '/images/dish-salad-480.webp 480w, /images/dish-salad-800.webp 800w, /images/dish-salad.webp 1024w',
      sizes: '100vw',
      alt: 'Färsk sallad på Raffaello restaurang i Boden',
      objectPosition: 'center 40%',
    },
  ],
  brandImageAlt: 'Raffaello Stekhus & Bar — restaurang i Boden',
  /** Navbar display size (~40 CSS px); full logo kept for schema/OG. */
  logoImage: '/raffaello-logo-80.webp',
  logoImageFull: '/raffaello-logo.webp',
  /** Dagens lunch på Mat och Mat (external source of truth for daily lunch). */
  lunchUrl: 'https://www.matochmat.se/restauranger/boden/lunch/raffaello-stekhus-bar/',
  addressLine1: 'Drottninggatan 18',
  addressLine2: '961 35 Boden',
  phoneDisplay: '0921-214 010',
  phoneTel: '0921214010',
  email: 'info@raffaello.se',
  /** Bokningsknappar → dedikerad bokningssida. */
  bookingUrl: '/boka',
  mapsUrl:
    'https://www.google.com/maps/place/Raffaello+Restaurang/@65.8226176,21.6817581,17z/data=!3m1!4b1!4m6!3m5!1s0x467f59ce90cbad0b:0xe08174b1ff4c6a65!8m2!3d65.8226176!4d21.6817581!16s%2Fg%2F11vs7x8lg9',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=65.8226176,21.6817581&hl=sv&z=16&output=embed',
  /**
   * Same place coordinates already published in mapsUrl / mapsEmbedUrl (Google Maps place).
   * Used for Restaurant JSON-LD `geo` only — do not invent alternate coordinates.
   */
  geo: {
    latitude: 65.8226176,
    longitude: 21.6817581,
  },
  /**
   * Fullständig profil-URL. Tom sträng = ingen länk i sidfot (undvik generiska startsidor).
   */
  instagramUrl: 'https://www.instagram.com/raffaello_restaurang_iboden/',
  /**
   * Öppettider: canonical JSON — se openingHours.js / backend raffaello/data/opening_hours.json.
   * Uppdatera JSON-filerna (FE+BE måste matcha) efter bekräftelse från restaurangen.
   */
  get hoursSchedule() {
    return HOURS_SCHEDULE
  },
  get openingHours() {
    return openingHoursDisplayRows()
  },
  /**
   * Privata events — capacity numbers only when restaurant has confirmed.
   * CLIENT CONFIRMATION REQUIRED (P1 ACCEPTANCE E3).
   */
  privateEvents: {
    capacitiesConfirmed: false,
    indoorGuestsMax: 85,
    outdoorGuestsMax: 25,
    outdoorNote: 'utomhus · sommar',
  },
  /**
   * Brand positioning — CONTENT REQUIRED / CLIENT CONFIRMATION REQUIRED.
   * When approvedLine is set, Home hero uses it; otherwise interim tagline stays.
   */
  positioning: {
    status: 'CONTENT_REQUIRED',
    approvedLine: null,
  },
}

export {
  bookingSlotsForDate,
  getHoursForDate,
  HOURS_SCHEDULE,
  MAX_GUESTS_ONLINE,
  openingHoursToSchema,
} from './openingHours'


