# HomeDex

## The idea

HomeDex is a private, Pokémon-themed launch pad for home and personal life. Think of a browser start page for personal stuff: a greeting, a quick-find input and a grid of tiles that open links or small modules. Two users, used from PC, laptop and iPhone.

It is a platform first. New tiles and modules are added over time, mostly by prompting an agent, so the core must stay small, clear and easy to extend.

## Principles

- **Simple and lightweight.** No paid services. Prefer popular, well-maintained libraries and justify every new dependency.
- **Modular.** Adding a module never means editing the core.
- **Private.** Never exposed publicly. No registration, two pre-created users.
- **Mobile-first.** It has to feel right on a phone before a desktop.
- **Popular, transferable technology.** This is also a learning project, so choose mainstream tools over exotic ones.

## Tech

- TypeScript in strict mode everywhere. Node.js LTS, pinned in `.nvmrc` and in the Docker image.
- Frontend: React with Vite (build tooling only). Backend: Express with TypeScript, kept simple while the backend is small.
- Storage: SQLite behind a thin storage layer.
- Packaging: one Docker container serving the API and the built UI, built for both x86 and ARM.
- Tooling: npm, Prettier and ESLint, Vitest, Playwright, GitHub Actions.
- One npm package. Modules are folders, not separate packages, for now.

## Code structure

```
platform/               the core: everything generic
  frontend/             app shell, home screen, shared UI components
  backend/              server, accounts, storage layer, module loader
modules/
  <name>/               one folder per module
    manifest            id, name, icon, route, enabled
    frontend/           the module's UI
    backend/            the module's API routes and SQL migrations
```

- **Developing a module never changes `platform/`.** If a module needs something from the core, add it to the platform's public API first, as a separate change.
- **Dependencies point one way.** Modules use only the platform's public API. The platform never imports a module by name and finds modules through their manifests. Modules never import each other. Lint rules enforce this in `verify`.
- **Removing or disabling a module is one action:** delete its folder, or set `enabled: false` in its manifest. Nothing else may reference it.
- **A module owns its data.** Its tables are prefixed with the module name and created by its own migrations. Removing the code leaves the data in place. Deleting data is a separate, deliberate step.
- Generic, reusable UI components live in the platform. UI that belongs to one module stays in that module.

## Architecture guidelines

- Keep route handlers thin and put logic in services, so the web framework can be swapped later.
- All data access goes through the storage layer. No SQL scattered through handlers. Migrations are committed, data is not.
- A tile is either a link or a module, and is shared or personal. Pins are per user.
- Dev and prod differ only through configuration (HTTPS, secure cookies, backups), never through code. Dev runs plain HTTP on the local network.
- The background scene is built in layers (background plus separate sprites) so it can change and be animated later. All art loads from one configurable assets location.

## Security and privacy

- **Never commit user data or secrets:** `data/`, `.env`, SQLite files, password hashes, personal links, tokens. Only `.env.example` with fake values is committed. `.gitignore` covers `data/`, `.env*` (except the example), `*.db` and `*.sqlite*`. Check `git status` before every commit.
- Never put absolute local paths, machine names or personal details in repo files, comments or commit messages. The repo is meant to be public.
- Users are created by a command on first run, never from committed files.
- No home-made crypto. Passwords are stored as salted hashes with a vetted algorithm. Session cookies are `HttpOnly` and `SameSite`, and `Secure` whenever HTTPS is on.
- Do not fetch anything from external sites at runtime (for example icons). Use a built-in icon set.

## UI and theme

- Check every UI change at 375 pt (iPhone 13 mini) and 402 pt (iPhone 17 Pro) wide. Touch targets are large.
- Functional elements sit in a translucent panel over the background scene. Text contrast is at least 4.5:1 on any background.
- Modern 2D style with Pokémon-inspired wording: "Party" for pinned tiles, Dex numbers on entries ("No. 001"), "Dex" for the full tile list.
- Animation is optional polish and respects the "reduce motion" setting.

## Commands

These scripts must exist (creating them is part of project setup):

- `npm run dev`: local development.
- `npm run fix`: formats and auto-fixes everything with Prettier and ESLint. One command, so formatting is never a discussion.
- `npm run verify`: typecheck, lint (including the module boundary rules), format check, unit tests and build. CI runs the same command.
- `npm run test:e2e`: Playwright, including phone viewports.
- A command to create the two users.

## Working practices

- Ask when something is unclear instead of guessing, and do not build beyond what was asked.
- Write tests for new behavior. Never disable or weaken a check to make it pass.
- Run `npm run fix`, then `npm run verify`, before saying work is done.
- Keep commits small and focused.
- Keep this file current: when a decision changes how we build, update it.