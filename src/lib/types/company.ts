export interface PublicCompanyMember {
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  displayName: string;
  nickname: string | null;
  joinedAt: string;
}

export interface PublicCompany {
  id: string;
  name: string;
  emoji: string | null;
  ownerId: string;
  members: PublicCompanyMember[];
  createdAt: string;
}
