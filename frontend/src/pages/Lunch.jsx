import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import { formatPrice } from '../formatPrice'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/lunch/`

const DEFAULT_INTRO =
  'Varje vardag serverar vi dagens lunch — se veckans rätter och priser här.'

function DishRow({ dish }) {
  const priceLabel = formatPrice(dish.price)
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
          {dish.name}
        </h3>
        {priceLabel && (
          <span className="shrink-0 font-heading text-base font-semibold tabular-nums text-gold sm:text-lg">
            {priceLabel}
          </span>
        )}
      </div>
      {dish.description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {dish.description}
        </p>
      )}
    </div>
  )
}

/** JS getDay() (0=Sun) → Django weekday (0=Mon … 6=Sun). */
function todayWeekday() {
  const js = new Date().getDay()
  return js === 0 ? 6 : js - 1
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
      byDay.set(key, {
        weekday: key,
        label: dish.weekday_label || `Dag ${key}`,
        dishes: [],
      })
    }
    byDay.get(key).dishes.push(dish)
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group)

  return { days, other }
}

function WeekSection({ lunch }) {
  const dishes = lunch?.dishes || []
  const hasDishes = dishes.length > 0
  const intro = (lunch?.intro_text || '').trim() || DEFAULT_INTRO
  const notes = (lunch?.notes || '').trim()
  const hours = (lunch?.lunch_hours_text || '').trim()
  const weekLabel = lunch?.week_number != null ? `v ${lunch.week_number}` : ''
  const { days, other } = groupDishes(dishes)
  const today = todayWeekday()
  const todayEmpty =
    hasDishes && lunch?.today_has_dishes === false && lunch?.today_weekday != null

  return (
    <section
      id="lunch-vecka"
      className="scroll-mt-28 rounded-sm border border-gold/40 bg-elevated px-6 py-10 sm:px-10"
    >
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-gold">Denna vecka</p>
      <h2 className="font-heading text-2xl font-bold tracking-wide text-cream sm:text-3xl">
        {weekLabel || '—'}
      </h2>
      <div className="mt-3 h-px w-16 bg-gold" />

      {hasDishes ? (
        <>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>
          {notes && (
            <p className="mt-3 max-w-2xl text-sm italic leading-relaxed text-muted">{notes}</p>
          )}
          {hours && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted/90">{hours}</p>
          )}
          {todayEmpty && (
            <p className="mt-4 max-w-2xl text-sm italic text-muted">
              Ingen lunch publicerad för idag i källan — övriga dagar denna vecka visas nedan.
            </p>
          )}

          <div className="mt-8 max-w-3xl space-y-8">
            {days.map((group) => {
              const isToday = group.weekday === today
              return (
                <div
                  key={group.weekday}
                  id={`lunch-day-${group.weekday}`}
                  className={`scroll-mt-28 ${
                    isToday
                      ? 'border-l-2 border-gold bg-gold/[0.06] py-4 pl-4 pr-2 sm:pl-5'
                      : ''
                  }`}
                >
                  <h3
                    className={`mb-4 font-heading text-sm uppercase tracking-[0.15em] ${
                      isToday ? 'text-gold' : 'text-cream/70'
                    }`}
                  >
                    {group.label}
                    {isToday ? (
                      <span className="ml-2 text-[0.65rem] font-normal tracking-[0.2em] text-gold/80">
                        · Idag
                      </span>
                    ) : null}
                  </h3>
                  {group.dishes.map((dish) => (
                    <DishRow key={dish.id} dish={dish} />
                  ))}
                </div>
              )
            })}

            {other.length > 0 && (
              <div>
                {days.length > 0 && (
                  <h3 className="mb-4 font-heading text-sm uppercase tracking-[0.15em] text-cream/70">
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
        <>
          {notes && (
            <p className="mt-6 max-w-2xl text-sm italic leading-relaxed text-muted">{notes}</p>
          )}
          <p className="mt-6 text-sm italic text-muted">
            Ingen lunchmeny publicerad ännu
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Lunch är en fast del av vår verksamhet. Veckans rätter publiceras här när de är klara.
            Boka bord eller ring oss så hjälper vi dig.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to={SITE.bookingUrl} variant="primary">
              Boka bord
            </ButtonLink>
            <a
              href={`tel:${SITE.phoneTel}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-gold/50 bg-transparent px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-gold transition-colors duration-300 hover:border-gold hover:bg-gold/10"
            >
              Ring {SITE.phoneDisplay}
            </a>
          </div>
        </>
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

  useEffect(() => {
    if (loading || error || !data) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const scrollToToday = () => {
      const dayEl = document.getElementById(`lunch-day-${todayWeekday()}`)
      const target = dayEl || document.getElementById('lunch-vecka')
      if (!target) return false
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return true
    }

    if (scrollToToday()) return undefined
    const timer = window.setTimeout(scrollToToday, 100)
    return () => window.clearTimeout(timer)
  }, [loading, error, data])

  return (
    <div className="pb-24 md:pb-0">
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

      <Section tone="bg" className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Lunchmeny"
            title="Ät lunch i centrala Boden"
            align="center"
            description={`Hos ${SITE.shortName} på ${SITE.addressLine1} serverar vi dagens lunch för dig som vill äta gott mitt i Boden — företagslunch, snabb paus eller en lugnare stund vid bordet.`}
            className="mx-auto"
          />
        </div>
      </Section>

      <Section tone="dark-2" className="pb-24 pt-4 md:pb-28">
        <div className="mx-auto max-w-3xl space-y-8">
          {loading && (
            <p className="py-12 text-center text-sm uppercase tracking-widest text-muted">
              Laddar…
            </p>
          )}

          {error && !loading && (
            <p className="py-12 text-center text-sm text-muted">
              Lunchmenyn kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && <WeekSection lunch={data} />}
        </div>
      </Section>

      <Section tone="bg" className="text-center">
        <div className="mx-auto max-w-xl">
          <SectionHeading
            eyebrow="Välkommen in"
            title="Varmt välkommen till oss"
            align="center"
            className="mx-auto mb-8"
          />
          <div className="mx-auto mb-8 h-px w-16 bg-gold" />
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink to={SITE.bookingUrl} variant="primary">
              Boka bord
            </ButtonLink>
            <ButtonLink to="/meny" variant="outline">
              Se hela menyn
            </ButtonLink>
            <ButtonLink href={SITE.lunchUrl} external variant="ghost">
              Även på Mat och Mat
            </ButtonLink>
          </div>
        </div>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-black/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <ButtonLink to={SITE.bookingUrl} variant="primary" className="w-full">
          Boka bord
        </ButtonLink>
      </div>
    </div>
  )
}
