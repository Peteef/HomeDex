**🤖 [<model>]**

## What changed and why

The epic for the **<Name>** module: <one sentence from the PRD's problem and goals>.

This draft collects the epic's pull requests and is not merged until the owner says so. Every component pull request targets `epic/<name>`. Platform changes come first, each in its own pull request, then the module. `master` is merged into the epic regularly. The first commit is empty and only opens this pull request.

### Pull requests in this epic

_None merged yet. Updated as each one is merged._

## Release notes

<The PRD's release notes draft, section 11, without the code fence.>

## How it was tested

Each component pull request is tested on its own. Before this one leaves draft: `npm run verify` and `npm run test:e2e` on the epic, and a check on desktop and at 375 pt and 402 pt wide.

## Done means (CLAUDE.md)

- [ ] `npm run fix` and then `npm run verify` pass
- [ ] New behavior has tests; no check was disabled or weakened
- [ ] UI changes were checked at 375 pt and 402 pt wide
- [ ] The diff contains no secrets, personal data or local paths
- [ ] Branch, commit and PR names follow the naming rules (`[Model name] Imperative summary`)

<the Claude Code attribution line the session gives>
