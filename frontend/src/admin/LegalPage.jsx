import { useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import { formatAdminApiError, publishLabel } from './trustHelpers'
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
  OpsDialog,
  PageHeader,
} from './ui'

/**
 * Legal Admin — edit existing route keys only (bokningsvillkor, integritet).
 * Do not invent policy text.
 */
export default function LegalAdminPage() {
  const { permissions } = useAdminAuth()
  const [flash, setFlash] = useState(null)
  const [flashError, setFlashError] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)

  const query = useAdminQuery(
    () => adminList('/legal/', { page_size: 20 }),
    [],
    { enabled: Boolean(permissions.legal) },
  )

  if (!permissions.legal) return <ForbiddenState />
  if (query.errorStatus === 403) return <ForbiddenState />

  const items = query.data?.results || []

  function setMsg(text, isError = false) {
    setFlash(text)
    setFlashError(isError)
  }

  function openEdit(page) {
    setEditTarget(page)
    setEditForm({
      title: page.title || '',
      description: page.description || '',
      body: page.body || '',
      is_published: Boolean(page.is_published),
    })
    setEditError(null)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editTarget || !editForm) return
    setEditSaving(true)
    setEditError(null)
    try {
      await adminFetch(`/legal/${editTarget.key}/`, {
        method: 'PATCH',
        json: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          body: editForm.body,
          is_published: editForm.is_published,
        },
      })
      setEditTarget(null)
      setMsg('Juridisk sida sparad. Inventera inte policytext.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setEditError(message)
    } finally {
      setEditSaving(false)
    }
  }

  async function togglePublish(page) {
    setBusyKey(page.key)
    setMsg(null)
    try {
      await adminFetch(`/legal/${page.key}/`, {
        method: 'PATCH',
        json: { is_published: !page.is_published },
      })
      setMsg(
        !page.is_published
          ? 'PUBLICERAD (synlig när TRUST_CONTENT_SOURCE=db).'
          : 'EJ PUBLICERAD.',
      )
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="Legal"
        subtitle="Bokningsvillkor & Integritet — restauranggodkänt innehåll endast. Plain text."
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

      <p className="mb-4 text-sm text-white/50">
        Publicering kräver innehåll (tom sida blockeras av servern). Public API
        styrs av <code className="text-white/70">TRUST_CONTENT_SOURCE</code>.
      </p>

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
        <EmptyState title="Inga juridiska sidor (kör migration)" />
      ) : null}

      {!query.loading && !query.error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((page) => (
            <li
              key={page.key}
              className="rounded border border-white/10 bg-dark-2 p-4"
            >
              <p className="font-heading text-lg text-white">{page.title}</p>
              <p className="mt-1 text-xs text-white/45">
                /{page.key} · {publishLabel(page.is_published)} ·{' '}
                {(page.paragraphs || []).length} stycken
              </p>
              <p className="mt-2 line-clamp-3 break-words text-sm text-white/55">
                {page.body?.trim() || '— tom body (CONTENT REQUIRED)'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`${btnSecondary()} min-h-11`}
                  disabled={busyKey === page.key}
                  onClick={() => openEdit(page)}
                >
                  Redigera
                </button>
                <button
                  type="button"
                  className={`${btnPrimary()} min-h-11`}
                  disabled={busyKey === page.key}
                  onClick={() => togglePublish(page)}
                >
                  {page.is_published ? 'Avpublicera' : 'Publicera'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {editTarget && editForm ? (
        <OpsDialog
          titleId="legal-edit-title"
          title={`Redigera ${editTarget.key}`}
          onClose={() => (!editSaving ? setEditTarget(null) : null)}
        >
          <form className="mt-3 space-y-3" onSubmit={saveEdit}>
            <div>
              <label className={labelClass()} htmlFor="legal-title">
                Titel
              </label>
              <input
                id="legal-title"
                className={`${inputClass()} min-h-11`}
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, title: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="legal-desc">
                Meta-beskrivning
              </label>
              <input
                id="legal-desc"
                className={`${inputClass()} min-h-11`}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="legal-body">
                Innehåll (plain text, tom rad = nytt stycke)
              </label>
              <textarea
                id="legal-body"
                className={`${inputClass()} min-h-48 py-2`}
                value={editForm.body}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, body: e.target.value }))
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
    </div>
  )
}
