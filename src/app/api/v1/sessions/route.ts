import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SessionType, type Prisma } from "@/generated/prisma/client";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { createSession } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { ApiError, withApiErrors } from "@/server/http/errors";

const bodySchema = z.object({
  type: z.enum(SessionType),
  title: z.string().trim().min(1).max(200),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();

    const json = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      throw new ApiError(400, "INVALID_BODY", "Request body is invalid");
    }

    const { type, title, settings } = parsedBody.data;
    const session = await createSession(user.id, {
      type,
      title,
      settings: settings as Prisma.InputJsonObject | undefined,
    });
    return NextResponse.json({ session: serializeSession(session) }, { status: 201 });
  });
}
