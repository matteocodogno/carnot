import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { v4 as uuidv4 } from 'uuid'

const app = new Hono()

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface QuestionnaireData {
  tipoEdificio: string
  annoCostruzione: string
  superficie: string
  riscaldamento: string
  classeEnergetica: string
  obiettivi: string[]
}

interface Consulente {
  id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  specializzazione: string
  disponibilita: string
  esperienza: string
}

interface User {
  id: string
  nome: string
  cognome: string
  email: string
  password: string
  comune: string
  questionnaire?: QuestionnaireData
  createdAt: Date
  consulente: Consulente
}

interface Pathway {
  id: string
  titolo: string
  descrizione: string
  score: number
  risparmioStimato: string
  risparmioKwh: string
  costoStimato: string
  incentivi: string[]
  incentivoMassimo: string
  durata: string
  riduzioneCO2: string
  icona: string
  etichetta: string
  priorita: 'alta' | 'media' | 'bassa'
  passi: string[]
}

// ─── IN-MEMORY STORES ────────────────────────────────────────────────────────
const users = new Map<string, User>()
const sessions = new Map<string, string>() // token → userId
const tempQuestionnaires = new Map<string, QuestionnaireData>() // tempToken → data

// ─── CONSULENTI POOL ─────────────────────────────────────────────────────────
const consulenti: Consulente[] = [
  {
    id: 'c1',
    nome: 'Marco',
    cognome: 'Bernasconi',
    email: 'm.bernasconi@arco2.ch',
    telefono: '+41 91 123 45 67',
    specializzazione: 'Transizione energetica residenziale',
    disponibilita: 'Lun–Ven 8:30–17:30',
    esperienza: '12 anni nel settore energetico ticinese',
  },
  {
    id: 'c2',
    nome: 'Laura',
    cognome: 'Fontana',
    email: 'l.fontana@arco2.ch',
    telefono: '+41 91 234 56 78',
    specializzazione: 'Efficienza energetica e rinnovabili',
    disponibilita: 'Lun–Gio 9:00–18:00',
    esperienza: '8 anni, esperta CECE e incentivi cantonali',
  },
  {
    id: 'c3',
    nome: 'Andrea',
    cognome: 'Russo',
    email: 'a.russo@arco2.ch',
    telefono: '+41 91 345 67 89',
    specializzazione: 'Incentivi, finanziamenti e pompe di calore',
    disponibilita: 'Mar–Sab 8:00–17:00',
    esperienza: '10 anni, ex funzionario UACER',
  },
]

// ─── PATHWAY RECOMMENDATION ENGINE ───────────────────────────────────────────
function calculatePathways(q: QuestionnaireData): Pathway[] {
  // Initialize scores
  const scores: Record<string, number> = {
    isolamento: 0,
    riscaldamento: 0,
    fotovoltaico: 0,
    vmc: 0,
    certificazione: 0,
  }

  // 1. Building age
  if (q.annoCostruzione === 'prima_1960') {
    scores.isolamento += 5; scores.riscaldamento += 3; scores.vmc += 2; scores.certificazione += 3
  } else if (q.annoCostruzione === '1960_1980') {
    scores.isolamento += 4; scores.riscaldamento += 3; scores.vmc += 1; scores.certificazione += 2
  } else if (q.annoCostruzione === '1981_2000') {
    scores.isolamento += 2; scores.riscaldamento += 2; scores.certificazione += 1
  } else {
    scores.fotovoltaico += 1
  }

  // 2. Heating system
  if (q.riscaldamento === 'gas_olio') {
    scores.riscaldamento += 5; scores.fotovoltaico += 1
  } else if (q.riscaldamento === 'elettrico') {
    scores.fotovoltaico += 3; scores.isolamento += 1
  } else if (q.riscaldamento === 'pellet') {
    scores.riscaldamento += 2; scores.fotovoltaico += 2
  } else if (q.riscaldamento === 'pompa_calore') {
    scores.fotovoltaico += 4; scores.isolamento += 1
  }

  // 3. Energy class
  if (q.classeEnergetica === 'gf') {
    scores.isolamento += 4; scores.certificazione += 4; scores.vmc += 2
  } else if (q.classeEnergetica === 'ed') {
    scores.isolamento += 2; scores.certificazione += 3
  } else if (q.classeEnergetica === 'cb') {
    scores.certificazione += 1
  } else if (q.classeEnergetica === 'non_so') {
    scores.certificazione += 3
  }

  // 4. Building type affects PV potential
  if (q.tipoEdificio === 'unifamiliare') {
    scores.fotovoltaico += 3
  } else if (q.tipoEdificio === 'bifamiliare') {
    scores.fotovoltaico += 2
  } else if (q.tipoEdificio === 'appartamento') {
    scores.fotovoltaico -= 1
  }

  // 5. Surface area
  if (q.superficie === 'molto_grande') {
    scores.fotovoltaico += 2; scores.isolamento += 1
  } else if (q.superficie === 'grande') {
    scores.fotovoltaico += 1
  }

  // 6. Objectives
  if (q.obiettivi.includes('bollette')) {
    scores.fotovoltaico += 2; scores.isolamento += 1; scores.riscaldamento += 1
  }
  if (q.obiettivi.includes('co2')) {
    scores.riscaldamento += 2; scores.fotovoltaico += 2
  }
  if (q.obiettivi.includes('valore')) {
    scores.certificazione += 3; scores.isolamento += 2
  }
  if (q.obiettivi.includes('incentivi')) {
    scores.riscaldamento += 2; scores.isolamento += 1
  }
  if (q.obiettivi.includes('comfort')) {
    scores.isolamento += 2; scores.vmc += 3
  }

  // Define all pathways with enriched content
  const definitions: Pathway[] = [
    {
      id: 'isolamento',
      titolo: 'Risanamento energetico dell\'involucro',
      descrizione: 'Isolamento termico di pareti, tetto e sostituzione degli infissi per eliminare le dispersioni termiche e ridurre il fabbisogno energetico dell\'edificio.',
      score: scores.isolamento,
      risparmioStimato: '25–40%',
      risparmioKwh: '8.000–15.000 kWh/anno',
      costoStimato: 'CHF 30.000 – 80.000',
      incentivi: ['Programma Edifici (fino al 30%)', 'Deduzioni fiscali cantonali', 'MiEfficienza'],
      incentivoMassimo: 'CHF 25.000',
      durata: '4–8 settimane',
      riduzioneCO2: '3–8 t CO₂/anno',
      icona: '🏠',
      etichetta: '',
      priorita: 'alta',
      passi: ['Analisi energetica dell\'edificio (CECE)', 'Scelta materiali isolanti', 'Richiesta offerte a imprese qualificate', 'Inoltro pratica incentivi', 'Lavori di risanamento'],
    },
    {
      id: 'riscaldamento',
      titolo: 'Sostituzione impianto di riscaldamento',
      descrizione: 'Passaggio da caldaia fossile (gas/olio) a pompa di calore ad alta efficienza, con eventuale integrazione di serbatoio d\'accumulo.',
      score: scores.riscaldamento,
      risparmioStimato: '30–60%',
      risparmioKwh: '5.000–12.000 kWh/anno',
      costoStimato: 'CHF 15.000 – 40.000',
      incentivi: ['Programma Edifici', 'ProKilowatt', 'BancaStato mutuo verde', 'Bonus federale pompa calore'],
      incentivoMassimo: 'CHF 18.000',
      durata: '1–2 settimane',
      riduzioneCO2: '4–12 t CO₂/anno',
      icona: '🌡️',
      etichetta: '',
      priorita: 'alta',
      passi: ['Verifica idoneità edificio', 'Analisi del carico termico', 'Confronto offerte installatori', 'Richiesta incentivi cantonali', 'Installazione e collaudo'],
    },
    {
      id: 'fotovoltaico',
      titolo: 'Impianto fotovoltaico + accumulo',
      descrizione: 'Produzione di energia elettrica rinnovabile con sistema di accumulo a batteria per massimizzare l\'autoconsumo e ridurre la dipendenza dalla rete.',
      score: scores.fotovoltaico,
      risparmioStimato: '20–50%',
      risparmioKwh: '4.000–10.000 kWh/anno',
      costoStimato: 'CHF 20.000 – 45.000',
      incentivi: ['RIC – Rimunerazione Investimento (contributo unico)', 'Deduzione fiscale federale (investimento)', 'TicinoSolare (comune Lugano e altri)'],
      incentivoMassimo: 'CHF 12.000',
      durata: '2–5 giorni',
      riduzioneCO2: '2–6 t CO₂/anno',
      icona: '☀️',
      etichetta: '',
      priorita: 'media',
      passi: ['Analisi ombreggiatura e orientamento tetto', 'Dimensionamento impianto', 'Offerta installatore accreditato', 'Richiesta allacciamento alla rete', 'Registrazione incentivi RIC'],
    },
    {
      id: 'vmc',
      titolo: 'Ventilazione meccanica controllata',
      descrizione: 'Sistema di ricambio d\'aria con recupero di calore: garantisce qualità dell\'aria ottimale e riduce le perdite energetiche legate alla ventilazione naturale.',
      score: scores.vmc,
      risparmioStimato: '10–20%',
      risparmioKwh: '1.500–4.000 kWh/anno',
      costoStimato: 'CHF 8.000 – 20.000',
      incentivi: ['Programma Edifici (complementare)', 'Deduzioni fiscali cantonali'],
      incentivoMassimo: 'CHF 5.000',
      durata: '1–2 settimane',
      riduzioneCO2: '1–3 t CO₂/anno',
      icona: '💨',
      etichetta: '',
      priorita: 'bassa',
      passi: ['Analisi ricambio d\'aria attuale', 'Dimensionamento ventilazione', 'Scelta sistema (centralizzato/decentralizzato)', 'Installazione e messa in servizio'],
    },
    {
      id: 'certificazione',
      titolo: 'Certificazione energetica CECE',
      descrizione: 'Audit energetico professionale che stabilisce la classe energetica reale dell\'edificio e definisce la roadmap ottimale di interventi con stima di costi e incentivi.',
      score: scores.certificazione,
      risparmioStimato: 'Analisi preliminare',
      risparmioKwh: 'Da quantificare dopo audit',
      costoStimato: 'CHF 800 – 2.500',
      incentivi: ['UACER Ticino (contributo parziale audit)'],
      incentivoMassimo: 'CHF 500',
      durata: '1–3 giorni',
      riduzioneCO2: 'Roadmap personalizzata',
      icona: '📋',
      etichetta: '',
      priorita: 'media',
      passi: ['Richiesta al certificatore CECE accreditato', 'Sopralluogo e raccolta dati', 'Emissione certificato energetico', 'Piano d\'azione consigliato'],
    },
  ]

  // Sort by score descending
  definitions.sort((a, b) => b.score - a.score)

  // Apply labels
  return definitions.map((p, i) => ({
    ...p,
    etichetta: i === 0 ? 'Fortemente consigliato' : i === 1 ? 'Consigliato' : i === 2 ? 'Da valutare' : 'Opzionale',
    priorita: (i === 0 ? 'alta' : i === 1 ? 'media' : 'bassa') as 'alta' | 'media' | 'bassa',
  }))
}

// ─── STIMA DETERMINISTICA (per preview e dashboard) ──────────────────────────
// Logica coerente con i requisiti RFP: edifici datati + fossile = alto potenziale

function ageFactor(q: QuestionnaireData): number {
  // Coefficiente 0–1 per anzianità edificio
  if (q.annoCostruzione === 'prima_1960') return 1.0
  if (q.annoCostruzione === '1960_1980') return 0.8
  if (q.annoCostruzione === '1981_2000') return 0.5
  return 0.2
}

function fuelFactor(q: QuestionnaireData): number {
  if (q.riscaldamento === 'gas_olio') return 1.0
  if (q.riscaldamento === 'pellet') return 0.5
  if (q.riscaldamento === 'elettrico') return 0.6
  if (q.riscaldamento === 'teleriscaldamento') return 0.3
  return 0.2 // pompa di calore già efficiente
}

function classeFactor(q: QuestionnaireData): number {
  if (q.classeEnergetica === 'gf') return 1.0
  if (q.classeEnergetica === 'ed') return 0.7
  if (q.classeEnergetica === 'non_so') return 0.6
  if (q.classeEnergetica === 'cb') return 0.35
  return 0.15 // classe A
}

function combinedFactor(q: QuestionnaireData): number {
  return (ageFactor(q) * 0.4 + fuelFactor(q) * 0.4 + classeFactor(q) * 0.2)
}

function estimateRisparmioMin(q: QuestionnaireData): number {
  return Math.round(15 + combinedFactor(q) * 25)
}
function estimateRisparmioMax(q: QuestionnaireData): number {
  return Math.round(30 + combinedFactor(q) * 40)
}
function estimateCO2Min(q: QuestionnaireData): number {
  const base = q.superficie === 'molto_grande' ? 8 : q.superficie === 'grande' ? 6 : q.superficie === 'media' ? 4 : 2
  return Math.round(base * (0.4 + combinedFactor(q) * 0.6))
}
function estimateCO2Max(q: QuestionnaireData): number {
  const base = q.superficie === 'molto_grande' ? 22 : q.superficie === 'grande' ? 16 : q.superficie === 'media' ? 12 : 7
  return Math.round(base * (0.4 + combinedFactor(q) * 0.6))
}
function estimateIncentiviMin(q: QuestionnaireData): number {
  // Incentivo minimo: certificazione CECE sempre accessibile
  const base = 5000
  const bonus = q.riscaldamento === 'gas_olio' ? 8000 : 3000
  return base + bonus
}
function estimateIncentiviMax(q: QuestionnaireData): number {
  // Incentivo massimo: cumulando Programma Edifici + ProKilowatt + RIC
  const base = 18000
  const ageBon = ageFactor(q) > 0.7 ? 15000 : 8000
  const fuelBon = fuelFactor(q) > 0.7 ? 12000 : 5000
  return base + ageBon + fuelBon
}

// ─── HELPER: GET AUTH USER ────────────────────────────────────────────────────
function getAuthUser(authHeader: string | undefined): User | null {
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  const userId = sessions.get(token)
  if (!userId) return null
  return users.get(userId) ?? null
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

  // ── Stima deterministica risparmio / CO₂ / incentivi ──────────────────────
  // Basata sui fattori chiave dell'RFP (anno, riscaldamento, classe)
  const risparmioMin = estimateRisparmioMin(body)
  const risparmioMax = estimateRisparmioMax(body)
  const co2Min = estimateCO2Min(body)
  const co2Max = estimateCO2Max(body)
  const incMin = estimateIncentiviMin(body)
  const incMax = estimateIncentiviMax(body)

  return c.json({
    success: true,
    tempToken,
    preview: {
      percorsiCount: pathways.length,
      topPercorso: pathways[0].titolo,
      secondPercorso: pathways[1]?.titolo,
      risparmioTotale: `${risparmioMin}–${risparmioMax}%`,
      riduzioneCO2: `${co2Min}–${co2Max} t CO₂/anno`,
      incentiviDisponibili: `CHF ${incMin.toLocaleString('it-CH')} – ${incMax.toLocaleString('it-CH')}`,
      // pathwaysBlurred è DENTRO preview così setPreview(data.preview) lo include
      pathwaysBlurred: pathways.map((p, i) => ({
        id: p.id,
        titolo: p.titolo,          // tutti visibili in anteprima
        risparmioStimato: p.risparmioStimato,
        riduzioneCO2: p.riduzioneCO2,
        etichetta: p.etichetta,
        priorita: p.priorita,
        icona: p.icona,
        visible: i < 2,            // dettagli completi solo per i top 2
      })),
    },
  })
})

// Register new user
app.post('/api/register', async (c) => {
  const body = await c.req.json()
  const { nome, cognome, email, password, comune, tempToken } = body as {
    nome: string; cognome: string; email: string
    password: string; comune: string; tempToken?: string
  }

  if (!nome || !cognome || !email || !password || !comune) {
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

  // Assign consulente round-robin
  const consulente = consulenti[users.size % consulenti.length]

  const userId = uuidv4()
  const user: User = {
    id: userId, nome, cognome, email, password, comune,
    questionnaire: questionnaireData,
    createdAt: new Date(),
    consulente,
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

  const q = user.questionnaire
  let percorsi: Pathway[] = []
  let dossierEdificio = null

  if (q) {
    percorsi = calculatePathways(q)

    const labels: Record<string, Record<string, string>> = {
      tipoEdificio: {
        unifamiliare: 'Casa unifamiliare', bifamiliare: 'Casa bifamiliare',
        appartamento: 'Appartamento in condominio', altro: 'Altro',
      },
      annoCostruzione: {
        prima_1960: 'Prima del 1960', '1960_1980': '1960 – 1980',
        '1981_2000': '1981 – 2000', dopo_2000: 'Dopo il 2000',
      },
      superficie: {
        piccola: '< 80 m²', media: '80 – 150 m²',
        grande: '150 – 250 m²', molto_grande: '> 250 m²',
      },
      riscaldamento: {
        gas_olio: 'Caldaia a gas/olio', pompa_calore: 'Pompa di calore',
        teleriscaldamento: 'Teleriscaldamento', elettrico: 'Riscaldamento elettrico',
        pellet: 'Stufa a pellet/legna',
      },
      classeEnergetica: {
        non_so: 'Non specificata', gf: 'G / F — classe bassa',
        ed: 'E / D — classe media', cb: 'C / B — classe medio-alta', a: 'A — classe alta',
      },
    }

    const obiettiviLabels: Record<string, string> = {
      bollette: 'Ridurre le bollette', comfort: 'Aumentare il comfort',
      valore: 'Valorizzare l\'immobile', incentivi: 'Accedere a incentivi',
      co2: 'Ridurre le emissioni CO₂',
    }

    dossierEdificio = {
      tipo: labels.tipoEdificio[q.tipoEdificio] ?? q.tipoEdificio,
      anno: labels.annoCostruzione[q.annoCostruzione] ?? q.annoCostruzione,
      superficie: labels.superficie[q.superficie] ?? q.superficie,
      riscaldamento: labels.riscaldamento[q.riscaldamento] ?? q.riscaldamento,
      classeEnergetica: labels.classeEnergetica[q.classeEnergetica] ?? q.classeEnergetica,
      obiettivi: (q.obiettivi ?? []).map((o) => obiettiviLabels[o] ?? o),
      completamento: 25,
      indirizzo: null,
      comune: user.comune,
    }
  }

  return c.json({
    user: { id: user.id, nome: user.nome, cognome: user.cognome, email: user.email, comune: user.comune },
    consulente: user.consulente,
    dossierEdificio,
    percorsi,
    prossimiPassi: [
      { id: 1, titolo: 'Completa il dossier edificio', descrizione: 'Inserisci indirizzo e dati tecnici completi per sbloccare l\'analisi avanzata', modulo: 2, stato: 'da_fare', urgenza: 'alta' },
      { id: 2, titolo: `Primo contatto con ${user.consulente.nome} ${user.consulente.cognome}`, descrizione: 'Il tuo consulente arCO₂ ti contatterà per fissare una chiamata conoscitiva gratuita', modulo: 3, stato: 'attesa', urgenza: 'media' },
      { id: 3, titolo: 'Ricevi i tuoi preventivi', descrizione: 'Una volta completato il dossier, potrai richiedere preventivi ai professionisti del territorio', modulo: 4, stato: 'bloccato', urgenza: 'bassa' },
    ],
    statistiche: {
      risparmioPotenziale: '35–55%',
      riduzioneCO2: '5–15 t CO₂/anno',
      incentiviDisponibili: 'CHF 10.000 – 43.000',
      tempoStimato: '3–6 mesi',
    },
    progressoGlobale: 10, // % completamento percorso totale
  })
})

// ─── START ───────────────────────────────────────────────────────────────────
const port = 3001
console.log(`\n🌿 arCO₂ Backend API`)
console.log(`   http://localhost:${port}/api/health\n`)

serve({ fetch: app.fetch, port })
