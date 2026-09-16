import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE, bookingSlotsForDate, MAX_GUESTS_ONLINE } from '../siteConfig'
import { hydrateOpeningHoursFromApi } from '../openingHours'
import { Button } from './ui/Button'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/bookings/`

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
  'w-full rounded-sm border border-white/15 bg-transparent px-4 py-3 text-cream outline-none transition-colors placeholder:text-cream/30 focus:border-gold focus:ring-1 focus:ring-gold/40'
const labelClass = 'mb-2 block text-xs uppercase tracking-[0.2em] text-cream/55'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

/**
 * Shared booking request form — honest förfrågan (not instant confirmation).
 * On success, shows backend booking ``id`` as referensnummer.
 */
export default function BookingForm() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorText, setErrorText] = useState('')
  const [isTechnicalError, setIsTechnicalError] = useState(false)
  const [bookingRef, setBookingRef] = useState(null)
  const submittingRef = useRef(false)
  const successTitleRef = useRef(null)

  useEffect(() => {
    hydrateOpeningHoursFromApi().then(() => {
      setForm((f) => ({ ...f }))
    })
  }, [])

  useEffect(() => {
    if (status === 'success') {
      successTitleRef.current?.focus?.()
    }
  }, [status])

  const minDate = todayISO()
  const availableTimes = availableSlotsForDate(form.date)

  const showTechnicalError = () => {
    setStatus('error')
    setIsTechnicalError(true)
    setErrorText('')
  }

  const showValidationError = (message) => {
    setStatus('error')
    setIsTechnicalError(false)
    setErrorText(message)
  }

  const onChange = (e) => {
    const { name, value } = e.target

    if (name === 'guests') {
      if (value === '') {
        setForm((prev) => ({ ...prev, guests: '' }))
        return
      }
      const n = Math.min(MAX_GUESTS_ONLINE, Math.max(1, Number(value) || 1))
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
    if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS_ONLINE) {
      return `Ange 1–${MAX_GUESTS_ONLINE} gäster. För fler, ring ${SITE.phoneDisplay}.`
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
    if (submittingRef.current || status === 'submitting') return

    setErrorText('')
    setIsTechnicalError(false)
    setBookingRef(null)

    const clientError = validateClient()
    if (clientError) {
      showValidationError(clientError)
      return
    }

    submittingRef.current = true
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
        const isTechnical =
          res.status === 503 ||
          data?.code === 'booking_notify_failed' ||
          res.status >= 500
        if (isTechnical) {
          showTechnicalError()
          return
        }
        const detail =
          data?.detail ||
          (data && typeof data === 'object'
            ? Object.values(data).flat().join(' ')
            : null) ||
          'Något gick fel. Försök igen eller ring oss.'
        showValidationError(typeof detail === 'string' ? detail : 'Något gick fel.')
        return
      }
      if (!data?.ok) {
        showTechnicalError()
        return
      }
      const ref = data?.id
      setBookingRef(ref != null ? ref : null)
      setIsTechnicalError(false)
      setStatus('success')
      setForm(emptyForm)
    } catch (err) {
      const looksLikeNetwork =
        err instanceof TypeError ||
        /failed to fetch|networkerror|load failed/i.test(String(err?.message || ''))
      if (looksLikeNetwork) {
        showTechnicalError()
        return
      }
      showValidationError(err.message || 'Något gick fel. Försök igen.')
    } finally {
      submittingRef.current = false
    }
  }

  const dismissSuccess = () => {
    setIsTechnicalError(false)
    setBookingRef(null)
    setStatus('idle')
  }

  useEffect(() => {
    if (status !== 'success') return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') dismissSuccess()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [status])

  return (
    <>
      {status === 'success' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-success-title"
          onClick={dismissSuccess}
        >
          <div
            className="w-full max-w-md border border-gold/40 bg-dark-2 p-8 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="booking-success-title"
              ref={successTitleRef}
              tabIndex={-1}
              className="mb-3 font-heading text-2xl text-white outline-none md:text-3xl"
            >
              Tack för din förfrågan!
            </p>
            <p className="mb-4 text-base leading-relaxed text-white/65 sm:text-[1.05rem]">
              Vi har mottagit din bordsförfrågan. Restaurangen återkommer med bekräftelse.
              Detta är inte en automatisk bordsreservation.
            </p>
            {bookingRef != null && (
              <p className="mb-6 text-sm text-white/80">
                Referensnummer:{' '}
                <span className="font-heading text-lg text-gold">{bookingRef}</span>
              </p>
            )}
            <p className="mb-8 text-sm leading-relaxed text-white/50">
              Behöver du ändra något eller är ni fler än {MAX_GUESTS_ONLINE}? Ring{' '}
              <a
                href={`tel:${SITE.phoneTel}`}
                className="text-gold underline decoration-gold/40 underline-offset-2 hover:text-gold-hover"
              >
                {SITE.phoneDisplay}
              </a>{' '}
              och uppge referensnumret.
            </p>
            <button
              type="button"
              onClick={dismissSuccess}
              className="min-h-11 border border-gold px-6 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-dark"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

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
              max={MAX_GUESTS_ONLINE}
              step={1}
              inputMode="numeric"
              value={form.guests}
              onChange={onChange}
              className={fieldClass}
            />
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Max {MAX_GUESTS_ONLINE} via formulär. Fler? Ring{' '}
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

        <p className="text-xs leading-relaxed text-white/45">
          Du skickar en <strong className="font-medium text-white/70">förfrågan</strong>. Vi
          bekräftar bordet separat — ingen direktbekräftelse online.
        </p>

        {status === 'error' && isTechnicalError && (
          <div
            className="space-y-3 border border-red-400/30 bg-red-950/30 px-4 py-4 text-sm leading-relaxed text-red-200 sm:text-[0.95rem]"
            role="alert"
          >
            <p>
              Oj! Det verkar som att vi har ett tillfälligt tekniskt problem med
              bokningsaviseringen. Vi jobbar på att lösa det så snart som möjligt.
            </p>
            <p>
              Vill du boka direkt? Ring restaurangen på{' '}
              <a
                href={`tel:${SITE.phoneTel}`}
                className="font-medium text-gold underline decoration-gold/50 underline-offset-2 transition-colors hover:text-gold-hover"
              >
                {SITE.phoneDisplay}
              </a>
              , så hjälper vi dig!
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle')
                setIsTechnicalError(false)
              }}
              className="text-sm text-gold underline underline-offset-2"
            >
              Försök igen
            </button>
          </div>
        )}

        {status === 'error' && !isTechnicalError && errorText && (
          <p className="text-sm text-red-400" role="alert">
            {errorText}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={status === 'submitting'}
          className="w-full sm:w-auto"
        >
          Skicka bokningsförfrågan
        </Button>

        <p className="text-center text-xs text-white/40 sm:text-left">
          Eller ring{' '}
          <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">
            {SITE.phoneDisplay}
          </a>
          {' · '}
          <Link to="/kontakt" className="text-gold hover:underline">
            Kontakt
          </Link>
        </p>
      </form>
    </>
  )
}
