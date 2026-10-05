# Deployment guide

Open Prompt Gallery supports prebuilt containers on Docker / Synology, source-built containers, and a Node.js server managed by PM2. It needs PostgreSQL and persistent storage for uploaded images.

| Deployment                                                                         | Use when                                                    |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Container Manager](#option-a-container-manager-image-import--external-postgresql) | You have an external PostgreSQL server and prefer a NAS UI. |
| [Prebuilt Compose](#option-b-compose-with-bundled-postgresql)                      | You want the app and PostgreSQL managed together.           |
| [Source-built Compose](#source-built-compose)                                      | You want to build a checked-out revision yourself.          |
| [VM with PM2](#vm-pm2-and-local-postgresql)                                        | You want to run directly on a Node.js server.               |

For prebuilt containers, no Node.js, npm install, or application build is needed on the host. Download assets from [GitHub Releases](https://github.com/Joycai/open-prompt-gallery/releases). `VERSION` below means your chosen release tag, such as `v0.1.0`; examples do not identify the latest release.

## Before you start

Keep PostgreSQL and uploads on persistent storage, complete first-run setup on a trusted network, and configure HTTPS before public access. Back up both data stores before upgrading. This guide is also included in the release bundle and can be read independently of the source checkout.

## Option A: Container Manager image import + external PostgreSQL

No Compose project or deployment bundle is required for this option. Download the matching `open-prompt-gallery-VERSION-linux-amd64.tar.gz` (Intel/AMD) or `linux-arm64.tar.gz` (64-bit ARM) from the release, plus `SHA256SUMS`, and verify the checksum. Import the image archive in Container Manager. If your DSM importer requires an uncompressed archive, decompress the `.gz` to a `.tar` first.

1. On your separate PostgreSQL server, create a dedicated user and empty database owned by that user. PostgreSQL 17 is tested. Allow connections from the NAS/container network.
2. Create a persistent NAS folder, for example `/volume1/docker/open-prompt-gallery/uploads`. Grant the container's UID/GID **1000:1000** read/write/traverse access to this folder (including DSM ACLs where applicable).
3. Select the imported image and create a container. Keep its default command. Set automatic restart and map NAS port **3000** to container TCP port **3000** (choose another NAS port if occupied).
4. Add a read/write volume mapping: NAS folder `/volume1/docker/open-prompt-gallery/uploads` → container path `/app/data/uploads`.
5. Set these environment variables in Container Manager. The image declares `DB_URL` with an empty default so it can appear in the environment list; fill in your PostgreSQL connection URL. Add it manually if your DSM version does not show empty defaults:

| Variable     | Example / value                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `DB_URL`     | `postgresql://gallery:YOUR_URL_ENCODED_PASSWORD@192.168.1.100:5432/gallery`                      |
| `APP_ORIGIN` | `http://192.168.1.100:3000` — exact URL used in your browser, or your HTTPS reverse proxy origin |
| `UPLOAD_DIR` | `/app/data/uploads` (already the image default)                                                  |

`DB_URL` takes precedence over the existing `DATABASE_URL` name. Use a database address reachable from the container; `localhost` points to the container itself. The NAS folder is configured under **volume mappings**, not as an environment variable: `UPLOAD_DIR` always names the **container-side** path. Keep internal `PORT=3000` and `HOSTNAME=0.0.0.0` at their image defaults.

Start the container, then open the configured origin. On the first visit, create a password for `admin`. The account is stored in PostgreSQL and reused after upgrades; setup cannot replace an existing account. If upgrading with an existing `APP_PASSWORD`, it is imported once and you sign in with that password. Neither `APP_PASSWORD` nor `SESSION_SECRET` is required for new installations. Complete initial setup on a trusted network before public exposure. On startup it checks that the upload directory is writable, applies outstanding migrations, then starts Next.js. A migration failure prevents startup; inspect the container log and check the database address, permissions, and credentials. `RUN_MIGRATIONS=false` is optional only when migrations are run separately (as in the Compose option below).

For upgrades, back up the external database and upload folder together, import a **new version** of the image, stop the old container, and create its replacement with the same environment, port and folder mappings. The new container migrates the existing database automatically. Keep the upload folder and database; do not run old and new containers together during upgrades. Previous releases made before this startup support was added need a new build/tag.

## Option B: Compose with bundled PostgreSQL

1. Download the deployment `.tar.gz`, `SHA256SUMS`, and **one** image archive from the same GitHub release:
   - `linux-amd64`: Intel/AMD 64-bit NAS (`uname -m` reports `x86_64`).
   - `linux-arm64`: 64-bit ARM NAS (`uname -m` reports `aarch64`).
   - 32-bit NAS devices are not supported. The NAS must support Container Manager/Docker.
2. Verify your downloaded files against `SHA256SUMS` (`sha256sum --ignore-missing -c SHA256SUMS` on GNU/Linux, or compare `shasum -a 256` output). Extract the deployment archive into a permanent project folder, such as `/volume1/docker/open-prompt-gallery`.
3. Load the matching image with `docker load -i open-prompt-gallery-VERSION-linux-ARCH.tar.gz`, or use Container Manager's image import. The archive contains the production Next.js standalone server and Linux dependencies, tagged `open-prompt-gallery:VERSION`.
4. Copy `env.example` to `.env`. Keep the supplied `GALLERY_IMAGE` value; set a URL-safe hex `POSTGRES_PASSWORD`. Set `APP_ORIGIN` to the exact browser origin, including scheme and port. Use HTTPS for access beyond a trusted LAN.
5. Create a Container Manager Project from this folder using `docker-compose.yml`, or run:

   ```sh
   docker compose up -d
   docker compose ps
   docker compose logs app
   ```

After startup, open the app and create the admin password if this database has no account yet. Existing accounts remain unchanged.

The app and migration services use the imported image only (`pull_policy: never`) and cannot build it. PostgreSQL is downloaded separately, so the first deployment needs internet access unless you also preload `postgres:17-alpine`. The `migrate` service exiting with code 0 is expected; the app waits for successful migrations. Named volumes retain the database and uploaded images. Never use `down -v` on a real library.

## Upgrade

Back up PostgreSQL **and** the upload volume together before upgrading. Keep the same project directory/name so Compose reuses the existing volumes. Download and load the new image, then change only `GALLERY_IMAGE` in your existing `.env` to the new release tag; preserve passwords and other settings. Review the new deployment files/release notes for configuration changes.

```sh
docker compose stop app
docker compose run --rm migrate
docker compose up -d --force-recreate app
```

Migrations are versioned and do not reset data. Restore the paired database/upload backup if an upgrade must be rolled back; loading an older app image alone does not undo schema changes.

The container runs as UID/GID 1000. Named volumes need no manual upload-folder setup. If you switch to a bind mount, grant this user write access. CPU/DSM compatibility and reverse proxy setup must be checked on your NAS. See the backup commands and PM2 deployment path below.

## Pull from GitHub Container Registry

The release workflow publishes checked images to **GitHub Container Registry (`ghcr.io`)** using `GITHUB_TOKEN` with `packages: write`. The version tag supports both Linux AMD64 and ARM64; Docker selects the matching architecture automatically:

```sh
docker pull ghcr.io/joycai/open-prompt-gallery:v0.1.0
```

Replace `v0.1.0` with your release version. Architecture-specific tags (`v0.1.0-amd64` and `v0.1.0-arm64`) are also published. No `latest` tag is updated. Forks publish under their own lowercase `owner/repository` path. Images appear in the owner's **Packages** tab and link to the source repository. Registry publishing happens while the GitHub release is still a draft; rerunning a draft release can replace its image tags.

New GHCR packages default to private. For anonymous pulls, open the package's **Package settings** and change its visibility to public. Otherwise, run `docker login ghcr.io` using your GitHub username and a classic personal access token with `read:packages`. If a package with this name already exists, grant this repository access under the package's **Manage Actions access** settings before running the workflow.

For the bundled Compose deployment, pull the GHCR image first and set `GALLERY_IMAGE=ghcr.io/joycai/open-prompt-gallery:v0.1.0` in `.env`. The bundle uses `pull_policy: never`, so repeat the explicit pull before each upgrade. Image archives can also be imported with `docker load`.

## Source-built Compose

From a source checkout with Docker and Compose installed:

```sh
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD and the exact public APP_ORIGIN.
docker compose up -d --build
docker compose ps
```

Use a URL-safe random hex database password (for example, generate one with `openssl rand -hex 32`). The root `compose.yml` builds the app; the release bundle’s `docker-compose.yml` only uses prebuilt images. The root configuration binds to `127.0.0.1:3000` by default. Set `BIND_ADDRESS` to your LAN interface if needed and restrict access appropriately. Podman with a Compose provider also works; allocate at least 4 GB RAM to its VM for image builds.

For upgrades, stop the app after taking a backup, update the checkout, run `docker compose build`, then `docker compose run --rm migrate` and `docker compose up -d --force-recreate app`. Keep the project name and existing `.env` so the same volumes and credentials are reused.

## VM: PM2 and local PostgreSQL

Install Node 24 and PostgreSQL 17 using the VM OS package manager. Create a dedicated role and database via `psql` as the database administrator:

```sql
CREATE ROLE gallery LOGIN;
\password gallery
CREATE DATABASE gallery OWNER gallery;
```

Clone the repository and configure `.env` with `DATABASE_URL=postgresql://gallery:YOUR_URL_ENCODED_PASSWORD@127.0.0.1:5432/gallery`, an absolute writable `UPLOAD_DIR` and `APP_ORIGIN`. Keep `.env` readable only by the app's OS user. Run the app as that user:

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

## Access and configuration

| Variable                    | Purpose                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `DB_URL`                    | Container connection URL; takes precedence over `DATABASE_URL`.                                |
| `RUN_MIGRATIONS`            | Container startup automatically migrates; set `false` only when running migrations separately. |
| `DATABASE_URL`              | PostgreSQL connection URL. URL-encode credentials if needed.                                   |
| `UPLOAD_DIR`                | Persistent image directory, relative to app working directory or absolute.                     |
| `APP_ORIGIN`                | Exact externally visible origin, e.g. `https://prompts.example.com`.                           |
| `APP_PASSWORD`              | Optional legacy bootstrap password; imported once if no admin exists, then ignored.            |
| `POSTGRES_PASSWORD`         | Compose database password; use a URL-safe random hex string.                                   |
| `BIND_ADDRESS` / `APP_PORT` | Compose published interface and port; default `127.0.0.1:3000`.                                |

On the first visit, the app asks you to create a password (12–128 characters) for the fixed `admin` account. A salted scrypt hash and a randomly generated session-signing secret are stored in PostgreSQL. Once the account exists, setup is closed, including direct setup submissions. Restarts, image replacements, and migrations preserve the account; existing prompts alone do not count as an initialized account.

For upgrades from environment-based login, an existing `APP_PASSWORD` is imported automatically on first access when no database account exists. Continue signing in with the same password; old sessions must sign in again. After initialization, changing or removing `APP_PASSWORD` does not change the database password. `SESSION_SECRET` and `ALLOW_PRIVATE_NO_AUTH` are no longer used. Installations without a prior password must complete setup, even if they already have prompts. Complete initial setup on your trusted network before exposing a fresh installation publicly.

Sessions last seven days, are HTTP-only, and use secure cookies when `APP_ORIGIN` is HTTPS. Login attempts are limited to 15 failures per 15-minute window for the installation. This remains a single-admin library; additional accounts and password recovery are not included. Back up PostgreSQL to preserve the account along with your library.

Use HTTPS and a reverse proxy for access beyond a trusted network. Configure the proxy to preserve the Host header and pass the public scheme; cap request bodies at 11 MB and apply connection/request limits. Next.js documents self-hosting considerations in its [official guide](https://nextjs.org/docs/app/guides/self-hosting).

## Image storage and backups

Images are validated by decoding the actual content with Sharp, limited to 10 MB and 40 million source pixels, rotated, resized to fit 2400 × 2400, and stored as WebP. JPEG, PNG, WebP, and AVIF are accepted; animation is flattened to the first frame and metadata is stripped. Each item supports up to 30 images. The first image in the order is the cover. Original bytes are not retained.

PostgreSQL stores metadata; `UPLOAD_DIR` stores bytes. **Back up both together.** Stop app writes while taking a consistent pair. Database deletes queue filesystem cleanup transactionally, so a failed unlink can be retried with `npm run storage:cleanup`. A process crash between writing a file and saving its database row can leave an unreferenced file; `npm run storage:cleanup -- --orphans` removes unreferenced WebP files older than 24 hours. Run orphan cleanup only while uploads are stopped.

Example Compose backup, from your deployment project directory (works with the source checkout or release bundle):

```sh
mkdir -p backups
docker compose stop app
docker compose exec -T db pg_dump -U gallery -d gallery -Fc > backups/gallery.dump
docker compose run --rm --no-deps --user root -v "$PWD/backups:/backup" app \
  tar -czf /backup/uploads.tar.gz -C /app/data uploads
docker compose start app
```

For restore, stop the app; restore the database with `pg_restore --clean --if-exists` into the dedicated database and extract the matching upload archive into the upload volume, preserving UID 1000. Run migrations for the deployed version, then start the app. Test recovery on a separate installation before replacing a live library. On a VM use `pg_dump` plus an archive of the absolute upload directory while PM2 is stopped.

## Health checks and troubleshooting

- **Health:** `GET /api/health` returns HTTP 200 with `{"status":"ok"}` when its database query succeeds, or 503 otherwise. This checks database access, not upload-volume writability or backup integrity.
- **App does not start:** inspect `docker compose logs app migrate db` (or container logs for a standalone image). Check database connectivity, credentials, and migration errors. A successful one-shot `migrate` container exits with code 0.
- **Uploads fail:** confirm the container can write as UID/GID 1000, the file is within the supported limits, and the reverse proxy permits 11 MB request bodies.
- **Login or same-origin requests fail:** verify that `APP_ORIGIN` exactly matches the browser origin and the proxy preserves Host and forwards the public scheme. HTTPS cookies require an HTTPS browser connection.
- **Database password changed in `.env`:** PostgreSQL initialization variables only create credentials for an empty data volume. Updating `.env` does not change an existing database role’s password; coordinate the role change with the app connection settings.
- **Image is missing:** the release Compose file uses `pull_policy: never`. Load the archive or explicitly pull the selected GHCR tag before starting or upgrading.
