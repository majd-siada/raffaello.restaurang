export function btnPrimary() {
  return 'inline-flex min-h-11 items-center justify-center rounded bg-gold px-4 text-sm font-medium text-dark hover:bg-gold-hover disabled:opacity-50'
}

export function btnSecondary() {
  return 'inline-flex min-h-11 items-center justify-center rounded border border-gold/40 px-4 text-sm text-gold hover:bg-gold-dim disabled:opacity-50'
}

export function btnDanger() {
  return 'inline-flex min-h-11 items-center justify-center rounded border border-red-400/50 px-4 text-sm text-red-200 hover:bg-red-950/40 disabled:opacity-50'
}

export function inputClass() {
  return 'min-h-11 w-full rounded border border-white/15 bg-dark px-3 text-white placeholder:text-white/35 focus:border-gold'
}

export function labelClass() {
  return 'mb-1 block text-xs uppercase tracking-wider text-white/50'
}

export function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('sv-SE')
  } catch {
    return String(value)
  }
}

export function yesNo(v) {
  return v ? 'Ja' : 'Nej'
}
