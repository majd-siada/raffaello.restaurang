import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import SectionPhoto from '../components/SectionPhoto'
import LazyMap from '../components/LazyMap'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`
const GALLERY_API_URL = `${import.meta.env.VITE_API_URL || ''}/api/gallery/`
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

/** Below-fold home sections — lazy-loaded so mobile LCP/TBT stay light. */
export default function HomeBelowFold() {
  const [allItems, setAllItems] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [galleryPhotos, setGalleryPhotos] = useState(SITE.gallery)

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
        setMenuItems(pickHourlySample(items))
      })
      .catch(() => {})
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
          setGalleryPhotos(SITE.gallery)
          return
        }
        setGalleryPhotos(
          data.slice(0, 6).map((photo) => ({
            src: resolveMediaSrc(photo.src),
            alt: photo.alt || '',
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setGalleryPhotos(SITE.gallery)
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
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Vår Historia</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Grill. Värme. <span className="text-gold font-normal">Gemenskap.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Hos {SITE.shortName} möts steakhouse och italienska smaker: grillat kött, saftiga
              hamburgare, pizza och pasta — plus ett brett dryckesutbud i en avslappnad miljö mitt
              i centrala Boden.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Perfekt när du vill äta ordentligt: lunch i Boden med kollegorna, familjemiddag eller
              en kväll med vänner vid baren. Vi ses på Drottninggatan.
            </p>
            <ul className="space-y-3">
              {[
                'Grillrätter och premium kött — generösa portioner från köket',
                'Hamburgare, pizza, pasta och tillbehör till alla smaker',
                'Dryck, dessert och mysig stämning för hela familjen',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/70">
                  <span className="text-gold text-lg">✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/om-oss"
              className="inline-block mt-8 border border-gold text-gold px-6 py-2.5 uppercase tracking-widest text-sm hover:bg-gold hover:text-dark transition-all duration-300"
            >
              Läs mer om oss
            </Link>
          </div>
          <div className="relative">
            <SectionPhoto images={SITE.gallery} alt={SITE.imageAlts.dining} />
          </div>
        </div>
      </section>

      <section className="bg-dark-2 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Smakprov</p>
          <h2 className="font-heading text-4xl md:text-5xl text-white">
            Grill, pasta, pizza och hamburgare
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55 leading-relaxed">
            Ett urval från menyn — se hela steakhouse- och grillmenyn med priser.
          </p>
        </div>
        <div className="mx-auto min-h-[22rem] max-w-3xl space-y-6 sm:min-h-[24rem]">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div key={item.id} className="flex items-end gap-2">
                <h3 className="font-heading text-xl text-white whitespace-nowrap">{item.name}</h3>
                <div className="flex-1 border-b border-dotted border-gold/40 mb-1" />
                <span className="text-gold font-heading text-xl whitespace-nowrap">
                  {item.price} kr
                </span>
              </div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-end gap-2 animate-pulse">
                <div className="h-5 w-40 bg-white/10 rounded" />
                <div className="flex-1 border-b border-dotted border-gold/20 mb-1" />
                <div className="h-5 w-16 bg-white/10 rounded" />
              </div>
            ))
          )}
        </div>
        <div className="text-center mt-12">
          <Link
            to="/meny"
            className="border border-gold text-gold px-8 py-3 uppercase tracking-widest text-sm hover:bg-gold hover:text-dark transition-all duration-300 inline-block"
          >
            Se hela menyn
          </Link>
        </div>
      </section>

      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Galleri</p>
          <h2 className="font-heading text-4xl md:text-5xl text-white mb-4">
            Från <span className="text-gold font-normal">köket</span> till bordet
          </h2>
          <p className="text-white/60 max-w-xl mx-auto leading-relaxed">
            En glimt av atmosfären hos {SITE.shortName} — mat, bar och gemenskap i Boden.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {galleryPhotos.map((photo, i) => (
            <div
              key={`${photo.src}-${i}`}
              className="gallery-item relative aspect-[4/3] overflow-hidden bg-dark-2"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(min-width: 768px) 33vw, 50vw"
                alt={photo.alt || ''}
                className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dark-2 py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <SectionPhoto
              images={[...SITE.gallery.slice(2), ...SITE.gallery.slice(0, 2)]}
              alt={SITE.imageAlts.ambiance}
              borderOffset="left"
            />
          </div>
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Privata Events</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Er kväll, <span className="text-gold font-normal">vår scen</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Planerar du födelsedagsmiddag, firmafest eller företagsevent? Hör av dig så tar vi
              fram ett upplägg för gruppbokning hos {SITE.shortName} i Boden.
            </p>
            <Link
              to="/privata-events"
              className="inline-block border border-gold text-gold px-6 py-2.5 uppercase tracking-widest text-sm hover:bg-gold hover:text-dark transition-all duration-300"
            >
              Läs mer om privata events
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Hitta oss</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white">
              {SITE.addressLine1}, {SITE.addressLine2}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/55 leading-relaxed">
              Restaurang i centrala Boden — välkommen in för lunch, middag eller en kväll vid baren.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
              <LazyMap />
            </div>
            <div className="space-y-8">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 border border-white/10 hover:border-gold/30 transition-colors group"
              >
                <h3 className="font-heading text-xl text-white mb-3">📍 Adress</h3>
                <p className="text-white/60 text-sm leading-relaxed group-hover:text-gold transition-colors">
                  {SITE.addressLine1}
                  <br />
                  {SITE.addressLine2}
                </p>
              </a>
              <div className="p-6 border border-white/10 hover:border-gold/30 transition-colors">
                <h3 className="font-heading text-xl text-white mb-3">🕐 Öppettider</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {SITE.openingHours.map((row) => (
                    <span key={row.label}>
                      {row.label}: {row.hours}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
              <div className="p-6 border border-white/10 hover:border-gold/30 transition-colors">
                <h3 className="font-heading text-xl text-white mb-3">📞 Kontakt</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  <a href={`tel:${SITE.phoneTel}`} className="hover:text-gold transition-colors">
                    {SITE.phoneDisplay}
                  </a>
                  <br />
                  <a href={`mailto:${SITE.email}`} className="hover:text-gold transition-colors">
                    {SITE.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
