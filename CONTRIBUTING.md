# Contributing

Bug reports, documentation improvements, translations, and focused code changes are welcome. For a larger feature or architecture change, open an issue first to discuss scope.

## Development setup

Follow the [README quick start](README.md#quick-start-local-development). Use Node.js 22+ (the release workflow uses Node 24), npm, and a disposable PostgreSQL 17 database. Commit dependency changes together with `package-lock.json`.

Read [AGENTS.md](AGENTS.md) before using a coding agent. For Next.js changes, consult the version-matched guides installed under `node_modules/next/dist/docs/` after `npm ci`.

## Checks

From the project root:

```sh
npm run lint
npx next typegen
npm run typecheck
npm test
npm run build
```

`next typegen` generates route types needed on a fresh checkout. `npm test` runs unit checks and skips opt-in database/account suites. For documentation-only changes, check formatting, links, and command accuracy; application builds are not required.

```sh
npx prettier --check README.md CONTRIBUTING.md deploy/README.md docs/RELEASING.md
```

### Integration and browser tests

```sh
npm run test:db            # uses DATABASE_URL; creates/removes dedicated test records
npx playwright install chromium
npm run test:e2e           # set TEST_AUTH_PASSWORD for an initialized test server
```

To check initialization, point `DATABASE_URL` at a freshly migrated disposable database whose name ends in `_auth_test`, then run `RUN_ACCOUNT_TESTS=1 node --env-file-if-exists=.env --import tsx --test tests/account.test.ts`. This suite checks concurrent setup and legacy import and removes its test account. For browser setup checks, start an isolated server against another freshly migrated database with no `APP_PASSWORD`, then run `TEST_FIRST_RUN=1 TEST_BASE_URL=http://127.0.0.1:3003 npx playwright test tests/e2e/setup.spec.ts`. That test initializes the database with the test password `setup-test-password-123`.

The end-to-end test creates uniquely named records. If interrupted, its test records may remain. Do not run it against a production library.

Playwright connects to a running server; it does not start one. Set `TEST_BASE_URL` to that server if it is not `http://localhost:3000`. Use a separate database and upload directory for these checks. Never run integration or browser tests against a production library.

## Pull requests

1. Fork the repository and create a focused branch from `main`.
2. Make the change and update any affected usage or deployment instructions.
3. Run the checks relevant to the change. Add regression coverage for behavior changes.
4. Open a PR describing the problem, resulting behavior, and validation performed. Include screenshots for visual changes and migration/upgrade notes for database changes.

Do not commit `.env`, credentials, database dumps, uploaded images, or generated build output. Keep SQL changes in new versioned files in `migrations/` rather than rewriting migrations already shipped.

## Translations and architecture

Open **Settings → Appearance & language** to choose a palette, display mode, and language. Preferences are saved for one year in cookies for this browser and rendered on the server, so reloads use the same appearance and language. The default is Ocean with System mode and English. Language can also be changed on the login and setup pages. Saved prompts, titles, model names, tags, and descriptions retain their original text.

Themes use semantic CSS variables and the native `light-dark()` color function (current Chrome, Edge, Firefox, and Safari). System mode responds to OS changes without a reload. To add translations, extend the typed catalog in `src/lib/i18n/zh-CN.ts` and the locale selector; interpolation placeholders must match their English source keys.

Server Components read PostgreSQL; authenticated Server Actions handle form mutations. Queries use parameterized `postgres` tagged templates and Zod validates input. SQL migrations run under a PostgreSQL advisory transaction lock. Image upload/serve routes use the same access checks. Images have exactly one owning prompt or group; this simpler ownership avoids shared-file deletion ambiguity while meeting independent image requirements.

See [design specification](docs/design/DESIGN.md), [original plan](docs/IMPLEMENTATION_PLAN.md), and [implementation status](docs/STATUS.md).

## Reporting bugs

Use [GitHub Issues](https://github.com/Joycai/open-prompt-gallery/issues) with reproduction steps, expected and actual behavior, the release/commit, deployment method, and relevant redacted logs. For security-sensitive reports, follow [SECURITY.md](SECURITY.md).

## License

Contributions are provided under the project’s [MIT license](LICENSE).
