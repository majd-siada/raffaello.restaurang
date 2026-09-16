import { useCallback, useEffect, useState } from 'react'
import { OpsApiError } from './api'

/**
 * Load async data after mount / when deps change.
 * setState runs only after an await (same idea as public page .then chains).
 */
export function useOpsQuery(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState(null)
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
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(
          err instanceof OpsApiError
            ? err.message
            : err?.message || 'Något gick fel.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, [enabled, nonce, ...deps])

  return { data, loading, error, reload, setData }
}
