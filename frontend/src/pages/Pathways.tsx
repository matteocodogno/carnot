import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import './Pathways.css'

interface PathwayCard {
  id: string
  icon: string
  title: string
  subtitle: string
  description: string
  savingsRange: string
  costRange: string
  maxIncentive: string
  duration: string
  co2Reduction: string
  label: string
  labelColor: 'green' | 'blue' | 'yellow'
  highlights: string[]
}

const PATHWAYS: PathwayCard[] = [
  {
    id: 'involucro',
    icon: '🏠',
    title: 'Risanamento involucro',
    subtitle: 'Isolamento termico dell\'edificio',
    description: 'Isolamento di tetto, pareti e solaio per ridurre le dispersioni termiche e migliorare il comfort abitativo in ogni stagione.',
    savingsRange: 'CHF 800 – 2\'400 / anno',
    costRange: 'CHF 20\'000 – 80\'000',
    maxIncentive: 'fino a CHF 25\'000',
    duration: '3 – 8 settimane',
    co2Reduction: '2.5 – 6 t CO₂ / anno',
    label: 'Alto impatto',
    labelColor: 'green',
    highlights: [
      'Riduzione fino al 40% dei consumi termici',
      'Incentivi cantonali fino al 30% del costo',
      'Aumento del valore immobiliare',
      'Comfort estate e inverno',
    ],
  },
  {
    id: 'riscaldamento',
    icon: '♨️',
    title: 'Sostituzione riscaldamento',
    subtitle: 'Da caldaia fossile a pompa di calore',
    description: 'Sostituzione della caldaia a gas o olio con una pompa di calore ad alta efficienza, eliminando le emissioni dirette di CO₂.',
    savingsRange: 'CHF 600 – 1\'800 / anno',
    costRange: 'CHF 15\'000 – 45\'000',
    maxIncentive: 'fino a CHF 15\'000',
    duration: '1 – 2 settimane',
    co2Reduction: '3 – 7 t CO₂ / anno',
    label: 'Priorità alta',
    labelColor: 'green',
    highlights: [
      'Efficienza 3x rispetto alle caldaie tradizionali',
      'Incentivi federali e cantonali cumulabili',
      'Possibile abbinamento con fotovoltaico',
      'Manutenzione ridotta nel lungo periodo',
    ],
  },
  {
    id: 'fotovoltaico',
    icon: '☀️',
    title: 'Fotovoltaico + accumulo',
    subtitle: 'Produzione e stoccaggio di energia solare',
    description: 'Installazione di pannelli fotovoltaici con sistema di accumulo per massimizzare l\'autoconsumo e ridurre la dipendenza dalla rete.',
    savingsRange: 'CHF 400 – 1\'200 / anno',
    costRange: 'CHF 12\'000 – 35\'000',
    maxIncentive: 'fino a CHF 8\'000',
    duration: '1 – 3 settimane',
    co2Reduction: '1.5 – 4 t CO₂ / anno',
    label: 'Molto richiesto',
    labelColor: 'blue',
    highlights: [
      'Autoconsumo fino al 70% con accumulo',
      'OBE federale per nuovi impianti',
      'Ideale in combinazione con pompa di calore',
      'Ritorno sull\'investimento in 8 – 12 anni',
    ],
  },
  {
    id: 'vmc',
    icon: '💨',
    title: 'Ventilazione meccanica controllata',
    subtitle: 'Aria fresca senza perdere calore',
    description: 'Sistema VMC con recupero di calore per garantire qualità dell\'aria ottimale riducendo le perdite energetiche da ricambio d\'aria.',
    savingsRange: 'CHF 200 – 600 / anno',
    costRange: 'CHF 6\'000 – 18\'000',
    maxIncentive: 'fino a CHF 4\'000',
    duration: '1 – 2 settimane',
    co2Reduction: '0.5 – 1.5 t CO₂ / anno',
    label: 'Comfort',
    labelColor: 'yellow',
    highlights: [
      'Recupero del calore fino all\'85%',
      'Riduzione umidità e muffe',
      'Migliore qualità dell\'aria indoor',
      'Consigliato dopo interventi di isolamento',
    ],
  },
  {
    id: 'cece',
    icon: '📋',
    title: 'Certificazione CECE',
    subtitle: 'Certificato energetico cantonale',
    description: 'Ottenimento del certificato energetico cantonale degli edifici (CECE) per valutare lo stato attuale e pianificare gli interventi futuri.',
    savingsRange: 'Base per tutti i percorsi',
    costRange: 'CHF 500 – 1\'500',
    maxIncentive: 'fino a CHF 800',
    duration: '1 – 2 settimane',
    co2Reduction: 'Fondamentale per pianificare',
    label: 'Punto di partenza',
    labelColor: 'yellow',
    highlights: [
      'Obbligatorio per molti incentivi cantonali',
      'Valutazione oggettiva dell\'edificio',
      'Roadmap personalizzata degli interventi',
      'Valido 10 anni per vendita o affitto',
    ],
  },
]

const stats = [
  { value: 'CHF 1\'200', label: 'Risparmio medio annuo', icon: '💰' },
  { value: '4.5 t', label: 'CO₂ evitata per edificio', icon: '🌿' },
  { value: '30%', label: 'Incentivi medi disponibili', icon: '💶' },
  { value: '800+', label: 'Edifici già risanati in Ticino', icon: '🏘️' },
]

export default function Pathways() {
  const navigate = useNavigate()
  const { token } = useAuth()

  return (
    <div className="pathways-page">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <header className="pathways-nav">
        <div className="nav-container">
          <button className="nav-logo" onClick={() => navigate('/')} style={{ background: 'none', border: 'none' }}>
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </button>
          <nav className="nav-links">
            <button className="nav-link-btn" onClick={() => navigate('/')}>Home</button>
            <span className="nav-link-active">Percorsi</span>
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
      <section className="pathways-hero">
        <div className="pathways-hero-inner">
          <div className="pathways-hero-badge">5 percorsi di efficientamento energetico</div>
          <h1 className="pathways-hero-title">
            Ogni edificio ha<br />
            <span className="pathways-hero-accent">il suo percorso ideale</span>
          </h1>
          <p className="pathways-hero-sub">
            Dalla semplice certificazione al risanamento completo: scopri gli interventi disponibili,
            i costi reali, gli incentivi cumulabili e i risparmi attesi per il tuo edificio in Ticino.
          </p>
          <div className="pathways-hero-cta">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/questionario')}>
              Scopri il percorso per il tuo edificio →
            </button>
            <span className="pathways-hero-note">Questionario gratuito · 5 minuti · Nessun obbligo</span>
          </div>
        </div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────── */}
      <section className="pathways-stats">
        <div className="pathways-stats-inner">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pathway cards ───────────────────────────────────────────────── */}
      <section className="pathways-cards-section">
        <div className="pathways-cards-inner">
          <div className="pathways-section-header">
            <h2>I 5 percorsi arCO₂</h2>
            <p>Seleziona un percorso per scoprire costi, incentivi e risparmio atteso</p>
          </div>

          <div className="pathways-cards">
            {PATHWAYS.map((p) => (
              <article key={p.id} className="pathway-card">
                <div className="pathway-card-header">
                  <div className="pathway-icon">{p.icon}</div>
                  <div className="pathway-label-wrap">
                    <span className={`pathway-label pathway-label-${p.labelColor}`}>{p.label}</span>
                  </div>
                </div>

                <h3 className="pathway-title">{p.title}</h3>
                <p className="pathway-subtitle">{p.subtitle}</p>
                <p className="pathway-desc">{p.description}</p>

                <div className="pathway-metrics">
                  <div className="pathway-metric">
                    <span className="metric-label">Risparmio atteso</span>
                    <span className="metric-value metric-savings">{p.savingsRange}</span>
                  </div>
                  <div className="pathway-metric">
                    <span className="metric-label">Costo stimato</span>
                    <span className="metric-value">{p.costRange}</span>
                  </div>
                  <div className="pathway-metric">
                    <span className="metric-label">Incentivo max</span>
                    <span className="metric-value metric-incentive">{p.maxIncentive}</span>
                  </div>
                  <div className="pathway-metric">
                    <span className="metric-label">Riduzione CO₂</span>
                    <span className="metric-value metric-co2">{p.co2Reduction}</span>
                  </div>
                </div>

                <div className="pathway-highlights">
                  <p className="pathway-highlights-title">Punti chiave</p>
                  <ul className="pathway-highlights-list">
                    {p.highlights.map((h) => (
                      <li key={h}>
                        <span className="highlight-check">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pathway-footer">
                  <span className="pathway-duration">⏱ Durata: {p.duration}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA section ─────────────────────────────────────────────────── */}
      <section className="pathways-cta-section">
        <div className="pathways-cta-inner">
          <div className="pathways-cta-badge">Gratuito e senza impegno</div>
          <h2 className="pathways-cta-title">
            Qual è il percorso giusto<br />per il tuo edificio?
          </h2>
          <p className="pathways-cta-sub">
            In 5 minuti il nostro questionario analizza il tuo edificio e ti indica
            i percorsi prioritari, gli incentivi disponibili e i risparmi attesi.
            Poi un consulente arCO₂ ti accompagna in ogni fase.
          </p>
          <button className="btn btn-primary btn-lg pathways-cta-btn" onClick={() => navigate('/questionario')}>
            Inizia il questionario gratuito →
          </button>
          <div className="pathways-cta-features">
            <span>✓ Risultati immediati</span>
            <span>✓ Nessun obbligo</span>
            <span>✓ Consulente dedicato</span>
            <span>✓ Dati protetti (LPD)</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="pathways-footer">
        <div className="pathways-footer-inner">
          <div className="footer-logo">
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
            <span className="footer-logo-by">by TicinoEnergia</span>
          </div>
          <p className="footer-copy">© 2026 TicinoEnergia. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  )
}
