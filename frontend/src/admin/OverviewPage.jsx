import { Link } from 'react-router-dom'
import { adminFetch } from './api'
import { useAdminQuery } from './useAdminQuery'
import { btnSecondary, formatDateTime, yesNo } from './format'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from './ui'

/**
 * Operational dashboard — Riva-inspired hierarchy, Raffaello data only.
 * Inquiry bookings: no status chips. Empty offer is neutral, not an alarm.
 */
export default function AdminOverviewPage() {
  const { data, loading, error, reload } = useAdminQuery(
    () => adminFetch('/overview/'),
    [],
  )

  if (loading) return <LoadingState label="Laddar översikt…" />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const today = data.today || {}
  const mom = data.matochmat || {}
  const attention = data.attention || []
  const todayBookings = data.today_bookings || []
  const recent = data.recent || {}
  const dateLabel = today.date || '—'

  return (
    <div>
      <PageHeader
        eyebrow="Översikt"
        title="Översikt"
        subtitle={`Dagens läge · ${dateLabel} · uppdaterad ${formatDateTime(data.generated_at)}`}
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <section
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Driftstatus"
      >
        <StatCard label="Öppen nu" value={yesNo(today.open_now)} />
        <StatCard
          label="Dagens tider"
          value={
            today.hours
              ? `${today.hours.opens}–${today.hours.closes}`
              : 'Stängt / saknas'
          }
        />
        <StatCard
          label="Lunch publicerad"
          value={yesNo(today.lunch_published)}
        />
        <StatCard
          label="MoM-synk"
          value={(mom.last_run && mom.last_run.status) || mom.status || '—'}
        />
      </section>

      <section
        className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Nyckeltal"
      >
        <StatCard
          label="Bokningar idag"
          value={String(today.bookings_count ?? 0)}
          emphasis
        />
        <StatCard
          label="Gäster idag"
          value={String(today.guests_today ?? 0)}
          emphasis
        />
        <StatCard
          label="Kommande bokningar"
          value={String(today.upcoming_count ?? 0)}
          emphasis
        />
        <StatCard
          label="Event (7 dagar)"
          value={String(today.event_inquiries_7d ?? 0)}
          emphasis
        />
      </section>

      <section className="mb-8" aria-labelledby="today-bookings-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2
            id="today-bookings-heading"
            className="font-heading text-xl text-cream"
          >
            Dagens bokningar
          </h2>
          <Link
            to="/admin/bokningar"
            className="min-h-11 inline-flex items-center text-sm text-gold hover:underline"
          >
            Alla bokningar →
          </Link>
        </div>
        <p className="mb-3 text-xs text-muted">
          Bokningsförfrågningar (ingen bekräftelsestatus i systemet).
        </p>
        {todayBookings.length === 0 ? (
          <EmptyState
            title="Inga bokningar idag"
            message="Inga förfrågningar registrerade för dagens datum."
          />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table min-w-[28rem] text-left">
              <thead>
                <tr>
                  <th>Tid</th>
                  <th>Namn</th>
                  <th>Gäster</th>
                  <th>Referens</th>
                  <th>
                    <span className="sr-only">Öppna</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="tabular-nums text-cream">{formatTime(b.time)}</td>
                    <td className="text-cream/90">
                      {b.first_name} {b.last_name}
                    </td>
                    <td className="tabular-nums">{b.guests}</td>
                    <td className="font-mono text-xs text-muted">#{b.id}</td>
                    <td className="text-right">
                      <Link
                        to={`/admin/bokningar/${b.id}`}
                        className="inline-flex min-h-11 items-center text-gold hover:underline"
                      >
                        Visa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8" aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="mb-3 font-heading text-xl text-cream">
          Uppmärksamhet
        </h2>
        {attention.length === 0 ? (
          <EmptyState
            title="Inga varningar"
            message="Inga automatiska driftvarningar just nu."
          />
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
                {item.code === 'lunch_sync_failed' ||
                item.code === 'lunch_not_published' ? (
                  <Link
                    to="/admin/lunch"
                    className="mt-2 inline-flex min-h-11 items-center text-gold hover:underline"
                  >
                    Öppna lunch →
                  </Link>
                ) : null}
                {item.code === 'event_inquiries' ? (
                  <Link
                    to="/admin/event"
                    className="mt-2 inline-flex min-h-11 items-center text-gold hover:underline"
                  >
                    Öppna event →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8" aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="mb-3 font-heading text-xl text-cream">
          Snabbåtgärder
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/admin/meny', label: 'Redigera meny' },
            { to: '/admin/lunch', label: 'Lunch / synk' },
            { to: '/admin/bokningar', label: 'Visa bokningar' },
            { to: '/admin/oppettider', label: 'Öppettider' },
            { to: '/admin/galleri', label: 'Galleri' },
            { to: '/admin/system', label: 'Systemstatus' },
          ].map((a) => (
            <li key={a.to}>
              <Link
                to={a.to}
                className="admin-card flex min-h-11 items-center px-4 text-sm text-gold transition-colors hover:border-gold/40"
              >
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="admin-card mb-8 grid gap-3 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Innehållsstatus"
      >
        <Fact
          label="Lunchrätter (vecka)"
          value={String(today.lunch_dish_count ?? 0)}
        />
        <Fact
          label="Lunch idag"
          value={String(today.lunch_today_dish_count ?? 0)}
        />
        <Fact
          label="Veckans erbjudande"
          value={
            today.offer_published
              ? 'Publicerat'
              : today.offer_empty
                ? 'Inget erbjudande publicerat ännu'
                : 'Opublicerat'
          }
        />
        <Fact
          label="MoM parser"
          value={mom.parser_version || '—'}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentList
          title="Senaste eventförfrågningar"
          empty="Inga eventförfrågningar"
          items={recent.events}
          render={(ev) => (
            <Link
              to={`/admin/event/${ev.id}`}
              className="text-gold hover:underline"
            >
              {ev.first_name} {ev.last_name} ·{' '}
              {ev.preferred_date || 'datum saknas'}
            </Link>
          )}
        />
        <RecentList
          title="Senaste lunchimport"
          empty="Inga importrader"
          items={recent.imports}
          render={(r) => (
            <span>
              {r.status} · v{r.week_number}/{r.year} ·{' '}
              {formatDateTime(r.started_at)}
            </span>
          )}
        />
      </div>
    </div>
  )
}

function formatTime(value) {
  if (!value) return '—'
  const s = String(value)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function StatCard({ label, value, emphasis = false }) {
  return (
    <div className="admin-card px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p
        className={[
          'mt-1.5 font-heading text-cream',
          emphasis ? 'text-2xl tabular-nums sm:text-3xl' : 'text-lg',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}

function Fact({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-cream/90">{value}</p>
    </div>
  )
}

function RecentList({ title, items, empty, render }) {
  const list = items || []
  return (
    <section>
      <h2 className="mb-3 font-heading text-lg text-cream">{title}</h2>
      {list.length === 0 ? (
        <EmptyState title={empty} />
      ) : (
        <ul className="admin-card divide-y divide-cream/10">
          {list.map((item) => (
            <li key={item.id} className="px-3 py-3 text-sm text-cream/85">
              {render(item)}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
