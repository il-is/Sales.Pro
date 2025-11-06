export interface Company {
  id: string
  name: string
  inn: string
  legalAddress: string | null
  contactPerson: string | null
  email: string | null
  phone: string | null
  wbApiKey: string | null
  createdAt: Date
  updatedAt: Date
  userId: string
}

export interface CreateCompanyDto {
  name: string
  inn: string
  legalAddress?: string
  contactPerson?: string
  email?: string
  phone?: string
  wbApiKey?: string
}

export interface UpdateCompanyDto extends Partial<CreateCompanyDto> {}

