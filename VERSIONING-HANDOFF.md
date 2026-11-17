# Versioning and releases: handoff

> **Temporary.** Notes for the next agent working on PR #59. Delete this file before the PR is merged: planning notes do not live in the repository (CLAUDE.md, Working practices).

## Goal

Automatic versioning from 1.0.0 on. Every merge to `master` gets a version; fixes and small changes bump the patch, bigger features the minor, and the major only changes when the owner asks. Before this, release publishing in CI was paused (`if: false`) waiting for exactly this.

## Decisions

Each was discussed with the owner and agreed.

1. **The bump comes from a PR label, not commit messages.** PR titles are `[Model name] Imperative summary`, so Conventional Commits tools (semantic-release, release-please) did not fit without changing the title rule. Labels: `release:major`, `release:minor`, `release:patch`.
2. **Default labels by branch.** A PR into `master` gets `release:minor` on `epic/*` branches and `release:patch` on everything else, `feature/` included, because feature PRs have been small. `release:major` is only ever added by hand. The labeller runs only when a PR opens or reopens, so a label changed by hand stays. Adding a `release:*` label removes the other ones. Dependabot sets its own labels in `dependabot.yml`, because its token cannot add labels.
3. **`epic/` is a new branch type** for a bigger feature built from several PRs. Its PRs target the epic branch, `master` is merged into it regularly, and it is squash-merged to `master` as one version. Its PR lists its sub-PRs. It was deliberately not named `release/`, which already means tags, GitHub Releases and labels here, and a stabilising branch in git-flow.
4. **Every merge gets a version, a git tag `v<version>` and an image.** The image tags are only `<version>` and `latest`. There are no `1`, `1.4` or `sha-<short>` tags; the owner first asked for the floating ones, then dropped them.
5. **A GitHub Release only for minor and major bumps.** The owner found a release per Dependabot bump too much. A release lists every PR since the previous release, patches included. Meanwhile they gather in a draft named "Next release". The accepted consequence is that a patch version has no notes page of its own; use GitHub's compare view between tags.
6. **Git tags are the source of truth.** Nothing is committed back to `master`; `package.json` `version` stays a placeholder. Committing back would need a token that bypasses branch protection, and it would loop CI.
7. **The app knows its version** for later display. Nothing shows it yet; the owner asked only for it to be ready. A release reads `1.4.1`, a PR preview `pr-<number>`, and any other build `<last version>-dev`, such as `1.4.1-dev`; with no git or tag it is `0.0.0-dev`. In strict semver `-dev` means "before 1.4.1"; it was kept because it reads well and only matters if code ever compares versions.
8. **Release format**, from top to bottom:
   - **Release notes:** the `## Release notes` section of the minor or major PR, written by its author. It is in English and plain words, for the household, under a `###` heading, with no code or PR numbers, plus anything to do before or after updating. The format is in the PR template comment and in CLAUDE.md. An empty section is fine; the release then starts with Features.
   - **Features:** PRs labelled `release:minor` or `release:major`.
   - **Fixes and changes:** everything else.
   - **Dependencies:** PRs labelled `dependencies` (added by Dependabot), always collapsed.
   - **Full changelog:** a compare link from the previous release to this one.
   - PR titles lose their `[Model name] ` or `[Dependabot]: ` prefix in the lists. No author names: every PR comes from the owner's account.

## How it works

- `.github/workflows/release-labels.yml`: the default label (Release Drafter's autolabeler) and the one-label rule (`actions/github-script`).
- `.github/workflows/ci.yml`, job `release`, on each push to `master` after `verify`, `e2e`, `secrets` and `docker`:
  1. `git describe` on `HEAD^` finds the last `v*` tag. It looks from the parent, so a re-run gets the same version.
  2. A Release Drafter dry run with `from: refs/tags/<last tag>` gives the `labels` of the PRs merged since that tag.
  3. `scripts/next-version.ts <last tag> <labels JSON>` prints `version=` and `release=` (true for minor and major). It uses `semver`, a dev dependency.
  4. CI pushes the tag `v<version>` on the tested commit, unless the tag already exists.
  5. A Release Drafter dry run with `config-name: release-highlights.yml` extracts the Release notes sections of the minor and major PRs since the last release, and gives them as `body`.
  6. Release Drafter, with `version`, `commitish: <sha>` and `header: <that body>`, either publishes the release (`publish: true`) or updates the "Next release" draft.
- Job `publish` builds the image with `APP_VERSION=<version>` and pushes `<version>` and `latest`. The PR preview image gets `APP_VERSION=pr-<number>`.
- Master runs queue instead of cancelling each other, so merges are versioned in order. GitHub keeps one queued run per group: if a newer merge replaces a queued run, the next version covers both merges.
- App version: `scripts/app-version.ts` (`APP_VERSION`, otherwise `git describe`) feeds the Vite `define` `__APP_VERSION__`, which `src/platform/frontend/lib/version` exports as `APP_VERSION`. Vitest defines `0.0.0-test`. The Docker UI build stage copies `scripts/app-version.ts` (an exception in `.dockerignore`) and takes `ARG APP_VERSION`.

## Release Drafter v7 facts that shaped the design

Release Drafter is pinned to v7.10.0 by commit; v7.11.0 was too new when chosen. These were read from its source:

- **Version base:** it counts from the last _published release_ (the highest semver), not the last tag. This is why it does not pick the version: patch merges have tags but no releases.
- **Changes:** found with GitHub's compare API, from the last release's tag (or the `from` input) to `commitish`. This is exact, not based on dates.
- **`labels` output:** the labels that matched a category condition, in dry runs too. The version-resolver categories in `release-drafter.yml` exist so that the `release:*` labels always show up there.
- **Empty inputs:** an empty input counts as unset. That is why `name: ''` on a minor release falls back to `name-template` (`v$RESOLVED_VERSION`).
- **`header`:** put directly before `template`, so CI adds `\n\n` after it.
- **Drafts:** it updates the first draft release it finds, so there should only ever be the one "Next release" draft.
- **Section extraction:** a `change-body` replacer with `section: '## Release notes'` takes the text up to the next `##` heading. Headings inside HTML comments are ignored; the template's hint comment is then removed by a second replacer.

## State

- PR #59 (draft) on branch `claude/happy-mayer-znkx8u`; the session had to use that name instead of `ci/...`.
- `npm run verify` passes. Unit tests cover `scripts/app-version.ts` and `scripts/next-version.ts`.
- The version steps were simulated on a scratch git repository: patches count up, a re-run gets the same version, a minor merge sets `release=true`, and a replaced queued run's merge is covered by the next version.
- Both Release Drafter configs validate against its JSON schema. The release body was not rendered for real: running Release Drafter's code locally was blocked, so the layout was traced through its source. The sample release is in the PR description.

## Before merging

The owner does the cutoff, in the GitHub UI:

1. Create the labels `release:major`, `release:minor`, `release:patch` and `dependencies`.
2. Publish a GitHub Release `v1.0.0` on the `master` commit to cut from. A bare tag is not enough: the release is the starting point for the notes and the draft.
3. Delete this file, then merge #59. It becomes `v1.0.1` (`release:patch`) and opens the "Next release" draft.

## After merging, check

- The `release` job tagged `v1.0.1`, `publish` pushed `ghcr.io/peteef/homedex:1.0.1` and `latest`, and the "Next release" draft lists #59.
- A new PR gets its default label, and adding another `release:*` label removes the first one.
- At the first minor merge, the rendered release: the notes at the top, the sections, the collapsed dependencies, the titles without prefixes, and the compare link.

## Open

- **Release notes check:** nothing enforces that a minor or major PR fills its Release notes. A small check on PRs was offered to the owner and not decided.
- **Showing the version in the UI:** deliberately not built. It comes in its own PR when the owner asks.
