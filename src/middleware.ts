import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Публичные маршруты, которые не требуют авторизации
  const publicRoutes = ['/login', '/register', '/']
  
  // Защищенные маршруты
  const protectedRoutes = ['/dashboard', '/companies', '/billing', '/settings', '/profile']

  // Если это публичный маршрут, пропускаем
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Проверяем токен в cookies или headers
  // Для локальной разработки проверка токена происходит на клиенте
  // В продакшене можно добавить проверку токена здесь
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // Если это защищенный маршрут и нет токена, перенаправляем на логин
  // Для локальной разработки эта проверка может быть отключена
  // и проверка будет происходить на клиенте через DashboardLayout
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Для локального демо пропускаем проверку в middleware
    // Реальная проверка будет в DashboardLayout
    // if (!token) {
    //   const loginUrl = new URL('/login', request.url)
    //   loginUrl.searchParams.set('redirect', pathname)
    //   return NextResponse.redirect(loginUrl)
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

