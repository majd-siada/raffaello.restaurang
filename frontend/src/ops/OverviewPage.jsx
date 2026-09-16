import { Link } from 'react-router-dom'
import { opsFetch } from './api'
import { useOpsQuery } from './useOpsQuery'
import { formatDateTime, yesNo } from './opsFormat'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from './ui'

export default function OverviewPage() {
  const { data, loading, error, reload } = useOpsQuery(
    () => opsFetch('/overview/'),
    [],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const today = data.today || {}
  const mom = data.matochmat || {}
  const attention = data.attention || []
  const recent = data.recent || {}

  return (
    <div>
      <PageHeader
        title="Översikt"
        subtitle={`Uppdaterad ${formatDateTime(data.generated_at)}`}
      />

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Öppen nu" value={yesNo(today.open_now)} />
        <StatCard
          label="Dagens tider"
          value={
            today.hours
              ? `${today.hours.opens}–${today.hours.closes}`
              : 'Stängt / saknas'
          }
        />
        <StatCard label="Bokningar idag" value={String(today.bookings_count ?? 0)} />
        <StatCard
          label="Event (7 dagar)"
          value={String(today.event_inquiries_7d ?? 0)}
        />
        <StatCard
          label="Lunch publicerad"
          value={yesNo(today.lunch_published)}
        />
        <StatCard
          label="Lunchrätter (vecka)"
          value={String(today.lunch_dish_count ?? 0)}
        />
        <StatCard
          label="Erbjudande publicerat"
          value={yesNo(today.offer_published)}
        />
        <StatCard
          label="MoM status"
          value={(mom.last_run && mom.last_run.status) || mom.status || '—'}
        />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-heading text-xl text-white">Uppmärksamhet</h2>
        {attention.length === 0 ? (
          <EmptyState title="Inga varningar" message="Allt ser stabilt ut just nu." />
        ) : (
          <ul className="space-y-2">
            {attention.map((item) => (
              <li
                key={item.code}
                className="rounded border border-gold/30 bg-gold-dim px-4 py-3 text-sm"
              >
                <span className="text-xs uppercase tracking-wider text-gold">
                  {item.severity || 'info'}
                </span>
                <p className="mt-1 text-white/90">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <h2 className="font-heading text-xl text-white">Mat och Mat</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Row k="Parser" v={mom.parser_version || '—'} />
          <Row k="Service-datum" v={mom.service_date || '—'} />
          <Row k="Senaste status" v={(mom.last_run && mom.last_run.status) || '—'} />
          <Row
            k="Senaste körning"
            v={formatDateTime(mom.last_run?.finished_at || mom.last_run?.started_at)}
          />
          <Row k="Senaste hash" v={mom.last_run?.source_hash || mom.last_success?.source_hash || '—'} />
          <Row k="Senaste lyckade" v={mom.last_success?.status || '—'} />
          <Row k="Meddelande" v={mom.last_run?.message || '—'} />
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentList
          title="Senaste bokningar"
          empty="Inga bokningar"
          items={recent.bookings}
          render={(b) => (
            <Link to={`/ops/bokningar/${b.id}`} className="text-gold hover:underline">
              {b.first_name} {b.last_name} · {b.date} {b.time} · {b.guests} gäster
            </Link>
          )}
        />
        <RecentList
          title="Senaste event"
          empty="Inga eventförfrågningar"
          items={recent.events}
          render={(ev) => (
            <Link to={`/ops/event/${ev.id}`} className="text-gold hover:underline">
              {ev.first_name} {ev.last_name} · {ev.preferred_date || 'datum saknas'}
            </Link>
          )}
        />
        <RecentList
          title="Senaste import"
          empty="Inga importrader"
          items={recent.imports}
          render={(r) => (
            <span>
              {r.status} · v{r.week_number}/{r.year} · {formatDateTime(r.started_at)}
            </span>
          )}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded border border-white/10 bg-dark-2 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-1 font-heading text-lg text-white">{value}</p>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="shrink-0 text-white/45">{k}</dt>
      <dd className="text-white/85">{v}</dd>
    </div>
  )
}

function RecentList({ title, items, empty, render }) {
  const list = items || []
  return (
    <section>
      <h2 className="mb-3 font-heading text-lg text-white">{title}</h2>
      {list.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <ul className="divide-y divide-white/10 rounded border border-white/10 bg-dark-2">
          {list.map((item) => (
            <li key={item.id} className="px-3 py-3 text-sm">
              {render(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
