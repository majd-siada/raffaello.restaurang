import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`

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

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

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
    <div className="relative min-h-screen bg-black text-white/80">
      {/* Full-page grill — no heavy tint so the picture stays clear */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-black bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/menu-bg.webp')" }}
        aria-hidden
      />

      <div className="relative z-10">
      <Helmet>
        <title>Meny | Raffaello Restaurang Boden</title>
        <meta
          name="description"
          content="Utforska vår meny med premium steaks, italienska rätter, pizza, pasta, hamburgare och mycket mer på Raffaello Restaurang i Boden."
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

      <section className="relative aspect-[4/5] max-h-[85vh] w-full overflow-hidden border-b border-gold/20 text-center sm:aspect-auto sm:min-h-[70vh]">
        <div className="pointer-events-none absolute inset-0 z-0 bg-black" aria-hidden>
          <img
            src="/images/menu-bg.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <video
            className="absolute inset-x-0 bottom-0 h-1/3 w-full object-cover object-bottom opacity-45 mix-blend-screen"
            autoPlay
            muted
            loop
            playsInline
            poster="/images/menu-bg.webp"
          >
            <source src="/images/menu-grill.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        </div>
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-16 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] sm:py-20">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-gold">Meny</p>
          <h1 className="font-brand text-5xl font-bold tracking-tight text-gold sm:text-6xl">
            Raffaello
          </h1>
          <p className="mt-2 font-brand-sub text-base uppercase tracking-[0.3em] text-white sm:text-lg">
            Stekhus &amp; Bar
          </p>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/90">
            Grill, pizza, pasta, burgare och dryck — {SITE.addressLine2}.
          </p>
          <div className="mx-auto mt-6 h-px w-20 bg-gold/80" />
        </div>
      </section>

      {categories.length > 1 && (
        <nav
          className="sticky top-0 z-30 border-b border-white/10 bg-black/55 backdrop-blur-sm"
          aria-label="Menykategorier"
        >
          <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 cursor-pointer border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs ${
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
                className={`shrink-0 cursor-pointer border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs ${
                  activeCategory === cat.id
                    ? 'border-gold bg-gold text-dark'
                    : 'border-gold/40 text-gold hover:border-gold hover:bg-gold/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>
      )}

      <section className="relative px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-4xl">
          {loading && (
            <div className="space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-5 w-40 rounded bg-white/10" />
                  <div className="h-px w-full bg-gold/20" />
                  <div className="h-4 w-full rounded bg-white/5" />
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-center text-lg text-white/50">
              Menyn kunde inte laddas. Kontrollera att API:t körs och ladda om sidan.
            </p>
          )}

          {!loading && !error && categories.length === 0 && (
            <p className="mx-auto max-w-xl text-center text-lg text-white/50">
              Ingen meny finns ännu. Lägg till kategorier och rätter i admin, eller kör{' '}
              <code className="text-gold/90">python manage.py seed_menu --replace</code>.
            </p>
          )}

          {!loading && !error && filtered.map((cat) => (
            <CategoryBlock key={cat.id} cat={cat} />
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
