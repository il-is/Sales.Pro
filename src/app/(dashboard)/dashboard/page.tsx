'use client'

import { Typography, Box, Grid, Card, CardContent, CircularProgress } from '@mui/material'
import { Business, Receipt, TrendingUp } from '@mui/icons-material'
import { useCompanies } from '@/hooks/useCompanies'
import { useBilling } from '@/hooks/useBilling'
import { useMemo } from 'react'

export default function DashboardPage() {
  const { companies, loading: companiesLoading } = useCompanies()
  const { billings, loading: billingsLoading } = useBilling()

  // Подсчитываем общую сумму биллингов
  const totalAmount = useMemo(() => {
    return billings.reduce((sum, billing) => sum + (billing.totalAmount || 0), 0)
  }, [billings])

  const loading = companiesLoading || billingsLoading

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Дашборд
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Добро пожаловать в систему управления биллингом
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Business color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{companies.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Юридических лиц
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Receipt color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{billings.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Биллингов
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                      }).format(totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Общая сумма
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

