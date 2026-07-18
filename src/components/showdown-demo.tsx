"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { demoPack } from "@/data/demo-pack";
import { gamePackSchema, type GamePack, type GameRound } from "@/lib/game-pack";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Phase = "lobby" | "question" | "result" | "remediation" | "podium";
type ConnectionPair = { leftId: string; rightId: string };
type HotspotPoint = { x: number; y: number };
const demoPlayers = [
  { name: "Maya", score: 2240, color: "#ff6fae" },
  { name: "You", score: 1980, color: "#ffd84d" },
  { name: "Leo", score: 1740, color: "#54d9ff" },
  { name: "Noor", score: 1510, color: "#9d7cff" },
];

type LivePlayer = {
  id: string;
  name: string;
  score: number;
  answeredRound: number;
  role: "host" | "player";
};

export function ShowdownDemo({
  pack = demoPack,
  roomCode,
  isHost = true,
  playerName = "You",
}: {
  pack?: GamePack;
  roomCode?: string;
  isHost?: boolean;
  playerName?: string;
}) {
  const playerStorageKey = `showdown:player:${roomCode || "solo"}:${playerName}`;
  const [clientId] = useState(() => {
    if (typeof window === "undefined") return "server-player";
    const existing = sessionStorage.getItem(`${playerStorageKey}:id`);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(`${playerStorageKey}:id`, created);
    return created;
  });
  const [activePack, setActivePack] = useState(pack);
  const [phase, setPhase] = useState<Phase>(roomCode ? "question" : "lobby");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(roomCode ? 0 : 1980);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(2);
  const [sequence, setSequence] = useState<string[]>([]);
  const [connections, setConnections] = useState<ConnectionPair[]>([]);
  const [activeConnectionLeft, setActiveConnectionLeft] = useState<
    string | null
  >(null);
  const [visualPlacements, setVisualPlacements] = useState<
    Record<string, string>
  >({});
  const [activeVisualLabel, setActiveVisualLabel] = useState<string | null>(
    null,
  );
  const [sortAssignments, setSortAssignments] = useState<
    Record<string, string>
  >({});
  const [activeSortItem, setActiveSortItem] = useState<string | null>(null);
  const [hotspotPoint, setHotspotPoint] = useState<HotspotPoint | null>(null);
  const [roomLive, setRoomLive] = useState(false);
  const [answeredRound, setAnsweredRound] = useState(-1);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const gameStateRef = useRef({ roundIndex, phase, pack: activePack });
  const round = activePack.rounds[roundIndex];

  useEffect(() => {
    gameStateRef.current = { roundIndex, phase, pack: activePack };
  }, [activePack, phase, roundIndex]);

  useEffect(() => {
    if (!roomCode) return;
    const stored = sessionStorage.getItem(`showdown:pack:${roomCode}`);
    if (!stored) return;
    try {
      const parsed = gamePackSchema.safeParse(JSON.parse(stored));
      if (parsed.success) queueMicrotask(() => setActivePack(parsed.data));
    } catch {
      /* keep deterministic fallback */
    }
    const saved = sessionStorage.getItem(`${playerStorageKey}:state`);
    if (saved) {
      try {
        const state = JSON.parse(saved) as {
          score?: number;
          answeredRound?: number;
          roundIndex?: number;
          phase?: Phase;
        };
        queueMicrotask(() => {
          if (Number.isFinite(state.score)) setScore(Number(state.score));
          if (Number.isInteger(state.answeredRound))
            setAnsweredRound(Number(state.answeredRound));
          if (
            Number.isInteger(state.roundIndex) &&
            Number(state.roundIndex) >= 0 &&
            Number(state.roundIndex) < activePack.rounds.length
          )
            setRoundIndex(Number(state.roundIndex));
          if (
            state.phase &&
            ["question", "result", "podium"].includes(state.phase)
          )
            setPhase(state.phase);
        });
      } catch {
        /* ignore stale recovery data */
      }
    }
  }, [activePack.rounds.length, playerStorageKey, roomCode]);

  useEffect(() => {
    if (!roomCode) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(`game:${roomCode}`, {
      config: {
        presence: { key: clientId },
        broadcast: { ack: true, self: false },
      },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<LivePlayer>();
        setLivePlayers(
          Object.values(state)
            .flat()
            .map((entry) => ({
              id: entry.id,
              name: entry.name,
              score: entry.score,
              answeredRound: entry.answeredRound,
              role: entry.role,
            })),
        );
      })
      .on("broadcast", { event: "round-change" }, ({ payload }) => {
        const next = Number(payload.roundIndex);
        if (
          !Number.isInteger(next) ||
          next < 0 ||
          next >= activePack.rounds.length
        )
          return;
        setRoundIndex(next);
        setAnsweredRound(-1);
        setSelected(null);
        setSequence([]);
        setConnections([]);
        setActiveConnectionLeft(null);
        setVisualPlacements({});
        setActiveVisualLabel(null);
        setSortAssignments({});
        setActiveSortItem(null);
        setHotspotPoint(null);
        setPhase("question");
      })
      .on("broadcast", { event: "state-request" }, async ({ payload }) => {
        if (!isHost) return;
        const current = gameStateRef.current;
        await channel.send({
          type: "broadcast",
          event: "state-sync",
          payload: {
            targetId: payload.clientId,
            pack: current.pack,
            roundIndex: current.roundIndex,
          },
        });
      })
      .on("broadcast", { event: "state-sync" }, ({ payload }) => {
        if (payload.targetId !== clientId) return;
        const parsed = gamePackSchema.safeParse(payload.pack);
        const next = Number(payload.roundIndex);
        if (parsed.success) {
          sessionStorage.setItem(
            `showdown:pack:${roomCode}`,
            JSON.stringify(parsed.data),
          );
          setActivePack(parsed.data);
        }
        if (
          Number.isInteger(next) &&
          next >= 0 &&
          next <
            (parsed.success
              ? parsed.data.rounds.length
              : activePack.rounds.length)
        ) {
          setRoundIndex(next);
          setSelected(null);
          setSequence([]);
          setConnections([]);
          setActiveConnectionLeft(null);
          setVisualPlacements({});
          setActiveVisualLabel(null);
          setSortAssignments({});
          setActiveSortItem(null);
          setHotspotPoint(null);
          setPhase("question");
        }
      })
      .on("broadcast", { event: "game-finish" }, () => setPhase("podium"))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setRoomLive(true);
          await channel.track({
            id: clientId,
            name: playerName,
            score: 0,
            answeredRound: -1,
            role: isHost ? "host" : "player",
          });
          if (!isHost)
            await channel.send({
              type: "broadcast",
              event: "state-request",
              payload: { clientId },
            });
        }
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [activePack.rounds.length, clientId, isHost, playerName, roomCode]);

  useEffect(() => {
    if (!roomLive) return;
    void channelRef.current?.track({
      id: clientId,
      name: playerName,
      score,
      answeredRound,
      role: isHost ? "host" : "player",
    });
  }, [answeredRound, clientId, isHost, playerName, roomLive, score]);

  useEffect(() => {
    if (!roomCode) return;
    sessionStorage.setItem(
      `${playerStorageKey}:state`,
      JSON.stringify({ score, answeredRound, roundIndex, phase }),
    );
    if (isHost)
      sessionStorage.setItem(
        `showdown:host-state:${roomCode}`,
        JSON.stringify({ roundIndex, phase }),
      );
  }, [
    answeredRound,
    isHost,
    phase,
    playerStorageKey,
    roomCode,
    roundIndex,
    score,
  ]);

  const correct = useMemo(() => {
    if (round.type === "sequence")
      return sequence.join("|") === round.correctOrder.join("|");
    if (round.type === "connection") {
      const answerKey = new Set(
        round.correctPairs.map((pair) => `${pair.leftId}:${pair.rightId}`),
      );
      return (
        connections.length === round.correctPairs.length &&
        connections.every((pair) =>
          answerKey.has(`${pair.leftId}:${pair.rightId}`),
        )
      );
    }
    if (round.type === "visual-map")
      return round.zones.every(
        (zone) => visualPlacements[zone.id] === zone.answerId,
      );
    if (round.type === "sort")
      return round.correctAssignments.every(
        (assignment) =>
          sortAssignments[assignment.itemId] === assignment.bucketId,
      );
    if (round.type === "hotspot") {
      if (!hotspotPoint) return false;
      const distance = Math.hypot(
        hotspotPoint.x - round.target.x,
        hotspotPoint.y - round.target.y,
      );
      return distance <= round.target.radius;
    }
    return selected === round.correctOptionId;
  }, [
    connections,
    round,
    selected,
    sequence,
    sortAssignments,
    hotspotPoint,
    visualPlacements,
  ]);

  function chooseSequence(id: string) {
    if (phase !== "question") return;
    setSequence((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function chooseConnectionLeft(id: string) {
    if (phase !== "question") return;
    setConnections((current) => current.filter((pair) => pair.leftId !== id));
    setActiveConnectionLeft(id);
  }

  function chooseConnectionRight(id: string) {
    if (phase !== "question" || !activeConnectionLeft) return;
    setConnections((current) => [
      ...current.filter(
        (pair) => pair.leftId !== activeConnectionLeft && pair.rightId !== id,
      ),
      { leftId: activeConnectionLeft, rightId: id },
    ]);
    setActiveConnectionLeft(null);
  }

  function chooseVisualLabel(id: string) {
    if (phase !== "question") return;
    setVisualPlacements((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([, labelId]) => labelId !== id),
      ),
    );
    setActiveVisualLabel(id);
  }

  function chooseVisualZone(zoneId: string) {
    if (phase !== "question" || !activeVisualLabel) return;
    setVisualPlacements((current) => ({
      ...current,
      [zoneId]: activeVisualLabel,
    }));
    setActiveVisualLabel(null);
  }

  function chooseSortItem(itemId: string) {
    if (phase !== "question") return;
    setActiveSortItem(itemId);
  }

  function chooseSortBucket(bucketId: string) {
    if (phase !== "question" || !activeSortItem) return;
    assignSortItem(activeSortItem, bucketId);
  }

  function assignSortItem(itemId: string, bucketId: string) {
    if (phase !== "question") return;
    setSortAssignments((current) => ({
      ...current,
      [itemId]: bucketId,
    }));
    setActiveSortItem(null);
  }

  function submit() {
    const answered =
      round.type === "sequence"
        ? sequence.length === round.items.length
        : round.type === "connection"
          ? connections.length === round.leftItems.length
          : round.type === "visual-map"
            ? Object.keys(visualPlacements).length === round.zones.length
            : round.type === "sort"
              ? Object.keys(sortAssignments).length === round.items.length
              : round.type === "hotspot"
                ? hotspotPoint !== null
                : selected !== null;
    if (!answered) return;
    if (correct)
      setScore(
        (value) =>
          value +
          Math.round(
            round.points * (round.type === "confidence" ? confidence / 3 : 0.7),
          ),
      );
    setAnsweredRound(roundIndex);
    setPhase("result");
  }

  async function advance() {
    if (roomCode && !isHost) return;
    if (
      !roomCode &&
      round.type === "confidence" &&
      !correct &&
      confidence === 3 &&
      selected === round.misconceptionOptionId
    ) {
      setSelected(null);
      setPhase("remediation");
      return;
    }
    if (roundIndex === activePack.rounds.length - 1) {
      if (roomCode)
        await channelRef.current?.send({
          type: "broadcast",
          event: "game-finish",
          payload: {},
        });
      setPhase("podium");
    } else {
      const nextRound = roundIndex + 1;
      if (roomCode)
        await channelRef.current?.send({
          type: "broadcast",
          event: "round-change",
          payload: { roundIndex: nextRound },
        });
      setRoundIndex(nextRound);
      setAnsweredRound(-1);
      setSelected(null);
      setSequence([]);
      setConnections([]);
      setActiveConnectionLeft(null);
      setVisualPlacements({});
      setActiveVisualLabel(null);
      setSortAssignments({});
      setActiveSortItem(null);
      setHotspotPoint(null);
      setPhase("question");
    }
  }

  function reset() {
    setPhase("lobby");
    setRoundIndex(0);
    setScore(1980);
    setSelected(null);
    setSequence([]);
    setConnections([]);
    setActiveConnectionLeft(null);
    setVisualPlacements({});
    setActiveVisualLabel(null);
    setSortAssignments({});
    setActiveSortItem(null);
    setHotspotPoint(null);
    setConfidence(2);
  }

  if (phase === "podium")
    return (
      <Podium
        score={score}
        reset={reset}
        livePlayers={roomCode ? livePlayers : undefined}
        playerName={playerName}
      />
    );

  return (
    <main className="min-h-screen bg-[#080a19] text-white">
      <div className="arena-grid" />
      <header className="relative z-10 flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-black">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffd84d] text-[#111329]">
            S
          </span>
          <span className="hidden sm:inline">SYLLABUS SHOWDOWN</span>
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${roomCode ? "bg-[#54d9ff]/10 text-[#9feaff]" : "bg-[#72f0c5]/10 text-[#72f0c5]"}`}
          >
            ●{" "}
            {roomCode
              ? `${roomLive ? "ROOM" : "LINKING"} ${roomCode}`
              : "LIVE DEMO"}
          </span>
          <span className="font-black text-[#ffd84d]">
            {score.toLocaleString()} pts
          </span>
        </div>
      </header>

      {phase === "lobby" ? (
        <Lobby pack={activePack} start={() => setPhase("question")} />
      ) : (
        <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_280px] lg:px-8">
          <section className="rounded-[1.75rem] border border-white/10 bg-[#11152d]/95 p-5 shadow-2xl sm:p-8">
            <RoundHeader
              round={round}
              index={roundIndex}
              total={activePack.rounds.length}
            />
            {phase === "remediation" && round.type === "confidence" ? (
              <Remediation
                round={round}
                selected={selected}
                choose={setSelected}
                done={() => {
                  setScore((v) => v + 350);
                  setPhase("podium");
                }}
              />
            ) : phase === "result" ? (
              <Result
                round={round}
                correct={correct}
                confidence={confidence}
                advance={advance}
                waiting={Boolean(roomCode && !isHost)}
                responseCount={
                  roomCode
                    ? livePlayers.filter(
                        (player) => player.answeredRound === roundIndex,
                      ).length
                    : undefined
                }
                playerCount={roomCode ? livePlayers.length : undefined}
              />
            ) : (
              <Question
                round={round}
                selected={selected}
                sequence={sequence}
                connections={connections}
                activeConnectionLeft={activeConnectionLeft}
                visualPlacements={visualPlacements}
                activeVisualLabel={activeVisualLabel}
                sortAssignments={sortAssignments}
                activeSortItem={activeSortItem}
                hotspotPoint={hotspotPoint}
                confidence={confidence}
                choose={setSelected}
                chooseSequence={chooseSequence}
                chooseConnectionLeft={chooseConnectionLeft}
                chooseConnectionRight={chooseConnectionRight}
                chooseVisualLabel={chooseVisualLabel}
                chooseVisualZone={chooseVisualZone}
                chooseSortItem={chooseSortItem}
                chooseSortBucket={chooseSortBucket}
                assignSortItem={assignSortItem}
                chooseHotspot={setHotspotPoint}
                setConfidence={setConfidence}
                submit={submit}
              />
            )}
          </section>
          <Scoreboard
            score={score}
            livePlayers={roomCode ? livePlayers : undefined}
            playerName={playerName}
          />
        </div>
      )}
    </main>
  );
}

function Lobby({ pack, start }: { pack: GamePack; start: () => void }) {
  return (
    <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 text-center sm:py-20">
      <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">
        Room SS26 · 4 players ready
      </p>
      <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">
        {pack.title}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-white/55">
        {pack.sourceLabel}
      </p>
      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {demoPlayers.map((p) => (
          <div
            key={p.name}
            className="rounded-2xl border border-white/10 bg-white/[.06] p-5"
          >
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-full font-black text-[#101329]"
              style={{ background: p.color }}
            >
              {p.name[0]}
            </span>
            <p className="mt-3 font-bold">{p.name}</p>
            <p className="text-xs text-[#72f0c5]">Ready</p>
          </div>
        ))}
      </div>
      <button
        onClick={start}
        className="mt-10 rounded-2xl bg-[#ffd84d] px-9 py-4 text-lg font-black text-[#101329] shadow-[0_12px_40px_rgba(255,216,77,.2)] transition hover:-translate-y-0.5"
      >
        Start the showdown →
      </button>
      <p className="mt-4 text-sm text-white/35">
        Interactive demo · about 2 minutes
      </p>
    </section>
  );
}

function RoundHeader({
  round,
  index,
  total,
}: {
  round: GameRound;
  index: number;
  total: number;
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#8f78ff]">
          Round {index + 1} of {total}
        </p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">{round.title}</h1>
        <p className="mt-1 text-sm text-white/40">{round.concept}</p>
      </div>
      <span className="rounded-xl bg-white/[.06] px-3 py-2 text-sm font-black text-[#ffd84d]">
        +{round.points}
      </span>
    </div>
  );
}

function Question(props: {
  round: GameRound;
  selected: string | null;
  sequence: string[];
  connections: ConnectionPair[];
  activeConnectionLeft: string | null;
  visualPlacements: Record<string, string>;
  activeVisualLabel: string | null;
  sortAssignments: Record<string, string>;
  activeSortItem: string | null;
  hotspotPoint: HotspotPoint | null;
  confidence: number;
  choose: (id: string) => void;
  chooseSequence: (id: string) => void;
  chooseConnectionLeft: (id: string) => void;
  chooseConnectionRight: (id: string) => void;
  chooseVisualLabel: (id: string) => void;
  chooseVisualZone: (id: string) => void;
  chooseSortItem: (id: string) => void;
  chooseSortBucket: (id: string) => void;
  assignSortItem: (itemId: string, bucketId: string) => void;
  chooseHotspot: (point: HotspotPoint) => void;
  setConfidence: (n: number) => void;
  submit: () => void;
}) {
  const { round } = props;
  if (round.type === "sequence")
    return (
      <>
        <h2 className="text-xl font-bold leading-8">{round.prompt}</h2>
        <p className="mt-2 text-sm text-white/40">
          Tap all cards in the correct order.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {round.items.map((item) => {
            const n = props.sequence.indexOf(item.id);
            return (
              <button
                key={item.id}
                onClick={() => props.chooseSequence(item.id)}
                className={`flex items-center gap-4 rounded-2xl border p-4 text-left font-bold transition ${n >= 0 ? "border-[#ffd84d] bg-[#ffd84d]/10" : "border-white/10 bg-white/[.05] hover:bg-white/[.09]"}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">
                  {n >= 0 ? n + 1 : "?"}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
        <Submit onClick={props.submit} />{" "}
      </>
    );
  if (round.type === "sort") {
    const unassigned = round.items.filter(
      (item) => !props.sortAssignments[item.id],
    );
    return (
      <>
        <h2 className="text-xl font-bold leading-8 sm:text-2xl">
          {round.prompt}
        </h2>
        <p className="mt-2 text-sm text-white/40">
          Tap an item and then a reactor — or drag it directly.
        </p>
        <div className="mt-6 rounded-2xl border border-white/8 bg-[#080a19]/45 p-4">
          <p className="text-xs font-black uppercase tracking-[.16em] text-white/35">
            Unsorted energy cells · {unassigned.length} remaining
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {unassigned.map((item) => (
              <button
                key={item.id}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", item.id)
                }
                onClick={() => props.chooseSortItem(item.id)}
                className={`min-h-16 rounded-xl border p-3 text-left text-sm font-bold transition ${props.activeSortItem === item.id ? "border-[#ffd84d] bg-[#ffd84d]/12 text-[#ffe374]" : "border-white/10 bg-white/[.055] hover:-translate-y-0.5 hover:bg-white/[.1]"}`}
              >
                <span className="mr-2 text-white/25">◆</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {round.buckets.map((bucket, bucketIndex) => {
            const assigned = round.items.filter(
              (item) => props.sortAssignments[item.id] === bucket.id,
            );
            const color = bucketIndex === 0 ? "#54d9ff" : "#ff6fae";
            return (
              <div
                key={bucket.id}
                role="button"
                tabIndex={0}
                onClick={() => props.chooseSortBucket(bucket.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ")
                    props.chooseSortBucket(bucket.id);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const itemId = event.dataTransfer.getData("text/plain");
                  if (itemId) props.assignSortItem(itemId, bucket.id);
                }}
                className={`min-h-52 cursor-pointer rounded-[1.5rem] border p-4 transition ${props.activeSortItem ? "scale-[1.01] bg-white/[.08]" : "bg-white/[.04]"}`}
                style={{ borderColor: `${color}66` }}
              >
                <div className="flex items-center gap-3 border-b border-white/8 pb-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-xl"
                    style={{ background: `${color}22` }}
                  >
                    {bucket.glyph}
                  </span>
                  <div>
                    <b className="block">{bucket.label}</b>
                    <span className="text-xs text-white/35">
                      {assigned.length} cells loaded
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {assigned.map((item) => (
                    <button
                      key={item.id}
                      draggable
                      onDragStart={(event) => {
                        event.stopPropagation();
                        event.dataTransfer.setData("text/plain", item.id);
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        props.chooseSortItem(item.id);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${props.activeSortItem === item.id ? "border-[#ffd84d] bg-[#ffd84d]/12" : "border-white/8 bg-[#080a19]/55"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                  {!assigned.length && (
                    <p className="py-6 text-center text-xs text-white/25">
                      Drop matching cells here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Submit onClick={props.submit} />
      </>
    );
  }
  if (round.type === "hotspot")
    return (
      <>
        <h2 className="text-xl font-bold leading-8 sm:text-2xl">
          {round.prompt}
        </h2>
        <p className="mt-2 text-sm text-white/40">
          Inspect the original page and tap the exact region.
        </p>
        <div className="mt-6 rounded-[1.75rem] border border-[#ffd84d]/20 bg-[#080a19]/55 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[.16em] text-[#ffd84d]">
              Hotspot Hunt
            </span>
            <span className="text-xs font-bold text-white/35">
              Original PDF · page {round.pageNumber}
            </span>
          </div>
          {round.pageImageDataUrl ? (
            <button
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                props.chooseHotspot({
                  x: Math.round(
                    ((event.clientX - rect.left) / rect.width) * 100,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) / rect.height) * 100,
                  ),
                });
              }}
              className="relative mx-auto block w-full max-w-2xl cursor-crosshair overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl"
              aria-label="PDF page. Tap the requested location."
            >
              {/* The source is a trusted server-generated data URL or local demo asset. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={round.pageImageDataUrl}
                alt={`Source PDF page ${round.pageNumber}`}
                className="block h-auto w-full"
              />
              {props.hotspotPoint && (
                <span
                  className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#ffd84d] bg-[#ffd84d]/25 shadow-[0_0_25px_rgba(255,216,77,.8)]"
                  style={{
                    left: `${props.hotspotPoint.x}%`,
                    top: `${props.hotspotPoint.y}%`,
                  }}
                >
                  <span className="absolute left-1/2 top-1/2 h-1 w-12 -translate-x-1/2 -translate-y-1/2 bg-[#ffd84d]" />
                  <span className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 bg-[#ffd84d]" />
                </span>
              )}
            </button>
          ) : (
            <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-white/15 text-sm text-white/35">
              Page preview unavailable
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs font-bold text-white/35">
          {props.hotspotPoint
            ? `Target locked at ${props.hotspotPoint.x}% · ${props.hotspotPoint.y}%`
            : "No marker placed yet"}
        </p>
        <Submit onClick={props.submit} />
      </>
    );
  if (round.type === "visual-map")
    return (
      <>
        <h2 className="text-xl font-bold leading-8 sm:text-2xl">
          {round.prompt}
        </h2>
        <p className="mt-2 text-sm text-white/40">
          Select a label, then place it into the correct zone.
        </p>
        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#54d9ff]/20 bg-[radial-gradient(circle_at_center,rgba(84,217,255,.12),rgba(17,21,45,.9)_62%)] p-3 sm:p-5">
          <div className="flex items-center justify-between px-1 pb-3">
            <span className="text-xs font-black uppercase tracking-[.16em] text-[#9feaff]">
              Visual Map Lab
            </span>
            <span className="text-xs font-bold text-white/35">
              {round.sceneLabel}
            </span>
          </div>
          <div className="relative aspect-[4/3] min-h-80 rounded-2xl border border-white/8 bg-[#080a19]/60">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {round.links.map((link, index) => {
                const from = round.zones.find(
                  (zone) => zone.id === link.fromZoneId,
                );
                const to = round.zones.find(
                  (zone) => zone.id === link.toZoneId,
                );
                if (!from || !to) return null;
                return (
                  <line
                    key={`${link.fromZoneId}-${link.toZoneId}-${index}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="rgba(84,217,255,.45)"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                );
              })}
            </svg>
            {round.zones.map((zone, index) => {
              const placedId = props.visualPlacements[zone.id];
              const placed = round.labels.find(
                (label) => label.id === placedId,
              );
              return (
                <button
                  key={zone.id}
                  onClick={() => props.chooseVisualZone(zone.id)}
                  className={`absolute z-10 w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-center shadow-xl transition sm:w-[34%] sm:p-4 ${placed ? "border-[#72f0c5]/60 bg-[#102b31]" : props.activeVisualLabel ? "animate-pulse border-[#ffd84d]/70 bg-[#ffd84d]/10" : "border-white/15 bg-[#11152d]"}`}
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                >
                  {placed ? (
                    <>
                      <span className="block text-xl sm:text-2xl">
                        {placed.glyph}
                      </span>
                      <b className="mt-1 block text-xs leading-4 sm:text-sm">
                        {placed.label}
                      </b>
                    </>
                  ) : (
                    <>
                      <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-white/10 text-xs font-black text-white/45">
                        {index + 1}
                      </span>
                      <span className="mt-1 block text-[10px] leading-4 text-white/35 sm:text-xs">
                        {zone.hint}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {round.labels.map((label) => {
            const placed = Object.values(props.visualPlacements).includes(
              label.id,
            );
            return (
              <button
                key={label.id}
                onClick={() => props.chooseVisualLabel(label.id)}
                className={`rounded-2xl border p-3 text-left text-sm font-bold transition ${props.activeVisualLabel === label.id ? "border-[#ffd84d] bg-[#ffd84d]/12" : placed ? "border-[#72f0c5]/20 bg-[#72f0c5]/5 text-white/35" : "border-white/10 bg-white/[.05] hover:bg-white/[.09]"}`}
              >
                <span className="mr-2">{label.glyph}</span>
                {label.label}
              </button>
            );
          })}
        </div>
        <Submit onClick={props.submit} />
      </>
    );
  if (round.type === "connection") {
    const colors = ["#ffd84d", "#54d9ff", "#ff6fae"];
    return (
      <>
        <h2 className="text-xl font-bold leading-8 sm:text-2xl">
          {round.prompt}
        </h2>
        <p className="mt-2 text-sm text-white/40">
          Choose a concept on the left, then connect its match on the right.
        </p>
        <div className="mt-7 grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4">
          <div className="space-y-3">
            {round.leftItems.map((item) => {
              const pairIndex = props.connections.findIndex(
                (pair) => pair.leftId === item.id,
              );
              const active = props.activeConnectionLeft === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => props.chooseConnectionLeft(item.id)}
                  className={`min-h-24 w-full rounded-2xl border p-3 text-left text-sm font-bold transition sm:p-4 ${active ? "border-white bg-white/12" : pairIndex >= 0 ? "bg-white/[.07]" : "border-white/10 bg-white/[.04] hover:bg-white/[.09]"}`}
                  style={
                    pairIndex >= 0 && !active
                      ? { borderColor: colors[pairIndex] }
                      : undefined
                  }
                >
                  {pairIndex >= 0 && (
                    <span
                      className="mb-2 grid h-6 w-6 place-items-center rounded-full text-xs text-[#101329]"
                      style={{ background: colors[pairIndex] }}
                    >
                      {pairIndex + 1}
                    </span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col justify-around text-center text-white/25">
            <span>⇄</span>
            <span>⇄</span>
            <span>⇄</span>
          </div>
          <div className="space-y-3">
            {round.rightItems.map((item) => {
              const pairIndex = props.connections.findIndex(
                (pair) => pair.rightId === item.id,
              );
              return (
                <button
                  key={item.id}
                  onClick={() => props.chooseConnectionRight(item.id)}
                  disabled={!props.activeConnectionLeft}
                  className={`min-h-24 w-full rounded-2xl border p-3 text-left text-sm font-bold transition sm:p-4 ${pairIndex >= 0 ? "bg-white/[.07]" : props.activeConnectionLeft ? "border-[#54d9ff]/40 bg-[#54d9ff]/7 hover:bg-[#54d9ff]/12" : "border-white/10 bg-white/[.04]"}`}
                  style={
                    pairIndex >= 0
                      ? { borderColor: colors[pairIndex] }
                      : undefined
                  }
                >
                  {pairIndex >= 0 && (
                    <span
                      className="mb-2 grid h-6 w-6 place-items-center rounded-full text-xs text-[#101329]"
                      style={{ background: colors[pairIndex] }}
                    >
                      {pairIndex + 1}
                    </span>
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-bold text-white/35">
          {props.connections.length} / {round.leftItems.length} links built
        </p>
        <Submit onClick={props.submit} />
      </>
    );
  }
  return (
    <>
      <h2 className="text-xl font-bold leading-8 sm:text-2xl">
        {round.prompt}
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {round.options.map((option, i) => (
          <button
            key={option.id}
            onClick={() => props.choose(option.id)}
            className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left font-bold transition ${props.selected === option.id ? "border-[#ffd84d] bg-[#ffd84d]/10" : "border-white/10 bg-white/[.05] hover:bg-white/[.09]"}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">
              {String.fromCharCode(65 + i)}
            </span>
            {option.label}
          </button>
        ))}
      </div>
      {round.type === "confidence" && (
        <div className="mt-7">
          <p className="mb-3 text-sm font-bold text-white/55">
            How confident are you? Higher confidence = higher stakes.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                onClick={() => props.setConfidence(n)}
                className={`rounded-xl border px-2 py-3 text-sm font-bold ${props.confidence === n ? "border-[#ff6fae] bg-[#ff6fae]/12 text-[#ff9bc6]" : "border-white/10 text-white/45"}`}
              >
                {["Not sure", "Pretty sure", "Locked in"][n - 1]}
              </button>
            ))}
          </div>
        </div>
      )}
      <Submit onClick={props.submit} />
    </>
  );
}

function Submit({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-7 w-full rounded-2xl bg-[#ffd84d] px-6 py-4 font-black text-[#101329] transition hover:bg-[#ffe374]"
    >
      Lock in answer
    </button>
  );
}

function Result({
  round,
  correct,
  confidence,
  advance,
  waiting,
  responseCount,
  playerCount,
}: {
  round: GameRound;
  correct: boolean;
  confidence: number;
  advance: () => void;
  waiting: boolean;
  responseCount?: number;
  playerCount?: number;
}) {
  const adaptive = round.type === "confidence" && !correct && confidence === 3;
  return (
    <div className="py-4">
      <div
        className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${correct ? "bg-[#72f0c5]/12 text-[#72f0c5]" : "bg-[#ff6fae]/12 text-[#ff8fbd]"}`}
      >
        {correct ? "✓ Correct!" : "Not quite"}
      </div>
      <h2 className="mt-5 text-3xl font-black">
        {correct
          ? `+${Math.round(round.points * (round.type === "confidence" ? confidence / 3 : 0.7))} points`
          : adaptive
            ? "Confidence detected."
            : "Learn it, then steal the next one."}
      </h2>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-white/62">
        {round.explanation}
      </p>
      <div className="mt-5 rounded-xl border border-[#54d9ff]/20 bg-[#54d9ff]/7 p-4">
        <p className="text-xs font-black uppercase tracking-[.16em] text-[#9feaff]">
          Grounded in your source
        </p>
        <p className="mt-2 text-sm leading-6 text-white/55">{round.evidence}</p>
      </div>
      {adaptive && (
        <div className="mt-6 rounded-2xl border border-[#ff6fae]/25 bg-[#ff6fae]/8 p-5">
          <p className="font-black text-[#ff9bc6]">⚡ Misconception detected</p>
          <p className="mt-2 text-sm leading-6 text-white/55">
            High confidence in this answer reveals a concept worth revisiting in
            your learning recap.
          </p>
        </div>
      )}
      {responseCount !== undefined && (
        <p className="mt-6 text-sm font-bold text-[#9feaff]">
          {responseCount} of {playerCount} players locked in
        </p>
      )}
      {waiting ? (
        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-6 py-4 text-white/55">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#72f0c5]" />
          Waiting for host to reveal the next round…
        </div>
      ) : (
        <button
          onClick={advance}
          className="mt-8 rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329]"
        >
          {adaptive
            ? "Continue showdown →"
            : round.id === "artery-confidence"
              ? "See final results →"
              : "Next round →"}
        </button>
      )}
    </div>
  );
}

function Remediation({
  round,
  selected,
  choose,
  done,
}: {
  round: Extract<GameRound, { type: "confidence" }>;
  selected: string | null;
  choose: (id: string) => void;
  done: () => void;
}) {
  return (
    <div>
      <span className="rounded-full bg-[#ff6fae]/12 px-3 py-1.5 text-xs font-black text-[#ff9bc6]">
        PERSONALIZED COMEBACK
      </span>
      <h2 className="mt-5 text-2xl font-black leading-9">
        {round.remediation.prompt}
      </h2>
      <p className="mt-3 text-white/55">{round.misconception}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {round.remediation.options.map((o) => (
          <button
            key={o.id}
            onClick={() => choose(o.id)}
            className={`rounded-2xl border p-5 text-left font-bold ${selected === o.id ? "border-[#72f0c5] bg-[#72f0c5]/10" : "border-white/10 bg-white/[.05]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <button
        disabled={!selected}
        onClick={done}
        className="mt-7 w-full rounded-2xl bg-[#72f0c5] px-6 py-4 font-black text-[#101329] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Finish comeback +350
      </button>
    </div>
  );
}

function Scoreboard({
  score,
  livePlayers,
  playerName,
}: {
  score: number;
  livePlayers?: LivePlayer[];
  playerName: string;
}) {
  const colors = ["#ffd84d", "#ff6fae", "#54d9ff", "#9d7cff", "#72f0c5"];
  const live: Array<{
    id: string;
    name: string;
    score: number;
    color: string;
  }> = (
    livePlayers?.length
      ? livePlayers.map((p, i) => ({
          id: p.id,
          name: p.name,
          score: p.score,
          color: colors[i % colors.length],
        }))
      : demoPlayers.map((p) => ({
          id: `demo-${p.name}`,
          name: p.name,
          score: p.name === "You" ? score : p.score,
          color: p.color,
        }))
  ).sort((a, b) => b.score - a.score);
  return (
    <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[.045] p-5">
      <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">
        Live standings
      </p>
      <div className="mt-4 space-y-3">
        {live.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 rounded-xl p-3 ${p.name === playerName || p.name === "You" ? "bg-[#ffd84d]/10" : "bg-white/[.035]"}`}
          >
            <b className="w-4 text-white/35">{i + 1}</b>
            <span
              className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-[#101329]"
              style={{ background: p.color }}
            >
              {p.name[0]}
            </span>
            <span className="flex-1 truncate font-bold">{p.name}</span>
            <span className="text-sm font-black">{p.score}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Podium({
  score,
  reset,
  livePlayers,
  playerName,
}: {
  score: number;
  reset: () => void;
  livePlayers?: LivePlayer[];
  playerName: string;
}) {
  const ranking = (
    livePlayers?.length
      ? livePlayers
      : [
          {
            id: "you",
            name: playerName,
            score,
            answeredRound: 2,
            role: "player" as const,
          },
        ]
  )
    .slice()
    .sort((a, b) => b.score - a.score);
  return (
    <main className="relative z-10 min-h-screen bg-[#080a19] px-5 py-16 text-center text-white">
      <p className="text-sm font-black uppercase tracking-[.2em] text-[#ffd84d]">
        Showdown complete
      </p>
      <h1 className="mt-4 text-5xl font-black tracking-[-.05em] sm:text-7xl">
        Final standings.
      </h1>
      <div className="mx-auto mt-12 max-w-xl space-y-3">
        {ranking.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center rounded-2xl border p-5 text-left ${index === 0 ? "border-[#ffd84d]/40 bg-[#ffd84d]/12" : "border-white/10 bg-white/[.05]"}`}
          >
            <span className="w-12 text-2xl font-black text-[#ffd84d]">
              #{index + 1}
            </span>
            <b className="flex-1">{player.name}</b>
            <span className="font-black">
              {player.score.toLocaleString()} pts
            </span>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#72f0c5]/20 bg-[#72f0c5]/8 p-6 text-left">
        <p className="font-black text-[#72f0c5]">Learning recap</p>
        <p className="mt-2 leading-7 text-white/60">
          The showdown turned answers and confidence into an instant view of
          strengths and misconceptions.
        </p>
      </div>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329]"
        >
          Play again
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-white/10 px-7 py-4 font-bold"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
