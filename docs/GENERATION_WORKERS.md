# Independent Image & Video Generation Workers

## Goal

Keep the existing AI Storyboard Studio UI, authentication, storyboard text generation, and project workflow. Move image/video rendering behind a provider-neutral worker interface so a provider outage or quota limit does not break storyboard creation.

This is an architecture and integration contract, not a claim that a GPU worker is already deployed. The Beatra storyboard skill is useful as a workflow reference, but its hosted renders require Beatra credits; it is not the zero-cost rendering backend.

## Current state verified on 2026-10-28

- The Hatchable pilot is live at https://ai-storyboard-studio.hatchable.site.
- Text storyboard generation and project CRUD have passed prior smoke tests.
- The image endpoint `app/api/generate-image.js` exists, but recent requests returned HTTP 429 from the configured provider. Successful image rendering is not yet verified.
- Hatchable-managed persistence/auth and the separately initialized Neon database are not yet connected as one runtime.
- No video-generation endpoint or worker is deployed yet.
- GitHub Actions source validation passed for commit `9aafd5cfc39c0bd19442069531fe8763d0884dc2`.

## Target architecture

```text
Browser UI
  └─ authenticated application API
       ├─ storyboard text provider (current path; keep working)
       └─ generation-job API
            ├─ validates user, prompt, input assets, and consent
            ├─ records queued job and owner
            └─ dispatches to worker adapter
                 ├─ image worker (ComfyUI or compatible open model pipeline)
                 └─ video worker (compatible open video pipeline)
                      └─ object storage → job result/status → UI
```

The app API is the control plane; workers are the GPU execution plane. The browser must never receive provider secrets or connect directly to a GPU worker. Worker authentication should use a server-only secret or signed short-lived requests, with TLS and network restrictions.

## Job API contract

Use a stable provider-neutral schema so the first worker can be replaced without rewriting the UI.

### Submit

`POST /api/generation-jobs`

Request fields:
- `kind`: `image` or `video`
- `prompt`: required string with a server-enforced length limit
- `projectId`: optional project identifier, authorized against the current user
- `inputAssetIds`: optional list of already-uploaded asset IDs; do not accept arbitrary remote URLs without SSRF-safe fetching
- `options`: validated allow-listed options such as aspect ratio, duration, and output count
- `confirmed`: explicit confirmation before a potentially billable external provider is used

Return `202 Accepted` with `jobId`, `status: "queued"`, and a status URL. Do not wait for a long video render in a serverless HTTP request.

### Status

`GET /api/generation-jobs/{jobId}`

Return only a job owned by the authenticated user: `jobId`, `kind`, `status`, `progress` (if available), safe error code/message, timestamps, and output asset metadata. Never return provider tokens, internal worker URLs, stack traces, or raw upstream error payloads.

### State machine

`queued → running → succeeded | failed | cancelled`

- Persist each transition; make updates idempotent.
- Retry only transient failures with bounded exponential backoff and jitter.
- Do not automatically retry invalid prompts, policy failures, or quota/billing failures.
- Set maximum attempts, job timeouts, per-user concurrency, output-size limits, and queue retention.
- Avoid duplicate billing/renders with an idempotency key.
- Keep cancellation best-effort and represent its actual state accurately.

## Worker adapter

A worker accepts a validated job and returns output metadata, not a public arbitrary filesystem path. A worker should:
1. Authenticate the application dispatch.
2. Fetch input assets by short-lived signed URLs or authenticated asset IDs.
3. Validate input MIME types and file sizes.
4. Execute the configured model workflow.
5. Upload outputs to private object storage.
6. Return object keys, MIME types, dimensions/duration, model/workflow version, and measured runtime.
7. Delete temporary files and report sanitized failures.

A ComfyUI-based worker is a practical adapter for open image/video workflows, but individual checkpoints, LoRAs, custom nodes, and workflows have separate licenses and security risks. Pin versions and hashes; do not install arbitrary user-submitted custom nodes in production.

## Storage and privacy

- Store prompts, ownership, status, provider/model identifiers, usage metadata, and output object keys in the database.
- Keep media in private object storage; issue short-lived signed download URLs only after ownership checks.
- Do not store large base64 media in relational rows or log prompts/images by default.
- Apply retention and deletion policies to source uploads, generated media, failed-job artifacts, and logs.
- If user uploads are sent to an external provider, disclose that transfer and obtain the necessary consent.

## Cost and “unlimited” requirement

Open-source code and weights can avoid per-generation API charges only when their licenses permit the intended use and the models run on hardware the operator controls. This is not the same as unlimited free operation: GPU hardware/rental, electricity, storage, bandwidth, and operations still have costs. Do not advertise unlimited free generation unless capacity, fair-use rules, and funding are actually in place.

Recommended initial operating mode:
- Local/self-hosted GPU worker as the preferred provider when available.
- Optional cloud GPU worker disabled by default and used only after explicit cost consent.
- No Beatra dependency in the production render path.
- Clear UI labels for local/open-model rendering versus external paid providers.
- Queue admission and fair-use controls to protect service stability; avoid artificial product caps but enforce infrastructure safety limits.

## Rollout sequence

1. Preserve existing UI and text generation; do not delete the working pilot.
2. Add database-backed generation jobs and ownership/RLS tests in the production runtime.
3. Implement a worker adapter interface and a mock worker for deterministic CI tests.
4. Deploy a secured image worker and validate one consented end-to-end image job.
5. Add a video worker separately after measuring VRAM, latency, output storage, and model license compatibility.
6. Add observability, rate-limit/quota classification, retries, cancellation, backup/restore, and abuse controls.
7. Only then consider switching the production UI from the current synchronous image endpoint to the asynchronous job API.

## Release gates

- [ ] Runtime database connection and migration path are explicit; Hatchable and Neon are not described as connected until verified.
- [ ] Authenticated user cannot read or cancel another user's job.
- [ ] Anonymous submission is rejected.
- [ ] Invalid kind/options/prompt are rejected before queueing.
- [ ] Duplicate submissions are idempotent.
- [ ] Provider quota errors do not loop in automatic retries.
- [ ] Worker has no public unauthenticated endpoint.
- [ ] Outputs are private by default and signed links expire.
- [ ] A real image job completes and output opens successfully.
- [ ] A real video job completes and playback is verified.
- [ ] Model, checkpoint, custom-node, and workflow licenses are reviewed for commercial use.
- [ ] Monitoring, budget guardrails, retention, and restore procedures are exercised.
