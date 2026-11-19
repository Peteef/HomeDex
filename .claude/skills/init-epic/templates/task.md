# <NN> — <Title in a few words>

_Read `00-overview.md` first<, including "Shared design">. <No dependencies. | Needs tasks NN and NN merged.> <For optional tasks: **Run only when the owner decides to build <ID>.**>_

- **Branch:** `<type>/<short-kebab-description>`
- **PR title:** `[<model>] <Imperative summary, about 70 characters with the prefix>`
- **PRD:** <requirement, rule and platform-need IDs>
- **Why:** <the user-facing or engineering reason, in two or three sentences; name the task that needs this when it is a platform change.>

## Design (decided)

<What to build, with exact names: files, functions, routes, payloads, tokens, constants, locale keys. Behaviour for each case, including failures. What is explicitly not part of this task.>

<When a choice depends on something not verifiable at planning time: "Check <X>. If it fails, stop and report: the owner chooses between <A> and <B>.">

## Steps

1. <A failing test first where it helps.>
2. <Order of work; files to search for every use of a moved or renamed name.>

## Tests

- <Unit>: `should <outcome> when <condition>`, one line per behaviour.
- E2E: <flows, which projects (phones, desktops), axe checks; real server or stubs, with fake data.>

## Docs

- <`CLAUDE.md`, `README.md`, `src/modules/README.md`, `docs/releases.md`, and in the owner's notes `architecture-decisions.md` (`AD-0NN`, number assigned in the plan) or the "next steps" file; or "None".>

## Checks

- `npm run fix`, `npm run verify`, `npm run test:e2e`.
- <UI: desktop Chrome and Safari, 375 and 402 pt, day and night; what to look at; screenshots to the owner. Or "No UI yet.">
