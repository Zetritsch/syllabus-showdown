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
      id: "vessel-sort",
      type: "sort",
      title: "Sort Reactor",
      concept: "Arteries vs. veins",
      points: 700,
      evidence:
        "Arteries carry blood away from the heart under higher pressure with thicker walls; veins return lower-pressure blood and use valves.",
      prompt: "Charge both reactors by sorting every vessel feature.",
      buckets: [
        { id: "artery", label: "Artery reactor", glyph: "🔴" },
        { id: "vein", label: "Vein reactor", glyph: "🔵" },
      ],
      items: [
        { id: "away", label: "Carries blood away from heart" },
        { id: "toward", label: "Returns blood toward heart" },
        { id: "thick", label: "Thicker muscular wall" },
        { id: "thin", label: "Thinner wall" },
        { id: "pressure", label: "Higher pressure" },
        { id: "valves", label: "One-way valves" },
      ],
      correctAssignments: [
        { itemId: "away", bucketId: "artery" },
        { itemId: "thick", bucketId: "artery" },
        { itemId: "pressure", bucketId: "artery" },
        { itemId: "toward", bucketId: "vein" },
        { itemId: "thin", bucketId: "vein" },
        { itemId: "valves", bucketId: "vein" },
      ],
      explanation:
        "Arteries handle high-pressure flow away from the heart; veins guide lower-pressure return flow with valves.",
    },
    {
      id: "gas-exchange-hotspot",
      type: "hotspot",
      title: "Hotspot Hunt",
      concept: "Gas exchange",
      points: 850,
      evidence:
        "Blood receives oxygen in the lungs before returning to the left side of the heart.",
      prompt: "Tap the organ where oxygen enters the bloodstream.",
      pageNumber: 1,
      pageImageDataUrl: "/demo-circulation.svg",
      target: {
        x: 73,
        y: 29,
        radius: 18,
        label: "Lungs",
      },
      explanation:
        "Gas exchange occurs in the lungs, where oxygen diffuses into the blood and carbon dioxide leaves it.",
    },
    {
      id: "vessel-walls",
      type: "visual-map",
      title: "Visual Map Lab",
      concept: "Rebuild double circulation",
      points: 800,
      evidence:
        "The right heart sends oxygen-poor blood to the lungs; the left heart then sends oxygen-rich blood to the body.",
      prompt: "Rebuild the circulation map by placing all four stations.",
      sceneLabel: "Heart · lungs · body",
      labels: [
        { id: "right-heart", label: "Right heart", glyph: "💙" },
        { id: "lungs", label: "Lungs", glyph: "🫁" },
        { id: "left-heart", label: "Left heart", glyph: "❤️" },
        { id: "body", label: "Body tissues", glyph: "⚡" },
      ],
      zones: [
        {
          id: "zone-right-heart",
          x: 23,
          y: 25,
          answerId: "right-heart",
          hint: "Receives oxygen-poor blood",
        },
        {
          id: "zone-lungs",
          x: 77,
          y: 25,
          answerId: "lungs",
          hint: "Gas exchange happens here",
        },
        {
          id: "zone-left-heart",
          x: 77,
          y: 75,
          answerId: "left-heart",
          hint: "Pumps oxygen-rich blood",
        },
        {
          id: "zone-body",
          x: 23,
          y: 75,
          answerId: "body",
          hint: "Uses delivered oxygen",
        },
      ],
      links: [
        { fromZoneId: "zone-right-heart", toZoneId: "zone-lungs" },
        { fromZoneId: "zone-lungs", toZoneId: "zone-left-heart" },
        { fromZoneId: "zone-left-heart", toZoneId: "zone-body" },
        { fromZoneId: "zone-body", toZoneId: "zone-right-heart" },
      ],
      explanation:
        "Double circulation forms a loop: right heart → lungs → left heart → body → right heart.",
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
