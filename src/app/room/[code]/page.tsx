import { RoomLobby } from "@/components/room-lobby";

export default async function RoomPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ role?: string; name?: string }> }) {
  const { code } = await params;
  const query = await searchParams;
  return <RoomLobby code={code.toUpperCase().slice(0, 6)} name={(query.name || "Player").slice(0, 20)} isHost={query.role === "host"} />;
}
