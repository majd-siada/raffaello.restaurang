import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList } from './api'
import { useAdminQuery } from './useAdminQuery'
import {
  EVENT_CAPACITY_EDITABLE,
  EVENT_STAFF_WRITE_API,
  EVENT_STATUS_FIELD_EXISTS,
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

export default function EventsPage() {
  const { id } = useParams()
  const { permissions } = useAdminAuth()

  if (!permissions.events) return <ForbiddenState />
  if (id) return <EventDetail id={id} />
  return <EventList />
}

function EventList() {
  const [q, setQ] = useState('')
  const { data, loading, error, errorStatus, reload } = useAdminQuery(
    () => adminList('/events/', { q, page_size: 50 }),
    [q],
  )
  const items = data?.results || []

  if (errorStatus === 403) return <ForbiddenState />

  return (
    <div>
      <PageHeader
        eyebrow="Bokning"
        title="Privata Event"
        subtitle="Förfrågningar (EventInquiry). Inte bekräftade bokningar."
      />

      <div className="mb-4">
        <label className={labelClass()} htmlFor="admin-event-q">
          Sök
        </label>
        <input
          id="admin-event-q"
          className={`${inputClass()} min-h-11`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Namn, e-post, tillfälle…"
          autoComplete="off"
        />
      </div>

      {loading ? <LoadingState /> : null}
      {error && errorStatus !== 403 ? (
        <ErrorState message={error} onRetry={reload} />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inga förfrågningar" />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded border border-white/10 md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-dark-2 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-3">Namn</th>
                  <th className="px-3 py-3">Önskat datum</th>
                  <th className="px-3 py-3">Gäster</th>
                  <th className="px-3 py-3">Tillfälle</th>
                  <th className="px-3 py-3">Skapad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-3">
                      <Link
                        to={`/admin/event/${ev.id}`}
                        className="text-gold hover:underline"
                      >
                        {ev.first_name} {ev.last_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{ev.preferred_date || '—'}</td>
                    <td className="px-3 py-3">{ev.guests ?? '—'}</td>
                    <td className="max-w-[12rem] truncate px-3 py-3">
                      {ev.occasion || '—'}
                    </td>
                    <td className="px-3 py-3">{formatDateTime(ev.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((ev) => (
              <li
                key={ev.id}
                className="rounded border border-white/10 bg-dark-2 p-4"
              >
                <Link
                  to={`/admin/event/${ev.id}`}
                  className="font-heading text-lg text-gold"
                >
                  {ev.first_name} {ev.last_name}
                </Link>
                <p className="mt-1 text-sm text-white/70">
                  {ev.preferred_date || 'datum saknas'} · {ev.guests ?? '—'}{' '}
                  gäster
                </p>
                <p className="break-words text-sm text-white/50">
                  {ev.occasion || '—'}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!EVENT_STATUS_FIELD_EXISTS && !EVENT_STAFF_WRITE_API ? (
        <p className="mt-4 text-xs text-white/40">
          Read-only via <code className="text-white/55">/api/admin/events/</code>
          . Kapaciteter redigeras inte här
          {EVENT_CAPACITY_EDITABLE ? '' : ' (capacitiesConfirmed = false).'}.
        </p>
      ) : null}
    </div>
  )
}

function EventDetail({ id }) {
  const { data: item, loading, error, errorStatus, reload } = useAdminQuery(
    () => adminFetch(`/events/${id}/`),
    [id],
  )

  if (loading) return <LoadingState />
  if (errorStatus === 403) return <ForbiddenState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!item) return <EmptyState title="Förfrågan hittades inte" />

  return (
    <div>
      <PageHeader
        title={`${item.first_name} ${item.last_name}`}
        subtitle={item.occasion || 'Eventförfrågan'}
        actions={
          <Link to="/admin/event" className={`${btnSecondary()} min-h-11`}>
            Tillbaka
          </Link>
        }
      />

      <section className="mb-4" aria-labelledby="event-customer-h">
        <h2 id="event-customer-h" className="mb-2 font-heading text-base text-white">
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

      <section className="mb-4" aria-labelledby="event-info-h">
        <h2 id="event-info-h" className="mb-2 font-heading text-base text-white">
          Förfrågan
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label="Referens" value={`#${item.id}`} />
          <Field label="Önskat datum" value={item.preferred_date || '—'} />
          <Field label="Gäster" value={item.guests ?? '—'} />
          <Field label="Tillfälle" value={item.occasion || '—'} />
        </dl>
      </section>

      <section aria-labelledby="event-internal-h">
        <h2 id="event-internal-h" className="mb-2 font-heading text-base text-white">
          Internt
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field
            label="Telegram-notifiering skickad"
            value={yesNo(item.notify_sent)}
          />
          <Field label="Skapad" value={formatDateTime(item.created_at)} />
        </dl>
      </section>

      <p className="mt-4 text-xs text-white/40" role="status">
        Ingen eventstatus i databasen. Kapaciteter (inomhus/utomhus) är inte
        bekräftade i Admin — se publika villkor (
        <code className="text-white/55">capacitiesConfirmed</code>).
      </p>
    </div>
  )
}

function Field({ label, value, breakAll = false }) {
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className={`mt-1 text-white/90 ${breakAll ? 'break-all' : ''}`}>
        {value ?? '—'}
      </dd>
    </div>
  )
}
