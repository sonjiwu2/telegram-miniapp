import type { CompanyRole } from "@/generated/prisma/client";

// Роли компании — раздел 36 ТЗ. OWNER/ADMIN управляют участниками,
// удалить компанию может только OWNER. MEMBER — обычный участник.
export function canManageMembers(role: CompanyRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canDeleteCompany(role: CompanyRole | null): boolean {
  return role === "OWNER";
}
