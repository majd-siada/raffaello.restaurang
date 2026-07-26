import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`
const MENU_BG = '/images/menu-bg.webp'
const MENU_BG_MOBILE = '/images/menu-bg-720.webp'

function formatPrice(price) {
  if (price == null || price === '') return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} SEK`
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.00$/, '')} SEK`
}

function MenuItemRow({ item }) {
  const available = item.is_available !== false
  return (
    <div className={`mb-5 last:mb-0 ${available ? '' : 'opacity-45'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-base font-semibold leading-snug text-gold sm:text-lg">
          {item.name}
          {!available && (
            <span className="ml-2 text-xs font-normal uppercase tracking-wider text-red-400/90">
              Slutsåld
            </span>
          )}
        </h3>
        <span className="shrink-0 font-heading text-base font-semibold text-gold sm:text-lg">
          {formatPrice(item.price)}
        </span>
      </div>
      {item.description && (
        <p className="mt-1 whitespace-pre-line text-sm italic leading-relaxed text-white/80">
          {item.description}
        </p>
      )}
    </div>
  )
}

function CategoryBlock({ cat, isSubcategory = false }) {
  const hasItems = (cat.items || []).length > 0
  const hasSubs = (cat.subcategories || []).length > 0
  if (!hasItems && !hasSubs) return null

  return (
    <section
      id={isSubcategory ? undefined : `meny-kat-${cat.id}`}
      className={`scroll-mt-28 ${isSubcategory ? 'mb-8 ml-1 sm:ml-3' : 'mb-14'}`}
    >
      <div className="mb-4">
        <h2
          className={`font-heading font-bold tracking-wide text-white ${
            isSubcategory ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {cat.name}
        </h2>
        <div className="mt-2 h-px w-full bg-white/60" />
      </div>

      {cat.description && (
        <p className="mb-5 whitespace-pre-line text-sm italic leading-relaxed text-gold/90">
          {cat.description}
        </p>
      )}

      {hasItems && (
        <div className="max-w-3xl">
          {(cat.items || []).map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {hasSubs && (
        <div className="mt-8 space-y-2">
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
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid menu response')
        setCategories(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const filtered = activeCategory
    ? categories.filter((c) => c.id === activeCategory)
    : categories

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white/80">
      <Helmet>
        <title>Meny | Raffaello Restaurang Boden</title>
        <meta
          name="description"
          content="Utforska vår meny med premium steaks, italienska rätter, pizza, pasta, hamburgare och mycket mer på Raffaello Restaurang i Boden."
        />
        <link
          rel="preload"
          as="image"
          href={MENU_BG_MOBILE}
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
        <link rel="canonical" href="https://raffaello.se/meny" />
      </Helmet>

      <section className="relative flex h-[min(42dvh,360px)] min-h-[240px] items-center justify-center overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <picture>
            <source media="(min-width: 768px)" srcSet={MENU_BG} type="image/webp" />
            <img
              src={MENU_BG_MOBILE}
              alt=""
              width={720}
              height={900}
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
              poster={MENU_BG_MOBILE}
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
            Stekhus &amp; Bar
          </p>
          <div className="mx-auto mt-5 h-px w-16 bg-gold/80" />
        </div>
      </section>

      <nav
        className="sticky top-0 z-30 min-h-[52px] border-b border-white/10 bg-black/80 backdrop-blur-sm"
        aria-label="Menykategorier"
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto overscroll-x-contain px-4 py-3 [-webkit-overflow-scrolling:touch]">
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
                onClick={() => setActiveCategory(null)}
                className={`min-h-[44px] shrink-0 cursor-pointer border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs ${
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
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-h-[44px] shrink-0 cursor-pointer border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs ${
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

      <section className="relative bg-gradient-to-b from-black/85 via-black/90 to-black px-4 py-10 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          {loading && (
            <div className="space-y-6" aria-busy="true">
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
            <p className="text-center text-base text-white/50 sm:text-lg">
              Menyn kunde inte laddas. Kontrollera att API:t körs och ladda om sidan.
            </p>
          )}

          {!loading && !error && categories.length === 0 && (
            <p className="mx-auto max-w-xl text-center text-base text-white/50 sm:text-lg">
              Ingen meny finns ännu. Lägg till kategorier och rätter i admin.
            </p>
          )}

          {!loading &&
            !error &&
            filtered.map((cat) => <CategoryBlock key={cat.id} cat={cat} />)}
        </div>
      </section>
    </div>
  )
}
