import { useCallback, useEffect, useState } from 'react'
import { AdminApiError } from './api'

/**
 * Admin data loader — same pattern as Ops useOpsQuery; uses AdminApiError.
 */
export function useAdminQuery(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
  const [errorStatus, setErrorStatus] = useState(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => {
    setLoading(true)
    setNonce((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }
    let cancelled = false

    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      try {
        const result = await fetcher()
        if (cancelled) return
        setData(result)
        setError(null)
        setErrorStatus(null)
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(
          err instanceof AdminApiError
            ? err.message
            : err?.message || 'Något gick fel.',
        )
        setErrorStatus(err instanceof AdminApiError ? err.status : null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, [enabled, nonce, ...deps])

  return { data, loading, error, errorStatus, reload, setData }
}
