# HomeDex

A private, Pokémon-themed launch pad for home and personal life. Think of a browser start page for personal things: a greeting, a quick-find box and a grid of tiles that open links or small modules.

It is built for two people, used from a PC, a laptop and iPhones, and it is never exposed to the public internet.

> **Status:** early development. The foundation is in place (server, UI shell, tooling, CI). Storage, accounts (with the `users` CLI), the login screen (pick your Trainer, then type the password) and the tiles API (shared and personal link tiles with text per language, pins), the module contract and a tile for every enabled module are in. The home screen shows the real tiles (pinned first, quick-find in the current language), and users add, edit and delete their link tiles there, with text per language. The first module is a shared shopping list (items with an optional amount, checked off into the cart).

## Goals

- **Launch pad first.** Quick to open, quick to find, quick to leave for the thing you need.
- **Modular.** New tiles and modules are added without touching the core.
- **Private and simple.** No registration, no paid services, no secrets in the repository.
- **Mobile-first.** It has to feel right on a phone before a desktop.

## Tech

TypeScript everywhere, running on Node.js 26.

| Part     | Technology                                                                    |
| -------- | ----------------------------------------------------------------------------- |
| Frontend | React, Vite, React Router, TanStack Query, Tailwind CSS, lucide-react icons   |
| UI text  | i18next and react-i18next behind a small `useText` hook, English and Polish   |
| Backend  | Express (runs `.ts` files directly through Node's built-in type stripping)    |
| Tests    | Vitest (unit), Playwright (end-to-end, including iPhone-sized WebKit and axe) |
| Quality  | ESLint, Prettier, husky and lint-staged, GitHub Actions                       |
| Storage  | SQLite (`better-sqlite3`), Argon2id password hashes, cookie sessions          |
| Package  | One Docker image (API and built UI) for amd64 and arm64                       |

## Getting started

You need [nvm](https://github.com/nvm-sh/nvm) (or any way to get Node.js 26) and npm.

```bash
nvm use
npm install
npm run dev
```

Then open http://localhost:5173.

To try it on a phone, connect it to the same Wi-Fi and open `http://<your computer's address>:5173`.

To run it the way production does (one process serving the API and the built UI):

```bash
npm run build
npm start
```

Then open http://localhost:3000.

## Commands

| Command            | What it does                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `npm run dev`      | Development: Vite on port 5173 and the backend on port 3000, both reload (see the test user below)  |
| `npm run build`    | Builds the UI into `dist/web`                                                                       |
| `npm start`        | Production server (API plus built UI)                                                               |
| `npm test`         | Unit tests                                                                                          |
| `npm run test:e2e` | End-to-end tests against the production build (first run: `npx playwright install webkit chromium`) |
| `npm run users --` | Account CLI: `list`, `create`, `edit`, `archive`, `restore` (see below)                             |
| `npm run fix`      | Formats and auto-fixes everything                                                                   |
| `npm run verify`   | Typecheck, lint, format check, unit tests and build. CI runs the same                               |

## Configuration

Settings come from environment variables. Copy `.env.example` to `.env` to change them. All have defaults.

| Variable           | Default    | Meaning                                                          |
| ------------------ | ---------- | ---------------------------------------------------------------- |
| `PORT`             | `3000`     | Port of the backend and of the production server                 |
| `HOST`             | `0.0.0.0`  | Address to listen on (all interfaces, so phones can connect)     |
| `DATA_DIR`         | `./data`   | Where runtime data lives, the SQLite file included (git-ignored) |
| `ASSETS_DIR`       | `./assets` | Folder with all art, served at `/media`                          |
| `COOKIE_SECURE`    | `false`    | Set to `true` once HTTPS is on                                   |
| `SESSION_TTL_DAYS` | `365`      | How long a device stays signed in                                |
| `TRUST_PROXY`      | `false`    | Set to `true` behind a reverse proxy                             |
| `HOMEDEX_VERSION`  | `latest`   | Docker Compose only: the published image version to run          |

## Accounts

**Development test user.** To get an account automatically after you wipe `data/`, create a `.env.development` file (git-ignored) with fake credentials:

```bash
DEV_USERNAME=Tester
DEV_PASSWORD=test12345
```

`npm run dev` then creates this user when the database has no accounts at all, and does nothing otherwise. Without the file, no user is created. Only `npm run dev` reads `.env.development`; it is never part of the Docker image, and the server refuses to start in production when any variable starting with `DEV_` is set: that prefix is reserved for development settings.

There is no registration. Accounts are created with the CLI, which asks for the values (the password is hidden) or takes flags for scripts:

```bash
npm run users -- create
npm run users -- list
npm run users -- edit <username> --password <new password>
npm run users -- archive <username>
```

Archiving blocks an account from logging in and signs it out everywhere, but keeps its data. `restore` undoes it. Changing a password signs out all of that user's devices. Passwords need at least 8 characters.

## Project layout

```
src/
  platform/    the core: server, app shell, shared UI (frontend/, backend/ and shared/)
  modules/     one folder per module, each with its own UI, routes and data
e2e/           end-to-end tests
tests/         tests of the repository itself (lint boundary rules, the module contract)
assets/        placeholder art, loaded at runtime from ASSETS_DIR
```

Unit tests sit in `__tests__/` folders next to the code they test.

The core and the modules are kept apart on purpose: a module can only use the platform's public API, never the core's internals or another module, and lint enforces this. Removing a module means deleting its folder. How to add one: [src/modules/README.md](src/modules/README.md).

## Contributing

Every change is a pull request from a branch, and nothing is pushed to `master` directly. Before opening a PR, `npm run fix` and then `npm run verify` must pass. CI runs `verify`, `e2e`, a secret scan and a Docker build with a smoke test on every PR, and publishes the image to GHCR (`ghcr.io/peteef/homedex`).

Working rules for AI agents are in [CLAUDE.md](CLAUDE.md).
