# Claudio 🎙️

> Personal AI radio that learns your listening habits and curates music like a DJ.
> Built with Claude, Spotify, and a love for late-night programming sessions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-in_development-orange)](#roadmap)
[![Node](https://img.shields.io/badge/node-20%2B-green)](#prerequisites)

---

## What is Claudio?

Most music apps recommend tracks. **Claudio runs a radio station for you.**

Every morning at 7 AM, it reads your calendar, checks the weather, and reviews
what you've been listening to. Then it builds a playlist for your day, writes a
DJ intro in your preferred style, speaks it out loud, and queues the music
through your Spotify Premium account.

It's not a chatbot. It's not a search box. It's an ambient companion that
notices patterns you didn't know you had — _"you always reach for downtempo
on rainy Sundays"_ — and plays accordingly.

## Why I built this

I wanted to explore three things at once:

1. **Agentic LLM design** — what does it look like when an LLM isn't reactive
   to chat input, but proactively schedules its own actions?
2. **Multi-source context fusion** — how do you assemble user taste, environment,
   memory, and tool results into a single coherent prompt?
3. **A deployable architecture pattern** — local-first development with
   Claude Code, production fallback to the Anthropic API, and a clean PWA
   surface that works offline.

The result is a four-layer architecture I can reuse for any "ambient AI agent"
project. The radio is just the first instance.

## Architecture

Claudio is organized in four layers, each with a clear responsibility:
┌─────────────────────────────────────────────────────────┐
│  Layer 1 · Inputs                                       │
│  User taste corpus · Spotify · Calendar · Weather · TTS │
└────────────────────────┬────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2 · Local brain                                  │
│  router · context assembler · Claude adapter            │
│  scheduler · TTS pipeline · SQLite state                │
└────────────────────────┬────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3 · Context window                               │
│  6 fragments composed into every prompt                 │
│  → model returns { say, play[], reason, segue }         │
└────────────────────────┬────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────────┐
│  Layer 4 · Surface                                      │
│  PWA player · HTTP + WebSocket contract                 │
└─────────────────────────────────────────────────────────┘

A more detailed architecture document lives at [`docs/architecture.md`](./docs/architecture.md) _(coming soon)_.

## Tech stack

- **Brain** — Claude (via Claude Code subprocess locally, Anthropic API in production)
- **Server** — Node.js, Express, WebSocket, SQLite
- **Music** — Spotify Web API + Web Playback SDK (Premium account required)
- **Voice** — Web Speech API (free) with optional ElevenLabs upgrade
- **Context** — Google Calendar API, OpenWeather API
- **Frontend** — Vite, vanilla TypeScript, Progressive Web App
- **Deploy** — Vercel (PWA) + Railway (server)

## Prerequisites

- Node.js 20 or newer
- A Spotify Premium account (Free accounts cannot use the Web Playback SDK)
- An Anthropic API key _or_ a Claude Pro/Max subscription with Claude Code installed
- A Google Calendar account (optional, for calendar-aware scheduling)

## Getting started

```bash
# Clone the repository
git clone git@github.com:zbai53/claudio.git
cd claudio

# Install dependencies
npm install

# Copy the environment template and fill in your keys
cp .env.example .env
# Then edit .env with your Spotify, Anthropic, and Google credentials

# Start the development server
npm run dev
```

The PWA will be available at `http://127.0.0.1:5173`.
The backend runs on `http://127.0.0.1:3000`.

After starting, open the PWA and click **Log in with Spotify** to complete
OAuth. You should see your Spotify display name and avatar on success.

## Roadmap

- [x] Project scaffold and tooling
- [x] Spotify OAuth (PKCE flow) with SQLite token storage and refresh rotation
- [x] Authenticated Spotify profile endpoint (`GET /api/me`)
- [x] Frontend login UI with discriminated union state machine
- [ ] Claude brain adapter (local subprocess + Anthropic API fallback)
- [ ] Context assembler (6-fragment prompt composition)
- [ ] Scheduler (morning briefing + hourly mood checks)
- [ ] PWA player with Web Playback SDK
- [ ] Voice synthesis pipeline
- [ ] Cloud deployment (Vercel + Railway)

## Inspiration

This project is inspired by [the original Claudio concept](https://x.com)
by an unknown author who shared the architecture diagram on social media.
The implementation here is independent — same spirit, different stack
(Spotify instead of NetEase, Google Calendar instead of Feishu).

## License

MIT — see [LICENSE](./LICENSE).
