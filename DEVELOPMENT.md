# DocLatch — Development guide

Technical documentation for anyone developing, testing or releasing DocLatch. For the end-user product description, see [README.md](README.md).

## Stack

- **Frontend**: Vue 3 (Composition API `<script setup>`), TypeScript, SCSS, Pinia, vue-i18n v11
- **Backend**: Tauri 2, Rust
- **Tests**: Vitest (frontend), `cargo test` (backend), ≥ 80% coverage
- **Lint/formatter**: Prettier, SonarQube

Code style conventions (semicolons, `if` formatting, SCSS/Rust rules, folder structure) are defined in [CLAUDE.md](CLAUDE.md).

## Requirements

- Node.js `22.14.0` (the version used in CI, see `.github/workflows/ci.yml`)
- Rust stable (toolchain installed via `rustup`)
- For native Tauri builds: the platform's system prerequisites ([official Tauri guide](https://v2.tauri.app/start/prerequisites/))

## Setup

```bash
npm install
npm run tauri dev   # launches the desktop app in development mode
```

## Main commands

| Command | Description |
|---|---|
| `npm run dev` | Starts only the Vite dev server (without the Tauri shell) |
| `npm run tauri dev` | Launches the full desktop app in development mode |
| `npm run build` | Type-check (`vue-tsc`) + production build of the frontend |
| `npm run tauri build` | Builds the native installers (Windows/Linux/macOS) |
| `npm run test:unit` | Runs the frontend test suite (Vitest) |
| `npm run test:unit:watch` | Frontend test suite in watch mode |
| `npm run test:rust` | Runs the Rust backend tests (`cargo test`) |
| `npm run test:coverage` | Frontend tests with a coverage report |
| `npm run test:coverage:rust` | Backend tests with a coverage report (lcov) |
| `npm run test:coverage:all` | Frontend + backend coverage |
| `npm run format` | Formats the code with Prettier |
| `npm run build:pages` | Generates the GitHub Pages site in `docs/` from `docs/site-content.json` |
| `npm run check:pages` | Verifies `docs/` is already in sync with `docs/site-content.json` (used in CI) |

## Testing and coverage

- Frontend: Vitest + jsdom + Vue Test Utils. Minimum coverage thresholds are configured in `vitest.config.ts` (80% lines/functions/statements, 75% branches).
- Backend: `cargo test` on the `doclatch` crate in `src-tauri/`. Coverage via `cargo llvm-cov`.
- `tests/main.spec.ts` mounts the real app (Pinia + i18n + Vue): under load, with the full suite running in parallel, it can get close to Vitest's default timeout, which is why `testTimeout` is set to 15000ms in `vitest.config.ts`.

## Static analysis (SonarQube)

Configuration in `sonar-project.properties`. Running a local scan requires Docker:

```bash
npm run docker:sonar:up       # start a local SonarQube instance
npm run sonar:coverage        # generate frontend+backend coverage and run the scan
npm run docker:sonar:down     # stop SonarQube
```

## GitHub Pages site

The site's text content (for the 4 locales it/en/fr/de) lives in `docs/site-content.json`. The HTML pages under `docs/{index,it,en,fr,de}/` are **generated** by `scripts/build-pages.cjs` — don't edit them by hand. After changing `docs/site-content.json`:

```bash
npm run build:pages
npm run check:pages   # fails if docs/ is out of date
```

Deployment happens through the `.github/workflows/pages.yml` workflow, triggered on push to `main` (when relevant paths change) or manually from GitHub → Actions → "GitHub Pages" → *Run workflow*.

## Release process

The `.github/workflows/ci.yml` workflow only runs when a `vMAJOR.MINOR.PATCH` tag is pushed (e.g. `v1.0.0`), and:

1. **test** — Rust lint (`cargo fmt`/`clippy`), frontend and backend tests, build, `docs/` verification.
2. **verify-release** — checks that the tag is a valid semver, points to a commit reachable from `main`, that the version matches `package.json`/`tauri.conf.json`, and that `CHANGELOG.txt` has a non-empty section for that version.
3. **build-windows / build-linux / build-macos** — real build of the native installers with `tauri build`.
4. **create-release** — creates a GitHub Release with the installers, SHA-256 checksums and release notes extracted from the changelog.

To publish a release:

1. Bump the version in `package.json` and `src-tauri/tauri.conf.json` (they must match).
2. Add a `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.txt` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format) with the release notes.
3. Commit to `main`.
4. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.

The `scripts/extract-changelog.cjs <version>` script extracts only the changelog section for a given version (used by both `verify-release` and the release notes).
