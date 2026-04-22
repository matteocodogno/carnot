import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import './PublicNav.css'

const NAV_LINKS = [
  { label: 'Come funziona', path: '/#come-funziona', exact: false },
  { label: 'Percorsi',      path: '/percorsi',        exact: true },
  { label: 'Simulatore',    path: '/simulatore',      exact: true },
  { label: 'FAQ',           path: '/faq',             exact: true },
]

export default function PublicNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleNav(path: string) {
    setMobileOpen(false)
    if (path.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/')
        setTimeout(() => {
          const id = path.slice(2)
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        const id = path.slice(2)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(path)
    }
  }

  function isActive(path: string): boolean {
    if (path.startsWith('/#')) return location.pathname === '/'
    return location.pathname === path
  }

  return (
    <header className="public-nav">
      <div className="public-nav-container">
        {/* Logo */}
        <button className="nav-logo public-nav-logo" onClick={() => handleNav('/')}>
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </button>

        {/* Desktop links */}
        <nav className="public-nav-links">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              className={`public-nav-link ${isActive(link.path) ? 'public-nav-link-active' : ''}`}
              onClick={() => handleNav(link.path)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="public-nav-cta">
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

        {/* Mobile hamburger */}
        <button
          className="public-nav-hamburger"
          aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="public-nav-mobile-menu">
          {NAV_LINKS.map((link) => (
            <button
              key={link.path}
              className={`public-nav-mobile-link ${isActive(link.path) ? 'public-nav-link-active' : ''}`}
              onClick={() => handleNav(link.path)}
            >
              {link.label}
            </button>
          ))}

          <div className="public-nav-mobile-divider" />

          {token ? (
            <button className="btn btn-primary" onClick={() => { setMobileOpen(false); navigate('/dashboard') }}>
              Vai alla dashboard →
            </button>
          ) : (
            <div className="public-nav-mobile-cta">
              <button className="btn btn-ghost" onClick={() => { setMobileOpen(false); navigate('/accedi') }}>
                Accedi
              </button>
              <button className="btn btn-primary" onClick={() => { setMobileOpen(false); navigate('/questionario') }}>
                Inizia ora →
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  )
}
