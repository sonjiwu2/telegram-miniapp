import "server-only";
import { prisma } from "@/server/db/prisma";
import { canManageMembers } from "./permissions";
import { ApiError } from "@/server/http/errors";

const companyWithMembers = {
  members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
} as const;

export interface CreateCompanyInput {
  name: string;
  emoji?: string;
}

export function createCompany(ownerId: string, input: CreateCompanyInput) {
  return prisma.company.create({
    data: {
      name: input.name,
      emoji: input.emoji,
      ownerId,
      members: {
        create: { userId: ownerId, role: "OWNER" },
      },
    },
    include: companyWithMembers,
  });
}

export function getCompanyById(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: companyWithMembers,
  });
}

export function listMyCompanies(userId: string) {
  return prisma.company.findMany({
    where: { members: { some: { userId } } },
    include: companyWithMembers,
    orderBy: { createdAt: "asc" },
  });
}

// Явное вступление — никого не добавляем в компанию автоматически (раздел 18 ТЗ).
export function joinCompany(companyId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new ApiError(404, "COMPANY_NOT_FOUND", "Company not found");
    }

    const existing = await tx.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });

    if (!existing) {
      await tx.companyMember.create({
        data: { companyId, userId, role: "MEMBER" },
      });
    }

    return tx.company.findUniqueOrThrow({
      where: { id: companyId },
      include: companyWithMembers,
    });
  });
}

export function removeMember(companyId: string, actingUserId: string, targetUserId: string) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new ApiError(404, "COMPANY_NOT_FOUND", "Company not found");
    }

    const actingMember = await tx.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId: actingUserId } },
    });

    if (!canManageMembers(actingMember?.role ?? null)) {
      throw new ApiError(403, "COMPANY_FORBIDDEN", "Only the owner or an admin can remove members");
    }

    if (targetUserId === company.ownerId) {
      throw new ApiError(409, "CANNOT_REMOVE_OWNER", "The owner cannot be removed from the company");
    }

    await tx.companyMember.deleteMany({ where: { companyId, userId: targetUserId } });

    return tx.company.findUniqueOrThrow({
      where: { id: companyId },
      include: companyWithMembers,
    });
  });
}
