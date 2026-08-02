import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/lunch/`

const DEFAULT_INTRO =
  'Varje vardag serverar vi dagens lunch — se veckans rätter och priser här.'

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

function groupDishes(dishes) {
  const byDay = new Map()
  const other = []

  for (const dish of dishes) {
    if (dish.weekday == null) {
      other.push(dish)
      continue
    }
    const key = dish.weekday
    if (!byDay.has(key)) {
      byDay.set(key, { label: dish.weekday_label || `Dag ${key}`, dishes: [] })
    }
    byDay.get(key).dishes.push(dish)
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group)

  return { days, other }
}

function WeekSection({ slot, lunch, primary }) {
  const dishes = lunch?.dishes || []
  const hasDishes = dishes.length > 0
  const intro = (lunch?.intro_text || '').trim() || DEFAULT_INTRO
  const notes = (lunch?.notes || '').trim()
  const weekLabel = lunch?.week_number != null ? `v ${lunch.week_number}` : ''
  const { days, other } = groupDishes(dishes)

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
          {notes && (
            <p className="mt-3 max-w-2xl text-sm italic leading-relaxed text-white/50">{notes}</p>
          )}

          <div className="mt-8 max-w-3xl space-y-8">
            {days.map((group) => (
              <div key={group.label}>
                <h3 className="mb-4 font-heading text-sm uppercase tracking-[0.15em] text-white/70">
                  {group.label}
                </h3>
                {group.dishes.map((dish) => (
                  <DishRow key={dish.id} dish={dish} />
                ))}
              </div>
            ))}

            {other.length > 0 && (
              <div>
                {days.length > 0 && (
                  <h3 className="mb-4 font-heading text-sm uppercase tracking-[0.15em] text-white/70">
                    Övrigt
                  </h3>
                )}
                {other.map((dish) => (
                  <DishRow key={dish.id} dish={dish} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm italic text-white/45">
          Ingen lunchmeny publicerad ännu
        </p>
      )}
    </section>
  )
}

export default function Lunch() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

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

      <section className="bg-dark px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Lunchmeny</p>
          <h2 className="mb-6 font-heading text-3xl text-white md:text-4xl">
            Ät lunch i centrala Boden
          </h2>
          <p className="leading-relaxed text-white/60">
            Hos {SITE.shortName} på {SITE.addressLine1} serverar vi dagens lunch för dig som vill
            äta gott mitt i Boden — företagslunch, snabb paus eller en lugnare stund vid bordet.
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
              Lunchmenyn kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <WeekSection slot="Förra veckan" lunch={data.previous} primary={false} />
              <WeekSection slot="Denna vecka" lunch={data.current} primary />
              <WeekSection slot="Nästa vecka" lunch={data.next} primary={false} />
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
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to={SITE.bookingUrl}
              className="inline-flex min-h-[44px] items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-all duration-300 hover:bg-gold-hover"
            >
              Boka bord
            </Link>
            <Link
              to="/meny"
              className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-all duration-300 hover:bg-gold hover:text-dark"
            >
              Se hela menyn
            </Link>
            <a
              href={SITE.lunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center border border-white/25 px-8 py-3 text-sm uppercase tracking-widest text-white/70 transition-all duration-300 hover:border-white/50 hover:text-white"
            >
              Även på Mat och Mat
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
