import type { User } from "@/generated/prisma/client";
import type { PublicUser } from "@/lib/types/user";

export function serializeUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    photoUrl: user.photoUrl,
  };
}
