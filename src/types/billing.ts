export enum BillingStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface BillingService {
  id: string
  name: string
  enabled: boolean
  price: number
  unit?: string
  description?: string
}

export interface BillingConfig {
  id: string
  companyId: string
  services: BillingService[] // Будет сериализовано в JSON строку в БД
  createdAt: Date
  updatedAt: Date
}

export interface BillingConfigDB {
  id: string
  companyId: string
  services: string // JSON строка
  createdAt: Date
  updatedAt: Date
}

export interface Billing {
  id: string
  companyId: string
  company?: {
    id: string
    name: string
    inn: string
    legalAddress?: string | null
    contactPerson?: string | null
    email?: string | null
    phone?: string | null
  }
  periodStart: Date
  periodEnd: Date
  status: BillingStatus | string
  totalAmount: number
  marketplaceData?: any // Будет сериализовано в JSON строку в БД
  calculations?: any // Будет сериализовано в JSON строку в БД
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface BillingDB {
  id: string
  companyId: string
  periodStart: Date
  periodEnd: Date
  status: string
  totalAmount: number
  marketplaceData?: string | null // JSON строка
  calculations?: string | null // JSON строка
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface CreateBillingDto {
  companyId: string
  periodStart: string // ISO string
  periodEnd: string // ISO string
}

export interface UpdateBillingConfigDto {
  services: BillingService[]
}

