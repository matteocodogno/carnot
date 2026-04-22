import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { v4 as uuidv4 } from 'uuid'
import { sql, initDb } from './db.js'

const app = new Hono()

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ─── TYPES ────────────────────────────────────────────────────────────────────
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

interface DbUser {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  municipality: string
  consultantId: string
  questionnaireData: QuestionnaireData | null
  status: UserStatus
  adminNote: string | null
  createdAt: Date
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

// ─── ADMIN CREDENTIALS ────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@ticinoenergia.ch'
const ADMIN_PASSWORD = 'arco2admin'

// Admin sessions stay in-memory: they're ephemeral and don't need persistence
const adminSessions = new Set<string>()

// Temporary questionnaires (pre-registration) stay in-memory — expire in 30 min
const tempQuestionnaires = new Map<string, QuestionnaireData>()

// ─── CONSULTANT POOL ──────────────────────────────────────────────────────────
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

function getConsultant(id: string): Consultant {
  return consultants.find((c) => c.id === id) ?? consultants[0]
}

// ─── PATHWAY ENGINE ───────────────────────────────────────────────────────────
function calculatePathways(q: QuestionnaireData): Pathway[] {
  const scores: Record<string, number> = {
    isolation: 0, heating: 0, photovoltaic: 0, vmc: 0, certification: 0,
  }

  if (q.yearBuilt === 'prima_1960') {
    scores.isolation += 5; scores.heating += 3; scores.vmc += 2; scores.certification += 3
  } else if (q.yearBuilt === '1960_1980') {
    scores.isolation += 4; scores.heating += 3; scores.vmc += 1; scores.certification += 2
  } else if (q.yearBuilt === '1981_2000') {
    scores.isolation += 2; scores.heating += 2; scores.certification += 1
  } else {
    scores.photovoltaic += 1
  }

  if (q.heating === 'gas_olio') {
    scores.heating += 5; scores.photovoltaic += 1
  } else if (q.heating === 'elettrico') {
    scores.photovoltaic += 3; scores.isolation += 1
  } else if (q.heating === 'pellet') {
    scores.heating += 2; scores.photovoltaic += 2
  } else if (q.heating === 'pompa_calore') {
    scores.photovoltaic += 4; scores.isolation += 1
  }

  if (q.energyClass === 'gf') {
    scores.isolation += 4; scores.certification += 4; scores.vmc += 2
  } else if (q.energyClass === 'ed') {
    scores.isolation += 2; scores.certification += 3
  } else if (q.energyClass === 'cb') {
    scores.certification += 1
  } else if (q.energyClass === 'non_so') {
    scores.certification += 3
  }

  if (q.buildingType === 'unifamiliare') scores.photovoltaic += 3
  else if (q.buildingType === 'bifamiliare') scores.photovoltaic += 2
  else if (q.buildingType === 'appartamento') scores.photovoltaic -= 1

  if (q.area === 'molto_grande') { scores.photovoltaic += 2; scores.isolation += 1 }
  else if (q.area === 'grande') scores.photovoltaic += 1

  if (q.goals.includes('bollette')) { scores.photovoltaic += 2; scores.isolation += 1; scores.heating += 1 }
  if (q.goals.includes('co2'))      { scores.heating += 2; scores.photovoltaic += 2 }
  if (q.goals.includes('valore'))   { scores.certification += 3; scores.isolation += 2 }
  if (q.goals.includes('incentivi')){ scores.heating += 2; scores.isolation += 1 }
  if (q.goals.includes('comfort'))  { scores.isolation += 2; scores.vmc += 3 }

  const definitions: Pathway[] = [
    {
      id: 'isolation',
      title: 'Risanamento energetico dell\'involucro',
      description: 'Isolamento termico di pareti, tetto e sostituzione degli infissi per eliminare le dispersioni termiche.',
      score: scores.isolation,
      estimatedSavings: '25–40%', savingsKwh: '8.000–15.000 kWh/anno',
      estimatedCost: 'CHF 30.000 – 80.000',
      incentives: ['Programma Edifici (fino al 30%)', 'Deduzioni fiscali cantonali', 'MiEfficienza'],
      maxIncentive: 'CHF 25.000', duration: '4–8 settimane', co2Reduction: '3–8 t CO₂/anno',
      icon: '🏠', label: '', priority: 'high',
      steps: ['Analisi energetica (CECE)', 'Scelta materiali isolanti', 'Richiesta offerte', 'Inoltro incentivi', 'Lavori'],
    },
    {
      id: 'heating',
      title: 'Sostituzione impianto di riscaldamento',
      description: 'Passaggio da caldaia fossile a pompa di calore ad alta efficienza.',
      score: scores.heating,
      estimatedSavings: '30–60%', savingsKwh: '5.000–12.000 kWh/anno',
      estimatedCost: 'CHF 15.000 – 40.000',
      incentives: ['Programma Edifici', 'ProKilowatt', 'BancaStato mutuo verde', 'Bonus federale pompa calore'],
      maxIncentive: 'CHF 18.000', duration: '1–2 settimane', co2Reduction: '4–12 t CO₂/anno',
      icon: '🌡️', label: '', priority: 'high',
      steps: ['Verifica idoneità', 'Analisi carico termico', 'Confronto offerte', 'Richiesta incentivi', 'Installazione'],
    },
    {
      id: 'photovoltaic',
      title: 'Impianto fotovoltaico + accumulo',
      description: 'Produzione di energia elettrica rinnovabile con sistema di accumulo a batteria.',
      score: scores.photovoltaic,
      estimatedSavings: '20–50%', savingsKwh: '4.000–10.000 kWh/anno',
      estimatedCost: 'CHF 20.000 – 45.000',
      incentives: ['RIC – Rimunerazione Investimento', 'Deduzione fiscale federale', 'TicinoSolare'],
      maxIncentive: 'CHF 12.000', duration: '2–5 giorni', co2Reduction: '2–6 t CO₂/anno',
      icon: '☀️', label: '', priority: 'medium',
      steps: ['Analisi ombreggiatura', 'Dimensionamento', 'Offerta installatore', 'Allacciamento rete', 'Registrazione RIC'],
    },
    {
      id: 'vmc',
      title: 'Ventilazione meccanica controllata',
      description: 'Sistema di ricambio aria con recupero di calore per qualità dell\'aria ottimale.',
      score: scores.vmc,
      estimatedSavings: '10–20%', savingsKwh: '1.500–4.000 kWh/anno',
      estimatedCost: 'CHF 8.000 – 20.000',
      incentives: ['Programma Edifici (complementare)', 'Deduzioni fiscali cantonali'],
      maxIncentive: 'CHF 5.000', duration: '1–2 settimane', co2Reduction: '1–3 t CO₂/anno',
      icon: '💨', label: '', priority: 'low',
      steps: ['Analisi ricambio aria', 'Dimensionamento', 'Scelta sistema', 'Installazione'],
    },
    {
      id: 'certification',
      title: 'Certificazione energetica CECE',
      description: 'Audit energetico che stabilisce la classe reale dell\'edificio e la roadmap ottimale.',
      score: scores.certification,
      estimatedSavings: 'Analisi preliminare', savingsKwh: 'Da quantificare dopo audit',
      estimatedCost: 'CHF 800 – 2.500',
      incentives: ['UACER Ticino (contributo parziale audit)'],
      maxIncentive: 'CHF 500', duration: '1–3 giorni', co2Reduction: 'Roadmap personalizzata',
      icon: '📋', label: '', priority: 'medium',
      steps: ['Richiesta certificatore CECE', 'Sopralluogo', 'Emissione certificato', 'Piano d\'azione'],
    },
  ]

  definitions.sort((a, b) => b.score - a.score)
  return definitions.map((p, i) => ({
    ...p,
    label: i === 0 ? 'Fortemente consigliato' : i === 1 ? 'Consigliato' : i === 2 ? 'Da valutare' : 'Opzionale',
    priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  }))
}

// ─── ESTIMATE HELPERS ─────────────────────────────────────────────────────────
function ageFactor(q: QuestionnaireData): number {
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
  return 0.2
}
function energyClassFactor(q: QuestionnaireData): number {
  if (q.energyClass === 'gf') return 1.0
  if (q.energyClass === 'ed') return 0.7
  if (q.energyClass === 'non_so') return 0.6
  if (q.energyClass === 'cb') return 0.35
  return 0.15
}
function combinedFactor(q: QuestionnaireData): number {
  return ageFactor(q) * 0.4 + fuelFactor(q) * 0.4 + energyClassFactor(q) * 0.2
}

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
async function getAuthUser(authHeader: string | undefined): Promise<DbUser | null> {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const rows = await sql<DbUser[]>`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token}
    LIMIT 1
  `
  return rows[0] ?? null
}

function getAdminAuth(authHeader: string | undefined): boolean {
  const token = authHeader?.replace('Bearer ', '')
  return !!token && adminSessions.has(token)
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/api/health', (c) =>
  c.json({ status: 'ok', version: '1.0.0', db: 'postgres', timestamp: new Date().toISOString() }),
)

// Submit questionnaire → temp token + preview
app.post('/api/questionnaire', async (c) => {
  const body = (await c.req.json()) as QuestionnaireData
  const pathways = calculatePathways(body)
  const tempToken = uuidv4()
  tempQuestionnaires.set(tempToken, body)
  setTimeout(() => tempQuestionnaires.delete(tempToken), 30 * 60 * 1000)

  const cf = combinedFactor(body)
  const savingsMin = Math.round(15 + cf * 25)
  const savingsMax = Math.round(30 + cf * 40)
  const areaBase = body.area === 'molto_grande' ? 8 : body.area === 'grande' ? 6 : body.area === 'media' ? 4 : 2
  const areaBaseMax = body.area === 'molto_grande' ? 22 : body.area === 'grande' ? 16 : body.area === 'media' ? 12 : 7
  const co2Min = Math.round(areaBase * (0.4 + cf * 0.6))
  const co2Max = Math.round(areaBaseMax * (0.4 + cf * 0.6))
  const incMin = 5000 + (body.heating === 'gas_olio' ? 8000 : 3000)
  const incMax = 18000 + (ageFactor(body) > 0.7 ? 15000 : 8000) + (fuelFactor(body) > 0.7 ? 12000 : 5000)

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
      pathways: pathways.map((p, i) => ({
        id: p.id, title: p.title, estimatedSavings: p.estimatedSavings,
        co2Reduction: p.co2Reduction, label: p.label, priority: p.priority,
        icon: p.icon, visible: i < 2,
      })),
    },
  })
})

// Register
app.post('/api/register', async (c) => {
  const body = await c.req.json()
  const { firstName, lastName, email, password, municipality, tempToken } = body as {
    firstName: string; lastName: string; email: string
    password: string; municipality: string; tempToken?: string
  }

  if (!firstName || !lastName || !email || !password || !municipality) {
    return c.json({ error: 'Tutti i campi sono obbligatori' }, 400)
  }

  // Recover questionnaire data from temp store
  let questionnaireData: QuestionnaireData | undefined
  if (tempToken) {
    questionnaireData = tempQuestionnaires.get(tempToken)
    if (questionnaireData) tempQuestionnaires.delete(tempToken)
  }

  // Assign consultant round-robin (based on current user count)
  const [{ count }] = await sql<[{ count: number }]>`SELECT COUNT(*)::int AS count FROM users`
  const consultantId = consultants[count % consultants.length].id

  const userId = uuidv4()
  const status: UserStatus = questionnaireData ? 'questionnaire_done' : 'new'

  try {
    await sql`
      INSERT INTO users
        (id, first_name, last_name, email, password, municipality, consultant_id, questionnaire_data, status)
      VALUES
        (${userId}, ${firstName}, ${lastName}, ${email.toLowerCase()}, ${password},
         ${municipality}, ${consultantId}, ${questionnaireData ? JSON.stringify(questionnaireData) : null}, ${status})
    `
  } catch (err: any) {
    if (err?.code === '23505') {
      return c.json({ error: 'Email già registrata. Accedi invece.' }, 400)
    }
    throw err
  }

  const token = uuidv4()
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`

  return c.json({ success: true, token, userId })
})

// Login
app.post('/api/login', async (c) => {
  const { email, password } = (await c.req.json()) as { email: string; password: string }
  const rows = await sql<DbUser[]>`
    SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
  `
  const user = rows[0]
  if (!user || user.password !== password) {
    return c.json({ error: 'Email o password non corretti' }, 401)
  }
  const token = uuidv4()
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${user.id})`
  return c.json({ success: true, token, userId: user.id })
})

// Dashboard (protected)
app.get('/api/dashboard', async (c) => {
  const user = await getAuthUser(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Non autorizzato' }, 401)

  const DEFAULT_Q: QuestionnaireData = {
    buildingType: 'unifamiliare', yearBuilt: '1960_1980', area: 'media',
    heating: 'gas_olio', energyClass: 'gf', goals: ['bollette', 'co2', 'incentivi'],
  }
  const q: QuestionnaireData = user.questionnaireData ?? DEFAULT_Q
  const pathways = calculatePathways(q)
  const consultant = getConsultant(user.consultantId)

  const labels: Record<string, Record<string, string>> = {
    buildingType: { unifamiliare: 'Casa unifamiliare', bifamiliare: 'Casa bifamiliare', appartamento: 'Appartamento', altro: 'Altro' },
    yearBuilt:    { prima_1960: 'Prima del 1960', '1960_1980': '1960 – 1980', '1981_2000': '1981 – 2000', dopo_2000: 'Dopo il 2000' },
    area:         { piccola: '< 80 m²', media: '80 – 150 m²', grande: '150 – 250 m²', molto_grande: '> 250 m²' },
    heating:      { gas_olio: 'Caldaia a gas/olio', pompa_calore: 'Pompa di calore', teleriscaldamento: 'Teleriscaldamento', elettrico: 'Riscaldamento elettrico', pellet: 'Stufa a pellet/legna' },
    energyClass:  { non_so: 'Non specificata', gf: 'G / F — classe bassa', ed: 'E / D — classe media', cb: 'C / B — classe medio-alta', a: 'A — classe alta' },
  }
  const goalsMap: Record<string, string> = {
    bollette: 'Ridurre le bollette', comfort: 'Aumentare il comfort',
    valore: 'Valorizzare l\'immobile', incentivi: 'Accedere a incentivi', co2: 'Ridurre le emissioni CO₂',
  }

  const buildingDossier = {
    type: labels.buildingType[q.buildingType] ?? q.buildingType,
    year: labels.yearBuilt[q.yearBuilt] ?? q.yearBuilt,
    area: labels.area[q.area] ?? q.area,
    heating: labels.heating[q.heating] ?? q.heating,
    energyClass: labels.energyClass[q.energyClass] ?? q.energyClass,
    goals: (q.goals ?? []).map((o) => goalsMap[o] ?? o),
    completion: 25,
    address: null,
    municipality: user.municipality,
  }

  return c.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, municipality: user.municipality },
    consultant,
    buildingDossier,
    pathways,
    nextSteps: [
      { id: 1, title: 'Completa il dossier edificio', description: 'Inserisci indirizzo e dati tecnici completi per sbloccare l\'analisi avanzata', module: 2, status: 'todo', urgency: 'high' },
      { id: 2, title: `Primo contatto con ${consultant.firstName} ${consultant.lastName}`, description: 'Il tuo consulente arCO₂ ti contatterà per fissare una chiamata conoscitiva gratuita', module: 3, status: 'waiting', urgency: 'medium' },
      { id: 3, title: 'Ricevi i tuoi preventivi', description: 'Una volta completato il dossier potrai richiedere preventivi ai professionisti del territorio', module: 4, status: 'locked', urgency: 'low' },
    ],
    statistics: {
      potentialSavings: '35–55%',
      co2Reduction: '5–15 t CO₂/anno',
      availableIncentives: 'CHF 10.000 – 43.000',
      estimatedTime: '3–6 mesi',
    },
    globalProgress: 10,
  })
})

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.post('/api/admin/login', async (c) => {
  const { email, password } = (await c.req.json()) as { email: string; password: string }
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = uuidv4()
    adminSessions.add(token)
    return c.json({ success: true, token })
  }
  return c.json({ error: 'Credenziali non valide' }, 401)
})

app.get('/api/admin/stats', async (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)

  const [totals] = await sql<[{ total: number; withQuestionnaire: number }]>`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE questionnaire_data IS NOT NULL)::int AS with_questionnaire
    FROM users
  `
  const statusRows = await sql<{ status: string; cnt: number }[]>`
    SELECT status, COUNT(*)::int AS cnt FROM users GROUP BY status
  `
  const byStatus: Record<string, number> = {
    new: 0, questionnaire_done: 0, consultant_assigned: 0, in_progress: 0, completed: 0,
  }
  for (const row of statusRows) byStatus[row.status] = row.cnt

  const assignedRows = await sql<{ consultantId: string; cnt: number }[]>`
    SELECT consultant_id, COUNT(*)::int AS cnt FROM users GROUP BY consultant_id
  `
  const assignedMap: Record<string, number> = {}
  for (const row of assignedRows) assignedMap[row.consultantId] = row.cnt

  return c.json({
    totalUsers: totals.total,
    withQuestionnaire: totals.withQuestionnaire,
    byStatus,
    consultants: consultants.map((c) => ({
      ...c,
      assignedCount: assignedMap[c.id] ?? 0,
    })),
  })
})

app.get('/api/admin/users', async (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)

  const rows = await sql<DbUser[]>`
    SELECT * FROM users ORDER BY created_at DESC
  `
  const list = rows.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    municipality: u.municipality,
    status: u.status,
    adminNote: u.adminNote ?? '',
    createdAt: u.createdAt,
    hasQuestionnaire: !!u.questionnaireData,
    consultant: getConsultant(u.consultantId),
    questionnaire: u.questionnaireData,
  }))

  return c.json({ users: list, total: list.length })
})

app.patch('/api/admin/users/:id', async (c) => {
  if (!getAdminAuth(c.req.header('Authorization'))) return c.json({ error: 'Non autorizzato' }, 401)

  const userId = c.req.param('id')
  const body = await c.req.json() as { status?: UserStatus; consultantId?: string; adminNote?: string }

  const updates: Record<string, unknown> = {}
  if (body.status)                  updates.status = body.status
  if (body.adminNote !== undefined) updates.admin_note = body.adminNote
  if (body.consultantId)            updates.consultant_id = body.consultantId

  if (Object.keys(updates).length === 0) return c.json({ success: true })

  const [updated] = await sql`
    UPDATE users SET ${sql(updates)} WHERE id = ${userId} RETURNING id
  `
  if (!updated) return c.json({ error: 'Utente non trovato' }, 404)

  return c.json({ success: true })
})

// ─── PATHWAY DETAIL ───────────────────────────────────────────────────────────

app.get('/api/pathway/:pathwayId', async (c) => {
  const user = await getAuthUser(c.req.header('Authorization'))
  if (!user) return c.json({ error: 'Non autorizzato' }, 401)

  const DEFAULT_Q: QuestionnaireData = {
    buildingType: 'unifamiliare', yearBuilt: '1960_1980', area: 'media',
    heating: 'gas_olio', energyClass: 'gf', goals: ['bollette', 'co2', 'incentivi'],
  }
  const q = user.questionnaireData ?? DEFAULT_Q
  const pathways = calculatePathways(q)
  const pathway = pathways.find((p) => p.id === c.req.param('pathwayId'))
  if (!pathway) return c.json({ error: 'Percorso non trovato' }, 404)

  return c.json({
    pathway,
    user: { firstName: user.firstName, lastName: user.lastName, municipality: user.municipality },
    consultant: getConsultant(user.consultantId),
    questionnaire: q,
  })
})

// ─── SEED ─────────────────────────────────────────────────────────────────────
// Reset & repopulate demo data. Protected by SEED_SECRET env var in production.

app.post('/api/seed', async (c) => {
  const secret = c.req.header('X-Seed-Secret') ?? ''
  const configuredSecret = process.env.SEED_SECRET ?? 'arco2seed'
  if (secret !== configuredSecret) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Wipe existing data (cascade deletes sessions)
  await sql`DELETE FROM sessions`
  await sql`DELETE FROM users`

  type SeedUser = {
    id: string; firstName: string; lastName: string; email: string
    password: string; municipality: string; consultantId: string
    questionnaireData: QuestionnaireData | null; status: UserStatus
    adminNote: string | null; createdAt: Date
  }

  const Q_OLD_GAS: QuestionnaireData = { buildingType: 'unifamiliare', yearBuilt: 'prima_1960', area: 'grande', heating: 'gas_olio', energyClass: 'gf', goals: ['bollette', 'co2', 'incentivi'] }
  const Q_NEW_HP: QuestionnaireData  = { buildingType: 'appartamento', yearBuilt: 'dopo_2000', area: 'piccola', heating: 'pompa_calore', energyClass: 'cb', goals: ['comfort', 'valore'] }
  const Q_MID:   QuestionnaireData   = { buildingType: 'bifamiliare', yearBuilt: '1960_1980', area: 'media', heating: 'gas_olio', energyClass: 'ed', goals: ['bollette', 'incentivi'] }
  const Q_PELLET: QuestionnaireData  = { buildingType: 'unifamiliare', yearBuilt: '1981_2000', area: 'media', heating: 'pellet', energyClass: 'ed', goals: ['valore', 'co2'] }
  const Q_ELEC: QuestionnaireData    = { buildingType: 'bifamiliare', yearBuilt: '1960_1980', area: 'grande', heating: 'elettrico', energyClass: 'ed', goals: ['bollette', 'co2'] }
  const Q_TELE: QuestionnaireData    = { buildingType: 'appartamento', yearBuilt: '1981_2000', area: 'piccola', heating: 'teleriscaldamento', energyClass: 'non_so', goals: ['incentivi'] }

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400_000)

  const seedUsers: SeedUser[] = [
    { id: uuidv4(), firstName: 'Paolo',   lastName: 'Rossi',    email: 'p.rossi@demo.ch',    password: 'demo123', municipality: 'Lugano',      consultantId: 'c1', questionnaireData: Q_OLD_GAS, status: 'questionnaire_done',  adminNote: null, createdAt: daysAgo(14) },
    { id: uuidv4(), firstName: 'Maria',   lastName: 'Bianchi',  email: 'm.bianchi@demo.ch',  password: 'demo123', municipality: 'Bellinzona',  consultantId: 'c2', questionnaireData: Q_NEW_HP,  status: 'consultant_assigned', adminNote: 'Colloquio fissato per giovedì prossimo', createdAt: daysAgo(10) },
    { id: uuidv4(), firstName: 'Giovanni',lastName: 'Ferrari',  email: 'g.ferrari@demo.ch',  password: 'demo123', municipality: 'Locarno',     consultantId: 'c3', questionnaireData: Q_MID,     status: 'in_progress',         adminNote: 'Preventivo isolamento in corso', createdAt: daysAgo(21) },
    { id: uuidv4(), firstName: 'Sofia',   lastName: 'Esposito', email: 's.esposito@demo.ch', password: 'demo123', municipality: 'Mendrisio',   consultantId: 'c1', questionnaireData: Q_PELLET,  status: 'completed',           adminNote: 'Pompa di calore installata, incentivi ottenuti', createdAt: daysAgo(45) },
    { id: uuidv4(), firstName: 'Luca',    lastName: 'Romano',   email: 'l.romano@demo.ch',   password: 'demo123', municipality: 'Lugano',      consultantId: 'c2', questionnaireData: Q_OLD_GAS, status: 'questionnaire_done',  adminNote: null, createdAt: daysAgo(3) },
    { id: uuidv4(), firstName: 'Chiara',  lastName: 'Ricci',    email: 'c.ricci@demo.ch',    password: 'demo123', municipality: 'Ascona',      consultantId: 'c3', questionnaireData: null,      status: 'new',                 adminNote: null, createdAt: daysAgo(1) },
    { id: uuidv4(), firstName: 'Marco',   lastName: 'Conti',    email: 'm.conti@demo.ch',    password: 'demo123', municipality: 'Biasca',      consultantId: 'c1', questionnaireData: Q_MID,     status: 'consultant_assigned', adminNote: 'In attesa di documenti catastali', createdAt: daysAgo(8) },
    { id: uuidv4(), firstName: 'Anna',    lastName: 'Mancini',  email: 'a.mancini@demo.ch',  password: 'demo123', municipality: 'Lugano',      consultantId: 'c2', questionnaireData: Q_ELEC,    status: 'in_progress',         adminNote: null, createdAt: daysAgo(18) },
    { id: uuidv4(), firstName: 'Federico',lastName: 'Lombardi', email: 'f.lombardi@demo.ch', password: 'demo123', municipality: 'Chiasso',     consultantId: 'c3', questionnaireData: Q_TELE,    status: 'questionnaire_done',  adminNote: null, createdAt: daysAgo(5) },
    { id: uuidv4(), firstName: 'Elena',   lastName: 'Barbieri', email: 'e.barbieri@demo.ch', password: 'demo123', municipality: 'Locarno',     consultantId: 'c1', questionnaireData: Q_NEW_HP,  status: 'completed',           adminNote: 'FV 6kWp installato, OBE ottenuto', createdAt: daysAgo(60) },
  ]

  for (const u of seedUsers) {
    await sql`
      INSERT INTO users
        (id, first_name, last_name, email, password, municipality, consultant_id,
         questionnaire_data, status, admin_note, created_at)
      VALUES
        (${u.id}, ${u.firstName}, ${u.lastName}, ${u.email}, ${u.password},
         ${u.municipality}, ${u.consultantId},
         ${u.questionnaireData ? JSON.stringify(u.questionnaireData) : null},
         ${u.status}, ${u.adminNote}, ${u.createdAt})
    `
  }

  return c.json({
    success: true,
    message: `${seedUsers.length} utenti demo inseriti`,
    users: seedUsers.map((u) => ({ email: u.email, password: u.password, status: u.status })),
  })
})

// ─── START ────────────────────────────────────────────────────────────────────
const port = parseInt(process.env.PORT ?? '3001')

initDb()
  .then(() => {
    serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
      console.log(`Server running on http://${info.address}:${info.port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err)
    process.exit(1)
  })
