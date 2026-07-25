import type { Company, CompanyMember, User } from "@/generated/prisma/client";
import type { PublicCompany } from "@/lib/types/company";

type CompanyWithMembers = Company & {
  members: (CompanyMember & { user: User })[];
};

export function serializeCompany(company: CompanyWithMembers): PublicCompany {
  return {
    id: company.id,
    name: company.name,
    emoji: company.emoji,
    ownerId: company.ownerId,
    members: company.members.map((member) => ({
      userId: member.userId,
      role: member.role,
      displayName: [member.user.firstName, member.user.lastName].filter(Boolean).join(" "),
      nickname: member.nickname,
      joinedAt: member.joinedAt.toISOString(),
    })),
    createdAt: company.createdAt.toISOString(),
  };
}
