import "server-only";
import { prisma } from "@/server/db/prisma";
import type { SessionType, Prisma } from "@/generated/prisma/client";
import { canJoin, canStart } from "./state-machine";
import { canManageSession } from "./permissions";
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
