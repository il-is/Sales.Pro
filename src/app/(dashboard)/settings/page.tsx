import { Box, Typography, Card, CardContent } from '@mui/material'
import { Construction as ConstructionIcon } from '@mui/icons-material'

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>
      
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
          >
            <ConstructionIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Раздел в разработке
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Этот раздел находится в разработке и будет доступен в ближайшее время
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
