import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

export default function Lunch() {
  return (
    <div>
      <Helmet>
        <title>Dagens lunch i Boden | Lunchmeny – Raffaello</title>
        <meta
          name="description"
          content="Dagens lunch och lunchmeny på Raffaello i centrala Boden. Lunchrestaurang med god lunch nära Drottninggatan — se veckans lunch och boka bord."
        />
        <link rel="canonical" href="https://raffaello.se/lunch" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Hem',
                item: 'https://raffaello.se/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Lunch',
                item: 'https://raffaello.se/lunch',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop images={SITE.gallery} alt={SITE.imageAlts.dining} />
        <div className="relative z-10 px-6">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">
            Lunchrestaurang Boden
          </p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">
            Dagens lunch i Boden
          </h1>
          <div className="mx-auto h-px w-16 bg-gold" />
        </div>
      </section>

      <section className="bg-dark px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Lunchmeny</p>
          <h2 className="mb-6 font-heading text-3xl text-white md:text-4xl">
            Ät lunch i centrala Boden
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-white/60">
            Hos {SITE.shortName} på {SITE.addressLine1} serverar vi dagens lunch för dig som vill
            äta gott mitt i Boden — företagslunch, snabb paus eller en lugnare stund vid bordet.
          </p>
          <p className="mb-12 leading-relaxed text-white/60">
            Se veckans lunch med dagens rätt och priser hos Mat och Mat, eller boka bord om ni är
            flera kollegor.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={SITE.lunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-all duration-300 hover:bg-gold-hover"
            >
              Se veckans lunch
            </a>
            <Link
              to={SITE.bookingUrl}
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Boka bord
            </Link>
            <Link
              to="/meny"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Se hela menyn
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
