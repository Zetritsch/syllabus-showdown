"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "de";

const messages = {
  en: {
    joinGame: "Join a game",
    adaptiveLearning: "Adaptive multiplayer learning",
    heroBefore: "Turn study material into a",
    heroAccent: "live game show.",
    heroCopy:
      "Upload what you need to learn. Syllabus Showdown builds an adaptive competition your whole study group can play.",
    createShowdown: "Create a showdown",
    instantDemo: "Try instant demo",
    noAccount: "No account needed · Players join by QR code",
    backHome: "Back home",
    language: "Language",
  },
  de: {
    joinGame: "Spiel beitreten",
    adaptiveLearning: "Adaptives Multiplayer-Lernen",
    heroBefore: "Verwandle Lernstoff in eine",
    heroAccent: "Live-Gameshow.",
    heroCopy:
      "Lade hoch, was du lernen musst. Syllabus Showdown baut daraus einen adaptiven Wettkampf für deine ganze Lerngruppe.",
    createShowdown: "Showdown erstellen",
    instantDemo: "Sofort-Demo starten",
    noAccount: "Kein Konto nötig · Beitritt per QR-Code",
    backHome: "Zurück zur Startseite",
    language: "Sprache",
  },
} as const;

type MessageKey = keyof (typeof messages)["en"];
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("showdown:language");
    const browserLanguage = navigator.language.toLowerCase().startsWith("de")
      ? "de"
      : "en";
    const next = stored === "de" || stored === "en" ? stored : browserLanguage;
    queueMicrotask(() => setLanguageState(next));
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        localStorage.setItem("showdown:language", next);
        document.documentElement.lang = next;
      },
      t: (key) => messages[language][key],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
