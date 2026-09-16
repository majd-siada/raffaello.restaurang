import { useMemo, useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import { formatPrice } from '../formatPrice'
import {
  btnPrimary,
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
  OpsDialog,
  PageHeader,
} from './ui'
import {
  classifySyncResult,
  groupDishesByWeekday,
  isImportFailureStatus,
  isManualOverride,
  LUNCH_DISH_WRITE_API,
  statusToneClass,
  weekdayLabel,
} from './lunchHelpers'

function OverrideBadge({ active }) {
  return (
    <span
      className={
        active
          ? 'inline-flex min-h-8 items-center rounded border border-amber-400/50 bg-amber-950/40 px-2 text-xs font-medium uppercase tracking-wide text-amber-100'
          : 'inline-flex min-h-8 items-center rounded border border-emerald-500/30 bg-emerald-950/30 px-2 text-xs font-medium uppercase tracking-wide text-emerald-200'
      }
    >
      {active ? 'MANUAL OVERRIDE' : 'AUTO'}
    </span>
  )
}

function MetaRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-white/45">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-white/85">{children}</dd>
    </div>
  )
}

export default function AdminLunchPage() {
  const { permissions } = useAdminAuth()
  const canLunch = Boolean(permissions.lunch)
  const canSync = Boolean(permissions.lunch_sync)
  const canChange = Boolean(permissions.lunch_sync) // change_lunchweek

  const [selectedWeekId, setSelectedWeekId] = useState(null)
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [flash, setFlash] = useState(null)

  const currentQuery = useAdminQuery(
    () => adminFetch('/lunch/current/'),
    [],
    { enabled: canLunch },
  )

  const weeksQuery = useAdminQuery(
    () => adminList('/lunch/weeks/', { page_size: 52 }),
    [],
    { enabled: canLunch },
  )

  const runsQuery = useAdminQuery(
    () => adminList('/lunch/import-runs/', { page_size: 25 }),
    [],
    { enabled: canLunch },
  )

  const weeks = useMemo(
    () => weeksQuery.data?.results || [],
    [weeksQuery.data],
  )
  const runs = runsQuery.data?.results || []
  const current = currentQuery.data

  const selectedWeek = useMemo(() => {
    if (selectedWeekId != null) {
      return weeks.find((w) => w.id === selectedWeekId) || null
    }
    if (current && !current.empty && current.id) {
      return weeks.find((w) => w.id === current.id) || current
    }
    return null
  }, [selectedWeekId, weeks, current])

  const displayWeek = selectedWeek || (current && !current.empty ? current : null)
  const dishes = useMemo(() => displayWeek?.dishes || [], [displayWeek])
  const byDay = useMemo(() => groupDishesByWeekday(dishes), [dishes])
  const override = isManualOverride(displayWeek)

  function reloadAll() {
    currentQuery.reload()
    weeksQuery.reload()
    runsQuery.reload()
  }

  if (!canLunch) return <ForbiddenState />

  const listForbidden =
    currentQuery.errorStatus === 403 ||
    weeksQuery.errorStatus === 403 ||
    runsQuery.errorStatus === 403

  if (listForbidden) return <ForbiddenState />

  const bootLoading =
    currentQuery.loading && !currentQuery.data && weeksQuery.loading && !weeksQuery.data

  if (bootLoading) return <LoadingState label="Laddar lunch…" />

  const currentError = currentQuery.error
  if (currentError && !currentQuery.data) {
    return <ErrorState message={currentError} onRetry={reloadAll} />
  }

  async function runSync() {
    setSyncConfirmOpen(false)
    if (!canSync) {
      setSyncFeedback({
        kind: 'error',
        headline: 'Saknar behörighet',
        detail: 'Server kräver lunch.change_lunchweek.',
      })
      return
    }
    setSyncing(true)
    setSyncFeedback(null)
    try {
      const res = await adminFetch('/lunch/sync/', { method: 'POST' })
      const result = res?.result || {}
      const classified = classifySyncResult(result)
      setSyncFeedback(classified)
      reloadAll()
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      if (status === 403) {
        setSyncFeedback({
          kind: 'error',
          headline: '403 Forbidden',
          detail: 'Saknar behörighet att synka.',
        })
      } else if (status === 401) {
        setSyncFeedback({
          kind: 'error',
          headline: 'Session utgången',
          detail: 'Logga in igen.',
        })
      } else {
        setSyncFeedback({
          kind: 'error',
          headline: 'Synk misslyckades',
          detail: err instanceof AdminApiError ? err.message : 'Nätverks- eller serverfel.',
        })
      }
    } finally {
      setSyncing(false)
    }
  }

  function openEdit() {
    if (!displayWeek?.id) return
    setEditForm({
      intro_text: displayWeek.intro_text || '',
      notes: displayWeek.notes || '',
      lunch_hours_text: displayWeek.lunch_hours_text || '',
      is_published: Boolean(displayWeek.is_published),
      skip_auto_sync: Boolean(displayWeek.skip_auto_sync || displayWeek.manual_override),
    })
    setSaveError(null)
    setEditOpen(true)
  }

  async function saveWeek(e) {
    e.preventDefault()
    if (!displayWeek?.id || !editForm) return
    setSaving(true)
    setSaveError(null)
    try {
      // Manual content edits must establish override so scheduler cannot overwrite.
      const payload = {
        intro_text: editForm.intro_text,
        notes: editForm.notes,
        lunch_hours_text: editForm.lunch_hours_text,
        is_published: editForm.is_published,
        skip_auto_sync: Boolean(editForm.skip_auto_sync),
      }
      await adminFetch(`/lunch/weeks/${displayWeek.id}/`, {
        method: 'PATCH',
        json: payload,
      })
      setEditOpen(false)
      setFlash(
        payload.skip_auto_sync
          ? 'Vecka sparad med MANUAL OVERRIDE (skip_auto_sync).'
          : 'Vecka sparad. AUTO-synk tillåten igen.',
      )
      reloadAll()
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      if (status === 403) setSaveError('403 — saknar behörighet att ändra lunchvecka.')
      else if (status === 401) setSaveError('Session utgången. Logga in igen.')
      else setSaveError(err instanceof AdminApiError ? err.message : 'Kunde inte spara.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleOverride(next) {
    if (!displayWeek?.id || !canChange) return
    try {
      await adminFetch(`/lunch/weeks/${displayWeek.id}/`, {
        method: 'PATCH',
        json: { skip_auto_sync: next },
      })
      setFlash(
        next
          ? 'MANUAL OVERRIDE aktiverad — automatisk synk skriver inte över denna vecka.'
          : 'AUTO återställd — nästa synk får uppdatera veckan.',
      )
      reloadAll()
    } catch (err) {
      setFlash(
        err instanceof AdminApiError
          ? `Kunde inte ändra override: ${err.message}`
          : 'Kunde inte ändra override.',
      )
    }
  }

  const emptyCurrent = Boolean(current?.empty)

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="Lunch"
        subtitle="Mat och Mat-ingestion via Django. Europe/Stockholm. AUTO vs MANUAL OVERRIDE syns alltid."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary()} onClick={reloadAll}>
              Uppdatera
            </button>
            {canChange && displayWeek?.id ? (
              <button type="button" className={btnSecondary()} onClick={openEdit}>
                Redigera vecka
              </button>
            ) : null}
            {canSync ? (
              <button
                type="button"
                className={btnPrimary()}
                disabled={syncing}
                onClick={() => setSyncConfirmOpen(true)}
              >
                {syncing ? 'Synkar…' : 'SYNC NOW'}
              </button>
            ) : null}
          </div>
        }
      />

      {flash ? (
        <p
          className="mb-4 rounded border border-gold/30 bg-gold-dim px-3 py-2 text-sm text-gold"
          role="status"
          aria-live="polite"
        >
          {flash}
          <button
            type="button"
            className="ml-3 min-h-11 text-xs underline"
            onClick={() => setFlash(null)}
          >
            Stäng
          </button>
        </p>
      ) : null}

      {syncFeedback ? (
        <p
          className={`mb-4 rounded border px-3 py-2 text-sm ${
            syncFeedback.kind === 'error'
              ? 'border-red-500/40 bg-red-950/30 text-red-200'
              : syncFeedback.kind === 'warning'
                ? 'border-amber-500/40 bg-amber-950/30 text-amber-100'
                : syncFeedback.kind === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                  : 'border-white/15 bg-dark-2 text-white/80'
          }`}
          role={syncFeedback.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <strong className="block">{syncFeedback.headline}</strong>
          {syncFeedback.detail ? (
            <span className="mt-1 block text-xs opacity-90">{syncFeedback.detail}</span>
          ) : null}
        </p>
      ) : null}

      {/* A. Current Lunch */}
      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg text-white">Aktuell lunch</h2>
          {displayWeek && !emptyCurrent ? <OverrideBadge active={override} /> : null}
        </div>

        {emptyCurrent && !selectedWeekId ? (
          <EmptyState
            title="Ingen lunchvecka för aktuell ISO-vecka"
            message={`Vecka ${current?.week_number}/${current?.year} — kör SYNC NOW eller vänta på schemalagd import.`}
          />
        ) : !displayWeek ? (
          <EmptyState title="Ingen vecka vald" message="Välj en vecka nedan." />
        ) : (
          <>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <MetaRow label="Vecka">
                {displayWeek.week_number}/{displayWeek.year}
              </MetaRow>
              <MetaRow label="Veckostart">{displayWeek.week_start || '—'}</MetaRow>
              <MetaRow label="Publicerad">{yesNo(displayWeek.is_published)}</MetaRow>
              <MetaRow label="Lunchtider">
                {displayWeek.lunch_hours_text || '—'}
              </MetaRow>
              <MetaRow label="Källa">{displayWeek.source_type || '—'}</MetaRow>
              <MetaRow label="Senaste importstatus">
                <span className={statusToneClass(displayWeek.last_import_status)}>
                  {displayWeek.last_import_status || '—'}
                </span>
              </MetaRow>
            </dl>

            {override ? (
              <p className="mt-4 rounded border border-amber-400/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-100">
                MANUAL OVERRIDE (`skip_auto_sync`). Automatisk Mat och Mat-synk skriver
                <strong> inte</strong> över denna vecka.
              </p>
            ) : (
              <p className="mt-4 text-sm text-white/50">
                AUTO — schemalagd/manuell synk får uppdatera denna vecka.
              </p>
            )}

            {canChange && displayWeek.id ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {override ? (
                  <button
                    type="button"
                    className={`${btnSecondary()} min-h-11`}
                    onClick={() => toggleOverride(false)}
                  >
                    Återställ AUTO
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${btnSecondary()} min-h-11`}
                    onClick={() => toggleOverride(true)}
                  >
                    Aktivera MANUAL OVERRIDE
                  </button>
                )}
              </div>
            ) : null}

            <h3 className="mt-6 font-heading text-base text-white">Rätter per dag</h3>
            {dishes.length === 0 ? (
              <EmptyState title="Inga rätter" message="Denna vecka har inga rätter i databasen." />
            ) : (
              <div className="mt-3 space-y-4">
                {[...byDay.entries()].map(([key, dayDishes]) => (
                  <div key={String(key)} className="rounded border border-white/10 p-3">
                    <p className="text-xs uppercase tracking-wider text-gold">
                      {key === 'all' ? 'Hela veckan' : weekdayLabel(key)}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {dayDishes.map((d) => (
                        <li key={d.id} className="text-sm">
                          <p className="text-white">{d.name}</p>
                          {d.description ? (
                            <p className="text-xs text-white/50">{d.description}</p>
                          ) : null}
                          <p className="text-xs text-gold/80">
                            {formatPrice(d.price) || '—'}
                            {d.is_available === false ? ' · dold' : ''}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {!LUNCH_DISH_WRITE_API ? (
              <p className="mt-4 text-xs text-white/40">
                Rätter kan inte skapas/redigeras via Admin-API (ingen dish ViewSet). Använd
                Django Admin för dish-CRUD, och aktivera MANUAL OVERRIDE först.
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* B. Week View */}
      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <h2 className="font-heading text-lg text-white">Veckoöversikt</h2>
        {weeksQuery.loading && weeks.length === 0 ? (
          <p className="mt-3 text-sm text-white/45">Laddar veckor…</p>
        ) : weeksQuery.error ? (
          <ErrorState message={weeksQuery.error} onRetry={weeksQuery.reload} />
        ) : weeks.length === 0 ? (
          <EmptyState title="Inga lunchveckor" message="Inga veckor finns i databasen ännu." />
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {weeks.map((w) => {
              const active =
                (selectedWeekId != null && w.id === selectedWeekId) ||
                (selectedWeekId == null && current?.id === w.id)
              const ov = isManualOverride(w)
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    className={`min-h-11 w-full rounded border px-3 py-3 text-left text-sm ${
                      active
                        ? 'border-gold bg-gold-dim text-gold'
                        : 'border-white/10 bg-dark text-white/80 hover:border-gold/40'
                    }`}
                    onClick={() => setSelectedWeekId(w.id)}
                  >
                    <span className="block font-medium">
                      v{w.week_number}/{w.year}
                    </span>
                    <span className="mt-1 block text-xs opacity-70">
                      {w.week_start} · {(w.dishes || []).length} rätter ·{' '}
                      {w.source_type || '—'}
                    </span>
                    <span className="mt-1 block text-xs">
                      {ov ? 'MANUAL OVERRIDE' : 'AUTO'} ·{' '}
                      {w.is_published ? 'publicerad' : 'opublicerad'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {selectedWeekId != null ? (
          <button
            type="button"
            className={`${btnSecondary()} mt-3 min-h-11`}
            onClick={() => setSelectedWeekId(null)}
          >
            Visa aktuell vecka
          </button>
        ) : null}
      </section>

      {/* C. Mat och Mat Source */}
      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <h2 className="font-heading text-lg text-white">Mat och Mat — källa</h2>
        {!displayWeek || emptyCurrent && !selectedWeekId ? (
          <p className="mt-3 text-sm text-white/50">Ingen veckadata att visa metadata för.</p>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetaRow label="source_type">{displayWeek.source_type || '—'}</MetaRow>
            <MetaRow label="source_url">
              {displayWeek.source_url ? (
                <a
                  className="text-gold underline-offset-2 hover:underline"
                  href={displayWeek.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {displayWeek.source_url}
                </a>
              ) : (
                '—'
              )}
            </MetaRow>
            <MetaRow label="source_hash">
              <span className="font-mono text-xs">{displayWeek.source_hash || '—'}</span>
            </MetaRow>
            <MetaRow label="parser_version">{displayWeek.parser_version || '—'}</MetaRow>
            <MetaRow label="fetched_at">{formatDateTime(displayWeek.fetched_at)}</MetaRow>
            <MetaRow label="published_at">{formatDateTime(displayWeek.published_at)}</MetaRow>
            <MetaRow label="last_import_status">
              <span className={statusToneClass(displayWeek.last_import_status)}>
                {displayWeek.last_import_status || '—'}
              </span>
            </MetaRow>
            <MetaRow label="lunch_hours_text">
              {displayWeek.lunch_hours_text || '—'}
            </MetaRow>
          </dl>
        )}
        <p className="mt-3 text-xs text-white/40">
          Hash beräknas i Django (`content_hash_for_week`). Admin visar endast resultatet.
        </p>
      </section>

      {/* D. Import History */}
      <section className="mb-8">
        <h2 className="mb-3 font-heading text-xl text-white">Importhistorik</h2>
        {runsQuery.loading && runs.length === 0 ? (
          <LoadingState label="Laddar historik…" />
        ) : runsQuery.error ? (
          <ErrorState message={runsQuery.error} onRetry={runsQuery.reload} />
        ) : runs.length === 0 ? (
          <EmptyState title="Inga importkörningar" message="Inga LunchImportRun-rader ännu." />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-white/45">
                  <tr>
                    <th className="px-2 py-2">Tid</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Vecka</th>
                    <th className="px-2 py-2">Hash</th>
                    <th className="px-2 py-2">Parser</th>
                    <th className="px-2 py-2">Meddelande</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 align-top">
                      <td className="px-2 py-2 text-white/70">{formatDateTime(r.started_at)}</td>
                      <td className={`px-2 py-2 font-medium ${statusToneClass(r.status)}`}>
                        {r.status}
                        {isImportFailureStatus(r.status) ? ' ✕' : ''}
                      </td>
                      <td className="px-2 py-2">
                        {r.week_number != null ? `v${r.week_number}/${r.year}` : '—'}
                        {r.item_count != null ? ` · ${r.item_count}` : ''}
                      </td>
                      <td className="max-w-[8rem] truncate px-2 py-2 font-mono text-xs text-white/50">
                        {r.source_hash || '—'}
                      </td>
                      <td className="px-2 py-2">{r.parser_version || '—'}</td>
                      <td className="px-2 py-2 text-xs text-white/55">{r.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="space-y-2 lg:hidden">
              {runs.map((r) => (
                <li
                  key={r.id}
                  className="rounded border border-white/10 bg-dark-2 p-3 text-sm"
                >
                  <p className={`font-medium ${statusToneClass(r.status)}`}>{r.status}</p>
                  <p className="text-xs text-white/50">{formatDateTime(r.started_at)}</p>
                  <p className="mt-1 text-white/70">
                    {r.week_number != null ? `v${r.week_number}/${r.year}` : '—'} ·{' '}
                    {r.item_count ?? 0} rätter
                  </p>
                  {r.message ? (
                    <p className="mt-1 text-xs text-white/45" role={isImportFailureStatus(r.status) ? 'alert' : undefined}>
                      {r.message}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Sync confirm */}
      {syncConfirmOpen ? (
        <OpsDialog
          titleId="admin-lunch-sync-title"
          title="SYNC NOW — Mat och Mat"
          onClose={() => setSyncConfirmOpen(false)}
        >
          <p className="mt-3 text-sm text-white/70">
            Anropar Django <code className="text-gold">sync_from_matochmat</code> via{' '}
            <code className="text-gold">POST /api/admin/lunch/sync/</code>. Hämtning och
            parsing sker <strong>inte</strong> i webbläsaren.
          </p>
          {override ? (
            <p className="mt-3 rounded border border-amber-400/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
              Aktuell vald vecka har MANUAL OVERRIDE — synken hoppar över den veckan
              (status SKIPPED_OVERRIDE).
            </p>
          ) : (
            <p className="mt-3 text-sm text-white/55">
              Utan override kan aktuell veckas rätter uppdateras om källan ändrats.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary()} onClick={runSync} disabled={syncing}>
              Bekräfta synk
            </button>
            <button
              type="button"
              className={btnSecondary()}
              onClick={() => setSyncConfirmOpen(false)}
            >
              Avbryt
            </button>
          </div>
        </OpsDialog>
      ) : null}

      {/* E. Manual edit week meta */}
      {editOpen && editForm ? (
        <OpsDialog
          titleId="admin-lunch-edit-title"
          title="Redigera lunchvecka"
          onClose={() => setEditOpen(false)}
        >
          <form className="mt-4 space-y-3" onSubmit={saveWeek}>
            <p className="text-sm text-amber-100/90">
              Sparande av innehåll bör behålla MANUAL OVERRIDE så schemaläggaren inte
              skriver över ändringar.
            </p>
            <div>
              <label htmlFor="lunch-hours" className={labelClass()}>
                Lunchtider
              </label>
              <input
                id="lunch-hours"
                className={inputClass()}
                value={editForm.lunch_hours_text}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, lunch_hours_text: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="lunch-intro" className={labelClass()}>
                Intro
              </label>
              <textarea
                id="lunch-intro"
                className={`${inputClass()} min-h-24 py-2`}
                value={editForm.intro_text}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, intro_text: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="lunch-notes" className={labelClass()}>
                Anteckningar
              </label>
              <textarea
                id="lunch-notes"
                className={`${inputClass()} min-h-24 py-2`}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={editForm.is_published}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, is_published: e.target.checked }))
                }
              />
              Publicerad (`is_published`)
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm text-amber-100">
              <input
                type="checkbox"
                checked={editForm.skip_auto_sync}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, skip_auto_sync: e.target.checked }))
                }
              />
              MANUAL OVERRIDE (`skip_auto_sync`)
            </label>
            {saveError ? (
              <p className="text-sm text-red-300" role="alert">
                {saveError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className={btnPrimary()} disabled={saving}>
                {saving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={btnSecondary()}
                onClick={() => setEditOpen(false)}
              >
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}
    </div>
  )
}
