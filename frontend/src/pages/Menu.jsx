import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import { formatPrice } from '../formatPrice'
import { ButtonLink } from '../components/ui/Button'
import { Section, SectionHeading } from '../components/ui/Section'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`
const MENU_BG = '/images/menu-bg.webp'
const MENU_BG_MOBILE = '/images/menu-bg-720.webp'
const MENU_BG_LCP = '/images/menu-bg-480.webp'

function MetaChips({ values, tone = 'muted' }) {
  if (!values?.length) return null
  const toneClass =
    tone === 'allergen'
      ? 'border-white/20 text-white/55'
      : 'border-gold/35 text-gold/85'
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={tone === 'allergen' ? 'Allergener' : 'Etiketter'}>
      {values.map((v) => (
        <li
          key={v}
          className={`border px-2 py-0.5 text-[0.65rem] uppercase tracking-wider ${toneClass}`}
        >
          {v}
        </li>
      ))}
    </ul>
  )
}

function MenuItemRow({ item }) {
  const available = item.is_available !== false
  const priceLabel = formatPrice(item.price)
  const tags = Array.isArray(item.tags) ? item.tags : []
  const allergens = Array.isArray(item.allergens) ? item.allergens : []
  const imageSrc = typeof item.image === 'string' && item.image ? item.image : null

  return (
    <article
      className={`mb-7 last:mb-0 ${available ? '' : 'opacity-45'}`}
      aria-label={item.name}
    >
      <div className={`flex gap-4 ${imageSrc ? 'items-start' : 'items-baseline'}`}>
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            width={88}
            height={88}
            loading="lazy"
            decoding="async"
            className="h-[72px] w-[72px] shrink-0 object-cover sm:h-[88px] sm:w-[88px]"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
              {item.name}
              {!available && (
                <span className="ml-2 text-xs font-normal uppercase tracking-wider text-red-400/90">
                  Slutsåld
                </span>
              )}
            </h3>
            {priceLabel && (
              <span className="shrink-0 font-heading text-base font-semibold tabular-nums tracking-wide text-gold sm:text-lg">
                {priceLabel}
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
              {item.description}
            </p>
          )}
          <MetaChips values={tags} tone="tag" />
          <MetaChips values={allergens} tone="allergen" />
        </div>
      </div>
    </article>
  )
}

function CategoryBlock({ cat, isSubcategory = false }) {
  const hasItems = (cat.items || []).length > 0
  const hasSubs = (cat.subcategories || []).length > 0
  if (!hasItems && !hasSubs) return null

  return (
    <section
      id={isSubcategory ? undefined : `meny-kat-${cat.id}`}
      className={`scroll-mt-32 ${isSubcategory ? 'mb-10 ml-1 sm:ml-3' : 'mb-16 sm:mb-20'}`}
      aria-labelledby={isSubcategory ? undefined : `meny-kat-title-${cat.id}`}
    >
      <div className="mb-5">
        <h2
          id={isSubcategory ? undefined : `meny-kat-title-${cat.id}`}
          className={`font-heading font-bold tracking-wide text-cream ${
            isSubcategory ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {cat.name}
        </h2>
        <div className="mt-3 h-px w-full bg-white/25" />
      </div>

      {cat.description && (
        <p className="mb-6 whitespace-pre-line text-sm italic leading-relaxed text-gold/90">
          {cat.description}
        </p>
      )}

      {hasItems && (
        <div className="max-w-3xl space-y-1">
          {(cat.items || []).map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {hasSubs && (
        <div className="mt-10 space-y-2">
          {(cat.subcategories || []).map((sub) => (
            <CategoryBlock key={sub.id} cat={sub} isSubcategory />
          ))}
        </div>
      )}
    </section>
  )
}

function useDesktopMotion() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)')
    if (!mq.matches) return undefined

    let cancelled = false
    const start = () => {
      if (!cancelled) setEnabled(true)
    }
    const idleId =
      'requestIdleCallback' in window
        ? window.requestIdleCallback(start, { timeout: 2500 })
        : window.setTimeout(start, 1200)

    return () => {
      cancelled = true
      if ('cancelIdleCallback' in window && typeof idleId === 'number') {
        window.cancelIdleCallback(idleId)
      } else {
        clearTimeout(idleId)
      }
    }
  }, [])

  return enabled
}

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const showVideo = useDesktopMotion()

  useEffect(() => {
    let cancelled = false
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (!Array.isArray(data)) throw new Error('Invalid menu response')
        setCategories(data)
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Scroll-spy: highlight category chip while browsing full menu (no filter hide)
  useEffect(() => {
    if (loading || error || categories.length === 0) return undefined

    const ids = categories.map((c) => `meny-kat-${c.id}`)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!elements.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (!visible.length) return
        const id = visible[0].target.id.replace('meny-kat-', '')
        const num = Number(id)
        setActiveCategory(Number.isNaN(num) ? id : num)
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.15, 0.35, 0.55] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loading, error, categories])

  const scrollToCategory = (catId) => {
    setActiveCategory(catId)
    if (catId == null) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const el = document.getElementById(`meny-kat-${catId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const categoryNames = categories.map((c) => c.name).filter(Boolean)

  const allergenItemCount = (() => {
    let n = 0
    const walk = (cats) => {
      for (const cat of cats || []) {
        for (const item of cat.items || []) {
          if (Array.isArray(item.allergens) && item.allergens.length > 0) n += 1
        }
        if (cat.subcategories) walk(cat.subcategories)
      }
    }
    walk(categories)
    return n
  })()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black pb-24 text-white/80">
      <Helmet>
        <title>Meny – Steakhouse, pasta, pizza och hamburgare i Boden | Raffaello</title>
        <meta
          name="description"
          content="Se menyn på Raffaello i Boden: grillat kött, oxfilé, entrecôte, pasta, pizza och hamburgare. Priser och kategorier online."
        />
        <link
          rel="preload"
          as="image"
          href={MENU_BG_LCP}
          type="image/webp"
          fetchPriority="high"
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
                name: 'Meny',
                item: 'https://raffaello.se/meny',
              },
            ],
          })}
        </script>
        {categoryNames.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Menu',
              name: 'Meny – Raffaello',
              url: 'https://raffaello.se/meny',
              hasMenuSection: categoryNames.map((name) => ({
                '@type': 'MenuSection',
                name,
              })),
            })}
          </script>
        )}
        <link rel="canonical" href="https://raffaello.se/meny" />
      </Helmet>

      <section className="relative flex h-[min(42dvh,360px)] min-h-[240px] items-center justify-center overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <picture>
            <source media="(min-width: 1024px)" srcSet={MENU_BG} type="image/webp" />
            <source media="(min-width: 768px)" srcSet={MENU_BG_MOBILE} type="image/webp" />
            <img
              src={MENU_BG_LCP}
              alt=""
              width={480}
              height={600}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[center_75%]"
            />
          </picture>
          {showVideo && (
            <video
              className="absolute inset-0 hidden h-full w-full object-cover object-bottom opacity-35 mix-blend-screen md:block"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={MENU_BG_LCP}
            >
              <source src="/images/menu-grill.mp4" type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75" />
        </div>
        <div className="relative z-10 px-5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:px-6">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-gold">Meny</p>
          <h1 className="font-brand text-4xl font-bold tracking-tight text-gold sm:text-5xl md:text-6xl">
            Raffaello
          </h1>
          <p className="mt-2 font-brand-sub text-sm uppercase tracking-[0.3em] text-white sm:text-base">
            Grill, pasta, pizza och hamburgare
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-gold/80" />
        </div>
      </section>

      <nav
        className="sticky top-16 z-30 min-h-[56px] border-b border-white/10 bg-black/85 backdrop-blur-sm md:top-[4.5rem]"
        aria-label="Menykategorier"
      >
        <div className="mx-auto flex max-w-5xl gap-2.5 overflow-x-auto overscroll-x-contain px-4 py-3.5 sm:gap-3 sm:px-6 [-webkit-overflow-scrolling:touch]">
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-20 shrink-0 animate-pulse rounded-sm bg-white/10"
                />
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => scrollToCategory(null)}
                aria-pressed={activeCategory === null}
                className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                  activeCategory === null
                    ? 'border-gold bg-gold text-dark'
                    : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                }`}
              >
                Alla
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCategory(cat.id)}
                  aria-pressed={activeCategory === cat.id}
                  className={`min-h-11 shrink-0 cursor-pointer border px-3.5 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                    activeCategory === cat.id
                      ? 'border-gold bg-gold text-dark'
                      : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </>
          )}
        </div>
      </nav>

      <section className="relative bg-gradient-to-b from-black/85 via-black/90 to-black px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          {!loading && !error && allergenItemCount > 0 && (
            <aside
              className="mb-12 border border-white/15 bg-white/[0.03] px-4 py-5 text-sm leading-relaxed text-muted sm:px-5"
              aria-label="Om allergener"
            >
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-gold">Allergener</p>
              <p className="mt-2">
                Allergenmärkning visas per rätt när den är ifylld i menysystemet. Saknas märkning
                betyder det inte att rätten är fri från allergener — fråga personalen vid behov.
              </p>
            </aside>
          )}

          {loading && (
            <div className="space-y-8" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-5 w-40 rounded bg-white/10" />
                  <div className="h-px w-full bg-gold/20" />
                  <div className="h-4 w-full rounded bg-white/5" />
                  <div className="h-4 w-3/4 rounded bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mx-auto max-w-xl text-center" role="alert">
              <p className="text-base text-muted sm:text-lg">
                Menyn kunde inte laddas just nu. Försök igen om en stund.
              </p>
              <ButtonLink to={SITE.bookingUrl} variant="primary" className="mt-8">
                Boka bord
              </ButtonLink>
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <div className="mx-auto max-w-xl text-center">
              <p className="text-base text-muted sm:text-lg">
                Ingen meny publicerad ännu. Kom tillbaka snart — eller boka bord så hjälper vi dig på
                plats.
              </p>
              <ButtonLink to={SITE.bookingUrl} variant="primary" className="mt-8">
                Boka bord
              </ButtonLink>
            </div>
          )}

          {!loading &&
            !error &&
            categories.map((cat) => <CategoryBlock key={cat.id} cat={cat} />)}
        </div>
      </section>

      {!loading && !error && categories.length > 0 && (
        <Section tone="bg" className="border-t border-white/10 text-center">
          <div className="mx-auto max-w-xl">
            <SectionHeading
              eyebrow="Boka bord"
              title="Redo att äta hos oss?"
              align="center"
              className="mx-auto"
              titleClassName="text-2xl sm:text-3xl md:text-3xl lg:text-4xl"
            />
            <div className="mx-auto mt-4 h-px w-16 bg-gold/80" />
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink to={SITE.bookingUrl} variant="primary">
                Boka bord
              </ButtonLink>
              <ButtonLink to="/lunch" variant="secondary">
                Lunch
              </ButtonLink>
              <ButtonLink to="/veckans-erbjudande" variant="secondary">
                Veckans Erbjudande
              </ButtonLink>
            </div>
          </div>
        </Section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/25 bg-black/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <ButtonLink to={SITE.bookingUrl} variant="primary" className="w-full">
          Boka bord
        </ButtonLink>
      </div>
    </div>
  )
}
