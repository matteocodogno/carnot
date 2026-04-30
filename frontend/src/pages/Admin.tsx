import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import './Admin.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = 'new' | 'questionnaire_done' | 'consultant_assigned' | 'in_progress' | 'completed'

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  municipality: string
  status: UserStatus
  adminNote: string
  createdAt: string
  hasQuestionnaire: boolean
  consultant: { id: string; firstName: string; lastName: string; email: string; specialization: string }
  questionnaire: {
    buildingType: string; yearBuilt: string; area: string
    heating: string; energyClass: string; goals: string[]
  } | null
}

interface Consultant { id: string; firstName: string; lastName: string; assignedCount: number }

interface Stats {
  totalUsers: number
  withQuestionnaire: number
  byStatus: Record<UserStatus, number>
  consultants: Consultant[]
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: string }> = {
  new:                 { label: 'Nuovo',               color: 'status-new',        icon: '🆕' },
  questionnaire_done:  { label: 'Questionario ✓',      color: 'status-quest',      icon: '📋' },
  consultant_assigned: { label: 'Consulente assegnato', color: 'status-assigned',   icon: '👤' },
  in_progress:         { label: 'In corso',             color: 'status-progress',   icon: '🔄' },
  completed:           { label: 'Completato',           color: 'status-completed',  icon: '✅' },
}

const BUILDING_LABELS: Record<string, string> = {
  unifamiliare: 'Casa unifamiliare', bifamiliare: 'Casa bifamiliare',
  appartamento: 'Appartamento', altro: 'Altro',
}
const HEATING_LABELS: Record<string, string> = {
  gas_olio: 'Gas/Olio', pompa_calore: 'Pompa di calore',
  teleriscaldamento: 'Teleriscaldamento', elettrico: 'Elettrico', pellet: 'Pellet',
}
const YEAR_LABELS: Record<string, string> = {
  prima_1960: '< 1960', '1960_1980': '1960–1980', '1981_2000': '1981–2000', dopo_2000: '> 2000',
}
const ENERGY_LABELS: Record<string, string> = {
  non_so: '?', gf: 'G/F', ed: 'E/D', cb: 'C/B', a: 'A',
}

// ─── Admin Login ───────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('admin@ticinoenergia.ch')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Errore di autenticazione'); return }
      localStorage.setItem('arco2_admin_token', data.token)
      onLogin(data.token)
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="logo-mark">arCO</span><span className="logo-sub">₂</span>
          <span className="admin-login-tag">Backoffice operatore</span>
        </div>
        <h1>Accesso riservato</h1>
        <p>Area operatori TicinoEnergia</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label className="form-label">Email operatore</label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="register-error"><span>⚠️</span> {error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}>
            {loading ? 'Accesso in corso...' : 'Accedi al backoffice →'}
          </button>
        </form>
        <p className="admin-login-hint">Demo: password <code>arco2admin</code></p>
      </div>
    </div>
  )
}

// ─── User Detail Panel ────────────────────────────────────────────────────────

function UserPanel({ user, consultants, onUpdate, onClose }: {
  user: AdminUser
  consultants: Consultant[]
  onUpdate: (id: string, patch: object) => Promise<void>
  onClose: () => void
}) {
  const [status, setStatus] = useState<UserStatus>(user.status)
  const [consultantId, setConsultantId] = useState(user.consultant.id)
  const [note, setNote] = useState(user.adminNote)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await onUpdate(user.id, { status, consultantId, adminNote: note })
    setSaving(false)
  }

  const cfg = STATUS_CONFIG[status]

  return (
    <div className="user-panel">
      <div className="user-panel-header">
        <div>
          <h2>{user.firstName} {user.lastName}</h2>
          <p>{user.email} · {user.municipality}</p>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="user-panel-body">
        {/* Status */}
        <div className="panel-section">
          <h3>Stato percorso</h3>
          <div className="status-selector">
            {(Object.entries(STATUS_CONFIG) as [UserStatus, typeof STATUS_CONFIG[UserStatus]][]).map(([key, cfg]) => (
              <button key={key}
                className={`status-chip ${cfg.color} ${status === key ? 'status-chip-active' : ''}`}
                onClick={() => setStatus(key)}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Consultant */}
        <div className="panel-section">
          <h3>Consulente assegnato</h3>
          <select className="form-input" value={consultantId}
            onChange={(e) => setConsultantId(e.target.value)}>
            {consultants.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.assignedCount} clienti)</option>
            ))}
          </select>
        </div>

        {/* Questionnaire data */}
        {user.questionnaire && (
          <div className="panel-section">
            <h3>Dati questionario</h3>
            <div className="panel-q-grid">
              <span>Edificio</span><strong>{BUILDING_LABELS[user.questionnaire.buildingType] ?? '-'}</strong>
              <span>Anno</span><strong>{YEAR_LABELS[user.questionnaire.yearBuilt] ?? '-'}</strong>
              <span>Riscaldamento</span><strong>{HEATING_LABELS[user.questionnaire.heating] ?? '-'}</strong>
              <span>Classe CECE</span><strong>{ENERGY_LABELS[user.questionnaire.energyClass] ?? '-'}</strong>
              <span>Obiettivi</span><strong>{(user.questionnaire.goals ?? []).join(', ')}</strong>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="panel-section">
          <h3>Note interne</h3>
          <textarea className="form-input panel-note" rows={3} value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note per il team (non visibili all'utente)..." />
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={save} disabled={saving}>
          {saving ? 'Salvataggio...' : '💾 Salva modifiche'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Admin Component ─────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate()
  const [adminToken, setAdminToken] = useState<string | null>(
    () => localStorage.getItem('arco2_admin_token'),
  )
  const [stats, setStats] = useState<Stats | null>(null)
  const [userList, setUserList] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  async function fetchAll(token: string) {
    setLoading(true)
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch(apiUrl('/api/admin/stats'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/admin/users'), { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (statsRes.status === 401 || usersRes.status === 401) {
        localStorage.removeItem('arco2_admin_token')
        setAdminToken(null)
        return
      }
      const s = await statsRes.json()
      const u = await usersRes.json()
      setStats(s)
      setUserList(u.users)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (adminToken) fetchAll(adminToken)
  }, [adminToken])

  async function updateUser(id: string, patch: object) {
    await fetch(apiUrl(`/api/admin/users/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(patch),
    })
    // Refresh data
    if (adminToken) await fetchAll(adminToken)
    // Update selected user
    setSelectedUser((prev) => prev?.id === id ? userList.find((u) => u.id === id) ?? null : prev)
  }

  function logout() {
    localStorage.removeItem('arco2_admin_token')
    setAdminToken(null)
  }

  if (!adminToken) return <AdminLogin onLogin={(t) => setAdminToken(t)} />

  const filtered = userList.filter((u) => {
    const matchSearch = search === '' ||
      `${u.firstName} ${u.lastName} ${u.email} ${u.municipality}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="admin-page">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span className="logo-mark">arCO</span><span className="logo-sub">₂</span>
          </button>
          <span className="admin-sidebar-tag">Backoffice</span>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-item admin-nav-active">
            <span>👥</span> Utenti
          </div>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-operator-info">
            <div className="admin-operator-avatar">OP</div>
            <div>
              <div className="admin-operator-name">Operatore</div>
              <div className="admin-operator-email">TicinoEnergia</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm admin-logout" onClick={logout}>Esci</button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────────────── */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1>Gestione utenti</h1>
            <p>Backoffice operatori TicinoEnergia</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => adminToken && fetchAll(adminToken)}>
            🔄 Aggiorna
          </button>
        </header>

        {loading ? (
          <div className="admin-loading">
            <div className="loading-spinner-lg"></div>
            <p>Caricamento dati...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            {stats && (
              <div className="admin-stats-row">
                <div className="admin-stat-card">
                  <div className="admin-stat-value">{stats.totalUsers}</div>
                  <div className="admin-stat-label">Utenti registrati</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-value">{stats.withQuestionnaire}</div>
                  <div className="admin-stat-label">Questionari completati</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-value">{stats.byStatus.consultant_assigned + stats.byStatus.in_progress}</div>
                  <div className="admin-stat-label">In gestione attiva</div>
                </div>
                <div className="admin-stat-card admin-stat-green">
                  <div className="admin-stat-value">{stats.byStatus.completed}</div>
                  <div className="admin-stat-label">Percorsi completati</div>
                </div>

                {/* Consultant load */}
                {stats.consultants.map((con) => (
                  <div key={con.id} className="admin-stat-card admin-stat-consultant">
                    <div className="admin-stat-value">{con.assignedCount}</div>
                    <div className="admin-stat-label">{con.firstName} {con.lastName}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="admin-filters">
              <input
                className="admin-search"
                type="text"
                placeholder="🔍  Cerca per nome, email, comune..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="admin-filter-chips">
                <button className={`filter-chip ${filterStatus === 'all' ? 'filter-chip-active' : ''}`}
                  onClick={() => setFilterStatus('all')}>Tutti ({userList.length})</button>
                {(Object.entries(STATUS_CONFIG) as [UserStatus, typeof STATUS_CONFIG[UserStatus]][]).map(([key, cfg]) => (
                  <button key={key}
                    className={`filter-chip ${filterStatus === key ? 'filter-chip-active' : ''}`}
                    onClick={() => setFilterStatus(key as UserStatus)}>
                    {cfg.icon} {cfg.label} ({stats?.byStatus[key] ?? 0})
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper">
              {filtered.length === 0 ? (
                <div className="admin-empty">
                  <span>🔍</span>
                  <p>Nessun utente trovato con i filtri selezionati.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Utente</th>
                      <th>Comune</th>
                      <th>Edificio</th>
                      <th>Riscaldamento</th>
                      <th>Classe</th>
                      <th>Consulente</th>
                      <th>Stato</th>
                      <th>Data reg.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const cfg = STATUS_CONFIG[u.status]
                      return (
                        <tr key={u.id} className={selectedUser?.id === u.id ? 'row-selected' : ''}
                          onClick={() => setSelectedUser(u)}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-sm">{u.firstName[0]}{u.lastName[0]}</div>
                              <div>
                                <div className="user-name">{u.firstName} {u.lastName}</div>
                                <div className="user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>{u.municipality}</td>
                          <td>{u.questionnaire ? BUILDING_LABELS[u.questionnaire.buildingType] ?? '–' : <span className="no-data">–</span>}</td>
                          <td>{u.questionnaire ? HEATING_LABELS[u.questionnaire.heating] ?? '–' : <span className="no-data">–</span>}</td>
                          <td>{u.questionnaire ? <span className={`energy-badge ec-${u.questionnaire.energyClass}`}>{ENERGY_LABELS[u.questionnaire.energyClass]}</span> : <span className="no-data">–</span>}</td>
                          <td>
                            <div className="consultant-cell">
                              <div className="user-avatar-sm consultant-avatar">{u.consultant.firstName[0]}{u.consultant.lastName[0]}</div>
                              <span>{u.consultant.firstName}</span>
                            </div>
                          </td>
                          <td><span className={`status-pill ${cfg.color}`}>{cfg.icon} {cfg.label}</span></td>
                          <td className="date-cell">{new Date(u.createdAt).toLocaleDateString('it-CH')}</td>
                          <td>
                            <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setSelectedUser(u) }}>
                              Gestisci →
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── User detail panel ────────────────────────────────────────────── */}
      {selectedUser && (
        <UserPanel
          user={selectedUser}
          consultants={stats?.consultants ?? []}
          onUpdate={updateUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}
