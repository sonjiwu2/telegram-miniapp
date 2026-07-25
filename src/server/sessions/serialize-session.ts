import type { Session, SessionParticipant, Option, Result } from "@/generated/prisma/client";
import type { PublicSession } from "@/lib/types/session";

type SessionWithRelations = Session & {
  participants: SessionParticipant[];
  options: Option[];
  result: Result | null;
};

// "id" наружу — это всегда publicId. Внутренний cuid (Session.id) на клиент не уходит.
export function serializeSession(session: SessionWithRelations): PublicSession {
  return {
    id: session.publicId,
    type: session.type,
    status: session.status,
    title: session.title,
    settings: session.settings,
    creatorId: session.creatorId,
    participants: session.participants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      displayName: participant.displayName,
    })),
    options: session.options.map((option) => ({
      id: option.id,
      label: option.label,
      argument: option.argument,
    })),
    result: session.result
      ? {
          winnerParticipantId: session.result.winnerParticipantId,
          winnerOptionId: session.result.winnerOptionId,
          payload: session.result.payload,
          createdAt: session.result.createdAt.toISOString(),
        }
      : null,
    createdAt: session.createdAt.toISOString(),
    startedAt: session.startedAt ? session.startedAt.toISOString() : null,
    closedAt: session.closedAt ? session.closedAt.toISOString() : null,
  };
}
