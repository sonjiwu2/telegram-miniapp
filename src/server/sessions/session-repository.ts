import "server-only";
import { prisma } from "@/server/db/prisma";
import { Prisma, type SessionType } from "@/generated/prisma/client";
import { canEditBeforeStart, canJoin, canStart } from "./state-machine";
import { canManageSession } from "./permissions";
import { resolveRoulette } from "./resolvers/roulette";
import { ApiError } from "@/server/http/errors";

const sessionWithRelations = { participants: true, result: true } as const;

export interface CreateSessionInput {
  type: SessionType;
  title: string;
  settings?: Prisma.InputJsonObject;
}

export function createSession(creatorId: string, input: CreateSessionInput) {
  return prisma.session.create({
    data: {
      type: input.type,
      title: input.title,
      settings: input.settings ?? {},
      creatorId,
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

// Ручное добавление участников создателем сессии — используется режимами
// вроде «Кто сегодня», где список людей вводится вручную и не обязан
// совпадать с зарегистрированными пользователями Telegram (userId = null).
export function addParticipants(publicId: string, userId: string, displayNames: string[]) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({ where: { publicId } });
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    if (!canManageSession(session, userId)) {
      throw new ApiError(403, "SESSION_FORBIDDEN", "Only the creator can edit participants");
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

const RESOLVERS: Partial<Record<SessionType, (participants: { id: string; displayName: string }[]) => ReturnType<typeof resolveRoulette>>> = {
  ROULETTE: resolveRoulette,
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

  if (session.participants.length < 2) {
    throw new ApiError(409, "NOT_ENOUGH_PARTICIPANTS", "Need at least 2 participants to finalize");
  }

  const resolver = RESOLVERS[session.type];
  if (!resolver) {
    throw new ApiError(501, "FINALIZE_NOT_IMPLEMENTED", `Finalize is not implemented for session type ${session.type}`);
  }

  const resolved = resolver(session.participants);

  try {
    await prisma.result.create({
      data: {
        sessionId: session.id,
        winnerParticipantId: resolved.winnerParticipantId,
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
