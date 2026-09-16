/** Lightweight className joiner (no external deps). */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
