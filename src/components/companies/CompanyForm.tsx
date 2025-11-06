'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  Divider,
  Typography,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCompanies } from '@/hooks/useCompanies'
import { Company } from '@/types/company'

const companySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  inn: z.string().min(10, 'ИНН должен содержать минимум 10 символов').max(12, 'ИНН должен содержать максимум 12 символов'),
  legalAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  wbApiKey: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  company?: Company | null
}

export default function CompanyForm({ open, onClose, onSuccess, company }: CompanyFormProps) {
  const { createCompany, updateCompany } = useCompanies()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEdit = !!company

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      inn: '',
      legalAddress: '',
      contactPerson: '',
      email: '',
      phone: '',
      wbApiKey: '',
    },
  })

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        inn: company.inn,
        legalAddress: company.legalAddress || '',
        contactPerson: company.contactPerson || '',
        email: company.email || '',
        phone: company.phone || '',
        // При редактировании не показываем существующий ключ, чтобы не перезаписывать случайно
        // Пользователь может ввести новый ключ или оставить пустым
        wbApiKey: '',
      })
    } else {
      reset({
        name: '',
        inn: '',
        legalAddress: '',
        contactPerson: '',
        email: '',
        phone: '',
        wbApiKey: '',
      })
    }
  }, [company, reset])

  const onSubmit = async (data: CompanyFormData) => {
    setError(null)
    setLoading(true)

    try {
      // Подготавливаем данные для отправки
      const cleanedData: any = {
        name: data.name,
        inn: data.inn,
        legalAddress: data.legalAddress || '',
        contactPerson: data.contactPerson || '',
        email: data.email || '',
        phone: data.phone || '',
      }

      // API ключ обрабатываем отдельно
      if (isEdit) {
        // При редактировании: если ключ введен, обновляем его
        if (data.wbApiKey?.trim()) {
          cleanedData.wbApiKey = data.wbApiKey.trim()
        }
        // Если пустое, не отправляем - сохранится старый ключ
      } else {
        // При создании: если ключ введен, добавляем его
        if (data.wbApiKey?.trim()) {
          cleanedData.wbApiKey = data.wbApiKey.trim()
        } else {
          cleanedData.wbApiKey = ''
        }
      }

      const result = isEdit
        ? await updateCompany(company!.id, cleanedData)
        : await createCompany(cleanedData)

      if (result.success) {
        reset()
        const message = isEdit ? 'Компания успешно обновлена' : 'Компания успешно создана'
        if (onSuccess) {
          onSuccess(message)
        } else {
          onClose()
        }
      } else {
        // Показываем детали ошибки если есть
        const errorMsg = result.error || 'Ошибка при сохранении'
        const details = result.error?.includes('details') ? result.error : ''
        setError(`${errorMsg}${details ? `: ${details}` : ''}`)
      }
    } catch (err: any) {
      console.error('Form submission error:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.details || err.message || 'Ошибка при сохранении'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {isEdit ? 'Редактировать компанию' : 'Добавить компанию'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Название компании *"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
            <TextField
              label="ИНН *"
              {...register('inn')}
              error={!!errors.inn}
              helperText={errors.inn?.message || 'Максимум 12 цифр'}
              fullWidth
              inputProps={{
                maxLength: 12,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
              onInput={(e: any) => {
                // Разрешаем только цифры
                e.target.value = e.target.value.replace(/[^0-9]/g, '')
              }}
            />
            <TextField
              label="Юридический адрес"
              {...register('legalAddress')}
              error={!!errors.legalAddress}
              helperText={errors.legalAddress?.message}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Контактное лицо"
              {...register('contactPerson')}
              error={!!errors.contactPerson}
              helperText={errors.contactPerson?.message}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />
            <TextField
              label="Телефон"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              fullWidth
            />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Интеграция с Wildberries
            </Typography>
            <TextField
              label="API ключ Wildberries"
              type="password"
              {...register('wbApiKey')}
              error={!!errors.wbApiKey}
              helperText={errors.wbApiKey?.message || (isEdit ? 'Оставьте пустым, чтобы не менять существующий ключ' : 'API ключ для получения данных о поставках FBS и FBO')}
              fullWidth
              placeholder={isEdit ? 'Введите новый ключ или оставьте пустым' : 'Введите API ключ из личного кабинета WB'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

