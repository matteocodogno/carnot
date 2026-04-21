import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, useQuestionnaire } from '../App'
import './Register.css'

const COMUNI_TICINO = [
  'Bellinzona', 'Lugano', 'Locarno', 'Mendrisio', 'Biasca',
  'Chiasso', 'Giubiasco', 'Lodrino', 'Minusio', 'Muralto',
  'Paradiso', 'Ponte Capriasca', 'Rivera', 'Sorengo',
  'Tenero-Contra', 'Vezia', 'Viganello', 'Altro comune',
]

export default function Register() {
  const navigate = useNavigate()
  const { setToken } = useAuth()
  const { tempToken } = useQuestionnaire()

  const [form, setForm] = useState({
    nome: '', cognome: '', email: '',
    password: '', comune: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function validate(): string | null {
    if (!form.nome.trim()) return 'Inserisci il tuo nome'
    if (!form.cognome.trim()) return 'Inserisci il tuo cognome'
    if (!form.email.includes('@')) return 'Inserisci un\'email valida'
    if (form.password.length < 8) return 'La password deve avere almeno 8 caratteri'
    if (!form.comune) return 'Seleziona il tuo comune'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tempToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Errore di registrazione')
        return
      }

      setToken(data.token)
      navigate('/dashboard')
    } catch {
      setError('Errore di rete. Riprova tra qualche istante.')
    } finally {
      setLoading(false)
    }
  }

  const isComplete = form.nome && form.cognome && form.email &&
    form.password.length >= 8 && form.comune

  return (
    <div className="register-page">
      {/* ─── Left panel ──────────────────────────────────────────────── */}
      <div className="register-left">
        <button className="nav-logo" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', marginBottom: 'var(--space-16)' }}>
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </button>

        <div className="register-left-content">
          <h1 className="register-hero-title">
            Il tuo percorso<br />
            <span style={{ color: 'var(--color-teal)' }}>verso l'efficienza</span><br />
            inizia qui.
          </h1>
          <p className="register-hero-sub">
            Crea il tuo account gratuito e accedi subito ai risultati del questionario,
            al tuo consulente arCO₂ e a tutti gli strumenti della piattaforma.
          </p>
          <div className="register-perks">
            {[
              { icon: '🎯', text: 'Percorsi personalizzati per il tuo edificio' },
              { icon: '👤', text: 'Un consulente arCO₂ dedicato' },
              { icon: '💶', text: 'Accesso a tutti gli incentivi disponibili' },
              { icon: '🔒', text: 'Dati protetti, nessuna cessione a terzi' },
            ].map((p) => (
              <div key={p.text} className="register-perk">
                <span className="perk-icon">{p.icon}</span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Right panel ──────────────────────────────────────────────── */}
      <div className="register-right">
        <div className="register-form-wrapper">
          <div className="register-form-header">
            <h2>Crea il tuo account</h2>
            <p>Gratuito, senza obblighi</p>
          </div>

          {tempToken && (
            <div className="register-questionnaire-badge">
              ✅ Il tuo questionario è stato salvato — accederai subito ai risultati
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form" noValidate>
            <div className="register-name-row">
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.nome}
                  onChange={(e) => update('nome', e.target.value)}
                  placeholder="Marco"
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cognome</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.cognome}
                  onChange={(e) => update('cognome', e.target.value)}
                  placeholder="Rossi"
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="marco.rossi@email.ch"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-wrapper">
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Almeno 8 caratteri"
                  autoComplete="new-password"
                  required
                  minLength={8}
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
              {form.password && (
                <div className={`password-strength ${form.password.length >= 12 ? 'strong' : form.password.length >= 8 ? 'medium' : 'weak'}`}>
                  {form.password.length >= 12 ? '✅ Password sicura' : form.password.length >= 8 ? '⚠️ Password sufficiente' : '❌ Troppo corta'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Comune di residenza</label>
              <select
                className="form-input"
                value={form.comune}
                onChange={(e) => update('comune', e.target.value)}
                required
              >
                <option value="">Seleziona il comune...</option>
                {COMUNI_TICINO.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="register-error">
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
                <><span className="spinner"></span> Creazione account...</>
              ) : (
                'Crea account e accedi alla dashboard →'
              )}
            </button>

            <p className="register-terms">
              Registrandoti accetti la <a href="#privacy">Privacy Policy</a> di arCO₂ / TicinoEnergia.
              I tuoi dati sono trattati in conformità al LPD svizzero.
            </p>
          </form>

          <div className="register-login-link">
            Hai già un account? <Link to="/">Accedi</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
