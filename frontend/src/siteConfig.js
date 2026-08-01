/**
 * Raffaello Restaurang — offentlig sajtinfo (adress följer Google Place).
 * Uppdatera telefon/e-post om de ändras.
 *
 * Öppettider och kapacitet för privata events: verifiera mot restaurangen innan go-live.
 */
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
    },
    {
      src: '/images/interior-dining.webp',
      srcSet:
        '/images/interior-dining-480.webp 480w, /images/interior-dining-800.webp 800w, /images/interior-dining.webp 1024w',
      sizes: '100vw',
      alt: 'Matsal på Raffaello restaurang Boden',
    },
    {
      src: '/images/interior-ambiance.webp',
      srcSet:
        '/images/interior-ambiance-480.webp 480w, /images/interior-ambiance-800.webp 800w, /images/interior-ambiance.webp 1024w',
      sizes: '100vw',
      alt: 'Mysig atmosfär på Raffaello Stekhus & Bar i Boden',
    },
    {
      src: '/images/interior-bar.webp',
      srcSet:
        '/images/interior-bar-480.webp 480w, /images/interior-bar-800.webp 800w, /images/interior-bar.webp 1024w',
      sizes: '100vw',
      alt: 'Bar på Raffaello Stekhus & Bar i Boden',
    },
    {
      src: '/images/dish-steak.webp',
      srcSet:
        '/images/dish-steak-480.webp 480w, /images/dish-steak-800.webp 800w, /images/dish-steak.webp 1024w',
      sizes: '100vw',
      alt: 'Grillad steak på Raffaello steakhouse i Boden',
    },
    {
      src: '/images/dish-salad.webp',
      srcSet:
        '/images/dish-salad-480.webp 480w, /images/dish-salad-800.webp 800w, /images/dish-salad.webp 1024w',
      sizes: '100vw',
      alt: 'Färsk sallad på Raffaello restaurang i Boden',
    },
  ],
  brandImageAlt: 'Raffaello Stekhus & Bar — restaurang i Boden',
  /** Navbar display size (~40 CSS px); full logo kept for schema/OG. */
  logoImage: '/raffaello-logo-80.webp',
  logoImageFull: '/raffaello-logo.webp',
  /** Dagens lunch på Mat och Mat. */
  lunchUrl: 'https://www.matochmat.se/lunch/boden/raffaello-stekhus-bar/',
  addressLine1: 'Drottninggatan 18',
  addressLine2: '961 35 Boden',
  phoneDisplay: '0921-214 010',
  phoneTel: '0921214010',
  email: 'info@raffaello.se',
  /** Bokningsknappar öppnar formuläret på kontaktsidan. */
  bookingUrl: '/kontakt#boka-bord',
  mapsUrl:
    'https://www.google.com/maps/place/Raffaello+Restaurang/@65.8226176,21.6817581,17z/data=!3m1!4b1!4m6!3m5!1s0x467f59ce90cbad0b:0xe08174b1ff4c6a65!8m2!3d65.8226176!4d21.6817581!16s%2Fg%2F11vs7x8lg9',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=65.8226176,21.6817581&hl=sv&z=16&output=embed',
  /**
   * Fullständig profil-URL. Tom sträng = ingen länk i sidfot (undvik generiska startsidor).
   */
  instagramUrl: 'https://www.instagram.com/raffaello_restaurang_iboden/',
  /**
   * Visas på startsidan och i sidfot. Uppdatera vid ändrade öppettider.
   * `days`: JS getDay() — 0 = söndag … 6 = lördag.
   */
  hoursSchedule: [
    { label: 'Mån–tors', days: [1, 2, 3, 4], opens: '10:45', closes: '21:00' },
    { label: 'Fredag', days: [5], opens: '10:45', closes: '22:00' },
    { label: 'Lördag', days: [6], opens: '12:00', closes: '22:00' },
    { label: 'Söndag', days: [0], opens: '12:00', closes: '21:00' },
  ],
  get openingHours() {
    return this.hoursSchedule.map(({ label, opens, closes }) => ({
      label,
      hours: `${opens} – ${closes}`,
    }))
  },
  /**
   * Siffror för sidan Privata events — bekräfta mot lokalen.
   */
  privateEvents: {
    indoorGuestsMax: 85,
    outdoorGuestsMax: 25,
    outdoorNote: 'utomhus · sommar',
  },
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
  return SITE.hoursSchedule.find((row) => row.days.includes(day)) ?? null
}

/**
 * Bokningsbara tider (30 min) under öppettid för datumet.
 * Första slot = öppning (t.ex. 10:45), därefter :00/:30 t.o.m. stängning.
 */
export function bookingSlotsForDate(isoDate) {
  const hours = getHoursForDate(isoDate)
  if (!hours) return []

  const start = hhmmToMinutes(hours.opens)
  const end = hhmmToMinutes(hours.closes)
  const slots = [minutesToHHMM(start)]

  let t = Math.ceil((start + 1) / 30) * 30
  while (t <= end) {
    slots.push(minutesToHHMM(t))
    t += 30
  }
  return slots
}

