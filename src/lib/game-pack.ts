import { z } from "zod";

const baseRound = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  concept: z.string().min(1),
  points: z.number().int().positive(),
  evidence: z.string().min(1),
});

const sequenceRound = baseRound.extend({
  type: z.literal("sequence"),
  prompt: z.string().min(1),
  items: z.array(z.object({ id: z.string(), label: z.string() })).min(3).max(6),
  correctOrder: z.array(z.string()).min(3).max(6),
  explanation: z.string().min(1),
});

const connectionRound = baseRound.extend({
  type: z.literal("connection"),
  prompt: z.string().min(1),
  left: z.string().min(1),
  options: z.array(z.object({ id: z.string(), label: z.string() })).length(4),
  correctOptionId: z.string(),
  explanation: z.string().min(1),
});

const confidenceRound = baseRound.extend({
  type: z.literal("confidence"),
  prompt: z.string().min(1),
  options: z.array(z.object({ id: z.string(), label: z.string() })).length(4),
  correctOptionId: z.string(),
  misconceptionOptionId: z.string(),
  misconception: z.string().min(1),
  remediation: z.object({
    prompt: z.string().min(1),
    options: z.array(z.object({ id: z.string(), label: z.string() })).length(2),
    correctOptionId: z.string(),
    explanation: z.string().min(1),
  }),
  explanation: z.string().min(1),
});

export const gamePackSchema = z.object({
  version: z.literal("1.0"),
  title: z.string().min(1),
  subject: z.string().min(1),
  sourceLabel: z.string().min(1),
  learningGoals: z.array(z.string()).min(1),
  rounds: z.array(z.discriminatedUnion("type", [sequenceRound, connectionRound, confidenceRound])).min(3),
});

export type GamePack = z.infer<typeof gamePackSchema>;
export type GameRound = GamePack["rounds"][number];

export function validateGamePack(input: unknown): GamePack {
  const pack = gamePackSchema.parse(input);
  for (const round of pack.rounds) {
    if (round.type === "sequence") {
      const itemIds = new Set(round.items.map((item) => item.id));
      if (round.correctOrder.length !== round.items.length || round.correctOrder.some((id) => !itemIds.has(id))) {
        throw new Error(`Invalid answer key in round ${round.id}`);
      }
    } else if (!round.options.some((option) => option.id === round.correctOptionId)) {
      throw new Error(`Invalid correct option in round ${round.id}`);
    }
  }
  return pack;
}
