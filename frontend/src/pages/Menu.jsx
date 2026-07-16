import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { SITE } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/menu/`

function CategorySection({ cat, isSubcategory = false }) {
  return (
    <div className={isSubcategory ? 'mb-8 ml-2' : 'mb-16'}>
      <h2
        className={`font-heading text-center ${
          isSubcategory
            ? 'text-xl text-white/70 mb-4 tracking-widest uppercase'
            : 'text-3xl text-gold mb-2'
        }`}
      >
        {isSubcategory ? cat.name : `— ${cat.name} —`}
      </h2>

      {cat.description && (
        <p className={`text-center text-sm mb-6 whitespace-pre-line max-w-2xl mx-auto ${
          isSubcategory ? 'text-white/30' : 'text-white/40'
        }`}>
          {cat.description}
        </p>
      )}

      {(cat.items || []).length > 0 && (
        <div className="space-y-5">
          {(cat.items || []).map(item => (
            <div key={item.id} className="group">
              <div className="flex items-end gap-2">
                <h3
                  className={`font-heading text-xl whitespace-nowrap ${
                    item.is_available ? 'text-white' : 'text-white/40'
                  }`}
                >
                  {item.name}
                  {!item.is_available && (
                    <span className="ml-2 text-xs uppercase tracking-wider text-red-400/80">
                      Slutsåld
                    </span>
                  )}
                </h3>
                <div className="flex-1 border-b border-dotted border-gold/30 mb-1" />
                <span
                  className={`font-heading text-xl whitespace-nowrap ${
                    item.is_available ? 'text-gold' : 'text-gold/40'
                  }`}
                >
                  {item.price} kr
                </span>
              </div>
              {item.description && (
                <p className="text-white/40 text-sm mt-1 whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {(cat.subcategories || []).length > 0 && (
        <div className="mt-8 space-y-6">
          {(cat.subcategories || []).map(sub => (
            <CategorySection key={sub.id} cat={sub} isSubcategory />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
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
    ? categories.filter(c => c.id === activeCategory)
    : categories

  return (
    <div>
      <Helmet>
        <title>Meny | Raffaello Restaurang Boden</title>
        <meta
          name="description"
          content="Utforska vår meny med saftiga steaks, italienska klassiker, pizza, pasta, hamburgare och desserter på Raffaello Restaurang i Boden."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative flex h-[50vh] min-h-[300px] items-center justify-center overflow-hidden text-center">
        <HeroBackdrop src={SITE.images.steak} alt="" objectPosition="center center" />
        <div className="relative z-10 px-6">
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Smaka på</p>
          <h1 className="font-heading text-5xl md:text-6xl text-white mb-4">Vår Meny</h1>
          <p className="text-white/55 text-sm max-w-md mx-auto leading-relaxed mt-2">
            Grill, burgare, dryck och mer — avslappnat som på menyn i lokalen.
          </p>
          <div className="w-16 h-px bg-gold mx-auto mt-6" />
        </div>
      </section>

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="bg-dark py-8 px-6">
          <div className="flex flex-wrap justify-center gap-3 max-w-6xl mx-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2 text-xs uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                activeCategory === null
                  ? 'bg-gold text-dark border-gold'
                  : 'border-gold/40 text-gold hover:bg-gold hover:text-dark'
              }`}
            >
              Alla
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 text-xs uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gold text-dark border-gold'
                    : 'border-gold/40 text-gold hover:bg-gold hover:text-dark'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu content */}
      <section className="bg-dark py-24 px-6">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="space-y-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-end gap-2 animate-pulse">
                  <div className="h-5 w-48 bg-white/10 rounded" />
                  <div className="flex-1 border-b border-dotted border-gold/20 mb-1" />
                  <div className="h-5 w-16 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filtered.map(cat => (
            <CategorySection key={cat.id} cat={cat} />
          ))}

          {!loading && error && (
            <p className="text-center text-white/40 text-lg">
              Menyn kunde inte laddas. Kontrollera att API:t körs (t.ex.{' '}
              <code className="text-gold/80">npm run dev</code> eller{' '}
              <code className="text-gold/80">python manage.py runserver</code> på port 8000) och ladda om sidan.
            </p>
          )}

          {!loading && !error && categories.length === 0 && (
            <p className="text-center text-white/40 text-lg max-w-xl mx-auto">
              Ingen huvudkategori finns än. I admin: skapa kategori med{' '}
              <span className="text-white/60">överordnad kategori</span> tomt så den syns på menyn;
              underrubriker får en överordnad kategori satt.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
