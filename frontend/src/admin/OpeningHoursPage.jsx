import { useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from './format'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  PageHeader,
} from './ui'

const emptyDay = (weekday, label) => ({
  weekday,
  label,
  opens: '10:00',
  closes: '22:00',
  is_closed: false,
})

export default function AdminOpeningHoursPage() {
  const { permissions } = useAdminAuth()
  const canHours = Boolean(permissions.opening_hours)

  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [flash, setFlash] = useState(null)

  const query = useAdminQuery(
    () => adminFetch('/restaurant/hours/'),
    [],
    { enabled: canHours },
  )

  if (!canHours) return <ForbiddenState />
  if (query.errorStatus === 403) return <ForbiddenState />
  if (query.loading && !query.data) return <LoadingState label="Laddar öppettider…" />
  if (query.error && !query.data) {
    return <ErrorState message={query.error} onRetry={query.reload} />
  }

  const meta = query.data || {}
  const days = draft ?? meta.days ?? []
  const drift = meta.drift
  const flag = meta.source_flag || meta.active_public_source

  function updateDay(weekday, patch) {
    setDraft((prev) => {
      const base = (prev ?? meta.days ?? []).map((d) => ({ ...d }))
      return base.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
    })
  }

  function reloadDraft() {
    setSaveError(null)
    setFlash(null)
    setDraft(null)
    query.reload()
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const payload = {
        days: days.map((d) => ({
          weekday: d.weekday,
          opens: d.is_closed ? '' : d.opens,
          closes: d.is_closed ? '' : d.closes,
          is_closed: Boolean(d.is_closed),
        })),
      }
      await adminFetch('/restaurant/hours/', {
        method: 'PUT',
        json: payload,
      })
      setDraft(null)
      query.reload()
      setFlash(
        flag === 'db'
          ? 'Sparat i databasen — aktiv public SoT är DB.'
          : 'Sparat i databasen. Public API använder fortfarande JSON tills OPENING_HOURS_SOURCE=db.',
      )
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      if (status === 403) setSaveError('403 — saknar behörighet.')
      else if (status === 401) setSaveError('Session utgången. Logga in igen.')
      else setSaveError(err instanceof AdminApiError ? err.message : 'Kunde inte spara.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Restaurang"
        title="Öppettider"
        subtitle="Europe/Stockholm. Admin skriver alltid till DB. Public SoT styrs av OPENING_HOURS_SOURCE."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary()} onClick={reloadDraft}>
              Ladda om
            </button>
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

      <section className="mb-6 rounded border border-white/10 bg-dark-2 p-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-white/45">Aktiv public-källa</dt>
            <dd className="font-mono text-gold">{flag}</dd>
          </div>
          <div>
            <dt className="text-white/45">Timezone</dt>
            <dd>{meta.timezone || 'Europe/Stockholm'}</dd>
          </div>
          <div>
            <dt className="text-white/45">JSON ↔ DB</dt>
            <dd
              className={
                drift?.status === 'MATCH' ? 'text-emerald-200' : 'text-amber-200'
              }
            >
              {drift?.status || '—'}
              {drift?.match === false && drift?.error
                ? ` (${drift.error})`
                : ''}
            </dd>
          </div>
          <div>
            <dt className="text-white/45">NAP</dt>
            <dd className="text-white/55">
              {meta.nap_note || 'siteConfig.js'}
            </dd>
          </div>
        </dl>
        {drift?.status === 'DRIFT' ? (
          <p className="mt-3 text-amber-100" role="alert">
            DRIFT upptäckt — public JSON och DB skiljer sig. Byt inte till db utan
            att jämföra värden.
          </p>
        ) : null}
      </section>

      {days.length === 0 ? (
        <EmptyState title="Inga dagar" message="Kör migration/seed från JSON." />
      ) : (
        <form onSubmit={save} className="space-y-3">
          <ul className="space-y-3">
            {days.map((d) => (
              <li
                key={d.weekday}
                className="rounded border border-white/10 bg-dark-2 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="min-w-[7rem] font-heading text-lg text-white">
                    {d.label || emptyDay(d.weekday).label}
                  </p>
                  <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={Boolean(d.is_closed)}
                      onChange={(e) =>
                        updateDay(d.weekday, { is_closed: e.target.checked })
                      }
                    />
                    Stängt
                  </label>
                  {d.is_closed ? (
                    <p className="text-sm text-white/45">Stängt</p>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <div>
                        <label
                          className={labelClass()}
                          htmlFor={`opens-${d.weekday}`}
                        >
                          Öppnar
                        </label>
                        <input
                          id={`opens-${d.weekday}`}
                          type="time"
                          className={inputClass()}
                          value={d.opens || ''}
                          onChange={(e) =>
                            updateDay(d.weekday, { opens: e.target.value })
                          }
                          required={!d.is_closed}
                        />
                      </div>
                      <span className="pb-3 text-white/40">—</span>
                      <div>
                        <label
                          className={labelClass()}
                          htmlFor={`closes-${d.weekday}`}
                        >
                          Stänger
                        </label>
                        <input
                          id={`closes-${d.weekday}`}
                          type="time"
                          className={inputClass()}
                          value={d.closes || ''}
                          onChange={(e) =>
                            updateDay(d.weekday, { closes: e.target.value })
                          }
                          required={!d.is_closed}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

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
              onClick={reloadDraft}
              disabled={saving}
            >
              Avbryt / ladda om
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
