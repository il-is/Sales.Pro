'use client'

import { useState } from 'react'
import { Box, Card, CardContent, Typography, Button, Chip, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material'
import { Download as DownloadIcon, Print as PrintIcon, ExpandMore as ExpandMoreIcon, Info as InfoIcon } from '@mui/icons-material'
import { useBillingDetail } from '@/hooks/useBilling'
import { formatDate } from '@/lib/utils'

interface BillingDetailProps {
  billingId: string
}

export default function BillingDetail({ billingId }: BillingDetailProps) {
  const { billing, loading, error } = useBillingDetail(billingId)
  const [showRawData, setShowRawData] = useState(false)

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

  if (!billing) {
    return (
      <Box p={2}>
        <Alert severity="info">Биллинг не найден</Alert>
      </Box>
    )
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

  const calculations = billing.calculations || { items: [], subtotal: 0, total: 0 }
  const marketplaceData = billing.marketplaceData || {}

  // Разделяем услуги на FBS и FBO по operationType
  const fbsItems = calculations.items?.filter((item: any) => 
    item.operationType === 'fbs' || item.serviceId?.endsWith('_fbs')
  ) || []
  const fboItems = calculations.items?.filter((item: any) => 
    item.operationType === 'fbo' || item.serviceId?.endsWith('_fbo')
  ) || []
  const otherItems = calculations.items?.filter((item: any) => 
    !item.operationType && !item.serviceId?.endsWith('_fbs') && !item.serviceId?.endsWith('_fbo')
  ) || []

  // Подсчитываем данные из WB
  // FBS: количество из поставок (incomes)
  const fbsIncomesCount = marketplaceData.fbsIncomes?.length || 0
  const fbsIncomesQuantity = marketplaceData.fbsIncomes?.reduce(
    (sum: number, income: any) => {
      const qty = income.quantity || income.inWayToClient || income.inWayFromClient || 0
      return sum + qty
    },
    0
  ) || 0

  // FBO: количество из отгрузок (orders)
  const fboOrders = marketplaceData.fbsOrders?.filter((order: any) => {
    return !order.isCancel && (order.type === 'FBO' || order.orderType === 'FBO' || !order.type)
  }) || []
  const fboOrdersCount = fboOrders.length
  const fboOrdersQuantity = fboOrders.reduce(
    (sum: number, order: any) => sum + (order.quantity || 0),
    0
  ) || 0

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Биллинг</Typography>
        {billing.status === 'GENERATED' && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Скачать PDF
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Скачать Excel
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Печать
            </Button>
          </Box>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Box>
              <Typography variant="h6">{billing.company.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                ИНН: {billing.company.inn}
              </Typography>
              {billing.company.legalAddress && (
                <Typography variant="body2" color="text.secondary">
                  Адрес: {billing.company.legalAddress}
                </Typography>
              )}
            </Box>
            <Chip
              label={getStatusLabel(billing.status)}
              color={getStatusColor(billing.status) as any}
            />
          </Box>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Период: {formatDate(billing.periodStart)} - {formatDate(billing.periodEnd)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создан: {formatDate(billing.createdAt)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Данные из Wildberries */}
      {billing.status === 'GENERATED' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Данные из Wildberries</Typography>
              <Button
                size="small"
                startIcon={<InfoIcon />}
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? 'Скрыть детали' : 'Показать детали'}
              </Button>
            </Box>
            
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box>
                <Typography variant="body2" color="text.secondary">FBS (Поставки FBS и FBW)</Typography>
                <Typography variant="h6">
                  {fbsIncomesQuantity} единиц
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  из {fbsIncomesCount} поставок
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">FBO (Отгрузки FBO)</Typography>
                <Typography variant="h6">
                  {fboOrdersQuantity} единиц
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  из {fboOrdersCount} отгрузок
                </Typography>
              </Box>
            </Box>

            {showRawData && (
              <Box mt={3}>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Детали FBS поставок (первые 10)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {marketplaceData.fbsIncomes?.slice(0, 10).map((income: any, idx: number) => (
                      <Box key={idx} mb={1} p={1} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                          Поставка #{idx + 1}: {income.quantity || 0} единиц
                          {income.date && ` (${new Date(income.date).toLocaleDateString('ru-RU')})`}
                          {income.number && ` | Номер: ${income.number}`}
                        </Typography>
                      </Box>
                    )) || <Typography variant="body2" color="text.secondary">Нет данных</Typography>}
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Детали FBO отгрузок (первые 10)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {fboOrders.slice(0, 10).map((order: any, idx: number) => (
                      <Box key={idx} mb={1} p={1} sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                          Отгрузка #{idx + 1}: {order.quantity || 0} единиц
                          {order.date && ` (${new Date(order.date).toLocaleDateString('ru-RU')})`}
                          {order.barcode && ` | Баркод: ${order.barcode}`}
                        </Typography>
                      </Box>
                    )) || <Typography variant="body2" color="text.secondary">Нет данных</Typography>}
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {billing.status === 'GENERATED' && calculations.items && calculations.items.length > 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Расчет
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Услуга</TableCell>
                    <TableCell align="right">Количество</TableCell>
                    <TableCell align="right">Ед. изм.</TableCell>
                    <TableCell align="right">Цена за ед.</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* FBS секция */}
                  {fbsItems.length > 0 && (
                    <>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={5}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            FBS (Поставки FBS и FBW)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Количество единиц из поставок: {fbsIncomesQuantity} единиц из {fbsIncomesCount} поставок
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {fbsItems.map((item: any, index: number) => (
                        <TableRow key={`fbs-${index}`}>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.price)}
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="body2" fontWeight="medium">
                            Итого FBS:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(fbsItems.reduce((sum: number, item: any) => sum + item.total, 0))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* FBO секция */}
                  {fboItems.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Divider />
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={5}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            FBO (Отгрузки FBO)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Количество единиц из отгрузок: {fboOrdersQuantity} единиц из {fboOrdersCount} отгрузок
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {fboItems.map((item: any, index: number) => (
                        <TableRow key={`fbo-${index}`}>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.price)}
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} align="right">
                          <Typography variant="body2" fontWeight="medium">
                            Итого FBO:
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(fboItems.reduce((sum: number, item: any) => sum + item.total, 0))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* Другие услуги */}
                  {otherItems.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Divider />
                        </TableCell>
                      </TableRow>
                      {otherItems.map((item: any, index: number) => (
                        <TableRow key={`other-${index}`}>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{item.unit}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.price)}
                          </TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                            }).format(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* Итоговая строка */}
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="h6">Итого:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6">
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: 'RUB',
                        }).format(calculations.total)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : billing.status === 'DRAFT' ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              Биллинг находится в статусе черновика. Сгенерируйте его, чтобы получить расчет.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Alert severity="warning">Расчеты не найдены</Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

