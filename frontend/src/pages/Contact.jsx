import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'
import LazyMap from '../components/LazyMap'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

/**
 * Kontakt = NAP / hours / map / call — booking lives on /boka only.
 */
export default function Contact() {
  return (
    <div>
      <Helmet>
        <title>Kontakt | Raffaello Stekhus & Bar i Boden</title>
        <meta
          name="description"
          content="Kontakta Raffaello i Boden — adress Drottninggatan 18, telefon, e-post och öppettider. Boka bord via vår bokningssida."
        />
        <link rel="canonical" href="https://raffaello.se/kontakt" />
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
                name: 'Kontakt',
                item: 'https://raffaello.se/kontakt',
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
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">Hör av dig</p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">Kontakta Oss</h1>
          <div className="mx-auto h-px w-16 bg-gold" />
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/60">
            Adress, telefon, e-post och öppettider. För bordsförfrågan använd{' '}
            <Link to="/boka" className="text-gold underline-offset-2 hover:underline">
              Boka bord
            </Link>
            .
          </p>
        </div>
      </section>

      <Section id="besok-oss" tone="dark-2" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Hitta Oss"
            title="Besök oss"
            align="center"
            className="mx-auto mb-14"
          />
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            <div className="space-y-8 lg:col-span-2">
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border-b border-white/10 pb-6 transition-colors hover:border-gold/40"
              >
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold">Adress</p>
                <p className="font-heading text-xl text-cream transition-colors group-hover:text-gold md:text-2xl">
                  {SITE.addressLine1}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{SITE.addressLine2}</p>
              </a>

              <div className="border-b border-white/10 pb-6">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">Telefon & e-post</p>
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="block min-h-11 py-1 font-heading text-lg text-gold hover:text-gold-hover"
                >
                  {SITE.phoneDisplay}
                </a>
                <a
                  href={`mailto:${SITE.email}`}
                  className="block min-h-11 py-1 text-sm text-muted hover:text-gold"
                >
                  {SITE.email}
                </a>
              </div>

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">Öppettider</p>
                <ul className="space-y-2.5 text-sm">
                  {SITE.openingHours.map((row) => (
                    <li key={row.label} className="flex justify-between gap-4">
                      <span className="text-muted">{row.label}</span>
                      <span className="tabular-nums text-cream/85">{row.hours}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-muted/80">
                  Köket stänger 30 minuter innan restaurangen stänger.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <ButtonLink to="/boka" variant="primary">
                  Boka bord
                </ButtonLink>
                <a
                  href={`tel:${SITE.phoneTel}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-gold bg-transparent px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-gold transition-colors duration-300 hover:bg-gold hover:text-dark"
                >
                  Ring {SITE.phoneDisplay}
                </a>
                <ButtonLink to="/privata-events" variant="ghost">
                  Privata events
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold lg:sr-only">Karta</p>
              <LazyMap />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
