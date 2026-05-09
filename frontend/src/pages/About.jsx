import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex h-[50vh] items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/78 to-dark">
          <img
            src={SITE.logoImage}
            alt=""
            className="absolute left-1/2 top-1/2 w-[520px] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] mix-blend-screen pointer-events-none select-none"
            decoding="async"
          />
        </div>
        <div className="relative z-10 px-6">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Vår berättelse</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Om Oss</h1>
          <div className="w-16 h-px bg-gold mx-auto" />
        </div>
      </section>

      {/* Intro */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Välkommen</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              Grill. Värme. <span className="text-gold font-normal">Gemenskap.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-5">
              {SITE.name} är en självklar mötesplats på Drottninggatan i Boden — med fokus på
              grillade rätter, burgare och vardagsvänliga priser, plus dryck och dessert när du
              vill stanna lite längre.
            </p>
            <p className="text-white/60 leading-relaxed mb-5">
              Menyn blandar svenska grillfavoriter med smårätter och smaker från Medelhavet.
              Oavsett om du är sugen på kött, fisk, vegetariskt eller något gott i glaset vill vi
              att alla ska känna sig hemma.
            </p>
            <p className="text-white/60 leading-relaxed">
              Tack för att du väljer att äta hos oss — vi ser fram emot nästa besök.
            </p>
          </div>
          <div className="relative">
            <img
              src={SITE.logoImage}
              alt=""
              className="h-[450px] w-full object-contain p-10 md:p-14 opacity-95"
              decoding="async"
            />
            <div className="absolute inset-0 border border-gold/30 translate-x-4 translate-y-4 -z-10" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-dark-2 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-px bg-gold mx-auto mb-12" />
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-gold font-heading text-5xl mb-2">Boden</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">Centrum</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-gold font-heading text-5xl mb-2">Lunch</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">&amp; kväll</p>
            </div>
            <div>
              <p className="text-gold font-heading text-5xl mb-2">7</p>
              <p className="text-white/40 text-xs uppercase tracking-widest">Dagar i veckan</p>
            </div>
          </div>
          <div className="w-16 h-px bg-gold mx-auto mt-12" />
        </div>
      </section>

      {/* Atmosphere */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 md:order-1">
            <img
              src={SITE.logoImage}
              alt=""
              className="h-[450px] w-full object-contain p-10 md:p-14 opacity-95"
              decoding="async"
            />
            <div className="absolute inset-0 border border-gold/30 -translate-x-4 translate-y-4 -z-10" />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Atmosfären</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
              En plats för <span className="text-gold font-normal">minnen.</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Vi vill skapa en varm och välkomnande miljö — lika rätt för en snabb lunch som för
              en lugnare middag med dryck till.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Varmrätter från grillen och burgare på högrev',
                'Förrätter, tillbehör och dressingar',
                'Dryck — från öl och husets vin till drinkar och alkoholfritt',
                'Större sällskap efter överenskommelse',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="text-gold">✦</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={SITE.bookingUrl}
              className="inline-block border border-gold text-gold px-6 py-2.5 uppercase tracking-widest text-sm hover:bg-gold hover:text-dark transition-all duration-300"
            >
              Boka bord
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-32 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/82 to-dark">
          <img
            src={SITE.logoImage}
            alt=""
            className="absolute left-1/2 top-1/2 w-[560px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] mix-blend-screen pointer-events-none select-none"
            decoding="async"
          />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">{SITE.tagline}</p>
          <h2 className="font-heading text-4xl md:text-5xl text-white mb-6">
            Vi ses hos {SITE.shortName}
          </h2>
          <div className="w-16 h-px bg-gold mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/meny"
              className="border border-gold text-gold px-8 py-3 uppercase tracking-widest text-sm hover:bg-gold hover:text-dark transition-all duration-300"
            >
              Vår Meny
            </Link>
            <a
              href={SITE.bookingUrl}
              className="bg-gold text-dark px-8 py-3 uppercase tracking-widest text-sm hover:bg-gold-hover transition-all duration-300"
            >
              Boka bord
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
