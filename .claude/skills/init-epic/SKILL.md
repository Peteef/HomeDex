---
name: init-epic
description: Start a HomeDex epic from the owner's draft PRD. Interview the owner into an agreed PRD, open the epic branch and its draft pull request into master, and write the implementation plan that executor agents follow, one task per pull request.
argument-hint: <path to the draft PRD>
disable-model-invocation: true
---

# Start an epic

An epic builds one bigger feature, usually a module, from many pull requests that target an `epic/<name>` branch. The epic's own pull request into `master` stays a draft that shows progress and the changing release notes, and it is merged only when the owner says so.

This skill takes the owner's draft PRD and produces four things:

1. The agreed PRD, next to the draft.
2. The `epic/<name>` branch and its draft pull request into `master`.
3. The implementation plan: a `plan/` folder next to the PRD, one file per pull request.
4. A short report to the owner.

The draft PRD is at `$ARGUMENTS`. If no path was given, ask the owner for it. Planning documents live outside the repository, in the owner's notes, and so does everything this skill writes, except the branch and the pull request.

## Ground rules

- **Never guess.** Every gap in the draft becomes a question, or a recommendation the owner accepts. Ask the owner only questions a decision depends on. Settle everything else from the repository's conventions and say so.
- **One phase at a time, owner approval between phases.** The interview ends with an approved PRD. The branch and pull request come only after that approval, and the plan only after the branch exists.
- Follow the repository's `CLAUDE.md` throughout (naming, bot tag, attribution, privacy). The repository is public: no local paths or personal details go into anything committed or posted.

## Phase 1: read

1. The draft PRD, in full.
2. In the repository: `CLAUDE.md`, `src/modules/README.md`, `docs/releases.md`, `.github/pull_request_template.md`, and an existing module as the reference implementation.
3. In the owner's notes, next to the planning folders of earlier work: the main `PRD.md` (historical), `architecture-decisions.md` (note the last `AD-` number), `v1-next-steps.md` and any other "next steps" file. Search them for items parked "until the second module", "when a module needs it" and similar. They may be due now, and each one becomes a question in Phase 2.
4. Earlier epics' `plan/00-overview.md` files, if any: their Log sections hold lessons for this one.

## Phase 2: find the platform gaps

Before you interview, check what the feature would need from the platform that modules cannot get today. Modules may use the platform only through `#platform/frontend`, `#platform/backend` and `#platform/shared`. Check at least:

- **Public API:** components and helpers the feature needs that exist but are not exported (dialogs, HTTP helpers, error types).
- **Icons:** is there a fitting name in `ICON_NAMES`?
- **Theme tokens:** colours the feature needs (statuses, urgency); modules may use only tokens.
- **Request limits:** body size for uploads; content-type rules.
- **Status codes:** the ones the feature's API needs, in `shared/http/status.ts`.
- **Time and dates:** whether "today" is needed, and in which time zone.
- **Runtime rules:** no fetching from external sites, no new paid services.
- **Module context and test kits:** `ModuleContext`, `#platform/backend/testing` and `#platform/frontend/testing`.

Each gap becomes a "Platform need" (P1, P2, ...) in the PRD and a platform task in the plan. Tell the owner what you found before the interview starts, in a few lines.

## Phase 3: interview

Use `AskUserQuestion` in themed rounds of up to four questions. Put your recommendation first in each, marked "(Recommended)", and make every option's consequence concrete, with an example where it helps. Typical rounds:

1. **Domain model and rules:** what is stored and what is computed; what the state of the main entity is; how each action changes it; edge cases (boundaries, late or early actions, first use, deletion).
2. **Views and navigation per device:** phone and desktop separately (HomeDex is native on every device); where each action lives; empty, loading and error states.
3. **Data and media:** images or files, sizes, where they are stored, privacy (photo metadata, for example).
4. **Scope:** which nice-to-haves join the epic; everything else goes to "Later".
5. **Cross-cutting:** several users at once (refresh, conflicts), time zone, notifications, badges.
6. **Process:** parked items found in Phase 1; whether platform pull requests target the epic (the default: a platform API ships with its first user); how tests are split between executors and the owner.

Read free-text answers carefully. They often change the model rather than pick an option. Restate the model you understood in one or two sentences before moving on. When an answer creates a new question, ask it in the next round.

## Phase 4: write the PRD

- Copy `templates/prd.md` next to the draft, named like the draft without "draft" (for example `Module - <Name> - PRD.md`). Keep the draft as written.
- Fill every section. Mark each statement **Decided** (the owner chose), **Proposed** (your recommendation, accepted unless the owner objects) or **Open** (needs an answer). Give requirements IDs (`<PREFIX>-01`, ...) with acceptance criteria, rules IDs (`R1`, ...), and platform needs IDs (`P1`, ...); the plan refers to them.
- Draft the release notes as `docs/releases.md` describes.
- Point the owner to the file and list in a few lines what to look at closely: Proposed rules with a real consequence, and anything you added that the owner did not decide. **Wait for approval.** Apply the owner's changes, and record new decisions in section 12.

## Phase 5: the epic branch and its draft pull request

Approval of the PRD covers this phase, unless the owner said otherwise. GitHub needs at least one commit to open a pull request, so the branch starts with an empty one, which the final squash merge drops.

1. Check `git status` (clean) and `git fetch origin`. Check that `epic/<name>` does not exist (`git ls-remote --heads origin 'epic/*'`).
2. `git switch -c epic/<name> origin/master`, then `git commit --allow-empty` with the message `[<model>] Start the <Name> epic`, followed by the attribution line.
3. `git push -u origin epic/<name>`.
4. `gh pr create --draft --base master --head epic/<name> --title "[<model>] Add the <Name> module" --body-file <file>`, with the body made from `templates/epic-pr.md`, filled with the PRD's release notes draft. The title appears under "Features" in the public release: write it for that.
5. Check that the pull request got the `release:minor` label (the `release-labels` workflow adds it to `epic/` branches) and that its checks pass, the `release-notes` check included. Bind the pull request in the app if the session supports it.
6. Put the pull request's link into the PRD's header.

## Phase 6: the implementation plan

1. Create `plan/` next to the PRD: `00-overview.md` from `templates/plan-overview.md`, and one file per task from `templates/task.md`.
2. **Number the tasks by kind:** `01`–`09` platform (in order of size: small and independent first), `10`–`19` the feature, `20`–`29` optional pieces the owner may drop, `90` the wrap-up. If a kind needs more numbers, continue in the next free decade and say so in the overview.
3. **One task = one cohesive pull request.** A platform change always comes in its own task, before the first feature task that uses it. Backend and frontend of one area may be separate tasks when they can run in parallel.
4. **Put shared design in the overview** (API table, data, frontend layout, conventions), so the tasks agree. Each task says what is decided, the steps, the tests to write (as `should ... when ...`), the docs to update, and the checks. Give exact names (files, functions, routes, tokens, constants), not code. Where a choice depends on something you cannot verify now (a library's support, a runtime feature), the task says "check X; if it fails, stop and report", never "pick one".
5. **Assign numbers up front:** architecture decision numbers (`AD-0NN`) to the tasks that add one, so parallel tasks never collide.
6. Write the wrap-up task (`90`) from the template's outline: bring the epic up to date, check it, update the pull request's description and release notes, the owner's real-device checks and merge, and the steps after the release.
7. **Consistency pass:** read the overview and every task against each other and against the PRD. Check that each requirement and platform need has a task, that each task's dependencies provide what it uses (exports, fields, endpoints, status codes), that payload fields match between producer and consumer, and that nothing contradicts the repository's rules (for example a module reading platform tables). Fix what you find, then add any new platform need to the PRD.

## Phase 7: report

Tell the owner, briefly:

- where the PRD and the plan are, and the epic pull request's link;
- anything added during planning that the owner did not decide (new platform needs, rules made concrete);
- the suggested order and which tasks can run in parallel.

Then propose saving a short project memory pointing to the PRD and plan, if the session keeps memories.
