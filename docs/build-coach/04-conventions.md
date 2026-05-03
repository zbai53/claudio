# Claudio — Conventions

> The project's engineering style guide. When Claude generates code or
> reviews progress, it should hold the work to these standards.

## Git

### Commit messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <subject>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `build`, `ci`

**Subject rules:**
- Imperative mood, present tense ("add" not "added" or "adds")
- Lowercase first letter
- No trailing period
- ≤50 characters

**Examples:**
- `feat: add Spotify OAuth callback handler`
- `fix(scheduler): prevent duplicate morning brief on DST transition`
- `refactor(brain): extract subprocess adapter into separate module`
- `docs: clarify Premium account requirement in README`
- `chore: bump @anthropic-ai/sdk to 0.30.0`

**Body rules (optional but encouraged for non-trivial changes):**
- Wrap at 72 characters
- Explain *why*, not *what* (the diff shows what)
- Use bullet points for multiple changes

### Branch strategy
Single-developer project: work on `main` is fine for now. When the project
grows, move to feature branches:
- `feat/<short-name>` for new features
- `fix/<short-name>` for bug fixes
- `chore/<short-name>` for refactoring or maintenance

### Push frequency
- **Push at least once per session.** Local commits don't help if your
  laptop dies.
- A WIP commit at the end of a session is fine: `wip: spotify oauth flow,
  callback not yet handling errors`.

## Code style

### Language choice
- **TypeScript everywhere** (server and client).
- No JavaScript files in `/src` directories. The `tsconfig.json` enforces this.

### Formatting
- 2-space indentation (set by `.editorconfig`)
- LF line endings
- Trailing newline at EOF
- Trim trailing whitespace (except in markdown)

### Naming
- **Files:** `kebab-case.ts` for modules, `PascalCase.tsx` for components
- **Variables and functions:** `camelCase`
- **Types and interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE` for true constants, `camelCase` for config
- **Booleans:** prefix with `is`, `has`, `should`, `can` (e.g. `isPlaying`,
  `hasError`)

### Imports
Order:
1. Node built-ins (`fs`, `path`, ...)
2. External packages (`express`, `@anthropic-ai/sdk`, ...)
3. Internal absolute imports (`@/types`, `@/server/...`)
4. Internal relative imports (`./helper`)

Separate groups with a blank line.

### Error handling
- Never swallow errors silently. At minimum, log them.
- Use typed error classes for known failure modes
  (e.g. `SpotifyAuthError`, `BrainTimeoutError`).
- Async functions: prefer `try/catch` over `.catch()` chains.
- API endpoints: always return JSON with `{ error: { code, message } }` on failure.

## Architecture rules

### Folder structure
```
claudio/
├── server/
│   ├── src/
│   │   ├── brain/         # LLM adapters
│   │   ├── context/       # Prompt assembly
│   │   ├── loaders/       # Read user data, env signals
│   │   ├── routes/        # Express handlers
│   │   ├── scheduler/     # Cron triggers
│   │   ├── state/         # SQLite repository
│   │   ├── tts/           # Voice synthesis
│   │   └── index.ts       # Server entrypoint
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── main.ts
│   └── package.json
├── data/
│   ├── user/              # taste.md, routines.md, ... (gitignored)
│   └── claudio.db         # SQLite (gitignored)
├── prompts/
│   └── dj-persona.md
├── docs/
│   └── architecture.md
├── .env.example
├── package.json           # workspace root
└── README.md
```

### Module boundaries
- **`brain/` knows nothing about Spotify or scheduling.** It only takes a
  prompt and returns a parsed response.
- **`context/` knows nothing about Express.** It composes prompts from
  loader outputs.
- **`routes/` is thin.** It validates input, calls one or two domain
  modules, returns the result.

This makes each module independently testable and replaceable.

### Dependency injection
Avoid global singletons. Pass dependencies into functions/classes.
This makes mocking easy and prevents hidden coupling.

## Secrets and security

### What goes in `.env`
- Anything that's a secret (API keys, OAuth client secrets, tokens)
- Anything that varies per environment (URLs, ports, feature flags)

### What does NOT go in `.env`
- Code constants (those go in TypeScript, in version control)
- User taste preferences (those go in `data/user/`)

### Loading `.env`
- Use `dotenv` at the start of `server/src/index.ts`
- Validate required env vars on startup (fail fast if missing)
- Never log the values

### Tokens
- Spotify tokens stored in SQLite, not in `.env`
- Never log tokens, even in dev. Use `[REDACTED]` placeholders.

## Testing

### What to test (in priority order)
1. **Brain adapter contract** — the JSON shape, not the LLM output quality
2. **Context assembly** — given inputs, the prompt looks right
3. **OAuth flow** — token exchange, refresh, error cases
4. **State repository** — CRUD on each table

### What NOT to test
- LLM output quality (non-deterministic, not your job to test)
- Spotify SDK internals
- React/UI rendering pixel-perfectly

### Test framework
Use `vitest` (works for both server and client). Co-locate tests next to
source files: `brain.ts` → `brain.test.ts`.

## Documentation

### README
Always reflects current state. After every phase, update:
- Status badge
- "Getting started" if setup changed
- Roadmap checkbox

### `/docs`
- `architecture.md` — the four-layer diagram + prose
- `brain-contract.md` — the JSON contract for brain responses
- `runbook.md` — common ops tasks (rotating keys, debugging stuck scheduler)

### Inline comments
- Comment **why**, not **what** (the code shows what)
- Document non-obvious decisions: "We use `127.0.0.1` not `localhost` because
  Spotify rejects the latter as of April 2025."

## Daily workflow

1. **Start of session:**
   - Read latest entry in `03-progress-log.md` (the build coach's Knowledge)
   - Check the active phase in `02-roadmap.md`
   - Pick one task from the unchecked list. ONE.

2. **During session:**
   - Make small commits as you go (every meaningful checkpoint)
   - When stuck for >30 min, write down the error and move on or ask

3. **End of session:**
   - Push to GitHub
   - Update `03-progress-log.md` with today's entry
   - If a milestone was hit, update README badges/roadmap

4. **End of week:**
   - Re-upload `03-progress-log.md` to Project Knowledge
   - Spend 15 min reviewing the past week — anything to refactor?
