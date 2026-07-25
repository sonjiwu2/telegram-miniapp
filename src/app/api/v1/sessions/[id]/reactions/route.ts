import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { castReaction } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { REACTION_EMOJIS } from "@/lib/sessions/reactions";
import { ApiError, withApiErrors } from "@/server/http/errors";

const bodySchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const { id } = await params;

    const json = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      throw new ApiError(400, "INVALID_BODY", "Request body is invalid");
    }

    const session = await castReaction(id, user.id, parsedBody.data.emoji);
    return NextResponse.json({ session: serializeSession(session) });
  });
}
