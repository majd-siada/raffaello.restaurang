import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { MENU_PAGES } from '../data/menuPages'

function formatPrice(price) {
  if (price == null) return null
  return `${price} SEK`
}

function MenuItemRow({ item, sectionPrice }) {
  const price = item.price ?? sectionPrice
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-[0.95rem] font-semibold leading-snug text-gold sm:text-base">
          {item.name}
        </h3>
        {price != null && (
          <span className="shrink-0 font-heading text-[0.95rem] font-semibold text-gold sm:text-base">
            {formatPrice(price)}
          </span>
        )}
      </div>
      {item.description && (
        <p className="mt-0.5 text-[0.8rem] italic leading-relaxed text-white/85 sm:text-sm">
          {item.description}
        </p>
      )}
    </div>
  )
}

function SectionBlock({ title, notes, items, sectionPrice }) {
  return (
    <div className="mb-8 last:mb-0">
      {title && (
        <div className="mb-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">{title}</h2>
            {sectionPrice != null && (
              <span className="font-heading text-sm font-semibold italic text-gold sm:text-base">
                {formatPrice(sectionPrice)}
              </span>
            )}
          </div>
          <div className="mt-1 h-px w-full bg-white/70" />
        </div>
      )}
      {notes?.map((note, i) => (
        <p
          key={i}
          className={`mb-2 text-sm italic ${
            note.tone === 'gold' ? 'text-gold' : 'text-white/70'
          }`}
        >
          {note.text}
        </p>
      ))}
      <div className="space-y-1">
        {items?.map((item, i) => (
          <MenuItemRow key={`${item.name}-${i}`} item={item} sectionPrice={sectionPrice} />
        ))}
      </div>
    </div>
  )
}

function ColumnContent({ column }) {
  if (column.sections) {
    return column.sections.map((section, i) => (
      <SectionBlock
        key={`${section.title}-${i}`}
        title={section.title}
        notes={section.notes}
        items={section.items}
        sectionPrice={section.sectionPrice}
      />
    ))
  }

  return (
    <SectionBlock
      title={column.title}
      notes={column.notes}
      items={column.items}
      sectionPrice={column.sectionPrice}
    />
  )
}

function WineCard({ wine }) {
  return (
    <article className="mb-8 border-l-2 border-gold/70 pl-4 last:mb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold text-gold underline decoration-gold/50 underline-offset-4">
            {wine.name}
          </h3>
          {wine.details?.map((line) => (
            <p key={line} className="mt-1 text-sm text-white/80">
              {line}
            </p>
          ))}
        </div>
        <div className="shrink-0 text-sm text-gold sm:text-right">
          <p>Ett glas {wine.glass} SEK</p>
          <p>En flaska {wine.bottle} SEK</p>
        </div>
      </div>
      {wine.pairsWith && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            Passar perfekt till:
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/85">{wine.pairsWith}</p>
        </div>
      )}
      {wine.why && (
        <p className="mt-2 text-sm italic leading-relaxed text-white/70">
          <span className="not-italic font-semibold text-white/90">Varför: </span>
          {wine.why}
        </p>
      )}
    </article>
  )
}

function MenuBoard({ page }) {
  return (
    <article
      id={`meny-${page.id}`}
      className="relative scroll-mt-28 overflow-hidden rounded-sm border border-white/10 bg-black"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-bottom opacity-40"
        style={{ backgroundImage: "url('/images/menu-grill.webp')" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black/92 to-black/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-orange-700/35 via-amber-900/15 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 px-5 py-10 sm:px-8 sm:py-12 md:px-12">
        <header className="mb-10 text-center">
          <h2 className="font-brand text-4xl font-bold tracking-tight text-gold sm:text-5xl">
            Raffaello
          </h2>
          <p className="mt-2 font-brand-sub text-sm uppercase tracking-[0.35em] text-white sm:text-base">
            Stekhus &amp; Bar
          </p>
          {page.intro && (
            <p className="mt-4 text-sm italic text-gold sm:text-base">{page.intro}</p>
          )}
        </header>

        {page.layout === 'wine' ? (
          <div className="mx-auto max-w-3xl">
            {page.wines?.map((wine) => (
              <WineCard key={wine.name} wine={wine} />
            ))}
            {page.wineGroups?.map((group) => (
              <section key={group.title} className="mb-10 last:mb-0">
                <h3 className="mb-5 font-heading text-lg font-bold tracking-wide text-gold">
                  <span className="mr-2 inline-block h-4 w-1 bg-white/80 align-middle" />
                  {group.title}
                </h3>
                {group.wines.map((wine) => (
                  <WineCard key={wine.name} wine={wine} />
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 md:gap-0">
            {page.columns.map((column, index) => (
              <div
                key={index}
                className={
                  index === 0
                    ? 'md:border-r md:border-gold/40 md:pr-8'
                    : 'md:pl-8'
                }
              >
                <ColumnContent column={column} />
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-[0.65rem] uppercase tracking-[0.45em] text-white/70">
          www.raffaello.se
        </p>
      </div>
    </article>
  )
}

export default function Menu() {
  const [activeId, setActiveId] = useState(MENU_PAGES[0].id)

  useEffect(() => {
    const sections = MENU_PAGES.map((page) => document.getElementById(`meny-${page.id}`)).filter(
      Boolean
    )
    if (!sections.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.id) {
          setActiveId(visible.target.id.replace(/^meny-/, ''))
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.15, 0.35, 0.6] }
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bg-dark">
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

      <section className="relative flex min-h-[38vh] items-center justify-center overflow-hidden text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/menu-grill.webp')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/75" aria-hidden />
        <div className="relative z-10 px-6 py-16">
          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-gold">Meny</p>
          <h1 className="font-brand text-5xl font-bold text-gold sm:text-6xl">Raffaello</h1>
          <p className="mt-2 font-brand-sub text-lg uppercase tracking-[0.3em] text-white">
            Stekhus &amp; Bar
          </p>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70">
            Grill, pizza, pasta, burgare och dryck — som på menyn i lokalen.
          </p>
        </div>
      </section>

      <nav
        className="sticky top-0 z-30 border-b border-white/10 bg-dark/95 backdrop-blur-md"
        aria-label="Menykategorier"
      >
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 scrollbar-thin">
          {MENU_PAGES.map((page) => (
            <a
              key={page.id}
              href={`#meny-${page.id}`}
              className={`shrink-0 border px-3 py-2 text-[0.65rem] uppercase tracking-widest transition-colors sm:text-xs ${
                activeId === page.id
                  ? 'border-gold bg-gold text-dark'
                  : 'border-gold/35 text-gold hover:border-gold hover:bg-gold/10'
              }`}
            >
              {page.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          {MENU_PAGES.map((page) => (
            <MenuBoard key={page.id} page={page} />
          ))}
        </div>
      </section>
    </div>
  )
}
