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
  OpsDialog,
  PageHeader,
} from './ui'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  is_available: true,
  is_featured: false,
  allergens: '',
  tags: '',
}


export default function MenuPage() {
  const { permissions } = useAuth()
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/menu/items/', { q, page_size: 100 }),
    [q],
    { enabled: Boolean(permissions.menu) },
  )

  if (!permissions.menu) return <ForbiddenState />

  const items = data?.results || []

  function openEdit(item) {
    setEditing(item)
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      is_available: Boolean(item.is_available),
      is_featured: Boolean(item.is_featured),
      allergens: item.allergens || '',
      tags: item.tags || '',
    })
    setSaveError(null)
  }

  function closeEdit() {
    setEditing(null)
    setForm(emptyForm)
    setSaveError(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setSaveError(null)
    try {
      await opsFetch(`/menu/items/${editing.id}/`, {
        method: 'PATCH',
        json: {
          name: form.name.trim(),
          description: form.description,
          price: form.price === '' ? editing.price : form.price,
          is_available: form.is_available,
          is_featured: form.is_featured,
          allergens: form.allergens,
          tags: form.tags,
        },
      })
      closeEdit()
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
        title="Meny"
        subtitle="Sök och redigera rätter"
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <div className="mb-4">
        <label htmlFor="menu-search" className={labelClass()}>
          Sök
        </label>
        <input
          id="menu-search"
          className={inputClass()}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Namn eller beskrivning…"
        />
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inga rätter" message="Ingen träff på sökningen." />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto rounded border border-white/10 md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-dark-2 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-3">Namn</th>
                  <th className="px-3 py-3">Pris</th>
                  <th className="px-3 py-3">Tillgänglig</th>
                  <th className="px-3 py-3">Utvald</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03]">
                    <td className="px-3 py-3 text-white">{item.name}</td>
                    <td className="px-3 py-3">{formatPrice(item.price) || '—'}</td>
                    <td className="px-3 py-3">{yesNo(item.is_available)}</td>
                    <td className="px-3 py-3">{yesNo(item.is_featured)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        className={btnSecondary()}
                        onClick={() => openEdit(item)}
                      >
                        Redigera
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded border border-white/10 bg-dark-2 p-4"
              >
                <p className="font-heading text-lg text-white">{item.name}</p>
                <p className="mt-1 text-sm text-white/60">
                  {formatPrice(item.price) || '—'} · Tillgänglig: {yesNo(item.is_available)} ·
                  Utvald: {yesNo(item.is_featured)}
                </p>
                <button
                  type="button"
                  className={`${btnSecondary()} mt-3`}
                  onClick={() => openEdit(item)}
                >
                  Redigera
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {editing ? (
        <OpsDialog
          titleId="menu-edit-title"
          title="Redigera rätt"
          onClose={closeEdit}
        >
          <form className="mt-4 space-y-3" onSubmit={saveEdit}>
            <div>
              <label className={labelClass()} htmlFor="edit-name">
                Namn
              </label>
              <input
                id="edit-name"
                className={inputClass()}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-description">
                Beskrivning
              </label>
              <textarea
                id="edit-description"
                className={`${inputClass()} min-h-24 py-2`}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-price">
                Pris
              </label>
              <input
                id="edit-price"
                className={inputClass()}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-allergens">
                Allergener
              </label>
              <input
                id="edit-allergens"
                className={inputClass()}
                value={form.allergens}
                onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-tags">
                Taggar
              </label>
              <input
                id="edit-tags"
                className={inputClass()}
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_available: e.target.checked }))
                }
              />
              Tillgänglig
            </label>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_featured: e.target.checked }))
                }
              />
              Utvald
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
              <button type="button" className={btnSecondary()} onClick={closeEdit}>
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}
    </div>
  )
}
