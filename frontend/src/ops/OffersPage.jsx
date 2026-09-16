import { useState } from 'react'
import { useAuth } from './AuthContext'
import { opsFetch, opsList, OpsApiError } from './api'
import { useOpsQuery } from './useOpsQuery'
import { formatPrice } from '../formatPrice'
import {
  btnPrimary,
  btnSecondary,
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

export default function OffersPage() {
  const { permissions } = useAuth()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ intro_text: '', is_published: false })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/offers/', { page_size: 50 }),
    [],
    { enabled: Boolean(permissions.offers) },
  )

  if (!permissions.offers) return <ForbiddenState />
  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const offers = data?.results || []

  function openEdit(offer) {
    setEditing(offer)
    setForm({
      intro_text: offer.intro_text || '',
      is_published: Boolean(offer.is_published),
    })
    setSaveError(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setSaveError(null)
    try {
      await opsFetch(`/offers/${editing.id}/`, {
        method: 'PATCH',
        json: {
          intro_text: form.intro_text,
          is_published: form.is_published,
        },
      })
      setEditing(null)
      reload()
    } catch (err) {
      setSaveError(err instanceof OpsApiError ? err.message : 'Kunde inte spara.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Veckans Erbjudande"
        subtitle="Aktuella och tidigare veckor"
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      {offers.length === 0 ? (
        <EmptyState title="Inga erbjudanden" />
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li
              key={offer.id}
              className="rounded border border-white/10 bg-dark-2 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg text-white">
                    Vecka {offer.week_number}/{offer.year}
                  </h2>
                  <p className="mt-1 text-sm text-white/55">
                    Publicerad: {yesNo(offer.is_published)} · Start:{' '}
                    {offer.week_start || '—'}
                  </p>
                  <p className="mt-2 text-sm text-white/80">
                    {offer.intro_text || 'Ingen introtext.'}
                  </p>
                  {(offer.dishes || []).length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm">
                      {offer.dishes.map((d) => (
                        <li key={d.id}>
                          {d.name}
                          {formatPrice(d.price) ? ` — ${formatPrice(d.price)}` : ''}
                          {!d.is_available ? ' (ej tillgänglig)' : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-white/45">Inga rätter kopplade.</p>
                  )}
                </div>
                <button
                  type="button"
                  className={btnSecondary()}
                  onClick={() => openEdit(offer)}
                >
                  Redigera
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <form
            className="w-full max-w-lg rounded border border-white/15 bg-dark-2 p-5"
            onSubmit={saveEdit}
          >
            <h2 className="font-heading text-xl text-gold">
              Redigera v{editing.week_number}/{editing.year}
            </h2>
            <div className="mt-4">
              <label className={labelClass()} htmlFor="offer-intro">
                Introtext
              </label>
              <textarea
                id="offer-intro"
                className={`${inputClass()} min-h-28 py-2`}
                value={form.intro_text}
                onChange={(e) => setForm((f) => ({ ...f, intro_text: e.target.value }))}
              />
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_published: e.target.checked }))
                }
              />
              Publicerad
            </label>
            {saveError ? (
              <p className="mt-3 text-sm text-red-300" role="alert">
                {saveError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="submit" className={btnPrimary()} disabled={saving}>
                {saving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={btnSecondary()}
                onClick={() => setEditing(null)}
              >
                Avbryt
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
