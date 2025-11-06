import { NextResponse } from 'next/server'

export async function POST() {
  // В случае JWT токенов, logout происходит на клиенте
  // (удаление токена из localStorage/cookies)
  // Но можно добавить blacklist токенов в будущем
  return NextResponse.json({ message: 'Выход выполнен' })
}

