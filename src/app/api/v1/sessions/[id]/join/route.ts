import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { joinSession } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { withApiErrors } from "@/server/http/errors";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const { id } = await params;

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.firstName;
    const session = await joinSession(id, user.id, displayName);

    return NextResponse.json({ session: serializeSession(session) });
  });
}
