# <Name> — implementation plan: overview

_Written <YYYY-MM-DD> by <model> (planner) from the agreed PRD, `../<PRD file name>`, against `master` at `<short sha>` (v<version>). Each numbered file in this folder is one task = one pull request into the epic branch, written so an executor model can follow it without the planning conversation. The owner decides which tasks run and when._

- **Epic branch:** `epic/<name>`
- **Epic PR:** [#<n>](url), draft into `master`, label `release:minor`. Merged only when the owner says so (task 90).

## How an executor uses this folder

1. Read this file fully, then the repository's `CLAUDE.md`, then the PRD, then your task file. Read other files only when the task points to them, or to follow the codebase's conventions.
2. One task file = one branch = one pull request. Do not combine tasks. Do not build anything the task does not ask for.
3. **If the code differs from what the task describes** (a file is missing, a name differs, an earlier task landed differently), stop and report to the owner. Never guess, never improvise a different design. The PRD's "Proposed" items are settled for you; if one does not work out, stop and ask.
4. The owner's workflow rules apply: show a short plan and wait for approval before changing files; ask before deleting files or running `sudo`. Once the checks pass, commit, push and open the pull request without asking. Accepting a task file counts as approval of the deletions it names, but still say which files you delete.
5. Names of files and functions drift as tasks land. Find code by name, and read the log at the bottom of this file first: it records what earlier tasks changed.

## Epic workflow

- **Branch from the up-to-date epic**, not `master`: `git fetch origin && git switch -c <branch> origin/epic/<name>`. The branch name is given in each task.
- **The pull request targets `epic/<name>`** (`gh pr create --base epic/<name>`). It needs no `release:*` label and no release notes: only pull requests into `master` do. Leave the "Release notes" section of the template empty.
- CI runs the same required checks on pull requests into the epic. All must pass.
- **Merge only after the owner approves it**, in an approving review on the pull request or in words. Opening and updating the pull request needs no permission.
- **Task PRs are fast-forwarded into the epic, not squashed**, so the epic keeps each task's commits and can be rebased onto `master` commit by commit: `git push origin <head sha>:refs/heads/epic/<name>` (no force) moves the epic, and GitHub marks the PR merged. The merge button allows only squash, which is for `master`.
- **After the merge**, the executor of that task (or whoever the owner asks):
  1. ticks the task in the table below and adds one line to the Log;
  2. edits the epic PR's description (`gh pr edit <n> --body-file ...`, after reading the current body with `gh pr view <n> --json body`): add the pull request to "Pull requests in this epic" (`- <title without the model prefix> (#<n>)`), and update the "Release notes" if what users can do has changed. Keep the rest of the description as it is.
- **Always rebase, never back-merge.** No merge commits from `master` into the epic, or from the epic into a task branch.
  - **Keeping a task branch current:** when the epic moved, `git fetch origin && git rebase origin/epic/<name>`, then `git push --force-with-lease`. Never `git merge` the epic into it.
  - **Keeping the epic current with `master`:** only when the owner asks, and best when no task PR is open. `git switch epic/<name> && git pull --ff-only && git rebase origin/master`, resolve conflicts commit by commit, run `npm run verify`, then push with `git push --force-with-lease=epic/<name>:<the epic's sha before the rebase>`. Its commits are the task PRs' own commits (fast-forwarded), so the rebase replays every commit of every task.
  - **After the epic was rebased**, every open task branch is based on the old epic: `git rebase --onto origin/epic/<name> <old epic sha> <branch>`, then `git push --force-with-lease`. Note the old sha in the Log when rebasing the epic.

## Rules every task follows (from `CLAUDE.md`, repeated because they are easy to miss)

<Copy the current list from the last epic's overview and check it against `CLAUDE.md`: naming, PR description, the fix/verify/e2e trio, test rules, code style, platform/module boundaries, text and languages, UI checks, fake data, docs.>

## Shared design (decided; tasks refer here)

### <Conventions: dates, units, identifiers, ...>

### API (mounted at `/api/m/<module-id>`)

| Method and path | Body | Answer | Task |
| --------------- | ---- | ------ | ---- |

<Payload shapes; error statuses and what each means.>

### Data

<Tables with columns, keys and cascades, each with the task that creates it.>

### Frontend layout

<The module's folders and their parts; phone and desktop arrangement; refresh; dialogs; colours.>

## Tasks

Kind: **P** = platform, **M** = module, **O** = optional, **W** = wrap-up. Done: `[x]` merged, `[-]` dropped.

| Done | File                 | Kind | PRD | Branch               | Depends on      |
| ---- | -------------------- | ---- | --- | -------------------- | --------------- |
| [ ]  | `01-<slug>.md`       | P    | P1  | `feature/<slug>`     | —               |
| [ ]  | `90-epic-wrap-up.md` | W    | all | no branch of its own | everything kept |

### Suggested order

1. <Lanes and what can run in parallel.>

"Depends on" means "merge that one first". <Name the files that parallel tasks would both edit (locale files, the main page), and how to avoid conflicts.>

## Not planned in this epic (decided)

- <Items the owner decided against, with the PRD section.>

## Log

_(one line per merged task: date, task, PR, anything the next executor must know)_

- <YYYY-MM-DD>, epic opened: `epic/<name>` with an empty first commit, draft PR #<n> (`release:minor`).
