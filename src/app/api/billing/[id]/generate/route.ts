import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { parseJsonField, serializeJsonField } from '@/lib/db-utils'
import { WildberriesService } from '@/services/wildberries.service'
import { BillingCalculator } from '@/services/billing.service'

// POST /api/billing/[id]/generate - Сгенерировать биллинг
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let payload: any = null
  
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      )
    }

    // Получаем биллинг
    const billing = await prisma.billing.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        company: {
          include: {
            billingConfig: true,
          },
        },
      },
    })

    if (!billing) {
      return NextResponse.json(
        { error: 'Биллинг не найден' },
        { status: 404 }
      )
    }

    // Проверяем наличие API ключа
    if (!billing.company.wbApiKey) {
      return NextResponse.json(
        { error: 'API ключ Wildberries не настроен для этой компании' },
        { status: 400 }
      )
    }

    // Проверяем наличие конфигурации биллинга
    if (!billing.company.billingConfig) {
      return NextResponse.json(
        { error: 'Конфигурация биллинга не настроена для этой компании' },
        { status: 400 }
      )
    }

    // Парсим конфигурацию услуг (работает и со String и с Json типами)
    const services = parseJsonField(billing.company.billingConfig.services) || []

    // Получаем данные с Wildberries
    const wbService = new WildberriesService({
      apiKey: billing.company.wbApiKey,
    })

    // Форматируем даты для API (YYYY-MM-DD)
    const dateFrom = billing.periodStart.toISOString().split('T')[0]
    const dateTo = billing.periodEnd.toISOString().split('T')[0]

    console.log('Fetching Wildberries data:', { dateFrom, dateTo })

    // Получаем данные о поставках и отгрузках
    // Для FBS нужны incomes (поставки) типов FBS и FBW
    // Для FBO нужны orders (отгрузки) типа FBO
    const [stocks, fbsIncomes, fboSupplies, fbsOrders, operations, storageData] =
      await Promise.all([
        wbService.getStocks(dateFrom),
        wbService.getFBSIncomes(dateFrom, dateTo), // Поставки FBS и FBW
        wbService.getFBOSupplies(dateFrom, dateTo),
        wbService.getFBSOrders(dateFrom, dateTo), // Отгрузки (включая FBO)
        wbService.getWarehouseOperations(dateFrom, dateTo),
        wbService.getStorageData(dateFrom, dateTo),
      ])

    // Подсчитываем количество FBS/FBW из поставок (incomes)
    const fbsIncomesQuantity = fbsIncomes?.reduce(
      (sum: number, income: any) => {
        const qty = income.quantity || income.inWayToClient || income.inWayFromClient || 0
        return sum + qty
      },
      0
    ) || 0

    // Подсчитываем количество FBO из отгрузок (orders)
    // Фильтруем только FBO заказы
    const fboOrders = fbsOrders?.filter((order: any) => {
      // Если есть поле типа заказа, фильтруем по FBO
      // Иначе считаем все неотмененные заказы как FBO
      return !order.isCancel && (order.type === 'FBO' || order.orderType === 'FBO' || !order.type)
    }) || []

    const fboOrdersQuantity = fboOrders.reduce(
      (sum: number, order: any) => sum + (order.quantity || 0),
      0
    ) || 0

    // Логируем полученные данные для отладки
    console.log('Wildberries data received:', {
      period: { dateFrom, dateTo },
      fbsIncomes: {
        count: fbsIncomes?.length || 0,
        totalQuantity: fbsIncomesQuantity,
        sample: fbsIncomes?.slice(0, 3).map((i: any) => ({
          date: i.date,
          quantity: i.quantity,
          number: i.number,
        })),
      },
      fboOrders: {
        totalOrdersCount: fbsOrders?.length || 0,
        fboOrdersCount: fboOrders.length,
        totalQuantity: fboOrdersQuantity,
        sample: fboOrders.slice(0, 3).map((o: any) => ({
          date: o.date,
          quantity: o.quantity,
          type: o.type || o.orderType,
          isCancel: o.isCancel,
        })),
      },
    })

    const marketplaceData = {
      stocks,
      fbsIncomes,
      fboSupplies,
      fbsOrders,
      operations,
      storageData,
    }

    // Рассчитываем биллинг
    const calculations = BillingCalculator.calculateBilling(
      services,
      marketplaceData,
      billing.periodStart,
      billing.periodEnd
    )

    console.log('Billing calculations:', {
      itemsCount: calculations.items.length,
      total: calculations.total,
      items: calculations.items,
    })

    // Обновляем биллинг
    // Для PostgreSQL Prisma ожидает Json (объект), для SQLite - String
    // Определяем тип БД и сериализуем соответственно
    const dbProvider = process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite'
    
    const updatedBilling = await prisma.billing.update({
      where: { id: params.id },
      data: {
        status: 'GENERATED',
        totalAmount: calculations.total,
        marketplaceData: (dbProvider === 'postgresql' ? marketplaceData : serializeJsonField(marketplaceData)) as any,
        calculations: (dbProvider === 'postgresql' ? calculations : serializeJsonField(calculations)) as any,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inn: true,
            legalAddress: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    // Парсим JSON для ответа
    const parsedBilling = {
      ...updatedBilling,
      marketplaceData,
      calculations,
    }

    return NextResponse.json({
      success: true,
      billing: parsedBilling,
      message: 'Биллинг успешно сгенерирован',
    })
  } catch (error: any) {
    console.error('Generate billing error:', {
      message: error.message,
      stack: error.stack,
      billingId: params.id,
      userId: payload?.userId,
    })
    
    // Более детальное сообщение об ошибке
    let errorMessage = 'Ошибка при генерации биллинга'
    let errorDetails = error.message || 'Неизвестная ошибка'
    
    if (error.message?.includes('API')) {
      errorMessage = 'Ошибка при обращении к API Wildberries'
      errorDetails = error.message
    } else if (error.message?.includes('Prisma')) {
      errorMessage = 'Ошибка при сохранении в базу данных'
      errorDetails = error.message
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    )
  }
}

