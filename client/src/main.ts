import './style.css';
import { initPlayer, togglePlay } from './lib/player.js';
import type { PlayerState } from './lib/player.js';
import { speak, setTtsEnabled } from './lib/tts.js';
import { connectWebSocket } from './lib/ws.js';
import type { WsMessage } from './lib/ws.js';

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
          <button class="ask-dj-btn" id="ask-dj">Ask DJ</button>
          <button class="edit-taste-btn" id="edit-taste">Edit Taste</button>
          <button class="edit-taste-btn" id="settings">Settings</button>
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
    showDjBubble(message.say);
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

function showDjBubble(text: string): void {
  if (djBubbleEl) {
    djBubbleEl.textContent = text;
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'dj-bubble';
    bubble.textContent = text;
    const container = document.querySelector('.container') ?? document.body;
    container.appendChild(bubble);
    djBubbleEl = bubble;
  }
}

async function handleAskDj(): Promise<void> {
  const btn = document.getElementById('ask-dj') as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'DJ is thinking...';
  }

  try {
    const res = await fetch('/api/dj/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger: 'user requested playlist' }),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: { message?: string } };
      showDjBubble(body.error?.message ?? `Error ${res.status}`);
      return;
    }

    const data = (await res.json()) as { say: string; play?: boolean; tracks?: string[] };
    speak(data.say);
    showDjBubble(data.say);
  } catch (err) {
    showDjBubble(err instanceof Error ? err.message : 'Something went wrong');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Ask DJ';
    }
  }
}

async function handleEditTaste(): Promise<void> {
  const res = await fetch('/api/taste');
  if (!res.ok) {
    showDjBubble('Could not load taste files.');
    return;
  }

  const { files } = (await res.json()) as { files: { name: string; content: string }[] };

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  files.forEach(({ name, content }, i) => {
    const heading = document.createElement('h3');
    heading.textContent = name;
    if (i === 0) heading.style.marginTop = '0';

    const textarea = document.createElement('textarea');
    textarea.className = 'taste-textarea';
    textarea.dataset.filename = name;
    textarea.value = content;

    modal.appendChild(heading);
    modal.appendChild(textarea);
  });

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => overlay.remove());

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = 'Save All';
  saveBtn.addEventListener('click', async () => {
    const textareas = modal.querySelectorAll<HTMLTextAreaElement>('.taste-textarea');
    await Promise.all(
      Array.from(textareas).map((ta) =>
        fetch(`/api/taste/${encodeURIComponent(ta.dataset.filename ?? '')}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: ta.value }),
        }),
      ),
    );
    overlay.remove();
    showDjBubble('Taste updated!');
  });

  actions.appendChild(closeBtn);
  actions.appendChild(saveBtn);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

async function handleSettings(): Promise<void> {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  // Voice section
  const voiceSection = document.createElement('div');
  voiceSection.className = 'settings-section';
  const voiceHeading = document.createElement('h3');
  voiceHeading.textContent = 'Voice';
  voiceHeading.style.marginTop = '0';

  const ttsEnabled = localStorage.getItem('claudio-tts-enabled') !== 'false';
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle-row';
  toggleLabel.innerHTML = `
    <span>DJ voice (Text-to-Speech)</span>
    <input type="checkbox" id="tts-toggle" ${ttsEnabled ? 'checked' : ''}>
  `;
  toggleLabel.querySelector<HTMLInputElement>('#tts-toggle')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLInputElement).checked;
    localStorage.setItem('claudio-tts-enabled', String(val));
    setTtsEnabled(val);
  });

  voiceSection.appendChild(voiceHeading);
  voiceSection.appendChild(toggleLabel);

  // Spotify Account section
  const accountSection = document.createElement('div');
  accountSection.className = 'settings-section';
  const accountHeading = document.createElement('h3');
  accountHeading.textContent = 'Spotify Account';

  const accountContent = document.createElement('div');
  accountContent.className = 'settings-account';

  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const profile = (await res.json()) as UserProfile;
      if (profile.imageUrl) {
        const img = document.createElement('img');
        img.src = profile.imageUrl;
        img.alt = '';
        accountContent.appendChild(img);
      }
      const name = document.createElement('span');
      name.className = 'settings-info';
      name.textContent = escapeHtml(profile.displayName);
      accountContent.appendChild(name);
    }
  } catch {
    accountContent.textContent = 'Could not load account info';
  }

  const logoutNote = document.createElement('p');
  logoutNote.className = 'settings-info';
  logoutNote.textContent = 'To log out, clear browser data for this site.';

  accountSection.appendChild(accountHeading);
  accountSection.appendChild(accountContent);
  accountSection.appendChild(logoutNote);

  // App Info section
  const infoSection = document.createElement('div');
  infoSection.className = 'settings-section';
  const infoHeading = document.createElement('h3');
  infoHeading.textContent = 'App Info';

  const infoContent = document.createElement('p');
  infoContent.className = 'settings-info';
  infoContent.innerHTML = 'Claudio v0.1.0<br>Development mode (subprocess)';

  infoSection.appendChild(infoHeading);
  infoSection.appendChild(infoContent);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => overlay.remove());
  actions.appendChild(closeBtn);

  modal.appendChild(voiceSection);
  modal.appendChild(accountSection);
  modal.appendChild(infoSection);
  modal.appendChild(actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
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
    document.getElementById('ask-dj')?.addEventListener('click', () => void handleAskDj());
    document.getElementById('edit-taste')?.addEventListener('click', () => void handleEditTaste());
    document.getElementById('settings')?.addEventListener('click', () => void handleSettings());
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
