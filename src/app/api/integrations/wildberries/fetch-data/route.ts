import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { WildberriesService } from '@/services/wildberries.service'

// POST /api/integrations/wildberries/fetch-data - Получить данные с Wildberries
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      )
    }

    // Получаем интеграцию
    const integration = await prisma.integration.findFirst({
      where: {
        userId: payload.userId,
        type: 'WILDBERRIES',
      },
    })

    if (!integration || !integration.apiKey) {
      return NextResponse.json(
        { error: 'Интеграция не настроена' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { dateFrom, dateTo } = body

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Необходимо указать период (dateFrom и dateTo)' },
        { status: 400 }
      )
    }

    // Создаем сервис для работы с Wildberries
    const wbService = new WildberriesService({
      apiKey: integration.apiKey,
    })

    // Обновляем статус синхронизации
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'SYNCING',
      },
    })

    try {
      // Получаем данные о поставках FBS и FBO
      const [stocks, fbsIncomes, fboSupplies, fbsOrders, operations, storageData] = await Promise.all([
        wbService.getStocks(dateFrom),
        wbService.getFBSIncomes(dateFrom, dateTo),
        wbService.getFBOSupplies(dateFrom, dateTo),
        wbService.getFBSOrders(dateFrom, dateTo),
        wbService.getWarehouseOperations(dateFrom, dateTo),
        wbService.getStorageData(dateFrom, dateTo),
      ])

      // Обновляем статус на успех
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'SUCCESS',
          lastSyncAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          stocks,
          fbsIncomes,
          fboSupplies,
          fbsOrders,
          operations,
          storageData,
          syncedAt: new Date(),
        },
      })
    } catch (error: any) {
      // Обновляем статус на ошибку
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'ERROR',
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error('Fetch Wildberries data error:', error)
    return NextResponse.json(
      {
        error: 'Ошибка при получении данных с Wildberries',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
