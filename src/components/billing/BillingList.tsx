'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material'
import { useBilling } from '@/hooks/useBilling'
import { useCompanies } from '@/hooks/useCompanies'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default function BillingList() {
  const router = useRouter()
  const { billings, loading, error, createBilling, generateBilling, deleteBilling } = useBilling()
  const { companies } = useCompanies()
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    companyId: '',
    periodStart: '',
    periodEnd: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!formData.companyId || !formData.periodStart || !formData.periodEnd) {
      setFormError('Заполните все поля')
      return
    }

    setCreating(true)
    setFormError(null)

    const result = await createBilling({
      companyId: formData.companyId,
      periodStart: new Date(formData.periodStart).toISOString(),
      periodEnd: new Date(formData.periodEnd).toISOString(),
    })

    if (result.success) {
      setOpenCreateDialog(false)
      setFormData({ companyId: '', periodStart: '', periodEnd: '' })
    } else {
      setFormError(result.error || 'Ошибка при создании биллинга')
    }

    setCreating(false)
  }

  const handleGenerate = async (billingId: string) => {
    setGenerating(billingId)
    const result = await generateBilling(billingId)
    if (!result.success) {
      alert(result.error || 'Ошибка при генерации биллинга')
    }
    setGenerating(null)
  }

  const handleDelete = async (billingId: string) => {
    const result = await deleteBilling(billingId)
    if (result.success) {
      setOpenDeleteDialog(null)
    } else {
      alert(result.error || 'Ошибка при удалении биллинга')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'default'
      case 'GENERATED':
        return 'success'
      case 'PAID':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Черновик'
      case 'GENERATED':
        return 'Сгенерирован'
      case 'PAID':
        return 'Оплачен'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Биллинги</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Создать биллинг
        </Button>
      </Box>

      {billings.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Биллинги не найдены. Создайте первый биллинг.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>
          {billings.map((billing) => (
            <Card key={billing.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6">{billing.company.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ИНН: {billing.company.inn}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Период: {formatDate(billing.periodStart)} - {formatDate(billing.periodEnd)}
                    </Typography>
                    {billing.totalAmount > 0 && (
                      <Typography variant="h6" color="primary" mt={1}>
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        }).format(billing.totalAmount)}
                      </Typography>
                    )}
                  </Box>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip
                      label={getStatusLabel(billing.status)}
                      color={getStatusColor(billing.status) as any}
                      size="small"
                    />
                    {billing.status === 'DRAFT' && (
                      <IconButton
                        size="small"
                        onClick={() => handleGenerate(billing.id)}
                        disabled={generating === billing.id}
                        title="Сгенерировать биллинг"
                      >
                        {generating === billing.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PlayArrowIcon />
                        )}
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/billing/${billing.id}`)}
                      title="Просмотр"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setOpenDeleteDialog(billing.id)}
                      title="Удалить"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Диалог создания биллинга */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать биллинг</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              select
              label="Компания"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              SelectProps={{
                native: true,
              }}
              fullWidth
              required
            >
              <option value="">Выберите компанию</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} (ИНН: {company.inn})
                </option>
              ))}
            </TextField>
            <TextField
              label="Дата начала периода"
              type="date"
              value={formData.periodStart}
              onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
            <TextField
              label="Дата окончания периода"
              type="date"
              value={formData.periodEnd}
              onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating}>
            {creating ? <CircularProgress size={20} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={openDeleteDialog !== null} onClose={() => setOpenDeleteDialog(null)}>
        <DialogTitle>Удалить биллинг?</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить этот биллинг? Это действие нельзя отменить.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(null)}>Отмена</Button>
          <Button
            onClick={() => openDeleteDialog && handleDelete(openDeleteDialog)}
            color="error"
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

