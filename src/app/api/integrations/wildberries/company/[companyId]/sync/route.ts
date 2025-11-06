import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { WildberriesService } from '@/services/wildberries.service'

// POST /api/integrations/wildberries/company/[companyId]/sync - Синхронизация данных для конкретной компании
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
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

    // Проверяем, что компания принадлежит пользователю
    const company = await prisma.company.findFirst({
      where: {
        id: params.companyId,
        userId: payload.userId,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    if (!company.wbApiKey) {
      return NextResponse.json(
        { error: 'API ключ Wildberries не настроен для этой компании' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { dateFrom, dateTo } = body

    // По умолчанию синхронизируем за последний месяц
    const defaultDateFrom = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const defaultDateTo = dateTo || new Date().toISOString()

    // Создаем сервис с API ключом компании
    const wbService = new WildberriesService({
      apiKey: company.wbApiKey,
    })

    try {
      // Получаем данные о поставках FBS и FBO для этой компании
      const [stocks, fbsIncomes, fboSupplies, fbsOrders, operations, storageData] = await Promise.all([
        wbService.getStocks(defaultDateFrom),
        wbService.getFBSIncomes(defaultDateFrom, defaultDateTo),
        wbService.getFBOSupplies(defaultDateFrom, defaultDateTo),
        wbService.getFBSOrders(defaultDateFrom, defaultDateTo),
        wbService.getWarehouseOperations(defaultDateFrom, defaultDateTo),
        wbService.getStorageData(defaultDateFrom, defaultDateTo),
      ])

      return NextResponse.json({
        success: true,
        message: 'Данные успешно синхронизированы',
        data: {
          companyId: params.companyId,
          companyName: company.name,
          stocks: stocks.length,
          fbsIncomes: fbsIncomes.length,
          fboSupplies: fboSupplies.length,
          fbsOrders: fbsOrders.length,
          operations: operations.length,
          storageItems: storageData.items?.length || 0,
          // Полные данные для расчета биллинга
          stocksData: stocks,
          fbsIncomesData: fbsIncomes,
          fboSuppliesData: fboSupplies,
          fbsOrdersData: fbsOrders,
          operationsData: operations,
          storageData: storageData,
          syncedAt: new Date(),
        },
      })
    } catch (error: any) {
      console.error('Wildberries sync error:', error)
      return NextResponse.json(
        {
          error: 'Ошибка при синхронизации с Wildberries',
          details: error.response?.data?.message || error.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Company sync error:', error)
    return NextResponse.json(
      {
        error: 'Ошибка при синхронизации',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

