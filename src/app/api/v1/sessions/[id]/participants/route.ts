import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { addParticipants } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { ApiError, withApiErrors } from "@/server/http/errors";

const bodySchema = z.object({
  displayNames: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
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

    const session = await addParticipants(id, user.id, parsedBody.data.displayNames);
    return NextResponse.json({ session: serializeSession(session) });
  });
}
