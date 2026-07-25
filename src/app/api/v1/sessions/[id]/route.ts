import { NextResponse } from "next/server";
import { getSessionByPublicId } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { ApiError, withApiErrors } from "@/server/http/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const { id } = await params;

    const session = await getSessionByPublicId(id);
    if (!session) {
      throw new ApiError(404, "SESSION_NOT_FOUND", "Session not found");
    }

    return NextResponse.json({ session: serializeSession(session) });
  });
}
