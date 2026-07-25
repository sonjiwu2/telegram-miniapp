import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { getUserStats } from "@/server/stats/stats-repository";
import { withApiErrors } from "@/server/http/errors";

export async function GET() {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const stats = await getUserStats(user.id);
    return NextResponse.json({ stats });
  });
}
