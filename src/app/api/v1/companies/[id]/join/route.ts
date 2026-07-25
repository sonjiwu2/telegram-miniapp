import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { joinCompany } from "@/server/companies/company-repository";
import { serializeCompany } from "@/server/companies/serialize-company";
import { withApiErrors } from "@/server/http/errors";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const { id } = await params;

    const company = await joinCompany(id, user.id);
    return NextResponse.json({ company: serializeCompany(company) });
  });
}
