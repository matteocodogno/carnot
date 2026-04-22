import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { DashboardData, Pathway, NextStep } from '../types'
import { apiUrl } from '../lib/api'
import './Dashboard.css'

type NavSection = 'overview' | 'dossier' | 'pathways' | 'consultant' | 'documents'

const NAV_ITEMS: { id: NavSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Panoramica', icon: '🏠' },
  { id: 'dossier', label: 'Dossier edificio', icon: '📁' },
  { id: 'pathways', label: 'Percorsi', icon: '🗺️' },
  { id: 'consultant', label: 'Consulente', icon: '👤' },
  { id: 'documents', label: 'Documenti', icon: '📄' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { token, logout } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<NavSection>('overview')
  const [expandedPathway, setExpandedPathway] = useState<string | null>(null)
  const [progressMounted, setProgressMounted] = useState(false)

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
        // Trigger progress bar animation after render
        setTimeout(() => setProgressMounted(true), 80)
      } catch {
        setError('Impossibile caricare la dashboard. Riprova.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [token])

  if (loading) return <DashboardSkeleton />

  if (error || !data) return (
    <div className="dashboard-error">
      <span>⚠️</span>
      <p>{error}</p>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Riprova</button>
    </div>
  )

  const { user, consultant, buildingDossier, pathways, nextSteps, statistics, globalProgress } = data
  const topPathway = pathways[0]
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  const consInitials = `${consultant.firstName[0]}${consultant.lastName[0]}`.toUpperCase()

  return (
    <div className="dashboard">
      {/* ─── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <button
          className="sidebar-logo"
          onClick={() => navigate('/')}
          title="Torna alla home"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
        >
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </button>

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
            <strong>{globalProgress}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: progressMounted ? `${globalProgress}%` : '0%' }}></div>
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
            <div className="topbar-avatar" title={`${user.firstName} ${user.lastName}`}>
              {initials}
            </div>
            <div className="topbar-user-info">
              <span className="topbar-user-name">{user.firstName} {user.lastName}</span>
              <span className="topbar-user-comune">{user.municipality}</span>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* OVERVIEW */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="dashboard-content fade-in">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Benvenuto, {user.firstName}! 👋</h2>
                <p>Il tuo percorso arCO₂ è appena iniziato. Ecco un riepilogo della tua situazione energetica e i prossimi passi consigliati.</p>
              </div>
              <div className="welcome-consult">
                <div className="welcome-consult-avatar">{consInitials}</div>
                <div>
                  <div className="welcome-consult-label">Il tuo consulente</div>
                  <div className="welcome-consult-name">{consultant.firstName} {consultant.lastName}</div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="stats-grid">
              <StatCard icon="💰" value={statistics.potentialSavings} label="Risparmio energetico potenziale" color="primary" />
              <StatCard icon="🌿" value={statistics.co2Reduction} label="Riduzione CO₂ stimata" color="green" />
              <StatCard icon="💶" value={statistics.availableIncentives} label="Incentivi accessibili" color="amber" />
              <StatCard icon="⏱️" value={statistics.estimatedTime} label="Tempo stimato primo intervento" color="teal" />
            </div>

            {/* Main grid */}
            <div className="panoramica-grid">
              {/* Top pathway */}
              <div className="panoramica-main">
                {topPathway && (
                  <div className="top-pathway-card card">
                    <div className="tpc-header">
                      <span className="section-label">Percorso principale consigliato</span>
                      <span className="badge badge-high">{topPathway.label}</span>
                    </div>
                    <div className="tpc-body">
                      <span className="tpc-icon">{topPathway.icon}</span>
                      <div>
                        <h3 className="tpc-title">{topPathway.title}</h3>
                        <p className="tpc-desc">{topPathway.description}</p>
                        <div className="tpc-metrics">
                          <div className="tpc-metric">
                            <span className="metric-label">Risparmio</span>
                            <span className="metric-value green">{topPathway.estimatedSavings}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Costo stimato</span>
                            <span className="metric-value">{topPathway.estimatedCost}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Incentivo max</span>
                            <span className="metric-value amber">{topPathway.maxIncentive}</span>
                          </div>
                          <div className="tpc-metric">
                            <span className="metric-label">Riduzione CO₂</span>
                            <span className="metric-value">{topPathway.co2Reduction}</span>
                          </div>
                        </div>
                        <div className="tpc-incentivi">
                          {topPathway.incentives.map((inc) => (
                            <span key={inc} className="incentivo-chip">{inc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setActiveSection('pathways')}>
                      Vedi tutti i percorsi →
                    </button>
                  </div>
                )}

                {/* Next steps */}
                <div className="next-steps-card card">
                  <h3 className="section-label" style={{ marginBottom: 'var(--space-4)' }}>Prossimi passi</h3>
                  <div className="next-steps-list">
                    {nextSteps.map((step) => (
                      <NextStepRow key={step.id} step={step} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="panoramica-side">
                <ConsultantCard consultant={consultant} consInitials={consInitials} compact />
                {buildingDossier && <DossierMiniCard dossier={buildingDossier} onClick={() => setActiveSection('dossier')} progressMounted={progressMounted} />}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* BUILDING DOSSIER */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'dossier' && (
          <div className="dashboard-content fade-in">
            {buildingDossier ? (
              <>
                <div className="dossier-completion card" style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="dc-header">
                    <div>
                      <h3>Completamento dossier</h3>
                      <p>Modulo 1 completato · Aggiungi indirizzo e dati tecnici per sbloccare l'analisi avanzata</p>
                    </div>
                    <div className="dc-percent">{buildingDossier.completion}%</div>
                  </div>
                  <div className="progress-track" style={{ marginTop: 'var(--space-3)' }}>
                    <div className="progress-fill" style={{ width: progressMounted ? `${buildingDossier.completion}%` : '0%' }}></div>
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
                      <DossierField label="Tipo di edificio" value={buildingDossier.type} icon="🏠" />
                      <DossierField label="Anno di costruzione" value={buildingDossier.year} icon="📅" />
                      <DossierField label="Superficie abitabile" value={buildingDossier.area} icon="📐" />
                      <DossierField label="Sistema di riscaldamento" value={buildingDossier.heating} icon="🌡️" />
                      <DossierField label="Classe energetica" value={buildingDossier.energyClass} icon="⚡" />
                      <DossierField label="Comune" value={buildingDossier.municipality} icon="📍" />
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
                      {buildingDossier.goals.map((ob) => (
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
        {/* PATHWAYS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'pathways' && (
          <div className="dashboard-content fade-in">
            <div className="percorsi-intro">
              <p>Basandoci sul tuo edificio e sui tuoi obiettivi, abbiamo identificato <strong>{pathways.length} percorsi di efficientamento</strong>. Sono ordinati per priorità e impatto stimato.</p>
            </div>
            <div className="percorsi-list">
              {pathways.map((pathway, i) => (
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
        {/* CONSULTANT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'consultant' && (
          <div className="dashboard-content fade-in">
            <ConsultantCard consultant={consultant} consInitials={consInitials} full />
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* DOCUMENTS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeSection === 'documents' && (
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

function NextStepRow({ step }: { step: NextStep }) {
  const statusConfig: Record<string, { icon: string; class: string }> = {
    todo: { icon: '▶️', class: 'status-todo' },
    waiting: { icon: '⏳', class: 'status-wait' },
    locked: { icon: '🔒', class: 'status-locked' },
    done: { icon: '✅', class: 'status-done' },
  }
  const { icon, class: cls } = statusConfig[step.status] ?? statusConfig.todo
  const urgClass = step.urgency === 'high' ? 'urgency-high' : step.urgency === 'medium' ? 'urgency-medium' : ''

  return (
    <div className={`next-step-row ${cls}`}>
      <span className="ns-icon">{icon}</span>
      <div className="ns-content">
        <div className="ns-title">{step.title}</div>
        <div className="ns-desc">{step.description}</div>
      </div>
      <div className={`ns-urgenza ${urgClass}`}>
        Modulo {step.module}
      </div>
    </div>
  )
}

function ConsultantCard({ consultant, consInitials, compact = false, full = false }: {
  consultant: DashboardData['consultant']
  consInitials: string
  compact?: boolean
  full?: boolean
}) {
  return (
    <div className={`consulente-card card ${full ? 'consulente-card-full' : ''}`}>
      <div className="cc-header">
        <div className="cc-avatar">{consInitials}</div>
        <div>
          <div className="cc-name">{consultant.firstName} {consultant.lastName}</div>
          <div className="cc-spec">{consultant.specialization}</div>
          {!compact && <div className="cc-exp">{consultant.experience}</div>}
        </div>
        <div className="cc-online-badge">🟢 Disponibile</div>
      </div>
      {!compact && (
        <>
          <div className="cc-info">
            <div className="cc-info-row"><span>📧</span><a href={`mailto:${consultant.email}`}>{consultant.email}</a></div>
            <div className="cc-info-row"><span>📞</span><span>{consultant.phone}</span></div>
            <div className="cc-info-row"><span>🕐</span><span>{consultant.availability}</span></div>
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
          <span>📧 {consultant.email}</span>
          <span>🕐 {consultant.availability}</span>
        </div>
      )}
    </div>
  )
}

function DossierMiniCard({ dossier, onClick, progressMounted }: { dossier: DashboardData['buildingDossier']; onClick: () => void; progressMounted: boolean }) {
  if (!dossier) return null
  return (
    <div className="dossier-mini-card card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="dmc-header">
        <span>📁</span>
        <span>Dossier edificio</span>
        <span className="badge badge-primary">{dossier.completion}%</span>
      </div>
      <div className="dmc-body">
        <span className="dmc-item">{dossier.type}</span>
        <span className="dmc-item">{dossier.year}</span>
        <span className="dmc-item">{dossier.heating}</span>
      </div>
      <div className="progress-track" style={{ marginTop: 'var(--space-3)' }}>
        <div className="progress-fill" style={{ width: progressMounted ? `${dossier.completion}%` : '0%' }}></div>
      </div>
      <p className="dmc-cta">Completa il dossier →</p>
    </div>
  )
}

function PathwayCard({ pathway, rank, expanded, onToggle }: {
  pathway: Pathway; rank: number; expanded: boolean; onToggle: () => void
}) {
  const navigate = useNavigate()
  const badgeClass = pathway.priority === 'high' ? 'badge-high' : pathway.priority === 'medium' ? 'badge-medium' : 'badge-low'

  return (
    <div className={`pathway-card card ${expanded ? 'pathway-card-expanded' : ''}`}>
      <div className="pathway-card-header" onClick={onToggle}>
        <div className="pathway-rank">
          <span className={`rank-circle ${rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : 'rank-other'}`}>{rank}</span>
        </div>
        <span className="pathway-icon">{pathway.icon}</span>
        <div className="pathway-header-text">
          <div className="pathway-title-row">
            <h3 className="pathway-title">{pathway.title}</h3>
            <span className={`badge ${badgeClass}`}>{pathway.label}</span>
          </div>
          <p className="pathway-summary">{pathway.description}</p>
        </div>
        <div className="pathway-quick-stats">
          <div className="pqs">
            <span className="pqs-value" style={{ color: 'var(--color-green)' }}>{pathway.estimatedSavings}</span>
            <span className="pqs-label">risparmio</span>
          </div>
          <div className="pqs">
            <span className="pqs-value">{pathway.estimatedCost}</span>
            <span className="pqs-label">costo</span>
          </div>
        </div>
        <span className="pathway-expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>

      <div className={`pathway-card-body${expanded ? ' pathway-card-body-open' : ''}`}>
        <div className="pathway-detail-grid">
          <div className="pathway-detail-section">
            <h4>📊 Dati tecnici</h4>
            <div className="pathway-detail-rows">
              <div className="pdr"><span>Risparmio energetico</span><strong>{pathway.savingsKwh}</strong></div>
              <div className="pdr"><span>Riduzione CO₂</span><strong>{pathway.co2Reduction}</strong></div>
              <div className="pdr"><span>Durata lavori</span><strong>{pathway.duration}</strong></div>
              <div className="pdr"><span>Costo stimato</span><strong>{pathway.estimatedCost}</strong></div>
              <div className="pdr"><span>Incentivo massimo</span><strong style={{ color: 'var(--color-green)' }}>{pathway.maxIncentive}</strong></div>
            </div>
          </div>
          <div className="pathway-detail-section">
            <h4>💶 Incentivi applicabili</h4>
            <div className="pathway-incentivi-list">
              {pathway.incentives.map((inc) => (
                <div key={inc} className="inc-row">
                  <span className="inc-dot"></span>
                  <span>{inc}</span>
                </div>
              ))}
            </div>
            <h4 style={{ marginTop: 'var(--space-5)' }}>🗺️ Passi del percorso</h4>
            <ol className="pathway-steps-list">
              {pathway.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
        <div className="pathway-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/percorso/${pathway.id}`)}>
            Apri dettaglio completo →
          </button>
          <button className="btn btn-secondary">
            Richiedi preventivi professionisti
          </button>
          <button className="btn btn-ghost">
            Salva per dopo
          </button>
        </div>
      </div>
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

// ─── Skeleton loading screen ─────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="dashboard">
      {/* Skeleton sidebar */}
      <aside className="sidebar">
        <div className="skeleton sk-logo"></div>
        <nav className="sidebar-nav">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sk-nav-item">
              <div className="skeleton sk-nav-icon"></div>
              <div className="skeleton sk-nav-label"></div>
            </div>
          ))}
        </nav>
        <div className="sidebar-progress" style={{ marginTop: 'auto' }}>
          <div className="skeleton skeleton-text" style={{ width: '70%', marginBottom: 8 }}></div>
          <div className="skeleton sk-progress-bar"></div>
          <div className="skeleton skeleton-text-sm" style={{ width: '90%', marginTop: 8 }}></div>
        </div>
      </aside>

      {/* Skeleton main */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="skeleton sk-topbar-title"></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton sk-topbar-avatar"></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton skeleton-text" style={{ width: 100 }}></div>
              <div className="skeleton skeleton-text-sm" style={{ width: 70 }}></div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Banner */}
          <div className="skeleton sk-banner"></div>

          {/* Stats row */}
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton sk-stat card"></div>
            ))}
          </div>

          {/* Main grid */}
          <div className="panoramica-grid">
            <div className="panoramica-main">
              <div className="skeleton sk-card-tall card"></div>
              <div className="skeleton sk-card-medium card"></div>
            </div>
            <div className="panoramica-side">
              <div className="skeleton sk-card-medium card"></div>
              <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
