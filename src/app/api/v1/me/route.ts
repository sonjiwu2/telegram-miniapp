import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/auth/get-session-user";
import { serializeUser } from "@/server/auth/serialize-user";
import { ApiError, errorResponse } from "@/server/http/errors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return errorResponse(new ApiError(401, "UNAUTHENTICATED", "No active session"));
  }

  return NextResponse.json({ user: serializeUser(user) });
}
