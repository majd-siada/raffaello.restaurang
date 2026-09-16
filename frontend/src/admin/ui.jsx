import { useEffect } from 'react'
import { btnSecondary } from './format'

/**
 * Consistent Admin page header (Riva-like hierarchy).
 * @param {string} [eyebrow] — group label e.g. INNEHÅLL
 */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl tracking-[-0.02em] text-cream">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  )
}

export function LoadingState({ label = 'Laddar…' }) {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-gold/80">{label}</p>
    </div>
  )
}

export function EmptyState({ title = 'Inget att visa', message, action }) {
  return (
    <div className="rounded-sm border border-cream/10 bg-elevated px-5 py-10 text-center">
      <p className="font-heading text-lg text-cream">{title}</p>
      {message ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="rounded-sm border border-red-400/35 bg-red-950/25 px-4 py-6"
      role="alert"
    >
      <p className="text-sm text-red-100/90">{message || 'Något gick fel.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className={`${btnSecondary()} mt-3`}>
          Försök igen
        </button>
      ) : null}
    </div>
  )
}

/** Distinct from EmptyState — permission denial is not an empty dataset. */
export function ForbiddenState() {
  return (
    <div
      className="rounded-sm border border-amber-400/40 bg-amber-950/30 px-5 py-8"
      role="alert"
    >
      <p className="font-heading text-lg text-amber-50">Saknar behörighet</p>
      <p className="mt-2 text-sm text-amber-100/70">
        Ditt konto har inte tillgång till den här delen. API:t blockerar också
        obehöriga anrop.
      </p>
    </div>
  )
}

/**
 * Admin modal: Escape, backdrop, labelled dialog — dark card surface.
 */
export function OpsDialog({ titleId, title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-cream/12 bg-elevated p-5 shadow-[var(--shadow-card)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="font-heading text-xl text-cream">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

/** Alias — pages may import AdminDialog or OpsDialog. */
export const AdminDialog = OpsDialog
