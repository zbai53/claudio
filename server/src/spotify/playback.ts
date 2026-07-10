import { getValidAccessToken } from '../auth/tokenService.js';
import { logPlay } from '../state/repository.js';
import { broadcast } from '../ws/index.js';
import { getActiveDeviceId } from './routes.js';

const SPOTIFY_PLAY_URL = 'https://api.spotify.com/v1/me/player/play';

/**
 * Play a list of Spotify track URIs on the active device.
 *
 * Requires an active Spotify Connect device — the Web Playback SDK on the
 * frontend creates one when initialized. If no device is active, Spotify
 * returns 404.
 *
 * Track names are not derivable from URIs alone, so we store the URI as
 * both trackUri and trackName until we enrich metadata later.
 */
export async function playTracks(uris: string[], trigger: string): Promise<void> {
  try {
    const token = await getValidAccessToken();

    const deviceId = getActiveDeviceId();
    if (!deviceId) {
      throw new Error('No active Claudio device. Open the app in a browser first.');
    }

    const response = await fetch(`${SPOTIFY_PLAY_URL}?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uris }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Spotify play API returned ${response.status}: ${body}`);
    }

    for (const uri of uris) {
      logPlay(uri, uri, '', trigger);
      broadcast({ type: 'track', name: uri, artist: '', uri });
    }
  } catch (err) {
    console.error('[playback] playTracks failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}
