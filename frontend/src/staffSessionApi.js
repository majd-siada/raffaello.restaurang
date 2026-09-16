/**
 * Shared session+CSRF fetch client for staff surfaces (/api/ops and /api/admin).
 * One implementation; callers pass the mount base path.
 */

export class StaffApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = 'StaffApiError'
    this.status = status
    this.body = body
  }
}

export function getCookie(name) {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function parseList(data) {
  if (Array.isArray(data)) return { results: data, count: data.length }
  if (data && Array.isArray(data.results)) {
    return {
      results: data.results,
      count: data.count ?? data.results.length,
      next: data.next,
      previous: data.previous,
    }
  }
  return { results: [], count: 0 }
}

/**
 * @param {string} base - e.g. '/api/ops' or '/api/admin'
 */
export function createStaffApi(base) {
  const BASE = base.replace(/\/$/, '')

  async function ensureCsrf() {
    let token = getCookie('csrftoken')
    if (token) return token
    await fetch(`${BASE}/auth/csrf/`, {
      method: 'GET',
      credentials: 'include',
    })
    token = getCookie('csrftoken')
    if (!token) {
      throw new StaffApiError('Kunde inte hämta CSRF-token.', { status: 0 })
    }
    return token
  }

  /**
   * @param {string} path
   * @param {RequestInit & { json?: unknown, formData?: FormData }} [options]
   */
  async function staffFetch(path, options = {}) {
    const { json, formData, headers: extraHeaders, ...rest } = options
    const method = (rest.method || 'GET').toUpperCase()
    const unsafe = !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)
    const headers = new Headers(extraHeaders || {})

    if (json !== undefined) {
      headers.set('Content-Type', 'application/json')
    }
    if (unsafe) {
      const csrf = await ensureCsrf()
      headers.set('X-CSRFToken', csrf)
    }

    const url = path.startsWith('http')
      ? path
      : `${BASE}${path.startsWith('/') ? path : `/${path}`}`

    const res = await fetch(url, {
      ...rest,
      method,
      credentials: 'include',
      headers,
      body: formData ?? (json !== undefined ? JSON.stringify(json) : rest.body),
    })

    const text = await res.text()
    let body = null
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }

    if (!res.ok) {
      const detail =
        (body && typeof body === 'object' && (body.detail || body.message)) ||
        (typeof body === 'string' ? body : null) ||
        `HTTP ${res.status}`
      throw new StaffApiError(
        typeof detail === 'string' ? detail : JSON.stringify(detail),
        { status: res.status, body },
      )
    }

    return body
  }

  async function staffList(path, query = {}) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
    })
    const qs = params.toString()
    const data = await staffFetch(`${path}${qs ? `?${qs}` : ''}`)
    return parseList(data)
  }

  return {
    BASE,
    ensureCsrf,
    staffFetch,
    staffList,
    getCookie,
    parseList,
    StaffApiError,
  }
}
