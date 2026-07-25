export interface PublicSessionParticipant {
  id: string;
  userId: string | null;
  displayName: string;
}

export interface PublicResult {
  winnerParticipantId: string | null;
  payload: unknown;
  createdAt: string;
}

export interface PublicSession {
  id: string;
  type: string;
  status: string;
  title: string;
  settings: unknown;
  creatorId: string;
  participants: PublicSessionParticipant[];
  result: PublicResult | null;
  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;
}
