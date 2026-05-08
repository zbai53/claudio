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
  } catch (err) {
    render({
      kind: 'error',
      message: err instanceof Error ? err.message : 'Network error',
    });
  }
}

void checkAuth();
