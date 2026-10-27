# Deployment and security gates

## Connected resources

- GitHub repository: https://github.com/Yudi8377/AI-Storyboard-Studio
- Neon project: `shy-shadow-71251136`
- Neon production branch: `br-cool-shadow-b5ozmaxq`
- Database: `neondb`

## Required before public launch

1. Add a server-side API and authentication.
2. Enforce per-user ownership on every project, shot, and generation-job query.
3. Keep Neon connection strings and AI/render provider credentials in server-side environment variables.
4. Apply SQL migrations through a repeatable migration process.
5. Add tests for authorization, validation, and cross-user access isolation.
6. Configure CI for lint, typecheck, tests, and build.
7. Add provider cost estimates and explicit approval before any paid rendering call.
8. Add rate limits, request-size limits, audit events, and error redaction.
9. Verify end-to-end behavior in a deployed environment before announcing production readiness.

A frontend-only static deployment must never connect directly to Neon with a privileged connection string.
