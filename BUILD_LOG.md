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
- Connected generated packs to multiplayer rooms: hosts can preview a validated pack, open a room, and broadcast that exact pack to every player at game start.
- Replaced multiplayer demo scores with Realtime Presence scores, real participant names, answer-completion counts, and a dynamic final ranking.
- Added state recovery: player IDs, scores, answered rounds, and host progress survive reloads in session storage.
- Added a Realtime state-request/state-sync handshake so late joiners and reconnecting players receive the current validated pack and active round from the host.
- Added source evidence to every validated round and surfaced it alongside answer explanations so judges can see that generated questions remain grounded in the uploaded material.
- Added drag-and-drop and file selection for plain-text and Markdown study material with size, type, and length guardrails.
- Added server-side PDF text extraction with page/file limits, encrypted and image-only PDF errors, source metadata, and automatic focusing to the validated 12,000-character generation limit.
- Rebuilt Connection Clash as a three-link concept network with a validated one-to-one answer map, replacing its conventional single-answer multiple-choice interaction.
- Added a multimodal PDF generation path that sends both PDF text and rendered page images to GPT-5.6, enabling scanned-page and diagram understanding with a strict 12-page cost guardrail.
- Added the Visual Map Lab schema foundation for reconstructing a source-grounded system or process as a spatial four-zone learning game.
- Added a regression guard for PDF.js buffer transfer so the same validated upload remains intact when forwarded as a multimodal OpenAI file input.
- Added the validated Sort Reactor round contract: two source-grounded categories, six unique items, and a complete one-to-one assignment key.
- Implemented Sort Reactor as a responsive tap-or-drag classification arena and added it to the deterministic judge demo and multimodal PDF generation flow.

## Verification

- `npm run lint` passes.
- `npm run build` completes successfully with a statically prerendered landing route.
- Production scan test passed: a one-page image-only PDF with zero extractable characters returned HTTP 200 and produced a source-grounded sequence, four-zone Visual Map Lab, confidence misconception, and the diagram's complete arrow loop.
- Production four-round test passed after adding Sort Reactor: the same image-only PDF generated sequence, sort, visual-map, and confidence rounds with two buckets, six items, six validated assignments, four spatial zones, and four diagram links.
- Added the Hotspot Hunt contract and server rendering foundation: the model selects a normalized target on a real PDF page, while the server injects a trusted compressed JPEG instead of accepting model-generated image data.
- Implemented Hotspot Hunt's crosshair interaction on the original PDF page and added a deterministic circulation diagram to the judge demo.
- Added explicit Next.js output tracing for the native Linux canvas binding used by the Vercel PDF rendering function.
- Externalized and traced PDF.js after production diagnostics showed its fake worker path being rewritten inside a Turbopack server chunk.
- Production Hotspot Hunt test passed: an image-only PDF produced all five round types, selected a source-grounded arrow target on page one, returned normalized coordinates and radius, and embedded the original page as a 49 KB JPEG data URL.
- Switched generation to the cost-sensitive GPT-5.6 Luna tier, set PDF vision detail to low, reduced the visual page cap to six, and added token-based per-generation cost estimates using current model rates.
- Extended Visual Map Lab with adaptive body, cell, cycle, and system canvas templates so generated play reconstructs a learning model instead of merely reproducing a source page.
- Added a synchronized three-second challenge reveal between rounds so host-led multiplayer feels like a live game show instead of a sequence of forms.
- Added persistent German/English language selection across the landing page, studio, lobby, and game flow; generated packs now explicitly follow the selected output language.
- Added a locally generated QR invite to every multiplayer lobby so players can join from their phones without typing the room code.
- Gave every round type its own color, icon, glow, progress treatment, and animated stage entrance instead of reusing one generic quiz surface.
- Added synthesized game-show sound cues with a persistent mute control, animated correct/incorrect feedback, confetti, and a true three-place final podium.
- Added a submission-focused roadmap covering production QA, judge assets, video, gallery, story, and final disclosure work.
