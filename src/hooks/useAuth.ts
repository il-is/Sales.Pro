import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// Добавляем токен в заголовки запросов
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function useAuth() {
  const router = useRouter()
  const { user, token, isAuthenticated, setAuth, logout, setUser } = useAuthStore()

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      return true
    } catch (error) {
      // Если токен невалидный, выходим
      logout()
      return false
    }
  }

  useEffect(() => {
    // Проверяем авторизацию при загрузке, если есть токен, но нет пользователя
    // Добавляем небольшую задержку для восстановления состояния из localStorage
    const checkInitialAuth = async () => {
      // Ждем немного, чтобы persist восстановил состояние
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const currentToken = useAuthStore.getState().token
      const currentUser = useAuthStore.getState().user
      
      if (currentToken && !currentUser) {
        await checkAuth()
      }
    }

    checkInitialAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Проверяем только при монтировании

  useEffect(() => {
    // Если токен изменился, проверяем снова
    if (token && !user) {
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      setAuth(response.data.user, response.data.token)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при входе',
      }
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
      })
      setAuth(response.data.user, response.data.token)
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Ошибка при регистрации',
      }
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout: handleLogout,
    checkAuth,
  }
}

export { api }

