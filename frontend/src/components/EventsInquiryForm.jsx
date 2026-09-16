import { useEffect, useRef, useState } from 'react'
import { SITE } from '../siteConfig'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/events/`

const emptyForm = {
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  preferred_date: '',
  guests: '',
  occasion: '',
  message: '',
}

const fieldClass =
  'w-full border border-white/15 bg-transparent px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold'
const labelClass = 'mb-2 block text-xs uppercase tracking-[0.2em] text-gold'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Private-events förfrågan — not a confirmed booking.
 * Success shows backend id as referensnummer.
 */
export default function EventsInquiryForm() {
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [errorText, setErrorText] = useState('')
  const [isTechnicalError, setIsTechnicalError] = useState(false)
  const [inquiryRef, setInquiryRef] = useState(null)
  const submittingRef = useRef(false)
  const successRef = useRef(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus?.()
  }, [status])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (status === 'error') {
      setStatus('idle')
      setErrorText('')
      setIsTechnicalError(false)
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setStatus('submitting')
    setErrorText('')
    setIsTechnicalError(false)

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      occasion: form.occasion.trim(),
      message: form.message.trim(),
    }
    if (form.preferred_date) payload.preferred_date = form.preferred_date
    if (form.guests !== '') {
      const n = Number(form.guests)
      if (!Number.isFinite(n) || n < 1) {
        setStatus('error')
        setErrorText('Ange ett giltigt antal gäster, eller lämna fältet tomt.')
        submittingRef.current = false
        return
      }
      payload.guests = n
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (res.status === 201 && data?.ok && data.id != null) {
        setInquiryRef(data.id)
        setStatus('success')
        setForm(emptyForm)
        submittingRef.current = false
        return
      }

      if (res.status === 503 || data?.code) {
        setStatus('error')
        setIsTechnicalError(true)
        setErrorText('')
        submittingRef.current = false
        return
      }

      const fieldError =
        data && typeof data === 'object'
          ? Object.values(data).flat().find((v) => typeof v === 'string')
          : null
      setStatus('error')
      setIsTechnicalError(false)
      setErrorText(
        fieldError ||
          data?.detail ||
          'Förfrågan kunde inte skickas. Kontrollera uppgifterna och försök igen.',
      )
    } catch {
      setStatus('error')
      setIsTechnicalError(true)
      setErrorText('')
    }
    submittingRef.current = false
  }

  return (
    <div className="mx-auto max-w-xl">
      {status === 'success' ? (
        <div
          className="border border-gold/40 bg-dark-2 px-6 py-8 text-center outline-none"
          role="status"
          tabIndex={-1}
          ref={successRef}
        >
          <p className="font-heading text-2xl text-white">Tack för din förfrågan!</p>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Vi har mottagit din eventförfrågan. Restaurangen återkommer. Detta är inte en
            automatisk bekräftelse av bokning eller kapacitet.
          </p>
          {inquiryRef != null && (
            <p className="mt-4 text-sm uppercase tracking-[0.15em] text-gold">
              Referensnummer: {inquiryRef}
            </p>
          )}
          <p className="mt-4 text-sm text-white/50">
            Behöver du snabb hjälp? Ring{' '}
            <a href={`tel:${SITE.phoneTel}`} className="text-gold hover:underline">
              {SITE.phoneDisplay}
            </a>{' '}
            och uppge referensnumret.
          </p>
          <button
            type="button"
            className="mt-6 min-h-[44px] border border-gold px-6 py-2 text-xs uppercase tracking-widest text-gold hover:bg-gold hover:text-dark"
            onClick={() => {
              setStatus('idle')
              setInquiryRef(null)
            }}
          >
            Skicka en ny förfrågan
          </button>
        </div>
      ) : (
      <form onSubmit={onSubmit} className="space-y-5 text-left" noValidate>
        <p className="text-sm leading-relaxed text-white/55">
          Skicka en förfrågan för privata event och större sällskap. Vi återkommer med upplägg —
          ingen automatisk bekräftelse online.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-first" className={labelClass}>
              Förnamn
            </label>
            <input
              id="ev-first"
              name="first_name"
              required
              autoComplete="given-name"
              value={form.first_name}
              onChange={onChange}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ev-last" className={labelClass}>
              Efternamn
            </label>
            <input
              id="ev-last"
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
            <label htmlFor="ev-phone" className={labelClass}>
              Telefon
            </label>
            <input
              id="ev-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="07X XXX XX XX"
              value={form.phone}
              onChange={onChange}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ev-email" className={labelClass}>
              E-post
            </label>
            <input
              id="ev-email"
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="ev-date" className={labelClass}>
              Önskat datum (valfritt)
            </label>
            <input
              id="ev-date"
              name="preferred_date"
              type="date"
              min={todayISO()}
              value={form.preferred_date}
              onChange={onChange}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="ev-guests" className={labelClass}>
              Antal gäster ca (valfritt)
            </label>
            <input
              id="ev-guests"
              name="guests"
              type="number"
              min={1}
              max={500}
              value={form.guests}
              onChange={onChange}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="ev-occasion" className={labelClass}>
            Typ av tillställning (valfritt)
          </label>
          <input
            id="ev-occasion"
            name="occasion"
            maxLength={120}
            placeholder="T.ex. firmafest, födelsedag…"
            value={form.occasion}
            onChange={onChange}
            className={fieldClass}
          />
          <p className="mt-2 text-xs text-white/40">
            Fritext — vi bekräftar upplägg och kapacitet separat.
          </p>
        </div>

        <div>
          <label htmlFor="ev-message" className={labelClass}>
            Meddelande (valfritt)
          </label>
          <textarea
            id="ev-message"
            name="message"
            rows={4}
            value={form.message}
            onChange={onChange}
            placeholder="Önskemål, allergier, tidpunkt…"
            className={fieldClass}
          />
        </div>

        {status === 'error' && (
          <div className="border border-red-400/40 bg-red-950/20 px-4 py-3 text-sm text-red-200" role="alert">
            {isTechnicalError ? (
              <>
                Aviseringen kunde inte skickas just nu. Ring{' '}
                <a href={`tel:${SITE.phoneTel}`} className="underline">
                  {SITE.phoneDisplay}
                </a>{' '}
                så hjälper vi dig.
              </>
            ) : (
              errorText
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="inline-flex min-h-[44px] w-full items-center justify-center bg-gold px-8 py-3 text-sm uppercase tracking-widest text-dark transition-colors hover:bg-gold-hover disabled:opacity-60 sm:w-auto"
        >
          {status === 'submitting' ? 'Skickar…' : 'Skicka eventförfrågan'}
        </button>
      </form>
      )}
    </div>
  )
}
