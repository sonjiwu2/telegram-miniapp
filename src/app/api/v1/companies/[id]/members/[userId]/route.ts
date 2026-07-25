import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { removeMember } from "@/server/companies/company-repository";
import { serializeCompany } from "@/server/companies/serialize-company";
import { withApiErrors } from "@/server/http/errors";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const { id, userId } = await params;

    const company = await removeMember(id, user.id, userId);
    return NextResponse.json({ company: serializeCompany(company) });
  });
}
