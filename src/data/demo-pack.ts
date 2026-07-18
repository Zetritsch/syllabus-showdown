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
      id: "organ-assembly",
      type: "visual-map",
      title: "Anatomy Assembly",
      concept: "Place the major organs",
      points: 800,
      evidence:
        "The lungs occupy the chest, the heart sits between them, and the liver and stomach lie below the diaphragm in the upper abdomen.",
      prompt: "Drag every organ into its anatomically correct body zone.",
      sceneLabel: "Human torso model",
      canvasKind: "body",
      labels: [
        { id: "lungs", label: "Lungs", glyph: "🫁" },
        { id: "heart", label: "Heart", glyph: "❤️" },
        { id: "liver", label: "Liver", glyph: "🟤" },
        { id: "stomach", label: "Stomach", glyph: "🥣" },
      ],
      zones: [
        {
          id: "zone-lungs",
          x: 40,
          y: 31,
          answerId: "lungs",
          hint: "Paired organs in the chest",
        },
        {
          id: "zone-heart",
          x: 59,
          y: 41,
          answerId: "heart",
          hint: "Between the lungs",
        },
        {
          id: "zone-liver",
          x: 40,
          y: 55,
          answerId: "liver",
          hint: "Upper right abdomen",
        },
        {
          id: "zone-stomach",
          x: 60,
          y: 62,
          answerId: "stomach",
          hint: "Upper left abdomen",
        },
      ],
      links: [
        { fromZoneId: "zone-lungs", toZoneId: "zone-heart" },
        { fromZoneId: "zone-heart", toZoneId: "zone-liver" },
        { fromZoneId: "zone-heart", toZoneId: "zone-stomach" },
      ],
      explanation:
        "The lungs and heart occupy the chest; the liver and stomach sit below them in opposite sides of the upper abdomen.",
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

export const demoPackDe = validateGamePack({
  ...demoPack,
  title: "Herz-Kreislauf-Showdown",
  subject: "Humanbiologie",
  sourceLabel: "Kapitel 8 · Das Herz-Kreislauf-System",
  learningGoals: [
    "Den Blutfluss durch das Herz verfolgen",
    "Gefäßbau und Funktion verbinden",
    "Druck und Sauerstoffgehalt unterscheiden",
  ],
  rounds: demoPack.rounds.map((round) => {
    switch (round.type) {
      case "sequence":
        return {
          ...round,
          title: "Ablauf-Rush",
          concept: "Blutkreislauf",
          evidence:
            "Die rechte Herzhälfte pumpt sauerstoffarmes Blut zur Lunge; die linke pumpt sauerstoffreiches Blut in den Körper.",
          prompt:
            "Bringe die Stationen in die richtige Reihenfolge. Starte dort, wo sauerstoffarmes Blut ins Herz gelangt.",
          items: [
            { id: "lungs", label: "Lunge" },
            { id: "right", label: "Rechte Herzhälfte" },
            { id: "body", label: "Körpergewebe" },
            { id: "left", label: "Linke Herzhälfte" },
          ],
          explanation:
            "Das rechte Herz schickt sauerstoffarmes Blut zur Lunge. Anschließend pumpt das linke Herz das sauerstoffreiche Blut in den Körper.",
        };
      case "sort":
        return {
          ...round,
          title: "Sortier-Reaktor",
          concept: "Arterien und Venen",
          evidence:
            "Arterien führen Blut unter höherem Druck vom Herzen weg und besitzen dickere Wände; Venen führen es mit Klappen zurück.",
          prompt:
            "Lade beide Reaktoren, indem du jedes Merkmal richtig zuordnest.",
          buckets: [
            { id: "artery", label: "Arterien-Reaktor", glyph: "🔴" },
            { id: "vein", label: "Venen-Reaktor", glyph: "🔵" },
          ],
          items: [
            { id: "away", label: "Führt Blut vom Herzen weg" },
            { id: "toward", label: "Führt Blut zum Herzen zurück" },
            { id: "thick", label: "Dickere Muskelwand" },
            { id: "thin", label: "Dünnere Wand" },
            { id: "pressure", label: "Höherer Druck" },
            { id: "valves", label: "Venenklappen" },
          ],
          explanation:
            "Arterien halten dem hohen Druck vom Herzen stand; Venen unterstützen den Rückfluss mit Klappen.",
        };
      case "hotspot":
        return {
          ...round,
          title: "Hotspot-Jagd",
          concept: "Gasaustausch",
          evidence:
            "In der Lunge nimmt das Blut Sauerstoff auf, bevor es zur linken Herzhälfte zurückkehrt.",
          prompt: "Tippe auf das Organ, in dem Sauerstoff ins Blut gelangt.",
          target: { ...round.target, label: "Lunge" },
          explanation:
            "Der Gasaustausch findet in der Lunge statt: Sauerstoff gelangt ins Blut und Kohlendioxid verlässt es.",
        };
      case "visual-map":
        return {
          ...round,
          title: "Anatomie-Montage",
          concept: "Organe richtig platzieren",
          evidence:
            "Die Lunge liegt im Brustkorb, das Herz zwischen den Lungenflügeln und Leber sowie Magen unterhalb des Zwerchfells.",
          prompt: "Ziehe jedes Organ an seine anatomisch richtige Position.",
          sceneLabel: "Interaktives Körpermodell",
          labels: [
            { id: "lungs", label: "Lunge", glyph: "🫁" },
            { id: "heart", label: "Herz", glyph: "❤️" },
            { id: "liver", label: "Leber", glyph: "🟤" },
            { id: "stomach", label: "Magen", glyph: "🥣" },
          ],
          zones: [
            { ...round.zones[0], hint: "Paariges Organ im Brustkorb" },
            { ...round.zones[1], hint: "Zwischen den Lungenflügeln" },
            { ...round.zones[2], hint: "Rechter Oberbauch" },
            { ...round.zones[3], hint: "Linker Oberbauch" },
          ],
          explanation:
            "Lunge und Herz liegen im Brustkorb; Leber und Magen befinden sich darunter auf gegenüberliegenden Seiten des Oberbauchs.",
        };
      case "confidence":
        return {
          ...round,
          title: "Sicherheits-Duell",
          concept: "Druck oder Sauerstoff?",
          evidence:
            "Arterien sind dadurch definiert, dass sie Blut vom Herzen wegführen – nicht durch den Sauerstoffgehalt.",
          prompt: "Warum haben Arterien meist dickere Wände als Venen?",
          options: [
            {
              id: "pressure",
              label: "Sie transportieren Blut unter höherem Druck",
            },
            { id: "oxygen", label: "Sie transportieren immer mehr Sauerstoff" },
            { id: "speed", label: "Das Herz schlägt in ihrer Nähe schneller" },
            { id: "volume", label: "Sie transportieren weniger Blut" },
          ],
          misconception:
            "Arterie bedeutet nicht sauerstoffreich. Lungenarterien transportieren sauerstoffarmes Blut.",
          remediation: {
            ...round.remediation,
            prompt:
              "Comeback: Welches Gefäß führt sauerstoffarmes Blut vom Herzen weg?",
            options: [
              { id: "pulmonary-artery", label: "Lungenarterie" },
              { id: "pulmonary-vein", label: "Lungenvene" },
            ],
            explanation:
              "Gefäßnamen beschreiben die Richtung: Arterien führen vom Herzen weg, Venen zu ihm zurück.",
          },
          explanation:
            "Die Wandstärke hängt vom Druck ab, nicht vom Sauerstoffgehalt. Arterien fangen die Druckwelle des Herzschlags ab.",
        };
      default:
        return round;
    }
  }),
});
