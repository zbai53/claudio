# Claudio — Build Progress Log

> Daily log of what got done, what got stuck, what's next.
> The newest entry goes at the TOP. Older entries roll down.
>
> This file is the single source of truth for "where am I?". Re-upload it
> to Project Knowledge whenever you want Claude to have the latest state
> (recommended: once a week, or when starting a new phase).

---

## 2026-05-04 (Mon) · Phase 1 scaffold + env config done

**Phase:** 1 (Project skeleton & Spotify login)
**Time spent:** ~6 hrs
**Sessions today:** 1 (long)

### Done
- Set up npm workspaces monorepo: `@claudio/server` and `@claudio/client`
- Server: Express + TypeScript via `tsx watch`, `GET /api/health` returning `{ ok: true }`
- Client: Vite 9 + Vanilla TypeScript scaffold, replaced default welcome page
  with minimal Claudio landing page that calls `/api/health` to verify proxy
- Vite dev proxy `/api/* → 127.0.0.1:3000` to avoid CORS in dev and keep
  fetch paths identical between dev and prod
- Wired root `npm run dev` via `concurrently` with labeled, colored output
- Decided UI split for Phase 5: Vanilla TS for the main player, React
  sub-app for the taste editor where state management actually earns the
  dependency. Updated 02-roadmap.md.
- Renamed `SERVER_PORT` → `PORT` in `.env.example` for cloud platform
  convention (Railway/Heroku auto-inject `PORT`)
- Added `NODE_ENV` to env template
- Installed Phase 1 follow-on deps: `dotenv`, `better-sqlite3`, `cors`,
  plus matching `@types/*`
- 3 conventional commits pushed to main:
  - `chore: scaffold monorepo with server and client workspaces`
  - `docs: split Phase 5 UI into vanilla TS player and React taste editor`
  - `chore: configure env vars and install phase 1 deps`

### Blockers / lessons
- **Empty file ≠ error**: `tsx watch` ran a zero-byte `index.ts` without
  complaining, so the absence of a "listening on 3000" log was the only
  signal. Lesson: when a command runs but the expected output is missing,
  verify the input file's actual contents before debugging code logic.
- **npm workspace `-w` flag is root-relative**: running `npm install ... -w server`
  from inside `server/` makes npm look for `server/server/`. Workspace
  commands always think from the root.
- **Editor TS ≠ workspace TS**: Cursor bundles its own TypeScript and
  uses it for red squigglies by default, separate from the version in
  `node_modules/typescript`. When the IDE flags a flag that `tsc` accepts
  (e.g. `erasableSyntaxOnly`), switch via `Cmd+Shift+P → TypeScript:
  Select TypeScript Version → Use Workspace Version`. Pin permanently
  later via `.vscode/settings.json` (tech debt, not done yet).
- **Confirmed TypeScript 6.0.3 is current stable** (released 2026-03-23,
  last release on the JS codebase before the Go-based 7.0). `^6.0.3` in
  package.json is correct, not a beta version as initially suspected.

### Next session goal
Add the dotenv loader to `server/src/index.ts` with fail-fast validation
of required env vars (PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
SPOTIFY_REDIRECT_URI). Should be ~15 min, then move into Spotify OAuth:
write `GET /api/login` that redirects to Spotify with PKCE (code_verifier,
code_challenge, state). Stop before `/callback` — that's the next session.

### Mood / notes
Long session for Phase 1's first day, but ending on a clean state: 4
commits, no half-finished code, dependencies in place. The Phase 5 UI
decision (Vanilla TS + React sub-app) is a small architecture moment
that's going to read well on a resume bullet — "use React where it earns
its keep, not by default" is a senior signal.

Spent some time at the end weighing "do more vs. stop" and chose to stop
just before the dotenv loader. Right call: PKCE flow needs fresh attention
tomorrow, not tired attention tonight.

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
