import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { DashboardData, Pathway, ProssimoStep } from '../types'
import { apiUrl } from '../lib/api'
import './Dashboard.css'

type NavSection = 'panoramica' | 'dossier' | 'percorsi' | 'consulente' | 'documenti'

const NAV_ITEMS: { id: NavSection; label: string; icon: string }[] = [
  { id: 'panoramica', label: 'Panoramica', icon: '🏠' },
  { id: 'dossier', label: 'Dossier edificio', icon: '📁' },
  { id: 'percorsi', label: 'Percorsi', icon: '🗺️' },
  { id: 'consulente', label: 'Consulente', icon: '👤' },
  { id: 'documenti', label: 'Documenti', icon: '📄' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<NavSection>('panoramica')
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(apiUrl('/api/dashboard'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401) { logout(); navigate('/'); return }
        if (!res.ok) throw new Error('Errore caricamento dati')
        const json: DashboardData = await res.json()
        setData(json)
      } catch {
        setError('Impossibile caricare la dashboard. Riprova.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [token])

  if (loading) return (
    <div className="dashboard-loading">
      <div className="loading-spinner-lg"></div>
      <p>Caricamento del tuo dossier…</p>
    </div>
  )

  if (error || !data) return (
    <div className="dashboard-error">
      <span>⚠️</span>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Riprova</button>
    </div>
  )

  const { user, consulente, dossierEdificio, percorsi, prossimiPassi, statistiche, progressoGlobale } = data
  const topPercorso = percorsi[0]
  const initials = `${user.nome[0]}${user.cognome[0]}`.toUpperCase()
  const consInitials = `${consulente.nome[0]}${consulente.cognome[0]}`.toUpperCase()

  return (
    <div className="dashboard">
      {/* ─── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-progress">
          <div className="sidebar-progress-label">
            <span>Completamento dossier</span>
            <strong>{progressoGlobale}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressoGlobale}%` }}></div>
          </div>
          <p className="sidebar-progress-note">Modulo 1 completato · 9 moduli rimanenti</p>
        </div>

        <button className="sidebar-logout" onClick={() => { logout(); navigate('/') }}>
          <span>🚪</span> Esci
        </button>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────── */}
      <div className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <h1>{NAV_ITEMS.find(n => n.id === activeSection)?.label}</h1>
          </div>
          <div className="topbar-user">
            <div className="topbar-notifications">
              <span>🔔</span>
              <span className="notif-badge">1</span>
            </div>
            <div className="topbar-avatar" title={`${user.nome} ${user.cognome}`}>
              {initials}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user.nome} {user.cognome}</span>
              <span className="topbar-user-comune">{user.comune}</span>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PANORAMICA */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'panoramica' && (
          <div className="dashboard-content fade-in">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Benvenuto, {user.nome}! 👋</h2>
                <p>Il tuo percorso arCO₂ è appena iniziato. Ecco un riepilogo della tua situazione energetica e i prossimi passi consigliati.</p>
              </div>
              <div className="welcome-consult">
                <div className="welcome-consult-avatar">{consInitials}</div>
                <div>
                  <div className="welcome-consult-label">Il tuo consulente</div>
                  <div className="welcome-consult-name">{consulente.nome} {consulente.cognome}</div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="stats-grid">
              <StatCard icon="💰" value={statistiche.risparmioPotenziale} label="Risparmio energetico potenziale" color="primary" />
              <StatCard icon="🌿" value={statistiche.riduzioneCO2} label="Riduzione CO₂ stimata" color="green" />
              <StatCard icon="💶" value={statistiche.incentiviDisponibili} label="Incentivi accessibili" color="amber" />
              <StatCard icon="⏱️" value={statistiche.tempoStimato} label="Tempo stimato primo intervento" color="teal" />
            </div>

            {/* Main grid */}
            <div className="panoramica-grid">
              {/* Top percorso */}
              <div className="panoramica-main">
                {topPercorso && (
                  <div className="top-pathway-card card">
                    <div className="tpc-header">
                      <span className="section-label">Percorso principale consigliato</span>
                      <span className="badge badge-alta">{topPercorso.etichetta}</span>
                    </div>
                    <div className="tpc-body">
                      <span className="tpc-icon">{topPercorso.icona}</span>
                      <div>
                        <h3 className="tpc-title">{topPercorso.titolo}</h3>
                        <p className="tpc-desc">{topPercorso.descrizione}</p>
                        <div className="tpc-metrics">
                          <div className="tpc-metric">
                            <span className="metric-label">Risparmio</span>
                            <span className="metric-value green">{topPercorso.risparmioStimato}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Costo stimato</span>
                            <span className="metric-value">{topPercorso.costoStimato}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Incentivo max</span>
                            <span className="metric-value amber">{topPercorso.incentivoMassimo}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Riduzione CO₂</span>
                            <span className="metric-value">{topPercorso.riduzioneCO2}</span>
                          </div>
                        </div>
                        <div className="tpc-incentivi">
                          {topPercorso.incentivi.map((inc) => (
                            <span key={inc} className="incentivo-chip">{inc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveSection('percorsi')}>
                      Vedi tutti i percorsi →
                    </button>
                  </div>
                )}

                {/* Prossimi passi */}
                <div className="next-steps-card card">
                  <h3 className="section-label" style={{ marginBottom: 'var(--space-4)' }}>Prossimi passi</h3>
                  <div className="next-steps-list">
                    {prossimiPassi.map((step) => (
                      <NextStepRow key={step.id} step={step} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="panoramica-side">
                <ConsulentCard consulente={consulente} consInitials={consInitials} compact />
                {dossierEdificio && <DossierMiniCard dossier={dossierEdificio} onClick={() => setActiveSection('dossier')} />}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* DOSSIER EDIFICIO */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'dossier' && (
          <div className="dashboard-content fade-in">
            {dossierEdificio ? (
              <>
                <div className="dossier-completion card" style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="dc-header">
                    <div>
                      <h3>Completamento dossier</h3>
                      <p>Modulo 1 completato · Aggiungi indirizzo e dati tecnici per sbloccare l'analisi avanzata</p>
                    </div>
                    <div className="dc-percent">{dossierEdificio.completamento}%</div>
                  </div>
                  <div className="progress-track" style={{ marginTop: 'var(--space-3)' }}>
                    <div className="progress-fill" style={{ width: `${dossierEdificio.completamento}%` }}></div>
                  </div>
                  <div className="dc-modules">
                    <DossierModule num={1} label="Orientamento iniziale" done />
                    <DossierModule num={2} label="Raccolta dati edificio" active />
                    <DossierModule num={3} label="Consulenza" locked />
                    <DossierModule num={4} label="Preventivi" locked />
                  </div>
                </div>

                <div className="dossier-grid">
                  <div className="dossier-data card">
                    <h3 className="dossier-section-title">📋 Dati edificio</h3>
                    <div className="dossier-fields">
                      <DossierField label="Tipo di edificio" value={dossierEdificio.tipo} icon="🏠" />
                      <DossierField label="Anno di costruzione" value={dossierEdificio.anno} icon="📅" />
                      <DossierField label="Superficie abitabile" value={dossierEdificio.superficie} icon="📐" />
                      <DossierField label="Sistema di riscaldamento" value={dossierEdificio.riscaldamento} icon="🌡️" />
                      <DossierField label="Classe energetica" value={dossierEdificio.classeEnergetica} icon="⚡" />
                      <DossierField label="Comune" value={dossierEdificio.comune} icon="📍" />
                    </div>
                    <div className="dossier-missing">
                      <span className="missing-label">⚠️ Da completare nel Modulo 2:</span>
                      <span className="missing-item">Indirizzo completo</span>
                      <span className="missing-item">Planimetria</span>
                      <span className="missing-item">Foto edificio</span>
                      <span className="missing-item">Bollette energetiche</span>
                    </div>
                  </div>

                  <div className="dossier-goals card">
                    <h3 className="dossier-section-title">🎯 Obiettivi dichiarati</h3>
                    <div className="goals-list">
                      {dossierEdificio.obiettivi.map((ob) => (
                        <span key={ob} className="goal-chip">{ob}</span>
                      ))}
                    </div>

                    <div style={{ marginTop: 'var(--space-6)' }}>
                      <h3 className="dossier-section-title">📂 Documenti caricati</h3>
                      <div className="docs-empty">
                        <span className="docs-empty-icon">📄</span>
                        <p>Nessun documento caricato</p>
                        <p className="docs-empty-sub">Carica planimetrie, bollette o certificati per completare il dossier</p>
                        <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
                          + Carica documento
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="dossier-empty card">
                <span>🏠</span>
                <h3>Completa il tuo profilo</h3>
                <p>Esegui prima il questionario orientativo per creare il dossier edificio.</p>
                <button className="btn btn-primary" onClick={() => navigate('/questionario')}>
                  Fai il questionario
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PERCORSI */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'percorsi' && (
          <div className="dashboard-content fade-in">
            <div className="percorsi-intro">
              <p>Basandoci sul tuo edificio e sui tuoi obiettivi, abbiamo identificato <strong>{percorsi.length} percorsi di efficientamento</strong>. Sono ordinati per priorità e impatto stimato.</p>
            </div>
            <div className="percorsi-list">
              {percorsi.map((pathway, i) => (
                <PathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  rank={i + 1}
                  expanded={expandedPathway === pathway.id}
                  onToggle={() => setExpandedPathway(expandedPathway === pathway.id ? null : pathway.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* CONSULENTE */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'consulente' && (
          <div className="dashboard-content fade-in">
            <ConsulentCard consulente={consulente} consInitials={consInitials} full />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* DOCUMENTI */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'documenti' && (
          <div className="dashboard-content fade-in">
            <div className="docs-empty-page card">
              <span className="docs-empty-icon" style={{ fontSize: 48 }}>📁</span>
              <h3>Il tuo archivio digitale</h3>
              <p>Qui troverai tutti i documenti relativi al tuo percorso arCO₂: certificazioni, preventivi, contratti, documenti di incentivazione e comunicazioni con il consulente.</p>
              <p className="docs-empty-sub" style={{ marginTop: 'var(--space-2)' }}>Disponibile dal Modulo 2 — dopo aver completato il dossier edificio.</p>
              <button className="btn btn-primary" onClick={() => setActiveSection('dossier')} style={{ marginTop: 'var(--space-5)' }}>
                Vai al dossier edificio →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className={`stat-card card stat-card-${color}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function NextStepRow({ step }: { step: ProssimoStep }) {
  const statusConfig: Record<string, { icon: string; class: string }> = {
    da_fare: { icon: '▶️', class: 'status-todo' },
    attesa: { icon: '⏳', class: 'status-wait' },
    bloccato: { icon: '🔒', class: 'status-locked' },
    completato: { icon: '✅', class: 'status-done' },
  }
  const { icon, class: cls } = statusConfig[step.stato] ?? statusConfig.da_fare
  const urgClass = step.urgenza === 'alta' ? 'urgenza-alta' : step.urgenza === 'media' ? 'urgenza-media' : ''

  return (
    <div className={`next-step-row ${cls}`}>
      <span className="ns-icon">{icon}</span>
      <div className="ns-content">
        <div className="ns-title">{step.titolo}</div>
        <div className="ns-desc">{step.descrizione}</div>
      </div>
      <div className={`ns-urgenza ${urgClass}`}>
        Modulo {step.modulo}
      </div>
    </div>
  )
}

function ConsulentCard({ consulente, consInitials, compact = false, full = false }: {
  consulente: DashboardData['consulente']
  consInitials: string
  compact?: boolean
  full?: boolean
}) {
  return (
    <div className={`consulente-card card ${full ? 'consulente-card-full' : ''}`}>
      <div className="cc-header">
        <div className="cc-avatar">{consInitials}</div>
        <div>
          <div className="cc-name">{consulente.nome} {consulente.cognome}</div>
          <div className="cc-spec">{consulente.specializzazione}</div>
          {!compact && <div className="cc-exp">{consulente.esperienza}</div>}
        </div>
        <div className="cc-online-badge">🟢 Disponibile</div>
      </div>
      {!compact && (
        <>
          <div className="cc-info">
            <div className="cc-info-row"><span>📧</span><a href={`mailto:${consulente.email}`}>{consulente.email}</a></div>
            <div className="cc-info-row"><span>📞</span><span>{consulente.telefono}</span></div>
            <div className="cc-info-row"><span>🕐</span><span>{consulente.disponibilita}</span></div>
          </div>
          {full && (
            <div className="cc-actions">
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                📧 Invia messaggio
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                📅 Prenota chiamata
              </button>
            </div>
          )}
          {!full && (
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-3)' }}>
              Contatta consulente →
            </button>
          )}
        </>
      )}
      {compact && (
        <div className="cc-compact-info">
          <span>📧 {consulente.email}</span>
          <span>🕐 {consulente.disponibilita}</span>
        </div>
      )}
    </div>
  )
}

function DossierMiniCard({ dossier, onClick }: { dossier: DashboardData['dossierEdificio']; onClick: () => void }) {
  if (!dossier) return null
  return (
    <div className="dossier-mini-card card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="dmc-header">
        <span>📁</span>
        <span>Dossier edificio</span>
        <span className="badge badge-primary">{dossier.completamento}%</span>
      </div>
      <div className="dmc-body">
        <span className="dmc-item">{dossier.tipo}</span>
        <span className="dmc-item">{dossier.anno}</span>
        <span className="dmc-item">{dossier.riscaldamento}</span>
      </div>
      <div className="progress-track" style={{ marginTop: 'var(--space-3)' }}>
        <div className="progress-fill" style={{ width: `${dossier.completamento}%` }}></div>
      </div>
      <p className="dmc-cta">Completa il dossier →</p>
    </div>
  )
}

function PathwayCard({ pathway, rank, expanded, onToggle }: {
  pathway: Pathway; rank: number; expanded: boolean; onToggle: () => void
}) {
  const badgeClass = pathway.priorita === 'alta' ? 'badge-alta' : pathway.priorita === 'media' ? 'badge-media' : 'badge-bassa'

  return (
    <div className={`pathway-card card ${expanded ? 'pathway-card-expanded' : ''}`}>
      <div className="pathway-card-header" onClick={onToggle}>
        <div className="pathway-rank">
          <span className={`rank-circle ${rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : 'rank-other'}`}>{rank}</span>
        </div>
        <span className="pathway-icon">{pathway.icona}</span>
        <div className="pathway-header-text">
          <div className="pathway-title-row">
            <h3 className="pathway-title">{pathway.titolo}</h3>
            <span className={`badge ${badgeClass}`}>{pathway.etichetta}</span>
          </div>
          <p className="pathway-summary">{pathway.descrizione}</p>
        </div>
        <div className="pathway-quick-stats">
          <div className="pqs">
            <span className="pqs-value" style={{ color: 'var(--color-green)' }}>{pathway.risparmioStimato}</span>
            <span className="pqs-label">risparmio</span>
          </div>
          <div className="pqs">
            <span className="pqs-value">{pathway.costoStimato}</span>
            <span className="pqs-label">costo</span>
          </div>
        </div>
        <span className="pathway-expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="pathway-card-body fade-in">
          <div className="pathway-detail-grid">
            <div className="pathway-detail-section">
              <h4>📊 Dati tecnici</h4>
              <div className="pathway-detail-rows">
                <div className="pdr"><span>Risparmio energetico</span><strong>{pathway.risparmioKwh}</strong></div>
                <div className="pdr"><span>Riduzione CO₂</span><strong>{pathway.riduzioneCO2}</strong></div>
                <div className="pdr"><span>Durata lavori</span><strong>{pathway.durata}</strong></div>
                <div className="pdr"><span>Costo stimato</span><strong>{pathway.costoStimato}</strong></div>
                <div className="pdr"><span>Incentivo massimo</span><strong style={{ color: 'var(--color-green)' }}>{pathway.incentivoMassimo}</strong></div>
              </div>
            </div>
            <div className="pathway-detail-section">
              <h4>💶 Incentivi applicabili</h4>
              <div className="pathway-incentivi-list">
                {pathway.incentivi.map((inc) => (
                  <div key={inc} className="inc-row">
                    <span className="inc-dot"></span>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>
              <h4 style={{ marginTop: 'var(--space-5)' }}>🗺️ Passi del percorso</h4>
              <ol className="pathway-steps-list">
                {pathway.passi.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="pathway-actions">
            <button className="btn btn-primary">
              Attiva questo percorso →
            </button>
            <button className="btn btn-secondary">
              Richiedi preventivi professionisti
            </button>
            <button className="btn btn-ghost">
              Salva per dopo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DossierField({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="dossier-field">
      <span className="df-icon">{icon}</span>
      <div className="df-content">
        <span className="df-label">{label}</span>
        <span className="df-value">{value}</span>
      </div>
    </div>
  )
}

function DossierModule({ num, label, done = false, active = false, locked = false }: {
  num: number; label: string; done?: boolean; active?: boolean; locked?: boolean
}) {
  const cls = done ? 'dm-done' : active ? 'dm-active' : 'dm-locked'
  const icon = done ? '✅' : active ? '▶️' : '🔒'
  return (
    <div className={`dossier-module ${cls}`}>
      <span>{icon}</span>
      <span>M{num} {label}</span>
    </div>
  )
}
