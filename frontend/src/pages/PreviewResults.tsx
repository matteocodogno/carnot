import { useNavigate } from 'react-router-dom'
import { useQuestionnaire } from '../App'
import { PreviewPathway } from '../App'
import './PreviewResults.css'

export default function PreviewResults() {
  const navigate = useNavigate()
  const { preview } = useQuestionnaire()

  if (!preview) {
    navigate('/questionario')
    return null
  }

  const pathways: PreviewPathway[] = preview.pathwaysBlurred ?? []

  return (
    <div className="preview-page">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="q-header">
        <div className="q-header-inner">
          <button className="nav-logo" onClick={() => navigate('/')} style={{ background: 'none', border: 'none' }}>
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </button>
          <div className="q-progress-info">
            <span className="q-step-label" style={{ color: 'var(--color-green)', fontWeight: 600 }}>
              ✅ Analisi completata
            </span>
          </div>
        </div>
      </header>

      <main className="preview-main">
        {/* ─── Result banner ──────────────────────────────────────────── */}
        <div className="preview-banner fade-in">
          <div className="preview-banner-icon">🎯</div>
          <div>
            <h1 className="preview-banner-title">La tua analisi è pronta!</h1>
            <p className="preview-banner-sub">
              Abbiamo identificato <strong>{preview.percorsiCount} percorsi di efficientamento</strong> per il tuo edificio.
              Crea un account gratuito per accedere ai risultati completi e al tuo consulente arCO₂.
            </p>
          </div>
        </div>

        {/* ─── Stats row ──────────────────────────────────────────────── */}
        <div className="preview-stats fade-in">
          <div className="preview-stat card">
            <span className="preview-stat-value">{preview.risparmioTotale}</span>
            <span className="preview-stat-label">risparmio energetico potenziale</span>
          </div>
          <div className="preview-stat card">
            <span className="preview-stat-value">{preview.riduzioneCO2}</span>
            <span className="preview-stat-label">riduzione CO₂ annua</span>
          </div>
          <div className="preview-stat card">
            <span className="preview-stat-value">{preview.incentiviDisponibili}</span>
            <span className="preview-stat-label">incentivi disponibili</span>
          </div>
        </div>

        <div className="preview-columns">
          {/* ─── Pathways preview ───────────────────────────────────── */}
          <div className="preview-pathways">
            <h2 className="preview-section-title">
              I {preview.percorsiCount} percorsi identificati per te
            </h2>

            {pathways.length === 0 ? (
              <div className="preview-pathways-empty">
                <span>⚠️</span>
                <p>Nessun percorso disponibile. <button onClick={() => navigate('/questionario')} className="btn btn-ghost btn-sm">Rifai il questionario</button></p>
              </div>
            ) : (
              <div className="preview-pathway-list">
                {pathways.map((p, i) => (
                  <PathwayPreviewCard key={p.id} pathway={p} rank={i + 1} />
                ))}
              </div>
            )}
          </div>

          {/* ─── CTA panel ──────────────────────────────────────────── */}
          <div className="preview-cta-panel">
            <div className="cta-panel card">
              <div className="cta-panel-icon">✨</div>
              <h3>Accedi ai risultati completi</h3>
              <p>Crea il tuo account gratuito per:</p>
              <ul className="cta-benefits">
                <li>📋 Tutti i {preview.percorsiCount} percorsi con dettagli, costi e incentivi</li>
                <li>👤 Un consulente arCO₂ assegnato personalmente</li>
                <li>📁 Il dossier edificio digitale</li>
                <li>💶 Lista completa degli incentivi accessibili</li>
                <li>📅 Supporto per ogni fase dell'intervento</li>
              </ul>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-4)' }}
                onClick={() => navigate('/registrati')}
              >
                Crea account gratuito →
              </button>
              <p className="cta-note">Nessun costo, nessun impegno. Solo la tua email.</p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }}
                onClick={() => navigate('/questionario')}
              >
                ← Rifai il questionario
              </button>
            </div>

            {/* Social proof */}
            <div className="preview-social-proof card">
              <p className="sp-text">"Grazie ad arCO₂ ho ridotto il mio fabbisogno energetico del 42% con la sostituzione della caldaia e l'isolamento del tetto."</p>
              <div className="sp-author">
                <div className="sp-avatar">MR</div>
                <div>
                  <div className="sp-name">Mario R.</div>
                  <div className="sp-loc">Lugano · Casa unifamiliare 1975</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Pathway preview card ──────────────────────────────────────────────────────
function PathwayPreviewCard({ pathway, rank }: { pathway: PreviewPathway; rank: number }) {
  const badgeClass =
    pathway.priorita === 'alta' ? 'badge-alta' :
    pathway.priorita === 'media' ? 'badge-media' : 'badge-bassa'

  return (
    <div className={`preview-pathway-card card ${!pathway.visible ? 'preview-pathway-locked' : 'preview-pathway-visible'}`}>
      <div className="ppc-rank-col">
        <div className={`ppc-rank rank-${rank <= 2 ? rank : 'other'}`}>{rank}</div>
      </div>

      <div className="ppc-icon-col">
        <span className="ppc-icon">{pathway.icona}</span>
      </div>

      <div className="ppc-content">
        <div className="ppc-title-row">
          <span className="ppc-title">{pathway.titolo}</span>
          <span className={`badge ${badgeClass}`}>{pathway.etichetta}</span>
        </div>

        {pathway.visible ? (
          /* Top 2: mostra statistiche chiave */
          <div className="ppc-stats">
            <span className="ppc-stat">
              <span className="ppc-stat-icon">💰</span>
              <span className="ppc-stat-value">{pathway.risparmioStimato}</span>
              <span className="ppc-stat-label">risparmio</span>
            </span>
            <span className="ppc-stat-divider" />
            <span className="ppc-stat">
              <span className="ppc-stat-icon">🌿</span>
              <span className="ppc-stat-value">{pathway.riduzioneCO2}</span>
              <span className="ppc-stat-label">CO₂ ridotta</span>
            </span>
            <span className="ppc-stat-divider" />
            <span className="ppc-stat-unlock">
              🔓 Costi e incentivi → registrati
            </span>
          </div>
        ) : (
          /* Altri: mostra solo il titolo + lock */
          <div className="ppc-locked-hint">
            <span className="ppc-lock-icon">🔒</span>
            <span>Dettagli disponibili dopo la registrazione</span>
          </div>
        )}
      </div>
    </div>
  )
}
