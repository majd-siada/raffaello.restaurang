import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/offers/`

const DEFAULT_INTRO =
  'Till veckans erbjudande får ni välja en valfri förrätt från menyn där det ingår dryck, öl, stark öl och vin.'

function formatPrice(price) {
  if (price == null || price === '') return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} SEK`
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.00$/, '')} SEK`
}

function DishRow({ dish }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
          {dish.name}
        </h3>
        <span className="shrink-0 font-heading text-base font-semibold text-gold sm:text-lg">
          {formatPrice(dish.price)}
        </span>
      </div>
      {dish.description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {dish.description}
        </p>
      )}
    </div>
  )
}

function WeekSection({ slot, offer, primary }) {
  const dishes = offer?.dishes || []
  const hasDishes = dishes.length > 0
  const intro = (offer?.intro_text || '').trim() || DEFAULT_INTRO
  const weekLabel = offer?.week_number != null ? `v ${offer.week_number}` : ''

  return (
    <section
      className={`scroll-mt-28 rounded-sm border px-6 py-10 sm:px-10 ${
        primary
          ? 'border-gold/40 bg-dark-2'
          : 'border-white/10 bg-dark opacity-90'
      }`}
    >
      <p
        className={`mb-2 text-xs uppercase tracking-[0.2em] ${
          primary ? 'text-gold' : 'text-white/45'
        }`}
      >
        {slot}
      </p>
      <h2
        className={`font-heading font-bold tracking-wide ${
          primary ? 'text-2xl text-white sm:text-3xl' : 'text-xl text-white/85 sm:text-2xl'
        }`}
      >
        {weekLabel || '—'}
      </h2>
      <div className={`mt-3 h-px w-16 ${primary ? 'bg-gold' : 'bg-white/25'}`} />

      {hasDishes ? (
        <>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">{intro}</p>
          <div className="mt-8 max-w-3xl">
            {dishes.map((dish) => (
              <DishRow key={dish.id} dish={dish} />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm italic text-white/45">
          Inget erbjudande publicerat ännu
        </p>
      )}
    </section>
  )
}

export default function WeeklyOffer() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('failed')
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <Helmet>
        <title>Veckans Erbjudande | Raffaello Restaurang</title>
        <meta
          name="description"
          content="Se Raffaellos veckans erbjudande — förra veckan, denna vecka och nästa veckas plan."
        />
        <link rel="canonical" href="https://raffaello.se/veckans-erbjudande" />
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
                name: 'Veckans Erbjudande',
                item: 'https://raffaello.se/veckans-erbjudande',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop images={SITE.gallery} alt={SITE.imageAlts.dining} />
        <div className="relative z-10 px-6">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">
            Steakhouse &amp; Bar
          </p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">
            Veckans Erbjudande
          </h1>
          <div className="mx-auto h-px w-16 bg-gold" />
        </div>
      </section>

      <section className="bg-dark px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Varje vecka</p>
          <h2 className="mb-6 font-heading text-3xl text-white md:text-4xl">
            Grillade favoriter till <span className="text-gold font-normal">ett pris</span>
          </h2>
          <p className="leading-relaxed text-white/60">
            Varje vecka sätter vi ihop ett särskilt erbjudande — ofta en huvudrätt med förrätt och
            dryck. Här ser du förra veckans rätt, vad som gäller just nu, och vad som kommer nästa
            vecka.
          </p>
        </div>
      </section>

      <section className="bg-dark-2 px-6 pb-24 pt-4">
        <div className="mx-auto max-w-3xl space-y-8">
          {loading && (
            <p className="py-12 text-center text-sm uppercase tracking-widest text-white/50">
              Laddar…
            </p>
          )}

          {error && !loading && (
            <p className="py-12 text-center text-sm text-white/55">
              Erbjudandet kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <WeekSection
                slot="Förra veckan"
                offer={data.previous}
                primary={false}
              />
              <WeekSection
                slot="Denna vecka"
                offer={data.current}
                primary
              />
              <WeekSection
                slot="Nästa vecka"
                offer={data.next}
                primary={false}
              />
            </>
          )}
        </div>
      </section>

      <section className="bg-dark px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">Välkommen in</p>
          <h2 className="mb-6 font-heading text-3xl text-white md:text-4xl">
            Varmt välkommen till oss
          </h2>
          <div className="mx-auto mb-8 h-px w-16 bg-gold" />
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/meny"
              className="border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Se menyn
            </Link>
            <Link
              to={SITE.bookingUrl}
              className="bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-all duration-300 hover:bg-gold-hover"
            >
              Boka bord
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
