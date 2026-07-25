import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSessionUser } from "@/server/auth/get-session-user";
import { createCompany, listMyCompanies } from "@/server/companies/company-repository";
import { serializeCompany } from "@/server/companies/serialize-company";
import { ApiError, withApiErrors } from "@/server/http/errors";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  emoji: z.string().trim().max(8).optional(),
});

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    const user = await requireSessionUser();

    const json = await request.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(json);
    if (!parsedBody.success) {
      throw new ApiError(400, "INVALID_BODY", "Request body is invalid");
    }

    const company = await createCompany(user.id, parsedBody.data);
    return NextResponse.json({ company: serializeCompany(company) }, { status: 201 });
  });
}

// Список компаний текущего пользователя — нужен, чтобы вкладка «Компания»
// могла показать уже существующие, не дожидаясь отдельного flow приглашений.
export async function GET() {
  return withApiErrors(async () => {
    const user = await requireSessionUser();
    const companies = await listMyCompanies(user.id);
    return NextResponse.json({ companies: companies.map(serializeCompany) });
  });
}
