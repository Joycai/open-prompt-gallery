# Open Prompt Gallery

A self-hosted home for full prompts, reusable prompt pieces, and visual inspiration. Built with Next.js App Router, React, TypeScript, and PostgreSQL, with a restrained Apple-inspired glass interface.

## Features

- Manage model categories in Settings; models in use cannot be deleted.
- Create, edit, copy, and delete full prompts and reusable pieces.
- Search titles, prompt text, and tags; combine model, type, and **match-all** tag filters. Filters live in the URL; results are paginated.
- Collect prompts across models into groups. Deleting a group preserves its prompts.
- Upload multiple independent images to prompts and groups, browse previews, select a cover, reorder, and remove images.
- Responsive desktop/mobile navigation, keyboard focus, native confirmation dialogs, reduced motion/transparency and increased contrast support.
- Optional single-owner password login; no external AI service or API key required.

## Local development with Podman

Requires Node.js 22+ (Node 24 recommended), npm, and Podman with its machine running and a Compose provider. Allocate at least 4 GB RAM to the Podman VM for image builds; a 2 GB VM may stall when building alongside running services. Docker also works; substitute `docker` for `podman`.

```sh
npm ci
cp .env.example .env
podman compose -p open-prompt-gallery-dev -f compose.dev.yml up -d
```

Set `.env` to match the development container:

```dotenv
DATABASE_URL=postgresql://gallery:gallery-local-dev@127.0.0.1:5433/gallery
UPLOAD_DIR=./data/uploads
APP_ORIGIN=http://localhost:3000
```

Then:

```sh
npm run db:migrate
npm run dev
```

Open **http://localhost:3000**. Add a model in Settings, then create a prompt. No demo content is seeded. The development database listens on loopback port 5433; the app listens on loopback port 3000. `APP_ORIGIN` must exactly match the browser origin, including scheme and port, for uploads.

```sh
npm run lint
npm run typecheck
npm test                   # unit checks; database suite skipped
npm run test:db            # uses DATABASE_URL; creates/removes dedicated test records
npx playwright install chromium
npm run test:e2e           # run against the local dev server, no login configured
npm run build
```

The end-to-end test creates uniquely named records. If interrupted, its test records may remain. Do not run it against a production library.

## Access and configuration

| Variable                    | Purpose                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `DB_URL`                    | Container connection URL; takes precedence over `DATABASE_URL`.                                   |
| `RUN_MIGRATIONS`            | Container startup automatically migrates; set `false` only when running migrations separately.    |
| `DATABASE_URL`              | PostgreSQL connection URL. URL-encode credentials if needed.                                      |
| `UPLOAD_DIR`                | Persistent image directory, relative to app working directory or absolute.                        |
| `APP_ORIGIN`                | Exact externally visible origin, e.g. `https://prompts.example.com`.                              |
| `APP_PASSWORD`              | Single-owner password. Leave empty only in development or explicitly private mode.                |
| `SESSION_SECRET`            | At least 32 random characters when login is enabled. Rotate to invalidate all sessions.           |
| `ALLOW_PRIVATE_NO_AUTH`     | Set to `true` to explicitly allow unauthenticated production access on a trusted private network. |
| `POSTGRES_PASSWORD`         | Compose database password; use a URL-safe random hex string.                                      |
| `BIND_ADDRESS` / `APP_PORT` | Compose published interface and port; default `127.0.0.1:3000`.                                   |

Production fails closed without a password or explicit private mode. Configure a strong password and generate a session secret with `openssl rand -hex 32`. Sessions last seven days, are HTTP-only, and use secure cookies when `APP_ORIGIN` is HTTPS. Login attempts are limited to 15 failures per 15-minute window for the installation. This is a shared single-owner library, not a multi-tenant account system.

Use HTTPS and a reverse proxy for access beyond a trusted network. Configure the proxy to preserve the Host header and pass the public scheme; cap request bodies at 11 MB and apply connection/request limits. Next.js documents self-hosting considerations in its [official guide](https://nextjs.org/docs/app/guides/self-hosting).

## Releases and prebuilt NAS deployment

Push a version tag such as `v0.1.0` after committing the application and workflow:

```sh
git tag v0.1.0
git push origin v0.1.0
```

You can also open **Actions → Package release → Run workflow**, choose a branch, and enter a version such as `v0.1.0`. If the tag already exists, that tagged commit is built; otherwise the selected branch commit is built and the tag is created with the draft release after packaging succeeds. All jobs use the same resolved commit.

The **Package release** GitHub Actions workflow validates the code and builds production Docker images for Linux AMD64 and ARM64. It creates a **draft GitHub release** with:

- `open-prompt-gallery-v0.1.0-linux-amd64.tar.gz`
- `open-prompt-gallery-v0.1.0-linux-arm64.tar.gz`
- `open-prompt-gallery-v0.1.0-deploy.tar.gz` (Compose, environment template, installation instructions)
- `SHA256SUMS`

Review the assets, then publish the draft in GitHub. No registry account or additional secret is needed; the workflow uses the repository's automatic `GITHUB_TOKEN`. Actions must be enabled and permitted to use the listed Docker/GitHub actions. Failed jobs can be rerun while the release is a draft; published release assets are never overwritten. Use a new version tag for updates. Tag versions are authoritative for image names; keep `package.json` version in sync when cutting releases.

**Standalone Container Manager deployment (external PostgreSQL):** import the image archive for your NAS CPU, create a container with `DB_URL`, `APP_PASSWORD`, `SESSION_SECRET`, and `APP_ORIGIN`, map NAS port 3000 to container port 3000, and mount a writable NAS folder at `/app/data/uploads`. The image automatically runs database migrations before starting the app. No Compose file is needed. See [the step-by-step Container Manager guide](deploy/README.md#option-a-container-manager-image-import--external-postgresql), including folder permissions and upgrade instructions.

**Optional Compose deployment (bundled PostgreSQL):** On the NAS, download the deployment bundle and the image for its CPU, verify checksums, extract the bundle, and import the image:

```sh
docker load -i open-prompt-gallery-v0.1.0-linux-amd64.tar.gz
cp env.example .env
# Edit .env: passwords, session secret, and the exact public APP_ORIGIN.
docker compose up -d
```

Use the bundle's `docker-compose.yml` in Synology Container Manager → Project. It has **no build instructions** and uses the imported app image. PostgreSQL is pulled separately. The database becomes healthy, migrations run, then the app starts. Named volumes retain the database and uploads. Detailed setup and upgrade steps are in [deploy/README.md](deploy/README.md).

Synology Container Manager supports Compose through [Projects](https://kb.synology.com/en-global/DSM/help/ContainerManager/docker_project). NAS CPU/DSM compatibility remains target-specific; 32-bit NAS devices are not supported by these releases. The supplied images contain Linux dependencies, so no Mac build artifacts are copied to the NAS. Building happens on GitHub runners, not during NAS startup.

For local source-image development only, the repository's root `compose.yml` retains `build: .`; use `docker compose up -d --build` or `podman compose up -d --build`. Do not confuse it with the release bundle's prebuilt-only `docker-compose.yml`. Keep the same Compose project name when upgrading an existing installation so its volumes are reused. Never use `down -v` on a real library.

## VM: PM2 and local PostgreSQL

Install Node 24 and PostgreSQL 17 using the VM OS package manager. Create a dedicated role and database via `psql` as the database administrator:

```sql
CREATE ROLE gallery LOGIN;
\password gallery
CREATE DATABASE gallery OWNER gallery;
```

Clone the repository and configure `.env` with `DATABASE_URL=postgresql://gallery:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/gallery`, an absolute writable `UPLOAD_DIR`, `APP_ORIGIN`, `APP_PASSWORD`, and `SESSION_SECRET`. Keep `.env` readable only by the app's OS user. Run the app as that user:

```sh
npm ci
npm run db:migrate
npm run build
npx pm2 start ecosystem.config.cjs
npx pm2 save
npx pm2 startup
# Execute the OS-specific command printed by PM2 to enable boot persistence.
npx pm2 logs open-prompt-gallery
```

PM2 is included as a development/operations dependency; keep dev dependencies on this VM. The supplied config runs one process and binds to `127.0.0.1:3000`, intended for a local reverse proxy. The launcher loads `.env` from the project root and resolves uploads outside the build directory. To use another port, set `PORT` in the PM2 config. Set a VM reverse proxy upload limit of 11 MB (e.g. nginx `client_max_body_size 11m;`), preserve Host and forwarding headers, and use HTTPS.

For upgrades: back up, stop the app, update code, run `npm ci`, migrate, build, then `npx pm2 restart ecosystem.config.cjs --update-env`. PM2 execution is checked locally; Linux service startup and your VM's PostgreSQL installation require target-host verification.

## Image storage and backups

Images are validated by decoding the actual content with Sharp, limited to 10 MB and 40 million source pixels, rotated, resized to fit 2400 × 2400, and stored as WebP. JPEG, PNG, WebP, and AVIF are accepted; animation is flattened to the first frame and metadata is stripped. Each item supports up to 30 images. The first image in the order is the cover. Original bytes are not retained.

PostgreSQL stores metadata; `UPLOAD_DIR` stores bytes. **Back up both together.** Stop app writes while taking a consistent pair. Database deletes queue filesystem cleanup transactionally, so a failed unlink can be retried with `npm run storage:cleanup`. A process crash between writing a file and saving its database row can leave an unreferenced file; `npm run storage:cleanup -- --orphans` removes unreferenced WebP files older than 24 hours. Run orphan cleanup only while uploads are stopped.

Example Compose backup, from the repository directory:

```sh
mkdir -p backups
docker compose stop app
docker compose exec -T db pg_dump -U gallery -d gallery -Fc > backups/gallery.dump
docker compose run --rm --no-deps --user root -v "$PWD/backups:/backup" app \
  tar -czf /backup/uploads.tar.gz -C /app/data uploads
docker compose start app
```

For restore, stop the app; restore the database with `pg_restore --clean --if-exists` into the dedicated database and extract the matching upload archive into the upload volume, preserving UID 1000. Run migrations for the deployed version, then start the app. Test recovery on a separate installation before replacing a live library. On a VM use `pg_dump` plus an archive of the absolute upload directory while PM2 is stopped.

## Architecture

Server Components read PostgreSQL; authenticated Server Actions handle form mutations. Queries use parameterized `postgres` tagged templates and Zod validates input. SQL migrations run under a PostgreSQL advisory transaction lock. Image upload/serve routes use the same access checks. Images have exactly one owning prompt or group; this simpler ownership avoids shared-file deletion ambiguity while meeting independent image requirements.

See [design specification](docs/design/DESIGN.md), [original plan](docs/IMPLEMENTATION_PLAN.md), and [implementation status](docs/STATUS.md).
