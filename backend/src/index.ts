import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { v4 as uuidv4 } from 'uuid'

const app = new Hono()

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allowed origins: in production, FRONTEND_URL is added via env var
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface QuestionnaireData {
  buildingType: string
  yearBuilt: string
  area: string
  heating: string
  energyClass: string
  goals: string[]
}

interface Consultant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialization: string
  availability: string
  experience: string
}

type UserStatus = 'new' | 'questionnaire_done' | 'consultant_assigned' | 'in_progress' | 'completed'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  municipality: string
  questionnaire?: QuestionnaireData
  createdAt: Date
  consultant: Consultant
  status: UserStatus
  adminNote?: string
}

interface Pathway {
  id: string
  title: string
  description: string
  score: number
  estimatedSavings: string
  savingsKwh: string
  estimatedCost: string
  incentives: string[]
  maxIncentive: string
  duration: string
  co2Reduction: string
  icon: string
  label: string
  priority: 'high' | 'medium' | 'low'
  steps: string[]
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────
const users = new Map<string, User>()
const sessions = new Map<string, string>() // token → userId
const tempQuestionnaires = new Map<string, QuestionnaireData>() // tempToken → data
const adminSessions = new Set<string>() // admin tokens

// ─── ADMIN CREDENTIALS (hardcoded for demo) ───────────────────────────────────
const ADMIN_EMAIL = 'admin@ticinoenergia.ch'
const ADMIN_PASSWORD = 'arco2admin'

// ─── CONSULTANT POOL ─────────────────────────────────────────────────────────
const consultants: Consultant[] = [
  {
    id: 'c1',
    firstName: 'Marco',
    lastName: 'Bernasconi',
    email: 'm.bernasconi@arco2.ch',
    phone: '+41 91 123 45 67',
    specialization: 'Transizione energetica residenziale',
    availability: 'Lun–Ven 8:30–17:30',
    experience: '12 anni nel settore energetico ticinese',
  },
  {
    id: 'c2',
    firstName: 'Laura',
    lastName: 'Fontana',
    email: 'l.fontana@arco2.ch',
    phone: '+41 91 234 56 78',
    specialization: 'Efficienza energetica e rinnovabili',
    availability: 'Lun–Gio 9:00–18:00',
    experience: '8 anni, esperta CECE e incentivi cantonali',
  },
  {
    id: 'c3',
    firstName: 'Andrea',
    lastName: 'Russo',
    email: 'a.russo@arco2.ch',
    phone: '+41 91 345 67 89',
    specialization: 'Incentivi, finanziamenti e pompe di calore',
    availability: 'Mar–Sab 8:00–17:00',
    experience: '10 anni, ex funzionario UACER',
  },
]

// ─── PATHWAY RECOMMENDATION ENGINE ───────────────────────────────────────────
function calculatePathways(q: QuestionnaireData): Pathway[] {
  // Initialize scores
  const scores: Record<string, number> = {
    isolation: 0,
    heating: 0,
    photovoltaic: 0,
    vmc: 0,
    certification: 0,
  }

  // 1. Building age
  if (q.yearBuilt === 'prima_1960') {
    scores.isolation += 5; scores.heating += 3; scores.vmc += 2; scores.certification += 3
  } else if (q.yearBuilt === '1960_1980') {
    scores.isolation += 4; scores.heating += 3; scores.vmc += 1; scores.certification += 2
  } else if (q.yearBuilt === '1981_2000') {
    scores.isolation += 2; scores.heating += 2; scores.certification += 1
  } else {
    scores.photovoltaic += 1
  }

  // 2. Heating system
  if (q.heating === 'gas_olio') {
    scores.heating += 5; scores.photovoltaic += 1
  } else if (q.heating === 'elettrico') {
    scores.photovoltaic += 3; scores.isolation += 1
  } else if (q.heating === 'pellet') {
    scores.heating += 2; scores.photovoltaic += 2
  } else if (q.heating === 'pompa_calore') {
    scores.photovoltaic += 4; scores.isolation += 1
  }

  // 3. Energy class
  if (q.energyClass === 'gf') {
    scores.isolation += 4; scores.certification += 4; scores.vmc += 2
  } else if (q.energyClass === 'ed') {
    scores.isolation += 2; scores.certification += 3
  } else if (q.energyClass === 'cb') {
    scores.certification += 1
  } else if (q.energyClass === 'non_so') {
    scores.certification += 3
  }

  // 4. Building type affects PV potential
  if (q.buildingType === 'unifamiliare') {
    scores.photovoltaic += 3
  } else if (q.buildingType === 'bifamiliare') {
    scores.photovoltaic += 2
  } else if (q.buildingType === 'appartamento') {
    scores.photovoltaic -= 1
  }

  // 5. Surface area
  if (q.area === 'molto_grande') {
    scores.photovoltaic += 2; scores.isolation += 1
  } else if (q.area === 'grande') {
    scores.photovoltaic += 1
  }

  // 6. Objectives
  if (q.goals.includes('bollette')) {
    scores.photovoltaic += 2; scores.isolation += 1; scores.heating += 1
  }
  if (q.goals.includes('co2')) {
    scores.heating += 2; scores.photovoltaic += 2
  }
  if (q.goals.includes('valore')) {
    scores.certification += 3; scores.isolation += 2
  }
  if (q.goals.includes('incentivi')) {
    scores.heating += 2; scores.isolation += 1
  }
  if (q.goals.includes('comfort')) {
    scores.isolation += 2; scores.vmc += 3
  }

  // Define all pathways with enriched content
  const definitions: Pathway[] = [
    {
      id: 'isolation',
      title: 'Risanamento energetico dell\'involucro',
      description: 'Isolamento termico di pareti, tetto e sostituzione degli infissi per eliminare le dispersioni termiche e ridurre il fabbisogno energetico dell\'edificio.',
      score: scores.isolation,
      estimatedSavings: '25–40%',
      savingsKwh: '8.000–15.000 kWh/anno',
      estimatedCost: 'CHF 30.000 – 80.000',
      incentives: ['Programma Edifici (fino al 30%)', 'Deduzioni fiscali cantonali', 'MiEfficienza'],
      maxIncentive: 'CHF 25.000',
      duration: '4–8 settimane',
      co2Reduction: '3–8 t CO₂/anno',
      icon: '🏠',
      label: '',
      priority: 'high',
      steps: ['Analisi energetica dell\'edificio (CECE)', 'Scelta materiali isolanti', 'Richiesta offerte a imprese qualificate', 'Inoltro pratica incentivi', 'Lavori di risanamento'],
    },
    {
      id: 'heating',
      title: 'Sostituzione impianto di riscaldamento',
      description: 'Passaggio da caldaia fossile (gas/olio) a pompa di calore ad alta efficienza, con eventuale integrazione di serbatoio d\'accumulo.',
      score: scores.heating,
      estimatedSavings: '30–60%',
      savingsKwh: '5.000–12.000 kWh/anno',
      estimatedCost: 'CHF 15.000 – 40.000',
      incentives: ['Programma Edifici', 'ProKilowatt', 'BancaStato mutuo verde', 'Bonus federale pompa calore'],
      maxIncentive: 'CHF 18.000',
      duration: '1–2 settimane',
      co2Reduction: '4–12 t CO₂/anno',
      icon: '🌡️',
      label: '',
      priority: 'high',
      steps: ['Verifica idoneità edificio', 'Analisi del carico termico', 'Confronto offerte installatori', 'Richiesta incentivi cantonali', 'Installazione e collaudo'],
    },
    {
      id: 'photovoltaic',
      title: 'Impianto fotovoltaico + accumulo',
      description: 'Produzione di energia elettrica rinnovabile con sistema di accumulo a batteria per massimizzare l\'autoconsumo e ridurre la dipendenza dalla rete.',
      score: scores.photovoltaic,
      estimatedSavings: '20–50%',
      savingsKwh: '4.000–10.000 kWh/anno',
      estimatedCost: 'CHF 20.000 – 45.000',
      incentives: ['RIC – Rimunerazione Investimento (contributo unico)', 'Deduzione fiscale federale (investimento)', 'TicinoSolare (comune Lugano e altri)'],
      maxIncentive: 'CHF 12.000',
      duration: '2–5 giorni',
      co2Reduction: '2–6 t CO₂/anno',
      icon: '☀️',
      label: '',
      priority: 'medium',
      steps: ['Analisi ombreggiatura e orientamento tetto', 'Dimensionamento impianto', 'Offerta installatore accreditato', 'Richiesta allacciamento alla rete', 'Registrazione incentivi RIC'],
    },
    {
      id: 'vmc',
      title: 'Ventilazione meccanica controllata',
      description: 'Sistema di ricambio d\'aria con recupero di calore: garantisce qualità dell\'aria ottimale e riduce le perdite energetiche legate alla ventilazione naturale.',
      score: scores.vmc,
      estimatedSavings: '10–20%',
      savingsKwh: '1.500–4.000 kWh/anno',
      estimatedCost: 'CHF 8.000 – 20.000',
      incentives: ['Programma Edifici (complementare)', 'Deduzioni fiscali cantonali'],
      maxIncentive: 'CHF 5.000',
      duration: '1–2 settimane',
      co2Reduction: '1–3 t CO₂/anno',
      icon: '💨',
      label: '',
      priority: 'low',
      steps: ['Analisi ricambio d\'aria attuale', 'Dimensionamento ventilazione', 'Scelta sistema (centralizzato/decentralizzato)', 'Installazione e messa in servizio'],
    },
    {
      id: 'certification',
      title: 'Certificazione energetica CECE',
      description: 'Audit energetico professionale che stabilisce la classe energetica reale dell\'edificio e definisce la roadmap ottimale di interventi con stima di costi e incentivi.',
      score: scores.certification,
      estimatedSavings: 'Analisi preliminare',
      savingsKwh: 'Da quantificare dopo audit',
      estimatedCost: 'CHF 800 – 2.500',
      incentives: ['UACER Ticino (contributo parziale audit)'],
      maxIncentive: 'CHF 500',
      duration: '1–3 giorni',
      co2Reduction: 'Roadmap personalizzata',
      icon: '📋',
      label: '',
      priority: 'medium',
      steps: ['Richiesta al certificatore CECE accreditato', 'Sopralluogo e raccolta dati', 'Emissione certificato energetico', 'Piano d\'azione consigliato'],
    },
  ]

  // Sort by score descending
  definitions.sort((a, b) => b.score - a.score)

  // Apply labels
  return definitions.map((p, i) => ({
    ...p,
    label: i === 0 ? 'Fortemente consigliato' : i === 1 ? 'Consigliato' : i === 2 ? 'Da valutare' : 'Opzionale',
    priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  }))
}

// ─── DETERMINISTIC ESTIMATE (for preview and dashboard) ──────────────────────
// Logic consistent with RFP requirements: old buildings + fossil fuel = high potential

function ageFactor(q: QuestionnaireData): number {
  // Coefficient 0–1 for building age
  if (q.yearBuilt === 'prima_1960') return 1.0
  if (q.yearBuilt === '1960_1980') return 0.8
  if (q.yearBuilt === '1981_2000') return 0.5
  return 0.2
}

function fuelFactor(q: QuestionnaireData): number {
  if (q.heating === 'gas_olio') return 1.0
  if (q.heating === 'pellet') return 0.5
  if (q.heating === 'elettrico') return 0.6
  if (q.heating === 'teleriscaldamento') return 0.3
  return 0.2 // heat pump already efficient
}

function energyClassFactor(q: QuestionnaireData): number {
  if (q.energyClass === 'gf') return 1.0
  if (q.energyClass === 'ed') return 0.7
  if (q.energyClass === 'non_so') return 0.6
  if (q.energyClass === 'cb') return 0.35
  return 0.15 // class A
}

function combinedFactor(q: QuestionnaireData): number {
  return (ageFactor(q) * 0.4 + fuelFactor(q) * 0.4 + energyClassFactor(q) * 0.2)
}

function estimateSavingsMin(q: QuestionnaireData): number {
  return Math.round(15 + combinedFactor(q) * 25)
}
function estimateSavingsMax(q: QuestionnaireData): number {
  return Math.round(30 + combinedFactor(q) * 40)
}
function estimateCo2Min(q: QuestionnaireData): number {
  const base = q.area === 'molto_grande' ? 8 : q.area === 'grande' ? 6 : q.area === 'media' ? 4 : 2
  return Math.round(base * (0.4 + combinedFactor(q) * 0.6))
}
function estimateCo2Max(q: QuestionnaireData): number {
  const base = q.area === 'molto_grande' ? 22 : q.area === 'grande' ? 16 : q.area === 'media' ? 12 : 7
  return Math.round(base * (0.4 + combinedFactor(q) * 0.6))
}
function estimateIncentivesMin(q: QuestionnaireData): number {
  // Minimum incentive: CECE certification always accessible
  const base = 5000
  const bonus = q.heating === 'gas_olio' ? 8000 : 3000
  return base + bonus
}
function estimateIncentivesMax(q: QuestionnaireData): number {
  // Maximum incentive: cumulating Building Program + ProKilowatt + RIC
  const base = 18000
  const ageBon = ageFactor(q) > 0.7 ? 15000 : 8000
  const fuelBon = fuelFactor(q) > 0.7 ? 12000 : 5000
  return base + ageBon + fuelBon
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAuthUser(authHeader: string | undefined): User | null {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const userId = sessions.get(token)
  if (!userId) return null
  return users.get(userId) ?? null
}

function getAdminAuth(authHeader: string | undefined): boolean {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return false
  return adminSessions.has(token)
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health
app.get('/api/health', (c) =>
  c.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }),
)

// Submit questionnaire → save temp + return preview
app.post('/api/questionnaire', async (c) => {
  const body = (await c.req.json()) as QuestionnaireData
  const pathways = calculatePathways(body)
  const tempToken = uuidv4()
  tempQuestionnaires.set(tempToken, body)

  // Auto-expire after 30 min
  setTimeout(() => tempQuestionnaires.delete(tempToken), 30 * 60 * 1000)

  // ── Deterministic estimate savings / CO₂ / incentives ──────────────────────
  // Based on RFP key factors (year, heating, class)
  const savingsMin = estimateSavingsMin(body)
  const savingsMax = estimateSavingsMax(body)
  const co2Min = estimateCo2Min(body)
  const co2Max = estimateCo2Max(body)
  const incMin = estimateIncentivesMin(body)
  const incMax = estimateIncentivesMax(body)

  return c.json({
    success: true,
    tempToken,
    preview: {
      pathwayCount: pathways.length,
      topPathway: pathways[0].title,
      secondPathway: pathways[1]?.title,
      totalSavings: `${savingsMin}–${savingsMax}%`,
      co2Reduction: `${co2Min}–${co2Max} t CO₂/anno`,
      availableIncentives: `CHF ${incMin.toLocaleString('it-CH')} – ${incMax.toLocaleString('it-CH')}`,
      // pathways is INSIDE preview so setPreview(data.preview) includes it
      pathways: pathways.map((p, i) => ({
        id: p.id,
        title: p.title,          // all visible in preview
        estimatedSavings: p.estimatedSavings,
        co2Reduction: p.co2Reduction,
        label: p.label,
        priority: p.priority,
        icon: p.icon,
        visible: i < 2,            // full details only for top 2
      })),
    },
  })
})

// Register new user
app.post('/api/register', async (c) => {
  const body = await c.req.json()
  const { firstName, lastName, email, password, municipality, tempToken } = body as {
    firstName: string; lastName: string; email: string
    password: string; municipality: string; tempToken?: string
  }

  if (!firstName || !lastName || !email || !password || !municipality) {
    return c.json({ error: 'Tutti i campi sono obbligatori' }, 400)
  }

  // Check duplicate email
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return c.json({ error: 'Email già registrata. Accedi invece.' }, 400)
    }
  }

  // Recover questionnaire
  let questionnaireData: QuestionnaireData | undefined
  if (tempToken) {
    questionnaireData = tempQuestionnaires.get(tempToken)
    if (questionnaireData) tempQuestionnaires.delete(tempToken)
  }

  // Assign consultant round-robin
  const consultant = consultants[users.size % consultants.length]

  const userId = uuidv4()
  const user: User = {
    id: userId, firstName, lastName, email, password, municipality,
    questionnaire: questionnaireData,
    createdAt: new Date(),
    consultant,
    status: questionnaireData ? 'questionnaire_done' : 'new',
  }
  users.set(userId, user)

  const token = uuidv4()
  sessions.set(token, userId)

  return c.json({ success: true, token, userId })
})

// Login
app.post('/api/login', async (c) => {
  const { email, password } = (await c.req.json()) as { email: string; password: string }
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase() && user.password === password) {
      const token = uuidv4()
      sessions.set(token, user.id)
      return c.json({ success: true, token, userId: user.id })
    }
  }
  return c.json({ error: 'Email o password non corretti' }, 401)
})

// Dashboard (protected)
app.get('/api/dashboard', (c) => {
  const user = getAuthUser(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Non autorizzato' }, 401)

  // For demo: fall back to a representative default questionnaire so the
  // dashboard always renders fully even without a completed questionnaire.
  const DEFAULT_QUESTIONNAIRE: QuestionnaireData = {
    buildingType: 'unifamiliare',
    yearBuilt: '1960_1980',
    area: 'media',
    heating: 'gas_olio',
    energyClass: 'gf',
    goals: ['bollette', 'co2', 'incentivi'],
  }
  const q = user.questionnaire ?? DEFAULT_QUESTIONNAIRE
  let pathways: Pathway[] = []
  let buildingDossier = null

  if (q) {
    pathways = calculatePathways(q)

    const labels: Record<string, Record<string, string>> = {
      buildingType: {
        unifamiliare: 'Casa unifamiliare', bifamiliare: 'Casa bifamiliare',
        appartamento: 'Appartamento in condominio', altro: 'Altro',
      },
      yearBuilt: {
        prima_1960: 'Prima del 1960', '1960_1980': '1960 – 1980',
        '1981_2000': '1981 – 2000', dopo_2000: 'Dopo il 2000',
      },
      area: {
        piccola: '< 80 m²', media: '80 – 150 m²',
        grande: '150 – 250 m²', molto_grande: '> 250 m²',
      },
      heating: {
        gas_olio: 'Caldaia a gas/olio', pompa_calore: 'Pompa di calore',
        teleriscaldamento: 'Teleriscaldamento', elettrico: 'Riscaldamento elettrico',
        pellet: 'Stufa a pellet/legna',
      },
      energyClass: {
        non_so: 'Non specificata', gf: 'G / F — classe bassa',
        ed: 'E / D — classe media', cb: 'C / B — classe medio-alta', a: 'A — classe alta',
      },
    }

    const goalsLabels: Record<string, string> = {
      bollette: 'Ridurre le bollette', comfort: 'Aumentare il comfort',
      valore: 'Valorizzare l\'immobile', incentivi: 'Accedere a incentivi',
      co2: 'Ridurre le emissioni CO₂',
    }

    buildingDossier = {
      type: labels.buildingType[q.buildingType] ?? q.buildingType,
      year: labels.yearBuilt[q.yearBuilt] ?? q.yearBuilt,
      area: labels.area[q.area] ?? q.area,
      heating: labels.heating[q.heating] ?? q.heating,
      energyClass: labels.energyClass[q.energyClass] ?? q.energyClass,
      goals: (q.goals ?? []).map((o) => goalsLabels[o] ?? o),
      completion: 25,
      address: null,
      municipality: user.municipality,
    }
  }

  return c.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, municipality: user.municipality },
    consultant: user.consultant,
    buildingDossier,
    pathways,
    nextSteps: [
      { id: 1, title: 'Completa il dossier edificio', description: 'Inserisci indirizzo e dati tecnici completi per sbloccare l\'analisi avanzata', module: 2, status: 'todo', urgency: 'high' },
      { id: 2, title: `Primo contatto con ${user.consultant.firstName} ${user.consultant.lastName}`, description: 'Il tuo consulente arCO₂ ti contatterà per fissare una chiamata conoscitiva gratuita', module: 3, status: 'waiting', urgency: 'medium' },
      { id: 3, title: 'Ricevi i tuoi preventivi', description: 'Una volta completato il dossier, potrai richiedere preventivi ai professionisti del territorio', module: 4, status: 'locked', urgency: 'low' },
    ],
    statistics: {
      potentialSavings: '35–55%',
      co2Reduction: '5–15 t CO₂/anno',
      availableIncentives: 'CHF 10.000 – 43.000',
      estimatedTime: '3–6 mesi',
    },
    globalProgress: 10, // % completion of overall journey
  })
})

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

app.post('/api/admin/login', async (c) => {
  const { email, password } = (await c.req.json()) as { email: string; password: string }
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = uuidv4()
    adminSessions.add(token)
    return c.json({ success: true, token })
  }
  return c.json({ error: 'Credenziali non valide' }, 401)
})

app.get('/api/admin/stats', (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)
  const all = Array.from(users.values())
  return c.json({
    totalUsers: all.length,
    withQuestionnaire: all.filter((u) => !!u.questionnaire).length,
    byStatus: {
      new: all.filter((u) => u.status === 'new').length,
      questionnaire_done: all.filter((u) => u.status === 'questionnaire_done').length,
      consultant_assigned: all.filter((u) => u.status === 'consultant_assigned').length,
      in_progress: all.filter((u) => u.status === 'in_progress').length,
      completed: all.filter((u) => u.status === 'completed').length,
    },
    consultants: consultants.map((c) => ({
      ...c,
      assignedCount: all.filter((u) => u.consultant.id === c.id).length,
    })),
  })
})

app.get('/api/admin/users', (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)
  const list = Array.from(users.values()).map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    municipality: u.municipality,
    status: u.status,
    adminNote: u.adminNote ?? '',
    createdAt: u.createdAt,
    hasQuestionnaire: !!u.questionnaire,
    consultant: u.consultant,
    questionnaire: u.questionnaire ?? null,
  }))
  // Most recent first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return c.json({ users: list, total: list.length })
})

app.patch('/api/admin/users/:id', async (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)
  const userId = c.req.param('id')
  const user = users.get(userId)
  if (!user) return c.json({ error: 'Utente non trovato' }, 404)
  const body = await c.req.json() as { status?: UserStatus; consultantId?: string; adminNote?: string }
  if (body.status) user.status = body.status
  if (body.adminNote !== undefined) user.adminNote = body.adminNote
  if (body.consultantId) {
    const found = consultants.find((con) => con.id === body.consultantId)
    if (found) user.consultant = found
  }
  users.set(userId, user)
  return c.json({ success: true })
})

// ─── PATHWAY DETAIL (user auth) ───────────────────────────────────────────────

app.get('/api/pathway/:pathwayId', (c) => {
  const user = getAuthUser(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Non autorizzato' }, 401)
  const pathwayId = c.req.param('pathwayId')
  const DEFAULT_QUESTIONNAIRE: QuestionnaireData = {
    buildingType: 'unifamiliare', yearBuilt: '1960_1980',
    area: 'media', heating: 'gas_olio', energyClass: 'gf',
    goals: ['bollette', 'co2', 'incentivi'],
  }
  const q = user.questionnaire ?? DEFAULT_QUESTIONNAIRE
  const pathways = calculatePathways(q)
  const pathway = pathways.find((p) => p.id === pathwayId)
  if (!pathway) return c.json({ error: 'Percorso non trovato' }, 404)
  return c.json({
    pathway,
    user: { firstName: user.firstName, lastName: user.lastName, municipality: user.municipality },
    consultant: user.consultant,
    questionnaire: q,
  })
})

// ─── START ───────────────────────────────────────────────────────────────────
// Railway injects PORT automatically; fallback to 3001 locally
const port = parseInt(process.env.PORT ?? '3001')

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`Server running on http://${info.address}:${info.port}`)
})
