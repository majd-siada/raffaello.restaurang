import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

const HomeBelowFold = lazy(() => import('./HomeBelowFold'))

const HERO_LCP = {
  src: SITE.images.heroLcp,
  srcSet: `${SITE.images.heroLcp} 480w, ${SITE.images.heroMobile} 800w, ${SITE.images.hero} 1024w`,
  sizes: '100vw',
  alt: SITE.imageAlts.hero,
}

export default function Home() {
  return (
    <div>
      <Helmet>
        <title>Raffaello – Steakhouse, italiensk restaurang och lunch i Boden</title>
        <meta
          name="description"
          content="Besök Raffaello i centrala Boden för grillat kött, italienska rätter, pizza, pasta och dagens lunch. Se menyn och boka bord online."
        />
        <link rel="canonical" href="https://raffaello.se/" />
        <link
          rel="preload"
          as="image"
          href={SITE.images.heroLcp}
          imageSrcSet={`${SITE.images.heroLcp} 480w, ${SITE.images.heroMobile} 800w, ${SITE.images.hero} 1024w`}
          imageSizes="100vw"
          type="image/webp"
          fetchPriority="high"
        />

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
            openingHoursSpecification: [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                  'https://schema.org/Monday',
                  'https://schema.org/Tuesday',
                  'https://schema.org/Wednesday',
                  'https://schema.org/Thursday',
                ],
                opens: '10:45',
                closes: '21:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'https://schema.org/Friday',
                opens: '10:45',
                closes: '22:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'https://schema.org/Saturday',
                opens: '12:00',
                closes: '22:00',
              },
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'https://schema.org/Sunday',
                opens: '12:00',
                closes: '21:00',
              },
            ],
            menu: 'https://raffaello.se/meny',
            sameAs: ['https://www.instagram.com/raffaello_restaurang_iboden/'],
          })}
        </script>
      </Helmet>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop images={[HERO_LCP]} alt={SITE.imageAlts.hero} priority />
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
          <p className="font-heading text-2xl text-white/90 md:text-3xl">Välkommen till bordet</p>
          <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/45">Drottninggatan</p>
          <p className="mb-12 mt-4 text-sm text-white/50">
            Köket stänger 30 minuter innan restaurangen stänger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/meny"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Vår Meny
            </Link>
            <Link
              to="/veckans-erbjudande"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Veckans Erbjudande
            </Link>
            <Link
              to="/lunch"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Lunch
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

      <Suspense fallback={null}>
        <HomeBelowFold />
      </Suspense>
    </div>
  )
}
