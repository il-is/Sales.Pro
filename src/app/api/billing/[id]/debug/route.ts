import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { WildberriesService } from '@/services/wildberries.service'

// GET /api/billing/[id]/debug - Отладочная информация о данных из API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Получаем биллинг
    const billing = await prisma.billing.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        company: true,
      },
    })

    if (!billing) {
      return NextResponse.json(
        { error: 'Биллинг не найден' },
        { status: 404 }
      )
    }

    if (!billing.company.wbApiKey) {
      return NextResponse.json(
        { error: 'API ключ не настроен' },
        { status: 400 }
      )
    }

    const wbService = new WildberriesService({
      apiKey: billing.company.wbApiKey,
    })

    const dateFrom = billing.periodStart.toISOString().split('T')[0]
    const dateTo = billing.periodEnd.toISOString().split('T')[0]

    // Получаем данные
    const [fbsIncomes, fboSupplies] = await Promise.all([
      wbService.getFBSIncomes(dateFrom, dateTo),
      wbService.getFBOSupplies(dateFrom, dateTo),
    ])

    // Анализируем данные
    const analysis = {
      period: {
        from: dateFrom,
        to: dateTo,
      },
      fbsIncomes: {
        count: fbsIncomes?.length || 0,
        totalQuantity: fbsIncomes?.reduce((sum: number, item: any) => {
          return sum + (item.quantity || item.inWayToClient || item.inWayFromClient || 0)
        }, 0) || 0,
        items: fbsIncomes?.slice(0, 5).map((item: any) => ({
          incomeId: item.incomeId,
          number: item.number,
          date: item.date,
          quantity: item.quantity,
          allFields: Object.keys(item),
        })) || [],
        sample: fbsIncomes?.[0] || null,
      },
      fboSupplies: {
        count: fboSupplies?.length || 0,
        totalQuantity: fboSupplies?.reduce((sum: number, supply: any) => {
          if (supply.itemsCount !== undefined) {
            return sum + supply.itemsCount
          }
          if (supply.items && Array.isArray(supply.items)) {
            return sum + supply.items.reduce(
              (itemSum: number, item: any) => itemSum + (item.quantity || 0),
              0
            )
          }
          return sum
        }, 0) || 0,
        items: fboSupplies?.slice(0, 5).map((supply: any) => ({
          supplyId: supply.supplyId || supply.id,
          name: supply.name,
          createdAt: supply.createdAt,
          itemsCount: supply.itemsCount,
          items: supply.items?.length || 0,
          allFields: Object.keys(supply),
        })) || [],
        sample: fboSupplies?.[0] || null,
      },
      totalQuantity: 0,
    }

    analysis.totalQuantity = analysis.fbsIncomes.totalQuantity + analysis.fboSupplies.totalQuantity

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error: any) {
    console.error('Debug billing error:', error)
    return NextResponse.json(
      {
        error: 'Ошибка при получении отладочной информации',
        details: error.message || 'Неизвестная ошибка',
      },
      { status: 500 }
    )
  }
}

