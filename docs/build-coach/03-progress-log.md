# Claudio — Build Progress Log

> Daily log of what got done, what got stuck, what's next.
> The newest entry goes at the TOP. Older entries roll down.
>
> This file is the single source of truth for "where am I?". Re-upload it
> to Project Knowledge whenever you want Claude to have the latest state
> (recommended: once a week, or when starting a new phase).

---


## 2026-05-12 (Tue) · Phase 2 complete — brain adapter ships

**Phase:** 2 (Brain adapter)
**Time spent:** ~2 hrs
**Sessions today:** 1

### Done
- Implemented SubprocessBrain: spawns claude -p as a child process,
  pipes prompt to stdin, collects stdout, parses as BrainResponse JSON
- Implemented ApiBrain: calls Anthropic API via @anthropic-ai/sdk,
  extracts first text block from response, parses as BrainResponse JSON
- Added createBrain() factory: reads BRAIN_MODE env var, returns the
  appropriate adapter, throws on unknown values (fail fast)
- Replaced hand-written validate() methods with Zod schema:
  BrainResponseSchema is single source of truth for both runtime
  validation and TypeScript type (derived via z.infer)
- Wrote 9 unit tests (vitest): 5 for BrainResponseSchema, 4 for
  createBrain factory — all green in 357ms
- Added README.md to .prettierignore — Prettier was stripping alignment
  spaces from the ASCII architecture diagram on every format run

### Blockers / lessons
- stdin.end() is required after writing to a subprocess stdin —
  without it the child process waits indefinitely for more input
- unknown vs any: unknown forces explicit type checks before use,
  any bypasses them entirely. validate() exists to check types, so
  unknown is the right choice
- Fail fast vs default values: createBrain() throws on missing
  BRAIN_MODE instead of defaulting to subprocess. A missing env var
  should surface at startup, not silently run the wrong adapter in
  production and fail on the first invoke() call
- Promise<BrainResponse> not BrainResponse: LLM calls take 2-10
  seconds. Async return lets Node.js handle other requests while
  waiting; synchronous would freeze the event loop

### Next session goal
Phase 2 is complete. Before Phase 3 (context assembly), update
02-roadmap.md to mark Phase 2 tasks complete. Then start Phase 3
first task: create data/user/taste.md, routines.md, mood-rules.md
with starter content and write loaders/taste.ts to read them.

### Mood / notes
Phase 2 ships clean: 6 commits, dual-mode adapter pattern, Zod
validation, 9 tests. The brain module is the most interview-worthy
piece of the project so far — adapter pattern, cost optimization,
schema validation, async design all in one module.

## 2026-05-10 (Sun) · Phase 1 backlog cleared, Phase 2 types defined

**Phase:** 1 backlog → 2 (Brain adapter)
**Time spent:** ~2 hrs
**Sessions today:** 1

### Done
- Installed Prettier + ESLint (typescript-eslint, eslint-config-prettier)
  as root devDependencies covering the full monorepo
- Configured .prettierrc.json (singleQuote, semi, trailingComma all,
  printWidth 100) and .prettierignore (excludes docs/, data/, lock file)
- Configured eslint.config.js with ESLint 9 flat config format,
  typescript-eslint recommended preset, prettier integration
- Added format, format:check, lint scripts to root package.json
- Added "type": "module" to root package.json — eslint.config.js uses
  ESM imports; without this Node reparsed it on every lint run
- Fixed .gitignore: .vscode/ → .vscode/* so the !settings.json
  exception rule actually takes effect (git ignores ! exceptions when
  the parent directory itself is ignored)
- Added .vscode/settings.json: pin TS to workspace version, format on
  save, ESLint auto-fix on save — committed so anyone cloning gets the
  same editor behavior
- Updated README: fixed C## Architecture typo, removed "not all
  components implemented" warning, updated roadmap checkboxes
- Marked all Phase 1 tasks complete in 02-roadmap.md with actual time
- Defined BrainResponse interface (say, play[], reason, segue) and
  Brain interface (invoke returns Promise<BrainResponse>) in
  server/src/brain/types.ts — the JSON contract every LLM adapter
  must satisfy

### Blockers / lessons
- Dot file naming: .prettierrc.json must have the leading dot or
  Prettier silently ignores it and falls back to defaults. First
  debug move when a config tool "isn't working": ls -la to verify
  the filename is exactly right.
- .gitignore parent directory rule: if a directory is ignored with
  dir/, files inside cannot be un-ignored with !dir/file. Fix is
  dir/* (ignore contents) instead of dir/ (ignore directory).
- Promise vs synchronous return: LLM calls take 2-10 seconds.
  Returning Promise<BrainResponse> lets Node.js handle other requests
  while waiting; a synchronous return would freeze the event loop.

### Next session goal
Phase 2 — implement SubprocessBrain: spawn a claude -p subprocess,
pipe the prompt to stdin, collect stdout, parse the JSON response
into BrainResponse. This is the local development path (zero API cost).
Start with server/src/brain/subprocess.ts.

### Mood / notes
Clean session. No blockers, 2 hrs, 5 commits. Toolchain is now
automated — Prettier and ESLint run on save, no more manual format nits.
Phase 2 has its foundation: the type contract is defined before any
implementation is written, which is the right order.
---


## 2026-05-08 (Fri) · Phase 1 milestone — Spotify login flow complete

**Phase:** 1 (Project skeleton & Spotify login) — **COMPLETE**
**Time spent:** ~3 hrs
**Sessions today:** 1

### Done
- Implemented `auth/tokenService.ts` with two functions:
  - `getValidAccessToken()` — eager refresh strategy. Checks `expires_at`
    against `Date.now()`, refreshes if within a 60s buffer, returns a
    guaranteed-valid token. Business code never has to retry.
  - `refreshAccessToken()` — server-to-server POST to Spotify token
    endpoint with `grant_type=refresh_token`. Handles the spec quirk
    where Spotify may or may not rotate the refresh_token by falling
    back to the existing one with `??`.
- Implemented `GET /api/me` in a new `user/` module:
  - Resolves a valid token via `tokenService`, calls Spotify `/v1/me`
    with `Bearer` auth header
  - Translates response to a clean public shape (id, displayName,
    imageUrl, spotifyUrl), decoupling frontend from Spotify's wire format
  - Returns differentiated 401 vs 502 status codes for different failure
    modes (not authenticated vs upstream error)
  - All error responses are JSON with `error` code + `message`,
    matching the success path content type
- Added `CLIENT_URL` env var so `/callback` redirects to the frontend
  instead of returning plain text. Decouples server from frontend URL
  (different in dev vs prod).
- Replaced the health-check landing page with a proper auth UI:
  - Discriminated union State type (`loading` | `loggedOut` | `loggedIn`
    | `error`) makes invalid UI states unrepresentable
  - On page load, fetches `/api/me` to determine state. Server is the
    single source of truth; frontend never tracks login state itself.
  - Renders the corresponding view: spinner, Spotify-branded login
    button with scale-on-hover feedback, or greeting with display name
    + avatar
  - Escapes `display_name` before `innerHTML` injection (XSS defense
    against user-controlled content)
- Verified end-to-end in a clean browser session:
  - Cleared `tokens` table, refreshed page → saw login button
  - Clicked button → Spotify consent → callback → frontend redirect
  - Saw "Hi, bai" with avatar rendering correctly
- 2 conventional commits:
  - `feat(auth): add token refresh and authenticated user profile endpoint`
  - `feat: phase 1 milestone — full spotify login flow with display name`

### Blockers / lessons
- **Eager vs lazy token refresh**: chose eager (refresh before token
  expires) over lazy (refresh on 401, retry). Eager keeps business code
  simple — every caller of `getValidAccessToken()` gets a usable token,
  no retry logic. Lazy spreads retry handling across every API call site.
  For an ambient agent that calls Spotify when the user isn't watching,
  eager is the right default.
- **Spotify may or may not rotate refresh_token**: missed this on the
  first read of the spec. Code that always saves `data.refresh_token`
  will write `undefined` to the column when Spotify omits it. `??`
  fallback to the existing token is the fix. Generalizable: when an
  API spec says "may or may not", assume both branches and handle each.
- **Discriminated union for UI state**: 4 distinct UI states (loading,
  loggedOut, loggedIn, error), each with different required data. A
  single `if/else` on flags would let invalid combinations through
  (e.g., "logged in but no profile"). The union type makes such states
  uncompilable. This is "make illegal states unrepresentable" applied
  to UI.
- **innerHTML + user-controlled content = stored XSS**: Spotify
  display_name is whatever the user typed, including potentially
  `<script>alert(1)</script>`. Direct `innerHTML` would execute it.
  Escape function is mandatory. Caught it because I'd seen the pattern
  before; without that prior, easy to ship as a bug.
- **Server vs client as source of truth for auth state**: the frontend
  doesn't try to remember "I just logged in." It always asks
  `/api/me` on load. Stateless frontend is simpler and avoids the
  classic bug where the frontend thinks you're logged in but the server
  has dropped the session.

### Next session goal
Phase 1 main flow is done. Phase 2 (brain adapter) is the next major
deliverable, but before starting, do the carrying-forward backlog:
1. Install Prettier + ESLint, automate format nits (~30 min)
2. Pin editor TS version via `.vscode/settings.json` (~5 min)
3. Update README to reflect Phase 1 completion + add a screenshot of
   the logged-in state (~30 min)
4. Replace in-memory PKCE store with SQLite or signed cookies (~45 min,
   tech debt cleanup before Phase 2)
5. Mark all Phase 1 tasks `[x]` in `02-roadmap.md`

These together are a ~2 hr session. Then Phase 2 starts fresh — brain
adapter is its own focused work, deserves a clean head.

### Mood / notes
Phase 1 took ~12.5 hrs against a ~10 hr estimate (+25%). Within
acceptable variance, especially given two real engineering detours
(`.ts/.js` ESM modes, configuration drift across .env/Dashboard/code).
Both detours produced lasting understanding worth more than the time.

The biggest growth from Phase 1 isn't code-shaped, it's mental:
- OAuth from "buzzword" to "I can implement and explain it"
- "Configuration drives code" as a deployable pattern, not slogan
- Repository pattern as a default reflex, not novelty
- Conventional commits as muscle memory, not chore

Backlog (carrying forward to Phase 2 prep):
- Prettier + ESLint setup
- `.vscode/settings.json` for TS version pinning
- README update + screenshot
- In-memory PKCE store → SQLite or signed cookie
- 02-roadmap.md task checkboxes

This is a good day. Phase 1 ships.


---

## 2026-05-06 (Wed) · Spotify OAuth round-trip complete

**Phase:** 1 (Project skeleton & Spotify login)
**Time spent:** ~4 hrs
**Sessions today:** 1

### Done
- Reviewed yesterday's PKCE concepts; got three out of three protocol
  questions wrong on first try, then re-anchored with the full 12-step
  flow diagram. The "answered wrong → corrected" loop sticks better
  than passively re-reading.
- Added `state/db.ts`: SQLite connection with `better-sqlite3`, WAL
  journal mode, foreign key enforcement, idempotent schema migration on
  startup. Database file at `data/claudio.db`, gitignored alongside
  `*.db-wal` and `*.db-shm`.
- Added `state/tokenRepository.ts`: typed save/load with prepared
  statements, `CHECK(id = 1)` single-row constraint, snake_case to
  camelCase translation at the persistence boundary. Repository pattern
  hides SQL from the rest of the server.
- Implemented `GET /api/auth/callback`:
  - Parse and validate `code`, `state`, `error` from Spotify redirect
  - Reject mismatched or expired state (CSRF defense via `consume`-once
    semantics in the in-memory store)
  - Exchange `code + verifier` for tokens via `x-www-form-urlencoded`
    POST to Spotify's token endpoint, using native `fetch`
  - Distinguish network-level errors from non-2xx HTTP responses (the
    classic `fetch` quirk where bad responses don't throw); return 502
    with separate diagnostic logs for each
  - Convert `expires_in` (relative seconds) to `expires_at` (absolute
    epoch ms) before persisting
- Added `DATABASE_PATH` to required env vars; wired db init via
  side-effect import in `index.ts`
- Verified end-to-end: visited `/api/auth/login`, completed Spotify
  consent, landed back at `/api/auth/callback`, saw "Login successful"
  in browser and `OAuth round-trip complete` in server logs. SQLite
  query confirms tokens persisted with correct ~3600s TTL.
- 1 conventional commit:
  - `feat(auth): complete spotify oauth round-trip with sqlite token storage`

### Blockers / lessons
- **Configuration drift across systems**: code expected callback at
  `/api/auth/callback`, `.env` had `/callback`, Spotify Dashboard had
  `/callback`. All three must agree, exactly. Lesson: when integrating
  with an external system, read the external config FIRST, then write
  code to match. Don't write code based on assumed paths.
- **`fetch` doesn't throw on non-2xx**: a Spotify 400 response returns
  `response.ok === false` but doesn't throw, unlike `axios`. Forgot this
  initially — needed the `if (!tokenResponse.ok)` branch separate from
  the `try/catch`. Two distinct failure surfaces, two distinct handlers.
- **`-m "multi-line"` in zsh is unreliable**: a long commit message with
  `*`, `()`, `!` characters silently failed to commit (no error, but
  staging unchanged). Switched to `git commit -F file` with heredoc
  using single-quoted EOF marker to disable shell interpolation.
  Generalizable: for any commit body more than 1-2 lines, use `-F` or
  the editor (`git commit` with no `-m`). Reserve `-m` for trivial
  one-liners.
- **OAuth state vs PKCE verifier — one more reframe**: state defends
  against "someone tricks me into completing their flow" (CSRF);
  verifier defends against "my own flow's code gets intercepted in
  redirect" (replay/interception). Two different attacks. Implementing
  both in the same callback handler made this concrete in a way that
  reading docs didn't.
- **Prepared statements + parameter binding aren't optional**: SQL
  injection is the textbook reason, but the secondary value is type
  safety (named params catch field-order errors that positional `?`
  wouldn't).

### Next session goal
Phase 1 wrap-up:
1. Add `GET /api/me`: load token from SQLite, call Spotify
   `/v1/me` with bearer auth, return user profile JSON. If token is
   expired (compare `expires_at` to `Date.now()`), refresh first using
   the refresh_token. This forces us to implement token refresh logic
   before Phase 2 — better now than later.
2. Frontend: replace the health-check-only landing page with a "Log in
   with Spotify" button. After login, fetch `/api/me` and show the
   display name. This is the deliverable for Phase 1.
3. Phase 1 wrap-up commit: `feat: phase 1 milestone — full spotify
   login flow with display name`.

Stretch (do only if energy is fresh):
- Install Prettier + ESLint, automate format nits (carrying from earlier
  backlog)
- Pin editor TS version via `.vscode/settings.json`

### Mood / notes
Today went deep. Started the morning genuinely confused on PKCE (got
all three review questions backwards). By evening, the protocol is
implemented end-to-end with proper error handling, token persistence,
and verified round-trip. The fact that 12-step flow now feels obvious
is the real win — not the code.

The configuration drift bug (.env vs Dashboard vs code) was annoying
but valuable. Real OAuth integrations always have this pattern of
"three places where the same value lives". Will remember this when
seeing Webhook configs, OAuth in CI/CD, anything with external
registration. Vosyn's Django + GitHub Actions had similar shapes —
makes more sense in retrospect.

Repository pattern in `tokenRepository.ts` is the cleanest piece of
architecture I've written this project. SQL stays in one file, business
code calls `tokenRepository.save({ accessToken, refreshToken, expiresAt })`,
storage details are invisible. This is the model for how every other
table will be accessed.

Backlog (carrying forward):
- Install Prettier + ESLint, automate format nits
- Pin editor TS version via `.vscode/settings.json`
- Replace in-memory PKCE store with SQLite (now that token persistence
  is in place, this is small)
- Token encryption for production deploy (Phase 6 concern, not now)

## 2026-05-05 (Tue) · OAuth login redirect with PKCE working

**Phase:** 1 (Project skeleton & Spotify login)
**Time spent:** ~3.5 hrs
**Sessions today:** 1

### Done
- Built `server/src/config.ts` for env loading with fail-fast validation:
  - Explicit `.env` path via `path.resolve(__dirname, '../../.env')`
    instead of `dotenv/config`, to avoid cwd ambiguity in npm workspaces
  - `__dirname` derived from `import.meta.url` because ESM has no global
  - Validates 5 required vars on startup; throws with full list of missing
- Fixed tsconfig: removed `allowImportingTsExtensions` since server uses
  production mode A (compile to dist/, run `node dist/index.js`).
  Imports use `.js` paths even though source is `.ts` — modern ESM idiom
- Verified the build chain: `npm run build -w server` produces clean
  `dist/index.js` and `dist/config.js`
- Implemented Spotify OAuth login redirect with PKCE:
  - `auth/pkce.ts`: pure functions for code_verifier (32 random bytes),
    code_challenge (SHA-256 of verifier), and state (32 random bytes)
    using `node:crypto` with base64url encoding throughout
  - `auth/store.ts`: in-memory Map keyed by state with 10-min TTL and
    consume-on-read semantics for replay protection
  - `auth/routes.ts`: `GET /api/auth/login` generates params, saves
    verifier keyed by state, redirects to Spotify via URLSearchParams
  - All 7 OAuth query params verified correct on a real Spotify redirect
- 3 conventional commits pushed:
  - `docs: log Phase 1 scaffold and env config session`
  - `feat(server): add env loading with fail-fast validation`
  - `feat(auth): add spotify oauth login redirect with pkce`

### Blockers / lessons
- **dotenv + npm workspace cwd trap**: `dotenv/config` reads from cwd,
  but `npm run dev -w server` sets cwd to `server/`. The `.env` lives
  at the repo root. Fix: explicit `path.resolve(__dirname, ...)`.
  Generalizable: never rely on cwd for file paths in monorepos.
- **`allowImportingTsExtensions` ⇄ `noEmit` are paired flags**: server
  needs to emit JS for production, so it can't use either. Client uses
  both because Vite handles bundling. Don't blindly copy tsconfig flags
  between workspaces.
- **"Make IDE red squigglies disappear" ≠ "fix the problem"**: when a
  TS flag errored, instinct was to add `noEmit` to silence it, but that
  put the config in a contradictory state. Lesson: read the error,
  understand what it actually wants, decide the right fix. Don't
  reflexively reach for `Fix in Composer`.
- **PKCE ≠ state**: they solve different attacks. PKCE protects against
  the auth code being intercepted in the redirect; state protects
  against CSRF (someone tricking you into completing their OAuth flow).
  Both required for a real implementation.
- **`URLSearchParams` over manual string concat for query strings**:
  spaces, special chars, and unicode all encode correctly. Hand-rolled
  query building is a bug magnet — interview-worthy point.

### Next session goal
Implement `/callback` to complete the OAuth round-trip:
1. Receive `?code=...&state=...` from Spotify redirect
2. Validate state against pending auth store (reject mismatched/missing)
3. Look up code_verifier by state, then exchange code+verifier for
   access_token+refresh_token at `https://accounts.spotify.com/api/token`
4. Persist tokens (decision needed: SQLite schema vs encrypted file)
5. Test full round-trip: visit /api/auth/login → log in → land back at
   /callback → server logs the tokens

Stop before `/api/me` — that's the next session.

### Mood / notes
Today's 3.5 hours felt productive without being draining. The PKCE
explanation before coding made the implementation feel obvious instead
of cargo-culted from a tutorial. Now I can describe the protocol from
memory: verifier → SHA-256 → challenge → Spotify keeps challenge → at
token exchange, prove ownership by re-presenting verifier.

The .ts/.js detour was the second time I tripped over an ESM+TS edge
case. Worth writing the resolution somewhere I'll remember next project.

Backlog (carrying forward):
- Install Prettier + ESLint, automate format nits (~30 min, before /callback)
- Pin editor TS version via .vscode/settings.json (~5 min)
- Replace in-memory PKCE store with SQLite once token persistence is in
- Decide token storage approach (SQLite plain text vs encrypted-at-rest)


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
