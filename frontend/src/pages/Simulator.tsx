import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PublicNav from '../components/PublicNav'
import './Simulator.css'

// ─── Calculation logic ────────────────────────────────────────────────────────

const BUILDING_TYPES = [
  { value: 'unifamiliare', label: 'Casa unifamiliare', icon: '🏡', desc: 'Villetta o casa indipendente' },
  { value: 'bifamiliare',  label: 'Casa bifamiliare',  icon: '🏘️', desc: 'Due unità abitative' },
  { value: 'appartamento', label: 'Appartamento',      icon: '🏢', desc: 'Unità in condominio' },
]

const YEAR_OPTIONS = [
  { value: 'prima_1960', label: 'Prima del 1960', icon: '🏛️', desc: 'Alto potenziale di risparmio' },
  { value: '1960_1980',  label: '1960 – 1980',    icon: '🧱', desc: 'Buon potenziale di risparmio' },
  { value: '1981_2000',  label: '1981 – 2000',    icon: '🏠', desc: 'Potenziale moderato' },
  { value: 'dopo_2000',  label: 'Dopo il 2000',   icon: '✨', desc: 'Potenziale limitato' },
]

const AREA_OPTIONS = [
  { value: 'piccola',      label: 'Meno di 80 m²',  icon: '📐' },
  { value: 'media',        label: '80 – 150 m²',    icon: '📏' },
  { value: 'grande',       label: '150 – 250 m²',   icon: '🏠' },
  { value: 'molto_grande', label: 'Più di 250 m²',  icon: '🏡' },
]

const INTERVENTIONS = [
  { value: 'isolation',    label: 'Isolamento involucro', icon: '🏠', shortLabel: 'Isolamento' },
  { value: 'heating',      label: 'Sostituzione riscaldamento', icon: '♨️', shortLabel: 'Riscaldamento' },
  { value: 'photovoltaic', label: 'Fotovoltaico + accumulo', icon: '☀️', shortLabel: 'Fotovoltaico' },
  { value: 'vmc',          label: 'Ventilazione (VMC)', icon: '💨', shortLabel: 'VMC' },
  { value: 'certification',label: 'Certificazione CECE', icon: '📋', shortLabel: 'CECE' },
]

interface InterventionData {
  savingsPercent: [number, number]
  costRange: [number, number]
  maxIncentiveBase: number
  co2Base: [number, number]
  duration: string
  incentivePrograms: string[]
}

const INTERVENTION_DATA: Record<string, InterventionData> = {
  isolation:    { savingsPercent: [20, 40], costRange: [20000, 80000], maxIncentiveBase: 25000, co2Base: [2, 8], duration: '4–8 settimane', incentivePrograms: ['Programma Edifici', 'Deduzioni fiscali cantonali', 'MiEfficienza'] },
  heating:      { savingsPercent: [30, 60], costRange: [15000, 40000], maxIncentiveBase: 18000, co2Base: [3, 12], duration: '1–2 settimane', incentivePrograms: ['Programma Edifici', 'ProKilowatt', 'Bonus federale pompa calore'] },
  photovoltaic: { savingsPercent: [20, 50], costRange: [20000, 45000], maxIncentiveBase: 12000, co2Base: [2, 6], duration: '2–5 giorni', incentivePrograms: ['RIC (contributo unico)', 'Deduzione fiscale federale', 'TicinoSolare'] },
  vmc:          { savingsPercent: [10, 20], costRange: [8000, 20000], maxIncentiveBase: 5000, co2Base: [1, 3], duration: '1–2 settimane', incentivePrograms: ['Programma Edifici (complementare)', 'Deduzioni fiscali cantonali'] },
  certification:{ savingsPercent: [0, 0], costRange: [800, 2500], maxIncentiveBase: 500, co2Base: [0, 0], duration: '1–3 giorni', incentivePrograms: ['UACER Ticino (contributo parziale)'] },
}

function ageMultiplier(year: string): number {
  if (year === 'prima_1960') return 1.0
  if (year === '1960_1980') return 0.8
  if (year === '1981_2000') return 0.55
  return 0.25
}

function areaMultiplier(area: string): number {
  if (area === 'piccola') return 0.55
  if (area === 'media') return 0.75
  if (area === 'grande') return 1.0
  return 1.3
}

function buildingMultiplier(type: string, intervention: string): number {
  if (intervention === 'photovoltaic' && type === 'appartamento') return 0.55
  if (type === 'unifamiliare') return 1.0
  if (type === 'bifamiliare') return 0.85
  if (type === 'appartamento') return 0.65
  return 1.0
}

interface SimResult {
  savingsMin: number
  savingsMax: number
  costMin: number
  costMax: number
  incentiveMin: number
  incentiveMax: number
  co2Min: number
  co2Max: number
  netCostMin: number
  netCostMax: number
  incentivePercent: number
  duration: string
  programs: string[]
}

function calculate(building: string, year: string, area: string, intervention: string): SimResult {
  const d = INTERVENTION_DATA[intervention]
  const ageMul = ageMultiplier(year)
  const areaMul = areaMultiplier(area)
  const buildMul = buildingMultiplier(building, intervention)
  const combined = ageMul * 0.5 + areaMul * 0.3 + buildMul * 0.2

  const savingsMin = Math.round(d.savingsPercent[0] * combined)
  const savingsMax = Math.round(d.savingsPercent[1] * combined + d.savingsPercent[0] * (1 - combined))

  const costMin = Math.round(d.costRange[0] * areaMul * buildMul)
  const costMax = Math.round(d.costRange[1] * areaMul * buildMul)

  const incentiveMax = Math.round(d.maxIncentiveBase * ageMul * buildMul)
  const incentiveMin = Math.round(incentiveMax * 0.4)

  const co2Min = Math.round(d.co2Base[0] * areaMul * ageMul)
  const co2Max = Math.round(d.co2Base[1] * areaMul)

  const netCostMin = Math.max(0, costMin - incentiveMax)
  const netCostMax = Math.max(0, costMax - incentiveMin)
  const incentivePercent = Math.round((incentiveMax / Math.max(costMin, 1)) * 100)

  return { savingsMin, savingsMax, costMin, costMax, incentiveMin, incentiveMax, co2Min, co2Max, netCostMin, netCostMax, incentivePercent, duration: d.duration, programs: d.incentivePrograms }
}

function formatCHF(n: number): string {
  return `CHF ${n.toLocaleString('it-CH')}`
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'building' | 'year' | 'area' | 'intervention' | 'result'

export default function Simulator() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('building')
  const [building, setBuilding] = useState('')
  const [year, setYear] = useState('')
  const [area, setArea] = useState('')
  const [intervention, setIntervention] = useState('')

  const STEPS: Step[] = ['building', 'year', 'area', 'intervention', 'result']
  const currentIdx = STEPS.indexOf(step)
  const progress = (currentIdx / (STEPS.length - 1)) * 100

  function selectAndNext(field: string, value: string, next: Step) {
    if (field === 'building') setBuilding(value)
    if (field === 'year') setYear(value)
    if (field === 'area') setArea(value)
    if (field === 'intervention') setIntervention(value)
    setStep(next)
  }

  const result = step === 'result' && building && year && area && intervention
    ? calculate(building, year, area, intervention)
    : null

  const isCertification = intervention === 'certification'

  return (
    <div className="sim-page">
      <PublicNav />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      {step === 'building' && (
        <section className="sim-hero">
          <div className="sim-hero-inner">
            <div className="sim-hero-badge">Gratuito · Nessun dato personale richiesto</div>
            <h1 className="sim-hero-title">Calcola incentivi e<br /><span className="sim-hero-accent">risparmio del tuo edificio</span></h1>
            <p className="sim-hero-sub">4 semplici domande per stimare gli incentivi cantonali e federali disponibili per il tuo intervento energetico.</p>
          </div>
        </section>
      )}

      {/* ─── Progress ─────────────────────────────────────────────────── */}
      {step !== 'building' && (
        <div className="sim-progress-bar">
          <div className="sim-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {/* ─── Step content ─────────────────────────────────────────────── */}
      <main className="sim-main">
        {step === 'building' && (
          <div className="sim-step fade-in">
            <h2 className="sim-step-title">Che tipo di edificio possiedi?</h2>
            <div className="sim-options sim-options-3">
              {BUILDING_TYPES.map((opt) => (
                <button key={opt.value} className="sim-option"
                  onClick={() => selectAndNext('building', opt.value, 'year')}>
                  <span className="sim-opt-icon">{opt.icon}</span>
                  <span className="sim-opt-label">{opt.label}</span>
                  <span className="sim-opt-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'year' && (
          <div className="sim-step fade-in">
            <h2 className="sim-step-title">Quando è stato costruito l'edificio?</h2>
            <div className="sim-options sim-options-4">
              {YEAR_OPTIONS.map((opt) => (
                <button key={opt.value} className="sim-option"
                  onClick={() => selectAndNext('year', opt.value, 'area')}>
                  <span className="sim-opt-icon">{opt.icon}</span>
                  <span className="sim-opt-label">{opt.label}</span>
                  <span className="sim-opt-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
            <button className="sim-back" onClick={() => setStep('building')}>← Indietro</button>
          </div>
        )}

        {step === 'area' && (
          <div className="sim-step fade-in">
            <h2 className="sim-step-title">Qual è la superficie abitabile?</h2>
            <div className="sim-options sim-options-4">
              {AREA_OPTIONS.map((opt) => (
                <button key={opt.value} className="sim-option"
                  onClick={() => selectAndNext('area', opt.value, 'intervention')}>
                  <span className="sim-opt-icon">{opt.icon}</span>
                  <span className="sim-opt-label">{opt.label}</span>
                </button>
              ))}
            </div>
            <button className="sim-back" onClick={() => setStep('year')}>← Indietro</button>
          </div>
        )}

        {step === 'intervention' && (
          <div className="sim-step fade-in">
            <h2 className="sim-step-title">Quale intervento vuoi simulare?</h2>
            <div className="sim-options sim-options-5">
              {INTERVENTIONS.map((opt) => (
                <button key={opt.value} className="sim-option"
                  onClick={() => selectAndNext('intervention', opt.value, 'result')}>
                  <span className="sim-opt-icon">{opt.icon}</span>
                  <span className="sim-opt-label">{opt.label}</span>
                </button>
              ))}
            </div>
            <button className="sim-back" onClick={() => setStep('area')}>← Indietro</button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="sim-result fade-in">
            {/* Summary chips */}
            <div className="sim-summary-chips">
              {[
                BUILDING_TYPES.find((b) => b.value === building)!,
                { icon: YEAR_OPTIONS.find((y) => y.value === year)!.icon, label: YEAR_OPTIONS.find((y) => y.value === year)!.label },
                { icon: AREA_OPTIONS.find((a) => a.value === area)!.icon, label: AREA_OPTIONS.find((a) => a.value === area)!.label },
                { icon: INTERVENTIONS.find((i) => i.value === intervention)!.icon, label: INTERVENTIONS.find((i) => i.value === intervention)!.shortLabel },
              ].map((item, i) => (
                <div key={i} className="sim-chip">
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
              <button className="sim-chip sim-chip-reset" onClick={() => setStep('building')}>
                ✏️ Modifica
              </button>
            </div>

            <h2 className="sim-result-title">Risultati della simulazione</h2>
            <p className="sim-result-sub">Stime indicative basate sulle informazioni fornite e sui programmi di incentivazione vigenti in Ticino.</p>

            {/* Main result cards */}
            <div className="sim-result-cards">
              <div className="sim-result-card sim-card-incentive">
                <div className="src-icon">💶</div>
                <div className="src-value">{formatCHF(result.incentiveMin)} – {formatCHF(result.incentiveMax)}</div>
                <div className="src-label">Incentivi disponibili</div>
                <div className="src-detail">Fino al {result.incentivePercent}% del costo dell'intervento</div>
              </div>

              {!isCertification && (
                <div className="sim-result-card sim-card-savings">
                  <div className="src-icon">💰</div>
                  <div className="src-value">{result.savingsMin}% – {result.savingsMax}%</div>
                  <div className="src-label">Risparmio energetico</div>
                  <div className="src-detail">Stima annuale post-intervento</div>
                </div>
              )}

              <div className="sim-result-card sim-card-net">
                <div className="src-icon">🏷️</div>
                <div className="src-value">{formatCHF(result.netCostMin)} – {formatCHF(result.netCostMax)}</div>
                <div className="src-label">Costo netto stimato</div>
                <div className="src-detail">Dopo deduzione incentivi massimi</div>
              </div>

              {!isCertification && (
                <div className="sim-result-card sim-card-co2">
                  <div className="src-icon">🌿</div>
                  <div className="src-value">{result.co2Min} – {result.co2Max} t</div>
                  <div className="src-label">CO₂ evitata / anno</div>
                  <div className="src-detail">Riduzione emissioni annue</div>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="sim-breakdown">
              <div className="sim-breakdown-col">
                <h3>💳 Dettaglio costi</h3>
                <div className="sim-bd-rows">
                  <div className="sim-bd-row">
                    <span>Costo lordo stimato</span>
                    <span>{formatCHF(result.costMin)} – {formatCHF(result.costMax)}</span>
                  </div>
                  <div className="sim-bd-row sim-bd-incentive">
                    <span>Incentivi massimi</span>
                    <span className="sim-bd-green">– {formatCHF(result.incentiveMax)}</span>
                  </div>
                  <div className="sim-bd-sep"></div>
                  <div className="sim-bd-row sim-bd-net">
                    <span>Costo netto</span>
                    <span>{formatCHF(result.netCostMin)} – {formatCHF(result.netCostMax)}</span>
                  </div>
                  <div className="sim-bd-row sim-bd-duration">
                    <span>⏱ Durata lavori</span>
                    <span>{result.duration}</span>
                  </div>
                </div>
              </div>

              <div className="sim-breakdown-col">
                <h3>📋 Programmi di incentivazione</h3>
                <div className="sim-programs">
                  {result.programs.map((p, i) => (
                    <div key={i} className="sim-program-row">
                      <span className="sim-prog-dot"></span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div className="sim-note">
                  ℹ️ Gli incentivi dipendono dalla situazione specifica dell'edificio. Il tuo consulente arCO₂ ti fornirà un quadro preciso e aggiornato.
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="sim-cta">
              <div className="sim-cta-inner">
                <div className="sim-cta-text">
                  <h3>Vuoi un'analisi precisa per il tuo edificio?</h3>
                  <p>Il questionario arCO₂ genera un percorso personalizzato con incentivi reali e un consulente dedicato.</p>
                </div>
                <div className="sim-cta-buttons">
                  <button className="btn btn-primary" onClick={() => navigate('/questionario')}>
                    Fai il questionario gratuito →
                  </button>
                  <button className="btn btn-ghost" onClick={() => setStep('building')}>
                    Nuova simulazione
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
