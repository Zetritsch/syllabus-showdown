"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ShowdownDemo } from "@/components/showdown-demo";
import { gamePackSchema, type GamePack } from "@/lib/game-pack";
import { useLanguage } from "@/lib/i18n";

const sample = `The water cycle describes how water moves between Earth's surface and atmosphere. Evaporation occurs when liquid water gains energy and becomes water vapor. Plants also release water vapor through transpiration. As moist air rises and cools, water vapor condenses into tiny droplets that form clouds. When droplets grow heavy enough, water returns to Earth as precipitation such as rain or snow. Water then collects in oceans, lakes, rivers, soil, and groundwater before the cycle repeats. The Sun supplies most of the energy that drives evaporation. Condensation does not mean clouds are made of invisible gas; clouds contain tiny liquid droplets or ice crystals.`;

type GenerationUsage = {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
};

export function GameBuilder() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [material, setMaterial] = useState(sample);
  const [pack, setPack] = useState<GamePack | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [solo, setSolo] = useState(false);
  const [hostName, setHostName] = useState("Host");
  const [sourceFileName, setSourceFileName] = useState("");
  const [sourceDetails, setSourceDetails] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [sourcePdf, setSourcePdf] = useState<File | null>(null);
  const [generationUsage, setGenerationUsage] =
    useState<GenerationUsage | null>(null);

  async function loadFile(file?: File) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["txt", "md", "markdown", "pdf"].includes(extension)) {
      setError("Upload a PDF, .txt, or .md file.");
      return;
    }
    const isPdf = extension === "pdf";
    const maxBytes = isPdf ? 4 * 1024 * 1024 : 250_000;
    if (file.size > maxBytes) {
      setError(
        isPdf
          ? "Keep PDFs under 4 MB for the live demo."
          : "Keep text files under 250 KB for the live demo.",
      );
      return;
    }

    setExtracting(true);
    setError("");
    try {
      if (isPdf) {
        const formData = new FormData();
        formData.set("file", file);
        const response = await fetch("/api/extract-pdf", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as {
          text?: string;
          pages?: number;
          characters?: number;
          truncated?: boolean;
          scanOnly?: boolean;
          error?: string;
        };
        if (!response.ok)
          throw new Error(data.error || "PDF extraction failed.");
        const pages = Number(data.pages || 0);
        if (data.scanOnly && pages > 6) {
          throw new Error(
            "Scanned PDFs are limited to 6 pages to control API cost. Upload a focused excerpt.",
          );
        }
        const visualMode = pages <= 6;
        setSourcePdf(visualMode ? file : null);
        setMaterial(data.text || "");
        setSourceDetails(
          `${pages} page${pages === 1 ? "" : "s"} · ${data.scanOnly ? "visual scan detected" : `${Number(data.characters || data.text?.length || 0).toLocaleString()} characters`}${visualMode ? " · low-cost visual mode" : " · text mode (use ≤6 pages for visuals)"}${data.truncated ? " · focused to 12,000" : ""}`,
        );
      } else {
        const text = (await file.text()).trim();
        if (text.length < 200)
          throw new Error(
            "The file needs at least 200 characters of learning material.",
          );
        setMaterial(text.slice(0, 12_000));
        setSourcePdf(null);
        setSourceDetails(
          `${text.length.toLocaleString()} characters${text.length > 12_000 ? " · focused to 12,000" : ""}`,
        );
      }
      setSourceFileName(file.name);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not read this file.",
      );
    } finally {
      setExtracting(false);
    }
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">
              ✓{" "}
              {language === "de"
                ? "Validiertes Game Pack"
                : "Validated game pack"}
            </p>
            <LanguageSwitcher compact />
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
            {pack.title}
          </h1>
          <p className="mt-3 text-white/50">
            {pack.subject} · {pack.sourceLabel}
          </p>
          {generationUsage && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[#72f0c5]/10 px-3 py-2 text-[#a4f7dc]">
                {language === "de"
                  ? "Geschätzte API-Kosten"
                  : "Estimated API cost"}
                : ${generationUsage.estimatedCostUsd.toFixed(4)}
              </span>
              <span className="rounded-full bg-white/[.06] px-3 py-2 text-white/45">
                {generationUsage.inputTokens.toLocaleString()} in ·{" "}
                {generationUsage.outputTokens.toLocaleString()} out
              </span>
            </div>
          )}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pack.rounds.map((round, index) => (
              <article
                key={round.id}
                className="rounded-2xl border border-white/10 bg-white/[.05] p-5"
              >
                <span className="text-xs font-black text-[#8f78ff]">
                  {language === "de" ? "RUNDE" : "ROUND"} {index + 1}
                </span>
                <h2 className="mt-2 font-black">{round.title}</h2>
                <p className="mt-1 text-sm text-white/40">{round.type}</p>
              </article>
            ))}
          </div>
          <label className="mt-8 block text-sm font-bold text-white/60">
            {language === "de" ? "Dein Host-Name" : "Your host name"}
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
              {language === "de"
                ? "Multiplayer hosten →"
                : "Host multiplayer →"}
            </button>
            <button
              onClick={() => setSolo(true)}
              className="rounded-2xl border border-white/12 bg-white/[.05] px-6 py-4 font-bold"
            >
              {language === "de" ? "Solo spielen" : "Play solo"}
            </button>
          </div>
          <button
            onClick={() => setPack(null)}
            className="mt-5 text-sm font-bold text-white/40 hover:text-white"
          >
            ←{" "}
            {language === "de"
              ? "Weiteres Pack generieren"
              : "Generate another pack"}
          </button>
        </section>
      </main>
    );
  }

  async function generate() {
    setLoading(true);
    setError("");
    setGenerationUsage(null);
    try {
      const response = sourcePdf
        ? await fetch("/api/generate-pdf", {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.set("file", sourcePdf);
              formData.set("language", language);
              return formData;
            })(),
          })
        : await fetch("/api/generate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ material, language }),
          });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setPack(gamePackSchema.parse(data.pack));
      if (data.usage) setGenerationUsage(data.usage as GenerationUsage);
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
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-bold text-white/50 hover:text-white"
          >
            ← {t("backHome")}
          </Link>
          <LanguageSwitcher />
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_260px]">
          <section>
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#72f0c5]">
              {language === "de" ? "KI-GAME-STUDIO" : "AI GAME STUDIO"}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
              {language === "de"
                ? "Verwandle deinen Lernstoff in einen Showdown."
                : "Turn your material into a showdown."}
            </h1>
            <p className="mt-4 leading-7 text-white/55">
              {language === "de"
                ? "Füge einen relevanten Abschnitt deiner Notizen ein oder lade eine PDF hoch. GPT-5.6 erstellt daraus fünf validierte, quellenbasierte Runden."
                : "Paste focused notes or upload a PDF. GPT-5.6 creates five validated, source-grounded rounds."}
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
                <b className="block text-sm">
                  {extracting
                    ? language === "de"
                      ? "Quelle wird gelesen…"
                      : "Reading your source…"
                    : language === "de"
                      ? "Lernmaterial hier ablegen oder Datei auswählen"
                      : "Drop a syllabus here or choose a file"}
                </b>
                <span className="text-xs text-white/40">
                  PDF up to 4 MB · .txt or .md up to 250 KB
                </span>
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black">
                {extracting
                  ? language === "de"
                    ? "Lese…"
                    : "Extracting…"
                  : language === "de"
                    ? "Hochladen"
                    : "Upload"}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                className="sr-only"
                disabled={extracting}
                onChange={(event) => void loadFile(event.target.files?.[0])}
              />
            </label>
            {sourceFileName && (
              <p className="mt-2 text-xs font-bold text-[#72f0c5]">
                ✓ {language === "de" ? "Geladen" : "Loaded"} {sourceFileName}
                {sourceDetails ? ` · ${sourceDetails}` : ""}
              </p>
            )}
            <textarea
              value={material}
              onChange={(e) => {
                setMaterial(e.target.value);
                if (sourcePdf) setSourcePdf(null);
              }}
              maxLength={12000}
              placeholder={
                sourcePdf
                  ? language === "de"
                    ? "Diese PDF enthält kaum auswählbaren Text. Die visuelle KI liest die gerenderten Seiten direkt."
                    : "This PDF has little or no selectable text. Visual AI will read the rendered pages directly."
                  : language === "de"
                    ? "Relevanten Lernstoff hier einfügen…"
                    : "Paste focused learning material here…"
              }
              className="mt-4 min-h-72 w-full resize-y rounded-2xl border border-white/12 bg-white/[.055] p-5 leading-7 outline-none transition focus:border-[#8f78ff]"
              aria-label="Study material"
            />
            <div className="mt-2 flex justify-between text-xs text-white/35">
              <span>
                {sourcePdf
                  ? language === "de"
                    ? "Visueller PDF-Modus · Scans und Schaubilder unterstützt"
                    : "Visual PDF mode · scans and diagrams supported"
                  : language === "de"
                    ? "Mindestens 200 Zeichen"
                    : "Minimum 200 characters"}
              </span>
              <span>{material.length.toLocaleString()} / 12,000</span>
            </div>
            {error && (
              <p className="mt-4 rounded-xl border border-[#ff6fae]/25 bg-[#ff6fae]/8 p-4 text-sm text-[#ff9bc6]">
                {error}
              </p>
            )}
            <button
              onClick={generate}
              disabled={
                loading ||
                extracting ||
                (!sourcePdf && material.trim().length < 200)
              }
              className="mt-5 w-full rounded-2xl bg-[#ffd84d] px-7 py-4 font-black text-[#101329] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? sourcePdf
                  ? language === "de"
                    ? "Lese Seiten und baue visuelle Spiele…"
                    : "Reading pages and building visuals…"
                  : language === "de"
                    ? "Runden werden entworfen…"
                    : "Designing your rounds…"
                : sourcePdf
                  ? language === "de"
                    ? "Visuellen Showdown generieren ✦"
                    : "Generate visual showdown ✦"
                  : language === "de"
                    ? "Showdown generieren ✦"
                    : "Generate showdown ✦"}
            </button>
            <p className="mt-3 text-center text-xs text-white/30">
              {sourcePdf
                ? language === "de"
                  ? "Visuelle PDF-Analyse verbraucht mehr Input-Tokens als reine Textgenerierung."
                  : "Visual PDF analysis uses more input tokens than text-only generation."
                : language === "de"
                  ? "Die tatsächlichen Tokenkosten werden nach der Generierung angezeigt."
                  : "Actual token cost is shown after generation."}
            </p>
          </section>
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.05] p-5">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#8f78ff]">
              {language === "de" ? "WAS GPT ERSTELLT" : "WHAT GPT BUILDS"}
            </p>
            <ul className="mt-4 space-y-4 text-sm text-white/60">
              <li>
                <b className="block text-white">1 · Sequence Rush</b>Order a
                process correctly
              </li>
              <li>
                <b className="block text-white">2 · Sort Reactor</b>Classify
                concepts under pressure
              </li>
              <li>
                <b className="block text-white">3 · Hotspot Hunt</b>Find targets
                on the original page
              </li>
              <li>
                <b className="block text-white">4 · Visual Map Lab</b>Rebuild a
                system from diagrams
              </li>
              <li>
                <b className="block text-white">5 · Confidence Battle</b>Expose
                misconceptions
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-[#ff6fae]/20 bg-[#ff6fae]/8 p-4 text-xs leading-5 text-[#ffacd0]">
              {language === "de"
                ? "PDFs mit bis zu 6 Seiten ermöglichen visuelle Modellspiele und werden auch als Scan verstanden."
                : "PDFs up to 6 pages unlock visual model building and can be understood even when they are scans."}
            </div>
            <div className="mt-6 rounded-xl bg-[#72f0c5]/8 p-4 text-xs leading-5 text-[#a4f7dc]">
              {language === "de"
                ? "Jede Ausgabe wird gegen das Game-Pack-Schema geprüft, bevor Spieler sie sehen."
                : "Output is checked against the game schema before it can reach players."}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
