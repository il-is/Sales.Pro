import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { WildberriesService } from '@/services/wildberries.service'

// POST /api/integrations/wildberries/sync - Синхронизация данных
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

    // По умолчанию синхронизируем за последний месяц
    const defaultDateFrom = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const defaultDateTo = dateTo || new Date().toISOString()

    const wbService = new WildberriesService({
      apiKey: integration.apiKey,
    })

    // Обновляем статус
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        syncStatus: 'SYNCING',
      },
    })

    try {
      // Получаем данные о поставках FBS и FBO
      const [stocks, fbsIncomes, fboSupplies, fbsOrders, operations, storageData] = await Promise.all([
        wbService.getStocks(defaultDateFrom),
        wbService.getFBSIncomes(defaultDateFrom, defaultDateTo),
        wbService.getFBOSupplies(defaultDateFrom, defaultDateTo),
        wbService.getFBSOrders(defaultDateFrom, defaultDateTo),
        wbService.getWarehouseOperations(defaultDateFrom, defaultDateTo),
        wbService.getStorageData(defaultDateFrom, defaultDateTo),
      ])

      // Обновляем статус
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'SUCCESS',
          lastSyncAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Данные успешно синхронизированы',
        data: {
          stocks: stocks.length,
          fbsIncomes: fbsIncomes.length,
          fboSupplies: fboSupplies.length,
          fbsOrders: fbsOrders.length,
          operations: operations.length,
          storageItems: storageData.items?.length || 0,
          syncedAt: new Date(),
        },
      })
    } catch (error: any) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'ERROR',
        },
      })

      throw error
    }
  } catch (error: any) {
    console.error('Sync Wildberries error:', error)
    return NextResponse.json(
      {
        error: 'Ошибка при синхронизации',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
