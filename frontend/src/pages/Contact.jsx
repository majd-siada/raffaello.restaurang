import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SITE, bookingSlotsForDate } from '../siteConfig'
import HeroBackdrop from '../components/HeroBackdrop'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/bookings/`
const MAX_GUESTS = 6

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  date: '',
  time: '',
  guests: '2',
  message: '',
}

const fieldClass =
  'w-full border border-white/15 bg-transparent px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold'
const labelClass = 'mb-2 block text-xs uppercase tracking-[0.2em] text-gold'

/** Local calendar date as YYYY-MM-DD */
function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Local time as HH:MM (24h) */
function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function availableSlotsForDate(isoDate) {
  if (!isoDate) return []
  const slots = bookingSlotsForDate(isoDate)
  if (isoDate === todayISO()) {
    return slots.filter((t) => t > nowHHMM())
  }
  return slots
}

function BookingForm() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorText, setErrorText] = useState('')

  const minDate = todayISO()
  const availableTimes = availableSlotsForDate(form.date)

  const onChange = (e) => {
    const { name, value } = e.target

    if (name === 'guests') {
      if (value === '') {
        setForm((prev) => ({ ...prev, guests: '' }))
        return
      }
      const n = Math.min(MAX_GUESTS, Math.max(1, Number(value) || 1))
      setForm((prev) => ({ ...prev, guests: String(n) }))
      return
    }

    if (name === 'date') {
      setForm((prev) => {
        const next = { ...prev, date: value }
        const slots = availableSlotsForDate(value)
        if (prev.time && !slots.includes(prev.time)) {
          next.time = ''
        }
        return next
      })
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateClient = () => {
    const guests = Number(form.guests)
    if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
      return `Ange 1–${MAX_GUESTS} gäster. För fler, ring ${SITE.phoneDisplay}.`
    }
    if (!form.date || form.date < todayISO()) {
      return 'Välj ett datum från och med idag.'
    }
    if (!form.time) {
      return 'Välj en tid.'
    }
    if (form.date === todayISO() && form.time <= nowHHMM()) {
      return 'Välj en tid som inte har passerat.'
    }
    const daySlots = bookingSlotsForDate(form.date)
    if (!daySlots.includes(form.time)) {
      return 'Välj en tid inom öppettiderna.'
    }
    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErrorText('')

    const clientError = validateClient()
    if (clientError) {
      setStatus('error')
      setErrorText(clientError)
      return
    }

    setStatus('submitting')

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      date: form.date,
      time: form.time,
      guests: Number(form.guests),
      message: form.message.trim(),
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail =
          data?.detail ||
          (data && typeof data === 'object'
            ? Object.values(data).flat().join(' ')
            : null) ||
          'Något gick fel. Försök igen eller ring oss.'
        throw new Error(typeof detail === 'string' ? detail : 'Något gick fel.')
      }
      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      setStatus('error')
      setErrorText(err.message || 'Något gick fel. Försök igen.')
    }
  }

  if (status === 'success') {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="font-heading text-2xl text-white mb-3">Tack för din förfrågan!</p>
        <p className="text-white/60 leading-relaxed mb-8">
          Vi har tagit emot din bokningsförfrågan och återkommer så snart vi kan.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="border border-gold px-6 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-dark"
        >
          Skicka en till
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5" lang="sv-SE" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClass}>
            Förnamn
          </label>
          <input
            id="first_name"
            name="first_name"
            required
            autoComplete="given-name"
            value={form.first_name}
            onChange={onChange}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>
            Efternamn
          </label>
          <input
            id="last_name"
            name="last_name"
            required
            autoComplete="family-name"
            value={form.last_name}
            onChange={onChange}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            value={form.phone}
            onChange={onChange}
            className={fieldClass}
            placeholder="07X XXX XX XX"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            className={fieldClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className={labelClass}>
            Datum
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            lang="sv-SE"
            min={minDate}
            value={form.date}
            onChange={onChange}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="time" className={labelClass}>
            Tid
          </label>
          <select
            id="time"
            name="time"
            required
            disabled={!form.date}
            value={form.time}
            onChange={onChange}
            className={`${fieldClass} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <option value="" disabled>
              {form.date ? 'Välj tid' : 'Välj datum först'}
            </option>
            {form.date && availableTimes.length === 0 ? (
              <option value="" disabled>
                Inga tider kvar idag
              </option>
            ) : (
              availableTimes.map((t) => (
                <option key={t} value={t} className="bg-dark text-white">
                  {t}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label htmlFor="guests" className={labelClass}>
            Gäster
          </label>
          <input
            id="guests"
            name="guests"
            type="number"
            required
            min={1}
            max={MAX_GUESTS}
            step={1}
            inputMode="numeric"
            value={form.guests}
            onChange={onChange}
            className={fieldClass}
          />
          <p className="mt-2 text-xs leading-relaxed text-white/40">
            Max {MAX_GUESTS} via formulär. Fler? Ring{' '}
            <a href={`tel:${SITE.phoneTel}`} className="text-gold/80 hover:text-gold">
              {SITE.phoneDisplay}
            </a>
            .
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Meddelande <span className="normal-case tracking-normal text-white/40">(valfritt)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={form.message}
          onChange={onChange}
          className={`${fieldClass} resize-y`}
          placeholder="Allergier, barnstol, firande…"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-400" role="alert">
          {errorText}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex min-h-[44px] w-full items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Skickar…' : 'Skicka bokningsförfrågan'}
      </button>
    </form>
  )
}

export default function Contact() {
  return (
    <div>
      <Helmet>
        <title>Kontakt | Raffaello Restaurang Boden</title>
        <meta
          name="description"
          content="Kontakta Raffaello Restaurang i Boden. Hitta adress, telefon, öppettider och boka ditt bord enkelt."
        />
        <link rel="canonical" href="https://raffaello.se/kontakt" />
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
                name: 'Kontakt',
                item: 'https://raffaello.se/kontakt',
              },
            ],
          })}
        </script>
      </Helmet>

      <section className="relative flex min-h-[min(52vh,480px)] items-center justify-center overflow-hidden bg-dark text-center">
        <HeroBackdrop
          images={[...SITE.gallery.slice(3), ...SITE.gallery.slice(0, 3)]}
          alt={SITE.imageAlts.bar}
        />
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-gold">Hör av dig</p>
          <h1 className="mb-4 font-heading text-5xl text-white md:text-6xl">Kontakta Oss</h1>
          <div className="mx-auto h-px w-16 bg-gold" />
        </div>
      </section>

      <section id="boka-bord" className="scroll-mt-24 bg-dark-2 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Reservation</p>
            <h2 className="font-heading text-4xl text-white md:text-5xl">Boka bord</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/55">
              Skicka en förfrågan för upp till 6 personer. Är ni fler, ring oss på{' '}
              <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">
                {SITE.phoneDisplay}
              </a>
              . För större sällskap, se även{' '}
              <Link to="/privata-events" className="text-gold hover:underline">
                privata events
              </Link>
              .
            </p>
          </div>
          <BookingForm />
        </div>
      </section>

      <section id="besok-oss" className="scroll-mt-24 bg-dark px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-gold">Hitta Oss</p>
            <h2 className="font-heading text-4xl text-white md:text-5xl">Besök oss</h2>
          </div>
          <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-2">
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-white/10 p-8 text-center transition-colors hover:border-gold/30"
            >
              <div className="mb-4 text-3xl text-gold">📍</div>
              <h3 className="mb-3 font-heading text-xl text-white">Adress</h3>
              <p className="text-sm leading-relaxed text-white/50 transition-colors group-hover:text-gold">
                {SITE.addressLine1}
                <br />
                {SITE.addressLine2}
              </p>
            </a>
            <div className="border border-white/10 p-8 text-center transition-colors hover:border-gold/30">
              <div className="mb-4 text-3xl text-gold">📞</div>
              <h3 className="mb-3 font-heading text-xl text-white">Kontakt</h3>
              <p className="text-sm leading-relaxed text-white/50">
                <a href={`tel:${SITE.phoneTel}`} className="transition-colors hover:text-gold">
                  {SITE.phoneDisplay}
                </a>
                <br />
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-gold">
                  {SITE.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
