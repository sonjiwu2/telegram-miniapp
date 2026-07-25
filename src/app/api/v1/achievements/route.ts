import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { getAchievementCounts } from "@/server/achievements/achievement-repository";
import { evaluateAchievements } from "@/lib/achievements/evaluate";
import { withApiErrors } from "@/server/http/errors";

export async function GET() {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const counts = await getAchievementCounts(user.id);
    return NextResponse.json({ achievements: evaluateAchievements(counts) });
  });
}
