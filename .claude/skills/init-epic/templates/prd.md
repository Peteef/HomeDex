# <Name> — Product Requirements Document

- **Module:** `<module-id>`
- **Epic branch:** `epic/<name>`
- **Epic PR:** _(set when the draft PR is opened)_
- **Release:** minor
- **Status:** Draft · <YYYY-MM-DD> (becomes "Agreed · <date>" on the owner's approval, "Released in v<version>" after the merge)
- **Authors:** <owner> (owner), <model> (interview and write-up)
- **Sources:** `<draft file name>` (the owner's draft, kept as written), the repository's `CLAUDE.md` and `src/modules/README.md`
- **Implementation plan:** `plan/00-overview.md` in this folder

**How to read this document.** **Decided** = chosen by the owner. **Proposed** = the planner's recommendation, accepted unless the owner objects; the implementation plan may refine it. **Open** = needs an answer before the work that depends on it. Executors never treat Proposed or Open as permission to improvise: if a Proposed detail does not work out, stop and ask.

## 1. Problem

<What hurts today, for whom, and what was tried. A paragraph, in the owner's terms.>

## 2. Goals and success criteria

Goals:

1. <An outcome, not a feature.>

Success looks like: <observable signs after some weeks of use.>

## 3. Users and context

- **Shared or personal data:** <who sees and changes what.>
- **Devices:** <how the feature is used on a phone and on a desktop; each gets a native layout.>
- **Context:** <climate, language, time zone, domain knowledge the users bring.>
- **Platform:** the module follows the platform's contract, themes, languages and accessibility rules.

## 4. Scope

### MVP (this epic)

1. <Capability> (<PREFIX>-01, ...).

### Later (not in this epic)

- <Nice-to-have the owner left out, with a word on why if it helps.>

### Non-goals

- <What this will never do, and why (platform rules count: no external fetching at runtime, no paid services).>

## 5. Domain model and rules

### <Main entity>

| Field   | Rule                                        |
| ------- | ------------------------------------------- |
| <Field> | <Required or optional, limits, uniqueness.> |

### <Cross-cutting definitions: dates, seasons, units, "today", ...>

- <Definition.> (Decided)

### Rules

- **R1 <Name>.** <What happens, from which input, with an example for anything arithmetic.> (Decided / Proposed)
- **R2 ...**
- **R<n> Several users at once.** <How open screens catch up with other users' changes, and what happens when an action meets a state someone else already changed.>

## 6. Requirements

Each requirement has an ID the implementation plan refers to. "Phone" means 375 and 402 pt wide; "desktop" means Chrome and Safari.

**<PREFIX>-01 Module and tile.** <The module's route and its home tile.>

- <Acceptance criterion: observable, testable.>

**<PREFIX>-02 ...**

**<PREFIX>-<n> Language and theme.** All text in English and Polish (section 10); every screen follows the day and night themes, with 4.5:1 text contrast and 44 pt touch targets.

## 7. UX per device

**Phone.** <Navigation, the first screen, where each action lives, sheets.>

**Desktop.** <Arrangement, dialogs.>

**Both.** <Shared states: loading, empty, error, refresh; accessibility; reduced motion.>

## 8. Platform needs

Each is its own pull request into the epic branch, merged before the first module PR that uses it, with its own tests and docs. Designs are Proposed; the plan details them.

- **P1 <Need>.** <What the module needs that it cannot get through the public APIs today, and the proposed shape.>

Not in this epic: <parked platform items the owner decided against now.>

## 9. Data and privacy

- **Tables (Proposed):** `<module_id_snake>_<table>` ... Created by the module's own migrations; <cascades>.
- **Files and media:** <format, size, where stored, metadata stripped, served behind the login.>
- **Repository:** tests, fixtures and screenshots use fake data and generated media only.
- **Removing the module** leaves its tables, as for every module.

## 10. Text and language

- English is the source; Polish reads naturally and avoids gendered forms.
- **Name:** "<English>" / "<Polish>". Tile description: "<English>" / "<Polish>".
- <Plurals, dates, user data that is never translated.>
- The server's messages stay English; the UI shows its own translated message for every failure.

## 11. Release notes draft

The public text of the epic's pull request (format: the repository's `docs/releases.md`). Updated as the epic grows.

```markdown
### <Name>

<One or two sentences: what HomeDex can do now.>

- <Something you can do now.>

**Before updating:** <only when needed>
**After updating:** <only when needed>
```

## 12. Decisions log and open questions

### Decisions (<YYYY-MM-DD>, owner)

1. <One line per decision, in the owner's terms.>

### Open

1. <Question, and what depends on it.>
