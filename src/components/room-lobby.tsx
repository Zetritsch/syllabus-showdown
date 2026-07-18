"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { demoPack } from "@/data/demo-pack";
import { gamePackSchema, type GamePack } from "@/lib/game-pack";

type Player = { id: string; name: string; role: "host" | "player"; onlineAt: string };
const colors = ["#ffd84d", "#ff6fae", "#54d9ff", "#9d7cff", "#72f0c5"];

export function RoomLobby({ code, name, isHost }: { code: string; name: string; isHost: boolean }) {
  const router = useRouter();
  const realtimeEnabled = Boolean(getSupabaseBrowserClient());
  const clientId = useMemo(() => crypto.randomUUID(), []);
  const self = useMemo<Player>(() => ({ id: clientId, name, role: isHost ? "host" : "player", onlineAt: new Date().toISOString() }), [clientId, isHost, name]);
  const [players, setPlayers] = useState<Player[]>([self]);
  const [status, setStatus] = useState<"connecting" | "live" | "demo">(realtimeEnabled ? "connecting" : "demo");
  const [copied, setCopied] = useState(false);
  const [roomPack] = useState<GamePack>(() => {
    if (typeof window === "undefined") return demoPack;
    const stored = sessionStorage.getItem(`showdown:pack:${code}`);
    if (!stored) return demoPack;
    try {
      const parsed = gamePackSchema.safeParse(JSON.parse(stored));
      return parsed.success ? parsed.data : demoPack;
    } catch { return demoPack; }
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(`showdown:${code}`, { config: { presence: { key: clientId }, broadcast: { ack: true } } });
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<Player>();
      const online = Object.values(state).flat().map((entry) => ({ id: entry.id, name: entry.name, role: entry.role, onlineAt: entry.onlineAt }));
      setPlayers(online);
    }).on("broadcast", { event: "game-start" }, ({ payload }) => {
      const parsed = gamePackSchema.safeParse(payload.pack);
      if (parsed.success) sessionStorage.setItem(`showdown:pack:${code}`, JSON.stringify(parsed.data));
      router.push(`/demo?room=${code}&role=player&name=${encodeURIComponent(name)}`);
    })
      .subscribe(async (next) => {
        if (next === "SUBSCRIBED") { setStatus("live"); await channel.track(self); }
        if (next === "CHANNEL_ERROR" || next === "TIMED_OUT") setStatus("demo");
      });
    return () => { void channel.untrack(); void supabase.removeChannel(channel); };
  }, [clientId, code, name, router, self]);

  async function start() {
    const supabase = getSupabaseBrowserClient();
    if (supabase && status === "live") {
      const channel = supabase.getChannels().find(item => item.topic.endsWith(`showdown:${code}`));
      await channel?.send({ type: "broadcast", event: "game-start", payload: { at: Date.now(), pack: roomPack } });
    }
    sessionStorage.setItem(`showdown:pack:${code}`, JSON.stringify(roomPack));
    router.push(`/demo?room=${code}&role=${isHost ? "host" : "player"}&name=${encodeURIComponent(name)}`);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(`${location.origin}/room/${code}?name=Player`);
    setCopied(true); setTimeout(()=>setCopied(false), 1600);
  }

  return <main className="min-h-screen bg-[#080a19] px-5 py-8 text-white"><div className="arena-grid"/><div className="relative z-10 mx-auto max-w-5xl"><header className="flex items-center justify-between"><b>SYLLABUS SHOWDOWN</b><span className={`rounded-full px-3 py-1.5 text-xs font-black ${status==="live"?"bg-[#72f0c5]/10 text-[#72f0c5]":"bg-[#ffd84d]/10 text-[#ffd84d]"}`}>{status==="live"?"● REALTIME LIVE":status==="connecting"?"CONNECTING…":"DEMO MODE"}</span></header><section className="py-12 text-center"><p className="text-sm font-black uppercase tracking-[.2em] text-[#8f78ff]">Room code</p><button onClick={copyInvite} className="mt-3 text-5xl font-black tracking-[.18em] text-[#ffd84d] sm:text-7xl">{code}</button><p className="mt-3 text-sm text-white/35">{copied?"Invite link copied!":"Tap code to copy invite link"}</p><h1 className="mt-12 text-3xl font-black sm:text-5xl">Players are entering the arena.</h1><div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">{players.map((player,index)=><div key={player.id} className="rounded-2xl border border-white/10 bg-white/[.055] p-5"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full font-black text-[#101329]" style={{background:colors[index%colors.length]}}>{player.name[0]?.toUpperCase()}</span><p className="mt-3 truncate font-bold">{player.name}</p><p className="text-xs text-white/35">{player.role === "host" ? "Host" : "Ready"}</p></div>)}</div>{status==="demo"&&<p className="mx-auto mt-6 max-w-lg rounded-xl border border-[#ffd84d]/20 bg-[#ffd84d]/8 p-4 text-sm text-[#ffe88a]">Realtime variables are not available in this deployment yet. The lobby remains usable as a single-device demo.</p>}{isHost?<button onClick={start} className="mt-10 rounded-2xl bg-[#ffd84d] px-9 py-4 text-lg font-black text-[#101329]">Start for everyone →</button>:<div className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-6 py-4 text-white/55"><span className="h-2 w-2 animate-pulse rounded-full bg-[#72f0c5]"/>Waiting for the host…</div>}</section></div></main>;
}
