import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE, openingHoursToSchema } from '../siteConfig'
import { getHoursForDate, hydrateOpeningHoursFromApi } from '../openingHours'
import { HERO_BUSINESS_CTAS } from '../navConfig'
import HeroBackdrop from '../components/HeroBackdrop'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const HomeBelowFold = lazy(() => import('./HomeBelowFold'))

const HERO_LCP = {
  src: SITE.images.heroLcp,
  srcSet: `${SITE.images.heroLcp} 480w, ${SITE.images.heroMobile} 800w, ${SITE.images.hero} 1024w`,
  sizes: '100vw',
  alt: SITE.imageAlts.hero,
}

export default function Home() {
  const [todayHours, setTodayHours] = useState(() => getHoursForDate(todayISO()))
  const [schemaHours, setSchemaHours] = useState(() => openingHoursToSchema())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await hydrateOpeningHoursFromApi()
      if (!cancelled && ok) {
        setTodayHours(getHoursForDate(todayISO()))
        setSchemaHours(openingHoursToSchema())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <Helmet>
        <title>Raffaello – Steakhouse, italiensk restaurang och lunch i Boden</title>
        <meta
          name="description"
          content="Besök Raffaello i centrala Boden för grillat kött, italienska rätter, pizza, pasta och dagens lunch. Se menyn och boka bord online."
        />
        <link rel="canonical" href="https://raffaello.se/" />

        <meta property="og:type" content="website" />
        <meta property="og:locale" content="sv_SE" />
        <meta property="og:site_name" content="Raffaello Restaurang" />
        <meta
          property="og:title"
          content="Raffaello – Steakhouse, italiensk restaurang och lunch i Boden"
        />
        <meta
          property="og:description"
          content="Besök Raffaello i centrala Boden för grillat kött, italienska rätter, pizza, pasta och dagens lunch. Se menyn och boka bord online."
        />
        <meta property="og:url" content="https://raffaello.se/" />
        <meta property="og:image" content="https://raffaello.se/images/hero-interior.webp" />
        <meta property="og:image:alt" content="Raffaello Stekhus & Bar i centrala Boden" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Raffaello – Steakhouse, italiensk restaurang och lunch i Boden"
        />
        <meta
          name="twitter:description"
          content="Grillat kött, italienska rätter, pizza, pasta och dagens lunch på Raffaello i Boden. Se menyn och boka bord online."
        />
        <meta name="twitter:image" content="https://raffaello.se/images/hero-interior.webp" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Restaurant',
            '@id': 'https://raffaello.se/#restaurant',
            name: 'Raffaello Stekhus & Bar',
            alternateName: 'Raffaello Restaurang',
            description:
              'Raffaello är ett steakhouse och italiensk restaurang i centrala Boden med grillat kött, pizza, pasta, hamburgare och dagens lunch.',
            url: 'https://raffaello.se/',
            logo: 'https://raffaello.se/raffaello-logo.webp',
            image: 'https://raffaello.se/images/hero-interior.webp',
            telephone: '+46921214010',
            email: 'info@raffaello.se',
            servesCuisine: ['Steakhouse', 'Grill', 'Hamburgare', 'Pizza', 'Pasta'],
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Drottninggatan 18',
              postalCode: '961 35',
              addressLocality: 'Boden',
              addressRegion: 'Norrbottens län',
              addressCountry: 'SE',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: SITE.geo.latitude,
              longitude: SITE.geo.longitude,
            },
            openingHoursSpecification: schemaHours,
            menu: 'https://raffaello.se/meny',
            sameAs: ['https://www.instagram.com/raffaello_restaurang_iboden/'],
          })}
        </script>
      </Helmet>

      <section className="relative flex min-h-[100dvh] flex-col overflow-x-hidden">
        <HeroBackdrop
          images={[HERO_LCP]}
          alt={SITE.imageAlts.hero}
          priority
          objectPosition="center 32%"
        />
        {/* Controlled bottom veil — Riva composition, Raffaello content */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-bg via-bg/75 to-bg/20"
        />
        <div
          className="relative z-10 flex min-h-[100dvh] flex-1 flex-col"
          style={{ paddingTop: 'max(5.5rem, calc(env(safe-area-inset-top) + 4.5rem))' }}
        >
          <div className="relative flex flex-1 flex-col items-center justify-end px-5 pb-6 pt-6 text-center sm:px-6 sm:pb-8 md:pb-10">
            <div className="relative w-full max-w-4xl">
              <p className="mb-3 text-[0.65rem] uppercase tracking-[0.32em] text-gold sm:mb-4 sm:text-xs md:tracking-[0.35em]">
                Stekhus &amp; Bar · Boden
              </p>
              <h1 className="font-brand text-[2.75rem] font-bold leading-[0.95] tracking-tight text-cream drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)] sm:text-5xl md:text-7xl md:leading-[1.05]">
                Raffaello
              </h1>
              <p className="font-brand-sub mt-1.5 text-xl italic text-cream/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:mt-2 sm:text-2xl md:text-3xl">
                {SITE.brandSubtitle}
              </p>
              <div className="mx-auto my-4 h-px w-16 bg-gold/90 sm:my-5 sm:w-20" />
              <p className="mx-auto max-w-xl text-pretty font-heading text-lg leading-snug text-cream/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] sm:text-xl md:text-2xl">
                {SITE.positioning?.approvedLine?.trim() ||
                  'Grill, pasta, pizza och bar — mitt i Boden'}
              </p>
              <p className="mt-2 text-[0.65rem] uppercase tracking-[0.24em] text-cream/60 sm:mt-3 sm:text-xs sm:tracking-[0.28em]">
                {SITE.addressLine1}
              </p>
              <div className="mt-7 flex w-full max-w-md flex-col gap-2.5 sm:mx-auto sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
                {HERO_BUSINESS_CTAS.map((cta) => (
                  <Link
                    key={cta.to}
                    to={cta.to}
                    className={
                      cta.variant === 'solid'
                        ? 'inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-colors duration-300 hover:bg-gold-hover sm:w-auto'
                        : 'inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-gold/60 bg-transparent px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/10 sm:w-auto'
                    }
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 bg-bg/85 backdrop-blur-md">
            <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-white/10 px-4 py-2.5 text-left sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 sm:py-3.5">
              <div className="px-2 py-1.5 sm:px-4 sm:py-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Öppettider idag</p>
                <p className="mt-0.5 text-sm text-cream/85 sm:mt-1">
                  {todayHours
                    ? `${todayHours.opens} – ${todayHours.closes}`
                    : 'Se öppettider'}
                </p>
              </div>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 transition-colors hover:text-gold sm:px-4 sm:py-2"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Adress</p>
                <p className="mt-0.5 text-sm text-cream/85 sm:mt-1">
                  {SITE.addressLine1}, {SITE.addressLine2}
                </p>
              </a>
              <a
                href={`tel:${SITE.phoneTel}`}
                className="px-2 py-1.5 transition-colors hover:text-gold sm:px-4 sm:py-2"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">Telefon</p>
                <p className="mt-0.5 text-sm text-cream/85 sm:mt-1">{SITE.phoneDisplay}</p>
              </a>
            </div>
            <p className="border-t border-white/5 px-4 py-1.5 text-center text-[11px] text-white/40 sm:py-2">
              Köket stänger 30 minuter innan restaurangen stänger.
            </p>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <HomeBelowFold />
      </Suspense>
    </div>
  )
}
