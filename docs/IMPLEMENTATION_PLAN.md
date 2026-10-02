# Open Prompt Gallery — implementation plan

> Implementation started and completed on 2026-10-02 after the user asked to start. See [current status and verification](STATUS.md) and [README](../README.md). The handoff below records the earlier design checkpoint.

## Original handoff and state

Recorded 2026-10-02 before the user compacts the session.

- Repository: `/Users/caizhengxu/github/open-prompt-gallery`.
- The repository was empty except for `.git` before these design documents and references were added.
- No application, dependencies, database, containers, or tests have been created or started.
- The user approved the final refined Liquid Glass direction. See [design specification](design/DESIGN.md) and its two checked-in concept images.
- The current request is to save the design and plan only. Do not begin implementation as part of this documentation turn. Resume building when the user asks after compaction.
- Do not ask the user to reapprove the same visual direction.
- No subagents were requested. Follow applicable session/repository instructions when resuming.

## Confirmed requirements

Next.js with PostgreSQL; self-hosted deployment on Synology NAS through Docker Compose and on a VM using PM2 with locally installed PostgreSQL. The user's Mac already has Podman, which may be used for development. Its version, machine status, Compose provider, and database availability have not yet been checked.

The application manages models, full prompts and prompt pieces, tags, groups, and multiple images on prompts and groups. Model management belongs in Settings. This is prompt storage and organization; AI generation and provider API keys are outside the requested scope.

Synology Container Manager supports Compose through its Projects interface: [official documentation](https://kb.synology.com/en-global/DSM/help/ContainerManager/docker_project). The user's exact NAS model, CPU architecture, DSM version, and Container Manager availability are not yet known; verify before producing target-specific deployment instructions.

## Proposed architecture

These are implementation defaults, not additional user requirements:

- Next.js App Router with TypeScript; validate current stable supported package versions when starting.
- PostgreSQL for all application metadata and relationships.
- A migration-capable typed database layer, selected during setup (for example Drizzle); keep database access server-only.
- Uploaded image bytes on a configurable persistent local filesystem path; PostgreSQL stores metadata and relationships. Avoid relying on ephemeral container storage or the source/public directory for uploads.
- One application service plus PostgreSQL in Compose. The VM runs the same application against a configurable `DATABASE_URL` through PM2.
- Use normal Node.js filesystem/database facilities so NAS, Podman, and VM deployments share the same application behavior.
- Apply `apple-design` and relevant Next.js skills during implementation; avoid using Sites hosting because this is an existing repository development task.

## Proposed data model

| Entity | Core data and relationships |
| --- | --- |
| Model | ID, name, optional description, timestamps; has many prompts |
| Prompt | ID, model ID, title, body, type (`full` or `piece`), timestamps |
| Tag | ID, display name, normalized unique name |
| PromptTag | Unique prompt/tag membership |
| Group | ID, name, optional description, timestamps |
| GroupPrompt | Unique group/prompt membership, optional explicit ordering |
| Image | ID, storage key, MIME type, dimensions, byte size, alternative text, timestamps |
| PromptImage | Prompt/image relation, order, cover designation |
| GroupImage | Group/image relation, order, cover designation |

Default proposal: each prompt belongs to one model; groups may contain prompts across models and a prompt may belong to multiple groups. Group images are independent of associated prompt images. Enforce foreign keys and unique memberships; index model, type, tag, and group filters. Prevent model deletion while prompts still reference it, and present a clear reassignment/removal path rather than silently deleting prompts.

## Delivery phases

### 1. Inspect environment and scaffold

- Read applicable repository instructions and relevant skills.
- Check Git state, Node/package manager, Podman and its VM, Compose support, available ports, and environment constraints.
- Establish Next.js/TypeScript, linting, environment validation, database migrations, and `.env.example` without secrets.
- Start a dedicated development PostgreSQL container through Podman when needed; preserve unrelated containers and data.
- Decide authentication/access expectations before production exposure. Work on independent library features while resolving this if necessary.

### 2. Implement the visual shell

- Create shared color, spacing, typography, border, material, and motion tokens.
- Build the responsive sidebar, toolbar, flat buttons, search, filters, segmented control, prompt cards, dialogs, and feedback components.
- Match the accepted library/detail compositions using clearly labeled development fixtures.
- Check desktop and mobile layouts, keyboard navigation, and reduced-motion/transparency fallbacks in a browser.

### 3. Build persistent library features

- Create migrations and server-side input validation.
- Implement model management and full prompt/piece CRUD.
- Implement tag creation/assignment, search, filtering, pagination, and URL-backed filter state.
- Make Copy prompt work with success/failure feedback.
- Implement group CRUD and many-to-many prompt membership.
- Include meaningful empty and error states; avoid fake success indicators or production-only demo data.

### 4. Add image management

- Upload multiple images to prompts and groups, select covers, order images, remove associations, and browse thumbnails/full previews.
- Validate actual image content, allowed formats, file size, and dimensions server-side; generate safe storage keys and prevent path traversal.
- Support cancellation/error feedback and avoid broken database/file references on partial failures.
- Serve images through a controlled route or documented storage mechanism consistent with the eventual access policy.
- Make file cleanup reference-aware and document backing up both PostgreSQL and the upload directory.

### 5. Package both deployment paths

- Multi-stage Dockerfile and Compose configuration with application/database services, health checks, database readiness, persistent database/upload volumes, and environment configuration.
- Document a deliberate migration step for startup/upgrades; do not silently reset or reseed production data.
- Validate under Podman and account for Linux UID/GID permissions and target CPU architecture.
- Synology instructions: folder/volume setup, configuration, Container Manager Project import/build/start, ports, backups, and upgrades.
- VM instructions: supported Node version, PostgreSQL database/user setup, build/migration commands, upload directory permissions, PM2 configuration, startup persistence, logs, and optional reverse proxy.
- Do not publish or deploy to an external host unless requested.

### 6. Validate and hand off

- Typecheck, lint, and production build.
- Meaningful integration tests for persistence, filtering combinations, memberships, model deletion constraints, and image lifecycle.
- Browser checks for model/prompt/group CRUD, multiple images, cover selection, copy action, responsive layouts, keyboard navigation, and failure feedback.
- Confirm persistence across application/container restarts and migration behavior on an existing database.
- Test Compose and PM2 paths where this environment permits; report target-specific checks that could not be run.
- Deliver a README with setup, commands, configuration, deployment, backup/restore, and known limitations.

## Decisions to resolve without blocking independent work

- Access model: single-user private installation versus multiple accounts; whether internet-facing access is intended. Do not assume anonymous write access is acceptable for a public deployment.
- Exact Synology hardware/DSM version for final deployment verification.
- Tag filtering semantics: propose match-all selected tags, clearly represented in the UI.
- Search scope: propose title and prompt body plus tags, combined with model/type/group filters.
- Upload formats and limits: select practical defaults and document them.

## Completion criteria

The app must persist all requested model/prompt/tag/group relationships and images; reproduce the refined visual direction with natural flat controls and restrained glass; work responsively and accessibly; and include verified local execution plus documented Compose and PM2/PostgreSQL deployment paths. Distinguish actual test results from planned or hardware-dependent verification.
