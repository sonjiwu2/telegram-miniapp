import "server-only";
import { prisma } from "@/server/db/prisma";
import { Prisma, type SessionType } from "@/generated/prisma/client";
import { canEditBeforeStart, canJoin, canStart } from "./state-machine";
import { canManageSession } from "./permissions";
import { resolveRoulette } from "./resolvers/roulette";
import { resolveRandomChoice } from "./resolvers/random-choice";
import { resolvePoll } from "./resolvers/poll";
import { resolveAiVerdict } from "./resolvers/ai-verdict";
import { resolveDebateVote, resolveDebateJudge } from "./resolvers/debate";
import { isAiTone, DEFAULT_AI_TONE } from "@/lib/ai/tones";
import { readDebateSettings, computeDebateClosesAt } from "@/lib/sessions/debate-settings";
import { isReactionEmoji } from "@/lib/sessions/reactions";
import type { ResolvedResult } from "./resolvers/types";
import { ApiError } from "@/server/http/errors";

export const sessionWithRelations = {
  participants: true,
  options: true,
  result: true,
  reactions: true,
} as const;

export interface CreateSessionInput {
  type: SessionType;
  title: string;
  settings?: Prisma.InputJsonObject;
  companyId?: string;
}

export async function createSession(creatorId: string, input: CreateSessionInput) {
  if (input.companyId) {
    const membership = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId: input.companyId, userId: creatorId } },
    });
    if (!membership) {
      throw new ApiError(403, "NOT_A_COMPANY_MEMBER", "You must be a member of this company");
    }
  }

  return prisma.session.create({
    data: {
      type: input.type,
      title: input.title,
      settings: input.settings ?? {},
      creatorId,
      companyId: input.companyId,
    },
    include: sessionWithRelations,
  });
}

export function getSessionByPublicId(publicId: string) {
  return prisma.session.findUnique({
    where: { publicId },
    include: sessionWithRelations,
  });
}

export function joinSession(publicId: string, userId: string, displayName: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (!canJoin(session.status)) {
      throw new ApiError(409, "SESSION_NOT_JOINABLE", `Cannot join a session in status ${session.status}`);
    }

    const existing = await tx.sessionParticipant.findUnique({
      where: { sessionId_userId: { sessionId: session.id, userId } },
    });

    if (!existing) {
      await tx.sessionParticipant.create({
        data: { sessionId: session.id, userId, displayName },
      });
    }

    return tx.session.findUniqueOrThrow({
      where: { id: session.id },
      include: sessionWithRelations,
    });
  });
}

export function startSession(publicId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (!canManageSession(session, userId)) {
      throw new ApiError(403, "SESSION_FORBIDDEN", "Only the creator can start this session");
    }

    if (!canStart(session.status)) {
      throw new ApiError(409, "SESSION_ALREADY_STARTED", `Cannot start a session in status ${session.status}`);
    }

    return tx.session.update({
      where: { id: session.id },
      data: { status: "OPEN", startedAt: new Date() },
      include: sessionWithRelations,
    });
  });
}

// Ручное добавление участников создателем сессии — используется режимом
// «Кто сегодня», где список людей вводится вручную и не обязан совпадать
// с зарегистрированными пользователями Telegram (userId = null).
export function addParticipants(publicId: string, userId: string, displayNames: string[]) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (!canManageSession(session, userId)) {
      throw new ApiError(403, "SESSION_FORBIDDEN", "Only the creator can edit participants");
    }

    if (session.type !== "ROULETTE") {
      throw new ApiError(409, "WRONG_SESSION_TYPE", "Participants can only be added to ROULETTE sessions");
    }

    if (!canEditBeforeStart(session.status)) {
      throw new ApiError(409, "SESSION_ALREADY_STARTED", `Cannot edit participants in status ${session.status}`);
    }

    await tx.sessionParticipant.createMany({
      data: displayNames.map((displayName) => ({ sessionId: session.id, displayName })),
    });

    return tx.session.findUniqueOrThrow({
      where: { id: session.id },
      include: sessionWithRelations,
    });
  });
}

// Ручное добавление вариантов создателем сессии — используется режимами
// «Нам похуй» (RANDOM_CHOICE, arguments не передаются) и «Спор» (DEBATE,
// каждой стороне соответствует аргумент по тому же индексу, максимум 6 сторон).
export function addOptions(publicId: string, userId: string, labels: string[], argumentsList?: string[]) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (!canManageSession(session, userId)) {
      throw new ApiError(403, "SESSION_FORBIDDEN", "Only the creator can edit options");
    }

    if (session.type !== "RANDOM_CHOICE" && session.type !== "DEBATE") {
      throw new ApiError(409, "WRONG_SESSION_TYPE", "Options can only be added to RANDOM_CHOICE or DEBATE sessions");
    }

    if (!canEditBeforeStart(session.status)) {
      throw new ApiError(409, "SESSION_ALREADY_STARTED", `Cannot edit options in status ${session.status}`);
    }

    if (session.type === "DEBATE") {
      if (!argumentsList || argumentsList.length !== labels.length) {
        throw new ApiError(400, "INVALID_BODY", "Every debate side needs a name and an argument");
      }
      if (labels.length > 6) {
        throw new ApiError(400, "TOO_MANY_SIDES", "A debate can have at most 6 sides");
      }
    }

    await tx.option.createMany({
      data: labels.map((label, index) => ({
        sessionId: session.id,
        label,
        argument: session.type === "DEBATE" ? argumentsList![index] : undefined,
      })),
    });

    return tx.session.findUniqueOrThrow({
      where: { id: session.id },
      include: sessionWithRelations,
    });
  });
}

// Один голос на пользователя (раздел 9 ТЗ): повторный вызов с другим optionId
// меняет голос (upsert), а не создаёт дубликат — это и есть allowVoteChange
// по умолчанию для MVP. Кто за что голосовал — наружу не отдаётся нигде.
export function castVote(publicId: string, userId: string, optionId: string) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId }, include: { options: true } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (session.type !== "POLL" && session.type !== "DEBATE") {
      throw new ApiError(409, "WRONG_SESSION_TYPE", "Voting is only available for POLL or DEBATE sessions");
    }

    if (session.status !== "OPEN") {
      throw new ApiError(409, "SESSION_NOT_OPEN", `Cannot vote in a session with status ${session.status}`);
    }

    if (session.type === "DEBATE") {
      const { durationMinutes } = readDebateSettings(session.settings);
      const closesAt = computeDebateClosesAt(session.startedAt, durationMinutes);
      if (closesAt && closesAt.getTime() <= Date.now()) {
        throw new ApiError(409, "DEBATE_CLOSED", "Voting time for this debate has run out");
      }
    }

    if (!session.options.some((option) => option.id === optionId)) {
      throw new ApiError(400, "INVALID_OPTION", "This option does not belong to the session");
    }

    await tx.vote.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      create: { sessionId: session.id, optionId, userId },
      update: { optionId },
    });

    return tx.session.findUniqueOrThrow({
      where: { id: session.id },
      include: sessionWithRelations,
    });
  });
}

// Раздел 28 ТЗ: одна активная реакция на пользователя, её можно менять
// (upsert). Доступно на любой уже решённой сессии — не только создателю.
export function castReaction(publicId: string, userId: string, emoji: string) {
  return prisma.$transaction(async (tx) => {
    if (!isReactionEmoji(emoji)) {
      throw new ApiError(400, "INVALID_REACTION", "This emoji is not a supported reaction");
    }

    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (session.status !== "RESOLVED") {
      throw new ApiError(409, "SESSION_NOT_RESOLVED", "Reactions are only available on a resolved session");
    }

    await tx.reaction.upsert({
      where: { sessionId_userId: { sessionId: session.id, userId } },
      create: { sessionId: session.id, userId, emoji },
      update: { emoji },
    });

    return tx.session.findUniqueOrThrow({
      where: { id: session.id },
      include: sessionWithRelations,
    });
  });
}

type SessionForFinalize = Prisma.SessionGetPayload<{ include: typeof sessionWithRelations }>;

interface Resolution {
  // Отсутствует у режимов без "кандидатов" (например, AI Вердикт) — тогда
  // проверка "минимум 2" просто пропускается.
  candidateCount?: number;
  notEnoughCode?: string;
  notEnoughMessage?: string;
  resolve: () => ResolvedResult | Promise<ResolvedResult>;
}

const RESOLUTIONS: Partial<Record<SessionType, (session: SessionForFinalize) => Resolution>> = {
  ROULETTE: (session) => ({
    candidateCount: session.participants.length,
    notEnoughCode: "NOT_ENOUGH_PARTICIPANTS",
    notEnoughMessage: "Need at least 2 participants to finalize",
    resolve: () => resolveRoulette(session.participants),
  }),
  RANDOM_CHOICE: (session) => ({
    candidateCount: session.options.length,
    notEnoughCode: "NOT_ENOUGH_OPTIONS",
    notEnoughMessage: "Need at least 2 options to finalize",
    resolve: () => resolveRandomChoice(session.options),
  }),
  POLL: (session) => ({
    candidateCount: session.options.length,
    notEnoughCode: "NOT_ENOUGH_OPTIONS",
    notEnoughMessage: "Need at least 2 options to finalize",
    resolve: () => resolvePoll(session.id, session.options),
  }),
  AI_VERDICT: (session) => {
    const settings = session.settings as { tone?: unknown } | null;
    const tone = isAiTone(settings?.tone) ? settings.tone : DEFAULT_AI_TONE;
    return {
      resolve: () => resolveAiVerdict(session.creatorId, session.title, tone),
    };
  },
  DEBATE: (session) => {
    const debateSettings = readDebateSettings(session.settings);
    const tone = isAiTone(debateSettings.tone) ? debateSettings.tone : DEFAULT_AI_TONE;
    return {
      candidateCount: session.options.length,
      notEnoughCode: "NOT_ENOUGH_SIDES",
      notEnoughMessage: "Need at least 2 sides to finalize",
      resolve: () =>
        debateSettings.judge === "ai"
          ? resolveDebateJudge(session, tone)
          : resolveDebateVote(session.id, session.options),
    };
  },
};

// Финализация — авторитетный, идемпотентный шаг: результат вычисляется и
// сохраняется на сервере ровно один раз. Повторный вызов просто возвращает
// уже существующий результат, а не пересчитывает его заново.
export async function finalizeSession(publicId: string, userId: string) {
  const session = await prisma.session.findUnique({ where: { publicId }, include: sessionWithRelations });
  if (!session) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
  }

  if (!canManageSession(session, userId)) {
    throw new ApiError(403, "SESSION_FORBIDDEN", "Only the creator can finalize this session");
  }

  if (session.result) {
    return session;
  }

  if (session.status !== "OPEN") {
    throw new ApiError(409, "SESSION_NOT_OPEN", `Cannot finalize a session in status ${session.status}`);
  }

  const buildResolution = RESOLUTIONS[session.type];
  if (!buildResolution) {
    throw new ApiError(501, "FINALIZE_NOT_IMPLEMENTED", `Finalize is not implemented for session type ${session.type}`);
  }

  const resolution = buildResolution(session);
  if (resolution.candidateCount !== undefined && resolution.candidateCount < 2) {
    throw new ApiError(409, resolution.notEnoughCode!, resolution.notEnoughMessage!);
  }

  const resolved = await resolution.resolve();

  try {
    await prisma.result.create({
      data: {
        sessionId: session.id,
        winnerParticipantId: resolved.winnerParticipantId,
        winnerOptionId: resolved.winnerOptionId,
        payload: resolved.payload,
      },
    });
  } catch (error) {
    const isDuplicateResult = error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isDuplicateResult) {
      throw error;
    }
    // Результат уже создан параллельным запросом — это и есть идемпотентность.
  }

  return prisma.session.update({
    where: { id: session.id },
    data: { status: "RESOLVED", closedAt: session.closedAt ?? new Date() },
    include: sessionWithRelations,
  });
}
