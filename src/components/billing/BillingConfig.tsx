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
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { useBillingConfig } from '@/hooks/useBillingConfig'
import { BillingService } from '@/types/billing'
import { formatCurrency } from '@/lib/utils'

interface BillingConfigProps {
  companyId: string
}

export default function BillingConfig({ companyId }: BillingConfigProps) {
  const { config, loading, error, updateConfig } = useBillingConfig(companyId)
  const [services, setServices] = useState<BillingService[]>([])
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (config) {
      setServices(config.services || [])
    }
  }, [config])

  const handleToggleService = (index: number) => {
    const updated = [...services]
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
    }
    setServices(updated)
  }

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...services]
    updated[index] = {
      ...updated[index],
      price: Math.max(0, price),
    }
    setServices(updated)
  }

  const handleNameChange = (index: number, name: string) => {
    const updated = [...services]
    updated[index] = {
      ...updated[index],
      name,
    }
    setServices(updated)
  }

  const handleUnitChange = (index: number, unit: string) => {
    const updated = [...services]
    updated[index] = {
      ...updated[index],
      unit,
    }
    setServices(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccessMessage(null)

    const result = await updateConfig(services)

    if (result.success) {
      setSuccessMessage('Конфигурация успешно сохранена')
      setTimeout(() => setSuccessMessage(null), 3000)
    }

    setSaving(false)
  }

  const addService = () => {
    const newService: BillingService = {
      id: `service-${Date.now()}`,
      name: 'Новая услуга',
      enabled: true,
      price: 0,
      unit: '',
      description: '',
    }
    setServices([...services, newService])
  }

  const removeService = (index: number) => {
    const updated = services.filter((_, i) => i !== index)
    setServices(updated)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !config) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Конфигурация биллинга</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={addService}>
              Добавить услугу
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </Box>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {services.map((service, index) => (
            <Card key={service.id} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={service.enabled}
                        onChange={() => handleToggleService(index)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {service.enabled ? 'Включено' : 'Отключено'}
                      </Typography>
                    }
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Название услуги"
                          value={service.name}
                          onChange={(e) => handleNameChange(index, e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Цена"
                          type="number"
                          value={service.price}
                          onChange={(e) =>
                            handlePriceChange(index, parseFloat(e.target.value) || 0)
                          }
                          fullWidth
                          size="small"
                          InputProps={{
                            endAdornment: <Typography variant="body2">₽</Typography>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Единица измерения"
                          value={service.unit || ''}
                          onChange={(e) => handleUnitChange(index, e.target.value)}
                          placeholder="за м²/месяц, за единицу и т.д."
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => removeService(index)}
                          fullWidth
                        >
                          Удалить
                        </Button>
                      </Grid>
                    </Grid>
                    {service.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {service.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {services.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                Нет услуг. Нажмите "Добавить услугу" для создания.
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

