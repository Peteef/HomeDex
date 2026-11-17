# Versions and releases

Every merge to `master` gets a version and an image. Minor and major versions are also published as a [GitHub Release](https://github.com/Peteef/HomeDex/releases), which is the public showcase of what HomeDex can do. This guide is for whoever opens a pull request: which label to choose, and how to write the release notes of a minor or major one.

## How a merge is versioned

Each pull request into `master` carries exactly one `release:*` label. New pull requests get a default; change it by hand whenever it does not fit, on any branch type. Adding a label removes the other one.

| Label           | Default on                         | From 1.4.0 | GitHub Release                     |
| --------------- | ---------------------------------- | ---------- | ---------------------------------- |
| `release:patch` | every branch except `epic/`        | 1.4.1      | no, joins the "Next release" draft |
| `release:minor` | `epic/` branches                   | 1.5.0      | yes                                |
| `release:major` | never, only on the owner's request | 2.0.0      | yes                                |

After the merge passes CI on `master`:

- The merge is tagged `v<version>` and its image is published as `ghcr.io/peteef/homedex:<version>`.
- `latest` moves to that image while the merge is still the newest one on `master`. If the newest merge fails on `master`, `latest` waits for the next one that passes.
- A minor or major merge publishes a GitHub Release. A patch merge only updates the "Next release" draft, which the next minor or major release takes over.

Every merge gets its own version, also when several are merged at once: a merge's version is the version of the merge before it, bumped by its own label. Dependabot pull requests are always patches. In the rare case that two minor merges are released by the same CI run, the older one keeps its version but has no page of its own: its notes open the newer release.

An `epic/` branch builds up a bigger feature from several pull requests that target it. It is merged to `master` as one pull request, so it becomes one version and one release.

## What a release looks like

```markdown
### Shared shopping list ← the Release notes of the minor or major pull request

One list for the whole household, from the phone in the shop or the PC at home.

- ...

## Features ← minor and major pull requests

- Add a shared shopping list (#58)

## Fixes and changes ← every patch since the last release, folded after 10

- Fix the quick-find order on iPhone (#61)

## Dependencies ← Dependabot, always folded

- Bump better-sqlite3 from 13.1.1 to 13.2.0 (#65)

**Full changelog**: v1.1.0...v1.2.0
```

The release is titled `v<version>`; its `###` heading works as the headline. Titles lose their `[Model name] ` prefix.

## Writing the release notes

A pull request labelled `release:minor` or `release:major`, whatever its branch, fills the `## Release notes` section of its description. The `release-notes` check fails until the section is filled and starts with a `###` heading. Patch pull requests leave it empty.

The notes are the public face of the release: someone who has never seen HomeDex should understand what it can do now. Keep them separate from the technical "What changed and why" above them.

```markdown
### <Name of the feature, in a few words>

<One or two sentences: what HomeDex can do now that it could not before, and for whom.>

- <Something you can do now, from the user's side.>
- <Two to five bullets in all.>

<Optional: one screenshot.>

**Before updating:** <only when needed, such as backing up data/ before a major version.>
**After updating:** <only when needed, such as pinning a new tile.>
```

- English, plain words, short sentences. Describe what people can do, not how it was built.
- No code, file names, pull request numbers or model names.
- Screenshots show fake data only: no real names, links or household details.
- A major version always says what to do before updating.
- Edit the notes before the merge: a published release does not follow later edits to the pull request. Fix a published release on GitHub instead.

Checklist for a minor or major pull request:

- [ ] The label is right (a change people will notice and worth showing is minor; `major` only on the owner's request).
- [ ] The Release notes follow the format above and the `release-notes` check passes.
- [ ] Anything to do before or after updating is in the notes.
- [ ] The pull request title reads well in a public list: it appears under "Features".

## Example

```markdown
### Shared shopping list

The household now has one shopping list everyone can add to, from the phone in the shop or the PC at home.

- Add items with a quantity and an optional note.
- Tick items off as they go into the basket; ticked items clear with one tap.
- Everyone sees the same list, so nobody buys the milk twice.

**After updating:** pin the new **Shopping list** tile to keep it at the top of your Dex.
```
