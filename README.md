# HomeDex

[![Version](https://img.shields.io/badge/version-coming%20soon-lightgrey)](#running-homedex)
[![CI](https://img.shields.io/github/actions/workflow/status/Peteef/HomeDex/ci.yml?branch=master&event=push&label=CI)](https://github.com/Peteef/HomeDex/actions/workflows/ci.yml?query=branch%3Amaster)
![Node.js 26](https://img.shields.io/badge/Node.js-26-5FA04E?logo=nodedotjs&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Docker amd64 and arm64](https://img.shields.io/badge/Docker-amd64%20%7C%20arm64-2496ED?logo=docker&logoColor=white)

**A Pokémon-themed mission control for home and personal life.**

HomeDex is a self-hosted web app that gathers a household's everyday tools in one place. Each person signs in to a home screen of tiles: saved links that open any page on the web, and modules, small apps built into HomeDex. Frequently used tiles are pinned to the top, and quick-find opens any of them in a few keystrokes, on a computer or a phone.

HomeDex is a personal project, built for my own household and run on the home network, never on the public internet.

> **Status:** close to v1.0.0. Everything below works today, but release images are not published yet (see [Running HomeDex](#running-homedex)).

## Features

- **Home screen:** a greeting, quick-find and one grid of tiles, with your pinned tiles first.
- **Link tiles:** add, edit and delete them from the home screen. Each one is shared with everyone or visible only to you.
- **Modules:** small built-in apps that live behind a tile. The first one is a shared shopping list.
- **Quick-find:** type a few letters and press Enter to open the best match. Case and accents are ignored, so "lodz" finds "Łódź".
- **Two languages:** English and Polish, chosen per device. Tile titles and descriptions can be written in each language.
- **At home on every device:** built to feel native on a phone and on a desktop, and installable on the iPhone home screen.
- **Private by design:** accounts are created from the command line, there is no sign-up, and nothing is loaded from outside sites.

## Running HomeDex

HomeDex runs as one Docker container that serves both the app and its API. Its data lives in a `data/` folder next to it. You need [Docker](https://docs.docker.com/get-docker/) with Docker Compose.

> **Before the first release:** the `latest` image does not exist yet, so `docker compose pull` fails. Until then, either [build from source](#building-from-source) or run the preview image of an open pull request by setting `HOMEDEX_VERSION=pr-<number>` in `.env`.

### Install

Create a folder for HomeDex and download the Compose file and the example settings:

```bash
mkdir homedex && cd homedex
curl -fsSLO https://raw.githubusercontent.com/Peteef/HomeDex/master/compose.yaml
curl -fsSL -o .env https://raw.githubusercontent.com/Peteef/HomeDex/master/.env.example
chmod 600 .env
mkdir data
```

On Linux, the container runs as user 1000, so give it the data folder: `sudo chown 1000:1000 data`. Docker Desktop does not need this.

Start it:

```bash
docker compose pull
docker compose up -d
```

HomeDex is now at `http://localhost:3000`. Set `HOMEDEX_VERSION` in `.env` to run a specific version instead of `latest`.

### Create accounts

There is no registration. Create an account for each person (it asks for a username and a hidden password):

```bash
docker compose exec homedex node src/platform/backend/infrastructure/cli/users.ts create
```

The same command takes `list`, `edit <username>`, `archive <username>` and `restore <username>`. They work like the [accounts CLI](#accounts-cli) used in development.

### Use it on your phone

1. Connect the phone to the same Wi-Fi as the computer running HomeDex.
2. Find the computer's local address, for example in your Wi-Fi settings, or with `ipconfig getifaddr en0` on a Mac.
3. Open `http://<address>:3000` in Safari. If the computer asks whether to allow incoming connections, allow them.
4. Tap **Share**, then **Add to Home Screen**. HomeDex then opens full screen with its own icon.

HomeDex runs over plain HTTP on the home network. Keep `COOKIE_SECURE=false` until it is served over HTTPS (see [Configuration](#configuration)).

### Upgrading

Back up first (see below), then:

```bash
docker compose pull
docker compose up -d
```

Database changes are applied automatically when the new version starts, and they only go forward. To roll back, restore the backup and set `HOMEDEX_VERSION` to the previous version.

### Backups

Everything HomeDex stores is in `data/`. Stop the container so the database is written out completely, copy the folder, and start again:

```bash
docker compose stop
mkdir -p backups && cp -R data "backups/data-$(date +%F)"
docker compose start
```

To restore, run `docker compose down`, replace `data/` with a copy, and run `docker compose up -d`. Scheduled backups are not built in yet.

### Building from source

Until release images exist, or to run your own changes, build the image from a clone:

```bash
git clone https://github.com/Peteef/HomeDex.git
cd HomeDex
docker compose up -d --build
```

Settings go in `.env` in the clone (git-ignored). The container uses the clone's `data/` folder, the same one `npm run dev` uses. To upgrade, back up, then run `git pull` and `docker compose up -d --build`.

## Configuration

Settings come from environment variables, read from `.env`. Copy `.env.example` to start. Every setting has a default.

| Variable           | Default    | Meaning                                                                                                                                                                                                                                          |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`             | `3000`     | Port the server listens on                                                                                                                                                                                                                       |
| `HOST`             | `0.0.0.0`  | Address to listen on (all interfaces, so phones can connect)                                                                                                                                                                                     |
| `DATA_DIR`         | `./data`   | Where HomeDex keeps its data, the SQLite database included                                                                                                                                                                                       |
| `ASSETS_DIR`       | `./assets` | Folder with the background art, served at `/media`                                                                                                                                                                                               |
| `COOKIE_SECURE`    | `false`    | `true` only when HomeDex is served over HTTPS. It marks the session cookie `Secure` and turns on HTTPS-only headers. Over plain HTTP that breaks signing in, and Safari shows a blank page                                                       |
| `SESSION_TTL_DAYS` | `365`      | How long a device stays signed in without being used                                                                                                                                                                                             |
| `TRUST_PROXY`      | `0`        | How many reverse proxies sit in front of HomeDex: `0` for none, `1` for one (for example Caddy or Tailscale Serve). HomeDex then sees each client's real address, which the login rate limit relies on. Never set it higher than the real number |
| `HOMEDEX_VERSION`  | `latest`   | Docker Compose only: the image tag to run, such as a version or `pr-<number>` for a pull request preview                                                                                                                                         |

With Docker Compose, `compose.yaml` fixes `DATA_DIR`, `HOST` and `PORT`: the data is always in `data/` next to `compose.yaml`, and the port is changed in its `ports` mapping (`'8080:3000'` serves HomeDex on port 8080).

## Development

You need [nvm](https://github.com/nvm-sh/nvm) (or another way to get Node.js 26) and npm.

```bash
nvm use
npm install
npm run dev
```

Open http://localhost:5173. To try it on a phone, open the "Network" address that Vite prints, on the same Wi-Fi.

To run it the way production does, one process serving the API and the built UI on port 3000:

```bash
npm run build
npm start
```

### Commands

| Command                 | What it does                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Development: Vite on port 5173 and the backend on port 3000, both reload on changes                      |
| `npm run build`         | Builds the UI into `dist/web`                                                                            |
| `npm start`             | Production server (API plus built UI)                                                                    |
| `npm test`              | Unit tests                                                                                               |
| `npm run test:coverage` | Unit tests with a coverage report in `coverage/` (entry points run as child processes show as uncovered) |
| `npm run test:e2e`      | End-to-end tests against the production build (first run: `npx playwright install webkit chromium`)      |
| `npm run users --`      | Accounts CLI (see below)                                                                                 |
| `npm run fix`           | Formats and auto-fixes everything                                                                        |
| `npm run verify`        | Typecheck, lint, format check, unit tests and build. CI runs the same                                    |

### Development test user

To get an account automatically after wiping `data/`, create a `.env.development` file (git-ignored) with a username and password of your choice (at least 8 characters):

```bash
DEV_USERNAME=<username>
DEV_PASSWORD=<password>
```

`npm run dev` then creates this user when the database has no accounts at all, and does nothing otherwise. Only `npm run dev` reads this file. The server refuses to start in production when any variable starting with `DEV_` is set.

### Accounts CLI

Without options, the CLI asks for the values (the password is hidden):

```bash
npm run users -- create
npm run users -- list
npm run users -- edit <username>
npm run users -- archive <username>
npm run users -- restore <username>
```

For scripts, pipe the password in (`printf '%s' "$PASSWORD" | npm run users -- create <username>`). The `--password` option also works, but the password then stays in the shell history, so avoid it outside throwaway setups.

Archiving blocks an account from signing in and signs it out everywhere, but keeps its data. `restore` undoes it, and `list --all` includes archived accounts. Changing a password signs out all of that user's devices. Passwords need at least 8 characters.

### Project layout

```
src/
  platform/    the core: server, app shell, shared UI (frontend/, backend/ and shared/)
  modules/     one folder per module, each with its own UI, API and data
e2e/           end-to-end tests
tests/         tests of the repository itself (lint boundary rules, the module contract)
assets/        background art, loaded at runtime from ASSETS_DIR
```

Unit tests sit in `__tests__/` folders next to the code they test.

### Adding a module

A module is a folder in `src/modules/` with its own pages, API and data. The platform finds it on its own, and removing it means deleting the folder. A module uses only the platform's public API, never the core's internals or another module, and lint enforces this. The guide is in [src/modules/README.md](src/modules/README.md).

### Workflow and CI

Every change is a pull request from a branch; nothing is pushed to `master` directly. Before opening one, `npm run fix` and then `npm run verify` must pass. CI runs `verify`, the end-to-end tests, a secret scan and a Docker build with a smoke test on every pull request. It also publishes a preview image, `ghcr.io/peteef/homedex:pr-<number>`, which is deleted when the pull request closes (unless it is the only tagged image, which GHCR does not allow).

Working rules for AI agents are in [CLAUDE.md](CLAUDE.md).

Dependabot opens weekly pull requests for npm packages and GitHub Actions. Three things are bumped by hand, together: `@playwright/test` in `package.json` with the Playwright image in `.github/workflows/ci.yml` (same version, new digest), and the Node.js image digest in the `Dockerfile`.

## Contributing

HomeDex is a personal project that I develop on my own. Thank you for your interest, but contributions are not needed at the moment. If you spot something odd, feel free to open an issue.

## Disclaimer

HomeDex is a non-commercial fan project. Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc. HomeDex is not affiliated with or endorsed by them.

---

Created by Peteef, 2026.\
よろしくお願いします!
