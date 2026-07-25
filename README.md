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
| `TELEGRAM_BOT_TOKEN` | со 2 этапа | Токен Telegram-бота, используется для валидации initData |
| `TELEGRAM_BOT_USERNAME` | со 2 этапа | Username бота (для deep links) |
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

Полноценная валидация Telegram `initData` на стороне Next.js API появится на
Этапе 2.

## Безопасность

- Telegram `initData` валидируется только на сервере (HMAC-подпись), фронтенду
  не доверяем ни в чём — с Этапа 2.
- `ALLOW_DEV_AUTH=true` физически заблокирован при `NODE_ENV=production`
  (проверяется в `src/config/env.ts`).
- Все случайные результаты (рулетка, выбор варианта) считаются на сервере
  криптографически стойким генератором — с Этапа 5.
