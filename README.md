# RESHALA

Социальное развлекательное Telegram Mini App для компаний друзей: рулетки,
случайный выбор, споры, голосования и AI-вердикты.

«Хватит пиздеть. Решала уже решил.»

Прогресс разработки и текущий этап — см. [ROADMAP.md](./ROADMAP.md).

## Стек

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + TypeScript strict
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Prisma 7](https://www.prisma.io/) + PostgreSQL (`@prisma/adapter-pg`)
- [Zod](https://zod.dev/) — валидация env и API-схем
- [Vitest](https://vitest.dev/) — тесты
- Telegram Mini Apps WebApp API (официальный `telegram-web-app.js`)
- **Bot: [Go](https://go.dev/) 1.25**, отдельный сервис `bot/`, long polling, без внешних Telegram-SDK (свой минимальный клиент поверх Bot API)

## Установка

```bash
npm install
cp .env.example .env
```

Заполните `.env` — см. описание переменных ниже.

## Переменные окружения

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `DATABASE_URL` | да | Строка подключения к PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | да | Публичный URL приложения (share-ссылки, deep links) |
| `TELEGRAM_BOT_TOKEN` | да | Токен Telegram-бота, используется для валидации initData |
| `TELEGRAM_BOT_USERNAME` | нет | Username бота (для deep links) |
| `SESSION_SECRET` | да | Секрет для подписи сессионной cookie, ≥32 символов |
| `ALLOW_DEV_AUTH` | нет | `true` включает dev-обход авторизации. Физически запрещён при `NODE_ENV=production` |
| `DEV_TELEGRAM_USER_ID` | нет | Telegram ID, который подставляется при dev-обходе |
| `AI_PROVIDER` / `AI_API_KEY` | с 11 этапа | Провайдер и ключ для AI-вердиктов |

Полный шаблон — в [`.env.example`](./.env.example).

## База данных

Локально поднимается через Docker:

```bash
docker compose up -d
npm run db:migrate
```

Полезные команды:

```bash
npm run db:generate  # сгенерировать Prisma Client
npm run db:migrate    # применить миграции (dev)
npm run db:studio     # Prisma Studio
```

## Разработка

```bash
npm run dev
```

Приложение поднимется на http://localhost:3000. Health-check: `GET /api/health`.

## Тестирование, линт, типы, сборка

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Telegram Bot

Отдельный Go-сервис в `bot/` — принимает сообщения через long polling (без
вебхука, публичный адрес самому боту не нужен) и на `/start` присылает кнопку
с Mini App (`web_app`).

```bash
cd bot
cp .env.example .env   # заполнить TELEGRAM_BOT_TOKEN и MINI_APP_URL
go run .
```

Настройка:

1. Зарегистрировать бота у [@BotFather](https://t.me/BotFather) → `/newbot`,
   получить токен.
2. `MINI_APP_URL` должен быть публичным HTTPS-адресом Next.js приложения
   (Telegram не откроет `http://localhost`). Для локальной проверки — туннель,
   например `npx localtunnel --port 3000`.
3. Токен и URL — только в `bot/.env` (в git не коммитится).

## Авторизация

- `POST /api/v1/auth/telegram` — принимает `{ "initData": "..." }` (сырая строка
  из `Telegram.WebApp.initData`), валидирует HMAC-подпись на сервере, создаёт
  или обновляет `User`, выставляет httpOnly-сессионную cookie.
- `GET /api/v1/me` — текущий пользователь по сессии, `401 UNAUTHENTICATED` без неё.
- Dev-обход: `POST /api/v1/auth/telegram` с `{ "dev": true }` работает только при
  `ALLOW_DEV_AUTH=true` (использует `DEV_TELEGRAM_USER_ID`), иначе `403 DEV_AUTH_DISABLED`.
- Формат ошибок единый: `{ "error": { "code": "...", "message": "..." } }`.

## Sessions API (Этап 4)

Generic-движок сессий, на котором строятся все режимы (рулетка, голосования,
споры и т.д. — Этапы 5+).

- `POST /api/v1/sessions` — создать сессию (`{ type, title, settings? }`,
  `type` ∈ `ROULETTE | RANDOM_CHOICE | DEBATE | POLL | AI_VERDICT`). Требует авторизации.
- `GET /api/v1/sessions/:id` — сессия по `publicId`. Без авторизации — результаты
  доступны по ссылке любому, у кого она есть.
- `POST /api/v1/sessions/:id/join` — присоединиться участником. Идемпотентно
  (повторный вызов не создаёт дубликат), нельзя после `CLOSED`/`RESOLVED`/`CANCELLED`.
- `POST /api/v1/sessions/:id/start` — перевести `DRAFT → OPEN`. Только автор сессии.
- `POST /api/v1/sessions/:id/participants` — добавить участников вручную
  (`{ displayNames: string[] }`, 1–20 имён). Только автор, только до старта,
  только для `ROULETTE`.
- `POST /api/v1/sessions/:id/options` — добавить варианты выбора
  (`{ labels: string[] }`, 1–20 штук). Только автор, только до старта,
  только для `RANDOM_CHOICE`.
- `POST /api/v1/sessions/:id/finalize` — идемпотентная финализация. Реальная
  логика уже есть для `ROULETTE` и `RANDOM_CHOICE` (криптографически стойкий
  случайный выбор, `crypto.randomInt`). Для остальных типов — `501
  FINALIZE_NOT_IMPLEMENTED` до соответствующего этапа.

Реакции и AI-вердикт — часть конкретных режимов, появятся вместе с ними
(Этапы 11, 13).

## «Кто сегодня?» и «Нам похуй» (Этапы 5–6)

Два живых режима поверх Sessions API:

- `/who-today` — вопрос (шаблон или свой) + участники → `КРУТИТЬ`. Сервер уже
  знает победителя до анимации. `Реванш` — новый независимый раунд с теми же
  участниками, `Новый вопрос` — полный сброс.
- `/random-pick` — список вариантов (не людей) → `РЕШАЙ`. `Повторить» —
  новый раунд с тем же списком, «Убрать «X» и повторить» — реролл без
  победившего варианта, «Новый список» — полный сброс.

## Безопасность

- Telegram `initData` валидируется только на сервере (HMAC-SHA256 по
  официальному алгоритму), фронтенду не доверяем ни в чём — см.
  `src/server/auth/telegram-init-data.ts`.
- Сессия — подписанная httpOnly-cookie (`src/server/auth/session.ts`), секрет
  — `SESSION_SECRET`, срок жизни 30 дней, подпись и срок годности проверяются
  на каждый запрос.
- `ALLOW_DEV_AUTH=true` физически заблокирован при `NODE_ENV=production`
  (проверяется в `src/config/env.ts`, включая сборку — `next build` тоже упадёт).
- Все случайные результаты (рулетка, выбор варианта) считаются на сервере
  криптографически стойким генератором — с Этапа 5.
