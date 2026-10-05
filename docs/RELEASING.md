# Releasing Open Prompt Gallery

Maintainer instructions for the [Package release workflow](../.github/workflows/release.yml). For installation, see the [deployment guide](../deploy/README.md).

## Package a release

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

## Publish container images

After the draft assets are ready, the workflow also pushes the checked images to **GitHub Container Registry (`ghcr.io`)** using `GITHUB_TOKEN` with `packages: write`. The version tag supports both Linux AMD64 and ARM64; Docker selects the matching architecture automatically:

```sh
docker pull ghcr.io/joycai/open-prompt-gallery:v0.1.0
```

Replace `v0.1.0` with your release version. Architecture-specific tags (`v0.1.0-amd64` and `v0.1.0-arm64`) are also published. No `latest` tag is updated. Forks publish under their own lowercase `owner/repository` path. Images appear in the owner's **Packages** tab and link to the source repository. Registry publishing happens while the GitHub release is still a draft; rerunning a draft release can replace its image tags.

New GHCR packages default to private. For anonymous pulls, open the package's **Package settings** and change its visibility to public. Otherwise, run `docker login ghcr.io` using your GitHub username and a classic personal access token with `read:packages`. If a package with this name already exists, grant this repository access under the package's **Manage Actions access** settings before running the workflow.

For the bundled Compose deployment, pull the GHCR image first and set `GALLERY_IMAGE=ghcr.io/joycai/open-prompt-gallery:v0.1.0` in `.env`. The bundle uses `pull_policy: never`, so repeat the explicit pull before each upgrade. Image archives can also be imported with `docker load`.
