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
  items: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .min(3)
    .max(6),
  correctOrder: z.array(z.string()).min(3).max(6),
  explanation: z.string().min(1),
});

const connectionRound = baseRound.extend({
  type: z.literal("connection"),
  prompt: z.string().min(1),
  leftItems: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .length(3),
  rightItems: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .length(3),
  correctPairs: z
    .array(
      z.object({
        leftId: z.string().min(1),
        rightId: z.string().min(1),
      }),
    )
    .length(3),
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

const visualMapRound = baseRound.extend({
  type: z.literal("visual-map"),
  prompt: z.string().min(1),
  sceneLabel: z.string().min(1),
  labels: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        glyph: z.string().min(1).max(4),
      }),
    )
    .length(4),
  zones: z
    .array(
      z.object({
        id: z.string().min(1),
        x: z.number().int().min(12).max(88),
        y: z.number().int().min(15).max(85),
        answerId: z.string().min(1),
        hint: z.string().min(1),
      }),
    )
    .length(4),
  links: z
    .array(
      z.object({
        fromZoneId: z.string().min(1),
        toZoneId: z.string().min(1),
      }),
    )
    .min(3)
    .max(5),
  explanation: z.string().min(1),
});

const sortRound = baseRound.extend({
  type: z.literal("sort"),
  prompt: z.string().min(1),
  buckets: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        glyph: z.string().min(1).max(4),
      }),
    )
    .length(2),
  items: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1) }))
    .length(6),
  correctAssignments: z
    .array(
      z.object({
        itemId: z.string().min(1),
        bucketId: z.string().min(1),
      }),
    )
    .length(6),
  explanation: z.string().min(1),
});

const hotspotRound = baseRound.extend({
  type: z.literal("hotspot"),
  prompt: z.string().min(1),
  pageNumber: z.number().int().min(1).max(12),
  pageImageDataUrl: z.string().nullable(),
  target: z.object({
    x: z.number().int().min(5).max(95),
    y: z.number().int().min(5).max(95),
    radius: z.number().int().min(6).max(22),
    label: z.string().min(1),
  }),
  explanation: z.string().min(1),
});

export const gamePackSchema = z.object({
  version: z.literal("1.0"),
  title: z.string().min(1),
  subject: z.string().min(1),
  sourceLabel: z.string().min(1),
  learningGoals: z.array(z.string()).min(1),
  rounds: z
    .array(
      z.discriminatedUnion("type", [
        sequenceRound,
        connectionRound,
        confidenceRound,
        visualMapRound,
        sortRound,
        hotspotRound,
      ]),
    )
    .min(3),
});

export type GamePack = z.infer<typeof gamePackSchema>;
export type GameRound = GamePack["rounds"][number];

export function validateGamePack(input: unknown): GamePack {
  const pack = gamePackSchema.parse(input);
  for (const round of pack.rounds) {
    if (round.type === "sequence") {
      const itemIds = new Set(round.items.map((item) => item.id));
      if (
        round.correctOrder.length !== round.items.length ||
        round.correctOrder.some((id) => !itemIds.has(id))
      ) {
        throw new Error(`Invalid answer key in round ${round.id}`);
      }
    } else if (round.type === "connection") {
      const leftIds = new Set(round.leftItems.map((item) => item.id));
      const rightIds = new Set(round.rightItems.map((item) => item.id));
      const usedLeft = new Set(round.correctPairs.map((pair) => pair.leftId));
      const usedRight = new Set(round.correctPairs.map((pair) => pair.rightId));
      if (
        round.correctPairs.some(
          (pair) => !leftIds.has(pair.leftId) || !rightIds.has(pair.rightId),
        ) ||
        usedLeft.size !== round.leftItems.length ||
        usedRight.size !== round.rightItems.length
      ) {
        throw new Error(`Invalid connection map in round ${round.id}`);
      }
    } else if (round.type === "visual-map") {
      const labelIds = new Set(round.labels.map((label) => label.id));
      const zoneIds = new Set(round.zones.map((zone) => zone.id));
      const answerIds = new Set(round.zones.map((zone) => zone.answerId));
      if (
        answerIds.size !== round.labels.length ||
        round.zones.some((zone) => !labelIds.has(zone.answerId)) ||
        round.links.some(
          (link) =>
            !zoneIds.has(link.fromZoneId) || !zoneIds.has(link.toZoneId),
        )
      ) {
        throw new Error(`Invalid visual map in round ${round.id}`);
      }
    } else if (round.type === "sort") {
      const bucketIds = new Set(round.buckets.map((bucket) => bucket.id));
      const itemIds = new Set(round.items.map((item) => item.id));
      const assignedItems = new Set(
        round.correctAssignments.map((assignment) => assignment.itemId),
      );
      if (
        assignedItems.size !== round.items.length ||
        round.correctAssignments.some(
          (assignment) =>
            !itemIds.has(assignment.itemId) ||
            !bucketIds.has(assignment.bucketId),
        )
      ) {
        throw new Error(`Invalid sort assignments in round ${round.id}`);
      }
    } else if (round.type === "hotspot") {
      if (
        round.pageImageDataUrl !== null &&
        !round.pageImageDataUrl.startsWith("data:image/") &&
        !round.pageImageDataUrl.startsWith("/")
      ) {
        throw new Error(`Invalid hotspot image in round ${round.id}`);
      }
    } else if (
      !round.options.some((option) => option.id === round.correctOptionId)
    ) {
      throw new Error(`Invalid correct option in round ${round.id}`);
    }
  }
  return pack;
}
