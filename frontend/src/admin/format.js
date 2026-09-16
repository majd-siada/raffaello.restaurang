/** Admin-scoped button / form class helpers (Riva visual quality, Raffaello gold). */

export function btnPrimary() {
  return 'admin-btn admin-btn-primary inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-4 text-sm font-medium tracking-wide text-dark transition-colors hover:bg-gold-hover disabled:pointer-events-none disabled:opacity-50'
}

export function btnSecondary() {
  return 'admin-btn admin-btn-secondary inline-flex min-h-11 items-center justify-center rounded-sm border border-gold/45 bg-transparent px-4 text-sm tracking-wide text-gold transition-colors hover:bg-gold/10 disabled:pointer-events-none disabled:opacity-50'
}

export function btnDanger() {
  return 'admin-btn admin-btn-danger inline-flex min-h-11 items-center justify-center rounded-sm border border-red-400/45 bg-transparent px-4 text-sm tracking-wide text-red-200/90 transition-colors hover:bg-red-950/35 disabled:pointer-events-none disabled:opacity-50'
}

export function btnGhost() {
  return 'admin-btn admin-btn-ghost inline-flex min-h-11 items-center justify-center rounded-sm px-3 text-sm tracking-wide text-cream/70 transition-colors hover:bg-white/5 hover:text-cream disabled:opacity-50'
}

export function inputClass() {
  return 'admin-input min-h-11 w-full rounded-sm border border-cream/15 bg-bg px-3 text-cream placeholder:text-muted/70 outline-none transition-colors focus:border-gold'
}

export function labelClass() {
  return 'admin-label mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted'
}

export { formatDateTime, yesNo } from '../ops/opsFormat'
