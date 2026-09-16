import { Link } from 'react-router-dom'
import { SITE } from '../siteConfig'
import { adminFetch } from './api'
import { useAdminQuery } from './useAdminQuery'
import { btnSecondary, yesNo } from './format'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  PageHeader,
} from './ui'

/**
 * Read-only restaurant ops view — GET /api/admin/restaurant/.
 * NAP is shown from siteConfig.js only (not migrated / not editable here).
 */
export default function AdminRestaurantPage() {
  const { data, loading, error, errorStatus, reload } = useAdminQuery(
    () => adminFetch('/restaurant/'),
    [],
  )

  if (loading) return <LoadingState label="Laddar restaurang…" />
  if (errorStatus === 403) return <ForbiddenState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const schedule = Array.isArray(data.schedule) ? data.schedule : []
  const drift = data.drift
  const driftStatus =
    drift == null
      ? null
      : typeof drift === 'object' && drift.status
        ? drift.status
        : typeof drift === 'object' && drift.match === true
          ? 'MATCH'
          : typeof drift === 'object'
            ? 'DRIFT'
            : String(drift)

  return (
    <div>
      <PageHeader
        eyebrow="Restaurang"
        title="Restaurang"
        subtitle="Endast visning — öppettider och bokningsregler från Admin-API. NAP ändras inte här."
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <p className="mb-6 rounded border border-white/10 bg-dark-2 px-4 py-3 text-sm text-white/70">
        Endast visning — ändringar görs inte från denna vy. Öppettider redigeras under{' '}
        <Link className="text-gold hover:underline" to="/admin/oppettider">
          Öppettider
        </Link>
        .
      </p>

      <section className="mb-8" aria-labelledby="nap-heading">
        <h2 id="nap-heading" className="mb-3 font-heading text-xl text-white">
          Namn, adress, telefon
        </h2>
        <p className="mb-3 text-xs text-white/45">
          Källa: frontend <code className="text-white/60">siteConfig.js</code> — ingen
          databaskopia.
        </p>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label="Namn" value={SITE.name} />
          <Field label="Kortnamn" value={SITE.shortName} />
          <Field label="Adress" value={SITE.addressLine1} />
          <Field label="Ort" value={SITE.addressLine2} />
          <Field label="Telefon" value={SITE.phoneDisplay} />
          <Field label="E-post" value={SITE.email} />
        </dl>
      </section>

      <section className="mb-8" aria-labelledby="hours-source-heading">
        <h2 id="hours-source-heading" className="mb-3 font-heading text-xl text-white">
          Öppettider — källa
        </h2>
        {data.note ? (
          <p className="mb-3 rounded border border-gold/30 bg-gold-dim px-4 py-3 text-sm text-white/85">
            {data.note}
          </p>
        ) : null}
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
          <Field label="Aktiv källa" value={data.source} />
          <Field
            label="Öppettider redigerbara i Admin"
            value={data.writable == null ? null : yesNo(data.writable)}
          />
          <Field label="Drift JSON↔DB" value={driftStatus} />
        </dl>
      </section>

      <section className="mb-8" aria-labelledby="booking-rules-heading">
        <h2 id="booking-rules-heading" className="mb-3 font-heading text-xl text-white">
          Bokningsregler
        </h2>
        <dl className="grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tidszon" value={data.timezone} />
          <Field label="Max gäster online" value={data.max_guests_online} />
          <Field label="Slot-intervall (min)" value={data.slot_interval_minutes} />
        </dl>
      </section>

      <section className="mb-8" aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="mb-3 font-heading text-xl text-white">
          Schema (publik payload)
        </h2>
        {schedule.length === 0 ? (
          <EmptyState title="Inget schema" message="API returnerade ingen schedule." />
        ) : (
          <ul className="divide-y divide-white/10 rounded border border-white/10 bg-dark-2">
            {schedule.map((row, i) => (
              <li
                key={`${row.label || i}-${row.opens || ''}-${row.closes || ''}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="text-white/70">{row.label || `Rad ${i + 1}`}</span>
                <span className="tabular-nums text-white">
                  {row.opens && row.closes ? `${row.opens}–${row.closes}` : '—'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className="mt-1 text-white/90">{String(value)}</dd>
    </div>
  )
}
