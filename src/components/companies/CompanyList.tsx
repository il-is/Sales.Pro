'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useCompanies } from '@/hooks/useCompanies'
import { Company } from '@/types/company'
import CompanyForm from './CompanyForm'
import { formatDate } from '@/lib/utils'

export default function CompanyList() {
  const router = useRouter()
  const { companies, loading, error, deleteCompany, fetchCompanies } = useCompanies()
  const [openForm, setOpenForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; company: Company | null }>({
    open: false,
    company: null,
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingCompany(null)
    setOpenForm(true)
  }

  const handleEdit = (company: Company) => {
    setEditingCompany(company)
    setOpenForm(true)
  }

  const handleDelete = async () => {
    if (deleteDialog.company) {
      const result = await deleteCompany(deleteDialog.company.id)
      if (result.success) {
        setDeleteDialog({ open: false, company: null })
      }
    }
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Загрузка...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Юридические лица
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Добавить компанию
        </Button>
      </Box>

      {companies.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Нет компаний
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Добавьте первое юридическое лицо для начала работы
            </Typography>
            <Button variant="contained" onClick={handleCreate}>
              Добавить компанию
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} sm={6} md={4} key={company.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
                onClick={() => router.push(`/companies/${company.id}`)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <BusinessIcon color="primary" />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(company)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteDialog({ open: true, company })
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {company.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ИНН: {company.inn}
                  </Typography>
                  {company.contactPerson && (
                    <Typography variant="body2" color="text.secondary">
                      Контакт: {company.contactPerson}
                    </Typography>
                  )}
                  {company.email && (
                    <Typography variant="body2" color="text.secondary">
                      Email: {company.email}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Добавлено: {formatDate(company.createdAt)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <CompanyForm
        open={openForm}
        onClose={() => {
          setOpenForm(false)
          setEditingCompany(null)
        }}
        onSuccess={(message) => {
          fetchCompanies()
          setSuccessMessage(message)
          setOpenForm(false)
          setEditingCompany(null)
        }}
        company={editingCompany}
      />

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, company: null })}
      >
        <DialogTitle>Удалить компанию?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить компанию "{deleteDialog.company?.name}"?
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, company: null })}>
            Отмена
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

