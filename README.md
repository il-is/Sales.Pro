# Биллинг для склада ответственного хранения

SaaS решение для автоматизации составления биллинга для склада ответственного хранения с интеграцией маркетплейсов.

## Технологии

- Next.js 14 (App Router)
- TypeScript
- Material-UI (MUI)
- Prisma ORM
- PostgreSQL

## Установка для локальной разработки

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте базу данных

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/billing_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. Настройте PostgreSQL

Убедитесь, что PostgreSQL установлен и запущен. Создайте базу данных:

```bash
createdb billing_db
```

Или используйте SQL:

```sql
CREATE DATABASE billing_db;
```

### 4. Примените миграции Prisma

```bash
npm run db:generate
npm run db:push
```

### 5. Запустите dev сервер

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## Структура проекта

См. `PROJECT_STRUCTURE.md` для детальной информации о структуре проекта.

## Доступные команды

- `npm run dev` - запуск dev сервера
- `npm run build` - сборка для production
- `npm run start` - запуск production сервера
- `npm run db:generate` - генерация Prisma Client
- `npm run db:push` - применение схемы к БД (без миграций)
- `npm run db:migrate` - создание и применение миграций
- `npm run db:studio` - открытие Prisma Studio

## Этапы разработки

См. `PROJECT_STRUCTURE.md` для списка этапов разработки.

