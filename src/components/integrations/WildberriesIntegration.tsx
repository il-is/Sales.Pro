'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { api } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'

export default function WildberriesIntegration() {
  const [apiKey, setApiKey] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [integration, setIntegration] = useState<any>(null)

  useEffect(() => {
    fetchIntegration()
  }, [])

  const fetchIntegration = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/integrations/wildberries')
      if (response.data.integration) {
        setIntegration(response.data.integration)
        setIsActive(response.data.integration.isActive)
        // Не показываем полный ключ, только частично
        if (response.data.integration.apiKey) {
          setApiKey('')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке интеграции')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Введите API ключ')
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await api.post('/integrations/wildberries', {
        apiKey: apiKey.trim(),
        isActive,
      })

      setIntegration(response.data.integration)
      setSuccessMessage('Интеграция успешно сохранена')
      setApiKey('') // Очищаем поле после сохранения
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при сохранении интеграции')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dateTo = new Date().toISOString()

      const response = await api.post('/integrations/wildberries/sync', {
        dateFrom,
        dateTo,
      })

      const data = response.data.data
      setSuccessMessage(
        `Синхронизация завершена. Получено: ${data.stocks} товаров на складе, ${data.fbsIncomes} поставок FBS, ${data.fboSupplies} поставок FBO, ${data.fbsOrders} заказов FBS`
      )
      await fetchIntegration() // Обновляем статус
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при синхронизации')
    } finally {
      setSyncing(false)
    }
  }

  const getStatusChip = () => {
    if (!integration) return null

    const status = integration.syncStatus
    const color =
      status === 'SUCCESS'
        ? 'success'
        : status === 'ERROR'
        ? 'error'
        : status === 'SYNCING'
        ? 'warning'
        : 'default'

    return (
      <Chip
        label={status === 'SUCCESS' ? 'Успешно' : status === 'ERROR' ? 'Ошибка' : status === 'SYNCING' ? 'Синхронизация...' : 'Не синхронизировано'}
        color={color as any}
        size="small"
        icon={status === 'SUCCESS' ? <CheckCircleIcon /> : status === 'ERROR' ? <ErrorIcon /> : undefined}
      />
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h5">Интеграция с Wildberries</Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="API ключ Wildberries"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={integration?.apiKey ? 'Введите новый ключ для обновления' : 'Введите API ключ'}
            fullWidth
            helperText="Получите API ключ в личном кабинете Wildberries"
          />

          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="primary" />
            }
            label="Активировать интеграцию"
          />

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            fullWidth
          >
            {saving ? <CircularProgress size={24} /> : 'Сохранить настройки'}
          </Button>

          {integration && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Статус интеграции
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                  {getStatusChip()}
                  {integration.isActive && (
                    <Chip label="Активна" color="success" size="small" />
                  )}
                </Box>
                {integration.lastSyncAt && (
                  <Typography variant="body2" color="text.secondary">
                    Последняя синхронизация: {formatDate(integration.lastSyncAt)}
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
                onClick={handleSync}
                disabled={syncing || !integration.isActive}
                fullWidth
              >
                {syncing ? 'Синхронизация...' : 'Синхронизировать данные'}
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

