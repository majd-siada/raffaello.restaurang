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
  /** Original logotyp (från restaurangen). */
  logoImage: '/raffaello-logo.png',
  /** Foto från Google Maps (Place) — logotyp och miljö i lokalen. */
  brandImage: '/raffaello-google-photo.jpg',
  brandImageAlt: 'Raffaello Stekhus & Bar — restaurang i Boden',
  addressLine1: 'Drottninggatan 18',
  addressLine2: '961 35 Boden',
  phoneDisplay: '0921-214 010',
  phoneTel: '0921214010',
  email: 'info@raffaello.se',
  /** Bokning sker via telefon (inga uppgifter om bokabord.se hittades). */
  bookingUrl: 'tel:0921214010',
  mapsUrl:
    'https://www.google.com/maps/place/Raffaello+Restaurang/@65.8226176,21.6817581,17z/data=!3m1!4b1!4m6!3m5!1s0x467f59ce90cbad0b:0xe08174b1ff4c6a65!8m2!3d65.8226176!4d21.6817581!16s%2Fg%2F11vs7x8lg9',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=65.8226176,21.6817581&hl=sv&z=16&output=embed',
  /**
   * Fullständig profil-URL. Tom sträng = ingen länk i sidfot (undvik generiska startsidor).
   */
  instagramUrl: '',
  tiktokUrl: '',
  /**
   * Visas på startsidan och i sidfot. Uppdatera vid ändrade öppettider.
   */
  openingHours: [
    { label: 'Mån–tors', hours: '11:00 – 21:00' },
    { label: 'Fredag', hours: '11:00 – 23:00' },
    { label: 'Lördag', hours: '11:00 – 23:00' },
    { label: 'Söndag', hours: '11:00 – 21:00' },
  ],
  /**
   * Siffror för sidan Privata events — bekräfta mot lokalen.
   */
  privateEvents: {
    indoorGuestsMax: 85,
    outdoorGuestsMax: 25,
    outdoorNote: 'utomhus · sommar',
  },
}
