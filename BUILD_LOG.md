# Build Week Log

This log distinguishes work completed during OpenAI Build Week 2026 and records how Codex accelerated the implementation.

## 2026-07-17 — Project foundation

- Chose a standalone web experience so judges can test the product without installing an app.
- Defined the core promise: transform source-grounded learning material into an adaptive multiplayer game show.
- Limited the MVP to three genuinely different round types: Sequence Rush, Connection Clash, and Confidence Battle.
- Chose a validated game-pack schema instead of executing model-generated code.
- Decided to generate misconception branches up front so live play remains instant and deterministic.
- Created the repository and initialized the current Next.js, React, TypeScript, and Tailwind stack with Codex.
- Replaced the framework starter with an original responsive landing experience and a visual preview of Confidence Battle.

## Codex contribution

Codex helped narrow the scope, compare delivery architectures, define the technical foundation, scaffold the repository, and implement the initial interface. Product and design direction remained human-steered throughout.

## 2026-07-18 — Playable vertical slice

- Defined and runtime-validated a versioned game-pack schema with Zod.
- Added a deterministic Cardiovascular Clash demo grounded in three learning goals.
- Implemented the complete judge flow: lobby, live scoreboard, three round mechanics, confidence wagering, adaptive misconception branch, remediation challenge, and podium recap.
- Kept the demo independent from OpenAI and Supabase so it remains reliable during judging; generated packs and realtime rooms can plug into the same model next.
- Added a server-only GPT-5.6 Responses API route using Structured Outputs, prompt-injection boundaries, input limits, and a second runtime-validation pass.
- Added an AI Game Studio that accepts source material, generates a custom pack, validates it in the browser, and launches it directly in the same playable engine.
- Added room creation and join flows with shareable six-character codes.
- Added Supabase Realtime Presence for lobby membership and Broadcast for synchronized game start, plus an explicit single-device fallback when realtime configuration is unavailable.
- Extended the room session into gameplay: room identity survives navigation, only the host advances shared rounds, players follow round-change and game-finish broadcasts, and connection state stays visible in the game header.
- Production smoke testing exposed a Vercel timeout with the default GPT-5.6 Sol alias. Switched the latency-sensitive generator to GPT-5.6 Terra with no extra reasoning and a bounded output budget while retaining Structured Outputs and the same validation contract.

## Verification

- `npm run lint` passes.
- `npm run build` completes successfully with a statically prerendered landing route.
