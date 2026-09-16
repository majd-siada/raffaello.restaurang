import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center bg-dark px-6 py-24 text-center">
      <Helmet>
        <title>Sidan hittades inte | Raffaello</title>
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">404</p>
      <h1 className="mb-4 font-heading text-4xl text-white md:text-5xl">Sidan hittades inte</h1>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-white/55">
        Länken fungerar inte längre, eller sidan har flyttats. Gå till startsidan eller öppna menyn.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-colors hover:bg-gold-hover"
        >
          Till startsidan
        </Link>
        <Link
          to="/meny"
          className="inline-flex min-h-[44px] items-center justify-center border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-dark"
        >
          Meny
        </Link>
      </div>
    </div>
  )
}
