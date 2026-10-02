# Install a prebuilt release on Synology / Docker

No Node.js, npm install, or application build is needed on the NAS.

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
