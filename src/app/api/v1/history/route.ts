import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SessionType } from "@/generated/prisma/client";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { getUserHistory } from "@/server/sessions/history-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { ApiError, withApiErrors } from "@/server/http/errors";

const querySchema = z.object({
  type: z.enum(SessionType).optional(),
  mine: z.enum(["true", "false"]).optional(),
});

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();

    const { searchParams } = new URL(request.url);
    const parsedQuery = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsedQuery.success) {
      throw new ApiError(400, "INVALID_QUERY", "Query parameters are invalid");
    }

    const sessions = await getUserHistory(user.id, {
      type: parsedQuery.data.type,
      mineOnly: parsedQuery.data.mine === "true",
    });

    return NextResponse.json({ sessions: sessions.map(serializeSession) });
  });
}
