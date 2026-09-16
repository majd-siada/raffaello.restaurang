import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import EventsInquiryForm from '../components/EventsInquiryForm'
import { Section, SectionHeading } from '../components/ui/Section'

export default function PrivateEvents() {
  const showCapacities = SITE.privateEvents?.capacitiesConfirmed === true

  return (
    <div>
      <Helmet>
        <title>Firmafest, födelsedag och gruppbokning i Boden | Raffaello</title>
        <meta
          name="description"
          content="Boka firmafest, födelsedagsmiddag eller företagsevent på Raffaello i Boden. Skicka en eventförfrågan för större sällskap."
        />
        <link rel="canonical" href="https://raffaello.se/privata-events" />
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
                name: 'Privata event',
                item: 'https://raffaello.se/privata-events',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop
          images={[...SITE.gallery.slice(1), ...SITE.gallery.slice(0, 1)]}
          alt={SITE.imageAlts.ambiance}
        />
        <div className="relative z-10 px-6">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">{SITE.name}</p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">
            Privata event &amp; fest
          </h1>
          <div className="mx-auto h-px w-16 bg-gold" />
        </div>
      </section>

      <Section tone="bg">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Större sällskap"
            title="Firmafest, födelsedag och företagsevent"
            align="center"
            className="mx-auto mb-14"
          />

          {showCapacities ? (
            <div className="mx-auto mb-20 grid max-w-2xl gap-6 md:grid-cols-2">
              <div className="border border-white/10 p-8 text-center transition-colors hover:border-gold/30">
                <p className="mb-2 font-heading text-5xl tabular-nums text-gold md:text-6xl">
                  {SITE.privateEvents.indoorGuestsMax}
                </p>
                <p className="mb-1 font-heading text-lg text-cream/80">Gäster</p>
                <p className="text-sm uppercase tracking-widest text-muted">inomhus</p>
              </div>
              <div className="border border-white/10 p-8 text-center transition-colors hover:border-gold/30">
                <p className="mb-2 font-heading text-5xl tabular-nums text-gold md:text-6xl">
                  {SITE.privateEvents.outdoorGuestsMax}
                </p>
                <p className="mb-1 font-heading text-lg text-cream/80">Gäster</p>
                <p className="text-sm uppercase tracking-widest text-muted">
                  {SITE.privateEvents.outdoorNote}
                </p>
              </div>
            </div>
          ) : (
            <p className="mx-auto mb-14 max-w-2xl text-center text-sm text-muted">
              Kapacitet för inomhus och utomhus bekräftas per förfrågan — kontakta oss så återkommer
              vi med vad som passar er grupp.
            </p>
          )}

          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-6 text-lg leading-relaxed text-muted">
              {SITE.name} tar gärna emot firmafest, födelsedagsmiddag, företagsevent eller annan
              gruppbokning för stora sällskap som vill äta och umgås tillsammans. Vi hjälper er med
              meny och upplägg utifrån vad som passar er grupp.
            </p>
            <p className="mb-14 leading-relaxed text-muted">
              Hör av er i god tid — gärna minst två veckor innan — så hinner vi planera er kväll.
            </p>

            <div className="mb-20 border border-gold/20 px-8 py-10 text-left sm:px-10">
              <h3 className="mb-8 text-center font-heading text-2xl text-cream">Viktigt att veta</h3>
              <ul className="mx-auto max-w-md space-y-4">
                {[
                  'Kontakta oss i god tid inför större bokningar',
                  'Meny anpassad efter allergier och preferenser',
                  'Smörgåsbord eller á la carte enligt överenskommelse',
                  'Catering enligt önskemål',
                  'Personlig kontakt med restaurangen',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <span className="mt-0.5 text-gold">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div id="event-forfragan" className="scroll-mt-28 mx-auto max-w-2xl">
            <SectionHeading
              eyebrow="Förfrågan"
              title="Skicka eventförfrågan"
              align="center"
              className="mx-auto mb-10"
              titleClassName="text-3xl md:text-4xl lg:text-4xl"
            />
            <EventsInquiryForm />
            <p className="mt-10 text-center text-sm text-muted">
              Eller ring{' '}
              <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">
                {SITE.phoneDisplay}
              </a>{' '}
              ·{' '}
              <Link to="/kontakt" className="text-gold hover:underline">
                Kontakt
              </Link>
            </p>
          </div>
        </div>
      </Section>
    </div>
  )
}
