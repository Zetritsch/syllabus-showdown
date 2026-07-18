"use client";

import Link from "next/link";
import { useState } from "react";
import { ShowdownDemo } from "@/components/showdown-demo";
import { gamePackSchema, type GamePack } from "@/lib/game-pack";

const sample = `The water cycle describes how water moves between Earth's surface and atmosphere. Evaporation occurs when liquid water gains energy and becomes water vapor. Plants also release water vapor through transpiration. As moist air rises and cools, water vapor condenses into tiny droplets that form clouds. When droplets grow heavy enough, water returns to Earth as precipitation such as rain or snow. Water then collects in oceans, lakes, rivers, soil, and groundwater before the cycle repeats. The Sun supplies most of the energy that drives evaporation. Condensation does not mean clouds are made of invisible gas; clouds contain tiny liquid droplets or ice crystals.`;

export function GameBuilder() {
  const [material, setMaterial] = useState(sample);
  const [pack, setPack] = useState<GamePack | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (pack) return <ShowdownDemo pack={pack} />;

  async function generate() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ material }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setPack(gamePackSchema.parse(data.pack));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Generation failed."); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#080a19] px-5 py-8 text-white"><div className="arena-grid"/><div className="relative z-10 mx-auto max-w-4xl"><Link href="/" className="text-sm font-bold text-white/50 hover:text-white">← Back home</Link><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_260px]"><section><p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">AI game studio</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Turn your material into a showdown.</h1><p className="mt-4 leading-7 text-white/55">Paste a focused section of notes or a study guide. GPT-5.6 creates three validated, source-grounded rounds.</p><textarea value={material} onChange={e=>setMaterial(e.target.value)} maxLength={12000} className="mt-8 min-h-72 w-full resize-y rounded-2xl border border-white/12 bg-white/[.055] p-5 leading-7 outline-none transition focus:border-[#8f78ff]" aria-label="Study material"/><div className="mt-2 flex justify-between text-xs text-white/35"><span>Minimum 200 characters</span><span>{material.length.toLocaleString()} / 12,000</span></div>{error && <p className="mt-4 rounded-xl border border-[#ff6fae]/25 bg-[#ff6fae]/8 p-4 text-sm text-[#ff9bc6]">{error}</p>}<button onClick={generate} disabled={loading || material.trim().length<200} className="mt-5 w-full rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329] disabled:cursor-not-allowed disabled:opacity-40">{loading ? "Designing your rounds…" : "Generate showdown ✦"}</button><p className="mt-3 text-center text-xs text-white/30">One generation uses a small amount of your OpenAI API credit.</p></section><aside className="h-fit rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs font-black uppercase tracking-[.18em] text-[#8f78ff]">What GPT builds</p><ul className="mt-4 space-y-4 text-sm text-white/60"><li><b className="block text-white">1 · Sequence Rush</b>Order a process correctly</li><li><b className="block text-white">2 · Connection Clash</b>Link structure and meaning</li><li><b className="block text-white">3 · Confidence Battle</b>Expose misconceptions</li></ul><div className="mt-6 rounded-xl bg-[#72f0c5]/8 p-4 text-xs leading-5 text-[#a4f7dc]">Output is checked against the game schema before it can reach players.</div></aside></div></div></main>;
}
