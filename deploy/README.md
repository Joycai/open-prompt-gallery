# Install a prebuilt release on Synology / Docker

No Node.js, npm install, or application build is needed on the NAS.

## Option A: Container Manager image import + external PostgreSQL

No Compose project or deployment bundle is required for this option. Download the matching `open-prompt-gallery-VERSION-linux-amd64.tar.gz` (Intel/AMD) or `linux-arm64.tar.gz` (64-bit ARM) from the release, plus `SHA256SUMS`, and verify the checksum. Import the image archive in Container Manager. If your DSM importer requires an uncompressed archive, decompress the `.gz` to a `.tar` first.

1. On your separate PostgreSQL server, create a dedicated user and empty database owned by that user. PostgreSQL 17 is tested. Allow connections from the NAS/container network.
2. Create a persistent NAS folder, for example `/volume1/docker/open-prompt-gallery/uploads`. Grant the container's UID/GID **1000:1000** read/write/traverse access to this folder (including DSM ACLs where applicable).
3. Select the imported image and create a container. Keep its default command. Set automatic restart and map NAS port **3000** to container TCP port **3000** (choose another NAS port if occupied).
4. Add a read/write volume mapping: NAS folder `/volume1/docker/open-prompt-gallery/uploads` → container path `/app/data/uploads`.
5. Add these environment variables in Container Manager:

| Variable         | Example / value                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `DB_URL`         | `postgresql://gallery:YOUR_URL_ENCODED_PASSWORD@192.168.1.100:5432/gallery`                      |
| `APP_PASSWORD`   | Your strong gallery login password                                                               |
| `SESSION_SECRET` | At least 32 random characters; generate with `openssl rand -hex 32`                              |
| `APP_ORIGIN`     | `http://192.168.1.100:3000` — exact URL used in your browser, or your HTTPS reverse proxy origin |
| `UPLOAD_DIR`     | `/app/data/uploads` (already the image default)                                                  |

`DB_URL` takes precedence over the existing `DATABASE_URL` name. Use a database address reachable from the container; `localhost` points to the container itself. The NAS folder is configured under **volume mappings**, not as an environment variable: `UPLOAD_DIR` always names the **container-side** path. Keep internal `PORT=3000` and `HOSTNAME=0.0.0.0` at their image defaults.

Start the container, then open the configured origin and sign in. On startup it checks that the upload directory is writable, applies outstanding migrations, then starts Next.js. A migration failure prevents startup; inspect the container log and check the database address, permissions, and credentials. `RUN_MIGRATIONS=false` is optional only when migrations are run separately (as in the Compose option below).

For upgrades, back up the external database and upload folder together, import a **new version** of the image, stop the old container, and create its replacement with the same environment, port and folder mappings. The new container migrates the existing database automatically. Keep the upload folder and database; do not run old and new containers together during upgrades. Previous releases made before this startup support was added need a new build/tag.

## Option B: Compose with bundled PostgreSQL

1. Download the deployment `.tar.gz`, `SHA256SUMS`, and **one** image archive from the same GitHub release:
   - `linux-amd64`: Intel/AMD 64-bit NAS (`uname -m` reports `x86_64`).
   - `linux-arm64`: 64-bit ARM NAS (`uname -m` reports `aarch64`).
   - 32-bit NAS devices are not supported. The NAS must support Container Manager/Docker.
2. Verify your downloaded files against `SHA256SUMS` (`sha256sum --ignore-missing -c SHA256SUMS` on GNU/Linux, or compare `shasum -a 256` output). Extract the deployment archive into a permanent project folder, such as `/volume1/docker/open-prompt-gallery`.
3. Load the matching image with `docker load -i open-prompt-gallery-VERSION-linux-ARCH.tar.gz`, or use Container Manager's image import. The archive contains the production Next.js standalone server and Linux dependencies, tagged `open-prompt-gallery:VERSION`.
4. Copy `env.example` to `.env`. Keep the supplied `GALLERY_IMAGE` value; set a strong `APP_PASSWORD`, random `SESSION_SECRET` (32+ characters), and URL-safe hex `POSTGRES_PASSWORD`. Set `APP_ORIGIN` to the exact browser origin, including scheme and port. Use HTTPS for access beyond a trusted LAN.
5. Create a Container Manager Project from this folder using `docker-compose.yml`, or run:

   ```sh
   docker compose up -d
   docker compose ps
   docker compose logs app
   ```

The app and migration services use the imported image only (`pull_policy: never`) and cannot build it. PostgreSQL is downloaded separately, so the first deployment needs internet access unless you also preload `postgres:17-alpine`. The `migrate` service exiting with code 0 is expected; the app waits for successful migrations. Named volumes retain the database and uploaded images. Never use `down -v` on a real library.

## Upgrade

Back up PostgreSQL **and** the upload volume together before upgrading. Keep the same project directory/name so Compose reuses the existing volumes. Download and load the new image, then change only `GALLERY_IMAGE` in your existing `.env` to the new release tag; preserve passwords and other settings. Review the new deployment files/release notes for configuration changes.

```sh
docker compose stop app
docker compose run --rm migrate
docker compose up -d --force-recreate app
```

Migrations are versioned and do not reset data. Restore the paired database/upload backup if an upgrade must be rolled back; loading an older app image alone does not undo schema changes.

The container runs as UID/GID 1000. Named volumes need no manual upload-folder setup. If you switch to a bind mount, grant this user write access. CPU/DSM compatibility and reverse proxy setup must be checked on your NAS. See the repository README for backup commands and the separate PM2 deployment path.
