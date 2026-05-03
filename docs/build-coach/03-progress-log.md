# Claudio — Build Progress Log

> Daily log of what got done, what got stuck, what's next.
> The newest entry goes at the TOP. Older entries roll down.
>
> This file is the single source of truth for "where am I?". Re-upload it
> to Project Knowledge whenever you want Claude to have the latest state
> (recommended: once a week, or when starting a new phase).

---

## 2026-05-03 (Sun) · Phase 0 complete

**Phase:** 0 (Environment & scaffold)
**Time spent:** ~3 hrs
**Sessions today:** 1

### Done
- Set up `~/Projects` as code home directory
- Cloned empty `claudio` repo, opened in Cursor
- Wrote `.gitignore`, `LICENSE`, `.editorconfig`, `README.md`, `.env.example`
- Made first Conventional Commit (`chore: initial project scaffold...`)
- Pushed to GitHub successfully — repo is live at github.com/zbai53/claudio
- Built this Project Knowledge system as a personal build coach

### Blockers / lessons
- Spotify no longer accepts `localhost` redirect URIs; only `127.0.0.1` works.
  Documented this in code-base for future reference.
- Cursor `cursor` CLI command needed a terminal restart after install — not
  obvious from the docs.
- Realized home directory was polluted with old ML project artifacts.
  Decided to leave them for now and not get sidetracked.

### Next session goal
Start Phase 1: `npm init` and set up monorepo structure (`/server`, `/client`).
Get a `GET /api/health` endpoint returning `{ ok: true }` and a Vite frontend
that just shows "Hello Claudio" — boring foundation, but proves the dev loop works.

### Mood / notes
Three days to set up the environment is longer than the average tutorial,
but the depth of understanding gained (why .gitignore protects secrets,
why Conventional Commits matter, why local + production brain modes,
etc.) is worth more than the time. Resume narrative is much stronger this way.

---

## 2026-05-02 (Sat) · Day 2 of Phase 0

**Phase:** 0
**Time spent:** ~2 hrs
**Sessions today:** 1

### Done
- Designed Spotify-edition architecture diagram (Spotify replaces NetEase,
  Google Calendar replaces Feishu)
- Decided on dual-mode deployment plan (local Claude Code, prod API)
- Made first credential setup decisions:
  - Anthropic API: $5 spending cap, auto-reload off
  - Spotify Developer App created with `127.0.0.1:3000/callback`
  - Confirmed Spotify Premium Student status — Web Playback SDK accessible

### Blockers / lessons
- Anthropic Console and claude.ai are separate products with separate
  billing — caused initial confusion.

### Next session goal
Wire up the actual repo: SSH-clone, write the four foundation files,
push first commit.

---

## 2026-05-01 (Fri) · Day 1 of Phase 0

**Phase:** 0
**Time spent:** ~2 hrs
**Sessions today:** 1

### Done
- Decided to do this project at all (analyzed the original Claudio inspiration)
- Mapped out tech-stack substitutions (Spotify, Google Calendar, OpenWeather)
- Got clarity on time budget (2-3 hrs/day, ~5 weeks total)

### Blockers / lessons
None — this was a planning day.

### Next session goal
Touch keyboard tomorrow. Concrete environment setup tasks.

---

## How to use this log

**At the start of each session:** read the most recent entry to remember
where you left off.

**At the end of each session:** add a new entry at the top using this template:

```markdown
## YYYY-MM-DD (Day) · One-line summary

**Phase:** N (name)
**Time spent:** ~X hrs
**Sessions today:** N

### Done
- Bullet list of accomplishments
- Each item should be specific (not "worked on backend")

### Blockers / lessons
- Things that took longer than expected, surprises, things to remember

### Next session goal
- One specific thing to start with next time.
- Helps avoid the "where was I?" friction.

### Mood / notes (optional)
- Anything else worth capturing
```

**Weekly:** re-upload this file to Claude Project Knowledge so the build
coach has fresh context.

**At the end of each phase:** copy the resume copy from `02-roadmap.md` for
that phase and update your actual resume / portfolio site.
