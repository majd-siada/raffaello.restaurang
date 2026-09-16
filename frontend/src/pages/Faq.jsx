import { Helmet } from 'react-helmet-async'
import { useEffect, useId, useState } from 'react'
import TrustConversionCtas from '../components/TrustConversionCtas'
import { FAQ_ITEMS, faqItemsReady } from '../trustContent'
import { Section, SectionHeading } from '../components/ui/Section'

function FaqItem({ item }) {
  const panelId = useId()
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-white/10">
      <h2 className="m-0">
        <button
          type="button"
          id={`${panelId}-btn`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-4 py-4 text-left font-heading text-lg text-cream transition-colors hover:text-gold"
        >
          <span>{item.question}</span>
          <span aria-hidden className="shrink-0 text-gold">
            {open ? '−' : '+'}
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-btn`}
        hidden={!open}
        className="pb-5 text-sm leading-relaxed text-muted"
      >
        {item.answer}
      </div>
    </div>
  )
}

export default function Faq() {
  const [items, setItems] = useState(() => faqItemsReady(FAQ_ITEMS))
  const ready = items.length > 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/faq/')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !Array.isArray(data)) return
        const fromApi = faqItemsReady(data)
        // Only replace when API has published content (db mode).
        if (fromApi.length > 0) setItems(fromApi)
      } catch {
        /* keep trustContent fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <Helmet>
        <title>Vanliga frågor | Raffaello Boden</title>
        <meta
          name="description"
          content="Vanliga frågor om Raffaello i Boden — bokning, lunch, meny och besök."
        />
        <link rel="canonical" href="https://raffaello.se/faq" />
        {!ready && <meta name="robots" content="noindex,follow" />}
        {ready && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: items.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      <section className="bg-bg px-6 pb-8 pt-28 text-center md:pt-32">
        <SectionHeading
          eyebrow="Hjälp"
          title="Vanliga frågor"
          align="center"
          className="mx-auto"
          titleClassName="text-4xl md:text-5xl"
        />
        <div className="mx-auto mt-5 h-px w-16 bg-gold" />
      </section>

      <Section tone="dark-2" className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl">
          {ready ? (
            <div>
              {items.map((item) => (
                <FaqItem key={item.id || item.question} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center" role="status">
              <p className="text-base text-muted">
                FAQ-innehåll publiceras här när restaurangen har godkänt frågor och svar.
              </p>
              <p className="mt-3 text-sm italic text-muted/80">CONTENT REQUIRED</p>
            </div>
          )}
        </div>
      </Section>

      <Section tone="bg" className="py-16 md:py-20 text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.24em] text-gold">Fortsätt</p>
        <TrustConversionCtas />
      </Section>
    </div>
  )
}
