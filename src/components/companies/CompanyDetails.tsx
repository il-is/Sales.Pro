'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  IconButton,
  Alert,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { api } from '@/hooks/useAuth'
import { Company } from '@/types/company'
import CompanyForm from './CompanyForm'
import BillingConfig from '@/components/billing/BillingConfig'
import { formatDate } from '@/lib/utils'

export default function CompanyDetails() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string

  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openForm, setOpenForm] = useState(false)
  const [billingCount, setBillingCount] = useState(0)

  useEffect(() => {
    fetchCompany()
  }, [companyId])

  const fetchCompany = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/companies/${companyId}`)
      setCompany(response.data.company)
      setBillingCount(response.data.company._count?.billings || 0)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при загрузке компании')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    )
  }

  if (error || !company) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error || 'Компания не найдена'}</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/companies')}
          sx={{ mt: 2 }}
        >
          Вернуться к списку
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => router.push('/companies')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {company.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => setOpenForm(true)}
        >
          Редактировать
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{company.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ИНН: {company.inn}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {company.legalAddress && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Юридический адрес
                    </Typography>
                    <Typography variant="body1">{company.legalAddress}</Typography>
                  </Grid>
                )}

                {company.contactPerson && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Контактное лицо
                    </Typography>
                    <Typography variant="body1">{company.contactPerson}</Typography>
                  </Grid>
                )}

                {company.email && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{company.email}</Typography>
                  </Grid>
                )}

                {company.phone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Телефон
                    </Typography>
                    <Typography variant="body1">{company.phone}</Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Интеграция с Wildberries
                  </Typography>
                  {company.wbApiKey ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="success.main">
                        API ключ настроен
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({company.wbApiKey.substring(0, 4)}****{company.wbApiKey.substring(company.wbApiKey.length - 4)})
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon color="warning" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        API ключ не настроен. Добавьте ключ для синхронизации данных.
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Дата создания
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(company.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Статистика
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Биллингов
                  </Typography>
                  <Typography variant="h4">{billingCount}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <BillingConfig companyId={companyId} />
      </Box>

      <CompanyForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          fetchCompany()
        }}
        company={company}
      />
    </Box>
  )
}

