# Claudio — Build Roadmap

> The phase-by-phase task breakdown. Claude uses this to know what's done,
> what's next, and what specifically to recommend on any given day.
>
> Estimates assume 2–3 hours/day. Real time will be 1.5–2× longer than
> ideal estimates (Hofstadter's law). Don't beat yourself up over slippage.

## Status legend

- `[x]` done
- `[~]` in progress
- `[ ]` not started
- `[!]` blocked or stuck (note in progress log)

## Phase 0 — Environment & scaffold ✅

**Estimate:** 7 hrs · **Actual:** ~7 hrs over 3 days · **Status:** complete

- [x] Verify Node.js 20+, npm, Git installed
- [x] Configure Git identity with GitHub noreply email
- [x] Verify SSH connection to GitHub
- [x] Create Anthropic Console account, set $5/month spending cap
- [x] Create Spotify Developer App, register `127.0.0.1:3000/callback`
- [x] Create empty GitHub repo `zbai53/claudio` (rename to lowercase)
- [x] Establish `~/Projects/` as code home directory
- [x] Clone repo locally
- [x] Write `.gitignore` (Node + .env protection + macOS noise)
- [x] Add MIT `LICENSE`
- [x] Add `.editorconfig`
- [x] Write initial `README.md` with badges, architecture ASCII, roadmap
- [x] Write `.env.example` documenting all env vars
- [x] First Conventional Commit, push to GitHub

**Resume copy after this phase:**
> "Personal AI radio with multi-source context fusion. Designed a four-layer
> architecture spec, scaffolded with Conventional Commits, MIT-licensed,
> .env-protected. Active development."

---

## Phase 1 — Project skeleton & Spotify login

**Estimate:** ~10 hrs over 4–5 days · **Actual:** ~12.5 hrs over 5 days · **Status:** complete

### Goals
- A running Node.js backend on `127.0.0.1:3000`
- A running Vite frontend on `127.0.0.1:5173`
- Click "Log in with Spotify" → OAuth flow → see your Spotify display name
- All secrets in `.env`, never committed

### Task list
- [x] `npm init` in repo root, set up monorepo structure (`/server`, `/client`)
- [x] Create real `.env` from `.env.example`, fill in Spotify credentials
- [x] Install backend deps: `express`, `dotenv`, `better-sqlite3`, `cors`
- [x] Install dev deps: `nodemon`, `typescript`, `@types/express`, `@types/node`
- [x] Set up `tsconfig.json` for both server and client
- [x] Write minimal Express server: `GET /api/health` returns `{ ok: true }`
- [x] Set up Vite + TypeScript on the client side
- [x] Wire `npm run dev` to start both server and client concurrently
- [x] Implement Spotify OAuth flow:
  - [x] `GET /api/login` redirects to Spotify with PKCE
  - [x] `GET /callback` exchanges code for tokens
  - [x] Store tokens in SQLite (encrypted-ish — at least not plaintext logs)
  - [x] `GET /api/me` returns current user's Spotify profile
- [x] Frontend: a single button "Log in with Spotify" + display name on success
- [x] First end-to-end commit: "feat: spotify oauth login flow"

### Deliverable
A short demo: open `http://127.0.0.1:5173`, click button, complete Spotify
login, see "Hi, Zhihao" on screen. Boring but proves the foundation works.

### Resume copy after this phase:
> "Personal AI radio. Implemented Spotify OAuth (PKCE flow) with SQLite
> token storage and refresh rotation. Built monorepo structure with
> Node.js backend + Vite frontend, wired with concurrent dev script."

---

## Phase 2 — Brain adapter (the dual-mode core)

**Estimate:** ~14 hrs over 5–6 days · **Actual:** ~4 hrs over 2 days · **Status:** complete ✅

### Goals
- One module: `server/src/brain/index.ts`
- Calls `Brain.invoke(prompt)` returns parsed `{say, play[], reason, segue}`
- Switches between subprocess and API mode via `BRAIN_MODE` env var
- Subprocess mode spawns `claude -p`, captures stdout
- API mode calls `@anthropic-ai/sdk`
- Both produce identical JSON output

### Task list
- [x] Define TypeScript types for the JSON contract: `BrainResponse`
- [x] Write the abstract `Brain` interface
- [x] Implement `SubprocessBrain` — spawns Claude Code, streams stdout
- [x] Implement `ApiBrain` — calls Anthropic SDK with same system prompt
- [x] Build a factory: `createBrain()` reads env, returns the right one
- [x] Add a JSON schema validator (zod) so malformed responses fail loud
- [x] Write 3–5 unit tests covering both adapters with mocked output
- [x] Add `npm run brain:test` — invokes brain with a sample prompt, prints output
- [x] Document the contract in `docs/brain-contract.md`

### Why this is interview gold
This is the most resume-worthy module in the project. Talking points:
- Adapter pattern for swappable AI providers
- Cost optimization: free local development via subprocess, paid production via API
- Schema validation prevents downstream parsing bugs
- Stream parsing for long responses (subprocess can yield incrementally)

### Resume copy after this phase:
> "Designed a dual-mode brain adapter that abstracts the LLM provider
> interface. Local development uses a Claude Code subprocess (zero API
> cost); production uses the Anthropic API. Both adapters return a
> validated JSON contract via Zod schemas."

---

## Phase 3 — Context assembly & first DJ output

**Estimate:** ~13 hrs over 5–6 days · **Status:** not started

### Goals
- A function `assembleContext(trigger)` returns a 6-fragment prompt
- Pulls user taste from markdown files
- Pulls environment (weather, calendar) from APIs
- Pulls memory from SQLite
- Pipes through `Brain.invoke()` and gets a real DJ response
- Logs full prompt + response to a debug file

### Task list
- [ ] Create `data/user/taste.md`, `routines.md`, `mood-rules.md` with starter content
- [ ] Write `loaders/taste.ts` to read these files
- [ ] Write `loaders/environment.ts` to call OpenWeather + Google Calendar
- [ ] Write `loaders/memory.ts` to query last 20 plays from SQLite
- [ ] Write `context/assemble.ts` — the 6-fragment composer
- [ ] Write `prompts/dj-persona.md` — the system prompt
- [ ] Wire it together: `POST /api/dj/invoke` triggers the full pipeline
- [ ] Add Spotify recommendation lookup: when brain says `play: ["track name"]`,
      resolve to actual Spotify track URIs via `GET /v1/search`
- [ ] Console-print a beautifully formatted result for debugging

### Deliverable
Run `curl -X POST http://127.0.0.1:3000/api/dj/invoke` and get back JSON
with 3 song suggestions and a DJ intro line that actually sounds like it
read your taste preferences. The first time this works it will feel magical.

### Resume copy after this phase:
> "Implemented a 6-fragment prompt assembly system that fuses user taste
> markdown, environmental signals (weather, calendar), and listening
> history into a coherent context. Output is structured JSON resolved
> against Spotify's search API for playable track URIs."

---

## Phase 4 — Runtime: scheduler + state + TTS

**Estimate:** ~13 hrs over 5–6 days · **Actual:** ~8 hrs over 1 day · **Status:** complete ✅

### Goals
- 7 AM plan trigger fires automatically (cron-style)
- 9 AM morning brief delivered as voice + text
- All state persists across server restarts
- Web Speech API speaks DJ intros in the browser

### Task list
- [x] Add `node-cron` for scheduling
- [x] Implement triggers: morning plan (7 AM), morning brief (9 AM), hourly mood check
- [x] Write `state/repository.ts` — typed wrapper around SQLite
- [x] Migrations: `messages`, `plays`, `plan`, `prefs` tables
- [x] Write `router.ts` — dispatches user input to direct/spotify/claude paths
- [x] Implement TTS pipeline:
  - [x] Browser-side: Web Speech API integration
  - [x] Cache TTS output by hash of text (so repeats are instant)
- [x] Add WebSocket server for live "now playing" updates
- [x] Frontend: subscribe to WS, animate DJ message in/out

### Resume copy after this phase:
> "Built a cron-driven scheduler that proactively triggers AI invocations
> at user-defined times (morning planning, hourly mood checks). Persisted
> all state in SQLite with typed repository pattern. Voice synthesis via
> Web Speech API with content-hash caching."

---

## Phase 5 — PWA player UI

**Estimate:** ~11 hrs over 4–5 days · **Actual:** ~5 hrs over 2 days · **Status:** complete ✅

### Goals
- Looks and feels like a real product, not a dev tool
- Spotify Web Playback SDK plays music in the browser
- DJ chatter visible above the player
- Taste editor lets the user update `taste.md` in-app
- Installable as PWA (offline cache)

### Architecture decision (Phase 5 specific)
Primary player UI stays in Vanilla TypeScript — minimal bundle, the
state model is simple (now-playing + WS event stream). The Taste Editor
is built as a separate React sub-app, mounted at `/settings/taste`.
Rationale: markdown editing with live preview, form state, and auto-save
genuinely benefits from React's state model; vanilla TS would either
reinvent it or get messy. This split is the architecture story for the
resume bullet — "use React where it earns its keep, not by default."

Build implication: Vite supports multiple entry points. The root
`index.html` loads the vanilla-TS player; `settings/taste/index.html`
loads the React sub-app. Both share the same dev server.

### Task list
- [x] Integrate Spotify Web Playback SDK
- [x] Build `<NowPlaying />` component (vanilla TS)
- [x] Build `<DjBubble />` for streaming chatter (vanilla TS)
- [x] Build `<Settings />` — toggle voices, change persona, view spending (vanilla TS)
- [x] Configure Vite multi-entry: add `settings/taste/index.html` as second entry
- [x] Install React stack in client: `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-markdown`
- [x] Build `<TasteEditor />` in React — markdown editor + live preview, writes to `data/user/taste.md` via `PUT /api/taste`
- [x] Add service worker for offline cache (covers both entries)
- [x] Add `manifest.json` for PWA install
- [x] Polish: typography, spacing, dark mode

### Resume copy after this phase:
> "Built a Progressive Web App player with Spotify Web Playback SDK
> integration and real-time DJ commentary via WebSocket. Primary player
> UI in Vanilla TypeScript for minimal bundle size; embedded a React +
> react-markdown sub-app for the in-app taste editor where richer state
> management justified the dependency. Installable as a standalone app
> on mobile and desktop."

---

## Phase 6 — Deploy + portfolio polish

**Estimate:** ~8 hrs over 3–4 days · **Status:** not started

### Goals
- A public URL that works end-to-end
- Demo video embedded in README
- Section on personal site links to the project
- README rewritten with screenshots

### Task list
- [ ] Set up Railway project, deploy backend
- [ ] Set up Vercel project, deploy frontend
- [ ] Add production redirect URI to Spotify dashboard
- [ ] Add production env vars (Anthropic API key, Spotify credentials)
- [ ] Test full flow on production URL
- [ ] Add custom domain (optional, e.g. `claudio.zbai53.com`)
- [ ] Record 60-second demo video, upload to YouTube unlisted
- [ ] Embed video in README
- [ ] Take screenshots of player UI, add to README
- [ ] Rewrite "What I built" section with concrete metrics
- [ ] Add "Architecture deep dive" doc in `/docs`
- [ ] Update personal site with link + screenshots
- [ ] LinkedIn post announcing it

### Resume copy after this phase (final):
> "Personal AI radio. Reads calendar and weather, reviews listening
> history, builds a daily playlist with DJ-style intros, plays through
> Spotify Premium. Four-layer architecture with dual-mode brain (Claude
> Code subprocess locally, Anthropic API in production). Deployed on
> Vercel + Railway with $5/mo cost guardrails and OAuth credential
> isolation. Tech: Node.js, Express, SQLite, Spotify Web Playback SDK,
> Vite PWA."

---

## Cross-phase principles (apply always)

1. **Commit at the end of every session**, even if incomplete. Use
   `wip:` prefix for in-progress work.
2. **Update `03-progress-log.md` at end of each session** with what you
   did, what blocked you, and what's next.
3. **When stuck for 30+ minutes**, write down the exact error and ask
   in the next checkin instead of grinding alone.
4. **Don't merge PRs into main without testing** the running app
   actually works after the change.
5. **Refactor only when the next feature demands it**, not "while I'm
   here." Avoid scope creep.
