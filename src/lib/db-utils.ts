/**
 * Утилиты для работы с данными из БД
 * Поддерживают как SQLite (String) так и PostgreSQL (Json)
 */

/**
 * Парсит JSON из БД (работает и со String и с Json типами Prisma)
 */
export function parseJsonField<T = any>(value: string | object | null | undefined): T | null {
  if (value === null || value === undefined) {
    return null
  }

  // Если уже объект (PostgreSQL Json тип)
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }

  // Если строка (SQLite String тип)
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch (e) {
      console.error('Error parsing JSON field:', e)
      return null
    }
  }

  // Если массив (PostgreSQL Json массив)
  if (Array.isArray(value)) {
    return value as T
  }

  return null
}

/**
 * Сериализует данные в JSON строку для сохранения в БД
 */
export function serializeJsonField(value: any): string {
  if (value === null || value === undefined) {
    return 'null'
  }
  return JSON.stringify(value)
}

