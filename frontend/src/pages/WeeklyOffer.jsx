import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import { formatDishDescription, formatOfferIntroText } from '../offerFormat'
import { formatPrice } from '../formatPrice'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/offers/`

const DEFAULT_INTRO =
  'Till veckans erbjudande får ni välja en valfri förrätt från menyn där det ingår dryck, öl, stark öl och vin.'

const WEEK_SLOTS = [
  { key: 'previous', slot: 'Förra veckan', id: 'forra-veckan' },
  { key: 'current', slot: 'Denna vecka', id: 'denna-vecka', primary: true },
  { key: 'next', slot: 'Nästa vecka', id: 'nasta-vecka' },
]

/** Same writing style as Meny MenuItemRow. */
function DishRow({ dish }) {
  const description = formatDishDescription(dish.description)
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
      {description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {description}
        </p>
      )}
    </article>
  )
}

function WeekBlock({ slot, offer, primary, id }) {
  const dishes = offer?.dishes || []
  const hasDishes = dishes.length > 0
  const rawIntro = (offer?.intro_text || '').trim()
  const intro = formatOfferIntroText(rawIntro) || (hasDishes ? DEFAULT_INTRO : '')
  const weekLabel = offer?.week_number != null ? `v ${offer.week_number}` : ''
  const titleId = `${id}-title`

  return (
    <section
      id={id}
      className="mb-16 scroll-mt-32 sm:mb-20"
      aria-labelledby={titleId}
    >
      <div className="mb-5">
        <p
          className={`mb-2 text-xs uppercase tracking-[0.24em] ${
            primary ? 'text-gold' : 'text-white/45'
          }`}
        >
          {slot}
        </p>
        <h2
          id={titleId}
          className={`font-heading font-bold tracking-wide ${
            primary
              ? 'text-2xl text-cream sm:text-3xl'
              : 'text-2xl text-cream/85 sm:text-3xl'
          }`}
        >
          {weekLabel || '—'}
          {primary ? (
            <span className="ml-3 text-sm font-normal uppercase tracking-[0.2em] text-gold">
              Nu
            </span>
          ) : null}
        </h2>
        <div className="mt-3 h-px w-full bg-white/25" />
      </div>

      {hasDishes ? (
        <>
          {intro && (
            <p
              className={`mb-6 max-w-3xl text-sm italic leading-relaxed ${
                primary ? 'text-gold/90' : 'text-white/70'
              }`}
            >
              {intro}
            </p>
          )}
          <div className="max-w-3xl space-y-1">
            {dishes.map((dish) => (
              <DishRow key={dish.id} dish={dish} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm italic leading-relaxed text-white/70">
            Inget erbjudande publicerat ännu
          </p>
          {primary && (
            <>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Veckans Erbjudande är en fast del av vår verksamhet. När veckans rätt är
                publicerad syns den här.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to={SITE.bookingUrl} variant="primary">
                  Boka bord
                </ButtonLink>
                <ButtonLink to="/meny" variant="secondary">
                  Se menyn
                </ButtonLink>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default function WeeklyOffer() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSlot, setActiveSlot] = useState('current')

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

  // Always land on this week's offer (below the hero).
  useEffect(() => {
    if (loading || error || !data) return undefined
    const el = document.getElementById('denna-vecka')
    if (!el) return undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [loading, error, data])

  const selectSlot = (key, id) => {
    setActiveSlot(key)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  }

  const visibleSlots =
    activeSlot == null
      ? WEEK_SLOTS
      : WEEK_SLOTS.filter((s) => s.key === activeSlot)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black pb-24 text-white/80 md:pb-0">
      <Helmet>
        <title>Veckans erbjudande | Raffaello Stekhus & Bar i Boden</title>
        <meta
          name="description"
          content="Se Raffaellos veckans erbjudande i Boden — förra veckan, denna vecka och nästa veckas plan. Boka bord och njut av en god middag."
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

      <Section tone="bg" className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Varje vecka"
            title={
              <>
                Grillade favoriter till <span className="font-normal text-gold">ett pris</span>
              </>
            }
            align="center"
            description="Varje vecka sätter vi ihop ett särskilt erbjudande — ofta en huvudrätt med förrätt och dryck. Här ser du förra veckans rätt, vad som gäller just nu, och vad som kommer nästa vecka."
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
              Erbjudandet kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <nav
                className="sticky top-16 z-30 mb-10 min-h-[56px] border-b border-white/10 bg-black/85 backdrop-blur-sm md:top-[4.5rem]"
                aria-label="Erbjudandeveckor"
              >
                <div className="mx-auto flex max-w-4xl gap-2.5 overflow-x-auto overscroll-x-contain px-0 py-3.5 sm:gap-3 [-webkit-overflow-scrolling:touch]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlot(null)
                      const reduceMotion = window.matchMedia(
                        '(prefers-reduced-motion: reduce)',
                      ).matches
                      document.getElementById('forra-veckan')?.scrollIntoView({
                        behavior: reduceMotion ? 'auto' : 'smooth',
                        block: 'start',
                      })
                    }}
                    aria-pressed={activeSlot === null}
                    className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                      activeSlot === null
                        ? 'border-gold bg-gold text-dark'
                        : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                    }`}
                  >
                    Alla
                  </button>
                  {WEEK_SLOTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => selectSlot(s.key, s.id)}
                      aria-pressed={activeSlot === s.key}
                      className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                        activeSlot === s.key
                          ? 'border-gold bg-gold text-dark'
                          : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                      }`}
                    >
                      {s.slot}
                    </button>
                  ))}
                </div>
              </nav>

              {visibleSlots.map((s) => (
                <WeekBlock
                  key={s.key}
                  id={s.id}
                  slot={s.slot}
                  offer={data[s.key]}
                  primary={!!s.primary}
                />
              ))}
            </>
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
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink to="/meny" variant="outline">
              Se menyn
            </ButtonLink>
            <ButtonLink to={SITE.bookingUrl} variant="primary">
              Boka bord
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
