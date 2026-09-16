import { useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import {
  formatAdminApiError,
  GALLERY_DELETE_SUPPORTED,
  MAX_PUBLISHED,
  publishLabel,
} from './galleryHelpers'
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

export default function GalleryPage() {
  const { permissions } = useAdminAuth()
  const [uploading, setUploading] = useState(false)
  const [altText, setAltText] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [flash, setFlash] = useState(null)
  const [flashError, setFlashError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const query = useAdminQuery(
    () => adminList('/gallery/', { page_size: 100 }),
    [],
    { enabled: Boolean(permissions.gallery) },
  )

  function onFileChange(e) {
    const next = e.target.files?.[0] || null
    setFile(next)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return next ? URL.createObjectURL(next) : null
    })
  }

  function clearFileSelection() {
    setFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  if (!permissions.gallery) return <ForbiddenState />
  if (query.errorStatus === 403) return <ForbiddenState />

  const items = query.data?.results || []
  const publishedCount = items.filter((p) => p.is_published).length

  function setMsg(text, isError = false) {
    setFlash(text)
    setFlashError(isError)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) {
      setMsg('Välj en bildfil först.', true)
      return
    }
    setUploading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('image', file)
      fd.append('alt_text', altText.trim())
      fd.append('is_published', 'false')
      fd.append('order', String(items.length))
      await adminFetch('/gallery/', { method: 'POST', formData: fd })
      clearFileSelection()
      setAltText('')
      setMsg('Bild uppladdad (EJ PUBLICERAD).')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setUploading(false)
    }
  }

  async function togglePublish(photo) {
    const next = !photo.is_published
    if (next && publishedCount >= MAX_PUBLISHED) {
      setMsg(
        `Max ${MAX_PUBLISHED} publicerade foton. Avpublicera ett annat först. Servern avvisar också.`,
        true,
      )
      return
    }
    setBusyId(photo.id)
    setMsg(null)
    try {
      await adminFetch(`/gallery/${photo.id}/`, {
        method: 'PATCH',
        json: { is_published: next },
      })
      setMsg(next ? 'PUBLICERAD.' : 'EJ PUBLICERAD — dold från /api/gallery/.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setBusyId(null)
    }
  }

  async function saveMeta(photo, { alt_text, order }) {
    setBusyId(photo.id)
    setMsg(null)
    try {
      const orderNum = Number.parseInt(String(order), 10)
      await adminFetch(`/gallery/${photo.id}/`, {
        method: 'PATCH',
        json: {
          alt_text: alt_text.trim(),
          order: Number.isFinite(orderNum) ? orderNum : 0,
        },
      })
      setMsg('Uppdaterad.')
      query.reload()
    } catch (err) {
      const { message } = formatAdminApiError(err, AdminApiError)
      setMsg(message, true)
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !GALLERY_DELETE_SUPPORTED) return
    setDeleting(true)
    try {
      await adminFetch(`/gallery/${deleteTarget.id}/`, { method: 'DELETE' })
      setDeleteTarget(null)
      setMsg('Foto raderat.')
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
        title="Galleri"
        subtitle={`${publishedCount} publicerade (max ${MAX_PUBLISHED} på sajten). Tom CMS → SITE.gallery fallback.`}
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
        className="mb-6 rounded border border-white/10 bg-dark-2 p-4"
        onSubmit={handleUpload}
      >
        <h2 className="font-heading text-lg text-white">Ladda upp</h2>
        <p className="mt-1 text-xs text-white/45">
          Sparas som WebP (maxkant 1600). Startar EJ PUBLICERAD.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass()} htmlFor="admin-gallery-file">
              Bild
            </label>
            <input
              id="admin-gallery-file"
              type="file"
              accept="image/*"
              className="block min-h-11 w-full text-sm text-white/70"
              onChange={onFileChange}
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="admin-gallery-alt">
              Alt-text
            </label>
            <input
              id="admin-gallery-alt"
              className={`${inputClass()} min-h-11`}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Förhandsvisning"
            className="mt-3 max-h-40 max-w-full rounded object-contain"
          />
        ) : null}
        <button
          type="submit"
          className={`${btnPrimary()} mt-4 min-h-11`}
          disabled={uploading}
        >
          {uploading ? 'Laddar upp…' : 'Ladda upp'}
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
        <EmptyState title="Inga foton i CMS" />
      ) : null}

      {!query.loading && !query.error && items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo) => (
            <GalleryCard
              key={`${photo.id}-${photo.alt_text}-${photo.order}-${photo.is_published}`}
              photo={photo}
              busy={busyId === photo.id}
              onPublish={() => togglePublish(photo)}
              onSaveMeta={saveMeta}
              onDelete={() => setDeleteTarget(photo)}
            />
          ))}
        </ul>
      ) : null}

      {deleteTarget ? (
        <OpsDialog
          titleId="gallery-delete-title"
          title="Radera foto?"
          onClose={() => (!deleting ? setDeleteTarget(null) : null)}
        >
          <p className="text-sm text-white/70">
            Radera foto #{deleteTarget.id}
            {deleteTarget.alt_text ? ` (${deleteTarget.alt_text})` : ''}? Detta går
            inte att ångra.
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

function GalleryCard({ photo, busy, onPublish, onSaveMeta, onDelete }) {
  const [alt, setAlt] = useState(photo.alt_text || '')
  const [order, setOrder] = useState(String(photo.order ?? 0))

  return (
    <li className="overflow-hidden rounded border border-white/10 bg-dark-2">
      {photo.src ? (
        <img
          src={photo.src}
          alt={photo.alt_text || ''}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center text-sm text-white/40">
          Ingen förhandsvisning
        </div>
      )}
      <div className="space-y-2 p-3">
        <p className="text-xs text-white/45">
          #{photo.id} · {publishLabel(photo.is_published)}
        </p>
        <div>
          <label className={labelClass()} htmlFor={`gal-alt-${photo.id}`}>
            Alt-text
          </label>
          <input
            id={`gal-alt-${photo.id}`}
            className={`${inputClass()} min-h-11`}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelClass()} htmlFor={`gal-ord-${photo.id}`}>
            Ordning
          </label>
          <input
            id={`gal-ord-${photo.id}`}
            type="number"
            min="0"
            className={`${inputClass()} min-h-11`}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${btnSecondary()} min-h-11 flex-1`}
            disabled={busy}
            onClick={() => onSaveMeta(photo, { alt_text: alt, order })}
          >
            Spara
          </button>
          <button
            type="button"
            className={`${btnPrimary()} min-h-11 flex-1`}
            disabled={busy}
            onClick={onPublish}
          >
            {photo.is_published ? 'Avpublicera' : 'Publicera'}
          </button>
          {GALLERY_DELETE_SUPPORTED ? (
            <button
              type="button"
              className={`${btnDanger()} min-h-11 w-full`}
              disabled={busy}
              onClick={onDelete}
            >
              Radera
            </button>
          ) : null}
        </div>
      </div>
    </li>
  )
}
