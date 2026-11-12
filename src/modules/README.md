# Modules

A module is a page inside HomeDex with its own screens, API endpoints and data, for example a shopping list. Each module is one folder in `src/modules/<id>/`. The platform finds modules on its own, so adding a module never changes `src/platform/`, and removing one is one action: delete its folder, or set `enabled: false` in its manifest.

Read the repository's `CLAUDE.md` first. Everything in it applies to modules too.

## Layout

A module is laid out like the platform, scaled down. Create a folder only when you need it.

```
src/modules/<id>/
  manifest.ts            what the platform reads first (required)
  frontend/
    index.tsx            the module's page, as the default export (required)
    pages/<name>/        screens, with pages/<name>/components/ for parts only that screen uses
                         and pages/<name>/internal/ for its other code (hooks, helpers)
    components/<name>/   pure components the module reuses
    features/<name>/     logic (hooks, data access, state) behind an index.ts, private files in internal/
    locales/             the module's text: one file per language (en.ts, pl.ts), and index.ts with the module's useText hook
  backend/
    index.ts             exports register(ctx)
    domain/<name>/       logic of one area behind an index.ts, repositories in internal/
    routes/              thin HTTP handlers: validate, call a domain service, shape the response
    migrations/          NNN_name.sql
```

`backend/` is optional: a module may be only a page.

## Manifest

```ts
import { defineModule } from '#platform/shared';

export default defineModule({
  id: 'shopping-list',
  icon: 'cart',
  route: '/m/shopping-list',
  enabled: true,
});
```

- `id`: kebab-case and equal to the folder name. `platform` is reserved.
- `icon`: one of the icon names in `src/platform/shared/icons/iconNames.ts`.
- `route`: always `/m/<id>`.
- `enabled`: `false` hides the page and the tile, does not mount the endpoints and does not run the migrations. The backend code of a disabled module is never imported.
- `quickActions` (optional, unused for now): `[{ id, keyword }]`, where `id` is kebab-case and `keyword` one lowercase word. This is a placeholder until quick actions are designed.

Every enabled module gets one shared tile on the home screen, created at server start, with the manifest's `icon` (a changed icon is picked up at the next start). Disabling or deleting the module hides the tile; its Dex number and the users' pins stay for when it comes back.

The manifest holds no text. The module's name and description, shown on its tile in the user's language, live in its locale files under `manifest` (see Text below).

The server validates every manifest at startup and refuses to start when one is invalid.

## Frontend

`frontend/index.tsx` default-exports the module's page. The platform loads it lazily and shows it at `/m/<id>` and every path below it, inside the app layout and behind the login. The page can split its paths with React Router's `<Routes>` and relative paths:

```tsx
import { Panel, useCurrentUser } from '#platform/frontend';
import { Route, Routes } from 'react-router';
import { ListPage } from './pages/list/ListPage.tsx';

const ShoppingList = () => (
  <Routes>
    <Route index element={<ListPage />} />
  </Routes>
);

export default ShoppingList;
```

- `useCurrentUser()` always has a user on a module's page.
- Text the user sees comes from the module's locale files (see Text below), never from literals in the code.
- Build the screen from the platform's components (`Panel`, `Button`, `TextInput`, ...) so it follows the theme. Colours, radii and fonts come from the theme tokens, never raw values.
- Call the module's endpoints with the platform's HTTP client from `#platform/frontend`: `getJson`, `postJson`, `put` and `del`. Paths start after `/api`, so the module's own are `/m/<id>/...` (`getJson('/m/shopping-list/items')`). Writes always send `Content-Type: application/json`, as the backend requires. A failed request throws.
- Any request that answers 401 ends the session, and the user lands on the login page. A module needs no handling for it.

## Text

The UI text of a module lives in one file per language, `frontend/locales/<language>.ts`: `en.ts` and one file for every other language the platform supports (today `pl.ts`). The platform finds these files on its own and loads each one into a namespace named after the module's id. The keys follow the module's folders, like the platform's:

- `manifest.name` (up to 60 characters) and optionally `manifest.description` (up to 140): the module's tile on the home screen. Required in every language;
- one top-level key per page folder, camelCased (`pages/list/` is `list`), with the page's own components nested inside it;
- `components.<name>` for each of the module's components in `components/<name>/`;
- `common` only for text two or more places share, grouped by kind (`common.actions`, `common.errors`). Move a string there when the second use appears, and only when the meaning is the same, not just the English words.

```ts
// frontend/locales/en.ts
export default {
  manifest: {
    name: 'Shopping list',
    description: 'What we need from the shop',
  },
  common: {
    actions: { tryAgain: 'Try again' },
  },
  list: {
    title: 'Shopping list',
    greeting: 'Hi, {{username}}!',
    count_one: '{{count}} item',
    count_other: '{{count}} items',
  },
} as const;
```

`as const` matters: it lets the types see each message. `frontend/locales/index.ts` registers the namespace and makes the module's hook:

```ts
// frontend/locales/index.ts
import { textHook } from '#platform/frontend';
import type en from './en.ts';

declare module 'i18next' {
  interface ResourceNamespaceMap {
    'shopping-list': typeof en;
  }
}

export const useText = textHook('shopping-list');
```

Pages, components and features import `useText` from `locales/index.ts` and read a section of the file:

```tsx
const text = useText('list');

text.title; // "Shopping list"
text.greeting({ username }); // "Hi, Misty!"
text.count({ count: 3 }); // "3 items"
```

- Plain text is a string. Text with `{{values}}` is a function that takes exactly those values, and plural forms (`_one`, `_other`, ...) become one function that takes `count`. A wrong name or a missing value fails the typecheck, and Cmd+click opens the message in `en.ts`.
- Use `<Trans>` from `react-i18next` for text that contains markup, such as a link or `<code>`: `<Trans ns="shopping-list" i18nKey="list.help" components={{ code: <code /> }} />`.
- A module owns all its text, even words the platform has too: the platform's keys are not part of its public API.

Every other language mirrors `en.ts` and is checked against it, both by the typecheck and by the platform's locale test, which fails when a module misses a language, a key, a `{{value}}`, a markup tag or a plural form the language needs (Polish has `_one`, `_few`, `_many` and `_other`):

```ts
// frontend/locales/pl.ts
import type { Translation } from '#platform/frontend';
import type en from './en.ts';

export default {
  manifest: {
    name: 'Lista zakupów',
    description: 'Czego potrzebujemy ze sklepu',
  },
  common: {
    actions: { tryAgain: 'Spróbuj ponownie' },
  },
  list: {
    title: 'Lista zakupów',
    greeting: 'Cześć, {{username}}!',
    count_one: '{{count}} produkt',
    count_few: '{{count}} produkty',
    count_many: '{{count}} produktów',
    count_other: '{{count}} produktu',
  },
} as const satisfies Translation<typeof en>;
```

Write natural text rather than a word-for-word translation, and avoid forms that assume the reader's gender.

Lint rejects literal text in JSX and in attributes the user sees or hears (`label`, `title`, `placeholder`, `aria-label`, ...). User data, such as an item's name, is never translated.

## Backend

`backend/index.ts` exports `register`. The platform calls it once at startup with the module's context:

```ts
import type { RegisterModule } from '#platform/backend';
import { itemsRoutes } from './routes/items.ts';

export const register: RegisterModule = ({ router, storage, currentUser, logger }) => {
  router.use('/items', itemsRoutes(storage, currentUser));
};
```

| `ctx`         | What it is                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `id`          | The module's id                                                                                 |
| `router`      | An Express router, mounted at `/api/m/<id>` behind the login (a request without a session: 401) |
| `storage`     | The database (`prepare`, `exec`, `transaction`), the same SQLite file as the platform           |
| `currentUser` | `currentUser(req)` returns `{ id, username }` of the signed-in user                             |
| `logger`      | `info`, `warn`, `error`; every line starts with `[<id>]`                                        |

- Every write request (`POST`, `PUT`, `PATCH`, `DELETE`) must send `Content-Type: application/json`, even without a body, and come from the app's own origin. The platform checks both for all of `/api`.
- An error thrown in a handler becomes a 500 with `{ error: 'Internal error' }` and is logged. Map expected failures (bad input, not found) to their status in the route, with the status codes from `#platform/shared` (`BAD_REQUEST`, `NOT_FOUND`, and `CREATED`, `NO_CONTENT` for success).
- If `register` throws, the server does not start.

## Data

- Migrations are `backend/migrations/NNN_name.sql` (`001_items.sql`, `002_...`). They run at startup, in order, once each, tracked under the module's id.
- Every table name starts with the id in snake_case plus `_`: module `shopping-list` creates `shopping_list_items`.
- Until the owner says the app is live, edit migrations in place and reset the data folder. After that, only add new ones.
- Removing or disabling a module leaves its tables and data. Deleting data is a separate, deliberate step.

## Rules

- A module imports only its own files and the platform's public APIs: `manifest.ts` only `#platform/shared`, `frontend/` only `#platform/frontend` and `#platform/shared`, `backend/` only `#platform/backend` and `#platform/shared`. Never another module, never the platform's internals. Packages from `package.json` (React, React Router, TanStack Query, zod) are fine.
- Inside a module the platform's layer rules apply: components are pure and import no pages or features; features and domains are used only through their `index.ts`; domains do not import routes. `npm run verify` checks all of it with lint.
- The contract test (`tests/modules/contract.test.ts`) checks every module: the required files exist, the manifest is valid, the id matches the folder, every supported language has a locale file with `manifest.name`, and every table carries the prefix.
- **Need something the public APIs do not offer?** Add it to the platform first, in its own PR, then build the module on it. Never reach into the platform's internals.

## Tests

Unit tests live in `__tests__/` folders next to the code, as in the platform (`frontend/**/__tests__/*.test.tsx` runs in jsdom, `backend/**/__tests__/*.test.ts` in Node). End-to-end tests for a module's page go in `e2e/`.

The platform has a test kit for each side, importable only from a module's `__tests__` (lint checks it; the Docker image leaves the kits out):

- `#platform/backend/testing`: `moduleTestStorage(moduleDir)` is an in-memory database with the module's migrations applied, for domain tests. `moduleTestApp(moduleDir)` is the real app with only this module loaded, for route tests with `supertest`: it returns `{ app, storage, signIn }`, where `signIn(username)` creates the account on first use and returns its session cookie. Pass `moduleDir` as `path.resolve(import.meta.dirname, '<up to the module folder>')`.
- `#platform/frontend/testing`: `fakeApi({ 'GET /api/m/<id>/items': ok({ items }) })` stubs `fetch` (an unknown route answers 404) and records the calls (`callsTo('POST /api/m/<id>/items')`); `ok(body)` and `status(code)` build responses; `withProviders(element)` wraps a page or hook in the query client and a router. The module's text is loaded in tests, in English unless a test changes the language.

## Checklist

1. `src/modules/<id>/manifest.ts` and `frontend/index.tsx`, plus `backend/` if the module has endpoints or data.
2. Tables prefixed with `<id_snake>_`, created by the module's own migrations.
3. Text in `frontend/locales/en.ts` and a file for every other supported language (`pl.ts`), starting with `manifest.name`, with `frontend/locales/index.ts` for the module's `useText`.
4. Unit tests next to the code, and an e2e test for the page at both phone widths (375 and 402 pt).
5. `npm run fix`, then `npm run verify` and `npm run test:e2e`.
6. No change in `src/platform/`. If one is needed, it comes first, in its own PR.
