import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createBillingSchema = z.object({
  companyId: z.string().min(1, 'ID компании обязателен'),
  periodStart: z.string().datetime('Неверный формат даты начала периода'),
  periodEnd: z.string().datetime('Неверный формат даты окончания периода'),
})

// GET /api/billing - Получить список биллингов
export async function GET(request: NextRequest) {
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

    const billings = await prisma.billing.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inn: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Парсим JSON строки
    const parsedBillings = billings.map((billing) => ({
      ...billing,
      marketplaceData: billing.marketplaceData ? JSON.parse(billing.marketplaceData) : null,
      calculations: billing.calculations ? JSON.parse(billing.calculations) : null,
    }))

    return NextResponse.json({ billings: parsedBillings })
  } catch (error) {
    console.error('Get billings error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка биллингов' },
      { status: 500 }
    )
  }
}

// POST /api/billing - Создать биллинг
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

    const body = await request.json()
    const validatedData = createBillingSchema.parse(body)

    // Проверяем, что компания принадлежит пользователю
    const company = await prisma.company.findFirst({
      where: {
        id: validatedData.companyId,
        userId: payload.userId,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    const billing = await prisma.billing.create({
      data: {
        companyId: validatedData.companyId,
        periodStart: new Date(validatedData.periodStart),
        periodEnd: new Date(validatedData.periodEnd),
        userId: payload.userId,
        status: 'DRAFT',
        totalAmount: 0,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            inn: true,
          },
        },
      },
    })

    return NextResponse.json({ billing }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create billing error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании биллинга' },
      { status: 500 }
    )
  }
}

