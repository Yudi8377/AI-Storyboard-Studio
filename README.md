# AI Storyboard Studio

AI-assisted storyboard planning studio based on the MIT-0 licensed `beatra-ai/ai-storyboard-generator-skill` concept.

## Current status

This repository is being initialized. The GitHub repository was empty at setup time. The connected Neon project is `AI Storyboard Studio`, with a ready `production` branch.

## Product direction

- Indonesian-first, responsive storyboard workspace.
- Turn a brief, script, or campaign idea into a structured shot list.
- Edit scenes, camera framing, visual direction, and narration.
- Export storyboard data as JSON; add PDF/image exports in a later phase.
- Optional image rendering through a provider adapter; never spend paid credits without explicit user approval.
- Keep AI provider credentials on the server, not in browser code.
- Persist projects and shots in PostgreSQL on Neon.

## Architecture target

- Frontend: TypeScript + Vite.
- API: server-side endpoints for project persistence and AI orchestration.
- Database: Neon PostgreSQL.
- Migrations: `migrations/`.
- AI/render providers: adapter interface with explicit cost confirmation before paid rendering.

## Development

The runnable application and CI workflow are the next implementation step. Do not put database URLs, API keys, or provider secrets in source control.

## Licensing

The upstream `beatra-ai/ai-storyboard-generator-skill` repository declares MIT-0. This project must retain its own license notices and separately verify the licenses of any added dependencies, models, fonts, and assets. The upstream skill's license does not grant rights to third-party hosted rendering services or their output policies.
