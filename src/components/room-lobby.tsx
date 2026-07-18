"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { demoPack, demoPackDe } from "@/data/demo-pack";
import { gamePackSchema, type GamePack } from "@/lib/game-pack";
import { useLanguage } from "@/lib/i18n";

type Player = {
  id: string;
  name: string;
  role: "host" | "player";
  onlineAt: string;
};
const colors = ["#ffd84d", "#ff6fae", "#54d9ff", "#9d7cff", "#72f0c5"];

export function RoomLobby({
  code,
  name,
  isHost,
}: {
  code: string;
  name: string;
  isHost: boolean;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const fallbackPack = language === "de" ? demoPackDe : demoPack;
  const realtimeEnabled = Boolean(getSupabaseBrowserClient());
  const clientId = useMemo(() => crypto.randomUUID(), []);
  const self = useMemo<Player>(
    () => ({
      id: clientId,
      name,
      role: isHost ? "host" : "player",
      onlineAt: new Date().toISOString(),
    }),
    [clientId, isHost, name],
  );
  const [players, setPlayers] = useState<Player[]>([self]);
  const [status, setStatus] = useState<"connecting" | "live" | "demo">(
    realtimeEnabled ? "connecting" : "demo",
  );
  const [copied, setCopied] = useState(false);
  const [inviteQr, setInviteQr] = useState("");
  const [roomPack] = useState<GamePack>(() => {
    if (typeof window === "undefined") return fallbackPack;
    const stored = sessionStorage.getItem(`showdown:pack:${code}`);
    if (!stored) return fallbackPack;
    try {
      const parsed = gamePackSchema.safeParse(JSON.parse(stored));
      return parsed.success ? parsed.data : fallbackPack;
    } catch {
      return fallbackPack;
    }
  });

  useEffect(() => {
    const inviteUrl = `${location.origin}/room/${code}?name=Player`;
    void QRCode.toDataURL(inviteUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#101329", light: "#ffffff" },
    }).then(setInviteQr);
  }, [code]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(`showdown:${code}`, {
      config: { presence: { key: clientId }, broadcast: { ack: true } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Player>();
        const online = Object.values(state)
          .flat()
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            role: entry.role,
            onlineAt: entry.onlineAt,
          }));
        setPlayers(online);
      })
      .on("broadcast", { event: "game-start" }, ({ payload }) => {
        const parsed = gamePackSchema.safeParse(payload.pack);
        if (parsed.success)
          sessionStorage.setItem(
            `showdown:pack:${code}`,
            JSON.stringify(parsed.data),
          );
        router.push(
          `/demo?room=${code}&role=player&name=${encodeURIComponent(name)}`,
        );
      })
      .subscribe(async (next) => {
        if (next === "SUBSCRIBED") {
          setStatus("live");
          await channel.track(self);
        }
        if (next === "CHANNEL_ERROR" || next === "TIMED_OUT") setStatus("demo");
      });
    const gameChannel = isHost
      ? null
      : supabase.channel(`game:${code}`, {
          config: { broadcast: { ack: true, self: false } },
        });
    gameChannel
      ?.on("broadcast", { event: "state-sync" }, ({ payload }) => {
        if (payload.targetId !== clientId) return;
        const parsed = gamePackSchema.safeParse(payload.pack);
        if (!parsed.success) return;
        sessionStorage.setItem(
          `showdown:pack:${code}`,
          JSON.stringify(parsed.data),
        );
        sessionStorage.setItem(
          `showdown:player:${code}:${name}:state`,
          JSON.stringify({
            score: 0,
            answeredRound: -1,
            roundIndex: Number(payload.roundIndex) || 0,
            phase: "question",
          }),
        );
        router.push(
          `/demo?room=${code}&role=player&name=${encodeURIComponent(name)}`,
        );
      })
      .subscribe(async (next) => {
        if (next === "SUBSCRIBED")
          await gameChannel.send({
            type: "broadcast",
            event: "state-request",
            payload: { clientId },
          });
      });
    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
      if (gameChannel) void supabase.removeChannel(gameChannel);
    };
  }, [clientId, code, isHost, name, router, self]);

  async function start() {
    const supabase = getSupabaseBrowserClient();
    if (supabase && status === "live") {
      const channel = supabase
        .getChannels()
        .find((item) => item.topic.endsWith(`showdown:${code}`));
      await channel?.send({
        type: "broadcast",
        event: "game-start",
        payload: { at: Date.now(), pack: roomPack },
      });
    }
    sessionStorage.setItem(`showdown:pack:${code}`, JSON.stringify(roomPack));
    router.push(
      `/demo?room=${code}&role=${isHost ? "host" : "player"}&name=${encodeURIComponent(name)}`,
    );
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(
      `${location.origin}/room/${code}?name=Player`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[#080a19] px-5 py-8 text-white">
      <div className="arena-grid" />
      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <b>SYLLABUS SHOWDOWN</b>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <span
              className={`hidden rounded-full px-3 py-1.5 text-xs font-black sm:inline-flex ${status === "live" ? "bg-[#72f0c5]/10 text-[#72f0c5]" : "bg-[#ffd84d]/10 text-[#ffd84d]"}`}
            >
              {status === "live"
                ? "● REALTIME LIVE"
                : status === "connecting"
                  ? language === "de"
                    ? "VERBINDE…"
                    : "CONNECTING…"
                  : language === "de"
                    ? "DEMO-MODUS"
                    : "DEMO MODE"}
            </span>
          </div>
        </header>
        <section className="py-12 text-center">
          <p className="text-sm font-black uppercase tracking-[.2em] text-[#8f78ff]">
            {language === "de" ? "Raumcode" : "Room code"}
          </p>
          <button
            onClick={copyInvite}
            className="mt-3 text-5xl font-black tracking-[.18em] text-[#ffd84d] sm:text-7xl"
          >
            {code}
          </button>
          <p className="mt-3 text-sm text-white/35">
            {copied
              ? language === "de"
                ? "Einladungslink kopiert!"
                : "Invite link copied!"
              : language === "de"
                ? "Code antippen, um den Link zu kopieren"
                : "Tap code to copy invite link"}
          </p>
          {inviteQr && (
            <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3 shadow-[0_0_50px_rgba(84,217,255,.18)]">
              {/* Generated locally from the current room URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inviteQr}
                alt={
                  language === "de" ? "QR-Code zum Raum" : "Room invite QR code"
                }
                className="h-40 w-40 sm:h-48 sm:w-48"
              />
            </div>
          )}
          <p className="mt-3 text-xs font-bold text-[#9feaff]">
            {language === "de"
              ? "Mit dem Smartphone scannen und sofort beitreten"
              : "Scan with a phone to join instantly"}
          </p>
          <h1 className="mt-12 text-3xl font-black sm:text-5xl">
            {language === "de"
              ? "Die Spieler betreten die Arena."
              : "Players are entering the arena."}
          </h1>
          <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="rounded-2xl border border-white/10 bg-white/[.055] p-5"
              >
                <span
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full font-black text-[#101329]"
                  style={{ background: colors[index % colors.length] }}
                >
                  {player.name[0]?.toUpperCase()}
                </span>
                <p className="mt-3 truncate font-bold">{player.name}</p>
                <p className="text-xs text-white/35">
                  {player.role === "host"
                    ? "Host"
                    : language === "de"
                      ? "Bereit"
                      : "Ready"}
                </p>
              </div>
            ))}
          </div>
          {status === "demo" && (
            <p className="mx-auto mt-6 max-w-lg rounded-xl border border-[#ffd84d]/20 bg-[#ffd84d]/8 p-4 text-sm text-[#ffe88a]">
              {language === "de"
                ? "Realtime ist in diesem Deployment nicht verfügbar. Die Lobby bleibt als Einzelgeräte-Demo nutzbar."
                : "Realtime variables are not available in this deployment yet. The lobby remains usable as a single-device demo."}
            </p>
          )}
          {isHost ? (
            <button
              onClick={start}
              className="mt-10 rounded-2xl bg-[#ffd84d] px-9 py-4 text-lg font-black text-[#101329]"
            >
              {language === "de"
                ? "Für alle starten →"
                : "Start for everyone →"}
            </button>
          ) : (
            <div className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-6 py-4 text-white/55">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#72f0c5]" />
              {language === "de"
                ? "Warte auf den Host…"
                : "Waiting for the host…"}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
