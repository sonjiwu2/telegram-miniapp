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

## Этап 3 — Core UI — TODO

- Главный экран, bottom navigation, профиль
- Синхронизация с Telegram theme params
- Loading/empty/error состояния

## Этап 4 — Session domain — TODO

- Полная Prisma-схема (Session, Participant, Option, Vote, Result…)
- Session service, permissions, generic API `/api/v1/sessions`

## Этап 5 — «Кто сегодня?» — TODO

- Создание, участники, secure random результат, анимация, реванш

## Этап 6 — «Нам похуй» — TODO

- Варианты, случайный выбор, история, повтор

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

- В песочнице нет локального Postgres/Docker — миграции (`prisma migrate dev`) всё ещё не прогонялись, только `prisma validate`/`generate`. Модель `User` добавлена в схему на Этапе 2, но реальный `upsert` в БД не проверялся живым запросом — только логика валидации initData/сессии (юнит-тесты + curl без БД). Поднимите `docker-compose.yml` и выполните `npm run db:migrate` перед реальным использованием auth-эндпоинтов.
