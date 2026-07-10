// Type declarations for the Spotify Web Playback SDK, which is loaded
// dynamically via a <script> tag. The SDK attaches itself to window.Spotify.

interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume?: number;
}

interface SpotifyWebPlaybackTrack {
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}

interface SpotifyWebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: SpotifyWebPlaybackTrack };
}

interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  addListener(event: 'ready', cb: (e: { device_id: string }) => void): void;
  addListener(event: 'not_ready', cb: (e: { device_id: string }) => void): void;
  addListener(
    event: 'player_state_changed',
    cb: (state: SpotifyWebPlaybackState | null) => void,
  ): void;
}

interface SpotifySDK {
  Player: new (options: SpotifyPlayerOptions) => SpotifyPlayer;
}

declare global {
  interface Window {
    Spotify: SpotifySDK;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export interface PlayerState {
  ready: boolean;
  deviceId: string | null;
  trackName: string | null;
  artistName: string | null;
  albumArt: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
}

export type PlayerCallback = (state: PlayerState) => void;

let player: SpotifyPlayer | null = null;
let currentDeviceId: string | null = null;

export async function initPlayer(onStateChange: PlayerCallback): Promise<void> {
  // Fetch a fresh token before loading the SDK.
  const tokenRes = await fetch('/api/spotify/token');
  const tokenData = (await tokenRes.json()) as { token: string };

  // Load the SDK script lazily. The global callback fires when it's ready.
  await new Promise<void>((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });

  player = new window.Spotify.Player({
    name: 'Claudio',
    getOAuthToken: async (cb) => {
      // Called by the SDK when it needs a fresh token (on init and on expiry).
      const res = await fetch('/api/spotify/token');
      const data = (await res.json()) as { token: string };
      cb(data.token);
    },
    volume: 0.5,
  });

  // Suppress the unused variable warning — tokenData is fetched above to
  // fail fast if the user isn't logged in, before the SDK script is injected.
  void tokenData;

  player.addListener('ready', ({ device_id }) => {
    console.log('[player] ready, device_id:', device_id);
    currentDeviceId = device_id;
    fetch('/api/spotify/device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: device_id }),
    }).catch((err) => console.error('[player] failed to register device:', err));
    onStateChange({
      ready: true,
      deviceId: device_id,
      trackName: null,
      artistName: null,
      albumArt: null,
      isPlaying: false,
      position: 0,
      duration: 0,
    });
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.warn('[player] not ready, device_id:', device_id);
    onStateChange({
      ready: false,
      deviceId: device_id,
      trackName: null,
      artistName: null,
      albumArt: null,
      isPlaying: false,
      position: 0,
      duration: 0,
    });
  });

  player.addListener('player_state_changed', (state) => {
    if (!state) return;

    const track = state.track_window.current_track;
    onStateChange({
      ready: true,
      deviceId: currentDeviceId,
      trackName: track.name,
      artistName: track.artists.map((a) => a.name).join(', '),
      albumArt: track.album.images[0]?.url ?? null,
      isPlaying: !state.paused,
      position: state.position,
      duration: state.duration,
    });
  });

  await player.connect();
}

export async function togglePlay(): Promise<void> {
  if (!player) return;
  await player.togglePlay();
}

export async function nextTrack(): Promise<void> {
  if (!player) return;
  await player.nextTrack();
}

export async function previousTrack(): Promise<void> {
  if (!player) return;
  await player.previousTrack();
}
