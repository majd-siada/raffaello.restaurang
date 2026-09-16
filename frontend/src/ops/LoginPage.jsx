import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { OpsApiError } from './api'
import { btnPrimary, inputClass, labelClass } from './opsFormat'
import { LoadingState } from './ui'

export default function LoginPage() {
  const { authenticated, loading, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (loading) return <LoadingState />
  if (authenticated) return <Navigate to="/ops" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/ops', { replace: true })
    } catch (err) {
      setError(
        err instanceof OpsApiError
          ? err.message
          : 'Inloggning misslyckades.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-md rounded border border-white/10 bg-dark-2 p-6 sm:p-8">
        <h1 className="font-heading text-2xl text-gold">Raffaello Ops</h1>
        <p className="mt-2 text-sm text-white/55">Logga in med personalkonto</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="ops-user" className={labelClass()}>
              Användarnamn
            </label>
            <input
              id="ops-user"
              className={inputClass()}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="ops-pass" className={labelClass()}>
              Lösenord
            </label>
            <input
              id="ops-pass"
              type="password"
              className={inputClass()}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className={`${btnPrimary()} w-full`} disabled={submitting}>
            {submitting ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  )
}
