import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import TrustConversionCtas from '../components/TrustConversionCtas'
import { LEGAL_PAGES, legalPageReady } from '../trustContent'

export default function LegalPage({ pageKey }) {
  const staticPage = LEGAL_PAGES[pageKey]
  const [page, setPage] = useState(staticPage || null)

  useEffect(() => {
    if (!pageKey) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/legal/${pageKey}/`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data) return
        if (Array.isArray(data.paragraphs) && data.paragraphs.some((p) => String(p).trim())) {
          setPage({
            title: data.title || staticPage?.title,
            description: data.description || staticPage?.description,
            canonical: data.canonical || staticPage?.canonical,
            paragraphs: data.paragraphs,
          })
        }
      } catch {
        /* keep trustContent fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageKey, staticPage?.title, staticPage?.description, staticPage?.canonical])

  if (!page) {
    return null
  }

  const ready =
    Array.isArray(page.paragraphs) && page.paragraphs.some((p) => String(p).trim())
      ? true
      : legalPageReady(pageKey)

  return (
    <div>
      <Helmet>
        <title>{page.title} | Raffaello Boden</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={page.canonical} />
        {!ready && <meta name="robots" content="noindex,follow" />}
      </Helmet>

      <section className="bg-dark px-6 pb-8 pt-28 text-center md:pt-32">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Information</p>
        <h1 className="font-heading text-4xl text-white md:text-5xl">{page.title}</h1>
        <div className="mx-auto mt-5 h-px w-16 bg-gold" />
      </section>

      <section className="bg-dark-2 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          {ready ? (
            <div className="space-y-5 text-sm leading-relaxed text-white/70">
              {page.paragraphs
                .filter((p) => String(p).trim())
                .map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
            </div>
          ) : (
            <div className="text-center" role="status">
              <p className="text-base text-white/55">
                Denna text publiceras när den är granskad och godkänd.
              </p>
              <p className="mt-3 text-sm italic text-white/40">
                CONTENT REQUIRED / CLIENT CONFIRMATION REQUIRED
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-dark px-6 py-16 text-center">
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-gold">Fortsätt</p>
        <TrustConversionCtas />
      </section>
    </div>
  )
}
