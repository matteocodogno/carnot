export interface QuestionnaireData {
  tipoEdificio: string
  annoCostruzione: string
  superficie: string
  riscaldamento: string
  classeEnergetica: string
  obiettivi: string[]
}

export interface Pathway {
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

export interface Consulente {
  id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  specializzazione: string
  disponibilita: string
  esperienza: string
}

export interface DossierEdificio {
  tipo: string
  anno: string
  superficie: string
  riscaldamento: string
  classeEnergetica: string
  obiettivi: string[]
  completamento: number
  indirizzo: string | null
  comune: string
}

export interface DashboardData {
  user: { id: string; nome: string; cognome: string; email: string; comune: string }
  consulente: Consulente
  dossierEdificio: DossierEdificio | null
  percorsi: Pathway[]
  prossimiPassi: ProssimoStep[]
  statistiche: {
    risparmioPotenziale: string
    riduzioneCO2: string
    incentiviDisponibili: string
    tempoStimato: string
  }
  progressoGlobale: number
}

export interface ProssimoStep {
  id: number
  titolo: string
  descrizione: string
  modulo: number
  stato: 'da_fare' | 'attesa' | 'bloccato' | 'completato'
  urgenza: 'alta' | 'media' | 'bassa'
}

export interface AuthState {
  token: string | null
  userId: string | null
}
