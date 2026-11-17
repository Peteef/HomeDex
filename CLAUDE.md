# HomeDex

A private, Pokémon-themed mission control for a household: a greeting, quick-find and a grid of tiles that open links or modules. A few accounts, used from PCs and iPhones on the home network. It is a platform first: modules are added over time, mostly by agents, so the core stays small, clear and easy to extend.

## Principles

- **Simple and lightweight.** No paid services. Prefer a popular, well-maintained library over writing your own, and justify every new dependency. It is also a learning project, so prefer mainstream tools.
- **Modular.** Adding a module never edits the core.
- **Private.** Never exposed publicly. No registration; accounts come from the CLI.
- **Native on every device.** Phone and desktop matter equally. Each gets a UI that feels native to it, not one layout squeezed or stretched, even when that means separate components or pages.

## Commands

- `npm run dev`: Vite on 5173 (open this one, also from a phone on the LAN) and the backend on 3000, both reloading. It first runs `scripts/dev-user.ts`, which creates a user from `DEV_USERNAME` and `DEV_PASSWORD` in `.env.development` when the database has no accounts.
- `npm run build` (UI to `dist/web`); `npm start` (production server: API plus built UI).
- `npm test` (Vitest); `npm run test:e2e` (Playwright: desktop Chrome and Safari, two phone viewports; Safari and the iPhones run Playwright's WebKit build, close to Safari but not the real browser). `npm run test:coverage` adds a coverage report (a report only, no threshold).
- `npm run fix`: Prettier and ESLint auto-fix. `npm run verify`: typecheck, lint (boundary rules included), format check, unit tests and build; CI runs the same.
- `npm run users -- list | create | edit | archive | restore`: the account CLI.

## Tech

The current stack, not a limit: when a task needs something it lacks, look for a library before building it yourself (see Principles).

- TypeScript strict with `erasableSyntaxOnly`. Node.js LTS, pinned in `.nvmrc` and the Docker image. The backend runs `.ts` directly through Node's type stripping, with no build step: use `import type`, `.ts` extensions on relative imports, and no enums or namespaces.
- Frontend: React, Vite (build only), React Router, TanStack Query, Tailwind CSS 4, `lucide-react`, `i18next` with `react-i18next`. Backend: Express. `zod` validates config, requests and manifests. Storage: SQLite (`better-sqlite3`) behind a thin storage layer.
- One npm package; modules are folders. Tooling: npm, Prettier, ESLint, Vitest, Playwright, GitHub Actions.
- `dependencies` holds only what the server imports at run time; libraries that only the browser bundle uses are `devDependencies`, so the image stays small.
- Packaging: one Docker image (API plus built UI) for amd64 and arm64, `ghcr.io/peteef/homedex`. Pull requests publish `pr-<number>`, deleted on close. Release publishing (`latest`, `sha-<short>`, versions) is in CI but paused with `if: false` until releases get git tags and version bumping.

## Structure

```
src/platform/          the core
  frontend/            components/, pages/, features/, lib/, locales/, app skeleton, public-api/
  backend/             domain/, routes/, infrastructure/, public-api/
  shared/              code both sides use (status codes, icon names, languages, tile types and rules, manifest schema); imports neither side
src/modules/<id>/      one module, laid out like the platform (guide: src/modules/README.md)
e2e/                   Playwright tests
tests/                 tests of the repository itself (lint boundaries, module contract)
assets/                art, loaded at runtime from ASSETS_DIR
```

### Platform and modules

- Public APIs are the `imports` aliases `#platform/backend`, `#platform/frontend` and `#platform/shared` (each a `public-api/index.ts`). Modules use the platform only through them and never import each other. The platform never imports a module by name; it finds modules through their manifests.
- A public API grows only when a module needs something, in its own platform PR before the module PR, never in advance. Changing an existing export is its own PR too. `#platform/backend/testing` and `#platform/frontend/testing` are test kits for a module's `__tests__` only.
- Removing or disabling a module is one action: delete its folder or set `enabled: false`. Nothing else references it.
- A module owns its data: tables are named `<module_id_snake>_<table>` and created by its own migrations. Removing the code leaves the data; deleting data is a separate, deliberate step.

### Backend

- `domain/<name>/`: the logic of one area behind an `index.ts` (service factory, its interface, models); repositories and helpers in `internal/`. `domain/services.ts` wires the domains for the server and the CLI. Domains reach infrastructure only through `infrastructure/storage/index.ts`. A new domain goes into `DOMAINS` in `eslint.config.js`.
- `routes/`: one file per resource, thin (validate, call a service, shape the response), so the framework can be swapped.
- `infrastructure/`: Express plumbing, storage and migrations, the module loader, config, logger, CLI, `app.ts`, `main.ts`.
- Factories are named after what they build (`accountsService()`), define small single-purpose functions and end with `return { create, list }` of function references.
- Expected failures are `Error` subclasses (`AccountError`), caught at the edge (route, CLI, `main.ts`). Optional input is `field?: T`; a stored value that can be empty is `T | null`.
- All SQL lives in repositories. Migrations are committed and final once merged: never edit one, add a new one. The server refuses to start when an applied migration's file has changed.

### Frontend (`src/platform/frontend/`)

- `components/<name>/`: generic, pure components. Everything comes through props: no fetching, business logic or global state (local UI state is fine; `useText()` is the one exception).
- `pages/<name>/`: one screen. The page component at its base owns the logic (there is no container layer), its own pure components go in `components/`, its other code in `internal/`. A component two pages need moves to `components/`, logic two pages need to a feature.
- `features/<name>/` (logic of one area: hooks, data access, state) and `lib/<name>/` (generic utilities, such as the `http` API client) are used only through their `index.ts`, with private files in `internal/`. Add a new one to `FRONTEND_FEATURES` or `FRONTEND_LIBS` in `eslint.config.js`.
- The app skeleton sits at the base (`App.tsx`, `AppLayout.tsx`, `RequireAuth.tsx`, `routes.ts`, ...). A 401 from any request ends the session and the guard sends the user to the login page, so data hooks don't handle it.
- UI that belongs to one module stays in that module.

## Code style

- Code documents itself. Comment only what the code cannot say (a hidden constraint, a workaround, surprising behaviour, a non-obvious decision), and remove redundant comments on sight. Test section markers are the exception.
- Name your own paths, defaults, file names, ports and messages as constants. Library-defined names, route paths in `routes/` and expected values in tests stay literal. HTTP status codes come from `src/platform/shared/http/status.ts`, imported by name (`BAD_REQUEST`).
- Types stay in the file that owns them. Model types shared within a folder go to its `types.ts`, error classes to `errors.ts`; prop types stay with their component. No global `types.ts`.
- Only a function with a one-statement body may be inlined (a JSX handler, a callback argument); anything longer becomes a named `const` (`onChange={pick}`). Five idioms may stay inline at any length: Express route handlers in `routes/`, React hook bodies (`useEffect`, `useMemo`), a `new Promise` executor, a `db.transaction` body (so the transaction visibly wraps its queries), and test callbacks (`describe`, `it`, hooks, mocks).
- Lint and `npm run fix` handle the rest: arrow functions only, concise bodies, braces everywhere, blank lines around multi-line statements, one property per line in returned objects.

## Tests

- Unit tests live in a `__tests__/` folder next to the code, named `*.test.ts(x)`.
- Every file with logic has its own tests, `internal/` included (repositories, API wrappers, hooks, page components). Coverage from a higher layer does not count. Pure types, barrels and locale files need none.
- Tests never shape production code: export nothing only for a test, test through what a file already exports, and write expected values literally.
- `describe` names the unit (nested per function when a file tests several); `it('should X when Y')`. Mark sections with `// Given`, `// When`, `// Then`, joined (`// When / Then`) or skipped when empty.

## UI and text

- Check every UI change with Playwright on desktop (Chrome and Safari) and at 375 and 402 pt wide (iPhone 13 mini, iPhone 17 Pro). Touch targets are at least 44 pt.
- Functional elements sit in a translucent panel over a layered background scene. Text contrast is at least 4.5:1 on any background. Colours, radii and fonts come from the `@theme` tokens in `index.css` (system fonts only). Scene art loads only from `ASSETS_DIR`; PWA icons live in `public/`. Animation is optional and respects reduced motion.
- Pokémon wording: Dex numbers ("No. 001") and "Dex" for the tiles; pinned tiles come first, with no name of their own.
- All UI text lives in TypeScript locale files (`export default { ... } as const`): `platform/frontend/locales/<language>.ts` (namespace `platform`) and `<module>/frontend/locales/<language>.ts` (namespace = module id). Keys follow folders: one camelCased key per page folder with its components inside, `components.<name>` for generic components, and `common.<kind>` only for text two or more places share with the same meaning.
- Read text with `useText('login.picker')`, then `text.title` or `text.greeting({ username })`; `<Trans>` for text with markup.
- English is the source language and types every other one. Other languages (today Polish) read naturally, not word for word, avoid gendered forms, and are declared `as const satisfies Translation<typeof en>`; the locale test checks them against English. A new language needs its code in `LANGUAGE_CODES` (`shared/i18n/languages.ts`), its flag in `lib/i18n/languages.ts`, and its files.
- User data (usernames, tile text) and the brand are not translated. The backend stays English: its messages are for logs, the CLI and developers, so the UI never shows an API error text and uses its own translated message instead.

## Security and privacy

- Never commit user data or secrets: `data/`, `.env`, SQLite files, password hashes, personal links, tokens. Only `.env.example` with fake values is committed. Check `git status` before every commit and the diff before every push.
- The repo is public: no absolute local paths, machine names or personal details in files, comments or commit messages. Tests, fixtures and examples use fake data.
- Accounts come only from the CLI. The development test user is the only automatic account; `scripts/` stays out of the Docker image, and the server refuses to start in production when any `DEV_*` variable is set.
- The login page lists active usernames without a session. A device remembers only the last username (`localStorage`); the session lives in the `HttpOnly` cookie.
- No home-made crypto: passwords are salted hashes from a vetted algorithm. Session cookies are `HttpOnly`, `SameSite`, and `Secure` with HTTPS.
- Dev and prod differ only through configuration. HTTPS-only headers (HSTS, `upgrade-insecure-requests`) follow `COOKIE_SECURE`, because they break plain HTTP in Safari.
- Nothing is fetched from external sites at runtime; icons come from the built-in set.

## Git and pull requests

- Every change is a pull request from a branch. Never commit or push to `master`, and never merge unless the owner asks. The owner reviews and merges; agents use the owner's account, so approval is the owner's review plus the merge. Required checks: `verify`, `e2e`, `secrets`, `docker`.
- Branches: `<type>/<short-kebab-description>` with `feature/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/` or `ci/`.
- Commit messages and PR titles: `[<model name>] Imperative summary`, about 70 characters. Merges are squash merges, so the PR title becomes the commit on `master`.
- Anything posted on GitHub (descriptions, comments, review replies) starts with `**🤖 [<model name>]**` on its own line, then a blank line.
- One cohesive purpose per PR, with a short description of what changed, why and how it was tested. Split very large PRs. Use a draft PR for unfinished work. Address every review comment by fixing it or explaining why not.

## Working practices

- When this file does not cover something, follow the codebase's conventions. Ask the owner only as a last resort; never guess. Do not build beyond what was asked.
- Planning docs (PRDs, plans) live outside the repository and are provided by the owner. `src/modules/README.md` is the in-repo module guide.
- **Done means, before a PR:** `npm run fix` then `npm run verify` pass; new behaviour has tests and no check was weakened; UI changes are checked on desktop and at both phone widths; the diff has no secrets, personal data or local paths; names follow the rules above.
- Keep docs current in the same PR: this file, `README.md`, `src/modules/README.md`. Keep this file short, with no rules that lint or tooling already enforce.
