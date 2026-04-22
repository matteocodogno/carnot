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

  function handleNav(path: string) {
    if (path.startsWith('/#')) {
      // Anchor link: go to landing first, then scroll
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
        <button className="nav-logo public-nav-logo" onClick={() => navigate('/')}>
          <span className="logo-mark">arCO</span>
          <span className="logo-sub">₂</span>
        </button>

        {/* Links */}
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

        {/* CTA */}
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
      </div>
    </header>
  )
}
