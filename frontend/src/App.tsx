import { createContext, useContext, useState, ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Questionnaire from './pages/Questionnaire'
import PreviewResults from './pages/PreviewResults'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

// ─── Auth Context ─────────────────────────────────────────────────────────────
interface AuthCtx {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({ token: null, setToken: () => {}, logout: () => {} })
export const useAuth = () => useContext(AuthContext)

// ─── Questionnaire Context ────────────────────────────────────────────────────
interface QCtx {
  tempToken: string | null
  setTempToken: (t: string | null) => void
  preview: PreviewData | null
  setPreview: (p: PreviewData | null) => void
}

export interface PreviewPathway {
  id: string
  titolo: string
  risparmioStimato: string
  riduzioneCO2: string
  etichetta: string
  priorita: string
  icona: string
  visible: boolean   // true = top 2, mostra dettagli; false = bloccato
}

export interface PreviewData {
  percorsiCount: number
  topPercorso: string
  secondPercorso: string
  risparmioTotale: string
  riduzioneCO2: string
  incentiviDisponibili: string
  pathwaysBlurred: PreviewPathway[]
}

const QContext = createContext<QCtx>({
  tempToken: null, setTempToken: () => {},
  preview: null, setPreview: () => {},
})
export const useQuestionnaire = () => useContext(QContext)

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/" replace />
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem('arco2_token'),
  )
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  function setToken(t: string | null) {
    setTokenState(t)
    if (t) localStorage.setItem('arco2_token', t)
    else localStorage.removeItem('arco2_token')
  }

  function logout() { setToken(null) }

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      <QContext.Provider value={{ tempToken, setTempToken, preview, setPreview }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/accedi" element={<Login />} />
            <Route path="/questionario" element={<Questionnaire />} />
            <Route path="/anteprima" element={<PreviewResults />} />
            <Route path="/registrati" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QContext.Provider>
    </AuthContext.Provider>
  )
}
