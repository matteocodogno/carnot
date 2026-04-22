import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../App'
import { Pathway } from '../types'
import { apiUrl } from '../lib/api'
import './PathwayDetail.css'

// ─── Timeline phases per pathway ──────────────────────────────────────────────

interface Phase {
  title: string
  description: string
  duration: string
  icon: string
  docs: string[]
}

const PHASES: Record<string, Phase[]> = {
  isolation: [
    { title: 'Audit energetico CECE', description: 'Sopralluogo da parte di un certificatore accreditato per definire lo stato attuale e la classe energetica di partenza.', duration: '1–3 giorni', icon: '📋', docs: ['Planimetria edificio', 'Bollette energetiche ultimi 2 anni', 'Documenti di proprietà'] },
    { title: 'Progettazione e preventivi', description: 'Definizione del pacchetto isolante ottimale (spessori, materiali, ponti termici) e raccolta di almeno 3 preventivi da imprese qualificate.', duration: '2–4 settimane', icon: '📐', docs: ['Elaborati tecnici', 'Preventivi imprese', 'Specifiche materiali'] },
    { title: 'Richiesta incentivi', description: 'Presentazione della domanda al Cantone Ticino e al Programma Edifici federale prima dell\'avvio dei lavori.', duration: '2–6 settimane', icon: '💶', docs: ['Modulo domanda incentivi', 'Scheda tecnica impianto', 'Offerta lavori firmata'] },
    { title: 'Esecuzione lavori', description: 'Posa dell\'isolante, sostituzione infissi e rifacimento facciate secondo il progetto approvato.', duration: '4–8 settimane', icon: '🏗️', docs: ['Autorizzazione edilizia (se necessaria)', 'Contratto appalto'] },
    { title: 'Collaudo e consuntivo', description: 'Verifica dei lavori eseguiti, emissione del nuovo certificato CECE e liquidazione degli incentivi.', duration: '1 settimana', icon: '✅', docs: ['Fatture lavori', 'Dichiarazione fine lavori', 'Nuovo certificato CECE'] },
  ],
  heating: [
    { title: 'Analisi del carico termico', description: 'Calcolo del fabbisogno termico dell\'edificio per dimensionare correttamente la pompa di calore.', duration: '1–2 giorni', icon: '🌡️', docs: ['Planimetria edificio', 'Bollette gas/olio 3 anni'] },
    { title: 'Scelta e preventivi', description: 'Selezione della tipologia di pompa di calore (aria-acqua, acqua-acqua, geotermia) e raccolta preventivi.', duration: '1–2 settimane', icon: '📋', docs: ['Preventivi installatori', 'Schede tecniche pompe di calore'] },
    { title: 'Richiesta incentivi', description: 'Domanda per il Programma Edifici, ProKilowatt e contributi cantonali per la sostituzione riscaldamento fossile.', duration: '2–4 settimane', icon: '💶', docs: ['Modulo richiesta incentivi', 'Attestato efficienza impianto'] },
    { title: 'Smontaggio e installazione', description: 'Rimozione caldaia esistente e installazione pompa di calore con eventuali adeguamenti idraulici.', duration: '1–2 settimane', icon: '🔧', docs: ['Contratto installazione', 'Permesso scarico acque (se necessario)'] },
    { title: 'Collaudo e messa in servizio', description: 'Test di funzionamento, taratura parametri, formazione sull\'utilizzo e liquidazione incentivi.', duration: '2–3 giorni', icon: '✅', docs: ['Verbale collaudo', 'Fatture installazione', 'Libretto di impianto'] },
  ],
  photovoltaic: [
    { title: 'Studio di fattibilità', description: 'Analisi dell\'orientamento del tetto, calcolo ombreggiatura, stima producibilità annua e ritorno sull\'investimento.', duration: '1–3 giorni', icon: '☀️', docs: ['Planimetria copertura', 'Bollette elettriche 2 anni'] },
    { title: 'Progettazione e preventivi', description: 'Dimensionamento impianto, scelta pannelli e inverter, preventivi da installatori accreditati.', duration: '1–2 settimane', icon: '📐', docs: ['Preventivi installatori', 'Schema elettrico', 'Scheda tecnica pannelli'] },
    { title: 'Richiesta RIC e incentivi', description: 'Registrazione sul portale Pronovo per la Rimunerazione per l\'Immissione in Rete (RIC) e eventuali incentivi comunali.', duration: '2–4 settimane', icon: '💶', docs: ['Modulo Pronovo', 'Specifiche tecniche impianto', 'Preventivo installatore'] },
    { title: 'Installazione', description: 'Posa pannelli, connessione inverter, installazione sistema di accumulo e allacciamento alla rete.', duration: '2–5 giorni', icon: '⚡', docs: ['Comunicazione gestore rete', 'Contratto installazione'] },
    { title: 'Allacciamento e produzione', description: 'Allacciamento ufficiale alla rete, attivazione contatore bidirezionale e inizio produzione incentivata.', duration: '1–2 settimane', icon: '✅', docs: ['Fatture installazione', 'Dichiarazione conformità impianto', 'Contratto RIC'] },
  ],
  vmc: [
    { title: 'Analisi ventilazione esistente', description: 'Verifica dello stato attuale del ricambio d\'aria e del rischio condensa e muffe nell\'edificio.', duration: '1 giorno', icon: '💨', docs: ['Planimetria edificio', 'Rilievo umidità'] },
    { title: 'Progettazione e preventivi', description: 'Dimensionamento del sistema (centralizzato o decentralizzato) e raccolta preventivi da installatori specializzati.', duration: '1–2 settimane', icon: '📐', docs: ['Preventivi installatori', 'Schema distribuzione aria', 'Schede tecniche VMC'] },
    { title: 'Domanda incentivi', description: 'Verifica idoneità ai contributi del Programma Edifici complementari all\'isolamento termico.', duration: '2–3 settimane', icon: '💶', docs: ['Modulo incentivi Cantone', 'Attestato efficienza energetica VMC'] },
    { title: 'Installazione', description: 'Posa centralina VMC, distribuzione canalizzazioni e installazione bocchette nelle stanze principali.', duration: '1–2 settimane', icon: '🔧', docs: ['Contratto installazione', 'Permessi murari (se necessari)'] },
    { title: 'Taratura e messa in servizio', description: 'Bilanciamento portate aria, misurazione qualità dell\'aria e formazione sull\'uso del sistema.', duration: '1–2 giorni', icon: '✅', docs: ['Verbale collaudo', 'Fatture', 'Manuale utente'] },
  ],
  certification: [
    { title: 'Scelta certificatore', description: 'Ricerca di un certificatore CECE accreditato dall\'UACER (Ufficio dell\'aria, del clima e delle energie rinnovabili).', duration: '1–3 giorni', icon: '🔍', docs: ['Elenco certificatori UACER'] },
    { title: 'Sopralluogo tecnico', description: 'Visita in loco del certificatore per rilevare caratteristiche costruttive, impianti e consumi energetici.', duration: '2–4 ore', icon: '📋', docs: ['Planimetrie disponibili', 'Bollette energetiche', 'Documentazione tecnica impianti'] },
    { title: 'Elaborazione certificato', description: 'Calcolo della classe energetica secondo le norme SIA 380/1 e redazione del certificato CECE ufficiale.', duration: '3–5 giorni', icon: '📊', docs: [] },
    { title: 'Consegna e piano d\'azione', description: 'Ricevimento del certificato CECE e definizione con il consulente arCO₂ della roadmap degli interventi prioritari.', duration: '1–2 ore', icon: '✅', docs: ['Certificato CECE', 'Piano interventi consigliati'] },
  ],
}

// ─── Required docs by pathway ─────────────────────────────────────────────────

const ALL_DOCS: Record<string, { icon: string; name: string; note: string }[]> = {
  isolation: [
    { icon: '📐', name: 'Planimetria edificio', note: 'Piante e sezioni di tutti i piani' },
    { icon: '⚡', name: 'Certificato CECE esistente', note: 'Se disponibile — altrimenti da richiedere' },
    { icon: '🧾', name: 'Bollette energetiche', note: 'Ultimi 2 anni, gas o olio' },
    { icon: '🏛️', name: 'Documento di proprietà', note: 'Atto di proprietà o contratto di locazione' },
    { icon: '💶', name: 'Preventivi imprese', note: 'Almeno 3 offerte comparative' },
  ],
  heating: [
    { icon: '🧾', name: 'Bollette gas / olio', note: 'Consumi degli ultimi 3 anni' },
    { icon: '📐', name: 'Planimetria edificio', note: 'Per il calcolo del carico termico' },
    { icon: '📋', name: 'Libretto caldaia esistente', note: 'Dati tecnici impianto attuale' },
    { icon: '💶', name: 'Preventivi installatori', note: 'Almeno 2 offerte comparative' },
    { icon: '⚡', name: 'Scheda tecnica pompa di calore', note: 'COP, potenza, refrigerante' },
  ],
  photovoltaic: [
    { icon: '🏠', name: 'Foto tetto', note: 'Orientamento, inclinazione, superfici disponibili' },
    { icon: '📐', name: 'Planimetria copertura', note: 'Con dimensioni e pendenza' },
    { icon: '🧾', name: 'Bollette elettriche', note: 'Consumi ultimi 2 anni' },
    { icon: '💶', name: 'Preventivo installatore', note: 'Con specifiche pannelli e inverter' },
    { icon: '📋', name: 'Dichiarazione conformità', note: 'Richiesta per allacciamento rete' },
  ],
  vmc: [
    { icon: '📐', name: 'Planimetria edificio', note: 'Per il dimensionamento canali' },
    { icon: '💶', name: 'Preventivi installatori', note: 'Confronto sistemi centralizzati/decentralizzati' },
    { icon: '📋', name: 'Scheda tecnica VMC', note: 'Portata aria, recupero calore, rumorosità' },
  ],
  certification: [
    { icon: '📐', name: 'Planimetrie disponibili', note: 'Se presenti — utili per il certificatore' },
    { icon: '🧾', name: 'Bollette energetiche', note: 'Ultimi 2–3 anni' },
    { icon: '📋', name: 'Dati tecnici impianti', note: 'Riscaldamento, ACS, ventilazione' },
    { icon: '🏛️', name: 'Anno di costruzione', note: 'Documentazione catastale' },
  ],
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PathwayResponse {
  pathway: Pathway
  user: { firstName: string; lastName: string; municipality: string }
  consultant: { firstName: string; lastName: string; email: string; phone: string }
  questionnaire: { buildingType: string; yearBuilt: string }
}

export default function PathwayDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [data, setData] = useState<PathwayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(apiUrl(`/api/pathway/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) { navigate('/'); return }
        if (!res.ok) throw new Error()
        setData(await res.json())
      } catch {
        setError('Impossibile caricare il percorso.')
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [id, token])

  if (loading) return (
    <div className="pd-loading">
      <div className="loading-spinner-lg"></div>
      <p>Caricamento percorso...</p>
    </div>
  )

  if (error || !data) return (
    <div className="pd-error">
      <span>⚠️</span>
      <p>{error || 'Percorso non trovato'}</p>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Torna alla dashboard</button>
    </div>
  )

  const { pathway, consultant } = data
  const phases = PHASES[pathway.id] ?? []
  const docs = ALL_DOCS[pathway.id] ?? []
  const badgeClass = pathway.priority === 'high' ? 'badge-high' : pathway.priority === 'medium' ? 'badge-medium' : 'badge-low'

  return (
    <div className="pd-page">
      {/* ─── Back nav ─────────────────────────────────────────────────── */}
      <div className="pd-topbar">
        <button className="pd-back" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <div className="pd-topbar-logo">
          <span className="logo-mark">arCO</span><span className="logo-sub">₂</span>
        </div>
      </div>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="pd-hero">
        <div className="pd-hero-inner">
          <div className="pd-hero-meta">
            <span className={`badge ${badgeClass}`}>{pathway.label}</span>
            <span className="pd-hero-id">Percorso #{pathway.id}</span>
          </div>
          <div className="pd-hero-title-row">
            <span className="pd-hero-icon">{pathway.icon}</span>
            <h1>{pathway.title}</h1>
          </div>
          <p className="pd-hero-desc">{pathway.description}</p>

          <div className="pd-hero-metrics">
            <div className="pd-metric">
              <span className="pd-metric-value savings">{pathway.estimatedSavings}</span>
              <span className="pd-metric-label">Risparmio energetico</span>
            </div>
            <div className="pd-metric-divider"></div>
            <div className="pd-metric">
              <span className="pd-metric-value">{pathway.estimatedCost}</span>
              <span className="pd-metric-label">Costo stimato</span>
            </div>
            <div className="pd-metric-divider"></div>
            <div className="pd-metric">
              <span className="pd-metric-value incentive">{pathway.maxIncentive}</span>
              <span className="pd-metric-label">Incentivo massimo</span>
            </div>
            <div className="pd-metric-divider"></div>
            <div className="pd-metric">
              <span className="pd-metric-value co2">{pathway.co2Reduction}</span>
              <span className="pd-metric-label">Riduzione CO₂</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body ─────────────────────────────────────────────────────── */}
      <div className="pd-body">
        <div className="pd-body-inner">

          {/* ── Timeline ─────────────────────────────────────────────── */}
          <section className="pd-section">
            <h2 className="pd-section-title">🗺️ Fasi del percorso</h2>
            <p className="pd-section-sub">Durata totale stimata: <strong>{pathway.duration}</strong></p>

            <div className="pd-timeline">
              {phases.map((phase, i) => (
                <div
                  key={i}
                  className={`pd-phase ${activePhase === i ? 'pd-phase-active' : ''}`}
                  onClick={() => setActivePhase(activePhase === i ? -1 : i)}
                >
                  <div className="pd-phase-header">
                    <div className="pd-phase-step">
                      <div className={`pd-step-circle ${i === 0 ? 'step-first' : i < activePhase ? 'step-done' : i === activePhase ? 'step-active' : 'step-pending'}`}>
                        {i < activePhase ? '✓' : i + 1}
                      </div>
                      {i < phases.length - 1 && <div className="pd-step-line"></div>}
                    </div>
                    <div className="pd-phase-content">
                      <div className="pd-phase-title-row">
                        <span className="pd-phase-icon">{phase.icon}</span>
                        <h3 className="pd-phase-title">{phase.title}</h3>
                        <span className="pd-phase-duration">⏱ {phase.duration}</span>
                        <span className="pd-phase-chevron">{activePhase === i ? '▲' : '▼'}</span>
                      </div>
                      {activePhase === i && (
                        <div className="pd-phase-body fade-in">
                          <p>{phase.description}</p>
                          {phase.docs.length > 0 && (
                            <div className="pd-phase-docs">
                              <span className="pd-phase-docs-title">📄 Documenti da preparare:</span>
                              <ul>
                                {phase.docs.map((d) => <li key={d}>{d}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="pd-two-col">
            {/* ── Incentives ───────────────────────────────────────── */}
            <section className="pd-section">
              <h2 className="pd-section-title">💶 Incentivi applicabili</h2>
              <p className="pd-section-sub">Incentivi cumulabili per questo percorso</p>
              <div className="pd-incentives-list">
                {pathway.incentives.map((inc, i) => (
                  <div key={i} className="pd-incentive-row">
                    <span className="pd-inc-dot"></span>
                    <span className="pd-inc-name">{inc}</span>
                    <span className="pd-inc-chip">Cumulabile</span>
                  </div>
                ))}
              </div>
              <div className="pd-incentive-total">
                <span>Incentivo massimo totale stimato</span>
                <span className="pd-total-value">{pathway.maxIncentive}</span>
              </div>
              <div className="pd-net-cost">
                <div className="pd-nc-row">
                  <span>Costo lordo stimato</span>
                  <span>{pathway.estimatedCost}</span>
                </div>
                <div className="pd-nc-row pd-nc-incentive">
                  <span>– Incentivi massimi</span>
                  <span className="green">– {pathway.maxIncentive}</span>
                </div>
                <div className="pd-nc-separator"></div>
                <div className="pd-nc-row pd-nc-net">
                  <span>Costo netto stimato</span>
                  <span>A partire da {pathway.estimatedCost.split('–')[0].trim().replace('CHF ', 'CHF ')}</span>
                </div>
              </div>
            </section>

            {/* ── Documents ───────────────────────────────────────── */}
            <section className="pd-section">
              <h2 className="pd-section-title">📁 Documenti necessari</h2>
              <p className="pd-section-sub">Prepara questi documenti prima di iniziare</p>
              <div className="pd-docs-list">
                {docs.map((doc, i) => (
                  <div key={i} className="pd-doc-row">
                    <span className="pd-doc-icon">{doc.icon}</span>
                    <div>
                      <div className="pd-doc-name">{doc.name}</div>
                      <div className="pd-doc-note">{doc.note}</div>
                    </div>
                    <span className="pd-doc-status">Da preparare</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Consultant CTA ──────────────────────────────────────── */}
          <section className="pd-consultant-cta">
            <div className="pd-cta-inner">
              <div className="pd-cta-left">
                <div className="pd-cta-avatar">
                  {consultant.firstName[0]}{consultant.lastName[0]}
                </div>
                <div>
                  <div className="pd-cta-label">Il tuo consulente arCO₂</div>
                  <div className="pd-cta-name">{consultant.firstName} {consultant.lastName}</div>
                  <div className="pd-cta-contact">📧 {consultant.email} · 📞 {consultant.phone}</div>
                </div>
              </div>
              <div className="pd-cta-actions">
                <button className="btn btn-primary">
                  🚀 Attiva questo percorso
                </button>
                <button className="btn btn-secondary">
                  📅 Prenota una chiamata
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
