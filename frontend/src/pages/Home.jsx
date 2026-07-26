import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import SectionPhoto from '../components/SectionPhoto'
import LazyMap from '../components/LazyMap'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`
const PREVIEW_COUNT = 6

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

/** Deterministic shuffle seed from calendar hour so the sample stays stable for everyone this hour. */
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

export default function Home() {
  const [allItems, setAllItems] = useState([])
  const [menuItems, setMenuItems] = useState([])

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
    <div>
      <Helmet>
        <title>Raffaello Restaurang | Steakhouse & Italian Restaurant i Boden</title>
        <meta
          name="description"
          content="Välkommen till Raffaello Restaurang i Boden. Njut av premium steaks, italienska rätter, pizza, pasta och en unik matupplevelse."
        />
        <link rel="canonical" href="https://raffaello.se/" />
        <link
          rel="preload"
          as="image"
          href={SITE.images.heroLcp}
          type="image/webp"
          fetchPriority="high"
        />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="sv_SE" />
        <meta property="og:site_name" content="Raffaello Restaurang" />
        <meta property="og:title" content="Raffaello Restaurang i Boden" />
        <meta
          property="og:description"
          content="Upptäck Raffaello Restaurang i Boden – italienska rätter, premium steaks, pizza, pasta och en unik restaurangupplevelse."
        />
        <meta property="og:url" content="https://raffaello.se/" />
        <meta
          property="og:image"
          content="https://raffaello.se/images/hero-interior.webp"
        />
        <meta property="og:image:alt" content="Raffaello Restaurang i Boden" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Raffaello Restaurang i Boden" />
        <meta
          name="twitter:description"
          content="Italienska rätter, premium steaks, pizza och pasta på Raffaello Restaurang i Boden."
        />
        <meta
          name="twitter:image"
          content="https://raffaello.se/images/hero-interior.webp"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            '@id': 'https://raffaello.se/#restaurant',

            name: 'Raffaello Stekhus & Bar',
            alternateName: 'Raffaello Restaurang',

            description:
              'Raffaello Stekhus & Bar i Boden erbjuder grillat kött, hamburgare, pizza, pasta och en avslappnad restaurangupplevelse med bar.',

            url: 'https://raffaello.se/',
            logo: 'https://raffaello.se/raffaello-logo.webp',
            image: 'https://raffaello.se/images/hero-interior.webp',

            telephone: '+46921214010',
            email: 'info@raffaello.se',

            servesCuisine: [
              'Steakhouse',
              'Grill',
              'Hamburgare',
              'Pizza',
              'Pasta',
            ],

            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Drottninggatan 18',
              postalCode: '961 35',
              addressLocality: 'Boden',
              addressRegion: 'Norrbottens län',
              addressCountry: 'SE',
            },

            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'https://schema.org/Monday',
                  'https://schema.org/Tuesday',
                  'https://schema.org/Wednesday',
                  'https://schema.org/Thursday',
                ],
                opens: '11:00',
                closes: '21:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'https://schema.org/Friday',
                  'https://schema.org/Saturday',
                ],
                opens: '11:00',
                closes: '23:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'https://schema.org/Sunday',
                opens: '11:00',
                closes: '21:00',
              },
            ],

            menu: 'https://raffaello.se/meny',

            sameAs: [
              'https://www.instagram.com/raffaello_restaurang_iboden/',
            ],
          })}
        </script>
      </Helmet>

      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop
          src={SITE.images.heroLcp}
          srcSet={`${SITE.images.heroLcp} 480w, ${SITE.images.heroMobile} 800w, ${SITE.images.hero} 1024w`}
          sizes="100vw"
          alt={SITE.imageAlts.hero}
          priority
        />
        <div className="relative z-10 px-6 max-w-4xl">
          <p className="mb-5 text-xs uppercase tracking-[0.35em] text-gold md:text-sm">
            {SITE.tagline}
          </p>
          <h1 className="font-brand text-5xl font-bold leading-[0.95] tracking-tight text-white md:text-7xl md:leading-none">
            Raffaello
          </h1>
          <p className="font-brand-sub mt-2 text-2xl italic text-white/85 md:text-3xl">
            {SITE.brandSubtitle}
          </p>
          <div className="mx-auto my-7 h-px w-24 bg-gold/90" />
          <p className="font-heading text-2xl text-white/90 md:text-3xl">
            Välkommen till bordet
          </p>
          <p className="mb-12 mt-2 text-xs uppercase tracking-[0.3em] text-white/45">
            Drottninggatan
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/meny"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Vår Meny
            </Link>
            <Link
              to={SITE.bookingUrl}
              className="inline-flex min-h-[44px] items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-all duration-300 hover:bg-gold-hover"
            >
              Boka bord
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2" aria-hidden>
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-gold/50">
            <div className="mt-2 h-3 w-1 rounded-full bg-gold/80" />
          </div>
        </div>
      </section>

      {/* ===== ABOUT TEASER ===== */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Vår Historia</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Grill. Värme. <span className="text-gold font-normal">Gemenskap.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Hos {SITE.shortName} möts grillade varmrätter, saftiga burgare och italienskt
              inspirerade förrätter med ett brett dryckesutbud — öl, drinkar, vin och mer — i en
              avslappnad miljö mitt i Boden.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Perfekt när du vill äta ordentligt: lunch med kollegorna, familjemiddag eller en
              kväll med vänner vid baren. Vi ses på Drottninggatan.
            </p>
            <ul className="space-y-3">
              {[
                'Grill, kött och fisk — generösa portioner från köket',
                'Hamburgare, tillbehör och dressingar till alla smaker',
                'Dryck, dessert och familjevänlig stämning',
              ].map(item => (
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
            <SectionPhoto src={SITE.images.dining} alt={SITE.imageAlts.dining} />
          </div>
        </div>
      </section>

      {/* ===== MENU PREVIEW ===== */}
      <section className="bg-dark-2 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Smakprov</p>
          <h2 className="font-heading text-4xl md:text-5xl text-white">Vår Meny</h2>
        </div>
        <div className="mx-auto min-h-[22rem] max-w-3xl space-y-6 sm:min-h-[24rem]">
          {menuItems.length > 0 ? (
            menuItems.map(item => (
              <div key={item.id} className="flex items-end gap-2">
                <h3 className="font-heading text-xl text-white whitespace-nowrap">
                  {item.name}
                </h3>
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

      {/* ===== PRIVATE EVENTS TEASER ===== */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <SectionPhoto src={SITE.images.ambiance} alt={SITE.imageAlts.ambiance} borderOffset="left" />
          </div>
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Privata Events</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Er kväll, <span className="text-gold font-normal">vår scen</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Planerar du möhippa, födelsedag eller firmafest? Hör av dig så tar vi fram
              ett upplägg som passar er grupp hos {SITE.shortName}.
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

      {/* ===== LOCATION MAP ===== */}
      <section className="bg-dark-2 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Hitta oss</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white">
              {SITE.addressLine1}, {SITE.addressLine2}
            </h2>
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
                  {SITE.addressLine1}<br />
                  {SITE.addressLine2}
                </p>
              </a>
              <div className="p-6 border border-white/10 hover:border-gold/30 transition-colors">
                <h3 className="font-heading text-xl text-white mb-3">🕐 Öppettider</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {SITE.openingHours.map(row => (
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
                  <a href={`tel:${SITE.phoneTel}`} className="hover:text-gold transition-colors">{SITE.phoneDisplay}</a><br />
                  <a href={`mailto:${SITE.email}`} className="hover:text-gold transition-colors">{SITE.email}</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
