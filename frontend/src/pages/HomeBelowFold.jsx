import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import { HOME_SECTION_ORDER } from '../navConfig'
import { formatPrice } from '../formatPrice'
import SectionPhoto from '../components/SectionPhoto'
import LazyMap from '../components/LazyMap'
import { Section, SectionHeading } from '../components/ui/Section'
import { ButtonLink } from '../components/ui/Button'
import Reveal from '../components/ui/Reveal'

export { HOME_SECTION_ORDER }

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`
const GALLERY_API_URL = `${import.meta.env.VITE_API_URL || ''}/api/gallery/`
const LUNCH_API_URL = `${import.meta.env.VITE_API_URL || ''}/api/lunch/`
const OFFERS_API_URL = `${import.meta.env.VITE_API_URL || ''}/api/offers/`
const REVIEWS_API_URL = `${import.meta.env.VITE_API_URL || ''}/api/reviews/`
const PREVIEW_COUNT = 6
const API_ORIGIN = import.meta.env.VITE_API_URL || ''

function resolveMediaSrc(src) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  return `${API_ORIGIN}${src}`
}

function flattenMenuItems(categories) {
  if (!Array.isArray(categories)) return []
  return categories.flatMap((cat) => [
    ...(cat.items || [])
      .filter((i) => i.is_available !== false)
      .map((i) => ({ ...i, category: cat.name })),
    ...(cat.subcategories || []).flatMap((sub) =>
      (sub.items || [])
        .filter((i) => i.is_available !== false)
        .map((i) => ({ ...i, category: sub.name })),
    ),
  ])
}

function hourSeed(date = new Date()) {
  return (
    date.getFullYear() * 1_000_000 +
    (date.getMonth() + 1) * 10_000 +
    date.getDate() * 100 +
    date.getHours()
  )
}

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pickSignaturePool(items) {
  const featured = items.filter((i) => i.is_featured === true)
  if (featured.length > 0) return featured
  // Prefer grill / varmrätt categories when staff has not flagged featured yet
  // (still real CMS items only — no invented dishes).
  const preferred = items.filter((i) =>
    /grill|varmrätt|steak|kött|pasta|hamburg/i.test(String(i.category || '')),
  )
  return preferred.length >= 3 ? preferred : items
}

function pickHourlySample(items, count = PREVIEW_COUNT, date = new Date()) {
  if (items.length <= count) return items
  const rand = mulberry32(hourSeed(date))
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

function msUntilNextHour(date = new Date()) {
  const next = new Date(date)
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  return Math.max(1000, next.getTime() - date.getTime())
}

function siteGalleryFallback() {
  return SITE.gallery.map((photo) => ({
    src: photo.src,
    srcSet: photo.srcSet,
    sizes: photo.sizes || '100vw',
    alt: photo.alt || '',
    objectPosition: photo.objectPosition || 'center',
  }))
}

/**
 * Homepage below-fold sequence (V6).
 * Reviews omitted when CMS empty.
 * Gallery: CMS photos, else real SITE.gallery assets.
 */
export default function HomeBelowFold() {
  const [allItems, setAllItems] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [menuError, setMenuError] = useState(false)
  /** null = loading; non-empty = CMS or SITE fallback photos */
  const [galleryPhotos, setGalleryPhotos] = useState(null)
  const [galleryFromCms, setGalleryFromCms] = useState(false)
  /** null = loading; [] = hide; non-empty = curated reviews */
  const [reviews, setReviews] = useState(null)
  const [lunchState, setLunchState] = useState({ loading: true, empty: true, week: null })
  const [offerState, setOfferState] = useState({ loading: true, hasCurrent: false, title: '' })

  useEffect(() => {
    let cancelled = false
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const items = flattenMenuItems(data)
        setAllItems(items)
        const pool = pickSignaturePool(items)
        setMenuItems(pickHourlySample(pool))
        setMenuError(false)
      })
      .catch(() => {
        if (!cancelled) setMenuError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(GALLERY_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (!Array.isArray(data) || data.length === 0) {
          setGalleryFromCms(false)
          setGalleryPhotos(siteGalleryFallback())
          return
        }
        setGalleryFromCms(true)
        setGalleryPhotos(
          data.slice(0, 6).map((photo) => ({
            src: resolveMediaSrc(photo.src),
            srcSet: undefined,
            sizes: undefined,
            alt: photo.alt || '',
          })),
        )
      })
      .catch(() => {
        if (!cancelled) {
          setGalleryFromCms(false)
          setGalleryPhotos(siteGalleryFallback())
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(REVIEWS_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setReviews(
          list.filter(
            (r) =>
              r &&
              typeof r.quote === 'string' &&
              r.quote.trim() &&
              typeof r.author_name === 'string' &&
              r.author_name.trim() &&
              typeof r.source === 'string' &&
              r.source.trim(),
          ),
        )
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(LUNCH_API_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) {
          if (!cancelled) setLunchState({ loading: false, empty: true, week: null })
          return
        }
        const dishes = Array.isArray(data.dishes) ? data.dishes : []
        setLunchState({
          loading: false,
          empty: data.empty === true || dishes.length === 0,
          week: data.week_number ?? null,
        })
      })
      .catch(() => {
        if (!cancelled) setLunchState({ loading: false, empty: true, week: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(OFFERS_API_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const current = data?.current
        const dishes = Array.isArray(current?.dishes) ? current.dishes : []
        const intro = (current?.intro_text || '').trim()
        const hasCurrent = Boolean(current && (intro || dishes.length > 0))
        const title =
          intro ||
          (current?.week_number != null ? `Vecka ${current.week_number}` : '')
        setOfferState({ loading: false, hasCurrent, title })
      })
      .catch(() => {
        if (!cancelled) setOfferState({ loading: false, hasCurrent: false, title: '' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (allItems.length === 0) return undefined
    let timerId
    const schedule = () => {
      setMenuItems(pickHourlySample(allItems))
      timerId = window.setTimeout(schedule, msUntilNextHour())
    }
    timerId = window.setTimeout(schedule, msUntilNextHour())
    return () => window.clearTimeout(timerId)
  }, [allItems])

  return (
    <>
      {/* 2. ATMOSPHERE */}
      <Section id="home-atmosphere" tone="bg" data-home-section="atmosphere">
        <Reveal>
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
            <div>
              <SectionHeading
                eyebrow="Atmosfär"
                title={
                  <>
                    Grill. Värme. <span className="font-normal text-gold">Gemenskap.</span>
                  </>
                }
              />
              <p className="mt-5 leading-relaxed text-white/60 md:mt-6">
                Hos {SITE.shortName} möts steakhouse och italienska smaker: grillat kött, saftiga
                hamburgare, pizza och pasta — plus ett brett dryckesutbud i en avslappnad miljö mitt
                i centrala Boden.
              </p>
              <p className="mt-5 leading-relaxed text-white/60">
                Perfekt när du vill äta ordentligt: lunch i Boden med kollegorna, familjemiddag eller
                en kväll med vänner vid baren. Vi ses på Drottninggatan.
              </p>
            </div>
            <div className="relative">
              <SectionPhoto images={SITE.gallery} alt={SITE.imageAlts.dining} />
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 3. SIGNATURES — live menu API only */}
      <Section id="home-signatures" tone="dark-2" data-home-section="signatures">
        <Reveal>
          <SectionHeading
            align="center"
            className="mb-10 md:mb-12"
            eyebrow="Smakprov"
            title="Grill, pasta, pizza och hamburgare"
            description="Ett urval från menyn — se hela steakhouse- och grillmenyn med priser."
          />
          <div className="mx-auto min-h-[22rem] max-w-3xl space-y-6 sm:min-h-[24rem]">
            {menuError ? (
              <p className="text-center text-sm text-white/50">
                Menyn kunde inte laddas just nu. Se{' '}
                <Link to="/meny" className="text-gold hover:underline">
                  hela menyn
                </Link>
                .
              </p>
            ) : menuItems.length > 0 ? (
              menuItems.map((item) => (
                <div key={item.id} className="flex items-end gap-2">
                  <h3 className="whitespace-nowrap font-heading text-xl text-white">{item.name}</h3>
                  <div className="mb-1 flex-1 border-b border-dotted border-gold/40" />
                  <span className="whitespace-nowrap font-heading text-xl text-gold">
                    {formatPrice(item.price)}
                  </span>
                </div>
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-end gap-2">
                  <div className="h-5 w-40 rounded bg-white/10" />
                  <div className="mb-1 flex-1 border-b border-dotted border-gold/20" />
                  <div className="h-5 w-16 rounded bg-white/10" />
                </div>
              ))
            )}
          </div>
          <div className="mt-12 text-center">
            <ButtonLink to="/meny" variant="secondary">
              Se hela menyn
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      {/* 4. WHY — existing verified story copy */}
      <Section id="home-why" tone="bg" data-home-section="why">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              align="center"
              eyebrow="Vår Historia"
              title="Varför Raffaello"
            />
            <ul className="mx-auto mt-6 max-w-lg space-y-4 text-left md:mt-8">
              {[
                'Grillrätter och premium kött — generösa portioner från köket',
                'Hamburgare, pizza, pasta och tillbehör till alla smaker',
                'Dryck, dessert och mysig stämning för hela familjen',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/70">
                  <span className="text-lg text-gold">✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink to="/om-oss" variant="secondary" className="mt-10">
              Läs mer om oss
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      {/* 5. BAR — omitted (CLIENT CONFIRMATION REQUIRED) */}

      {/* 6. LUNCH / OFFER TEASERS — always link; honest empty */}
      <Section id="home-lunch-offer" tone="dark-2" data-home-section="lunch-offer">
        <Reveal>
          <SectionHeading
            align="center"
            className="mb-12"
            eyebrow="Vardag & vecka"
            title="Lunch och erbjudande"
          />
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <Link
              to="/lunch"
              className="block border border-white/10 p-8 transition-colors hover:border-gold/40 md:p-10"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">Lunch</p>
              <h3 className="mb-3 font-heading text-2xl text-white">Dagens lunch</h3>
              {lunchState.loading ? (
                <p className="text-sm text-white/45">Laddar…</p>
              ) : lunchState.empty ? (
                <p className="text-sm leading-relaxed text-white/50">
                  Ingen lunchmeny publicerad för den här veckan ännu
                  {lunchState.week != null ? ` (v ${lunchState.week})` : ''}. Se sidan för uppdateringar.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/60">
                  Veckans lunchmeny är publicerad
                  {lunchState.week != null ? ` (v ${lunchState.week})` : ''}. Se rätter och priser.
                </p>
              )}
              <span className="mt-6 inline-block text-xs uppercase tracking-widest text-gold">
                Till lunch →
              </span>
            </Link>
            <Link
              to="/veckans-erbjudande"
              className="block border border-white/10 p-8 transition-colors hover:border-gold/40 md:p-10"
            >
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">Erbjudande</p>
              <h3 className="mb-3 font-heading text-2xl text-white">Veckans Erbjudande</h3>
              {offerState.loading ? (
                <p className="text-sm text-white/45">Laddar…</p>
              ) : offerState.hasCurrent ? (
                <p className="text-sm leading-relaxed text-white/60">
                  {offerState.title
                    ? offerState.title
                    : 'Se veckans erbjudande med detaljer och pris.'}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/50">
                  Inget aktuellt erbjudande publicerat just nu. Titta in på sidan för kommande veckor.
                </p>
              )}
              <span className="mt-6 inline-block text-xs uppercase tracking-widest text-gold">
                Till erbjudande →
              </span>
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* 7. PRIVATE EVENTS — space first, then inquiry (one composition) */}
      <Section id="home-events" tone="bg" data-home-section="events">
        <Reveal>
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="relative">
              <SectionPhoto
                images={[...SITE.gallery.slice(2), ...SITE.gallery.slice(0, 2)]}
                alt={SITE.imageAlts.ambiance}
              />
            </div>
            <div className="md:pl-2">
              <SectionHeading
                eyebrow="Eventförfrågan"
                title={
                  <>
                    Er kväll, <span className="font-normal text-gold">vår scen</span>
                  </>
                }
                description={`Planerar du födelsedagsmiddag, firmafest eller företagsevent? Se lokalen — skicka sedan en förfrågan så tar vi fram ett upplägg för gruppbokning hos ${SITE.shortName} i Boden.`}
              />
              <ButtonLink to="/privata-events" variant="secondary" className="mt-6">
                Eventförfrågan
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 8. TRUST / REVIEWS — real curated quotes only */}
      {reviews && reviews.length > 0 && (
        <Section id="home-reviews" tone="bg" data-home-section="reviews">
          <Reveal>
            <SectionHeading
              align="center"
              className="mb-12"
              eyebrow="Gäster"
              title={
                <>
                  Vad gäster <span className="font-normal text-gold">säger</span>
                </>
              }
              description="Utvalda omdömen från verkliga gäster."
            />
            <ul className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
              {reviews.map((review) => (
                <li
                  key={review.id}
                  className="border border-white/5 bg-elevated px-6 py-8 shadow-[var(--shadow-card)]"
                >
                  {review.rating != null && (
                    <p className="mb-3 text-xs uppercase tracking-widest text-gold" aria-label={`Betyg ${review.rating} av 5`}>
                      {review.rating}/5
                    </p>
                  )}
                  <blockquote className="font-heading text-lg leading-relaxed text-white/85">
                    “{review.quote}”
                  </blockquote>
                  <p className="mt-5 text-sm text-white/50">
                    <span className="text-white/70">{review.author_name}</span>
                    {' · '}
                    {review.source}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </Section>
      )}

      {/* 9. GALLERY — CMS when present, else real SITE photos */}
      {galleryPhotos && galleryPhotos.length > 0 && (
        <Section id="home-gallery" tone="dark-2" data-home-section="gallery">
          <Reveal>
            <SectionHeading
              align="center"
              className="mb-10 md:mb-12"
              eyebrow="Galleri"
              title={
                <>
                  Från <span className="font-normal text-gold">köket</span> till bordet
                </>
              }
              description={
                galleryFromCms
                  ? `En glimt av atmosfären hos ${SITE.shortName} — mat, bar och gemenskap i Boden.`
                  : `Bilder från ${SITE.shortName} — matsal, bar och stämning på Drottninggatan.`
              }
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {galleryPhotos.map((photo, i) => (
                <div
                  key={`${photo.src}-${i}`}
                  className="gallery-item relative aspect-[4/3] overflow-hidden bg-dark"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <img
                    src={photo.src}
                    srcSet={photo.srcSet}
                    sizes={photo.sizes}
                    alt={photo.alt || ''}
                    className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:hover:scale-[1.03]"
                    style={{ objectPosition: photo.objectPosition || 'center' }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <ButtonLink to="/galleri" variant="secondary">
                Se galleriet
              </ButtonLink>
            </div>
          </Reveal>
        </Section>
      )}

      {/* 10. LOCATION + HOURS */}
      <Section id="home-location" tone="bg" data-home-section="location">
        <Reveal>
          <SectionHeading
            align="center"
            className="mb-10 md:mb-12"
            eyebrow="Hitta oss"
            title={`${SITE.addressLine1}, ${SITE.addressLine2}`}
            description="Restaurang i centrala Boden — välkommen in för lunch, middag eller en kväll vid baren."
          />
          <div className="grid items-start gap-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <LazyMap />
            </div>
            <div className="space-y-8">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-white/10 p-6 transition-colors hover:border-gold/30"
              >
                <h3 className="mb-3 font-heading text-xl text-white">Adress</h3>
                <p className="text-sm leading-relaxed text-white/60 transition-colors group-hover:text-gold">
                  {SITE.addressLine1}
                  <br />
                  {SITE.addressLine2}
                </p>
              </a>
              <div className="border border-white/10 p-6 transition-colors hover:border-gold/30">
                <h3 className="mb-3 font-heading text-xl text-white">Öppettider</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {SITE.openingHours.map((row) => (
                    <span key={row.label}>
                      {row.label}: {row.hours}
                      <br />
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-xs text-white/40">
                  Köket stänger 30 minuter innan restaurangen stänger.
                </p>
              </div>
              <div className="border border-white/10 p-6 transition-colors hover:border-gold/30">
                <h3 className="mb-3 font-heading text-xl text-white">Kontakt</h3>
                <p className="text-sm leading-relaxed text-white/60">
                  <a href={`tel:${SITE.phoneTel}`} className="transition-colors hover:text-gold">
                    {SITE.phoneDisplay}
                  </a>
                  <br />
                  <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-gold">
                    {SITE.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 11. BOOKING CLOSE */}
      <Section id="home-booking-close" tone="dark-2" data-home-section="booking-close">
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <SectionHeading
              align="center"
              eyebrow="Boka bord"
              title="Skicka en bordsförfrågan"
              description="Ingen automatisk direktbekräftelse — restaurangen bekräftar din bokning. Upp till 6 personer online."
            />
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <ButtonLink to={SITE.bookingUrl} variant="primary">
                Boka bord
              </ButtonLink>
              <ButtonLink href={`tel:${SITE.phoneTel}`} external variant="outline">
                Ring
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
