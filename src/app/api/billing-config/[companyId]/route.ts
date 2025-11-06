import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { parseJsonField, serializeJsonField } from '@/lib/db-utils'
import { z } from 'zod'

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  price: z.number().min(0),
  unit: z.string().optional(),
  description: z.string().optional(),
})

const updateConfigSchema = z.object({
  services: z.array(serviceSchema),
})

// GET /api/billing-config/[companyId] - Получить конфигурацию компании
export async function GET(
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
      include: {
        billingConfig: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    // Если конфигурации нет, возвращаем дефолтную
    if (!company.billingConfig) {
      const defaultServices = [
        {
          id: 'fbs',
          name: 'FBS (Отгрузка к покупателям)',
          enabled: true,
          price: 0,
          unit: 'за единицу',
          description: 'Количество товара, которое уехало к покупателям (FBS отгрузка)',
        },
        {
          id: 'fbo',
          name: 'FBO (Приемка на склад WB)',
          enabled: true,
          price: 0,
          unit: 'за единицу',
          description: 'Количество товара, принятого складом Wildberries (FBO приемка)',
        },
        {
          id: 'storage',
          name: 'Хранение',
          enabled: false,
          price: 0,
          unit: 'за м²/месяц',
          description: 'Хранение товаров на складе',
        },
        {
          id: 'handling',
          name: 'Комплектация',
          enabled: false,
          price: 0,
          unit: 'за единицу',
          description: 'Комплектация заказов',
        },
      ]

      return NextResponse.json({
        config: {
          companyId: params.companyId,
          services: defaultServices,
        },
      })
    }

    // Парсим JSON (работает и со String и с Json типами)
    const services = parseJsonField(company.billingConfig.services) || []

    return NextResponse.json({
      config: {
        id: company.billingConfig.id,
        companyId: params.companyId,
        services,
        createdAt: company.billingConfig.createdAt,
        updatedAt: company.billingConfig.updatedAt,
      },
    })
  } catch (error) {
    console.error('Get billing config error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении конфигурации' },
      { status: 500 }
    )
  }
}

// PUT /api/billing-config/[companyId] - Обновить конфигурацию
export async function PUT(
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

    const body = await request.json()
    const validatedData = updateConfigSchema.parse(body)

    // Сохраняем services (Prisma автоматически обработает для PostgreSQL Json или SQLite String)
    const servicesJson = serializeJsonField(validatedData.services)

    // Проверяем, существует ли конфигурация
    const existingConfig = await prisma.billingConfig.findUnique({
      where: { companyId: params.companyId },
    })

    let config
    if (existingConfig) {
      // Обновляем существующую конфигурацию
      config = await prisma.billingConfig.update({
        where: { companyId: params.companyId },
        data: {
          services: servicesJson,
        },
      })
    } else {
      // Создаем новую конфигурацию
      config = await prisma.billingConfig.create({
        data: {
          companyId: params.companyId,
          services: servicesJson,
        },
      })
    }

    // Парсим для ответа
    const services = parseJsonField(config.services) || []

    return NextResponse.json({
      config: {
        id: config.id,
        companyId: params.companyId,
        services,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update billing config error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении конфигурации' },
      { status: 500 }
    )
  }
}

