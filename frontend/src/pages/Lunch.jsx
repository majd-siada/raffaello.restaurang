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

/** Same writing style as Meny MenuItemRow. */
function DishRow({ dish }) {
  const priceLabel = formatPrice(dish.price)
  return (
    <article className="mb-7 last:mb-0" aria-label={dish.name}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
          {dish.name}
        </h3>
        {priceLabel && (
          <span className="shrink-0 font-heading text-base font-semibold tabular-nums tracking-wide text-gold sm:text-lg">
            {priceLabel}
          </span>
        )}
      </div>
      {dish.description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {dish.description}
        </p>
      )}
    </article>
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

function DayBlock({ group, isToday }) {
  return (
    <section
      id={`lunch-day-${group.weekday}`}
      className="scroll-mt-32 mb-16 sm:mb-20"
      aria-labelledby={`lunch-day-title-${group.weekday}`}
    >
      <div className="mb-5">
        <h2
          id={`lunch-day-title-${group.weekday}`}
          className="font-heading text-2xl font-bold tracking-wide text-cream sm:text-3xl"
        >
          {group.label}
          {isToday ? (
            <span className="ml-3 text-sm font-normal uppercase tracking-[0.2em] text-gold">
              Idag
            </span>
          ) : null}
        </h2>
        <div className="mt-3 h-px w-full bg-white/25" />
      </div>
      <div className="max-w-3xl space-y-1">
        {group.dishes.map((dish) => (
          <DishRow key={dish.id} dish={dish} />
        ))}
      </div>
    </section>
  )
}

function WeekMenu({ lunch, activeDay, onSelectDay }) {
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

  const visibleDays =
    activeDay == null ? days : days.filter((g) => g.weekday === activeDay)

  if (!hasDishes) {
    return (
      <div id="lunch-vecka" className="scroll-mt-28 max-w-3xl">
        {notes && (
          <p className="mb-4 text-sm italic leading-relaxed text-white/80">{notes}</p>
        )}
        <p className="text-sm italic text-white/70">Ingen lunchmeny publicerad ännu</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
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
      </div>
    )
  }

  return (
    <div id="lunch-vecka" className="scroll-mt-28">
      <div className="mb-10 max-w-3xl">
        <p className="mb-2 text-xs uppercase tracking-[0.24em] text-gold">
          Denna vecka{weekLabel ? ` · ${weekLabel}` : ''}
        </p>
        <p className="text-sm leading-relaxed text-white/70">{intro}</p>
        {notes && (
          <p className="mt-3 text-sm italic leading-relaxed text-gold/90">{notes}</p>
        )}
        {hours && (
          <p className="mt-2 text-sm leading-relaxed text-white/55">{hours}</p>
        )}
        {todayEmpty && (
          <p className="mt-4 text-sm italic text-white/60">
            Ingen lunch publicerad för idag i källan — övriga dagar denna vecka visas nedan.
          </p>
        )}
      </div>

      {days.length > 0 && (
        <nav
          className="sticky top-16 z-30 mb-10 min-h-[56px] border-b border-white/10 bg-black/85 backdrop-blur-sm md:top-[4.5rem]"
          aria-label="Lunchdagar"
        >
          <div className="mx-auto flex max-w-4xl gap-2.5 overflow-x-auto overscroll-x-contain px-0 py-3.5 sm:gap-3 [-webkit-overflow-scrolling:touch]">
            <button
              type="button"
              onClick={() => onSelectDay(null)}
              aria-pressed={activeDay === null}
              className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                activeDay === null
                  ? 'border-gold bg-gold text-dark'
                  : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
              }`}
            >
              Alla
            </button>
            {days.map((group) => (
              <button
                key={group.weekday}
                type="button"
                onClick={() => onSelectDay(group.weekday)}
                aria-pressed={activeDay === group.weekday}
                className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                  activeDay === group.weekday
                    ? 'border-gold bg-gold text-dark'
                    : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                }`}
              >
                {group.label}
                {group.weekday === today ? ' · Idag' : ''}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto max-w-4xl">
        {visibleDays.map((group) => (
          <DayBlock
            key={group.weekday}
            group={group}
            isToday={group.weekday === today}
          />
        ))}

        {other.length > 0 && activeDay == null && (
          <section className="mb-16 scroll-mt-32 sm:mb-20">
            <div className="mb-5">
              <h2 className="font-heading text-2xl font-bold tracking-wide text-cream sm:text-3xl">
                Övrigt
              </h2>
              <div className="mt-3 h-px w-full bg-white/25" />
            </div>
            <div className="max-w-3xl space-y-1">
              {other.map((dish) => (
                <DishRow key={dish.id} dish={dish} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default function Lunch() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(null)

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
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const scrollToToday = () => {
      const dayEl = document.getElementById(`lunch-day-${todayWeekday()}`)
      const target = dayEl || document.getElementById('lunch-vecka')
      if (!target) return false
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
      return true
    }

    const id = window.requestAnimationFrame(() => {
      if (!scrollToToday()) window.setTimeout(scrollToToday, 100)
    })
    return () => window.cancelAnimationFrame(id)
  }, [loading, error, data])

  const selectDay = (weekday) => {
    setActiveDay(weekday)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() => {
      const target =
        weekday == null
          ? document.getElementById('lunch-vecka')
          : document.getElementById(`lunch-day-${weekday}`)
      target?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black pb-24 text-white/80 md:pb-0">
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

      <section className="relative bg-gradient-to-b from-black/85 via-black/90 to-black px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          {loading && (
            <p className="py-12 text-center text-sm uppercase tracking-widest text-white/50">
              Laddar…
            </p>
          )}

          {error && !loading && (
            <p className="py-12 text-center text-sm text-white/60">
              Lunchmenyn kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && (
            <WeekMenu lunch={data} activeDay={activeDay} onSelectDay={selectDay} />
          )}
        </div>
      </section>

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
