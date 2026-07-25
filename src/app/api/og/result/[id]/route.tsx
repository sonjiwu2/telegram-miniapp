import { ImageResponse } from "next/og";
import { getSessionByPublicId } from "@/server/sessions/session-repository";
import { serializeSession } from "@/server/sessions/serialize-session";
import { getWinnerLabel } from "@/lib/sessions/get-winner-label";

// Не edge — нужен доступ к Prisma (pg driver adapter, обычный Node.js).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await getSessionByPublicId(id);
  const session = raw ? serializeSession(raw) : null;
  const winnerLabel = session ? getWinnerLabel(session) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0b0f",
          color: "#f5f5f7",
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1, display: "flex" }}>RESHALA</div>
        {winnerLabel ? (
          <div style={{ fontSize: 72, fontWeight: 800, marginTop: 24, display: "flex" }}>{winnerLabel}</div>
        ) : (
          <div style={{ fontSize: 36, color: "#9a9aa5", marginTop: 24, display: "flex" }}>
            Решала ещё думает
          </div>
        )}
        {session ? (
          <div
            style={{
              fontSize: 28,
              color: "#9a9aa5",
              marginTop: 16,
              maxWidth: 900,
              textAlign: "center",
              display: "flex",
            }}
          >
            {session.title}
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
