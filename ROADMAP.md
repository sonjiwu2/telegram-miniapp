# RESHALA — ROADMAP

Социальное развлекательное Telegram Mini App: рулетки, споры, голосования, AI-вердикты для компаний друзей.

Статусы: `TODO` → `IN PROGRESS` → `DONE`. Каждый этап завершается прогоном typecheck/lint/test/build и остановкой до команды «дальше».

## Этап 1 — Project foundation — DONE

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4
- Prisma 7 + PostgreSQL (schema/config, без данных)
- Zod-валидация env
- Базовая структура каталогов
- Тема (light/dark, синхронизация с Telegram theme params)
- Telegram WebApp bootstrap (ready/expand, без auth)
- Dev-режим (`npm run dev`)
- lint/typecheck/test/build

## Этап 2 — Telegram auth — DONE

- Валидация Telegram initData (HMAC-SHA256 по официальному алгоритму) на сервере
- Модель `User` в Prisma, upsert по Telegram ID
- Auth-слой: подписанная httpOnly-сессия (свой HMAC-формат, без внешних JWT-либ), `POST /api/v1/auth/telegram`, `GET /api/v1/me`
- DEV auth bypass (`{"dev": true}`, работает только при `ALLOW_DEV_AUTH=true`, физически запрещён в production через `env.ts`)
- Security-тесты: подпись initData (валидная/поддельная/просроченная/подменённые поля/отсутствующий hash), сессия (валидная/подменённая/просроченная/битый формат)

## Этап 3 — Core UI — DONE

- Главный экран (лого, кнопка «ЗАПУСТИТЬ», сетка из 6 режимов), bottom navigation
  (Главная/История/Компания/Профиль)
- Профиль по-настоящему подключён к auth из Этапа 2 (`SessionProvider`,
  состояния loading/authenticated/unauthenticated/error)
- Тема: пофикшен баг с нечувствительными к теме CSS-переменными
  (`--color-background/foreground/muted` теперь через `light-dark()`),
  `suppressHydrationWarning` на `<html>` из-за inline-стилей вьюпорта от
  `telegram-web-app.js`
- Loading (skeleton), empty-state и error состояния; `prefers-reduced-motion`
- Страницы-заглушки для режимов (`/who-today`, `/random-pick`, `/debate`,
  `/poll`, `/ai-verdict`) с честным «в разработке», без полу-рабочих кнопок
- Визуально проверено в браузере (light/dark, все роуты, hydration-варнинги устранены)

## Этап 4 — Session domain — DONE

- Generic Prisma-схема: `Session` (enum `SessionType`/`SessionStatus`,
  `publicId` для внешних ссылок), `SessionParticipant`, `Result`.
  `Option`/`Vote` и `Company` сознательно отложены — появятся вместе с
  режимами, которым реально нужны (Этапы 6, 8, 9), чтобы не тащить пустые
  таблицы заранее
- Чистая state machine (`canJoin`/`canStart`/`canClose`/`canEditBeforeStart`)
  и права доступа (`canManageSession`) — отдельно от репозитория, покрыты
  юнит-тестами без БД
- Generic API: `POST /api/v1/sessions`, `GET /api/v1/sessions/:id` (без
  авторизации — публичные результаты по ссылке), `POST /sessions/:id/join`
  (идемпотентный, в транзакции), `POST /sessions/:id/start` (только автор)
- Единый `withApiErrors` враппер для роутов вместо дублирования try/catch
- vote/finalize/react/ai-verdict сознательно не реализованы — появятся в
  соответствующих этапах (5, 9, 11, 13) вместе с самой механикой

## Этап 5 — «Кто сегодня?» — DONE

- `POST /api/v1/sessions/:id/participants` — ручное добавление участников
  создателем (без Telegram-аккаунта у самих участников), только до старта
- `POST /api/v1/sessions/:id/finalize` — идемпотентная финализация: победитель
  вычисляется криптографически стойким `crypto.randomInt` строго на сервере
  до анимации; повторный вызов не пересоздаёт результат (защита от гонки —
  через уникальный индекс `Result.sessionId`, а не блокировки)
- `resolveRoulette` — чистый резолвер, покрыт тестами (победитель всегда из
  списка участников, sanity-check распределения по многим прогонам)
- UI `/who-today`: шаблоны вопроса + свой вариант, участники (добавление/
  удаление), анимация рулетки (с `prefers-reduced-motion` фолбэком —
  показывает результат сразу), экран результата, «Реванш» (новый независимый
  раунд) и «Новый вопрос»
- Сознательно не делал (см. раздел 6 ТЗ): несколько победителей за раз,
  веса участников, «иммунитет», сохранённые шаблоны в БД — это заявленные
  PRO/будущие механики, не MVP

## Этап 6 — «Нам похуй» — DONE

- Модель `Option` (варианты — не люди), `Result.winnerOptionId` — резолвер
  привязывает победителя либо к участнику, либо к варианту в зависимости
  от типа сессии
- `POST /api/v1/sessions/:id/options` — добавление вариантов создателем,
  только до старта, только для `RANDOM_CHOICE` (симметрично `participants`
  теперь тоже проверяет `type === "ROULETTE"`)
- `resolveRandomChoice` — чистый резолвер, тесты аналогичны рулетке
- `finalizeSession` обобщён на диспетчер по типу сессии (`RESOLUTIONS`),
  с типоспецифичными кодами ошибок (`NOT_ENOUGH_PARTICIPANTS` /
  `NOT_ENOUGH_OPTIONS`) вместо одной жёстко зашитой проверки
- UI `/random-pick`: список вариантов, «РЕШАЙ», анимация (карточка вместо
  простого текста — визуально отличается от рулетки), результат, «Повторить»,
  «Убрать «X» и повторить» (реальная логика, не заглушка), «Новый список»
- История (раздел `/history`) осталась на будущий этап статистики — сама
  запись в БД уже есть (Result сохраняется), полноценный список с фильтрами
  появится на Этапе 10

## Этап 7 — Sharing — TODO

- publicId, startapp deep links, share-кнопки, browser result page

## Этап 8 — Компании — TODO

- Создание, приглашения, роли, участники, ролетка компании

## Этап 9 — Голосование (Poll) — TODO

- Создание, голос (один пользователь = один голос), закрытие, результаты

## Этап 10 — История + базовая статистика — TODO

## Этап 11 — AI-архитектура + AI Вердикт — TODO

- `AIProvider` абстракция, безопасность, лимиты

## Этап 12 — Споры + AI-судья — TODO

## Этап 13 — Достижения/реакции — TODO

## Этап 14 — Telegram Stars / PRO — TODO (только после отдельного подтверждения)

---

## Внеплановое дополнение — прототип Telegram-бота (Go)

Помимо этапов выше, добавлен отдельный сервис `bot/` (Go, long polling,
собственный минимальный клиент Bot API) — чтобы прямо сейчас открыть Mini App
в реальном Telegram и проверить, что Этап 1 действительно работает внутри
клиента, а не только в браузере. Полноценная интеграция бота (webhook,
команды меню, deep links в компании/сессии) — по мере прохождения этапов.

## Известные ограничения текущей среды

- В песочнице нет локального Postgres/Docker — миграции (`prisma migrate dev`) всё ещё не прогонялись, только `prisma validate`/`generate`. Модели `User`/`Session`/`SessionParticipant`/`Result` добавлены в схему (Этапы 2 и 4), но реальные запросы к БД не проверялись живьём — сервер честно возвращает 500 (`P1000 AuthenticationFailed`) при попытке подключиться к несуществующему Postgres, что подтверждает: код доходит до слоя БД корректно, дальше нужен реальный инстанс. Поднимите `docker-compose.yml` и выполните `npm run db:migrate` перед реальным использованием auth/session-эндпоинтов.
