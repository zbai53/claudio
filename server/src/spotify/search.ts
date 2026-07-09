import { getValidAccessToken } from '../auth/tokenService.js';

export interface SpotifyTrack {
  uri: string;
  name: string;
  artist: string;
}

// Shape of the Spotify search API response we care about.
interface SpotifySearchResponse {
  tracks: {
    items: Array<{
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
    }>;
  };
}

export async function searchTrack(query: string): Promise<SpotifyTrack | null> {
  let token: string;
  try {
    token = await getValidAccessToken();
  } catch (err) {
    console.warn('[spotify] could not get access token:', err instanceof Error ? err.message : err);
    return null;
  }

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.warn('[spotify] search network error for query:', query, err);
    return null;
  }

  if (!res.ok) {
    console.warn(`[spotify] search failed (${res.status}) for query: ${query}`);
    return null;
  }

  const data = (await res.json()) as SpotifySearchResponse;
  const item = data.tracks.items[0];

  if (!item) {
    return null;
  }

  return {
    uri: item.uri,
    name: item.name,
    artist: item.artists[0]?.name ?? 'Unknown Artist',
  };
}

export async function resolvePlaylist(queries: string[]): Promise<SpotifyTrack[]> {
  const results = await Promise.all(queries.map((q) => searchTrack(q)));

  return results.filter((track, i): track is SpotifyTrack => {
    if (track === null) {
      console.warn('[spotify] track not found:', queries[i]);
      return false;
    }
    return true;
  });
}
