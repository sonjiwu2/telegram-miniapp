export interface PublicSessionParticipant {
  id: string;
  userId: string | null;
  displayName: string;
}

export interface PublicSessionOption {
  id: string;
  label: string;
  argument: string | null;
}

export interface PublicReactionCount {
  emoji: string;
  count: number;
}

export interface PublicResult {
  winnerParticipantId: string | null;
  winnerOptionId: string | null;
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
  options: PublicSessionOption[];
  result: PublicResult | null;
  reactions: PublicReactionCount[];
  createdAt: string;
  startedAt: string | null;
  closedAt: string | null;
}
