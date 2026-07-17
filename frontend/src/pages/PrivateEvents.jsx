import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

export default function PrivateEvents() {
  return (
    <div>
      <Helmet>
        <title>Privata Event | Raffaello Restaurang</title>
        <meta
          name="description"
          content="Boka Raffaello Restaurang för privata event, företagsmiddagar, födelsedagar och andra speciella tillfällen i Boden."
        />
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

      {/* Hero */}
      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop src={SITE.images.ambiance} alt={SITE.brandImageAlt} />
        <div className="relative z-10 px-6">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">{SITE.name}</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Privata Events</h1>
          <div className="w-16 h-px bg-gold mx-auto" />
        </div>
      </section>

      {/* Main content */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Större sällskap</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white">
              Helkväll &amp; mingel hos oss
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <div className="p-8 border border-white/10 hover:border-gold/30 transition-colors text-center">
              <p className="text-gold font-heading text-5xl md:text-6xl mb-2 tabular-nums">
                {SITE.privateEvents.indoorGuestsMax}
              </p>
              <p className="text-white/80 font-heading text-lg mb-1">Gäster</p>
              <p className="text-white/40 uppercase tracking-widest text-sm">inomhus</p>
            </div>
            <div className="p-8 border border-white/10 hover:border-gold/30 transition-colors text-center">
              <p className="text-gold font-heading text-5xl md:text-6xl mb-2 tabular-nums">
                {SITE.privateEvents.outdoorGuestsMax}
              </p>
              <p className="text-white/80 font-heading text-lg mb-1">Gäster</p>
              <p className="text-white/40 uppercase tracking-widest text-sm">
                {SITE.privateEvents.outdoorNote}
              </p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              {SITE.name} tar gärna emot firmafest, födelsedag, möhippa eller annat sällskap som
              vill äta och umgås tillsammans. Vi hjälper er med meny och upplägg utifrån vad som
              passar er grupp.
            </p>
            <p className="text-white/60 leading-relaxed mb-12">
              Hör av er i god tid — gärna minst två veckor innan — så hinner vi planera er kväll.
            </p>

            <div className="border border-gold/20 p-8 mb-12 text-left">
              <h3 className="font-heading text-2xl text-white mb-6 text-center">Viktigt att veta</h3>
              <ul className="space-y-3 max-w-md mx-auto">
                {[
                  'Kontakta oss i god tid inför större bokningar',
                  'Meny anpassad efter allergier och preferenser',
                  'Smörgåsbord eller á la carte enligt överenskommelse',
                  'Catering enligt önskemål',
                  'Personlig kontakt med restaurangen',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-white/60 text-sm">
                    <span className="text-gold mt-0.5">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/kontakt"
              className="bg-gold text-dark px-10 py-3 uppercase tracking-widest text-sm hover:bg-gold-hover transition-all duration-300 inline-block"
            >
              Kontakta oss för bokning
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
