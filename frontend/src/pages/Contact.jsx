import { SITE } from '../siteConfig'

export default function Contact() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[min(52vh,480px)] items-center justify-center overflow-hidden bg-dark text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/80 to-dark">
          <img
            src={SITE.logoImage}
            alt=""
            className="absolute left-1/2 top-1/2 w-[520px] max-w-[88vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] mix-blend-screen pointer-events-none select-none"
            decoding="async"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 text-center">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Hör av dig</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Kontakta Oss</h1>
          <div className="w-16 h-px bg-gold mx-auto" />
        </div>
      </section>

      {/* Info cards */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-3">Hitta Oss</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white">Besök oss</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center p-8 border border-white/10 hover:border-gold/30 transition-colors block group"
            >
              <div className="text-gold text-3xl mb-4">📍</div>
              <h3 className="font-heading text-xl text-white mb-3">Adress</h3>
              <p className="text-white/50 text-sm leading-relaxed group-hover:text-gold transition-colors">
                {SITE.addressLine1}<br />
                {SITE.addressLine2}
              </p>
            </a>
            <div className="text-center p-8 border border-white/10 hover:border-gold/30 transition-colors">
              <div className="text-gold text-3xl mb-4">📞</div>
              <h3 className="font-heading text-xl text-white mb-3">Kontakt</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                <a href={`tel:${SITE.phoneTel}`} className="hover:text-gold transition-colors">{SITE.phoneDisplay}</a><br />
                <a href={`mailto:${SITE.email}`} className="hover:text-gold transition-colors">{SITE.email}</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
