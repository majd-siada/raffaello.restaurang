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

const emptyCreate = {
  quote: '',
  author_name: '',
  source: '',
  rating: '',
  is_published: false,
}

export default function ReviewsPage() {
  const { permissions } = useAuth()
  const [form, setForm] = useState(emptyCreate)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState(null)

  const { data, loading, error, reload } = useOpsQuery(
    () => opsList('/reviews/', { page_size: 100 }),
    [],
    { enabled: Boolean(permissions.reviews) },
  )

  if (!permissions.reviews) return <ForbiddenState />

  const items = data?.results || []

  async function togglePublish(review) {
    setMsg(null)
    try {
      await opsFetch(`/reviews/${review.id}/`, {
        method: 'PATCH',
        json: { is_published: !review.is_published },
      })
      reload()
    } catch (err) {
      setMsg(err instanceof OpsApiError ? err.message : 'Kunde inte uppdatera.')
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setMsg(null)
    try {
      await opsFetch('/reviews/', {
        method: 'POST',
        json: {
          quote: form.quote.trim(),
          author_name: form.author_name.trim(),
          source: form.source.trim(),
          rating: form.rating === '' ? null : Number(form.rating),
          is_published: form.is_published,
          order: items.length,
        },
      })
      setForm(emptyCreate)
      setMsg('Recension skapad.')
      reload()
    } catch (err) {
      setMsg(err instanceof OpsApiError ? err.message : 'Kunde inte skapa.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Recensioner"
        subtitle="Kuraterade citat för webbplatsen"
        actions={
          <button type="button" className={btnSecondary()} onClick={reload}>
            Uppdatera
          </button>
        }
      />

      <form
        className="mb-6 space-y-3 rounded border border-white/10 bg-dark-2 p-4"
        onSubmit={handleCreate}
      >
        <h2 className="font-heading text-lg text-white">Ny recension</h2>
        <div>
          <label className={labelClass()} htmlFor="rev-quote">
            Citat
          </label>
          <textarea
            id="rev-quote"
            className={`${inputClass()} min-h-24 py-2`}
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass()} htmlFor="rev-author">
              Författare
            </label>
            <input
              id="rev-author"
              className={inputClass()}
              value={form.author_name}
              onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="rev-source">
              Källa
            </label>
            <input
              id="rev-source"
              className={inputClass()}
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass()} htmlFor="rev-rating">
              Betyg
            </label>
            <input
              id="rev-rating"
              type="number"
              min="1"
              max="5"
              step="0.1"
              className={inputClass()}
              value={form.rating}
              onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
            />
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
          />
          Publicera direkt
        </label>
        <button type="submit" className={btnPrimary()} disabled={creating}>
          {creating ? 'Skapar…' : 'Skapa'}
        </button>
      </form>

      {msg ? <p className="mb-4 text-sm text-white/70">{msg}</p> : null}
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title="Inga recensioner" />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="rounded border border-white/10 bg-dark-2 p-4"
            >
              <p className="text-white/90">&ldquo;{r.quote}&rdquo;</p>
              <p className="mt-2 text-sm text-white/55">
                {r.author_name}
                {r.source ? ` · ${r.source}` : ''}
                {r.rating != null ? ` · ${r.rating}` : ''} · Publicerad:{' '}
                {yesNo(r.is_published)}
              </p>
              <button
                type="button"
                className={`${btnSecondary()} mt-3`}
                onClick={() => togglePublish(r)}
              >
                {r.is_published ? 'Avpublicera' : 'Publicera'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
