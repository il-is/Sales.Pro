import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
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

// GET /api/billing-config - Получить конфигурации для всех компаний пользователя
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

    // Получаем все компании пользователя с их конфигурациями
    const companies = await prisma.company.findMany({
      where: {
        userId: payload.userId,
      },
      include: {
        billingConfig: true,
      },
    })

    const configs = companies
      .filter((c) => c.billingConfig)
      .map((c) => ({
        ...c.billingConfig,
        services: JSON.parse(c.billingConfig!.services || '[]'),
        companyId: c.id,
      }))

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('Get billing configs error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении конфигураций' },
      { status: 500 }
    )
  }
}

