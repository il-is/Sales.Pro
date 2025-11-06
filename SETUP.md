# Инструкция по локальной настройке проекта

## Предварительные требования

1. **Node.js** версии 18 или выше
2. **PostgreSQL** версии 14 или выше
3. **npm** или **yarn**

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка базы данных

### 2.1 Создайте базу данных PostgreSQL

```bash
# Через psql
createdb billing_db

# Или через SQL
psql -U postgres
CREATE DATABASE billing_db;
```

### 2.2 Создайте файл `.env`

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/billing_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
```

**Важно:** Замените `username` и `password` на ваши учетные данные PostgreSQL.

## Шаг 3: Настройка Prisma

### 3.1 Сгенерируйте Prisma Client

```bash
npm run db:generate
```

### 3.2 Примените схему к базе данных

```bash
npm run db:push
```

Это создаст все таблицы в базе данных согласно схеме Prisma.

### 3.3 (Опционально) Откройте Prisma Studio

Для просмотра и редактирования данных в базе:

```bash
npm run db:studio
```

Откроется браузер на `http://localhost:5555`

## Шаг 4: Запуск проекта

```bash
npm run dev
```

Откройте браузер и перейдите на [http://localhost:3000](http://localhost:3000)

## Проверка работы

После запуска вы должны увидеть главную страницу с кнопками "Войти" и "Регистрация".

## Следующие шаги

После успешной настройки мы перейдем к:
1. Системе авторизации (Этап 2)
2. Управлению юридическими лицами (Этап 3)
3. И так далее...

## Решение проблем

### Ошибка подключения к БД

- Убедитесь, что PostgreSQL запущен
- Проверьте правильность DATABASE_URL в `.env`
- Проверьте права доступа пользователя к базе данных

### Ошибки при установке зависимостей

- Удалите `node_modules` и `package-lock.json`
- Выполните `npm install` заново

### Ошибки Prisma

- Убедитесь, что база данных создана
- Проверьте права доступа
- Попробуйте `npm run db:generate` и `npm run db:push` заново

