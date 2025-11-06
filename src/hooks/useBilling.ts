import { useState, useEffect } from 'react'
import { api } from './useAuth'
import { Billing, CreateBillingDto } from '@/types/billing'

export function useBilling() {
  const [billings, setBillings] = useState<Billing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBillings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/billing')
      setBillings(response.data.billings)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке биллингов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBillings()
  }, [])

  const createBilling = async (data: CreateBillingDto) => {
    try {
      const response = await api.post('/billing', data)
      setBillings((prev) => [response.data.billing, ...prev])
      return { success: true, billing: response.data.billing }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Ошибка при создании биллинга',
      }
    }
  }

  const generateBilling = async (billingId: string) => {
    try {
      const response = await api.post(`/billing/${billingId}/generate`)
      setBillings((prev) =>
        prev.map((b) =>
          b.id === billingId ? response.data.billing : b
        )
      )
      return { success: true, billing: response.data.billing }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Ошибка при генерации биллинга',
      }
    }
  }

  const deleteBilling = async (id: string) => {
    try {
      await api.delete(`/billing/${id}`)
      setBillings((prev) => prev.filter((b) => b.id !== id))
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Ошибка при удалении биллинга',
      }
    }
  }

  return {
    billings,
    loading,
    error,
    fetchBillings,
    createBilling,
    generateBilling,
    deleteBilling,
  }
}

export function useBillingDetail(billingId: string | null) {
  const [billing, setBilling] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBilling = async () => {
    if (!billingId) return

    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/billing/${billingId}`)
      setBilling(response.data.billing)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке биллинга')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBilling()
  }, [billingId])

  return {
    billing,
    loading,
    error,
    fetchBilling,
  }
}

