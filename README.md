# Syllabus Showdown

Turn any study material into an adaptive multiplayer game show powered by GPT-5.6.

> Built from scratch for OpenAI Build Week 2026 in the Education track.

## Status

Active hackathon development. The first milestone is a complete, deterministic demo flow before connecting live AI generation and realtime multiplayer.

## Product loop

1. A host uploads a syllabus, chapter, or study guide.
2. GPT-5.6 maps learning goals, concepts, and likely misconceptions.
3. The app generates a validated game pack from reusable round types.
4. Players join using a room code or QR code.
5. Confident wrong answers trigger targeted remediation rounds.
6. The game ends with a podium and a concise learning recap.

## Planned stack

- Next.js, React, TypeScript, and Tailwind CSS
- OpenAI API with GPT-5.6 and structured outputs
- Supabase for rooms, realtime state, and persistence
- Zod for runtime validation
- Vercel for the public demo

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables will be documented in `.env.example`. Never commit real credentials.

## Build Week evidence

The repository was created empty during the submission period. [`BUILD_LOG.md`](./BUILD_LOG.md) records material implementation decisions, Codex contributions, and verification evidence as the project evolves.

## License

MIT — see [`LICENSE`](./LICENSE).
