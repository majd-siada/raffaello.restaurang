import { useMemo, useState } from 'react'
import { useAdminAuth } from './AuthContext'
import { adminFetch, adminList, AdminApiError } from './api'
import { useAdminQuery } from './useAdminQuery'
import { formatPrice } from '../formatPrice'
import {
  btnPrimary,
  btnSecondary,
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
  isCurrentIsoWeek,
  normalizePriceInput,
  OFFER_IMAGE_SUPPORTED,
  publishLabel,
} from './offerHelpers'

const emptyWeekForm = {
  week_start: '',
  intro_text: '',
  is_published: true,
}

const emptyDishForm = {
  name: '',
  description: '',
  price: '',
  is_available: true,
  order: '0',
}

function PublishBadge({ published }) {
  return (
    <span
      className={
        published
          ? 'inline-flex min-h-8 items-center rounded border border-emerald-500/40 bg-emerald-950/40 px-2 text-xs font-medium uppercase tracking-wide text-emerald-100'
          : 'inline-flex min-h-8 items-center rounded border border-white/20 bg-white/5 px-2 text-xs font-medium uppercase tracking-wide text-white/55'
      }
    >
      {publishLabel(published)}
    </span>
  )
}

export default function AdminOffersPage() {
  const { permissions } = useAdminAuth()
  const canOffers = Boolean(permissions.offers)

  const [weekDialog, setWeekDialog] = useState(null) // null | { mode, offer? }
  const [weekForm, setWeekForm] = useState(emptyWeekForm)
  const [weekSaving, setWeekSaving] = useState(false)
  const [weekError, setWeekError] = useState(null)

  const [dishDialog, setDishDialog] = useState(null) // { mode, offer, dish? }
  const [dishForm, setDishForm] = useState(emptyDishForm)
  const [dishSaving, setDishSaving] = useState(false)
  const [dishError, setDishError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'offer'|'dish', ... }
  const [deleting, setDeleting] = useState(false)
  const [flash, setFlash] = useState(null)

  const offersQuery = useAdminQuery(
    () => adminList('/offers/', { page_size: 50 }),
    [],
    { enabled: canOffers },
  )

  const offers = useMemo(
    () => offersQuery.data?.results || [],
    [offersQuery.data],
  )

  const currentOffer = useMemo(
    () => offers.find((o) => isCurrentIsoWeek(o)) || null,
    [offers],
  )

  if (!canOffers) return <ForbiddenState />

  if (offersQuery.errorStatus === 403) return <ForbiddenState />

  if (offersQuery.loading && !offersQuery.data) {
    return <LoadingState label="Laddar erbjudanden…" />
  }

  if (offersQuery.error && !offersQuery.data) {
    return <ErrorState message={offersQuery.error} onRetry={offersQuery.reload} />
  }

  function openCreateWeek() {
    const today = new Date()
    const iso = today.toISOString().slice(0, 10)
    setWeekDialog({ mode: 'create' })
    setWeekForm({ ...emptyWeekForm, week_start: iso })
    setWeekError(null)
  }

  function openEditWeek(offer) {
    setWeekDialog({ mode: 'edit', offer })
    setWeekForm({
      week_start: offer.week_start || '',
      intro_text: offer.intro_text || '',
      is_published: Boolean(offer.is_published),
    })
    setWeekError(null)
  }

  async function saveWeek(e) {
    e.preventDefault()
    setWeekSaving(true)
    setWeekError(null)
    try {
      if (!weekForm.week_start) {
        setWeekError('Veckostart (datum) krävs.')
        return
      }
      const payload = {
        week_start: weekForm.week_start,
        intro_text: weekForm.intro_text,
        is_published: weekForm.is_published,
      }
      if (weekDialog?.mode === 'create') {
        await adminFetch('/offers/', { method: 'POST', json: payload })
        setFlash('Erbjudandevecka skapad. Lägg till rätter nedan.')
      } else if (weekDialog?.offer) {
        await adminFetch(`/offers/${weekDialog.offer.id}/`, {
          method: 'PATCH',
          json: payload,
        })
        setFlash(
          payload.is_published
            ? 'Sparat — PUBLICERAD (syns i /api/offers/ för rätt ISO-vecka).'
            : 'Sparat — EJ PUBLICERAD (syns inte publikt).',
        )
      }
      setWeekDialog(null)
      offersQuery.reload()
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      if (status === 403) setWeekError('403 — saknar behörighet.')
      else if (status === 401) setWeekError('Session utgången. Logga in igen.')
      else if (status === 400) {
        setWeekError(err instanceof AdminApiError ? err.message : 'Valideringsfel.')
      } else {
        setWeekError(err instanceof AdminApiError ? err.message : 'Kunde inte spara.')
      }
    } finally {
      setWeekSaving(false)
    }
  }

  function openCreateDish(offer) {
    setDishDialog({ mode: 'create', offer })
    setDishForm({
      ...emptyDishForm,
      order: String((offer.dishes || []).length),
    })
    setDishError(null)
  }

  function openEditDish(offer, dish) {
    setDishDialog({ mode: 'edit', offer, dish })
    setDishForm({
      name: dish.name || '',
      description: dish.description || '',
      price: dish.price != null ? String(dish.price) : '',
      is_available: Boolean(dish.is_available),
      order: String(dish.order ?? 0),
    })
    setDishError(null)
  }

  async function saveDish(e) {
    e.preventDefault()
    if (!dishDialog?.offer) return
    setDishSaving(true)
    setDishError(null)
    try {
      const price = normalizePriceInput(dishForm.price)
      if (!dishForm.name.trim()) {
        setDishError('Namn krävs.')
        return
      }
      if (price === '') {
        setDishError('Pris krävs.')
        return
      }
      const orderNum = Number.parseInt(dishForm.order, 10)
      const payload = {
        offer: dishDialog.offer.id,
        name: dishForm.name.trim(),
        description: dishForm.description,
        price,
        is_available: dishForm.is_available,
        order: Number.isFinite(orderNum) ? orderNum : 0,
      }
      if (dishDialog.mode === 'create') {
        await adminFetch('/offer-dishes/', { method: 'POST', json: payload })
        setFlash('Rätt tillagd.')
      } else if (dishDialog.dish) {
        await adminFetch(`/offer-dishes/${dishDialog.dish.id}/`, {
          method: 'PATCH',
          json: payload,
        })
        setFlash('Rätt uppdaterad.')
      }
      setDishDialog(null)
      offersQuery.reload()
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      if (status === 403) setDishError('403 — saknar behörighet.')
      else if (status === 401) setDishError('Session utgången. Logga in igen.')
      else setDishError(err instanceof AdminApiError ? err.message : 'Kunde inte spara rätt.')
    } finally {
      setDishSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.type === 'offer') {
        await adminFetch(`/offers/${deleteTarget.offer.id}/`, { method: 'DELETE' })
        setFlash('Erbjudandevecka raderad (rätter CASCADE).')
      } else {
        await adminFetch(`/offer-dishes/${deleteTarget.dish.id}/`, { method: 'DELETE' })
        setFlash('Rätt raderad.')
      }
      setDeleteTarget(null)
      offersQuery.reload()
    } catch (err) {
      setFlash(
        err instanceof AdminApiError
          ? `Radering misslyckades: ${err.message}`
          : 'Radering misslyckades.',
      )
    } finally {
      setDeleting(false)
    }
  }

  async function quickPublish(offer, next) {
    try {
      await adminFetch(`/offers/${offer.id}/`, {
        method: 'PATCH',
        json: { is_published: next },
      })
      setFlash(next ? 'PUBLICERAD.' : 'EJ PUBLICERAD — dold från /api/offers/.')
      offersQuery.reload()
    } catch (err) {
      setFlash(err instanceof AdminApiError ? err.message : 'Kunde inte ändra publicering.')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="Veckans Erbjudande"
        subtitle="ISO-veckor via Django. Publicering = is_published. Pris på rätter (Decimal)."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary()} onClick={() => offersQuery.reload()}>
              Uppdatera
            </button>
            <button type="button" className={btnPrimary()} onClick={openCreateWeek}>
              Ny vecka
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

      {!OFFER_IMAGE_SUPPORTED ? (
        <p className="mb-4 text-xs text-white/40">
          BACKEND GAP: bilduppladdning finns inte på WeeklyOffer/OfferDish.
        </p>
      ) : null}

      {/* Current offer */}
      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <h2 className="font-heading text-lg text-white">Aktuellt erbjudande</h2>
        {!currentOffer ? (
          <div className="mt-3">
            <EmptyState
              title="Inget aktivt erbjudande"
              message="Ingen databasrad för aktuell ISO-vecka. Skapa en ny vecka eller publicera en befintlig."
            />
            <button type="button" className={`${btnPrimary()} mt-3`} onClick={openCreateWeek}>
              Skapa vecka
            </button>
          </div>
        ) : (
          <OfferCard
            offer={currentOffer}
            highlight
            onEdit={() => openEditWeek(currentOffer)}
            onAddDish={() => openCreateDish(currentOffer)}
            onEditDish={(d) => openEditDish(currentOffer, d)}
            onDeleteOffer={() => setDeleteTarget({ type: 'offer', offer: currentOffer })}
            onDeleteDish={(d) =>
              setDeleteTarget({ type: 'dish', offer: currentOffer, dish: d })
            }
            onPublish={(next) => quickPublish(currentOffer, next)}
          />
        )}
      </section>

      {/* All weeks */}
      <section>
        <h2 className="mb-3 font-heading text-xl text-white">Alla veckor</h2>
        {offers.length === 0 ? (
          <EmptyState
            title="Inga erbjudanden"
            message="Inget i databasen ännu. Skapa en vecka för att börja."
          />
        ) : (
          <ul className="space-y-4">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard
                  offer={offer}
                  highlight={isCurrentIsoWeek(offer)}
                  onEdit={() => openEditWeek(offer)}
                  onAddDish={() => openCreateDish(offer)}
                  onEditDish={(d) => openEditDish(offer, d)}
                  onDeleteOffer={() => setDeleteTarget({ type: 'offer', offer })}
                  onDeleteDish={(d) => setDeleteTarget({ type: 'dish', offer, dish: d })}
                  onPublish={(next) => quickPublish(offer, next)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Week dialog */}
      {weekDialog ? (
        <OpsDialog
          titleId="admin-offer-week-title"
          title={
            weekDialog.mode === 'create'
              ? 'Ny erbjudandevecka'
              : `Redigera v${weekDialog.offer?.week_number}/${weekDialog.offer?.year}`
          }
          onClose={() => setWeekDialog(null)}
        >
          <form className="mt-4 space-y-3" onSubmit={saveWeek}>
            <p className="text-sm text-white/55">
              Datum sparas som <strong>måndagen</strong> i den ISO-veckan (Django).
              year/week_number sätts automatiskt. Unik per år+vecka.
            </p>
            <div>
              <label htmlFor="offer-week-start" className={labelClass()}>
                Datum i veckan
              </label>
              <input
                id="offer-week-start"
                type="date"
                className={inputClass()}
                value={weekForm.week_start}
                onChange={(e) =>
                  setWeekForm((f) => ({ ...f, week_start: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="offer-intro" className={labelClass()}>
                Introtext
              </label>
              <textarea
                id="offer-intro"
                className={`${inputClass()} min-h-28 py-2`}
                value={weekForm.intro_text}
                onChange={(e) =>
                  setWeekForm((f) => ({ ...f, intro_text: e.target.value }))
                }
              />
              <p className="mt-1 text-xs text-white/40">
                Tom intro = publika sidan kan visa standardtext när rätter finns.
              </p>
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm text-white/85">
              <input
                type="checkbox"
                checked={weekForm.is_published}
                onChange={(e) =>
                  setWeekForm((f) => ({ ...f, is_published: e.target.checked }))
                }
              />
              Publicerad (`is_published`) — syns i GET /api/offers/ för ±1 ISO-vecka
            </label>
            {weekError ? (
              <p className="text-sm text-red-300" role="alert">
                {weekError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className={btnPrimary()} disabled={weekSaving}>
                {weekSaving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={btnSecondary()}
                onClick={() => setWeekDialog(null)}
              >
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}

      {/* Dish dialog */}
      {dishDialog ? (
        <OpsDialog
          titleId="admin-offer-dish-title"
          title={
            dishDialog.mode === 'create'
              ? `Ny rätt — v${dishDialog.offer.week_number}`
              : `Redigera rätt`
          }
          onClose={() => setDishDialog(null)}
        >
          <form className="mt-4 space-y-3" onSubmit={saveDish}>
            <div>
              <label htmlFor="offer-dish-name" className={labelClass()}>
                Namn
              </label>
              <input
                id="offer-dish-name"
                className={inputClass()}
                value={dishForm.name}
                onChange={(e) => setDishForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="offer-dish-desc" className={labelClass()}>
                Beskrivning
              </label>
              <textarea
                id="offer-dish-desc"
                className={`${inputClass()} min-h-24 py-2`}
                value={dishForm.description}
                onChange={(e) =>
                  setDishForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="offer-dish-price" className={labelClass()}>
                Pris (SEK)
              </label>
              <input
                id="offer-dish-price"
                className={inputClass()}
                inputMode="decimal"
                value={dishForm.price}
                onChange={(e) => setDishForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="139 eller 139.00"
                required
              />
            </div>
            <div>
              <label htmlFor="offer-dish-order" className={labelClass()}>
                Ordning
              </label>
              <input
                id="offer-dish-order"
                type="number"
                className={inputClass()}
                value={dishForm.order}
                onChange={(e) => setDishForm((f) => ({ ...f, order: e.target.value }))}
              />
            </div>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dishForm.is_available}
                onChange={(e) =>
                  setDishForm((f) => ({ ...f, is_available: e.target.checked }))
                }
              />
              Tillgänglig (publikt filtreras bort om av)
            </label>
            {dishError ? (
              <p className="text-sm text-red-300" role="alert">
                {dishError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className={btnPrimary()} disabled={dishSaving}>
                {dishSaving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={btnSecondary()}
                onClick={() => setDishDialog(null)}
              >
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}

      {/* Delete confirm */}
      {deleteTarget ? (
        <OpsDialog
          titleId="admin-offer-delete-title"
          title="Bekräfta radering"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="mt-3 text-sm text-white/70">
            {deleteTarget.type === 'offer' ? (
              <>
                Radera permanent{' '}
                <strong>
                  v{deleteTarget.offer.week_number}/{deleteTarget.offer.year}
                </strong>
                ? Alla rätter tas bort (CASCADE). Preferera EJ PUBLICERAD om du vill
                behålla historik.
              </>
            ) : (
              <>
                Radera rätten <strong>{deleteTarget.dish.name}</strong>?
              </>
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="min-h-11 rounded bg-red-700 px-4 text-sm text-white hover:bg-red-600 disabled:opacity-50"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? 'Raderar…' : 'Radera permanent'}
            </button>
            <button
              type="button"
              className={btnSecondary()}
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

function OfferCard({
  offer,
  highlight,
  onEdit,
  onAddDish,
  onEditDish,
  onDeleteOffer,
  onDeleteDish,
  onPublish,
}) {
  const dishes = offer.dishes || []
  return (
    <article
      className={`rounded border p-4 ${
        highlight
          ? 'border-gold/40 bg-gold-dim/20'
          : 'border-white/10 bg-dark-2'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-lg text-white">
              Vecka {offer.week_number}/{offer.year}
            </h3>
            <PublishBadge published={offer.is_published} />
            {highlight ? (
              <span className="text-xs uppercase tracking-wider text-gold">Aktuell</span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-white/50">
            Veckostart (måndag): {offer.week_start || '—'}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {offer.intro_text || (
              <span className="text-white/40">Ingen introtext.</span>
            )}
          </p>

          {dishes.length === 0 ? (
            <p className="mt-3 text-sm text-white/45">Inga rätter kopplade.</p>
          ) : (
            <>
              <ul className="mt-3 hidden space-y-2 lg:block">
                {dishes.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-start justify-between gap-2 border-t border-white/5 py-2 text-sm"
                  >
                    <div>
                      <p className="text-white">{d.name}</p>
                      {d.description ? (
                        <p className="text-xs text-white/45">{d.description}</p>
                      ) : null}
                      <p className="text-xs text-gold/80">
                        {formatPrice(d.price) || '—'} · ordning {d.order} ·{' '}
                        {d.is_available ? 'tillgänglig' : 'dold'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`${btnSecondary()} min-h-11`}
                        onClick={() => onEditDish(d)}
                      >
                        Redigera
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded border border-red-400/40 px-3 text-sm text-red-200"
                        onClick={() => onDeleteDish(d)}
                      >
                        Radera
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <ul className="mt-3 space-y-2 lg:hidden">
                {dishes.map((d) => (
                  <li key={d.id} className="rounded border border-white/10 p-3 text-sm">
                    <p className="text-white">{d.name}</p>
                    <p className="text-xs text-gold/80">{formatPrice(d.price) || '—'}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className={`${btnSecondary()} min-h-11 flex-1`}
                        onClick={() => onEditDish(d)}
                      >
                        Redigera
                      </button>
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded border border-red-400/40 px-3 text-sm text-red-200"
                        onClick={() => onDeleteDish(d)}
                      >
                        Radera
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2 lg:flex-col">
          <button type="button" className={`${btnSecondary()} min-h-11`} onClick={onEdit}>
            Redigera vecka
          </button>
          <button type="button" className={`${btnPrimary()} min-h-11`} onClick={onAddDish}>
            Lägg till rätt
          </button>
          {offer.is_published ? (
            <button
              type="button"
              className={`${btnSecondary()} min-h-11`}
              onClick={() => onPublish(false)}
            >
              Avpublicera
            </button>
          ) : (
            <button
              type="button"
              className={`${btnSecondary()} min-h-11`}
              onClick={() => onPublish(true)}
            >
              Publicera
            </button>
          )}
          <button
            type="button"
            className="min-h-11 rounded border border-red-400/40 px-3 text-sm text-red-200"
            onClick={onDeleteOffer}
          >
            Radera vecka
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-white/35">
        Publicerad: {yesNo(offer.is_published)} · rätter: {dishes.length}
      </p>
    </article>
  )
}
