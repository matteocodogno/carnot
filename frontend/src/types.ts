export interface QuestionnaireData {
  buildingType: string
  yearBuilt: string
  area: string
  heating: string
  energyClass: string
  goals: string[]
}

export interface Pathway {
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

export interface Consultant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialization: string
  availability: string
  experience: string
}

export interface BuildingDossier {
  type: string
  year: string
  area: string
  heating: string
  energyClass: string
  goals: string[]
  completion: number
  address: string | null
  municipality: string
}

export interface DashboardData {
  user: { id: string; firstName: string; lastName: string; email: string; municipality: string }
  consultant: Consultant
  buildingDossier: BuildingDossier | null
  pathways: Pathway[]
  nextSteps: NextStep[]
  statistics: {
    potentialSavings: string
    co2Reduction: string
    availableIncentives: string
    estimatedTime: string
  }
  globalProgress: number
}

export interface NextStep {
  id: number
  title: string
  description: string
  module: number
  status: 'todo' | 'waiting' | 'locked' | 'done'
  urgency: 'high' | 'medium' | 'low'
}

export interface AuthState {
  token: string | null
  userId: string | null
}
