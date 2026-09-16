import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import TrustConversionCtas from '../components/TrustConversionCtas'
import Reveal from '../components/ui/Reveal'
import { Section, SectionHeading } from '../components/ui/Section'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/gallery/`
const API_ORIGIN = import.meta.env.VITE_API_URL || ''

function resolveMediaSrc(src) {
  if (!src) return ''
  if (/^https?:\/\//i.test(src)) return src
  return `${API_ORIGIN}${src}`
}

/** Real site photography already used on home/About — AVAILABLE NOW when CMS empty. */
function siteGalleryPhotos() {
  return (SITE.gallery || [])
    .filter((p) => p?.src)
    .map((p, i) => ({
      id: `site-${i}`,
      src: p.src,
      srcSet: p.srcSet,
      sizes: p.sizes || '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
      alt: p.alt || '',
    }))
}

export default function Gallery() {
  const [cmsPhotos, setCmsPhotos] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setCmsPhotos(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setCmsPhotos([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loading = cmsPhotos === null
  const cmsReady = !loading && !error && cmsPhotos.length > 0
  const fallback = useMemo(() => siteGalleryPhotos(), [])
  const display = cmsReady
    ? cmsPhotos.map((p) => ({
        id: p.id,
        src: resolveMediaSrc(p.src),
        srcSet: undefined,
        sizes: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
        alt: p.alt || '',
      }))
    : !loading
      ? fallback
      : []
  const ready = display.length > 0
  const usingFallback = ready && !cmsReady

  return (
    <div>
      <Helmet>
        <title>Galleri | Raffaello Stekhus & Bar i Boden</title>
        <meta
          name="description"
          content="Bilder från Raffaello i Boden — atmosfär, matsal och steakhouse-miljö."
        />
        <link rel="canonical" href="https://raffaello.se/galleri" />
        {!ready && <meta name="robots" content="noindex,follow" />}
      </Helmet>

      <section className="bg-bg px-6 pb-8 pt-28 text-center md:pt-32">
        <SectionHeading
          eyebrow="Atmosfär"
          title="Galleri"
          align="center"
          description={`En glimt av ${SITE.shortName} — matsal, bar och stämning på Drottninggatan.`}
          className="mx-auto"
          titleClassName="text-4xl md:text-5xl"
        />
        <div className="mx-auto mt-5 h-px w-16 bg-gold" />
      </section>

      <Section tone="dark-2" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          {loading && (
            <p
              className="py-12 text-center text-sm uppercase tracking-widest text-muted"
              aria-busy="true"
            >
              Laddar…
            </p>
          )}

          {error && !loading && !ready && (
            <p className="py-12 text-center text-sm text-muted" role="alert">
              Galleriet kunde inte laddas just nu. Försök igen om en stund.
            </p>
          )}

          {!loading && !ready && (
            <div className="mx-auto max-w-xl text-center" role="status">
              <p className="text-base text-muted">Inga bilder tillgängliga just nu.</p>
            </div>
          )}

          {ready && (
            <>
              {usingFallback && (
                <p className="mb-10 text-center text-sm text-muted">
                  Urval från restaurangens foton. Fler bilder publiceras i CMS när de är klara.
                </p>
              )}
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {display.map((photo) => {
                  if (!photo.src) return null
                  return (
                    <Reveal as="li" key={photo.id} className="overflow-hidden bg-bg">
                      <img
                        src={photo.src}
                        srcSet={photo.srcSet}
                        sizes={photo.sizes}
                        alt={photo.alt || ''}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] h-auto w-full object-cover"
                      />
                    </Reveal>
                  )
                })}
              </ul>
            </>
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
