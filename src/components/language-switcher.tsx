"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      className="inline-flex rounded-full border border-white/10 bg-white/[.06] p-1"
      aria-label={t("language")}
    >
      {(["de", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          aria-pressed={language === option}
          className={`rounded-full px-2.5 py-1 text-[11px] font-black transition ${language === option ? "bg-[#ffd84d] text-[#101329]" : "text-white/45 hover:text-white"}`}
        >
          {compact
            ? option.toUpperCase()
            : option === "de"
              ? "Deutsch"
              : "English"}
        </button>
      ))}
    </div>
  );
}
