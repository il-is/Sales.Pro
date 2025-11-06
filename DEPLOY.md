# Инструкция по деплою Sales.Pro на Vercel

## ⚠️ Важно: Миграция с SQLite на PostgreSQL

Текущая конфигурация использует SQLite для локальной разработки. Для деплоя на Vercel необходимо перейти на PostgreSQL.

## 🚀 Быстрый деплой

### Вариант 1: Использование Vercel Postgres (Рекомендуется)

1. **Подключите репозиторий к Vercel:**
   - Зайдите на [vercel.com](https://vercel.com)
   - Нажмите "New Project"
   - Импортируйте репозиторий `il-is/Sales.Pro`

2. **Добавьте Vercel Postgres:**
   - В настройках проекта → Storage → Create Database
   - Выберите "Postgres"
   - Создайте базу данных
   - Vercel автоматически добавит переменную `POSTGRES_PRISMA_URL` и `POSTGRES_URL_NON_POOLING`

3. **Обновите Prisma schema:**
   
   В `prisma/schema.prisma` измените:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   
   И обновите типы полей для PostgreSQL:
   - `services String` → `services Json` (в BillingConfig)
   - `marketplaceData String?` → `marketplaceData Json?` (в Billing)
   - `calculations String?` → `calculations Json?` (в Billing)
   - `role String` → `role UserRole` (enum)
   - `status String` → `status BillingStatus` (enum)

4. **Настройте переменные окружения в Vercel:**
   - `DATABASE_URL` = `POSTGRES_PRISMA_URL` (из Vercel Postgres)
   - `JWT_SECRET` = сгенерируйте случайную строку (например, через `openssl rand -base64 32`)

5. **Деплой:**
   - Vercel автоматически соберет проект
   - После первого деплоя выполните миграции через Vercel CLI:
     ```bash
     npx vercel env pull .env.local
     npx prisma migrate deploy
     ```
   - Или добавьте команду в `package.json`:
     ```json
     "postinstall": "prisma generate && prisma migrate deploy"
     ```

### Вариант 2: Использование внешнего PostgreSQL (Supabase, Railway, etc.)

1. **Создайте базу данных:**
   - Используйте Supabase, Railway, Neon или другой провайдер
   - Скопируйте строку подключения

2. **Настройте переменные окружения в Vercel:**
   - `DATABASE_URL` = строка подключения к PostgreSQL
   - `JWT_SECRET` = сгенерируйте случайную строку

3. **Обновите Prisma schema** (как в Варианте 1)

4. **Деплой** (как в Варианте 1)

## 📝 Изменения в коде для PostgreSQL

### 1. Обновите `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  USER
  ADMIN
}

enum BillingStatus {
  DRAFT
  GENERATED
  SENT
  PAID
  CANCELLED
}

model BillingConfig {
  // ...
  services  Json   @default("[]") // Вместо String
  // ...
}

model Billing {
  // ...
  status      BillingStatus @default(DRAFT) // Вместо String
  marketplaceData Json? // Вместо String?
  calculations    Json? // Вместо String?
  // ...
}

model User {
  // ...
  role      UserRole @default(USER) // Вместо String
  // ...
}
```

### 2. Обновите код для работы с JSON:

В файлах, где используется `JSON.parse()` и `JSON.stringify()`, Prisma будет автоматически работать с JSON типами.

Например, в `src/app/api/billing-config/[companyId]/route.ts`:
```typescript
// Было:
const services = JSON.parse(billingConfig.services || '[]')

// Станет:
const services = billingConfig.services as BillingService[]
```

### 3. Создайте миграцию:

```bash
npx prisma migrate dev --name migrate_to_postgresql
```

## 🔄 Двухрежимная конфигурация (SQLite локально, PostgreSQL в production)

Если хотите сохранить SQLite для локальной разработки:

1. Создайте два файла схемы:
   - `prisma/schema.sqlite.prisma` (для локальной разработки)
   - `prisma/schema.postgresql.prisma` (для production)

2. Используйте скрипт для переключения:
   ```bash
   # Локально
   cp prisma/schema.sqlite.prisma prisma/schema.prisma
   npm run db:push
   
   # Перед деплоем
   cp prisma/schema.postgresql.prisma prisma/schema.prisma
   ```

3. Или используйте переменную окружения:
   ```bash
   # В package.json
   "db:generate:sqlite": "cp prisma/schema.sqlite.prisma prisma/schema.prisma && prisma generate",
   "db:generate:postgres": "cp prisma/schema.postgresql.prisma prisma/schema.prisma && prisma generate"
   ```

## ✅ Чеклист перед деплоем

- [ ] Обновлен `prisma/schema.prisma` для PostgreSQL
- [ ] Создана база данных PostgreSQL
- [ ] Настроены переменные окружения в Vercel
- [ ] Обновлен код для работы с JSON типами (если нужно)
- [ ] Созданы и применены миграции
- [ ] Протестирована работа на production

## 🐛 Решение проблем

### Ошибка: "Unknown argument" при работе с Prisma

**Решение:** Убедитесь, что Prisma Client сгенерирован с правильной схемой:
```bash
npm run db:generate
```

### Ошибка: "Database does not exist"

**Решение:** Проверьте строку подключения `DATABASE_URL` в настройках Vercel.

### Ошибка: "Migration failed"

**Решение:** Выполните миграции вручную через Vercel CLI или добавьте команду в `package.json`:
```json
"postinstall": "prisma generate && prisma migrate deploy"
```

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи в Vercel Dashboard
2. Переменные окружения
3. Статус базы данных
4. Миграции Prisma

