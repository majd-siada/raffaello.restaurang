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

function DishRow({ dish }) {
  const description = formatDishDescription(dish.description)
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
          {dish.name}
        </h3>
        <span className="shrink-0 font-heading text-base font-semibold tabular-nums text-gold sm:text-lg">
          {formatPrice(dish.price)}
        </span>
      </div>
      {description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {description}
        </p>
      )}
    </div>
  )
}

function WeekSection({ slot, offer, primary, id }) {
  const dishes = offer?.dishes || []
  const hasDishes = dishes.length > 0
  const rawIntro = (offer?.intro_text || '').trim()
  const intro = formatOfferIntroText(rawIntro) || (hasDishes ? DEFAULT_INTRO : '')
  const weekLabel = offer?.week_number != null ? `v ${offer.week_number}` : ''

  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-sm border px-6 py-10 sm:px-10 ${
        primary
          ? 'border-gold/50 bg-elevated shadow-[0_0_0_1px_rgba(212,175,55,0.12)] sm:py-12'
          : 'border-white/10 bg-bg/80'
      }`}
    >
      <p
        className={`mb-2 text-xs uppercase tracking-[0.24em] ${
          primary ? 'text-gold' : 'text-muted'
        }`}
      >
        {slot}
      </p>
      <h2
        className={`font-heading font-bold tracking-wide ${
          primary ? 'text-2xl text-cream sm:text-3xl' : 'text-xl text-cream/80 sm:text-2xl'
        }`}
      >
        {weekLabel || '—'}
      </h2>
      <div className={`mt-3 h-px w-16 ${primary ? 'bg-gold' : 'bg-white/20'}`} />

      {hasDishes ? (
        <>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">{intro}</p>
          <div className="mt-8 max-w-3xl">
            {dishes.map((dish) => (
              <DishRow key={dish.id} dish={dish} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Inget erbjudande publicerat ännu
          </p>
          {primary && (
            <>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted/90">
                Veckans Erbjudande är en fast del av vår verksamhet. När veckans rätt är publicerad
                syns den här.
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

  // Always land on this week's offer card (below the hero).
  useEffect(() => {
    if (loading || error || !data) return undefined
    const el = document.getElementById('denna-vecka')
    if (!el) return undefined
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [loading, error, data])

  return (
    <div className="pb-24 md:pb-0">
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

      <Section tone="dark-2" className="pb-24 pt-4 md:pb-28">
        <div className="mx-auto max-w-3xl space-y-8">
          {loading && (
            <p className="py-12 text-center text-sm uppercase tracking-widest text-muted">
              Laddar…
            </p>
          )}

          {error && !loading && (
            <p className="py-12 text-center text-sm text-muted">
              Erbjudandet kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !error && data && (
            <>
              <WeekSection slot="Förra veckan" offer={data.previous} primary={false} />
              <WeekSection
                id="denna-vecka"
                slot="Denna vecka"
                offer={data.current}
                primary
              />
              <WeekSection slot="Nästa vecka" offer={data.next} primary={false} />
            </>
          )}
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
