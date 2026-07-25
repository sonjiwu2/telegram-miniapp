import { SharedSessionView } from "./shared-session-view";

export default async function SharedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SharedSessionView id={id} />;
}
