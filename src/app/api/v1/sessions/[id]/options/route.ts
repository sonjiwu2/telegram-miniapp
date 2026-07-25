import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { addOptions } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { ApiError, withApiErrors } from "@/server/http/errors";

const bodySchema = z.object({
  labels: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  // Только для DEBATE: аргумент каждой стороны, по тому же индексу что и labels.
  arguments: z.array(z.string().trim().min(1).max(280)).min(1).max(6).optional(),
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

    const session = await addOptions(id, user.id, parsedBody.data.labels, parsedBody.data.arguments);
    return NextResponse.json({ session: serializeSession(session) });
  });
}
