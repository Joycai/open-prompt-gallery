# Open Prompt Gallery

A self-hosted library for full prompts, reusable prompt pieces, and visual references. Keep your prompt collection organized, searchable, and under your control—without an AI service account or API key.

[Deployment guide](deploy/README.md) · [Contributing](CONTRIBUTING.md) · [Releases](https://github.com/Joycai/open-prompt-gallery/releases) · [Report a bug](https://github.com/Joycai/open-prompt-gallery/issues)

## Features

- **Prompt library:** create, edit, duplicate, and copy full prompts or reusable pieces. Preview Markdown with code blocks, lists, links, and tables; copying preserves the original source.
- **Search and filters:** search titles, text, and tags; combine model, type, and match-all tag filters. Filters stay in the URL and results are paginated.
- **Collections:** organize prompts across models, with prompts belonging to multiple collections. Deleting a collection preserves its prompts.
- **Visual references:** attach multiple images to prompts or collections, choose a cover, reorder images, and browse previews.
- **Model and tag organization:** manage model categories in Settings and reuse tags with keyboard-accessible suggestions.
- **Appearance and language:** Ocean, Forest, and Violet palettes; Light, Dark, and system modes; English and Simplified Chinese.
- **Responsive interface:** desktop and mobile navigation, keyboard focus, and support for reduced motion, reduced transparency, and increased contrast.
- **Self-hosted access:** first-run setup creates one persistent admin account. Store metadata in PostgreSQL and images on your own disk.

This is a single-admin library. It does not generate content, call AI models, or provide multiple user accounts, public sharing links, or password recovery.

## Quick start: local development

Requires Node.js 22+ (Node 24 is used for releases), npm, and Docker with Compose. Podman with a running machine and Compose provider also works; substitute `podman` for `docker`.

```sh
git clone https://github.com/Joycai/open-prompt-gallery.git
cd open-prompt-gallery
npm ci
cp .env.example .env
docker compose -p open-prompt-gallery-dev -f compose.dev.yml up -d
```

Update these values in `.env` to match the development database:

```dotenv
DATABASE_URL=postgresql://gallery:gallery-local-dev@127.0.0.1:5433/gallery
UPLOAD_DIR=./data/uploads
APP_ORIGIN=http://localhost:3000
```

Once PostgreSQL is ready:

```sh
npm run db:migrate
npm run dev
```

Open [localhost:3000](http://localhost:3000) and create the admin password (12–128 characters). The development database and app bind to loopback ports 5433 and 3000 respectively. No demo content is seeded.

For production or a NAS, follow the [deployment guide](deploy/README.md), which covers prebuilt Docker images, Synology Container Manager, Compose, PM2, upgrades, and backups.

## Using the gallery

1. Add a model category in **Settings**.
2. Create a full prompt or reusable piece, then add tags and preview images.
3. Find saved content with search and filters. Use **Copy prompt** to copy its Markdown, or **Create a copy** to start a new entry from it. Add preview images to the copy after saving.
4. Group related prompts into collections, including prompts from different models.
5. Choose your theme and language in **Settings → Appearance & language**. Preferences apply to this browser; saved content is not translated.

Images accept JPEG, PNG, WebP, and AVIF, up to 10 MB and 40 million source pixels per file, with up to 30 images per item. They are converted to WebP within 2400 × 2400 pixels; metadata and animation are removed, and original files are not retained.

## Tech stack

| Layer                 | Technology                                               |
| --------------------- | -------------------------------------------------------- |
| Application           | Next.js 16 App Router, React 19, TypeScript              |
| Data                  | PostgreSQL 17, Postgres.js, versioned SQL migrations     |
| Validation and images | Zod, Sharp                                               |
| UI                    | CSS themes, Lucide icons, React Markdown, remark-gfm     |
| Testing               | Node.js test runner, Playwright, ESLint, TypeScript      |
| Deployment            | Standalone Node.js server, Docker / Podman, Compose, PM2 |

Server Components read PostgreSQL; authenticated Server Actions handle mutations. Image routes enforce the same access checks. PostgreSQL holds library metadata and the admin account; the upload directory holds image files. **Back up both together.**

## Documentation

- [Deployment and operations](deploy/README.md): configuration, authentication, installation, upgrades, backups, and troubleshooting.
- [Contributing](CONTRIBUTING.md): development checks, integration tests, translations, and PR guidance.
- [Release maintenance](docs/RELEASING.md): version tags, draft releases, image archives, and GHCR publishing.
- [Security](SECURITY.md): reporting sensitive issues and deployment boundaries.
- [Design specification](docs/design/DESIGN.md) and [brand guidelines](docs/design/BRAND.md).
- [Original implementation plan](docs/IMPLEMENTATION_PLAN.md) and [implementation history](docs/STATUS.md): historical context, rather than current installation instructions.

## Contributing

Contributions are welcome. Start with the [contribution guide](CONTRIBUTING.md) and use [GitHub Issues](https://github.com/Joycai/open-prompt-gallery/issues) for bugs and feature proposals.

## License

[MIT](LICENSE). The license covers this project’s code; third-party dependencies retain their own licenses. You retain responsibility for the rights to prompts and images you store.
