import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { z } from 'zod'

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Название обязательно').optional(),
  inn: z.string().min(10).max(12).optional(),
  legalAddress: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  wbApiKey: z.string().optional(),
})

// GET /api/companies/[id] - Получить компанию
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

    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        billingConfig: true,
        _count: {
          select: {
            billings: true,
          },
        },
      },
    })

    // Парсим JSON строку services если есть
    if (company?.billingConfig) {
      try {
        const services = JSON.parse(company.billingConfig.services || '[]')
        company.billingConfig = { ...company.billingConfig, services } as any
      } catch (e) {
        // Если не удалось распарсить, оставляем как есть
      }
    }

    if (!company) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Get company error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении компании' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/[id] - Обновить компанию
export async function PUT(
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

    // Проверяем, что компания принадлежит пользователю
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    const body = await request.json()
    let validatedData
    
    try {
      validatedData = updateCompanySchema.parse(body)
    } catch (validationError: any) {
      console.error('Validation error:', validationError)
      return NextResponse.json(
        { 
          error: 'Ошибка валидации данных', 
          details: validationError.errors || validationError.message 
        },
        { status: 400 }
      )
    }

    // Если меняется ИНН, проверяем уникальность
    if (validatedData.inn && validatedData.inn !== existingCompany.inn) {
      const innExists = await prisma.company.findUnique({
        where: { inn: validatedData.inn },
      })

      if (innExists) {
        return NextResponse.json(
          { error: 'Компания с таким ИНН уже существует' },
          { status: 400 }
        )
      }
    }

    // Подготавливаем данные для обновления (обновляем только переданные поля)
    const updateData: any = {}
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.inn !== undefined) updateData.inn = validatedData.inn
    if (validatedData.legalAddress !== undefined) updateData.legalAddress = validatedData.legalAddress || null
    if (validatedData.contactPerson !== undefined) updateData.contactPerson = validatedData.contactPerson || null
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null
    if (validatedData.wbApiKey !== undefined) {
      // Если передана пустая строка, сохраняем null, иначе сохраняем обрезанный ключ
      updateData.wbApiKey = validatedData.wbApiKey?.trim() || null
    }

    console.log('Updating company with data:', { ...updateData, wbApiKey: updateData.wbApiKey ? '***' : null })

    const company = await prisma.company.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ company })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Неверные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update company error:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json(
      { 
        error: 'Ошибка при обновлении компании',
        details: error.message || 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Удалить компанию
export async function DELETE(
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

    // Проверяем, что компания принадлежит пользователю
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Компания не найдена' },
        { status: 404 }
      )
    }

    await prisma.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Компания удалена' })
  } catch (error) {
    console.error('Delete company error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении компании' },
      { status: 500 }
    )
  }
}

