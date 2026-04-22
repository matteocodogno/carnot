import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../App'
import { apiUrl } from '../lib/api'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const { token, setToken } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Already logged in — go straight to dashboard
  if (token) {
    navigate('/dashboard')
    return null
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Invalid email or password')
        return
      }

      setToken(data.token)
      navigate('/dashboard')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isComplete = form.email.includes('@') && form.password.length >= 8

  return (
    <div className="login-page">
      {/* ─── Left panel ──────────────────────────────────────────────── */}
      <div className="login-left">
        <button
          className="nav-logo"
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', marginBottom: 'var(--space-16)' }}
        >
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </button>

        <div className="login-left-content">
          <h1 className="login-hero-title">
            Bentornato<br />
            <span style={{ color: 'var(--color-teal)' }}>nel tuo spazio</span><br />
            arCO₂.
          </h1>
          <p className="login-hero-sub">
            Accedi per consultare il tuo dossier edificio, i percorsi di
            efficientamento personalizzati e comunicare con il tuo consulente.
          </p>

          <div className="login-perks">
            {[
              { icon: '📁', text: 'Il tuo dossier edificio digitale' },
              { icon: '🗺️', text: 'Percorsi di efficientamento aggiornati' },
              { icon: '👤', text: 'Messaggi con il tuo consulente arCO₂' },
              { icon: '💶', text: 'Incentivi e documentazione disponibili' },
            ].map((p) => (
              <div key={p.text} className="login-perk">
                <span className="perk-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right panel ──────────────────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Accedi al tuo account</h2>
            <p>Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="marco.rossi@email.ch"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
                <Link to="#" className="login-forgot" tabIndex={-1}>
                  Password dimenticata?
                </Link>
              </label>
              <div className="password-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="La tua password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isComplete || loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <><span className="spinner"></span> Accesso in corso...</>
              ) : (
                'Accedi alla dashboard →'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>Nuovo utente?</span>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => navigate('/questionario')}
          >
            Fai il questionario gratuito →
          </button>

          <div className="login-register-link">
            Hai già fatto il questionario?{' '}
            <Link to="/registrati">Crea il tuo account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
