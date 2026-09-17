import { opsFetch } from './api'
import { useOpsQuery } from './useOpsQuery'
import { btnSecondary, formatDateTime, yesNo } from './opsFormat'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from './ui'

export default function SystemPage() {
  const { data, loading, error, reload } = useOpsQuery(
    () => opsFetch('/system/'),
    [],
  )

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <EmptyState />

  const counts = data.counts || {}
  const importStatus = data.import_status || {}
  const lastRun = importStatus.last_run || {}

  return (
    <div>
      <PageHeader
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
        <Field
          label="FAQ/Legal CMS"
          value={
            data.faq_legal?.cms
              ? 'Ja'
              : data.faq_legal?.note || 'Nej'
          }
        />
      </dl>

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
        <Field label="Senaste status" value={lastRun.status || importStatus.status || '—'} />
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
