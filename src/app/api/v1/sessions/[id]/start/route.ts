import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { startSession } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { withApiErrors } from "@/server/http/errors";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const { id } = await params;

    const session = await startSession(id, user.id);

    return NextResponse.json({ session: serializeSession(session) });
  });
}
