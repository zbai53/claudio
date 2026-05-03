# Build coach

This directory contains the working documents that drive Claudio's
day-to-day development. They live in version control because the project
treats process as a deliverable, not just code.

## Files

| File | Purpose |
|------|---------|
| [`01-project-overview.md`](./01-project-overview.md) | What Claudio is, why it exists, the four-layer architecture, tech stack, explicit non-goals |
| [`02-roadmap.md`](./02-roadmap.md) | Six-phase build plan with checkbox tasks and per-phase resume copy |
| [`03-progress-log.md`](./03-progress-log.md) | Daily build journal — what got done, what blocked, what's next |
| [`04-conventions.md`](./04-conventions.md) | Engineering standards (Git, code style, folder structure, error handling) |

## How they're used

These files are uploaded as Project Knowledge to a Claude.ai project that
acts as a daily build coach. Each session starts with `checkin` (which
recommends one specific task based on current phase and unchecked items)
and ends with `EOD` (which generates a new entry for `03-progress-log.md`).

The progress log is the most important file in this set. It is updated at
the end of every working session and is the single source of truth for
"where the project actually is."

## Why this is in the repo

Three reasons:

1. **Version control** — the roadmap and conventions evolve with the project;
   git history shows that evolution.
2. **Portability** — if Claude.ai access is lost, the knowledge survives.
3. **Transparency** — anyone reading the repo can see how the project is
   actually being built, not just the polished output.