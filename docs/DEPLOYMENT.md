# Deployment and release gates

## Current topology

- GitHub: canonical versioned source.
- Neon PostgreSQL: target production database; schema migration is in `/migrations`.
- Hatchable: deployed pilot at https://ai-storyboard-studio.hatchable.site, using its own isolated PostgreSQL and auth/AI SDK. The pilot is not yet connected to Neon.

## Pilot deployment

Hatchable project: `proj_Zz3X2AzLtGi2`, version 3. Console: https://hatchable.com/console/projects/ai-storyboard-studio.

The pilot supports email OTP auth, owner-scoped project CRUD, an AI shot-list endpoint through the platform AI gateway, and JSON export. AI generation is currently blocked until the owner configures a supported provider in Hatchable's AI setup. A smoke test confirmed anonymous API rejection (401), signed-in project listing (200), empty-brief validation (400), invalid ID validation (400), and create/read/delete cleanup. A valid synthetic generation request returned 503 because no AI provider key is configured; the UI now falls back to a clearly labeled local template draft. No image-render request was issued.

Deployment v5 reported public visibility and no deploy warnings. Verify signed-out browser access to the login page and all intended routes before announcing a public launch; project tier is still personal and should not be confused with a commercial multi-tenant plan.

## Neon production target

Neon project `shy-shadow-71251136`, branch `br-cool-shadow-b5ozmaxq`, database `neondb`. Tables:
- `storyboard_projects`
- `storyboard_shots`
- `storyboard_generation_jobs`

Migration `migrations/001_initial_storyboard_schema.sql` defines the normalized target schema. The pilot's current JSONB shot storage is not yet ported to this schema. Before switching production traffic, implement and test a server-side adapter and migration/transform that preserves project/shot relationships.

## Required gates before commercial launch

1. **Runtime/database integration:** deploy from this repo and connect to Neon only from the server using a managed secret; confirm pool/connection limits and TLS.
2. **Identity and isolation:** verify every project read/write/delete and every shot/job operation is scoped to the authenticated owner. Add cross-account negative tests.
3. **AI controls:** provider setup check, per-user and per-project rate limits, usage ledger, spend cap, request timeout, retry policy, abuse monitoring, and friendly quota errors.
4. **Paid rendering:** require a fresh explicit approval with provider, estimated price, selected keyframes, and cancellation path. Record approval and actual cost. Never trigger rendering during storyboard text generation.
5. **Quality:** API unit tests, SQL migration checks, browser E2E for sign-up/login, generate, edit, save, reopen, export, and mobile layout.
6. **Operations:** production environment separation, backups and restore rehearsal, logs/alerts, data-retention policy, privacy notice, terms, incident response, and support channel.
7. **Licensing:** keep MIT-0 notice for the upstream skill where required; review every added dependency, model, image/font asset, and provider's commercial terms.
8. **Launch review:** verify the actual public domain and public access from a signed-out browser; never rely on an owner session alone.

## Secrets

Never commit Neon connection strings, model API keys, auth tokens, or customer data. Configure secrets through the hosting platform's secure secret store. Do not put them in `public/`, frontend JavaScript, SQL fixtures, screenshots, or issue reports.
