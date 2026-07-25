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

## Этап 2 — Telegram auth — TODO

- Валидация Telegram initData (HMAC) на сервере
- Модель `User`, создание/обновление по Telegram ID
- Auth-слой (сессия), `/api/v1/me`
- DEV auth bypass (только вне production)
- Security-тесты (валидная/просроченная/поддельная подпись)

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

## Известные ограничения текущей среды

- В песочнице нет локального Postgres/Docker — миграции (`prisma migrate dev`) не прогонялись, только `prisma validate`/`generate`. Поднимите `docker-compose.yml` и выполните миграцию перед Этапом 2 (там появится первая модель `User`).
