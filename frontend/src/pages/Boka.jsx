import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import BookingForm from '../components/BookingForm'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

export default function Boka() {
  return (
    <div>
      <Helmet>
        <title>Boka bord i Boden | Raffaello</title>
        <meta
          name="description"
          content="Skicka en bordsförfrågan till Raffaello Stekhus & Bar i Boden. Ange datum, tid och antal gäster — vi återkommer med bekräftelse."
        />
        <link rel="canonical" href="https://raffaello.se/boka" />
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
                name: 'Boka bord',
                item: 'https://raffaello.se/boka',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex min-h-[min(48vh,420px)] items-center justify-center overflow-hidden bg-dark text-center">
        <HeroBackdrop
          images={[...SITE.gallery.slice(3), ...SITE.gallery.slice(0, 3)]}
          alt={SITE.imageAlts.bar}
        />
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">Reservation</p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">Boka bord</h1>
          <div className="mx-auto h-px w-16 bg-gold" />
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/60">
            Skicka en förfrågan för upp till 6 personer. Restaurangen bekräftar din bokning —
            ingen automatisk direktbekräftelse.
          </p>
        </div>
      </section>

      <Section
        id="boka-bord"
        tone="dark-2"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Boka bord Boden"
            title="Din förfrågan"
            align="center"
            className="mx-auto mb-12"
            description={
              <>
                Välj datum, tid och antal gäster. Är ni fler än 6, ring{' '}
                <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">
                  {SITE.phoneDisplay}
                </a>
                . För större sällskap, se{' '}
                <Link to="/privata-events" className="text-gold hover:underline">
                  privata events
                </Link>
                .
              </>
            }
          />
          <BookingForm />
        </div>
      </Section>

      <Section tone="bg" className="py-16 md:py-20">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
          <a
            href={`tel:${SITE.phoneTel}`}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-gold bg-transparent px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-gold transition-colors duration-300 hover:bg-gold hover:text-dark sm:w-auto"
          >
            Ring {SITE.phoneDisplay}
          </a>
          <ButtonLink to="/meny" variant="ghost" className="w-full sm:w-auto">
            Se menyn
          </ButtonLink>
        </div>
      </Section>
    </div>
  )
}
