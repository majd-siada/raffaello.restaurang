import { useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import {
  formatAdminApiError,
  publishLabel,
  REVIEW_DELETE_SUPPORTED,
  REVIEW_SOURCE_CHOICES,
} from './galleryHelpers'
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formatDateTime,
  inputClass,
  labelClass,
} from './format'
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  OpsDialog,
  PageHeader,
} from './ui'

const emptyCreate = {
  quote: '',
  author_name: '',
  source: '',
  rating: '',
  is_published: false,
  order: '0',
}

export default function ReviewsPage() {
  const { permissions } = useAdminAuth()
  const [form, setForm] = useState(emptyCreate)
  const [creating, setCreating] = useState(false)
  const [flash, setFlash] = useState(null)
  const [flashError, setFlashError] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(emptyCreate)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const query = useAdminQuery(
    () => adminList('/reviews/', { page_size: 100 }),
    [],
    { enabled: Boolean(permissions.reviews) },
  )

  if (!permissions.reviews) return <ForbiddenState />
  if (query.errorStatus === 403) return <ForbiddenState />

  const items = query.data?.results || []

  function setMsg(text, isError = false) {
    setFlash(text)
    setFlashError(isError)
  }

  function openEdit(review) {
    setEditTarget(review)
    setEditForm({
      quote: review.quote || '',
      author_name: review.author_name || '',
      source: review.source || '',
      rating: review.rating != null ? String(review.rating) : '',
      is_published: Boolean(review.is_published),
      order: String(review.order ?? 0),
    })
    setEditError(null)
  }

  async function togglePublish(review) {
    setBusyId(review.id)
    setMsg(null)
    try {
      await adminFetch(`/reviews/${review.id}/`, {
        method: 'PATCH',
        json: { is_published: !review.is_published },
      })
      setMsg(
        !review.is_published
          ? 'PUBLICERAD.'
          : 'EJ PUBLICERAD — dold från /api/reviews/.',
      )
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setMsg(null)
    try {
      if (!form.source.trim()) {
        setMsg('Källa krävs (verklig källa — hitta inte på).', true)
        return
      }
      const orderNum = Number.parseInt(form.order, 10)
      await adminFetch('/reviews/', {
        method: 'POST',
        json: {
          quote: form.quote.trim(),
          author_name: form.author_name.trim(),
          source: form.source.trim(),
          rating: form.rating === '' ? null : Number(form.rating),
          is_published: form.is_published,
          order: Number.isFinite(orderNum) ? orderNum : items.length,
        },
      })
      setForm(emptyCreate)
      setMsg('Recension skapad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setCreating(false)
    }
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editTarget) return
    setEditSaving(true)
    setEditError(null)
    try {
      if (!editForm.source.trim()) {
        setEditError('Källa krävs (verklig källa — hitta inte på).')
        return
      }
      const orderNum = Number.parseInt(editForm.order, 10)
      await adminFetch(`/reviews/${editTarget.id}/`, {
        method: 'PATCH',
        json: {
          quote: editForm.quote.trim(),
          author_name: editForm.author_name.trim(),
          source: editForm.source.trim(),
          rating: editForm.rating === '' ? null : Number(editForm.rating),
          is_published: editForm.is_published,
          order: Number.isFinite(orderNum) ? orderNum : 0,
        },
      })
      setEditTarget(null)
      setMsg('Recension uppdaterad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setEditError(message)
    } finally {
      setEditSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !REVIEW_DELETE_SUPPORTED) return
    setDeleting(true)
    try {
      await adminFetch(`/reviews/${deleteTarget.id}/`, { method: 'DELETE' })
      setDeleteTarget(null)
      setMsg('Recension raderad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(`Radering misslyckades: ${message}`, true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="Recensioner"
        subtitle="Kuraterade citat endast. Ingen påhittad text eller betyg."
        actions={
          <button
            type="button"
            className={`${btnSecondary()} min-h-11`}
            onClick={query.reload}
          >
            Uppdatera
          </button>
        }
      />

      <form
        className="mb-6 space-y-3 rounded border border-white/10 bg-dark-2 p-4"
        onSubmit={handleCreate}
      >
        <h2 className="font-heading text-lg text-white">Ny recension</h2>
        <p className="text-xs text-white/45">
          Källa är fritext (ingen enum)
          {REVIEW_SOURCE_CHOICES ? '' : ' — ange verklig källa, t.ex. Google eller gästbok'}.
        </p>
        <div>
          <label className={labelClass()} htmlFor="admin-rev-quote">
            Citat
          </label>
          <textarea
            id="admin-rev-quote"
            className={`${inputClass()} min-h-24 py-2`}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass()} htmlFor="admin-rev-author">
              Författare
            </label>
            <input
              id="admin-rev-author"
              className={`${inputClass()} min-h-11`}
              value={form.author_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, author_name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="admin-rev-source">
              Källa
            </label>
            <input
              id="admin-rev-source"
              className={`${inputClass()} min-h-11`}
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              required
              placeholder="t.ex. Google"
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="admin-rev-rating">
              Betyg (1–5, valfritt)
            </label>
            <input
              id="admin-rev-rating"
              type="number"
              min="1"
              max="5"
              step="1"
              className={`${inputClass()} min-h-11`}
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="admin-rev-order">
              Ordning
            </label>
            <input
              id="admin-rev-order"
              type="number"
              min="0"
              className={`${inputClass()} min-h-11`}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            />
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_published: e.target.checked }))
            }
          />
          Publicera direkt (annars EJ PUBLICERAD)
        </label>
        <button type="submit" className={`${btnPrimary()} min-h-11`} disabled={creating}>
          {creating ? 'Skapar…' : 'Skapa'}
        </button>
      </form>

      {flash ? (
        <p
          className={`mb-4 text-sm ${flashError ? 'text-red-300' : 'text-white/70'}`}
          role={flashError ? 'alert' : 'status'}
          aria-live={flashError ? 'assertive' : 'polite'}
        >
          {flash}
        </p>
      ) : null}

      {query.loading ? <LoadingState /> : null}
      {query.error && query.errorStatus !== 403 ? (
        <ErrorState message={query.error} onRetry={query.reload} />
      ) : null}
      {!query.loading && !query.error && items.length === 0 ? (
        <EmptyState title="Inga recensioner" />
      ) : null}

      {!query.loading && !query.error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded border border-white/10 bg-dark-2 p-4"
            >
              <p className="break-words text-white/90">&ldquo;{r.quote}&rdquo;</p>
              <p className="mt-2 break-words text-sm text-white/55">
                {r.author_name}
                {r.source ? ` · ${r.source}` : ''}
                {r.rating != null ? ` · ${r.rating}/5` : ''} ·{' '}
                {publishLabel(r.is_published)} · ordning {r.order}
              </p>
              <p className="mt-1 text-xs text-white/40">
                Skapad {formatDateTime(r.created_at)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnSecondary()} min-h-11`}
                  disabled={busyId === r.id}
                  onClick={() => openEdit(r)}
                >
                  Redigera
                </button>
                <button
                  type="button"
                  className={`${btnPrimary()} min-h-11`}
                  disabled={busyId === r.id}
                  onClick={() => togglePublish(r)}
                >
                  {r.is_published ? 'Avpublicera' : 'Publicera'}
                </button>
                {REVIEW_DELETE_SUPPORTED ? (
                  <button
                    type="button"
                    className={`${btnDanger()} min-h-11`}
                    disabled={busyId === r.id}
                    onClick={() => setDeleteTarget(r)}
                  >
                    Radera
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editTarget ? (
        <OpsDialog
          titleId="review-edit-title"
          title="Redigera recension"
          onClose={() => (!editSaving ? setEditTarget(null) : null)}
        >
          <form className="mt-3 space-y-3" onSubmit={saveEdit}>
            <div>
              <label className={labelClass()} htmlFor="edit-rev-quote">
                Citat
              </label>
              <textarea
                id="edit-rev-quote"
                className={`${inputClass()} min-h-24 py-2`}
                value={editForm.quote}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, quote: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-rev-author">
                Författare
              </label>
              <input
                id="edit-rev-author"
                className={`${inputClass()} min-h-11`}
                value={editForm.author_name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, author_name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-rev-source">
                Källa
              </label>
              <input
                id="edit-rev-source"
                className={`${inputClass()} min-h-11`}
                value={editForm.source}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, source: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass()} htmlFor="edit-rev-rating">
                  Betyg
                </label>
                <input
                  id="edit-rev-rating"
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  className={`${inputClass()} min-h-11`}
                  value={editForm.rating}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, rating: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass()} htmlFor="edit-rev-order">
                  Ordning
                </label>
                <input
                  id="edit-rev-order"
                  type="number"
                  min="0"
                  className={`${inputClass()} min-h-11`}
                  value={editForm.order}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, order: e.target.value }))
                  }
                />
              </div>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={editForm.is_published}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    is_published: e.target.checked,
                  }))
                }
              />
              Publicerad
            </label>
            {editError ? (
              <p className="text-sm text-red-300" role="alert">
                {editError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className={`${btnPrimary()} min-h-11`}
                disabled={editSaving}
              >
                {editSaving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={`${btnSecondary()} min-h-11`}
                disabled={editSaving}
                onClick={() => setEditTarget(null)}
              >
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}

      {deleteTarget ? (
        <OpsDialog
          titleId="review-delete-title"
          title="Radera recension?"
          onClose={() => (!deleting ? setDeleteTarget(null) : null)}
        >
          <p className="mt-2 break-words text-sm text-white/70">
            Radera #{deleteTarget.id} från {deleteTarget.author_name}?
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${btnDanger()} min-h-11`}
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? 'Raderar…' : 'Radera'}
            </button>
            <button
              type="button"
              className={`${btnSecondary()} min-h-11`}
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Avbryt
            </button>
          </div>
        </OpsDialog>
      ) : null}
    </div>
  )
}
