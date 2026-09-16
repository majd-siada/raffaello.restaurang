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
  categoryLabel,
  MENU_ACCEPT_IMAGES,
  normalizePriceInput,
} from './menuHelpers'

const emptyItemForm = {
  category: '',
  name: '',
  description: '',
  price: '',
  is_available: true,
  is_featured: false,
  allergens: '',
  tags: '',
  order: '0',
}

function StatusPill({ ok, yesLabel, noLabel }) {
  return (
    <span
      className={
        ok
          ? 'inline-flex min-h-8 items-center rounded bg-emerald-950/50 px-2 text-xs text-emerald-200'
          : 'inline-flex min-h-8 items-center rounded bg-white/5 px-2 text-xs text-white/45'
      }
    >
      {ok ? yesLabel : noLabel}
    </span>
  )
}

export default function AdminMenuPage() {
  const { permissions } = useAdminAuth()
  const canMenu = Boolean(permissions.menu)

  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [availFilter, setAvailFilter] = useState('all') // all | on | off
  const [page, setPage] = useState(1)
  const pageSize = 25

  const [dialog, setDialog] = useState(null) // null | { mode: 'create'|'edit', item? }
  const [form, setForm] = useState(emptyItemForm)
  const [imageFile, setImageFile] = useState(null)
  const [clearImage, setClearImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)

  const [catDialog, setCatDialog] = useState(null) // null | { mode, category? }
  const [catForm, setCatForm] = useState({ name: '', description: '', parent: '', order: '0' })
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [flash, setFlash] = useState(null)

  const itemsQuery = useAdminQuery(
    () =>
      adminList('/menu/items/', {
        q,
        category: categoryFilter || undefined,
        page,
        page_size: pageSize,
      }),
    [q, categoryFilter, page],
    { enabled: canMenu },
  )

  const catsQuery = useAdminQuery(
    () => adminList('/menu/categories/', { page_size: 100 }),
    [],
    { enabled: canMenu },
  )

  const categories = useMemo(
    () => catsQuery.data?.results || [],
    [catsQuery.data],
  )
  const catById = useMemo(() => {
    const map = {}
    categories.forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [categories])

  const items = useMemo(() => {
    const rawItems = itemsQuery.data?.results || []
    if (availFilter === 'on') return rawItems.filter((i) => i.is_available)
    if (availFilter === 'off') return rawItems.filter((i) => !i.is_available)
    return rawItems
  }, [itemsQuery.data, availFilter])

  const totalCount = itemsQuery.data?.count ?? items.length
  const hasNext = Boolean(itemsQuery.data?.next)
  const hasPrev = Boolean(itemsQuery.data?.previous) || page > 1

  if (!canMenu) return <ForbiddenState />

  function openCreate() {
    setDialog({ mode: 'create' })
    setForm({
      ...emptyItemForm,
      category: categoryFilter || (categories[0]?.id ? String(categories[0].id) : ''),
    })
    setImageFile(null)
    setClearImage(false)
    setSaveError(null)
    setSaveStatus(null)
  }

  function openEdit(item) {
    setDialog({ mode: 'edit', item })
    setForm({
      category: String(item.category ?? ''),
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      is_available: Boolean(item.is_available),
      is_featured: Boolean(item.is_featured),
      allergens: item.allergens || '',
      tags: item.tags || '',
      order: String(item.order ?? 0),
    })
    setImageFile(null)
    setClearImage(false)
    setSaveError(null)
    setSaveStatus(null)
  }

  function closeDialog() {
    setDialog(null)
    setForm(emptyItemForm)
    setImageFile(null)
    setClearImage(false)
    setSaveError(null)
    setSaveStatus(null)
  }

  async function submitItem(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveStatus(null)
    try {
      const price = normalizePriceInput(form.price)
      const orderNum = form.order === '' ? 0 : Number.parseInt(form.order, 10)
      const payload = {
        category: Number(form.category),
        name: form.name.trim(),
        description: form.description,
        price,
        is_available: form.is_available,
        is_featured: form.is_featured,
        allergens: form.allergens,
        tags: form.tags,
        order: Number.isFinite(orderNum) ? orderNum : 0,
      }

      if (!payload.category || !payload.name) {
        setSaveError('Kategori och namn krävs.')
        setSaveStatus(400)
        return
      }
      if (price === '') {
        setSaveError('Pris krävs.')
        setSaveStatus(400)
        return
      }

      const useMultipart = Boolean(imageFile) || clearImage

      if (dialog?.mode === 'create') {
        if (useMultipart && imageFile) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => {
            if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false')
            else fd.append(k, String(v))
          })
          fd.append('image', imageFile)
          await adminFetch('/menu/items/', { method: 'POST', formData: fd })
        } else {
          await adminFetch('/menu/items/', { method: 'POST', json: payload })
        }
        setFlash('Rätt skapad.')
      } else if (dialog?.mode === 'edit' && dialog.item) {
        const id = dialog.item.id
        if (useMultipart) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => {
            if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false')
            else fd.append(k, String(v))
          })
          if (imageFile) fd.append('image', imageFile)
          else if (clearImage) fd.append('image', '')
          await adminFetch(`/menu/items/${id}/`, { method: 'PATCH', formData: fd })
        } else {
          await adminFetch(`/menu/items/${id}/`, { method: 'PATCH', json: payload })
        }
        setFlash('Ändringar sparade.')
      }
      closeDialog()
      itemsQuery.reload()
    } catch (err) {
      const status = err instanceof AdminApiError ? err.status : null
      setSaveStatus(status)
      if (status === 403) {
        setSaveError('Saknar behörighet att spara (server).')
      } else if (status === 401) {
        setSaveError('Sessionen har gått ut. Logga in igen.')
      } else {
        setSaveError(err instanceof AdminApiError ? err.message : 'Kunde inte spara.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminFetch(`/menu/items/${deleteTarget.id}/`, { method: 'DELETE' })
      setDeleteTarget(null)
      setFlash('Rätten raderades permanent.')
      itemsQuery.reload()
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

  function openCreateCategory() {
    setCatDialog({ mode: 'create' })
    setCatForm({ name: '', description: '', parent: '', order: String(categories.length) })
    setCatError(null)
  }

  function openEditCategory(cat) {
    setCatDialog({ mode: 'edit', category: cat })
    setCatForm({
      name: cat.name || '',
      description: cat.description || '',
      parent: cat.parent != null ? String(cat.parent) : '',
      order: String(cat.order ?? 0),
    })
    setCatError(null)
  }

  async function submitCategory(e) {
    e.preventDefault()
    setCatSaving(true)
    setCatError(null)
    try {
      const body = {
        name: catForm.name.trim(),
        description: catForm.description,
        parent: catForm.parent === '' ? null : Number(catForm.parent),
        order: Number.parseInt(catForm.order, 10) || 0,
      }
      if (!body.name) {
        setCatError('Namn krävs.')
        return
      }
      if (catDialog?.mode === 'create') {
        await adminFetch('/menu/categories/', { method: 'POST', json: body })
      } else if (catDialog?.category) {
        await adminFetch(`/menu/categories/${catDialog.category.id}/`, {
          method: 'PATCH',
          json: body,
        })
      }
      setCatDialog(null)
      catsQuery.reload()
      setFlash('Kategori sparad.')
    } catch (err) {
      setCatError(err instanceof AdminApiError ? err.message : 'Kunde inte spara kategori.')
    } finally {
      setCatSaving(false)
    }
  }

  const listError = itemsQuery.error
  const listForbidden = itemsQuery.errorStatus === 403

  return (
    <div>
      <PageHeader
        eyebrow="Innehåll"
        title="Meny"
        subtitle="Kategorier och rätter via Django (/api/admin/menu/*). Publicering = Tillgänglig."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary()} onClick={() => itemsQuery.reload()}>
              Uppdatera
            </button>
            <button type="button" className={btnPrimary()} onClick={openCreate}>
              Ny rätt
            </button>
          </div>
        }
      />

      {flash ? (
        <p className="mb-4 rounded border border-gold/30 bg-gold-dim px-3 py-2 text-sm text-gold" role="status">
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

      {/* Categories */}
      <section className="mb-8 rounded border border-white/10 bg-dark-2 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-heading text-lg text-white">Kategorier</h2>
          <button type="button" className={btnSecondary()} onClick={openCreateCategory}>
            Ny kategori
          </button>
        </div>
        {catsQuery.loading ? (
          <p className="mt-3 text-sm text-white/45">Laddar kategorier…</p>
        ) : catsQuery.errorStatus === 403 ? (
          <ForbiddenState />
        ) : catsQuery.error ? (
          <ErrorState message={catsQuery.error} onRetry={catsQuery.reload} />
        ) : categories.length === 0 ? (
          <EmptyState title="Inga kategorier" message="Skapa en kategori innan du lägger till rätter." />
        ) : (
          <ul className="mt-3 divide-y divide-white/10">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-white">{categoryLabel(c, catById)}</p>
                  <p className="text-xs text-white/40">
                    ordning {c.order}
                    {c.description ? ' · har beskrivning' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className={`${btnSecondary()} min-h-11`}
                  onClick={() => openEditCategory(c)}
                >
                  Redigera
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-white/35">
          Kategoriradering erbjuds inte i Admin (CASCADE tar bort rätter). Använd Django Admin
          endast med försiktighet.
        </p>
      </section>

      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="admin-menu-q" className={labelClass()}>
            Sök
          </label>
          <input
            id="admin-menu-q"
            className={inputClass()}
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            placeholder="Namn eller beskrivning…"
          />
        </div>
        <div>
          <label htmlFor="admin-menu-cat" className={labelClass()}>
            Kategori
          </label>
          <select
            id="admin-menu-cat"
            className={inputClass()}
            value={categoryFilter}
            onChange={(e) => {
              setPage(1)
              setCategoryFilter(e.target.value)
            }}
          >
            <option value="">Alla</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c, catById)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin-menu-avail" className={labelClass()}>
            Tillgänglighet
          </label>
          <select
            id="admin-menu-avail"
            className={inputClass()}
            value={availFilter}
            onChange={(e) => setAvailFilter(e.target.value)}
          >
            <option value="all">Alla</option>
            <option value="on">Tillgängliga (publicerade)</option>
            <option value="off">Ej tillgängliga</option>
          </select>
        </div>
      </div>

      {itemsQuery.loading ? (
        <LoadingState label="Laddar meny…" />
      ) : listForbidden ? (
        <ForbiddenState />
      ) : listError ? (
        <ErrorState message={listError} onRetry={itemsQuery.reload} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Inga rätter"
          message="Inga träffar för filtret, eller menyn är tom."
        />
      ) : (
        <>
          {/* Desktop table — lg+ only to avoid horizontal overflow at 768 */}
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-2 py-3">Namn</th>
                  <th className="px-2 py-3">Kategori</th>
                  <th className="px-2 py-3">Pris</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Ordning</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 align-top">
                    <td className="px-2 py-3">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        {item.image_url || item.image ? (
                          <StatusPill ok yesLabel="Bild" noLabel="" />
                        ) : (
                          <StatusPill ok={false} yesLabel="" noLabel="Ingen bild" />
                        )}
                        {item.description ? (
                          <StatusPill ok yesLabel="Beskrivning" noLabel="" />
                        ) : null}
                        {item.tags ? (
                          <span className="text-xs text-white/40">{item.tags}</span>
                        ) : null}
                      </p>
                      {item.allergens ? (
                        <p className="mt-1 text-xs text-amber-200/70">Allergener: {item.allergens}</p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 text-white/70">
                      {categoryLabel(catById[item.category] || item.category, catById)}
                    </td>
                    <td className="px-2 py-3 text-gold">{formatPrice(item.price) || '—'}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusPill
                          ok={item.is_available}
                          yesLabel="Tillgänglig"
                          noLabel="Dold"
                        />
                        <StatusPill
                          ok={item.is_featured}
                          yesLabel="Utvald"
                          noLabel="Ej utvald"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-3 text-white/50">{item.order}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`${btnSecondary()} min-h-11`}
                          onClick={() => openEdit(item)}
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          className="min-h-11 rounded border border-red-400/40 px-3 text-sm text-red-200 hover:bg-red-950/40"
                          onClick={() => setDeleteTarget(item)}
                        >
                          Radera
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards below lg */}
          <ul className="space-y-3 lg:hidden">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded border border-white/10 bg-dark-2 p-4"
              >
                <p className="font-heading text-lg text-white">{item.name}</p>
                <p className="mt-1 text-sm text-gold">{formatPrice(item.price) || '—'}</p>
                <p className="mt-1 text-xs text-white/50">
                  {categoryLabel(catById[item.category] || item.category, catById)} · ordning{' '}
                  {item.order}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill
                    ok={item.is_available}
                    yesLabel="Tillgänglig"
                    noLabel="Dold"
                  />
                  <StatusPill
                    ok={item.is_featured}
                    yesLabel="Utvald"
                    noLabel="Ej utvald"
                  />
                  <StatusPill
                    ok={Boolean(item.image_url || item.image)}
                    yesLabel="Bild"
                    noLabel="Ingen bild"
                  />
                </div>
                {item.tags ? (
                  <p className="mt-2 text-xs text-white/45">Taggar: {item.tags}</p>
                ) : null}
                {item.allergens ? (
                  <p className="mt-1 text-xs text-amber-200/70">Allergener: {item.allergens}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${btnPrimary()} min-h-11 flex-1`}
                    onClick={() => openEdit(item)}
                  >
                    Redigera
                  </button>
                  <button
                    type="button"
                    className="min-h-11 flex-1 rounded border border-red-400/40 px-3 text-sm text-red-200"
                    onClick={() => setDeleteTarget(item)}
                  >
                    Radera
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/50">
            <p>
              Visar {items.length} av {totalCount} (sida {page})
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${btnSecondary()} min-h-11`}
                disabled={!hasPrev || itemsQuery.loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Föregående
              </button>
              <button
                type="button"
                className={`${btnSecondary()} min-h-11`}
                disabled={!hasNext || itemsQuery.loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Nästa
              </button>
            </div>
          </div>
        </>
      )}

      {/* Item dialog */}
      {dialog ? (
        <OpsDialog
          titleId="admin-menu-item-dialog"
          title={dialog.mode === 'create' ? 'Ny rätt' : 'Redigera rätt'}
          onClose={closeDialog}
        >
          <form className="mt-4 space-y-3" onSubmit={submitItem}>
            <div>
              <label htmlFor="ami-cat" className={labelClass()}>
                Kategori
              </label>
              <select
                id="ami-cat"
                className={inputClass()}
                required
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">Välj…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c, catById)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ami-name" className={labelClass()}>
                Namn
              </label>
              <input
                id="ami-name"
                className={inputClass()}
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="ami-desc" className={labelClass()}>
                Beskrivning
              </label>
              <textarea
                id="ami-desc"
                className={`${inputClass()} min-h-24 py-2`}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ami-price" className={labelClass()}>
                  Pris (SEK, Decimal)
                </label>
                <input
                  id="ami-price"
                  className={inputClass()}
                  inputMode="decimal"
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="139 eller 139.50"
                />
                <p className="mt-1 text-xs text-white/35">
                  Skickas som sträng till Django Decimal — ingen float-avrundning.
                </p>
              </div>
              <div>
                <label htmlFor="ami-order" className={labelClass()}>
                  Ordning
                </label>
                <input
                  id="ami-order"
                  className={inputClass()}
                  inputMode="numeric"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label htmlFor="ami-tags" className={labelClass()}>
                Taggar (kommaseparerat)
              </label>
              <input
                id="ami-tags"
                className={inputClass()}
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="Signature, Populär"
              />
            </div>
            <div>
              <label htmlFor="ami-all" className={labelClass()}>
                Allergener (kommaseparerat)
              </label>
              <input
                id="ami-all"
                className={inputClass()}
                value={form.allergens}
                onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
                placeholder="gluten, mjölk"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_available: e.target.checked }))
                  }
                />
                Tillgänglig (synlig på webbplatsen)
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_featured: e.target.checked }))
                  }
                />
                Utvald (startsida)
              </label>
            </div>
            <div>
              <label htmlFor="ami-img" className={labelClass()}>
                Bild
              </label>
              {dialog.mode === 'edit' && dialog.item?.image_url && !clearImage && !imageFile ? (
                <p className="mb-2 text-xs text-white/45">
                  Nuvarande bild finns. Ladda upp ny för att byta.
                </p>
              ) : null}
              <input
                id="ami-img"
                type="file"
                accept={MENU_ACCEPT_IMAGES}
                className="block w-full text-sm text-white/70 file:mr-3 file:min-h-11 file:rounded file:border-0 file:bg-gold file:px-3 file:text-dark"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null)
                  setClearImage(false)
                }}
              />
              {dialog.mode === 'edit' ? (
                <label className="mt-2 flex min-h-11 items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={clearImage}
                    onChange={(e) => {
                      setClearImage(e.target.checked)
                      if (e.target.checked) setImageFile(null)
                    }}
                  />
                  Ta bort bild
                </label>
              ) : null}
            </div>

            {saveError ? (
              <p
                className={
                  saveStatus === 403
                    ? 'text-sm text-amber-200'
                    : 'text-sm text-red-300'
                }
                role="alert"
              >
                {saveError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" className={btnPrimary()} disabled={saving}>
                {saving ? 'Sparar…' : 'Spara'}
              </button>
              <button type="button" className={btnSecondary()} onClick={closeDialog}>
                Avbryt
              </button>
            </div>
          </form>
        </OpsDialog>
      ) : null}

      {/* Category dialog */}
      {catDialog ? (
        <OpsDialog
          titleId="admin-menu-cat-dialog"
          title={catDialog.mode === 'create' ? 'Ny kategori' : 'Redigera kategori'}
          onClose={() => setCatDialog(null)}
        >
          <form className="mt-4 space-y-3" onSubmit={submitCategory}>
            <div>
              <label htmlFor="acat-name" className={labelClass()}>
                Namn
              </label>
              <input
                id="acat-name"
                className={inputClass()}
                required
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="acat-parent" className={labelClass()}>
                Överordnad (valfritt)
              </label>
              <select
                id="acat-parent"
                className={inputClass()}
                value={catForm.parent}
                onChange={(e) => setCatForm((f) => ({ ...f, parent: e.target.value }))}
              >
                <option value="">Ingen (huvudkategori)</option>
                {categories
                  .filter((c) => !catDialog.category || c.id !== catDialog.category.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="acat-desc" className={labelClass()}>
                Beskrivning
              </label>
              <textarea
                id="acat-desc"
                className={`${inputClass()} min-h-20 py-2`}
                value={catForm.description}
                onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="acat-order" className={labelClass()}>
                Ordning
              </label>
              <input
                id="acat-order"
                className={inputClass()}
                inputMode="numeric"
                value={catForm.order}
                onChange={(e) => setCatForm((f) => ({ ...f, order: e.target.value }))}
              />
            </div>
            {catError ? (
              <p className="text-sm text-red-300" role="alert">
                {catError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary()} disabled={catSaving}>
                {catSaving ? 'Sparar…' : 'Spara'}
              </button>
              <button
                type="button"
                className={btnSecondary()}
                onClick={() => setCatDialog(null)}
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
          titleId="admin-menu-delete"
          title="Radera rätt permanent?"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="mt-3 text-sm text-white/70">
            Du håller på att radera{' '}
            <strong className="text-white">{deleteTarget.name}</strong> (#{deleteTarget.id}).
            Detta går inte att ångra via Admin. Föredra &quot;Ej tillgänglig&quot; om du bara vill
            dölja rätten.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
