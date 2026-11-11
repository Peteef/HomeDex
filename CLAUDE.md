# HomeDex

## The idea

HomeDex is a private, Pokémon-themed launch pad for home and personal life. Think of a browser start page for personal stuff: a greeting, a quick-find input and a grid of tiles that open links or small modules. Two users (more are possible), used from PC, laptop and iPhone.

It is a platform first. New tiles and modules are added over time, mostly by prompting an agent, so the core must stay small, clear and easy to extend.

## Principles

- **Simple and lightweight.** No paid services. Prefer popular, well-maintained libraries and justify every new dependency.
- **Modular.** Adding a module never means editing the core.
- **Private.** Never exposed publicly. No registration, accounts are created with the CLI.
- **Mobile-first.** It has to feel right on a phone before a desktop.
- **Popular, transferable technology.** This is also a learning project, so choose mainstream tools over exotic ones.

## Commands

If a script below does not exist yet, creating it is part of project setup.

- `npm run dev`: local development. Vite on port 5173 (open this one, also from a phone on the LAN) and the backend on port 3000 with auto-restart. It first runs `scripts/dev-user.ts`, which creates a test user from `DEV_USERNAME` and `DEV_PASSWORD` in `.env.development` when they are set and the database has no accounts.
- `npm run build`: builds the UI to `dist/web`. `npm start`: production server (API plus built UI).
- `npm test`: unit tests (Vitest).
- `npm run test:e2e`: Playwright end-to-end tests, including phone viewports.
- `npm run fix`: formats and auto-fixes everything with Prettier and ESLint. One command, so formatting is never a discussion.
- `npm run verify`: typecheck, lint (including the module boundary rules), format check, unit tests and build. CI runs the same command.
- `npm run users -- list | create | edit | remove`: the account CLI. There is no registration and no artificial limit on accounts.

## Tech

- TypeScript in strict mode everywhere, with `erasableSyntaxOnly`. Node.js LTS, pinned in `.nvmrc` and in the Docker image.
- The backend runs `.ts` files directly with Node's native type stripping, so there is no backend build step. Use `import type`, write relative imports with the `.ts` extension, and avoid enums and namespaces.
- Frontend: React with Vite (build tooling only), React Router, TanStack Query, Tailwind CSS 4, `lucide-react` as the built-in icon set, and `i18next` with `react-i18next` for UI text. Backend: Express with TypeScript, kept simple while the backend is small. `zod` validates config, requests and manifests.
- Storage: SQLite (`better-sqlite3`) behind a thin storage layer.
- Public APIs are package.json `imports` aliases: `#platform/backend`, `#platform/frontend` and `#platform/shared` (each a `public-api/index.ts`). Modules import the platform only through them, and only what the contract needs is exported: add to a public API when a module needs it, never in advance.
- Packaging: one Docker container serving the API and the built UI, built for both x86 and ARM.
- Tooling: npm, Prettier and ESLint, Vitest, Playwright, GitHub Actions.
- One npm package. Modules are folders, not separate packages, for now.

## Code structure

```
src/                    all application code
  platform/             the core: everything generic
    frontend/           components/ (generic, pure), pages/ (route screens), features/ (logic per area),
                        lib/ (generic utilities), locales/ (UI text), app skeleton, public-api/
    backend/            domain/ (logic per area), routes/ (HTTP endpoints), infrastructure/, public-api/
    shared/             what frontend and backend both use (HTTP status codes, icon names, the module
                        manifest schema), public-api/; imports neither
  modules/              one folder per module, laid out like the platform (see src/modules/README.md)
    <id>/
      manifest.ts       defineModule({ id, name, icon, route, enabled, ... })
      frontend/         index.tsx (the module's page), pages/, components/, features/, locales/
      backend/          index.ts (register(ctx)), domain/, routes/, migrations/
e2e/                    Playwright end-to-end tests
tests/                  tests of the repository itself, such as the lint boundary rules
assets/                 placeholder art, loaded at runtime from ASSETS_DIR
```

- **Unit tests live in a `__tests__/` folder next to the code they test**, created only where tests exist, so a module's tests stay inside the module. Test files are named `*.test.ts(x)`.
- **Test names** read `should X` or `should X when Y [and Z]`, for example `it('should reject the login when the password is wrong')`. `describe` names the unit under test; nest one `describe` per function tested when the file tests several (`describe('accounts service')` > `describe('create')`).
- **Tests follow Given, When, Then**, marked with `// Given`, `// When` and `// Then` comments; join them (`// When / Then`) or skip one when it is empty.
- **Tests never shape production code.** Never export a function, constant or type only so a test can use it, just as you would not make a Java method public for a test. Test through what the code already exposes (the public function, the rendered component, the HTTP endpoint), and write expected values in the test literally.

- **Developing a module never changes `platform/`.** If a module needs something from the core, add it to the platform's public API first, as a separate change.
- **Dependencies point one way.** Modules use only the platform's public API. The platform never imports a module by name and finds modules through their manifests. Modules never import each other. Lint rules enforce this in `verify`.
- **Removing or disabling a module is one action:** delete its folder, or set `enabled: false` in its manifest. Nothing else may reference it.
- **A module owns its data.** Its tables are prefixed with the module name and created by its own migrations. Removing the code leaves the data in place. Deleting data is a separate, deliberate step.
- Backend layout: `domain/<name>/` holds the logic of one area (accounts, auth) behind an `index.ts`, the only file other code may import; it exports the service factory, its interface and the models. Repositories and helpers live in the domain's `internal/` folder and define how a use case uses the database. `domain/services.ts` is the domain layer's single entrypoint: it wires the domains together for the server and the CLI. `routes/` holds every HTTP endpoint, one file per resource with its own paths, thin: validate, call a domain service, shape the response. `infrastructure/` holds the technical side: Express plumbing (guards, error handler, cookies, rate limit), storage (connection, migrations), the module loader (`modules/`), config, logger, the CLI, `app.ts` and `main.ts`. Domains use infrastructure only through `infrastructure/storage/index.ts` and never import routes or each other's internals; lint enforces this. To add a domain, extend `DOMAINS` in `eslint.config.js`. Factories are named after what they build (`accountsService()`, not `createAccountsService()`).
- Functions are arrow functions assigned to `const`, never `function` declarations or expressions; lint enforces it. Class and object methods are fine. An arrow function whose body is a single expression uses the concise form, with no braces and no `return` (`=> expr`); lint enforces it. `if`, `else` and loops always keep their braces. A statement spanning several lines (a block, a multi-line declaration or call) has a blank line before and after it; lint enforces it and `npm run fix` adds them.
- A factory defines small single-purpose functions and ends with `return { create, list, ... }` of function references, never inline functions. A returned object with several properties is written one property per line; lint enforces it. Prefer several small functions over one long one.
- Expected domain failures are thrown as `Error` subclasses (for example `AccountError`) and caught at the edge (route, CLI). Optional input is `field?: T`; a stored value that can be empty is `T | null`, mapped directly from the database.
- Types stay in the file that owns them. The interface of what a file exports (a service, a repository) stays next to its implementation. Model types shared by several files of a folder (a domain, a feature, a page) move to `types.ts` in that folder (error classes to `errors.ts`). This applies to the frontend too; component prop types stay with their component. Internal shapes, such as a database row, stay with their code. No global `types.ts`.
- Frontend layout (`platform/frontend/`): `components/<name>/` holds generic, reusable components, one folder each with only its own files (component, tests, helpers). `pages/<name>/` holds one screen: the page component, its hooks, data and helpers, and in `pages/<name>/components/` the components only that page uses. Those are pure like the generic ones; a component two pages need moves to `components/`. `features/<name>/` holds the logic of one area (hooks, data access, state; today `auth`: session, login, logout, `useCurrentUser`, the account list and the remembered account; and `modules`: the module pages found through their manifests) and `lib/<name>/` generic utilities (today `http`: the API client, which always sends `Content-Type: application/json` on writes). Both are used only through their `index.ts`, with private files in `internal/`, like backend domains. `App.tsx`, `AppLayout.tsx`, `RequireAuth.tsx` (route guard), `i18n.ts`, `queryClient.ts`, `routes.ts` and `sceneLayers.ts` are the app skeleton at the base. Dependencies point one way: components import none of pages, features, libs or the skeleton; libs import no features or pages; features import no pages. Lint enforces all of it (to add a feature or lib, extend `FRONTEND_FEATURES` or `FRONTEND_LIBS` in `eslint.config.js`). A 401 from any request ends the session, and the guard sends the user to the login page. UI that belongs to one module stays in that module.
- Components are pure: everything comes in through props, with no data fetching, business logic or global state (local UI state such as an open menu is fine). The one exception is `useTranslation()`: the language is ambient, like the theme. Pages own the logic, through hooks for anything reusable, and compose components. There is no separate container layer: the page is the container.

## Architecture guidelines

- Code documents itself through clear names and structure. Write a comment only for what the code cannot say: a hidden constraint, a workaround, surprising behaviour, a non-obvious decision. Remove redundant comments when you see them. The Given, When, Then markers in tests are the exception.
- Name your own paths, defaults, file names, ports and messages as constants instead of repeating inline strings or numbers. Library-defined names, route paths in `routes/` and the expected values in tests stay literal. HTTP status codes are the named constants of `src/platform/shared/http/status.ts`, used by both sides, imported directly (`BAD_REQUEST`, not `HTTP_STATUS.BAD_REQUEST`).
- Keep route handlers thin and put logic in services, so the web framework can be swapped later.
- Until the owner says the app is live, migrations are edited in place and the data folder is reset; after that, only new migrations.
- All data access goes through the storage layer. No SQL scattered through handlers. Migrations are committed, data is not.
- A tile is either a link or a module, and is shared or personal. Pins are per user.
- Dev and prod differ only through configuration (HTTPS, secure cookies, backups), never through code. Dev runs plain HTTP on the local network. HTTPS-only headers (HSTS, `upgrade-insecure-requests`) follow `COOKIE_SECURE`, because they break plain HTTP in Safari.
- The background scene is built in layers (background plus separate sprites) so it can change and be animated later. All art loads from one configurable assets location.

## Security and privacy

- **Never commit user data or secrets:** `data/`, `.env`, SQLite files, password hashes, personal links, tokens. Only `.env.example` with fake values is committed. Check `git status` before every commit and review your diff for these before every push.
- Never put absolute local paths, machine names or personal details in repo files, comments or commit messages. The repo is meant to be public.
- Tests, fixtures and examples use fake data only.
- Accounts are created by the CLI, never from committed files. The development test user is the only automatic account: its credentials live in the git-ignored `.env.development`, only `npm run dev` creates it, `scripts/` is kept out of the Docker image (the smoke test checks it), and the server refuses to start in production when any `DEV_*` variable is set (the prefix is reserved for development; `infrastructure/devConfig.ts`).
- The login page lists the usernames of active accounts without a session (`GET /api/auth/accounts`): pick your account, then type the password. The device remembers only the last username, in `localStorage`; the session stays in the `HttpOnly` cookie.
- No home-made crypto. Passwords are stored as salted hashes with a vetted algorithm. Session cookies are `HttpOnly` and `SameSite`, and `Secure` whenever HTTPS is on.
- Do not fetch anything from external sites at runtime (for example icons). Use a built-in icon set.

## UI and theme

- Check every UI change with Playwright at 375 pt (iPhone 13 mini) and 402 pt (iPhone 17 Pro) wide. Touch targets are large.
- Functional elements sit in a translucent panel over the background scene. Text contrast is at least 4.5:1 on any background.
- Modern 2D style with Pokémon-inspired wording: "Party" for pinned tiles, Dex numbers on entries ("No. 001"), "Dex" for the full tile list.
- Animation is optional polish and respects the "reduce motion" setting.
- **Text the user sees lives in locale files**, never in code: one file per language for the platform (`platform/frontend/locales/<language>.json`, namespace `platform`) and one per module (`frontend/locales/<language>.json`, namespace = module id). Keys follow the folders: one top-level key per page folder, camelCased (`notFound`), with the page's own components inside it; `components.<name>` for generic components; `common` only for text two or more places share, grouped by kind (`common.actions`, `common.errors`), moved there when the second use appears and only when the meaning is the same, not just the English words. Read with `useTranslation()`, and `<Trans>` for text with markup. English is the source language and types the keys, so a wrong key fails the typecheck. User data (usernames, tile titles) and the brand are not translated. The backend stays English: its messages are for logs, the CLI and developers.
- Colours, radii and fonts come from the `@theme` tokens in `platform/frontend/index.css`, never raw values. Fonts are system fonts, so nothing is fetched at runtime. PWA icons live in `public/`, scene art in `assets/`.

## Git and pull requests

- **Every change comes as a GitHub Pull Request.** Work on a branch and open a PR. Never commit or push to `master`.
- **Never merge, and never merge branches yourself, unless the owner explicitly asks.** The owner reviews, approves and merges.
- The default branch is `master`. Agents open PRs with the owner's GitHub account, and GitHub does not allow approving your own PR, so approval means the owner's review comments plus the owner's merge. CI checks (`verify`, `e2e`, `secrets`) must be green. Address each review comment by fixing it or explaining why not, and wait for the owner's go-ahead.
- Keep each PR cohesive, with one purpose and a short description of what changed, why and how it was tested. Larger PRs are fine, especially early in the project. Avoid extreme ones touching tens or hundreds of files, and split those. Use a draft PR for unfinished work instead of "WIP" in the title.

### Naming

- **Branches:** `<type>/<short-kebab-description>`, with a prefix such as `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/` or `ci/`. Lowercase, hyphens, short.
- **Commit messages and PR titles** start with your model name in square brackets, for example `[Claude Opus 5.5] Add pin button to tile`. Use your actual model name and the same prefix everywhere. After it, write an imperative summary ("Add", "Fix", not "Adding") of about 70 characters or less.
- **Merges are squash merges**, so the PR title becomes the one commit on `master`. Write the PR title as the final commit message.

## Working practices

- When this file does not cover something, follow the conventions already in the codebase. Ask the owner only as a last resort, when neither answers it; never guess. Do not build beyond what was asked.
- **Done means, before you open a PR:**
  1. `npm run fix` and then `npm run verify` pass.
  2. New behavior has tests. Never disable or weaken a check to make it pass.
  3. UI changes are checked at both phone widths.
  4. Your diff contains no secrets, personal data or local paths.
  5. The branch, commit and PR names follow the naming rules.
- Planning docs (PRD, plans, module PRDs) live outside the repository and are provided by the owner. `src/modules/README.md` is the in-repo guide to the module contract.
- Keep the docs current: on a significant change or decision, update this file, `README.md`, `src/modules/README.md` and any other affected docs in the same PR. Keep this file short and do not add rules that lint or tooling already enforce.
