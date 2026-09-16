import { opsFetch } from './api'
import { useOpsQuery } from './useOpsQuery'
import { btnSecondary } from './opsFormat'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from './ui'

export default function RestaurantPage() {
  const { data, loading, error, reload } = useOpsQuery(
    () => opsFetch('/restaurant/'),
    [],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const schedule = data.schedule || data.opening_hours || data.hours || []

  return (
    <div>
      <PageHeader
        title="Restaurang"
        subtitle="Read-only — öppettider från JSON (source of truth)"
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <div className="mb-4 rounded border border-gold/30 bg-gold-dim px-4 py-3 text-sm text-white/85">
        {data.note ||
          'Öppettider skrivs inte via Ops. Kanonisk fil: backend/raffaello/data/opening_hours.json (måste speglas i frontend).'}
        {data.source ? (
          <span className="mt-1 block text-white/55">Källa: {data.source}</span>
        ) : null}
        {data.writable === false ? (
          <span className="mt-1 block text-white/55">Skrivbart via API: nej</span>
        ) : null}
      </div>

      <dl className="mb-6 grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
        <Field label="Tidszon" value={data.timezone} />
        <Field label="Max gäster online" value={data.max_guests_online} />
        <Field label="Slot-intervall (min)" value={data.slot_interval_minutes} />
      </dl>

      <h2 className="mb-3 font-heading text-xl text-white">Öppettider</h2>
      {Array.isArray(schedule) && schedule.length > 0 ? (
        <ul className="divide-y divide-white/10 rounded border border-white/10 bg-dark-2">
          {schedule.map((row, i) => (
            <li key={i} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-white/70">
                {row.label || row.day || row.weekday || `Rad ${i + 1}`}
              </span>
              <span className="text-white">
                {row.closed
                  ? 'Stängt'
                  : row.hours ||
                    (row.opens && row.closes
                      ? `${row.opens}–${row.closes}`
                      : row.text || '—')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <pre className="overflow-x-auto rounded border border-white/10 bg-dark-2 p-4 text-xs text-white/70">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className="mt-1 text-white/90">{value}</dd>
    </div>
  )
}
