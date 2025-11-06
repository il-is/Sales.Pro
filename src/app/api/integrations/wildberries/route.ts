import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateIntegrationSchema = z.object({
  apiKey: z.string().min(1, 'API ключ обязателен'),
  apiSecret: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/integrations/wildberries - Получить интеграцию Wildberries
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

    const integration = await prisma.integration.findFirst({
      where: {
        userId: payload.userId,
        type: 'WILDBERRIES',
      },
    })

    if (!integration) {
      return NextResponse.json({
        integration: null,
      })
    }

    // Не возвращаем секретные данные в полном виде
    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        isActive: integration.isActive,
        lastSyncAt: integration.lastSyncAt,
        syncStatus: integration.syncStatus,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
        // API ключ показываем частично (первые и последние символы)
        apiKey: integration.apiKey
          ? `${integration.apiKey.substring(0, 4)}****${integration.apiKey.substring(integration.apiKey.length - 4)}`
          : null,
      },
    })
  } catch (error) {
    console.error('Get Wildberries integration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении интеграции' },
      { status: 500 }
    )
  }
}

// POST /api/integrations/wildberries - Создать или обновить интеграцию
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
    const validatedData = updateIntegrationSchema.parse(body)

    // Проверяем, существует ли интеграция
    const existing = await prisma.integration.findFirst({
      where: {
        userId: payload.userId,
        type: 'WILDBERRIES',
      },
    })

    let integration
    if (existing) {
      // Обновляем существующую интеграцию
      integration = await prisma.integration.update({
        where: { id: existing.id },
        data: {
          apiKey: validatedData.apiKey,
          apiSecret: validatedData.apiSecret || existing.apiSecret,
          isActive: validatedData.isActive ?? existing.isActive,
        },
      })
    } else {
      // Создаем новую интеграцию
      integration = await prisma.integration.create({
        data: {
          userId: payload.userId,
          type: 'WILDBERRIES',
          apiKey: validatedData.apiKey,
          apiSecret: validatedData.apiSecret || null,
          isActive: validatedData.isActive ?? false,
        },
      })
    }

    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        isActive: integration.isActive,
        lastSyncAt: integration.lastSyncAt,
        syncStatus: integration.syncStatus,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create/Update Wildberries integration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при сохранении интеграции' },
      { status: 500 }
    )
  }
}
