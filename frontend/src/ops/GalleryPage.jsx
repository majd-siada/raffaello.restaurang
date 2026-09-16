import { useState } from 'react'
import { useAuth } from './AuthContext'
import { opsFetch, opsList, OpsApiError } from './api'
import { useOpsQuery } from './useOpsQuery'
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

export default function GalleryPage() {
  const { permissions } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [altText, setAltText] = useState('')
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState(null)

  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/gallery/', { page_size: 100 }),
    [],
    { enabled: Boolean(permissions.gallery) },
  )

  if (!permissions.gallery) return <ForbiddenState />

  const items = data?.results || []
  const publishedCount = items.filter((p) => p.is_published).length

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) {
      setMsg('Välj en bildfil först.')
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
      await opsFetch('/gallery/', { method: 'POST', formData: fd })
      setFile(null)
      setAltText('')
      setMsg('Bild uppladdad (opublicerad).')
      reload()
    } catch (err) {
      setMsg(err instanceof OpsApiError ? err.message : 'Uppladdning misslyckades.')
    } finally {
      setUploading(false)
    }
  }

  async function togglePublish(photo) {
    const next = !photo.is_published
    if (next && publishedCount >= 6) {
      setMsg('Max 6 publicerade foton på webbplatsen.')
      return
    }
    setMsg(null)
    try {
      await opsFetch(`/gallery/${photo.id}/`, {
        method: 'PATCH',
        json: { is_published: next },
      })
      reload()
    } catch (err) {
      setMsg(err instanceof OpsApiError ? err.message : 'Kunde inte uppdatera.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Galleri"
        subtitle={`${publishedCount} publicerade (max 6 på sajten)`}
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <form
        className="mb-6 rounded border border-white/10 bg-dark-2 p-4"
        onSubmit={handleUpload}
      >
        <h2 className="font-heading text-lg text-white">Ladda upp</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass()} htmlFor="gallery-file">
              Bild
            </label>
            <input
              id="gallery-file"
              type="file"
              accept="image/*"
              className="block w-full text-sm text-white/70"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="gallery-alt">
              Alt-text
            </label>
            <input
              id="gallery-alt"
              className={inputClass()}
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className={`${btnPrimary()} mt-4`} disabled={uploading}>
          {uploading ? 'Laddar upp…' : 'Ladda upp'}
        </button>
      </form>

      {msg ? (
        <p
          className={`mb-4 text-sm ${
            /misslyck|fel|max 6/i.test(msg || '')
              ? 'text-red-300'
              : 'text-white/70'
          }`}
          role={/misslyck|fel|max 6/i.test(msg || '') ? 'alert' : 'status'}
        >
          {msg}
        </p>
      ) : null}
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inga foton" />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((photo) => (
            <li
              key={photo.id}
              className="overflow-hidden rounded border border-white/10 bg-dark-2"
            >
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
              <div className="p-3">
                <p className="text-sm text-white/80">{photo.alt_text || '—'}</p>
                <p className="mt-1 text-xs text-white/45">
                  Publicerad: {yesNo(photo.is_published)} · Ordning: {photo.order}
                </p>
                <button
                  type="button"
                  className={`${btnSecondary()} mt-3 w-full`}
                  onClick={() => togglePublish(photo)}
                >
                  {photo.is_published ? 'Avpublicera' : 'Publicera'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
