import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import './Landing.css'

const features = [
  { icon: '🧭', title: 'Orientamento personalizzato', desc: 'Un questionario breve analizza il tuo edificio e identifica i percorsi di efficientamento più adatti.' },
  { icon: '📁', title: 'Dossier edificio digitale', desc: 'Tutti i documenti, i dati tecnici e lo storico degli interventi raccolti in un unico spazio sicuro.' },
  { icon: '💶', title: 'Accesso a incentivi', desc: 'Ti guidiamo tra contributi cantonali, federali e finanziamenti verdi disponibili per il tuo intervento.' },
  { icon: '🤝', title: 'Consulente dedicato', desc: 'Un consulente arCO₂ certificato ti segue dall\'orientamento iniziale fino alla chiusura del progetto.' },
  { icon: '🏗️', title: 'Rete di professionisti', desc: 'Accedi a professionisti e artigiani qualificati del territorio ticinese per preventivi e realizzazione.' },
  { icon: '📊', title: 'Monitoraggio risultati', desc: 'Tieni traccia dei consumi energetici post-intervento e misura i risparmi reali nel tempo.' },
]

const steps = [
  { num: '01', label: 'Questionario', desc: '5 minuti per capire il tuo edificio' },
  { num: '02', label: 'Dossier', desc: 'Raccolta dati tecnici e documentali' },
  { num: '03', label: 'Consulenza', desc: 'Analisi con il tuo consulente arCO₂' },
  { num: '04', label: 'Intervento', desc: 'Preventivi, finanziamento, realizzazione' },
  { num: '05', label: 'Monitoraggio', desc: 'Misura i risparmi nel tempo' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { token } = useAuth()

  return (
    <div className="landing">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </div>
          <nav className="nav-links">
            <a href="#come-funziona">Come funziona</a>
            <button className="nav-link-page-btn" onClick={() => navigate('/percorsi')}>Percorsi</button>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="nav-cta">
            {token ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
                Vai alla dashboard →
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/accedi')}>
                  Accedi
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/questionario')}>
                  Inizia ora
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Progetto TicinoEnergia · Cantone Ticino
          </div>
          <h1 className="hero-title">
            La tua casa,<br />
            <span className="hero-title-accent">più efficiente.</span>
          </h1>
          <p className="hero-subtitle">
            arCO₂ è la piattaforma digitale del Cantone Ticino per guidare i privati
            nella transizione energetica. Dall'orientamento iniziale agli incentivi,
            fino al monitoraggio dei risultati.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/questionario')}>
              Scopri i percorsi per il tuo edificio →
            </button>
            <p className="hero-note">Questionario gratuito · 5 minuti · Nessun impegno</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">–50%</span>
              <span className="hero-stat-label">risparmio energetico potenziale</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">CHF 43K</span>
              <span className="hero-stat-label">incentivi massimi disponibili</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-value">10 moduli</span>
              <span className="hero-stat-label">di accompagnamento completo</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-float hero-card-1">
            <span className="hc-icon">☀️</span>
            <div>
              <div className="hc-title">Fotovoltaico consigliato</div>
              <div className="hc-desc">Risparmio stimato: 30–50%</div>
            </div>
          </div>
          <div className="hero-card-float hero-card-2">
            <span className="hc-icon">✅</span>
            <div>
              <div className="hc-title">Incentivo disponibile</div>
              <div className="hc-desc">Programma Edifici · CHF 18.000</div>
            </div>
          </div>
          <div className="hero-card-float hero-card-3">
            <span className="hc-icon">👤</span>
            <div>
              <div className="hc-title">Marco B. — Consulente arCO₂</div>
              <div className="hc-desc">Disponibile Lun–Ven 8:30–17:30</div>
            </div>
          </div>
          <div className="hero-building">
            <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" className="building-svg">
              <rect x="30" y="80" width="140" height="130" rx="4" fill="#e0f4f7" stroke="#1b6b77" strokeWidth="2"/>
              <rect x="20" y="75" width="160" height="15" rx="3" fill="#1b6b77"/>
              <rect x="50" y="100" width="30" height="35" rx="3" fill="#b2e0e8"/>
              <rect x="120" y="100" width="30" height="35" rx="3" fill="#b2e0e8"/>
              <rect x="85" y="130" width="30" height="80" rx="3" fill="#1b6b77" opacity="0.15"/>
              <rect x="85" y="130" width="30" height="80" rx="3" stroke="#1b6b77" strokeWidth="1.5" fill="none"/>
              <rect x="55" y="50" width="90" height="30" rx="3" fill="#1b6b77" opacity="0.12" stroke="#1b6b77" strokeWidth="1.5"/>
              <line x1="60" y1="50" x2="60" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <line x1="75" y1="50" x2="75" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <line x1="90" y1="50" x2="90" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <line x1="105" y1="50" x2="105" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <line x1="120" y1="50" x2="120" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <line x1="135" y1="50" x2="135" y2="75" stroke="#1b6b77" strokeWidth="1" opacity="0.4"/>
              <circle cx="100" cy="25" r="15" fill="#e9c46a" opacity="0.9"/>
              <line x1="100" y1="5" x2="100" y2="1" stroke="#e9c46a" strokeWidth="2"/>
              <line x1="100" y1="45" x2="100" y2="49" stroke="#e9c46a" strokeWidth="2"/>
              <line x1="80" y1="25" x2="76" y2="25" stroke="#e9c46a" strokeWidth="2"/>
              <line x1="120" y1="25" x2="124" y2="25" stroke="#e9c46a" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ─── Come funziona ────────────────────────────────────────────────── */}
      <section id="come-funziona" className="section section-steps">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Percorso guidato</span>
            <h2>Come funziona arCO₂</h2>
            <p>Un percorso strutturato in 10 moduli, dall'orientamento al monitoraggio post-intervento.</p>
          </div>
          <div className="steps-row">
            {steps.map((s, i) => (
              <div key={s.num} className="step-item">
                <div className={`step-num ${i === 0 ? 'step-active' : ''}`}>{s.num}</div>
                {i < steps.length - 1 && <div className="step-connector"></div>}
                <div className="step-label">{s.label}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────── */}
      <section className="section section-features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Funzionalità</span>
            <h2>Tutto ciò di cui hai bisogno</h2>
            <p>Una piattaforma completa per accompagnarti in ogni fase del tuo percorso energetico.</p>
          </div>
          <div className="features-grid">
            {features.map((f) => (
              <div key={f.title} className="feature-card card">
                <span className="feature-icon">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─────────────────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="cta-band-container">
          <div className="cta-band-text">
            <h2>Inizia oggi stesso</h2>
            <p>Il questionario è gratuito e richiede solo 5 minuti. Scopri quali percorsi sono adatti al tuo edificio e a quanti incentivi puoi accedere.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/questionario')} style={{ background: 'white', color: 'var(--color-primary)' }}>
            Fai il questionario gratuito →
          </button>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </div>
          <p className="footer-copy">
            Un progetto di <strong>TicinoEnergia</strong> · Cantone Ticino · Demo Modulo 1
          </p>
          <p className="footer-note">
            Questa è una demo funzionante sviluppata da <strong>WellD</strong> per la RFP arCO₂ · Aprile 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
