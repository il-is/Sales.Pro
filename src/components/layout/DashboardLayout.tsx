'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

const drawerWidth = 240

const menuItems = [
  { text: 'Дашборд', icon: <DashboardIcon />, href: '/dashboard' },
  { text: 'Юридические лица', icon: <BusinessIcon />, href: '/companies' },
  { text: 'Биллинги', icon: <ReceiptIcon />, href: '/billing' },
  { text: 'Настройки', icon: <SettingsIcon />, href: '/settings' },
  { text: 'Профиль', icon: <PersonIcon />, href: '/profile' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, logout, checkAuth } = useAuth()
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    // Небольшая задержка для восстановления состояния из localStorage через persist
    const timer = setTimeout(() => {
      const currentToken = useAuthStore.getState().token
      const currentUser = useAuthStore.getState().user
      const currentIsAuthenticated = useAuthStore.getState().isAuthenticated

      // Если есть токен, но нет пользователя - проверяем авторизацию
      if (currentToken && !currentUser) {
        checkAuth()
      } 
      // Если нет токена и нет авторизации - редирект на логин
      else if (!currentToken && !currentIsAuthenticated) {
        router.push('/login')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [router, checkAuth])

  // Показываем загрузку пока проверяем авторизацию или восстанавливаем состояние
  if ((token && !user) || (!token && !user && !isAuthenticated)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    )
  }

  if (!isAuthenticated && !token) {
    return null
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sales.Pro
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.name || user.email}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ListItemButton 
              onClick={logout} 
              sx={{ 
                color: 'white',
                justifyContent: 'flex-end',
                minWidth: 'auto',
                padding: '8px',
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 'auto', margin: 0 }}>
                <LogoutIcon />
              </ListItemIcon>
            </ListItemButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton component={Link} href={item.href}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  )
}

