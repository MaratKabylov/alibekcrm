# Руководство по подключению и работе с Supabase Auth в Alibek CRM

В проект внедрена полная серверная и клиентская архитектура авторизации на базе **Supabase Auth** и **Next.js 16 App Router** с использованием официальной библиотеки `@supabase/ssr`.

---

## 📁 Созданные компоненты и файлы

| Файл | Назначение |
|---|---|
| `src/lib/supabase/client.ts` | Браузерный клиент Supabase (`createBrowserClient`) для клиентских компонентов React. |
| `src/lib/supabase/server.ts` | Серверный клиент (`createServerClient`) с асинхронными куками (`await cookies()`), клиент с сервисным ключом (`createAdminClient`) и метод проверки конфигурации. |
| `src/lib/supabase/proxy.ts` | Логика обновления сессии и валидации JWT (`supabase.auth.getUser()`) для серверного прокси. |
| `src/proxy.ts` | Прокси/Middleware Next.js 16: защищает внутренние разделы CRM, перенаправляет неавторизованных на `/login`, обновляет токены в куках. |
| `src/lib/auth-context.tsx` | React-контекст (`useAuth()`), синхронизирующий сессию Supabase с таблицей `public.profiles`. Поддерживает вход, регистрацию, сброс пароля, выход и демо-режим. |
| `src/app/login/page.tsx` | Фирменная страница входа и регистрации сотрудников с переключателем вкладок, сбросом пароля и быстрым демо-входом. |
| `src/app/auth/callback/route.ts` | Route Handler для подтверждения email, перехода по magic link и сброса пароля (`exchangeCodeForSession`). |
| `src/app/auth/signout/route.ts` | Route Handler для безопасного выхода из системы и очистки серверных кук. |
| `src/components/AppShell.tsx` | Оболочка приложения, скрывающая сайдбар CRM на страницах авторизации. |
| `supabase/migrations/20261030000003_auth_profiles_trigger.sql` | SQL-миграция с улучшенным триггером автоматического создания профиля в `public.profiles` при регистрации в `auth.users`, политиками RLS и функцией `make_user_admin`. |

---

## 🚀 Пошаговое подключение вашего проекта Supabase

### Шаг 1. Получение API-ключей в консоли Supabase
1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard) и выберите ваш проект (или создайте новый).
2. Откройте раздел **Project Settings** -> **API**.
3. Скопируйте:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (секретный ключ, используется только на сервере)

### Шаг 2. Настройка переменных окружения
В файле `.env.local` замените плейсхолдеры на реальные ключи:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_DEFAULT_CURRENCY=KZT
NEXT_PUBLIC_TIMEZONE=Asia/Almaty
```

> **Примечание:** Пока в `.env.local` указаны плейсхолдеры, CRM автоматически работает в безопасном **демо-режиме** (доступен быстрый вход в 1 клик для разработки). Как только вы укажете реальный URL Supabase, система автоматически переключится на боевой Supabase Auth!

### Шаг 3. Применение миграций в базе данных Supabase
В Supabase Dashboard перейдите в **SQL Editor** и выполните по очереди файлы миграций из папки `supabase/migrations/`:

1. `20261030000001_initial_schema.sql` — таблицы CRM (компании, контакты, лиды, сделки, товары, прайсы, КП).
2. `20261030000002_rls_and_triggers.sql` — политики безопасности строк (RLS).
3. `20261030000003_auth_profiles_trigger.sql` — триггер автосоздания профилей и политики для `profiles`.
4. *(Опционально)* `seed.sql` — наполнение каталога тестовыми товарами и ценами по ТЗ.

### Шаг 4. Настройка Authentication в Supabase Dashboard
1. Перейдите в **Authentication** -> **URL Configuration**.
2. Установите:
   - **Site URL**: `http://localhost:3000` (для продакшна укажите ваш боевой домен).
   - **Redirect URLs**: добавьте `http://localhost:3000/auth/callback` (и боевой адрес `/auth/callback`).
3. В **Authentication** -> **Providers** -> **Email**:
   - Убедитесь, что провайдер Email включен.
   - Если хотите входить сразу без ожидания письма подтверждения почты во время разработки, отключите опцию *Confirm email*.

---

## 👥 Роли пользователей: Администратор и Менеджер

При регистрации нового пользователя через страницу `/login` триггер `handle_new_user` автоматически создает запись в таблице `public.profiles`.

- По умолчанию пользователю присваивается роль **Менеджер** (`manager`).
- Чтобы назначить пользователю роль **Администратор** (`admin`), выполните в **SQL Editor** Supabase:

```sql
SELECT public.make_user_admin('email-сотрудника@alibekcrm.kz');
```

Или прямым запросом:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'email-сотрудника@alibekcrm.kz';
```

---

## 🔒 Как работает безопасность и защита маршрутов

1. **Proxy (Next.js 16)**:
   При каждом переходе на страницы CRM (`/`, `/leads`, `/deals`, `/companies`, `/quotes` и т.д.) прокси проверяет актуальность сессии через `supabase.auth.getUser()`.
   Если пользователь не авторизован — происходит мгновенный редирект на `/login?redirectTo=...`.
2. **Бесшовное обновление токенов**:
   SSR-клиент автоматически обновляет истекающие JWT-токены через refresh_token в HTTP-only куках браузера.
3. **Безопасный выход**:
   Кнопка выхода в сайдбаре и настройках аннулирует сессию на сервере Supabase Auth и очищает куки.

