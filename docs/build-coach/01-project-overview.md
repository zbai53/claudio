# Claudio — Project Overview

> This is the master context file. Claude reads this first to understand
> what the project is, why it exists, and what shape it has. Other knowledge
> files (roadmap, progress log, conventions) build on top of this.

## Identity

**Project name:** Claudio
**Repository:** https://github.com/zbai53/claudio
**Owner:** Zhihao Bai (GitHub: zbai53)
**Started:** Late April 2026
**Status:** In active development — Phase 0 complete (3 days), Phase 1 next
**Primary goal:** Resume-grade portfolio project + learning vehicle for agentic LLM design

## What it is

A personal AI radio. Not a chatbot, not a search box. An ambient companion that:

- Reads the user's calendar, weather, and listening history
- Builds a daily playlist tailored to time of day, mood, and activity
- Writes DJ-style intros between tracks (in user-defined persona)
- Speaks the intros via TTS
- Plays music through Spotify Premium

The user describes their taste once (in markdown files), and the system
learns continuously from listening behavior. The result is a private
radio station that "knows you."

## Why this project (the resume narrative)

Three things are being explored at once:

1. **Agentic LLM design** — what does it look like when an LLM is not
   reactive to chat input, but proactively schedules its own actions
   (morning brief at 7 AM, hourly mood checks)?
2. **Multi-source context fusion** — how do you assemble user taste,
   environment, memory, and tool results into a single coherent prompt
   without making it a mess?
3. **A deployable architecture pattern** — local-first development with
   Claude Code subprocess (no API cost), production fallback to Anthropic
   API, clean PWA surface that works offline. This pattern is reusable
   for any "ambient AI agent" project.

The radio is the first instance. The architecture is the long-term value.

## Architecture (four layers)

### Layer 1 — Inputs
- **User taste corpus**: `taste.md`, `routines.md`, `playlists.json`, `mood-rules.md`
- **Brain provider**: Claude Code subprocess (local) OR Anthropic API (production)
- **Music source**: Spotify Web API + Web Playback SDK (Premium required)
- **Voice**: Web Speech API (free) or ElevenLabs (optional upgrade)
- **Context**: Google Calendar API, OpenWeather API

### Layer 2 — Local brain (Node.js server)
- `router.js` — intent dispatch (direct command vs Spotify vs Claude)
- `context.js` — prompt assembly (6 fragments → system prompt)
- `claude.js` — brain adapter (subprocess vs API, parses `{say, play[], reason, segue}`)
- `scheduler.js` — cron-style triggers (7 AM plan, 9 AM brief, hourly check)
- `tts.js` — voice pipeline (synthesize → cache as MP3 by hash)
- `state.db` — SQLite persistence (messages, plays, plan, prefs)

### Layer 3 — Context window (the prompt assembly contract)
Every prompt to the LLM is composed of exactly six fragments:
1. System persona (`dj-persona.md`)
2. User taste corpus
3. Environment (weather, calendar, current time)
4. Retrieved memory (recent plays, recent prefs)
5. User input or tool result
6. Execution trace (scheduler trigger, webhook payload)

Model returns structured JSON: `{ say, play[], reason, segue }`.

### Layer 4 — Surface
- **PWA player** (Vite + vanilla TypeScript)
  - Now playing display
  - DJ chatter overlay
  - Taste editor
  - Settings
- **HTTP + WebSocket contract** between server and PWA
  - `GET /api/now` — current track + DJ message
  - `GET /api/taste` — user's taste corpus
  - `GET /api/plan/today` — today's planned playlist
  - `WS /stream` — live updates (track changes, mood shifts)

## Tech stack (decided)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Backend | Node.js + Express | Ubiquitous, fast iteration, good Spotify SDK |
| Database | SQLite | File-level persistence, no separate DB process for single-user app |
| Frontend | Vite + vanilla TS | Lighter than full framework, learning value, fast dev server |
| Music | Spotify Web Playback SDK | Required for in-browser playback; needs Premium |
| Voice (default) | Web Speech API | Built into browsers, zero cost |
| Voice (upgrade) | ElevenLabs | If output quality matters for demo |
| Brain (local) | Claude Code subprocess | Free with Pro plan |
| Brain (production) | Anthropic API (claude-haiku-4-5) | ~$0.005 per invocation, $5/month cap set |
| Calendar | Google Calendar API | Standard for North American user |
| Weather | OpenWeather API | Free tier sufficient |
| Deploy (frontend) | Vercel | Free hobby tier, auto-deploys from main |
| Deploy (backend) | Railway or Fly.io | Free tier ~500h/month, supports SQLite |

## Constraints and decisions already made

- **Single user** — no multi-tenancy. The user is Zhihao. Architecture
  may evolve later but design for one user now.
- **English everywhere** — README, commit messages, code comments, build
  log. Project is portfolio-facing.
- **Conventional Commits** — every commit follows `type: subject` format
  with structured body when meaningful.
- **Spotify-only for music** — no NetEase, no Apple Music. Locking the
  scope so the project ships.
- **macOS dev, Linux deploy** — Mac for development, Railway/Fly run Linux
  containers. No platform-specific code in the codebase.
- **Spending limit set** — Anthropic API capped at $5/month. Auto-reload
  off. If the cap is hit, the API stops; never an unexpected bill.

## What this project is NOT

To stay focused, explicit non-goals:

- ❌ Not a Spotify clone — not building playback UI from scratch
- ❌ Not a recommendation engine — Spotify's algorithm does that
- ❌ Not a chat interface — the user does not type messages to the DJ
- ❌ Not multi-user — no auth system beyond Spotify OAuth, no profiles
- ❌ Not real-time collaborative — single device per user is fine
- ❌ Not an iOS app — PWA is the surface; native apps are out of scope

When tempted to add a feature outside this list, reject and note in the
build log. Scope discipline is itself a learning outcome.

## Resume positioning (current)

```
Claudio (in development)                                  2026 — Present
github.com/zbai53/claudio
Personal AI radio that learns listening habits and curates Spotify
playlists with DJ-style commentary. Designed a four-layer architecture
with dual-mode brain (Claude Code subprocess locally, Anthropic API in
production). Built with Node.js, SQLite, Spotify Web API, and Vite PWA.
```

This wording will evolve as phases complete. See `02-roadmap.md` for
phase-by-phase resume copy variants.
