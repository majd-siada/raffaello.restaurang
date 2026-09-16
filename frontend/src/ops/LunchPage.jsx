import { useState } from 'react'
import { useAuth } from './AuthContext'
import { opsFetch, opsList, OpsApiError } from './api'
import { useOpsQuery } from './useOpsQuery'
import { formatPrice } from '../formatPrice'
import {
  btnPrimary,
  btnSecondary,
  formatDateTime,
  yesNo,
} from './opsFormat'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  PageHeader,
} from './ui'

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

export default function LunchPage() {
  const { permissions } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [syncOk, setSyncOk] = useState(null)

  const { data, loading, error, reload } = useOpsQuery(
    async () => {
      const [current, importList] = await Promise.all([
        opsFetch('/lunch/current/'),
        opsList('/lunch/import-runs/', { page_size: 20 }),
      ])
      return { week: current, runs: importList.results }
    },
    [],
    { enabled: Boolean(permissions.lunch) },
  )

  if (!permissions.lunch) return <ForbiddenState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const week = data?.week
  const runs = data?.runs || []

  async function handleSync() {
    if (!permissions.lunch_sync) {
      setSyncMsg('Saknar behörighet att synka.')
      setSyncOk(false)
      return
    }
    const ok = window.confirm(
      'Synka lunch från Mat och Mat nu? Befintlig veckodata kan uppdateras.',
    )
    if (!ok) return
    setSyncing(true)
    setSyncMsg(null)
    setSyncOk(null)
    try {
      const res = await opsFetch('/lunch/sync/', { method: 'POST' })
      const r = res?.result || {}
      setSyncOk(true)
      setSyncMsg(
        `Synk klar: ${r.status || 'ok'}${r.message ? ` — ${r.message}` : ''}`,
      )
      reload()
    } catch (err) {
      setSyncOk(false)
      setSyncMsg(err instanceof OpsApiError ? err.message : 'Synk misslyckades.')
    } finally {
      setSyncing(false)
    }
  }

  const empty = week?.empty
  const dishes = week?.dishes || []

  return (
    <div>
      <PageHeader
        title="Lunch"
        subtitle={
          empty
            ? `Vecka ${week.week_number}/${week.year} — ingen data`
            : week
              ? `Vecka ${week.week_number}/${week.year}`
              : undefined
        }
        actions={
          <>
            <button type="button" className={btnSecondary()} onClick={reload}>
              Uppdatera
            </button>
            {permissions.lunch_sync ? (
              <button
                type="button"
                className={btnPrimary()}
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? 'Synkar…' : 'Synka Mat och Mat'}
              </button>
            ) : null}
          </>
        }
      />

      {syncMsg ? (
        <p
          className={`mb-4 rounded border px-3 py-2 text-sm ${
            syncOk === false
              ? 'border-red-500/40 bg-red-950/30 text-red-200'
              : 'border-white/10 bg-dark-2 text-white/80'
          }`}
          role={syncOk === false ? 'alert' : 'status'}
        >
          {syncMsg}
        </p>
      ) : null}

      {empty ? (
        <EmptyState
          title="Ingen lunchvecka"
          message="Kör synk eller vänta på automatisk import."
        />
      ) : (
        <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4 text-sm">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-white/45">Publicerad</dt>
              <dd>{yesNo(week.is_published)}</dd>
            </div>
            <div>
              <dt className="text-white/45">Lunchtider</dt>
              <dd>{week.lunch_hours_text || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Källa (typ)</dt>
              <dd>{week.source_type || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Källa (URL)</dt>
              <dd className="break-all">{week.source_url || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Hash</dt>
              <dd className="break-all font-mono text-xs">{week.source_hash || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Parser</dt>
              <dd>{week.parser_version || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Hämtad</dt>
              <dd>{formatDateTime(week.fetched_at)}</dd>
            </div>
            <div>
              <dt className="text-white/45">Senaste importstatus</dt>
              <dd>{week.last_import_status || '—'}</dd>
            </div>
            <div>
              <dt className="text-white/45">Manuell override</dt>
              <dd>{yesNo(week.skip_auto_sync || week.manual_override)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-white/45">Intro</dt>
              <dd>{week.intro_text || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-white/45">Anteckningar</dt>
              <dd>{week.notes || '—'}</dd>
            </div>
          </dl>

          <h2 className="mt-6 font-heading text-lg text-white">Rätter</h2>
          {dishes.length === 0 ? (
            <EmptyState title="Inga rätter denna vecka" />
          ) : (
            <>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-white/45">
                    <tr>
                      <th className="py-2 pr-3">Dag</th>
                      <th className="py-2 pr-3">Namn</th>
                      <th className="py-2 pr-3">Pris</th>
                      <th className="py-2">Tillgänglig</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dishes.map((d) => (
                      <tr key={d.id}>
                        <td className="py-2 pr-3">
                          {d.weekday == null ? 'Alla' : WEEKDAYS[d.weekday] || d.weekday}
                        </td>
                        <td className="py-2 pr-3 text-white">
                          <span className="block">{d.name}</span>
                          {d.description ? (
                            <span className="block text-xs text-white/50">{d.description}</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3">{formatPrice(d.price) || '—'}</td>
                        <td className="py-2">{yesNo(d.is_available)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-3 space-y-2 md:hidden">
                {dishes.map((d) => (
                  <li key={d.id} className="rounded border border-white/10 p-3">
                    <p className="text-white">{d.name}</p>
                    <p className="text-xs text-white/50">
                      {d.weekday == null ? 'Alla' : WEEKDAYS[d.weekday]} ·{' '}
                      {formatPrice(d.price) || '—'}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-heading text-xl text-white">Importhistorik</h2>
        {runs.length === 0 ? (
          <EmptyState title="Inga körningar" />
        ) : (
          <ul className="divide-y divide-white/10 rounded border border-white/10 bg-dark-2">
            {runs.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <p className="text-white">
                  {r.status} · v{r.week_number}/{r.year} · {r.item_count ?? 0} rätter
                </p>
                <p className="text-white/50">
                  {formatDateTime(r.started_at)}
                  {r.message ? ` — ${r.message}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
