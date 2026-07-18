"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function JoinRoom() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  function enter(role: "host" | "player", targetCode = code) {
    const safeName = (name.trim() || (role === "host" ? "Host" : "Player")).slice(0, 20);
    const safeCode = targetCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (safeCode.length !== 6) return;
    router.push(`/room/${safeCode}?role=${role}&name=${encodeURIComponent(safeName)}`);
  }
  return <main className="min-h-screen bg-[#080a19] px-5 py-10 text-white"><div className="arena-grid"/><div className="relative z-10 mx-auto max-w-lg"><Link href="/" className="text-sm font-bold text-white/45">← Back home</Link><section className="mt-10 rounded-[2rem] border border-white/10 bg-[#11152d]/95 p-6 shadow-2xl sm:p-9"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffd84d] text-xl font-black text-[#101329]">S</span><h1 className="mt-6 text-4xl font-black tracking-[-.04em]">Enter the arena.</h1><p className="mt-3 leading-7 text-white/50">Join a host with their room code, or create a fresh lobby for your group.</p><label className="mt-8 block text-sm font-bold text-white/60">Display name</label><input value={name} onChange={e=>setName(e.target.value)} maxLength={20} placeholder="e.g. Maya" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.055] px-4 py-3.5 outline-none focus:border-[#8f78ff]"/><label className="mt-5 block text-sm font-bold text-white/60">6-character room code</label><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.055] px-4 py-4 text-center text-2xl font-black uppercase tracking-[.25em] outline-none focus:border-[#8f78ff]"/><button onClick={()=>enter("player")} disabled={code.replace(/[^A-Z0-9]/g,"").length!==6} className="mt-5 w-full rounded-xl bg-[#ffd84d] px-5 py-4 font-black text-[#101329] disabled:opacity-35">Join showdown →</button><div className="my-6 flex items-center gap-3 text-xs text-white/25"><span className="h-px flex-1 bg-white/10"/>OR<span className="h-px flex-1 bg-white/10"/></div><button onClick={()=>{const next=roomCode();setCode(next);enter("host",next)}} className="w-full rounded-xl border border-white/12 bg-white/[.05] px-5 py-4 font-bold hover:bg-white/[.09]">Create a room as host</button></section></div></main>;
}
