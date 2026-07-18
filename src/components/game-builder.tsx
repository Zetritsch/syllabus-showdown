"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShowdownDemo } from "@/components/showdown-demo";
import { gamePackSchema, type GamePack } from "@/lib/game-pack";

const sample = `The water cycle describes how water moves between Earth's surface and atmosphere. Evaporation occurs when liquid water gains energy and becomes water vapor. Plants also release water vapor through transpiration. As moist air rises and cools, water vapor condenses into tiny droplets that form clouds. When droplets grow heavy enough, water returns to Earth as precipitation such as rain or snow. Water then collects in oceans, lakes, rivers, soil, and groundwater before the cycle repeats. The Sun supplies most of the energy that drives evaporation. Condensation does not mean clouds are made of invisible gas; clouds contain tiny liquid droplets or ice crystals.`;

export function GameBuilder() {
  const router = useRouter();
  const [material, setMaterial] = useState(sample);
  const [pack, setPack] = useState<GamePack | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [solo, setSolo] = useState(false);
  const [hostName, setHostName] = useState("Host");
  const [sourceFileName, setSourceFileName] = useState("");

  async function loadFile(file?: File) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["txt", "md", "markdown"].includes(extension)) {
      setError("For now, upload a .txt or .md file.");
      return;
    }
    if (file.size > 250_000) {
      setError("Keep source files under 250 KB for the hackathon demo.");
      return;
    }
    const text = (await file.text()).trim();
    if (text.length < 200) {
      setError("The file needs at least 200 characters of learning material.");
      return;
    }
    setMaterial(text.slice(0, 12_000));
    setSourceFileName(file.name);
    setError("");
  }
  if (pack && solo) return <ShowdownDemo pack={pack} />;
  if (pack) {
    const hostMultiplayer = () => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const code = Array.from(
        { length: 6 },
        () => alphabet[Math.floor(Math.random() * alphabet.length)],
      ).join("");
      sessionStorage.setItem(`showdown:pack:${code}`, JSON.stringify(pack));
      router.push(
        `/room/${code}?role=host&name=${encodeURIComponent(hostName.trim() || "Host")}`,
      );
    };
    return (
      <main className="min-h-screen bg-[#080a19] px-5 py-10 text-white">
        <div className="arena-grid" />
        <section className="relative z-10 mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[#11152d]/95 p-6 sm:p-10">
          <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">
            ✓ Validated game pack
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
            {pack.title}
          </h1>
          <p className="mt-3 text-white/50">
            {pack.subject} · {pack.sourceLabel}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {pack.rounds.map((round, index) => (
              <article
                key={round.id}
                className="rounded-2xl border border-white/10 bg-white/[.05] p-5"
              >
                <span className="text-xs font-black text-[#8f78ff]">
                  ROUND {index + 1}
                </span>
                <h2 className="mt-2 font-black">{round.title}</h2>
                <p className="mt-1 text-sm text-white/40">{round.type}</p>
              </article>
            ))}
          </div>
          <label className="mt-8 block text-sm font-bold text-white/60">
            Your host name
          </label>
          <input
            value={hostName}
            onChange={(event) => setHostName(event.target.value)}
            maxLength={20}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[.055] px-4 py-3.5 outline-none focus:border-[#8f78ff]"
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={hostMultiplayer}
              className="rounded-2xl bg-[#ffd84d] px-6 py-4 font-black text-[#101329]"
            >
              Host multiplayer →
            </button>
            <button
              onClick={() => setSolo(true)}
              className="rounded-2xl border border-white/12 bg-white/[.05] px-6 py-4 font-bold"
            >
              Play solo
            </button>
          </div>
          <button
            onClick={() => setPack(null)}
            className="mt-5 text-sm font-bold text-white/40 hover:text-white"
          >
            ← Generate another pack
          </button>
        </section>
      </main>
    );
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ material }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setPack(gamePackSchema.parse(data.pack));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080a19] px-5 py-8 text-white">
      <div className="arena-grid" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-bold text-white/50 hover:text-white"
        >
          ← Back home
        </Link>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_260px]">
          <section>
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">
              AI game studio
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
              Turn your material into a showdown.
            </h1>
            <p className="mt-4 leading-7 text-white/55">
              Paste a focused section of notes or a study guide. GPT-5.6 creates
              three validated, source-grounded rounds.
            </p>
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void loadFile(event.dataTransfer.files[0]);
              }}
              className="mt-7 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[#8f78ff]/40 bg-[#8f78ff]/8 p-4 transition hover:bg-[#8f78ff]/12"
            >
              <span>
                <b className="block text-sm">Drop notes here or choose a file</b>
                <span className="text-xs text-white/40">.txt or .md · up to 250 KB</span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black">Upload</span>
              <input
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="sr-only"
                onChange={(event) => void loadFile(event.target.files?.[0])}
              />
            </label>
            {sourceFileName && <p className="mt-2 text-xs font-bold text-[#72f0c5]">✓ Loaded {sourceFileName}</p>}
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              maxLength={12000}
              className="mt-4 min-h-72 w-full resize-y rounded-2xl border border-white/12 bg-white/[.055] p-5 leading-7 outline-none transition focus:border-[#8f78ff]"
              aria-label="Study material"
            />
            <div className="mt-2 flex justify-between text-xs text-white/35">
              <span>Minimum 200 characters</span>
              <span>{material.length.toLocaleString()} / 12,000</span>
            </div>
            {error && (
              <p className="mt-4 rounded-xl border border-[#ff6fae]/25 bg-[#ff6fae]/8 p-4 text-sm text-[#ff9bc6]">
                {error}
              </p>
            )}
            <button
              onClick={generate}
              disabled={loading || material.trim().length < 200}
              className="mt-5 w-full rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Designing your rounds…" : "Generate showdown ✦"}
            </button>
            <p className="mt-3 text-center text-xs text-white/30">
              One generation uses a small amount of your OpenAI API credit.
            </p>
          </section>
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.05] p-5">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#8f78ff]">
              What GPT builds
            </p>
            <ul className="mt-4 space-y-4 text-sm text-white/60">
              <li>
                <b className="block text-white">1 · Sequence Rush</b>Order a
                process correctly
              </li>
              <li>
                <b className="block text-white">2 · Connection Clash</b>Link
                structure and meaning
              </li>
              <li>
                <b className="block text-white">3 · Confidence Battle</b>Expose
                misconceptions
              </li>
            </ul>
            <div className="mt-6 rounded-xl bg-[#72f0c5]/8 p-4 text-xs leading-5 text-[#a4f7dc]">
              Output is checked against the game schema before it can reach
              players.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
