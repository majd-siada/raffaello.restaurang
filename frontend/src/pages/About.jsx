import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import SectionPhoto from '../components/SectionPhoto'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

export default function About() {
  // Always land on the welcome story grid (below the hero).
  useEffect(() => {
    const el = document.getElementById('om-oss-valkommen')
    if (!el) return undefined
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div>
      <Helmet>
        <title>Om oss | Raffaello Stekhus & Bar i Boden</title>
        <meta
          name="description"
          content="Lär känna Raffaello — mysig restaurang och stekhus på Drottninggatan i Boden. Grill, italienska smaker och en varm matupplevelse."
        />
        <link rel="canonical" href="https://raffaello.se/om-oss" />
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
                name: 'Om oss',
                item: 'https://raffaello.se/om-oss',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop images={SITE.gallery} alt={SITE.imageAlts.dining} />
        <div className="relative z-10 px-6">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">Vår berättelse</p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">Om Oss</h1>
          <div className="mx-auto h-px w-16 bg-gold" />
        </div>
      </section>

      <Section tone="bg">
        <div className="mx-auto max-w-6xl">
          <div
            id="om-oss-valkommen"
            className="scroll-mt-28 grid items-center gap-16 md:grid-cols-2"
          >
            <div>
              <SectionHeading
                eyebrow="Välkommen"
                title={
                  <>
                    Grill. Värme. <span className="font-normal text-gold">Gemenskap.</span>
                  </>
                }
                className="mb-6"
              />
              <p className="mb-5 leading-relaxed text-muted">
                {SITE.name} är en självklar mötesplats på Drottninggatan i centrala Boden — en mysig
                restaurang med fokus på grillade rätter, burgare och vardagsvänliga priser, plus dryck
                och dessert när du vill stanna lite längre.
              </p>
              <p className="mb-5 leading-relaxed text-muted">
                Menyn blandar svenska grillfavoriter med smårätter och smaker från Medelhavet.
                Oavsett om du är sugen på kött, fisk, vegetariskt eller något gott i glaset vill vi
                att alla ska känna sig hemma.
              </p>
              <p className="leading-relaxed text-muted">
                Tack för att du väljer att äta hos oss — vi ser fram emot nästa besök.
              </p>
            </div>
            <div className="relative">
              <SectionPhoto images={SITE.gallery} alt={SITE.imageAlts.dining} />
            </div>
          </div>
        </div>
      </Section>

      <Section tone="dark-2">
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeading
            eyebrow="Hitta hit"
            title={`${SITE.addressLine1}, Boden`}
            align="center"
            className="mx-auto"
            titleClassName="text-3xl md:text-4xl lg:text-4xl"
          />
          <p className="mb-10 mt-4 text-sm text-muted">
            {SITE.phoneDisplay} · {SITE.email}
          </p>
          <ul className="mx-auto mb-12 max-w-md space-y-2 text-left text-sm text-cream/70">
            {SITE.openingHours.map((row) => (
              <li
                key={row.label}
                className="flex justify-between gap-4 border-b border-white/10 py-2"
              >
                <span>{row.label}</span>
                <span className="tabular-nums text-gold/90">{row.hours}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink to="/meny" variant="outline">
              Meny
            </ButtonLink>
            <ButtonLink to="/lunch" variant="secondary">
              Lunch
            </ButtonLink>
            <ButtonLink to={SITE.bookingUrl} variant="primary">
              Boka bord
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section tone="bg">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div className="relative order-2 md:order-1">
              <SectionPhoto
                images={[...SITE.gallery.slice(2), ...SITE.gallery.slice(0, 2)]}
                alt={SITE.imageAlts.ambiance}
              />
            </div>
            <div className="order-1 md:order-2">
              <SectionHeading
                eyebrow="Atmosfären"
                title={
                  <>
                    En plats för <span className="font-normal text-gold">minnen.</span>
                  </>
                }
                className="mb-6"
              />
              <p className="mb-6 leading-relaxed text-muted">
                Vi vill skapa en varm och välkomnande miljö — lika rätt för en snabb lunch som för
                en lugnare middag med dryck till.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  'Varmrätter från grillen och burgare på högrev',
                  'Förrätter, tillbehör och dressingar',
                  'Dryck — från öl och husets vin till drinkar och alkoholfritt',
                  'Större sällskap efter överenskommelse',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-cream/70">
                    <span className="text-gold">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink to={SITE.bookingUrl} variant="outline">
                Boka bord
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      <section className="relative overflow-hidden px-6 py-32 text-center">
        <HeroBackdrop
          images={[...SITE.gallery.slice(3), ...SITE.gallery.slice(0, 3)]}
          alt={SITE.imageAlts.salad}
          loading="lazy"
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">{SITE.tagline}</p>
          <h2 className="mb-6 font-heading text-4xl text-white md:text-5xl">
            Vi ses hos {SITE.shortName}
          </h2>
          <div className="mx-auto mb-8 h-px w-16 bg-gold" />
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink to="/meny" variant="outline">
              Vår Meny
            </ButtonLink>
            <ButtonLink to={SITE.bookingUrl} variant="primary">
              Boka bord
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  )
}
