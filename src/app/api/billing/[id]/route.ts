import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

// GET /api/billing/[id] - Получить биллинг
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

    const billing = await prisma.billing.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
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

    if (!billing) {
      return NextResponse.json(
        { error: 'Биллинг не найден' },
        { status: 404 }
      )
    }

    // Парсим JSON строки
    const parsedBilling = {
      ...billing,
      marketplaceData: billing.marketplaceData ? JSON.parse(billing.marketplaceData) : null,
      calculations: billing.calculations ? JSON.parse(billing.calculations) : null,
    }

    return NextResponse.json({ billing: parsedBilling })
  } catch (error) {
    console.error('Get billing error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении биллинга' },
      { status: 500 }
    )
  }
}

// DELETE /api/billing/[id] - Удалить биллинг
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

    const billing = await prisma.billing.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    })

    if (!billing) {
      return NextResponse.json(
        { error: 'Биллинг не найден' },
        { status: 404 }
      )
    }

    await prisma.billing.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Биллинг удален' })
  } catch (error) {
    console.error('Delete billing error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении биллинга' },
      { status: 500 }
    )
  }
}

