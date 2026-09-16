import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './AuthContext'
import { AdminApiError } from './api'
import { btnPrimary, inputClass, labelClass } from './format'
import { LoadingState } from './ui'
import './admin.css'

export default function AdminLoginPage() {
  const { authenticated, loading, login } = useAdminAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (loading) {
    return (
      <div className="admin-app min-h-screen bg-bg">
        <LoadingState />
      </div>
    )
  }
  if (authenticated) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : 'Inloggning misslyckades.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-app flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="admin-card w-full max-w-md p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/85">
          Personal
        </p>
        <h1 className="mt-2 font-heading text-2xl text-cream">Raffaello Admin</h1>
        <p className="mt-2 text-sm text-muted">Logga in med personalkonto</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="admin-user" className={labelClass()}>
              Användarnamn
            </label>
            <input
              id="admin-user"
              className={inputClass()}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="admin-pass" className={labelClass()}>
              Lösenord
            </label>
            <input
              id="admin-pass"
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
