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
 * Read-only system health via Admin system endpoint (shared handlers with Ops mount).
 * Never displays secrets (API returns booleans/counts only).
 */
export default function AdminSystemPage() {
  const { data, loading, error, reload } = useAdminQuery(
    () => adminFetch('/system/'),
    [],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const counts = data.counts || {}
  const importStatus = data.import_status || {}
  const lastRun = importStatus.last_run || {}
  const faqLegal = data.faq_legal || {}
  const drift = data.hours_drift
  const driftLabel =
    drift == null
      ? '—'
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
        eyebrow="System"
        title="System"
        subtitle="Hälsokontroll och konfiguration (inga hemligheter)"
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <dl className="mb-6 grid gap-3 rounded border border-white/10 bg-dark-2 p-4 text-sm sm:grid-cols-2">
        <Field label="Health" value={data.health} />
        <Field label="Tidszon" value={data.timezone} />
        <Field label="Mat och Mat-synk" value={yesNo(data.matochmat_sync_enabled)} />
        <Field label="Telegram konfigurerad" value={yesNo(data.telegram_configured)} />
        <Field label="E-postavisering konfigurerad" value={yesNo(data.email_configured)} />
        <Field label="Öppettider-källa" value={data.hours_source} />
        <Field label="Öppettider-detalj" value={data.hours_source_detail} />
        <Field label="Öppettider-drift" value={driftLabel} />
        <Field
          label="FAQ/Legal källa"
          value={faqLegal.source || (faqLegal.cms ? 'cms' : '—')}
        />
        <Field
          label="FAQ publicerade"
          value={
            faqLegal.faq_published != null
              ? String(faqLegal.faq_published)
              : '—'
          }
        />
        <Field
          label="Legal-sidor (DB)"
          value={
            faqLegal.legal_pages != null ? String(faqLegal.legal_pages) : '—'
          }
        />
      </dl>

      {faqLegal.note ? (
        <p className="mb-6 text-sm text-white/50">{faqLegal.note}</p>
      ) : null}

      <h2 className="mb-3 font-heading text-xl text-white">Antal</h2>
      <ul className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(counts).map(([k, v]) => (
          <li
            key={k}
            className="rounded border border-white/10 bg-dark-2 px-3 py-3 text-sm"
          >
            <span className="text-white/45">{k}</span>
            <p className="font-heading text-lg text-white">{String(v)}</p>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 font-heading text-xl text-white">Importstatus</h2>
      <dl className="rounded border border-white/10 bg-dark-2 p-4 text-sm">
        <Field
          label="Senaste status"
          value={lastRun.status || importStatus.status || '—'}
        />
        <Field label="Startad" value={formatDateTime(lastRun.started_at)} />
        <Field label="Klar" value={formatDateTime(lastRun.finished_at)} />
        <Field label="Meddelande" value={lastRun.message || '—'} />
      </dl>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="mb-2">
      <dt className="text-white/45">{label}</dt>
      <dd className="mt-0.5 text-white/90">{value ?? '—'}</dd>
    </div>
  )
}
