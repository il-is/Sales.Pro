import { Container, Typography, Box, Button } from '@mui/material'
import Link from 'next/link'

export default function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Sales.Pro
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Автоматизация составления биллинга для склада ответственного хранения
        </Typography>
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            component={Link}
            href="/login"
            size="large"
          >
            Войти
          </Button>
          <Button
            variant="outlined"
            component={Link}
            href="/register"
            size="large"
          >
            Регистрация
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

