import { useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import { formatAdminApiError, publishLabel } from './trustHelpers'
import {
  btnDanger,
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
  OpsDialog,
  PageHeader,
} from './ui'

const emptyForm = {
  question: '',
  answer: '',
  order: '0',
  is_published: false,
}

export default function FaqAdminPage() {
  const { permissions } = useAdminAuth()
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [flash, setFlash] = useState(null)
  const [flashError, setFlashError] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const query = useAdminQuery(
    () => adminList('/faq/', { page_size: 100 }),
    [],
    { enabled: Boolean(permissions.faq) },
  )

  if (!permissions.faq) return <ForbiddenState />
  if (query.errorStatus === 403) return <ForbiddenState />

  const items = query.data?.results || []

  function setMsg(text, isError = false) {
    setFlash(text)
    setFlashError(isError)
  }

  function openEdit(item) {
    setEditTarget(item)
    setEditForm({
      question: item.question || '',
      answer: item.answer || '',
      order: String(item.order ?? 0),
      is_published: Boolean(item.is_published),
    })
    setEditError(null)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setMsg(null)
    try {
      const orderNum = Number.parseInt(form.order, 10)
      await adminFetch('/faq/', {
        method: 'POST',
        json: {
          question: form.question.trim(),
          answer: form.answer.trim(),
          order: Number.isFinite(orderNum) ? orderNum : items.length,
          is_published: form.is_published,
        },
      })
      setForm(emptyForm)
      setMsg('FAQ skapad. Hitta inte på svar — endast restauranggodkänt innehåll.')
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
      const orderNum = Number.parseInt(editForm.order, 10)
      await adminFetch(`/faq/${editTarget.id}/`, {
        method: 'PATCH',
        json: {
          question: editForm.question.trim(),
          answer: editForm.answer.trim(),
          order: Number.isFinite(orderNum) ? orderNum : 0,
          is_published: editForm.is_published,
        },
      })
      setEditTarget(null)
      setMsg('FAQ uppdaterad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setEditError(message)
    } finally {
      setEditSaving(false)
    }
  }

  async function togglePublish(item) {
    setBusyId(item.id)
    setMsg(null)
    try {
      await adminFetch(`/faq/${item.id}/`, {
        method: 'PATCH',
        json: { is_published: !item.is_published },
      })
      setMsg(
        !item.is_published
          ? 'PUBLICERAD (synlig när TRUST_CONTENT_SOURCE=db).'
          : 'EJ PUBLICERAD.',
      )
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/faq/${deleteTarget.id}/`, { method: 'DELETE' })
      setDeleteTarget(null)
      setMsg('FAQ raderad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="FAQ"
        subtitle="Kuraterade frågor. Tom lista = CONTENT REQUIRED. Public SoT: TRUST_CONTENT_SOURCE."
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
        <h2 className="font-heading text-lg text-white">Ny fråga</h2>
        <p className="text-xs text-white/45">
          Inventera inte svar. Endast innehåll som restaurangen har godkänt.
        </p>
        <div>
          <label className={labelClass()} htmlFor="faq-q">
            Fråga
          </label>
          <input
            id="faq-q"
            className={`${inputClass()} min-h-11`}
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor="faq-a">
            Svar
          </label>
          <textarea
            id="faq-a"
            className={`${inputClass()} min-h-28 py-2`}
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass()} htmlFor="faq-ord">
              Ordning
            </label>
            <input
              id="faq-ord"
              type="number"
              min="0"
              className={`${inputClass()} min-h-11`}
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            />
          </div>
          <label className="flex min-h-11 items-end gap-2 pb-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_published: e.target.checked }))
              }
            />
            Publicera
          </label>
        </div>
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
        <EmptyState title="Inget FAQ-innehåll ännu" />
      ) : null}

      {!query.loading && !query.error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded border border-white/10 bg-dark-2 p-4"
            >
              <p className="font-heading text-lg text-white">{item.question}</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-white/65">
                {item.answer}
              </p>
              <p className="mt-2 text-xs text-white/40">
                {publishLabel(item.is_published)} · ordning {item.order}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnSecondary()} min-h-11`}
                  disabled={busyId === item.id}
                  onClick={() => openEdit(item)}
                >
                  Redigera
                </button>
                <button
                  type="button"
                  className={`${btnPrimary()} min-h-11`}
                  disabled={busyId === item.id}
                  onClick={() => togglePublish(item)}
                >
                  {item.is_published ? 'Avpublicera' : 'Publicera'}
                </button>
                <button
                  type="button"
                  className={`${btnDanger()} min-h-11`}
                  disabled={busyId === item.id}
                  onClick={() => setDeleteTarget(item)}
                >
                  Radera
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editTarget ? (
        <OpsDialog
          titleId="faq-edit-title"
          title="Redigera FAQ"
          onClose={() => (!editSaving ? setEditTarget(null) : null)}
        >
          <form className="mt-3 space-y-3" onSubmit={saveEdit}>
            <div>
              <label className={labelClass()} htmlFor="edit-faq-q">
                Fråga
              </label>
              <input
                id="edit-faq-q"
                className={`${inputClass()} min-h-11`}
                value={editForm.question}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, question: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-faq-a">
                Svar
              </label>
              <textarea
                id="edit-faq-a"
                className={`${inputClass()} min-h-28 py-2`}
                value={editForm.answer}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, answer: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="edit-faq-ord">
                Ordning
              </label>
              <input
                id="edit-faq-ord"
                type="number"
                min="0"
                className={`${inputClass()} min-h-11`}
                value={editForm.order}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, order: e.target.value }))
                }
              />
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
          titleId="faq-del-title"
          title="Radera FAQ?"
          onClose={() => (!deleting ? setDeleteTarget(null) : null)}
        >
          <p className="mt-2 break-words text-sm text-white/70">
            Radera: {deleteTarget.question}
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
