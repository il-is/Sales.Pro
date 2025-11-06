import { useState, useEffect } from 'react'
import { api } from './useAuth'
import { BillingConfig, BillingService } from '@/types/billing'

export function useBillingConfig(companyId: string | null) {
  const [config, setConfig] = useState<BillingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/billing-config/${companyId}`)
      setConfig(response.data.config)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке конфигурации')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [companyId])

  const updateConfig = async (services: BillingService[]) => {
    if (!companyId) {
      return {
        success: false,
        error: 'ID компании не указан',
      }
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.put(`/billing-config/${companyId}`, {
        services,
      })
      setConfig(response.data.config)
      return { success: true, config: response.data.config }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Ошибка при сохранении конфигурации'
      setError(errorMsg)
      return {
        success: false,
        error: errorMsg,
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
  }
}

