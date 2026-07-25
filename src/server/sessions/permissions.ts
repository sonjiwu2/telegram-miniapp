// Права на сессию. Пока нет компаний (Этап 8) — только автор может управлять
// своей сессией. Роли компании (OWNER/ADMIN/MEMBER) добавятся сюда позже,
// не меняя сигнатуру canManageSession для вызывающего кода.

export interface SessionOwnership {
  creatorId: string;
}

export function canManageSession(session: SessionOwnership, userId: string): boolean {
  return session.creatorId === userId;
}
