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

export default function EventsPage() {
  const { id } = useParams()
  const { permissions } = useAuth()

  if (!permissions.events) return <ForbiddenState />
  if (id) return <EventDetail id={id} />
  return <EventList />
}

function EventList() {
  const [q, setQ] = useState('')
  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/events/', { q, page_size: 50 }),
    [q],
  )
  const items = data?.results || []

  return (
    <div>
      <PageHeader title="Privata Event" subtitle="Förfrågningar från webbplatsen" />

      <div className="mb-4">
        <label className={labelClass()} htmlFor="event-q">
          Sök
        </label>
        <input
          id="event-q"
          className={inputClass()}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Namn, e-post, tillfälle…"
        />
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
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
                  <tr key={ev.id}>
                    <td className="px-3 py-3">
                      <Link to={`/ops/event/${ev.id}`} className="text-gold hover:underline">
                        {ev.first_name} {ev.last_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{ev.preferred_date || '—'}</td>
                    <td className="px-3 py-3">{ev.guests ?? '—'}</td>
                    <td className="px-3 py-3">{ev.occasion || '—'}</td>
                    <td className="px-3 py-3">{formatDateTime(ev.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {items.map((ev) => (
              <li key={ev.id} className="rounded border border-white/10 bg-dark-2 p-4">
                <Link to={`/ops/event/${ev.id}`} className="font-heading text-lg text-gold">
                  {ev.first_name} {ev.last_name}
                </Link>
                <p className="mt-1 text-sm text-white/70">
                  {ev.preferred_date || 'datum saknas'} · {ev.guests ?? '—'} gäster
                </p>
                <p className="text-sm text-white/50">{ev.occasion || '—'}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

function EventDetail({ id }) {
  const { data: item, loading, error, reload } = useOpsQuery(
    () => opsFetch(`/events/${id}/`),
    [id],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!item) return <EmptyState title="Förfrågan hittades inte" />

  return (
    <div>
      <PageHeader
        title={`${item.first_name} ${item.last_name}`}
        subtitle={item.occasion || 'Eventförfrågan'}
        actions={
          <Link to="/ops/event" className={btnSecondary()}>
            Tillbaka
          </Link>
        }
      />
      <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
        <Field label="Referens" value={`#${item.id}`} />
        <Field label="Önskat datum" value={item.preferred_date || '—'} />
        <Field label="Gäster" value={item.guests ?? '—'} />
        <Field label="Telefon" value={item.phone} />
        <Field label="E-post" value={item.email} />
        <Field label="Telegram-notifiering skickad" value={yesNo(item.notify_sent)} />
        <Field label="Skapad" value={formatDateTime(item.created_at)} />
        <div className="sm:col-span-2">
          <dt className="text-white/45">Meddelande</dt>
          <dd className="mt-1 whitespace-pre-wrap text-white/85">
            {item.message || '—'}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-white/40">
        Ingen eventstatus lagras i systemet. Kapaciteter bekräftas inte här — se
        publika villkor.
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
