import { ShowdownDemo } from "@/components/showdown-demo";

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ room?: string; role?: string }> }) {
  const query = await searchParams;
  const roomCode = query.room?.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return <ShowdownDemo roomCode={roomCode} isHost={query.role === "host"} />;
}
