"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { language, t } = useLanguage();
  const steps =
    language === "de"
      ? [
          {
            number: "01",
            title: "Material hochladen",
            copy: "Lade einen Lehrplan, ein Kapitel oder Lernskript hoch.",
          },
          {
            number: "02",
            title: "Showdown generieren",
            copy: "GPT-5.6 verwandelt Konzepte und Irrtümer in interaktive Runden.",
          },
          {
            number: "03",
            title: "Im Wettkampf lernen",
            copy: "Freunde treten per Smartphone bei, während sich das Spiel live anpasst.",
          },
        ]
      : [
          {
            number: "01",
            title: "Drop in your material",
            copy: "Upload a syllabus, chapter, or study guide.",
          },
          {
            number: "02",
            title: "Generate the showdown",
            copy: "GPT-5.6 turns concepts and misconceptions into interactive rounds.",
          },
          {
            number: "03",
            title: "Learn by competing",
            copy: "Friends join on their phones while the game adapts live.",
          },
        ];
  return (
    <main className="min-h-screen overflow-hidden bg-[#080a19] text-white">
      <div className="arena-grid" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <a
          className="flex items-center gap-3 font-black tracking-[-0.03em]"
          href="#top"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffd84d] text-lg text-[#111329] shadow-[0_0_28px_rgba(255,216,77,.25)]">
            S
          </span>
          <span>SYLLABUS SHOWDOWN</span>
        </a>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60 sm:block">
            <Link href="/join">{t("joinGame")}</Link>
          </span>
        </div>
      </nav>

      <section
        id="top"
        className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pt-20"
      >
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8a6cff]/30 bg-[#8a6cff]/10 px-4 py-2 text-sm font-bold text-[#c8bcff]">
            <span className="h-2 w-2 rounded-full bg-[#72f0c5] shadow-[0_0_12px_#72f0c5]" />
            {t("adaptiveLearning")}
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-[-0.055em] sm:text-7xl xl:text-[5.8rem]">
            {t("heroBefore")}{" "}
            <span className="text-gradient">{t("heroAccent")}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-white/62 sm:text-xl">
            {t("heroCopy")}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="rounded-2xl bg-[#ffd84d] px-7 py-4 text-center font-black text-[#111329] shadow-[0_10px_35px_rgba(255,216,77,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffe374]"
            >
              {t("createShowdown")}
            </Link>
            <Link
              href="/demo"
              className="rounded-2xl border border-white/12 bg-white/[.06] px-7 py-4 text-center font-bold text-white transition hover:bg-white/10"
            >
              {t("instantDemo")}
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/38">{t("noAccount")}</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-14 rounded-full bg-[#7655ff]/20 blur-3xl" />
          <div className="relative rotate-[1.5deg] rounded-[2rem] border border-white/12 bg-white/[.07] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="rounded-[1.5rem] border border-white/8 bg-[#10142d] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#72f0c5]">
                    Round 03
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Confidence Battle
                  </h2>
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-[#ff6fae] text-xl font-black">
                  12
                </div>
              </div>
              <p className="mt-8 text-lg font-bold leading-7">
                Which statement best explains why arteries have thicker walls
                than veins?
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  ["A", "Higher pressure", "#54d9ff"],
                  ["B", "More oxygen", "#ff6fae"],
                  ["C", "Faster heartbeat", "#9d7cff"],
                  ["D", "Lower volume", "#ffd84d"],
                ].map(([key, label, color]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-white/8 bg-white/[.055] p-4"
                  >
                    <span
                      className="mb-3 grid h-8 w-8 place-items-center rounded-lg text-sm font-black text-[#10142d]"
                      style={{ backgroundColor: color }}
                    >
                      {key}
                    </span>
                    <span className="text-sm font-bold text-white/78">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#ffd84d]/20 bg-[#ffd84d]/8 px-4 py-3 text-sm text-[#ffe88a]">
                <span>⚡</span>
                <span>High confidence changes what comes next.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Link
        href="/join"
        className="fixed bottom-5 right-5 z-20 rounded-full border border-white/10 bg-[#181d3c]/95 px-5 py-3 text-sm font-black shadow-xl backdrop-blur sm:hidden"
      >
        {t("joinGame")}
      </Link>

      <section className="relative z-10 border-t border-white/8 bg-black/10">
        <div className="mx-auto grid max-w-7xl gap-px px-6 py-16 md:grid-cols-3 lg:px-10">
          {steps.map((step) => (
            <article
              key={step.number}
              className="border-white/8 py-6 md:border-l md:px-8 first:border-l-0 first:pl-0"
            >
              <span className="text-sm font-black tracking-[.2em] text-[#8f78ff]">
                {step.number}
              </span>
              <h3 className="mt-3 text-xl font-black">{step.title}</h3>
              <p className="mt-2 max-w-sm leading-7 text-white/48">
                {step.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
