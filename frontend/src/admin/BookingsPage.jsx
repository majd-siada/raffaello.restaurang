import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList } from './api'
import { useAdminQuery } from './useAdminQuery'
import {
  BOOKING_NOTIFY_LABEL,
  BOOKING_STATUS_FIELD_EXISTS,
  BOOKING_STAFF_WRITE_API,
} from './bookingHelpers'
import {
  btnSecondary,
  formatDateTime,
  inputClass,
  labelClass,
  yesNo,
} from './format'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  PageHeader,
} from './ui'

export default function BookingsPage() {
  const { id } = useParams()
  const { permissions } = useAdminAuth()

  if (!permissions.bookings) return <ForbiddenState />
  if (id) return <BookingDetail id={id} />
  return <BookingList />
}

function BookingList() {
  const [q, setQ] = useState('')
  const [date, setDate] = useState('')
  const { data, loading, error, errorStatus, reload } = useAdminQuery(
    () => adminList('/bookings/', { q, date, page_size: 50 }),
    [q, date],
  )
  const items = data?.results || []

  if (errorStatus === 403) return <ForbiddenState />

  return (
    <div>
      <PageHeader
        eyebrow="Bokning"
        title="Bokningar"
        subtitle="Endast faktiska fält. Ingen bokningsstatus i databasen."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass()} htmlFor="admin-booking-q">
            Sök
          </label>
          <input
            id="admin-booking-q"
            className={`${inputClass()} min-h-11`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Namn, e-post, telefon…"
            autoComplete="off"
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="admin-booking-date">
            Datum
          </label>
          <input
            id="admin-booking-date"
            type="date"
            className={`${inputClass()} min-h-11`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error && errorStatus !== 403 ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inga bokningar" />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded border border-white/10 md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-dark-2 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-3">När</th>
                  <th className="px-3 py-3">Namn</th>
                  <th className="px-3 py-3">Gäster</th>
                  <th className="px-3 py-3">Kontakt</th>
                  <th className="px-3 py-3">Skapad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <Link
                        to={`/admin/bokningar/${b.id}`}
                        className="text-gold hover:underline"
                      >
                        {b.date} {b.time}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-white">
                      {b.first_name} {b.last_name}
                    </td>
                    <td className="px-3 py-3">{b.guests}</td>
                    <td className="max-w-[14rem] px-3 py-3">
                      <span className="break-all">{b.phone}</span>
                      <br />
                      <span className="break-all text-white/50">{b.email}</span>
                    </td>
                    <td className="px-3 py-3">{formatDateTime(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((b) => (
              <li
                key={b.id}
                className="rounded border border-white/10 bg-dark-2 p-4"
              >
                <Link
                  to={`/admin/bokningar/${b.id}`}
                  className="font-heading text-lg text-gold"
                >
                  {b.first_name} {b.last_name}
                </Link>
                <p className="mt-1 text-sm text-white/70">
                  {b.date} {b.time} · {b.guests} gäster
                </p>
                <p className="break-all text-sm text-white/50">{b.phone}</p>
              </li>
            ))}
          </ul>
          {data?.next || data?.previous ? (
            <p className="mt-3 text-xs text-white/40" aria-live="polite">
              Visar upp till 50 per sida (backend-paginering).
            </p>
          ) : null}
        </>
      ) : null}

      {!BOOKING_STATUS_FIELD_EXISTS && !BOOKING_STAFF_WRITE_API ? (
        <p className="mt-4 text-xs text-white/40">
          Read-only via <code className="text-white/55">/api/admin/bookings/</code>
          . Inget statusflöde, ingen radering i Admin.
        </p>
      ) : null}
    </div>
  )
}

function BookingDetail({ id }) {
  const { data: item, loading, error, errorStatus, reload } = useAdminQuery(
    () => adminFetch(`/bookings/${id}/`),
    [id],
  )

  if (loading) return <LoadingState />
  if (errorStatus === 403) return <ForbiddenState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!item) return <EmptyState title="Bokning hittades inte" />

  return (
    <div>
      <PageHeader
        title={`${item.first_name} ${item.last_name}`}
        subtitle={`${item.date} ${item.time}`}
        actions={
          <Link to="/admin/bokningar" className={`${btnSecondary()} min-h-11`}>
            Tillbaka
          </Link>
        }
      />

      <section className="mb-4" aria-labelledby="booking-customer-h">
        <h2 id="booking-customer-h" className="mb-2 font-heading text-base text-white">
          Kunduppgifter
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label="Namn" value={`${item.first_name} ${item.last_name}`} />
          <Field label="Telefon" value={item.phone} breakAll />
          <Field label="E-post" value={item.email} breakAll />
          <div className="sm:col-span-2">
            <dt className="text-white/45">Meddelande</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-white/85">
              {item.message || '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-4" aria-labelledby="booking-info-h">
        <h2 id="booking-info-h" className="mb-2 font-heading text-base text-white">
          Bokningsuppgifter
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label="Referens" value={`#${item.id}`} />
          <Field label="Datum" value={item.date} />
          <Field label="Tid" value={item.time} />
          <Field label="Gäster" value={item.guests} />
        </dl>
      </section>

      <section aria-labelledby="booking-internal-h">
        <h2 id="booking-internal-h" className="mb-2 font-heading text-base text-white">
          Internt
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label={BOOKING_NOTIFY_LABEL} value={yesNo(item.whatsapp_sent)} />
          <Field label="Testbokning" value={yesNo(item.is_test)} />
          <Field label="Skapad" value={formatDateTime(item.created_at)} />
        </dl>
      </section>

      <p className="mt-4 text-xs text-white/40">
        Ingen bokningsstatus lagras. Telegram = restaurangnotifiering (inte
        gäst-WhatsApp).
      </p>
    </div>
  )
}

function Field({ label, value, breakAll = false }) {
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd
        className={`mt-1 text-white/90 ${breakAll ? 'break-all' : ''}`}
      >
        {value ?? '—'}
      </dd>
    </div>
  )
}
