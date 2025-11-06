import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { z } from 'zod'

const createCompanySchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  inn: z.string().min(10, 'ИНН должен содержать минимум 10 символов').max(12, 'ИНН должен содержать максимум 12 символов'),
  legalAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  wbApiKey: z.string().optional(),
})

// GET /api/companies - Получить список компаний
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

    const companies = await prisma.company.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ companies })
  } catch (error) {
    console.error('Get companies error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка компаний' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Создать компанию
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
    const validatedData = createCompanySchema.parse(body)

    // Проверяем, существует ли компания с таким ИНН
    const existingCompany = await prisma.company.findUnique({
      where: { inn: validatedData.inn },
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Компания с таким ИНН уже существует' },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name: validatedData.name,
        inn: validatedData.inn,
        legalAddress: validatedData.legalAddress || null,
        contactPerson: validatedData.contactPerson || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        wbApiKey: validatedData.wbApiKey?.trim() || null,
        userId: payload.userId,
      },
    })

    return NextResponse.json({ company }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create company error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании компании' },
      { status: 500 }
    )
  }
}

