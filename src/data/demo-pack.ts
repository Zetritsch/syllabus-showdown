import { validateGamePack } from "@/lib/game-pack";

export const demoPack = validateGamePack({
  version: "1.0",
  title: "Cardiovascular Clash",
  subject: "Human Biology",
  sourceLabel: "Chapter 8 · The circulatory system",
  learningGoals: [
    "Trace blood through the heart",
    "Connect vessel structure to function",
    "Distinguish pressure from oxygenation",
  ],
  rounds: [
    {
      id: "blood-flow",
      type: "sequence",
      title: "Sequence Rush",
      concept: "Blood flow",
      points: 600,
      evidence:
        "The right heart pumps oxygen-poor blood to the lungs; the left heart pumps oxygen-rich blood to the body.",
      prompt:
        "Put the stops in order, beginning when oxygen-poor blood enters the heart.",
      items: [
        { id: "lungs", label: "Lungs" },
        { id: "right", label: "Right side of heart" },
        { id: "body", label: "Body tissues" },
        { id: "left", label: "Left side of heart" },
      ],
      correctOrder: ["right", "lungs", "left", "body"],
      explanation:
        "The right heart sends oxygen-poor blood to the lungs; the left heart then sends oxygen-rich blood to the body.",
    },
    {
      id: "vessel-walls",
      type: "connection",
      title: "Connection Clash",
      concept: "Structure and function",
      points: 800,
      evidence:
        "Arteries receive blood under higher pressure and have thicker, more muscular walls than veins.",
      prompt: "Build the vessel map. Connect every structure to its function.",
      leftItems: [
        { id: "artery-wall", label: "Artery · thick muscular wall" },
        { id: "capillary-wall", label: "Capillary · one-cell-thick wall" },
        { id: "vein-valves", label: "Vein · one-way valves" },
      ],
      rightItems: [
        { id: "stop-backflow", label: "Prevents backflow" },
        { id: "withstand-pressure", label: "Withstands high pressure" },
        { id: "rapid-diffusion", label: "Allows rapid diffusion" },
      ],
      correctPairs: [
        { leftId: "artery-wall", rightId: "withstand-pressure" },
        { leftId: "capillary-wall", rightId: "rapid-diffusion" },
        { leftId: "vein-valves", rightId: "stop-backflow" },
      ],
      explanation:
        "Arteries resist pressure, thin capillaries enable exchange, and vein valves stop low-pressure blood from flowing backward.",
    },
    {
      id: "artery-confidence",
      type: "confidence",
      title: "Confidence Battle",
      concept: "Pressure vs. oxygenation",
      points: 1000,
      evidence:
        "Arteries are defined by carrying blood away from the heart, not by oxygen content.",
      prompt: "Why do arteries usually have thicker walls than veins?",
      options: [
        { id: "pressure", label: "They carry blood at higher pressure" },
        { id: "oxygen", label: "They always carry more oxygen" },
        { id: "speed", label: "The heart beats faster near them" },
        { id: "volume", label: "They carry a lower blood volume" },
      ],
      correctOptionId: "pressure",
      misconceptionOptionId: "oxygen",
      misconception:
        "Artery does not mean oxygen-rich. Pulmonary arteries carry oxygen-poor blood.",
      remediation: {
        prompt:
          "Quick comeback: which vessel carries oxygen-poor blood away from the heart?",
        options: [
          { id: "pulmonary-artery", label: "Pulmonary artery" },
          { id: "pulmonary-vein", label: "Pulmonary vein" },
        ],
        correctOptionId: "pulmonary-artery",
        explanation:
          "Vessel names describe direction: arteries go away from the heart, veins return to it.",
      },
      explanation:
        "Wall thickness follows pressure, not oxygen content. Arteries absorb the pressure pulse produced by the heart.",
    },
  ],
});
