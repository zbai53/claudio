import { initPlayer, PlayerState, togglePlay } from './lib/player.js';
import { speak } from './lib/tts.js';
import { connectWebSocket, WsMessage } from './lib/ws.js';

interface UserProfile {
  id: string;
  displayName: string;
  imageUrl: string | null;
  spotifyUrl: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'loggedOut' }
  | { kind: 'loggedIn'; profile: UserProfile }
  | { kind: 'error'; message: string };

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Root element #app not found');
}

function render(state: State): void {
  switch (state.kind) {
    case 'loading':
      app!.innerHTML = `
        <main class="container">
          <h1>Claudio</h1>
          <p class="tagline">Personal AI radio · in development</p>
          <p class="status">Checking login status...</p>
        </main>
      `;
      break;

    case 'loggedOut':
      app!.innerHTML = `
        <main class="container">
          <h1>Claudio</h1>
          <p class="tagline">Personal AI radio · in development</p>
          <a href="/api/auth/login" class="login-button">Log in with Spotify</a>
        </main>
      `;
      break;

    case 'loggedIn':
      app!.innerHTML = `
        <main class="container">
          <h1>Claudio</h1>
          <p class="tagline">Personal AI radio · in development</p>
          <div class="profile">
            ${state.profile.imageUrl ? `<img src="${state.profile.imageUrl}" alt="" class="avatar">` : ''}
            <p class="greeting">Hi, ${escapeHtml(state.profile.displayName)}</p>
          </div>
        </main>
      `;
      break;

    case 'error':
      app!.innerHTML = `
        <main class="container">
          <h1>Claudio</h1>
          <p class="tagline">Personal AI radio · in development</p>
          <p class="error">${escapeHtml(state.message)}</p>
        </main>
      `;
      break;
  }
}

// Escape user-controlled strings before injecting into innerHTML.
// Spotify display names can contain HTML special characters (a user
// could set their name to "<script>alert(1)</script>"). Without escaping
// this would be a stored XSS vulnerability.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let djBubbleEl: HTMLElement | null = null;

function handleWsMessage(message: WsMessage): void {
  if (message.type === 'dj') {
    speak(message.say);
    if (djBubbleEl) {
      djBubbleEl.textContent = message.say;
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'dj-bubble';
      bubble.textContent = message.say;
      const container = document.querySelector('.container') ?? document.body;
      container.appendChild(bubble);
      djBubbleEl = bubble;
    }
  } else if (message.type === 'plan') {
    console.log('[ws] plan received:', message.date, message.trackCount);
  } else if (message.type === 'mood') {
    console.log('[ws] mood update:', message.reason);
  }
}

function handlePlayerState(state: PlayerState): void {
  const container = document.querySelector('.container');
  if (!container) return;

  let section = container.querySelector<HTMLElement>('.now-playing');
  if (!section) {
    section = document.createElement('div');
    section.className = 'now-playing';
    container.appendChild(section);
  }

  if (!state.ready) {
    section.innerHTML = `<p class="status">Connecting to Spotify...</p>`;
    return;
  }

  if (!state.trackName) {
    section.innerHTML = `<p class="status">Ready — waiting for tracks</p>`;
    return;
  }

  const icon = state.isPlaying ? '&#9646;&#9646;' : '&#9654;';
  section.innerHTML = `
    ${state.albumArt ? `<img src="${escapeHtml(state.albumArt)}" alt="Album art" class="album-art">` : ''}
    <div class="track-info">
      <p class="track-name">${escapeHtml(state.trackName)}</p>
      <p class="artist-name">${escapeHtml(state.artistName ?? '')}</p>
    </div>
    <button class="play-btn" aria-label="${state.isPlaying ? 'Pause' : 'Play'}">${icon}</button>
  `;

  section.querySelector('.play-btn')?.addEventListener('click', () => {
    void togglePlay();
  });
}

async function checkAuth(): Promise<void> {
  render({ kind: 'loading' });

  try {
    const res = await fetch('/api/me');

    if (res.status === 401) {
      render({ kind: 'loggedOut' });
      return;
    }

    if (!res.ok) {
      render({
        kind: 'error',
        message: `Server returned ${res.status}. Try refreshing the page.`,
      });
      return;
    }

    const profile = (await res.json()) as UserProfile;
    render({ kind: 'loggedIn', profile });
    connectWebSocket(handleWsMessage);
    void initPlayer(handlePlayerState);
  } catch (err) {
    render({
      kind: 'error',
      message: err instanceof Error ? err.message : 'Network error',
    });
  }
}

void checkAuth();
