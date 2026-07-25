import { NextResponse } from "next/server";
import { getCompanyById } from "@/server/companies/company-repository";
import { serializeCompany } from "@/server/companies/serialize-company";
import { ApiError, withApiErrors } from "@/server/http/errors";

// Публично по ссылке (как и сессии) — это одновременно и превью приглашения
// («Вас приглашают в компанию: ГАРАЖ»), и домашняя страница для участников.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiErrors(async () => {
    const { id } = await params;

    const company = await getCompanyById(id);
    if (!company) {
      throw new ApiError(404, "COMPANY_NOT_FOUND", "Company not found");
    }

    return NextResponse.json({ company: serializeCompany(company) });
  });
}
