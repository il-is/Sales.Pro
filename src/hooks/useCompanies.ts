import { useState, useEffect } from 'react'
import { api } from './useAuth'
import { Company, CreateCompanyDto, UpdateCompanyDto } from '@/types/company'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/companies')
      setCompanies(response.data.companies)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке компаний')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const createCompany = async (data: CreateCompanyDto) => {
    try {
      const response = await api.post('/companies', data)
      setCompanies((prev) => [response.data.company, ...prev])
      return { success: true, company: response.data.company }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Ошибка при создании компании',
      }
    }
  }

  const updateCompany = async (id: string, data: UpdateCompanyDto) => {
    try {
      console.log('Sending update request with data:', { ...data, wbApiKey: data.wbApiKey ? '***' : undefined })
      const response = await api.put(`/companies/${id}`, data)
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? response.data.company : c))
      )
      return { success: true, company: response.data.company }
    } catch (err: any) {
      console.error('Update company error:', err.response?.data || err)
      console.error('Error status:', err.response?.status)
      console.error('Error details:', JSON.stringify(err.response?.data, null, 2))
      
      let errorMessage = 'Ошибка при обновлении компании'
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
        if (err.response.data.details) {
          errorMessage += `: ${typeof err.response.data.details === 'string' ? err.response.data.details : JSON.stringify(err.response.data.details)}`
        }
      } else if (err.response?.data?.details) {
        errorMessage = typeof err.response.data.details === 'string' ? err.response.data.details : JSON.stringify(err.response.data.details)
      } else if (err.message) {
        errorMessage = err.message
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const deleteCompany = async (id: string) => {
    try {
      await api.delete(`/companies/${id}`)
      setCompanies((prev) => prev.filter((c) => c.id !== id))
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Ошибка при удалении компании',
      }
    }
  }

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}

