import { useEffect } from 'react'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl text-white sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
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
      <p className="text-sm uppercase tracking-widest text-gold/80">{label}</p>
    </div>
  )
}

export function EmptyState({ title = 'Inget att visa', message }) {
  return (
    <div className="rounded border border-white/10 bg-dark-2 px-4 py-8 text-center">
      <p className="font-heading text-lg text-white">{title}</p>
      {message ? <p className="mt-2 text-sm text-white/55">{message}</p> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="rounded border border-red-500/40 bg-red-950/30 px-4 py-6"
      role="alert"
    >
      <p className="text-sm text-red-200">{message || 'Något gick fel.'}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-11 rounded border border-gold/50 px-4 text-sm text-gold hover:bg-gold-dim"
        >
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
      className="rounded border border-amber-500/40 bg-amber-950/25 px-4 py-8"
      role="alert"
    >
      <p className="font-heading text-lg text-amber-100">Saknar behörighet</p>
      <p className="mt-2 text-sm text-amber-100/70">
        Ditt konto har inte tillgång till den här delen. API:t blockerar också
        obehöriga anrop.
      </p>
    </div>
  )
}

/**
 * Modal shell: Escape closes, backdrop click closes, labelled dialog.
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border border-white/15 bg-dark-2 p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="font-heading text-xl text-gold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
