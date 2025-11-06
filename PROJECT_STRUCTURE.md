# Структура проекта: SaaS для автоматизации биллинга склада ответственного хранения

## Обзор проекта

Сервис для автоматизации составления биллинга для склада ответственного хранения с интеграцией маркетплейсов (начиная с Wildberries).

## Технологический стек

### Frontend
- **Next.js 14+** (App Router) - React фреймворк с SSR
- **TypeScript** - типизация
- **Material-UI (MUI) v5** - компоненты Material Design
- **React Hook Form** - управление формами
- **Zustand** или **Jotai** - управление состоянием (легковесное решение)
- **Axios** - HTTP клиент

### Backend
- **Next.js API Routes** - серверная логика (встроено в Next.js)
- **Node.js** - runtime
- **Prisma** - ORM для работы с БД
- **PostgreSQL** - основная БД (можно использовать Supabase для деплоя)
- **JWT** - авторизация
- **bcrypt** - хеширование паролей

### Интеграции
- **Wildberries API** - получение данных с маркетплейса
- **jsPDF** или **@react-pdf/renderer** - генерация PDF
- **ExcelJS** - генерация Excel файлов
- **nodemailer** (опционально) - отправка биллинга по email

### Инфраструктура
- **Vercel** - хостинг и деплой
- **Supabase** или **PlanetScale** - managed PostgreSQL (если используется)
- **Vercel Blob Storage** - хранение файлов (опционально)

## Структура директорий

```
project-root/
├── .env.local                    # Локальные переменные окружения
├── .env.example                  # Пример переменных окружения
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js            # Если используется Tailwind (опционально)
│
├── prisma/
│   ├── schema.prisma             # Схема базы данных
│   └── migrations/               # Миграции БД
│
├── public/
│   ├── images/
│   └── fonts/
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Главная страница
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Layout с навигацией
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # Главная страница дашборда
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx      # Список юридических лиц
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Детали юр. лица
│   │   │   │   └── new/
│   │   │   │       └── page.tsx  # Создание нового юр. лица
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx      # Список биллингов
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx  # Детали биллинга
│   │   │   │   └── generate/
│   │   │   │       └── page.tsx  # Генерация нового биллинга
│   │   │   ├── settings/
│   │   │   │   └── page.tsx      # Настройки системы
│   │   │   └── profile/
│   │   │       └── page.tsx      # Профиль пользователя
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── route.ts
│   │       │   ├── register/
│   │       │   │   └── route.ts
│   │       │   └── logout/
│   │       │       └── route.ts
│   │       ├── companies/
│   │       │   ├── route.ts      # GET, POST
│   │       │   └── [id]/
│   │       │       └── route.ts  # GET, PUT, DELETE
│   │       ├── billing/
│   │       │   ├── route.ts      # GET, POST
│   │       │   ├── [id]/
│   │       │   │   └── route.ts  # GET, PUT, DELETE
│   │       │   ├── [id]/generate/
│   │       │   │   └── route.ts  # Генерация биллинга
│   │       │   ├── [id]/export-pdf/
│   │       │   │   └── route.ts  # Экспорт в PDF
│   │       │   └── [id]/export-excel/
│   │       │       └── route.ts  # Экспорт в Excel
│   │       ├── integrations/
│   │       │   ├── wildberries/
│   │       │   │   ├── fetch-data/
│   │       │   │   │   └── route.ts  # Запрос данных с WB
│   │       │   │   └── sync/
│   │       │   │       └── route.ts  # Синхронизация данных
│   │       │   └── webhooks/
│   │       │       └── route.ts      # Webhooks от маркетплейсов
│   │       └── billing-config/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   │
│   ├── components/               # React компоненты
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── companies/
│   │   │   ├── CompanyList.tsx
│   │   │   ├── CompanyCard.tsx
│   │   │   ├── CompanyForm.tsx
│   │   │   └── CompanyDetails.tsx
│   │   ├── billing/
│   │   │   ├── BillingList.tsx
│   │   │   ├── BillingCard.tsx
│   │   │   ├── BillingForm.tsx
│   │   │   ├── BillingDetails.tsx
│   │   │   ├── BillingConfig.tsx  # Конфигурация биллинга
│   │   │   └── BillingPreview.tsx # Превью биллинга
│   │   └── integrations/
│   │       ├── WildberriesIntegration.tsx
│   │       └── DataSyncStatus.tsx
│   │
│   ├── lib/                      # Утилиты и хелперы
│   │   ├── db.ts                 # Prisma client
│   │   ├── auth.ts               # Авторизация и JWT
│   │   ├── validation.ts         # Схемы валидации (Zod)
│   │   ├── api-client.ts         # HTTP клиент для внешних API
│   │   └── utils.ts              # Общие утилиты
│   │
│   ├── services/                 # Бизнес-логика
│   │   ├── auth.service.ts
│   │   ├── company.service.ts
│   │   ├── billing.service.ts
│   │   ├── wildberries.service.ts
│   │   ├── pdf.service.ts
│   │   └── excel.service.ts
│   │
│   ├── types/                    # TypeScript типы
│   │   ├── user.ts
│   │   ├── company.ts
│   │   ├── billing.ts
│   │   ├── wildberries.ts
│   │   └── api.ts
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCompanies.ts
│   │   ├── useBilling.ts
│   │   └── useWildberries.ts
│   │
│   └── store/                    # Zustand stores
│       ├── authStore.ts
│       ├── companyStore.ts
│       └── billingStore.ts
│
└── docs/                         # Документация
    ├── API.md
    ├── DEPLOYMENT.md
    └── WILDBERRIES_INTEGRATION.md
```

## Схема базы данных (Prisma Schema)

```prisma
// Основные модели

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  companies Company[]
  billings  Billing[]
}

enum UserRole {
  USER
  ADMIN
}

model Company {
  id          String   @id @default(cuid())
  name        String
  inn         String   @unique
  legalAddress String?
  contactPerson String?
  email       String?
  phone       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  billingConfig BillingConfig?
  billings      Billing[]
}

model BillingConfig {
  id        String   @id @default(cuid())
  companyId String   @unique
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  services  Json     // Массив услуг с галочками и ценами
  // Пример: [{id: "storage", name: "Хранение", enabled: true, price: 10.5}, ...]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Billing {
  id          String        @id @default(cuid())
  companyId   String
  company     Company       @relation(fields: [companyId], references: [id])
  
  periodStart DateTime
  periodEnd   DateTime
  status      BillingStatus @default(DRAFT)
  
  totalAmount Float         @default(0)
  
  // Данные из маркетплейса (JSON)
  marketplaceData Json?
  
  // Расчетные данные (JSON)
  calculations    Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}

enum BillingStatus {
  DRAFT
  GENERATED
  SENT
  PAID
  CANCELLED
}

model Integration {
  id          String   @id @default(cuid())
  type        IntegrationType
  apiKey      String?  // Зашифрованное поле
  apiSecret   String?  // Зашифрованное поле
  isActive    Boolean  @default(false)
  
  lastSyncAt  DateTime?
  syncStatus  SyncStatus @default(IDLE)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum IntegrationType {
  WILDBERRIES
  OZON
  YANDEX_MARKET
}

enum SyncStatus {
  IDLE
  SYNCING
  SUCCESS
  ERROR
}
```

## Этапы разработки

### Этап 1: Базовая настройка проекта
- [ ] Инициализация Next.js проекта
- [ ] Настройка TypeScript
- [ ] Настройка Prisma и подключение БД
- [ ] Настройка MUI и базовых стилей
- [ ] Настройка структуры папок

### Этап 2: Система авторизации
- [ ] Модель User в БД
- [ ] API endpoints для регистрации/логина
- [ ] JWT токены
- [ ] Страницы логина и регистрации
- [ ] Middleware для защиты роутов
- [ ] Хранилище состояния авторизации

### Этап 3: Управление юридическими лицами
- [ ] Модель Company в БД
- [ ] API для CRUD операций с компаниями
- [ ] Страница списка компаний
- [ ] Страница создания/редактирования компании
- [ ] Страница деталей компании

### Этап 4: Конфигурация биллинга
- [ ] Модель BillingConfig в БД
- [ ] API для управления конфигурацией
- [ ] UI для настройки услуг (галочки + цены)
- [ ] Сохранение конфигурации для каждого юр. лица

### Этап 5: Интеграция с Wildberries
- [ ] Изучение WB API документации
- [ ] Модель Integration в БД
- [ ] Сервис для работы с WB API
- [ ] API endpoint для получения данных
- [ ] UI для подключения интеграции
- [ ] UI для синхронизации данных

### Этап 6: Генерация биллинга
- [ ] Модель Billing в БД
- [ ] Логика расчета биллинга на основе конфигурации
- [ ] API для генерации биллинга
- [ ] Страница генерации биллинга
- [ ] Страница просмотра биллинга

### Этап 7: Экспорт биллинга
- [ ] Генерация PDF (документ для оплаты)
- [ ] Генерация Excel (таблица с расчетами)
- [ ] API endpoints для экспорта
- [ ] Кнопки экспорта в UI

### Этап 8: Дополнительные функции
- [ ] История биллингов
- [ ] Фильтры и поиск
- [ ] Статистика и аналитика
- [ ] Уведомления (опционально)

### Этап 9: Тестирование и деплой
- [ ] Тестирование всех функций
- [ ] Настройка Vercel
- [ ] Настройка production БД
- [ ] Деплой на Vercel
- [ ] Документация

## API Endpoints (примерная структура)

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

### Компании
- `GET /api/companies` - Список компаний
- `POST /api/companies` - Создание компании
- `GET /api/companies/[id]` - Детали компании
- `PUT /api/companies/[id]` - Обновление компании
- `DELETE /api/companies/[id]` - Удаление компании

### Конфигурация биллинга
- `GET /api/billing-config` - Список конфигураций
- `GET /api/billing-config/[companyId]` - Конфигурация компании
- `PUT /api/billing-config/[companyId]` - Обновление конфигурации

### Биллинги
- `GET /api/billing` - Список биллингов
- `POST /api/billing` - Создание биллинга
- `GET /api/billing/[id]` - Детали биллинга
- `POST /api/billing/[id]/generate` - Генерация биллинга
- `GET /api/billing/[id]/export-pdf` - Экспорт PDF
- `GET /api/billing/[id]/export-excel` - Экспорт Excel

### Интеграции
- `GET /api/integrations/wildberries` - Статус интеграции
- `POST /api/integrations/wildberries` - Настройка интеграции
- `POST /api/integrations/wildberries/fetch-data` - Получение данных
- `POST /api/integrations/wildberries/sync` - Синхронизация

## Важные замечания

1. **Безопасность**: Все API ключи должны храниться в переменных окружения, пароли хешируются с bcrypt
2. **Валидация**: Использовать Zod для валидации данных на бэкенде и фронтенде
3. **Обработка ошибок**: Централизованная обработка ошибок
4. **Типизация**: Строгая типизация TypeScript везде
5. **Responsive**: Все интерфейсы должны быть адаптивными
6. **Accessibility**: Соответствие стандартам доступности

## Вопросы для обсуждения

1. Какие именно данные нужно получать с Wildberries? (складские операции, возвраты, и т.д.)
2. Какие услуги должны быть в биллинге по умолчанию? (хранение, приемка, отгрузка, и т.д.)
3. Нужна ли система ролей и прав доступа?
4. Нужна ли история изменений биллингов?
5. Какие форматы экспорта кроме PDF и Excel нужны?
6. Нужна ли отправка биллингов по email?
7. Какой период биллинга по умолчанию? (месяц, неделя, и т.д.)

