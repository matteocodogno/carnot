import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuestionnaire } from '../App'
import { QuestionnaireData } from '../types'
import { apiUrl } from '../lib/api'
import './Questionnaire.css'

interface Option {
  value: string
  label: string
  icon: string
  desc?: string
}

interface Step {
  id: keyof QuestionnaireData | 'obiettivi'
  question: string
  hint?: string
  type: 'single' | 'multi'
  options: Option[]
}

const STEPS: Step[] = [
  {
    id: 'tipoEdificio',
    question: 'Che tipo di edificio possiedi?',
    hint: 'Seleziona la tipologia che descrive meglio il tuo immobile',
    type: 'single',
    options: [
      { value: 'unifamiliare', label: 'Casa unifamiliare', icon: '🏡', desc: 'Villetta o casa indipendente' },
      { value: 'bifamiliare', label: 'Casa bifamiliare', icon: '🏘️', desc: 'Due unità abitative' },
      { value: 'appartamento', label: 'Appartamento', icon: '🏢', desc: 'Unità in condominio' },
      { value: 'altro', label: 'Altro', icon: '🏗️', desc: 'Rustico, edificio misto, ecc.' },
    ],
  },
  {
    id: 'annoCostruzione',
    question: 'Quando è stato costruito l\'edificio?',
    hint: 'L\'anno di costruzione influenza il tipo di isolamento e impianti presenti',
    type: 'single',
    options: [
      { value: 'prima_1960', label: 'Prima del 1960', icon: '🏛️', desc: 'Costruzione storica' },
      { value: '1960_1980', label: '1960 – 1980', icon: '🧱', desc: 'Periodo di intensa urbanizzazione' },
      { value: '1981_2000', label: '1981 – 2000', icon: '🏠', desc: 'Primi standard energetici' },
      { value: 'dopo_2000', label: 'Dopo il 2000', icon: '✨', desc: 'Costruzione moderna' },
    ],
  },
  {
    id: 'superficie',
    question: 'Qual è la superficie abitabile?',
    hint: 'La superficie determina il dimensionamento ottimale degli impianti',
    type: 'single',
    options: [
      { value: 'piccola', label: 'Meno di 80 m²', icon: '📐', desc: 'Appartamento piccolo o monolocale' },
      { value: 'media', label: '80 – 150 m²', icon: '📏', desc: 'Casa media o appartamento grande' },
      { value: 'grande', label: '150 – 250 m²', icon: '🏠', desc: 'Abitazione spaziosa' },
      { value: 'molto_grande', label: 'Più di 250 m²', icon: '🏡', desc: 'Villa o edificio grande' },
    ],
  },
  {
    id: 'riscaldamento',
    question: 'Come riscaldi attualmente la casa?',
    hint: 'Il sistema di riscaldamento è uno dei fattori principali per il risparmio energetico',
    type: 'single',
    options: [
      { value: 'gas_olio', label: 'Caldaia a gas o olio', icon: '🔥', desc: 'Combustibile fossile' },
      { value: 'pompa_calore', label: 'Pompa di calore', icon: '♨️', desc: 'Elettrica, già efficiente' },
      { value: 'teleriscaldamento', label: 'Teleriscaldamento', icon: '🌡️', desc: 'Rete di calore urbana' },
      { value: 'elettrico', label: 'Riscaldamento elettrico', icon: '⚡', desc: 'Radiatori o pavimento' },
      { value: 'pellet', label: 'Stufa a pellet o legna', icon: '🪵', desc: 'Biomassa' },
    ],
  },
  {
    id: 'classeEnergetica',
    question: 'Conosci la classe energetica dell\'edificio?',
    hint: 'La trovi nel certificato energetico CECE o nella documentazione di acquisto',
    type: 'single',
    options: [
      { value: 'non_so', label: 'Non lo so', icon: '❓', desc: 'Nessun certificato disponibile' },
      { value: 'gf', label: 'G o F — classe bassa', icon: '🔴', desc: 'Alto consumo energetico' },
      { value: 'ed', label: 'E o D — classe media', icon: '🟡', desc: 'Consumo nella media' },
      { value: 'cb', label: 'C o B — classe medio-alta', icon: '🟢', desc: 'Buona efficienza' },
      { value: 'a', label: 'A — classe alta', icon: '⭐', desc: 'Edificio efficiente' },
    ],
  },
  {
    id: 'obiettivi',
    question: 'Quali sono i tuoi obiettivi principali?',
    hint: 'Puoi selezionare più opzioni — ci aiuta a personalizzare i percorsi consigliati',
    type: 'multi',
    options: [
      { value: 'bollette', label: 'Ridurre le bollette', icon: '💰', desc: 'Risparmio economico immediato' },
      { value: 'comfort', label: 'Aumentare il comfort', icon: '🌡️', desc: 'Caldo d\'inverno, fresco d\'estate' },
      { value: 'valore', label: 'Valorizzare l\'immobile', icon: '📈', desc: 'Aumentare il valore di mercato' },
      { value: 'incentivi', label: 'Accedere a incentivi', icon: '💶', desc: 'Contributi cantonali e federali' },
      { value: 'co2', label: 'Ridurre le emissioni', icon: '🌿', desc: 'Impatto ambientale e CO₂' },
    ],
  },
]

const TOTAL_STEPS = STEPS.length

export default function Questionnaire() {
  const navigate = useNavigate()
  const { setTempToken, setPreview } = useQuestionnaire()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<QuestionnaireData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')

  const step = STEPS[currentStep]
  const progress = ((currentStep) / TOTAL_STEPS) * 100

  // Get current answer(s)
  const currentAnswer = answers[step.id as keyof QuestionnaireData]
  const currentMulti: string[] = Array.isArray(currentAnswer) ? currentAnswer : []

  function selectSingle(value: string) {
    setAnswers((prev) => ({ ...prev, [step.id]: value }))
  }

  function toggleMulti(value: string) {
    setAnswers((prev) => {
      const curr: string[] = Array.isArray(prev[step.id as keyof QuestionnaireData])
        ? (prev[step.id as keyof QuestionnaireData] as string[])
        : []
      const next = curr.includes(value) ? curr.filter((v) => v !== value) : [...curr, value]
      return { ...prev, [step.id]: next }
    })
  }

  function isAnswered(): boolean {
    const val = answers[step.id as keyof QuestionnaireData]
    if (step.type === 'single') return typeof val === 'string' && val.length > 0
    return Array.isArray(val) && val.length > 0
  }

  function goBack() {
    setDirection('back')
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  async function goNext() {
    if (!isAnswered()) return
    setDirection('forward')

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1)
      return
    }

    // Submit questionnaire
    setLoading(true)
    setError('')
    try {
      const payload: QuestionnaireData = {
        tipoEdificio: answers.tipoEdificio ?? '',
        annoCostruzione: answers.annoCostruzione ?? '',
        superficie: answers.superficie ?? '',
        riscaldamento: answers.riscaldamento ?? '',
        classeEnergetica: answers.classeEnergetica ?? '',
        obiettivi: Array.isArray(answers.obiettivi) ? answers.obiettivi : [],
      }

      const res = await fetch(apiUrl('/api/questionnaire'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Errore nel server')

      const data = await res.json()
      setTempToken(data.tempToken)
      setPreview(data.preview)
      navigate('/anteprima')
    } catch {
      setError('Errore di rete. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="questionnaire-page">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="q-header">
        <div className="q-header-inner">
          <button className="nav-logo" onClick={() => navigate('/')} style={{ background: 'none', border: 'none' }}>
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </button>
          <div className="q-progress-info">
            <span className="q-step-label">Domanda {currentStep + 1} di {TOTAL_STEPS}</span>
            <div className="progress-track" style={{ width: 200 }}>
              <div className="progress-fill" style={{ width: `${progress + (100 / TOTAL_STEPS)}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main ────────────────────────────────────────────────────────── */}
      <main className="q-main">
        <div className={`q-card card fade-in ${direction}`}>
          {/* Step indicator */}
          <div className="q-steps-dots">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`q-dot ${i < currentStep ? 'q-dot-done' : i === currentStep ? 'q-dot-active' : 'q-dot-pending'}`}
              />
            ))}
          </div>

          {/* Question */}
          <h1 className="q-question">{step.question}</h1>
          {step.hint && <p className="q-hint">{step.hint}</p>}
          {step.type === 'multi' && (
            <p className="q-multi-note">✓ Selezione multipla</p>
          )}

          {/* Options */}
          <div className={`q-options ${step.options.length === 5 ? 'q-options-5' : ''}`}>
            {step.options.map((opt) => {
              const isSelected =
                step.type === 'single'
                  ? currentAnswer === opt.value
                  : currentMulti.includes(opt.value)

              return (
                <button
                  key={opt.value}
                  className={`q-option ${isSelected ? 'q-option-selected' : ''}`}
                  onClick={() => step.type === 'single' ? selectSingle(opt.value) : toggleMulti(opt.value)}
                >
                  <span className="q-option-icon">{opt.icon}</span>
                  <span className="q-option-label">{opt.label}</span>
                  {opt.desc && <span className="q-option-desc">{opt.desc}</span>}
                  {isSelected && step.type === 'multi' && (
                    <span className="q-option-check">✓</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="q-nav">
            {currentStep > 0 && (
              <button className="btn btn-ghost" onClick={goBack}>
                ← Precedente
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={goNext}
              disabled={!isAnswered() || loading}
              style={{ marginLeft: 'auto' }}
            >
              {loading ? (
                <><span className="spinner"></span> Elaborazione...</>
              ) : currentStep === TOTAL_STEPS - 1 ? (
                'Vedi i miei percorsi →'
              ) : (
                'Avanti →'
              )}
            </button>
          </div>

          {error && <p className="q-error">{error}</p>}
        </div>
      </main>
    </div>
  )
}
