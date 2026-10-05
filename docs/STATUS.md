# Implementation status

Updated 2026-10-02. The approved design has been implemented; this replaces the initial “documentation only” handoff state.

## Delivered

- Next.js 16.3.8 / React 19.3, TypeScript, PostgreSQL 17, parameterized Postgres.js queries, Zod validation, versioned transactional SQL migrations.
- Responsive library and detail pages following the approved restrained glass direction; flat controls and independent accessibility preference fallbacks.
- Model CRUD, full prompt/piece CRUD, copy, tags, URL-backed combined filters, pagination, group CRUD and memberships across models.
- Multiple independent images for prompts and groups, uploads, full preview, cover selection, ordering, removal, server-side decode/size checks and filesystem cleanup queue.
- Persistent single-admin authentication with first-run setup. Password hashes and session signing secrets live in PostgreSQL; environment passwords are imported once for upgrades. No multi-account or per-user isolation.
- Multi-stage Linux Docker image, production and development Compose files, PM2 standalone launcher, setup/upgrade/backup instructions in the [deployment guide](../deploy/README.md).

## Actual verification

- TypeScript, ESLint, production build: passed.
- Unit / PostgreSQL integration tests: passed (four tests), including constraints, memberships, actual image decoding, independent group image survival, cascade cleanup, invalid file/path rejection.
- Browser workflow on development and production Compose: passed. Covers model/prompt/group creation, prompt editing, combined tags/type filters, upload multiple images, cover persistence, clipboard copy, invalid uploads, image removal, blocked model deletion, and final deletion.
- Desktop 1440 px and mobile 390 px screenshots inspected; horizontal overflow check passed after fixing the hidden upload input.
- Production authentication under isolated PM2: login, wrong password feedback, protected images, HTTP-only cookie, logout and subsequent redirect passed.
- Podman built Linux arm64 image and started full production Compose stack; PostgreSQL readiness and one-shot migration dependency ordering passed. Database and upload markers survived app/database restart and were then removed.
- Migrations rerun successfully against an existing database without resets.
- All npm dependencies audited with no known vulnerabilities after compatible overrides for PM2's transitive dependencies.

## Environment and limitations

- Development app: http://localhost:3000, loopback only; PostgreSQL container uses port 5433 and a named Podman volume.
- No external deployment, commit, or push performed. Development starts with an empty library after removal of test fixtures.
- Podman host: Apple Silicon Mac, Node 24.13, Podman 6.0.2, Compose provider 5.5.1. The original 1.9 GB/no-swap VM stalled during a concurrent rebuild; it was recovered and its memory increased to 4 GB. Tests verify the container path on this host, not Synology hardware or Linux systemd boot persistence.
- Exact NAS model/CPU, DSM version, and access preference are still unspecified. Confirm those before target deployment. Single-owner login is ready; new installations require first-run admin setup.
- Image files are normalized WebP previews; original bytes and animation are not retained. Limits: 10 MB/file, 40 MP input, 2400 px output bounds, 30 images/item.
- Groups can contain prompts across models; each prompt can belong to multiple groups. Images have one owner, rather than a shared image/join model, to simplify reliable cleanup.
- Tags use match-all semantics. Search is case-insensitive and covers titles, bodies, and tags. Group membership editor lists the library; very large-library virtualization is not implemented.
- No AI generation, external model integrations, sharing links, or multiple accounts were added.

## Useful commands

See README for environment setup. `npm run dev`, `npm run test:db`, `npm run test:e2e`, `npm run build`; `podman compose -p open-prompt-gallery-dev -f compose.dev.yml up -d` starts development PostgreSQL.

## Release packaging update

A tag-triggered GitHub Actions workflow now packages Linux AMD64 and ARM64 Docker image archives, prebuilt-only Compose deployment files, and SHA-256 checksums into a draft GitHub release. The app is compiled on GitHub runners; the NAS imports and runs the image. Source-build Compose remains available for development. Workflow lint, YAML parsing, local deployment-bundle assembly, and Compose configuration validation passed. The workflow has not yet been pushed or executed on GitHub; architecture builds in CI remain to be verified on the first version tag.

## Persistent admin setup verification

- First-run setup redirects, password confirmation, authenticated access, and rejection of stale setup submissions passed against an isolated production build.
- Concurrent database initialization creates exactly one admin; legacy environment passwords import once and existing prompt/model data remains intact.
- Login and the full prompt/group/image browser workflow passed after restarting with changed legacy environment values. The persisted password remained valid.
- Password hashing unit checks, lint, TypeScript, and production build passed. Synology hardware was not available for this change's verification.
