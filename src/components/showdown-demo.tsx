"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { demoPack } from "@/data/demo-pack";
import type { GamePack, GameRound } from "@/lib/game-pack";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Phase = "lobby" | "question" | "result" | "remediation" | "podium";
const players = [
  { name: "Maya", score: 2240, color: "#ff6fae" },
  { name: "You", score: 1980, color: "#ffd84d" },
  { name: "Leo", score: 1740, color: "#54d9ff" },
  { name: "Noor", score: 1510, color: "#9d7cff" },
];

export function ShowdownDemo({ pack = demoPack, roomCode, isHost = true }: { pack?: GamePack; roomCode?: string; isHost?: boolean }) {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(1980);
  const [selected, setSelected] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(2);
  const [sequence, setSequence] = useState<string[]>([]);
  const [roomLive, setRoomLive] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const round = pack.rounds[roundIndex];

  useEffect(() => {
    if (!roomCode) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(`game:${roomCode}`, { config: { broadcast: { ack: true, self: false } } });
    channel.on("broadcast", { event: "round-change" }, ({ payload }) => {
      const next = Number(payload.roundIndex);
      if (!Number.isInteger(next) || next < 0 || next >= pack.rounds.length) return;
      setRoundIndex(next); setSelected(null); setSequence([]); setPhase("question");
    }).on("broadcast", { event: "game-finish" }, () => setPhase("podium"))
      .subscribe(status => { if (status === "SUBSCRIBED") setRoomLive(true); });
    channelRef.current = channel;
    return () => { channelRef.current = null; void supabase.removeChannel(channel); };
  }, [pack.rounds.length, roomCode]);

  const correct = useMemo(() => {
    if (round.type === "sequence") return sequence.join("|") === round.correctOrder.join("|");
    return selected === round.correctOptionId;
  }, [round, selected, sequence]);

  function chooseSequence(id: string) {
    if (phase !== "question") return;
    setSequence((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit() {
    const answered = round.type === "sequence" ? sequence.length === round.items.length : selected !== null;
    if (!answered) return;
    if (correct) setScore((value) => value + Math.round(round.points * (round.type === "confidence" ? confidence / 3 : 0.7)));
    setPhase("result");
  }

  async function advance() {
    if (roomCode && !isHost) return;
    if (round.type === "confidence" && !correct && confidence === 3 && selected === round.misconceptionOptionId) {
      setSelected(null);
      setPhase("remediation");
      return;
    }
    if (roundIndex === pack.rounds.length - 1) {
      if (roomCode) await channelRef.current?.send({ type: "broadcast", event: "game-finish", payload: {} });
      setPhase("podium");
    }
    else {
      const nextRound = roundIndex + 1;
      if (roomCode) await channelRef.current?.send({ type: "broadcast", event: "round-change", payload: { roundIndex: nextRound } });
      setRoundIndex(nextRound);
      setSelected(null);
      setSequence([]);
      setPhase("question");
    }
  }

  function reset() {
    setPhase("lobby"); setRoundIndex(0); setScore(1980); setSelected(null); setSequence([]); setConfidence(2);
  }

  if (phase === "podium") return <Podium score={score} reset={reset} />;

  return (
    <main className="min-h-screen bg-[#080a19] text-white">
      <div className="arena-grid" />
      <header className="relative z-10 flex items-center justify-between border-b border-white/8 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-black"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffd84d] text-[#111329]">S</span><span className="hidden sm:inline">SYLLABUS SHOWDOWN</span></Link>
        <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${roomCode ? "bg-[#54d9ff]/10 text-[#9feaff]" : "bg-[#72f0c5]/10 text-[#72f0c5]"}`}>● {roomCode ? `${roomLive ? "ROOM" : "LINKING"} ${roomCode}` : "LIVE DEMO"}</span><span className="font-black text-[#ffd84d]">{score.toLocaleString()} pts</span></div>
      </header>

      {phase === "lobby" ? <Lobby pack={pack} start={() => setPhase("question")} /> : (
        <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[1fr_280px] lg:px-8">
          <section className="rounded-[1.75rem] border border-white/10 bg-[#11152d]/95 p-5 shadow-2xl sm:p-8">
            <RoundHeader round={round} index={roundIndex} total={pack.rounds.length} />
            {phase === "remediation" && round.type === "confidence" ? (
              <Remediation round={round} selected={selected} choose={setSelected} done={() => { setScore((v) => v + 350); setPhase("podium"); }} />
            ) : phase === "result" ? (
              <Result round={round} correct={correct} confidence={confidence} advance={advance} waiting={Boolean(roomCode && !isHost)} />
            ) : (
              <Question round={round} selected={selected} sequence={sequence} confidence={confidence} choose={setSelected} chooseSequence={chooseSequence} setConfidence={setConfidence} submit={submit} />
            )}
          </section>
          <Scoreboard score={score} />
        </div>
      )}
    </main>
  );
}

function Lobby({ pack, start }: { pack: GamePack; start: () => void }) {
  return <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 text-center sm:py-20">
    <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">Room SS26 · 4 players ready</p>
    <h1 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-6xl">{pack.title}</h1>
    <p className="mx-auto mt-4 max-w-xl text-lg text-white/55">{pack.sourceLabel}</p>
    <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">{players.map((p) => <div key={p.name} className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full font-black text-[#101329]" style={{background:p.color}}>{p.name[0]}</span><p className="mt-3 font-bold">{p.name}</p><p className="text-xs text-[#72f0c5]">Ready</p></div>)}</div>
    <button onClick={start} className="mt-10 rounded-2xl bg-[#ffd84d] px-9 py-4 text-lg font-black text-[#101329] shadow-[0_12px_40px_rgba(255,216,77,.2)] transition hover:-translate-y-0.5">Start the showdown →</button>
    <p className="mt-4 text-sm text-white/35">Interactive demo · about 2 minutes</p>
  </section>;
}

function RoundHeader({ round, index, total }: { round: GameRound; index: number; total: number }) {
  return <div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-[#8f78ff]">Round {index + 1} of {total}</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">{round.title}</h1><p className="mt-1 text-sm text-white/40">{round.concept}</p></div><span className="rounded-xl bg-white/[.06] px-3 py-2 text-sm font-black text-[#ffd84d]">+{round.points}</span></div>;
}

function Question(props: { round: GameRound; selected: string | null; sequence: string[]; confidence: number; choose: (id: string) => void; chooseSequence: (id: string) => void; setConfidence: (n: number) => void; submit: () => void }) {
  const { round } = props;
  if (round.type === "sequence") return <><h2 className="text-xl font-bold leading-8">{round.prompt}</h2><p className="mt-2 text-sm text-white/40">Tap all cards in the correct order.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{round.items.map((item) => { const n=props.sequence.indexOf(item.id); return <button key={item.id} onClick={() => props.chooseSequence(item.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left font-bold transition ${n >= 0 ? "border-[#ffd84d] bg-[#ffd84d]/10" : "border-white/10 bg-white/[.05] hover:bg-white/[.09]"}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">{n >= 0 ? n + 1 : "?"}</span>{item.label}</button>})}</div><Submit onClick={props.submit} /> </>;
  return <><h2 className="text-xl font-bold leading-8 sm:text-2xl">{round.prompt}</h2>{round.type === "connection" && <div className="mt-6 rounded-2xl border border-[#54d9ff]/30 bg-[#54d9ff]/8 p-4 text-center font-black text-[#9feaff]">{round.left}</div>}<div className="mt-6 grid gap-3 sm:grid-cols-2">{round.options.map((option, i) => <button key={option.id} onClick={() => props.choose(option.id)} className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left font-bold transition ${props.selected === option.id ? "border-[#ffd84d] bg-[#ffd84d]/10" : "border-white/10 bg-white/[.05] hover:bg-white/[.09]"}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-sm">{String.fromCharCode(65+i)}</span>{option.label}</button>)}</div>{round.type === "confidence" && <div className="mt-7"><p className="mb-3 text-sm font-bold text-white/55">How confident are you? Higher confidence = higher stakes.</p><div className="grid grid-cols-3 gap-2">{[1,2,3].map((n) => <button key={n} onClick={() => props.setConfidence(n)} className={`rounded-xl border px-2 py-3 text-sm font-bold ${props.confidence === n ? "border-[#ff6fae] bg-[#ff6fae]/12 text-[#ff9bc6]" : "border-white/10 text-white/45"}`}>{["Not sure","Pretty sure","Locked in"][n-1]}</button>)}</div></div>}<Submit onClick={props.submit} /></>;
}

function Submit({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="mt-7 w-full rounded-2xl bg-[#ffd84d] px-6 py-4 font-black text-[#101329] transition hover:bg-[#ffe374]">Lock in answer</button>; }

function Result({ round, correct, confidence, advance, waiting }: { round: GameRound; correct: boolean; confidence: number; advance: () => void; waiting: boolean }) {
  const adaptive = round.type === "confidence" && !correct && confidence === 3;
  return <div className="py-4"><div className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${correct ? "bg-[#72f0c5]/12 text-[#72f0c5]" : "bg-[#ff6fae]/12 text-[#ff8fbd]"}`}>{correct ? "✓ Correct!" : "Not quite"}</div><h2 className="mt-5 text-3xl font-black">{correct ? `+${Math.round(round.points * (round.type === "confidence" ? confidence / 3 : .7))} points` : adaptive ? "Confidence detected." : "Learn it, then steal the next one."}</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-white/62">{round.explanation}</p>{adaptive && <div className="mt-6 rounded-2xl border border-[#ff6fae]/25 bg-[#ff6fae]/8 p-5"><p className="font-black text-[#ff9bc6]">⚡ Adaptive branch unlocked</p><p className="mt-2 text-sm leading-6 text-white/55">You were highly confident in a common misconception, so the game is changing the next challenge instead of merely showing a red X.</p></div>}{waiting?<div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] px-6 py-4 text-white/55"><span className="h-2 w-2 animate-pulse rounded-full bg-[#72f0c5]"/>Waiting for host to reveal the next round…</div>:<button onClick={advance} className="mt-8 rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329]">{adaptive ? "Take comeback round →" : round.id === "artery-confidence" ? "See final results →" : "Next round →"}</button>}</div>;
}

function Remediation({ round, selected, choose, done }: { round: Extract<GameRound,{type:"confidence"}>; selected: string | null; choose: (id:string)=>void; done:()=>void }) {
  return <div><span className="rounded-full bg-[#ff6fae]/12 px-3 py-1.5 text-xs font-black text-[#ff9bc6]">PERSONALIZED COMEBACK</span><h2 className="mt-5 text-2xl font-black leading-9">{round.remediation.prompt}</h2><p className="mt-3 text-white/55">{round.misconception}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{round.remediation.options.map(o=><button key={o.id} onClick={()=>choose(o.id)} className={`rounded-2xl border p-5 text-left font-bold ${selected===o.id?"border-[#72f0c5] bg-[#72f0c5]/10":"border-white/10 bg-white/[.05]"}`}>{o.label}</button>)}</div><button disabled={!selected} onClick={done} className="mt-7 w-full rounded-2xl bg-[#72f0c5] px-6 py-4 font-black text-[#101329] disabled:cursor-not-allowed disabled:opacity-30">Finish comeback +350</button></div>;
}

function Scoreboard({ score }: { score: number }) { const live=players.map(p=>p.name==="You"?{...p,score}:p).sort((a,b)=>b.score-a.score); return <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[.045] p-5"><p className="text-xs font-black uppercase tracking-[.18em] text-white/35">Live standings</p><div className="mt-4 space-y-3">{live.map((p,i)=><div key={p.name} className={`flex items-center gap-3 rounded-xl p-3 ${p.name==="You"?"bg-[#ffd84d]/10":"bg-white/[.035]"}`}><b className="w-4 text-white/35">{i+1}</b><span className="grid h-8 w-8 place-items-center rounded-full text-xs font-black text-[#101329]" style={{background:p.color}}>{p.name[0]}</span><span className="flex-1 font-bold">{p.name}</span><span className="text-sm font-black">{p.score}</span></div>)}</div></aside>; }

function Podium({ score, reset }: { score: number; reset: () => void }) { return <main className="relative z-10 min-h-screen bg-[#080a19] px-5 py-16 text-center text-white"><p className="text-sm font-black uppercase tracking-[.2em] text-[#ffd84d]">Showdown complete</p><h1 className="mt-4 text-5xl font-black tracking-[-.05em] sm:text-7xl">You made the podium.</h1><div className="mx-auto mt-12 flex max-w-xl items-end justify-center gap-3"><div className="w-1/3 rounded-t-2xl bg-[#54d9ff]/20 p-5 pt-8"><b>Leo</b><p className="text-sm text-white/45">1,740</p><div className="mt-5 text-3xl">3</div></div><div className="w-1/3 rounded-t-2xl bg-[#ffd84d]/20 p-5 pt-16 ring-1 ring-[#ffd84d]/40"><b className="text-[#ffd84d]">You</b><p className="text-sm text-white/45">{score.toLocaleString()}</p><div className="mt-5 text-4xl">1</div></div><div className="w-1/3 rounded-t-2xl bg-[#ff6fae]/20 p-5 pt-11"><b>Maya</b><p className="text-sm text-white/45">2,240</p><div className="mt-5 text-3xl">2</div></div></div><div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#72f0c5]/20 bg-[#72f0c5]/8 p-6 text-left"><p className="font-black text-[#72f0c5]">Learning recap</p><p className="mt-2 leading-7 text-white/60">Strong on blood flow and vessel structure. You corrected the key misconception: arteries are defined by direction, not oxygen content.</p></div><div className="mt-8 flex justify-center gap-3"><button onClick={reset} className="rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329]">Play again</button><Link href="/" className="rounded-2xl border border-white/10 px-7 py-4 font-bold">Back home</Link></div></main>; }
