import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { opsFetch, opsList } from './api'
import { useOpsQuery } from './useOpsQuery'
import {
  btnSecondary,
  formatDateTime,
  inputClass,
  labelClass,
  yesNo,
} from './opsFormat'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  PageHeader,
} from './ui'

export default function BookingsPage() {
  const { id } = useParams()
  const { permissions } = useAuth()

  if (!permissions.bookings) return <ForbiddenState />
  if (id) return <BookingDetail id={id} />
  return <BookingList />
}

function BookingList() {
  const [q, setQ] = useState('')
  const [date, setDate] = useState('')
  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/bookings/', { q, date, page_size: 50 }),
    [q, date],
  )
  const items = data?.results || []

  return (
    <div>
      <PageHeader title="Bokningar" subtitle="Lista utan statusflöde (finns inte i databasen)" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass()} htmlFor="booking-q">
            Sök
          </label>
          <input
            id="booking-q"
            className={inputClass()}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Namn, e-post, telefon…"
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="booking-date">
            Datum
          </label>
          <input
            id="booking-date"
            type="date"
            className={inputClass()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
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
                      <Link to={`/ops/bokningar/${b.id}`} className="text-gold hover:underline">
                        {b.date} {b.time}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-white">
                      {b.first_name} {b.last_name}
                    </td>
                    <td className="px-3 py-3">{b.guests}</td>
                    <td className="px-3 py-3">
                      {b.phone}
                      <br />
                      <span className="text-white/50">{b.email}</span>
                    </td>
                    <td className="px-3 py-3">{formatDateTime(b.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((b) => (
              <li key={b.id} className="rounded border border-white/10 bg-dark-2 p-4">
                <Link to={`/ops/bokningar/${b.id}`} className="font-heading text-lg text-gold">
                  {b.first_name} {b.last_name}
                </Link>
                <p className="mt-1 text-sm text-white/70">
                  {b.date} {b.time} · {b.guests} gäster
                </p>
                <p className="text-sm text-white/50">{b.phone}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

function BookingDetail({ id }) {
  const { data: item, loading, error, reload } = useOpsQuery(
    () => opsFetch(`/bookings/${id}/`),
    [id],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!item) return <EmptyState title="Bokning hittades inte" />

  return (
    <div>
      <PageHeader
        title={`${item.first_name} ${item.last_name}`}
        subtitle={`${item.date} ${item.time}`}
        actions={
          <Link to="/ops/bokningar" className={btnSecondary()}>
            Tillbaka
          </Link>
        }
      />
      <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
        <Field label="Referens" value={`#${item.id}`} />
        <Field label="Gäster" value={item.guests} />
        <Field label="Telefon" value={item.phone} />
        <Field label="E-post" value={item.email} />
        <Field label="Telegram-notifiering skickad" value={yesNo(item.whatsapp_sent)} />
        <Field label="Testbokning" value={yesNo(item.is_test)} />
        <Field label="Skapad" value={formatDateTime(item.created_at)} />
        <div className="sm:col-span-2">
          <dt className="text-white/45">Meddelande</dt>
          <dd className="mt-1 whitespace-pre-wrap text-white/85">
            {item.message || '—'}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-white/40">
        Ingen bokningsstatus lagras i systemet — visa endast faktiska fält.
      </p>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className="mt-1 text-white/90">{value ?? '—'}</dd>
    </div>
  )
}
