// src/services/spotifyService.ts
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Capacitor, CapacitorHttp, type HttpResponse } from '@capacitor/core';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const getRedirectUri = () => {
  return Capacitor.isNativePlatform() 
    ? 'moodmirror://spotify-callback' 
    : window.location.origin + '/spotify-callback';
};

// PKCE Utils
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const parseJsonOrThrow = (rawBody: string, status: number, label: string) => {
  console.log(`[SpotifyService] [${label}] Raw response body before JSON.parse():`, rawBody);
  try {
    const parsed = JSON.parse(rawBody);
    console.log(`[SpotifyService] [${label}] Parsed response result:`, parsed);
    return parsed;
  } catch (err: any) {
    const preview = rawBody.slice(0, 180);
    console.error(`[SpotifyService] [${label}] returned non-JSON response:`, {
      status,
      preview,
      error: err.message,
    });
    throw new Error(`${label} returned non-JSON response (${status}): ${preview}`);
  }
};

const normalizeCapacitorResponseData = (response: HttpResponse) => {
  if (typeof response.data === 'string') {
    return parseJsonOrThrow(response.data, response.status, 'Spotify token endpoint');
  }
  return response.data;
};

export const initiateSpotifyLogin = async () => {
  if (!SPOTIFY_CLIENT_ID) {
    alert("VITE_SPOTIFY_CLIENT_ID is missing in .env file.");
    return;
  }

  const codeVerifier  = generateRandomString(64);
  window.localStorage.setItem('spotify_code_verifier', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  const scope = 'user-read-email user-read-private user-top-read user-read-recently-played';
  const authUrl = new URL("https://accounts.spotify.com/authorize");

  window.localStorage.setItem('spotify_redirect_back', window.location.pathname);

  const params = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: getRedirectUri(),
  };

  authUrl.search = new URLSearchParams(params).toString();
  console.log("EXACT SPOTIFY REDIRECT URI:", getRedirectUri());
  window.location.href = authUrl.toString();
};

export const handleSpotifyCallback = async (code: string) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  const redirectUri = getRedirectUri();
  console.log('[SpotifyService] Starting token exchange:', {
    codePresent: !!code,
    codeVerifierPresent: !!codeVerifier,
    redirectUri,
  });
  
  if (!codeVerifier) {
    throw new Error("No code verifier found in local storage");
  }

  const tokenRequestBody = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  }).toString();

  const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
  console.log('[SpotifyService] Exact token exchange endpoint:', TOKEN_ENDPOINT);
  console.log('[SpotifyService] Token request body:', tokenRequestBody);

  let response: any;
  let status = 0;
  let ok = false;

  if (Capacitor.isNativePlatform()) {
    // NOTE: CapacitorHttp does NOT support responseType:'json' — omitting it prevents
    // the plugin from issuing a CORS preflight that returns "Active preflights are not allowed".
    // normalizeCapacitorResponseData() handles string→JSON parsing safely.
    console.log('[SpotifyService] Token exchange via CapacitorHttp (native)');
    const nativeResponse = await CapacitorHttp.post({
      url: TOKEN_ENDPOINT,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: tokenRequestBody,
    }) as any;
    status = nativeResponse.status;
    ok = status >= 200 && status < 300;
    console.log('[SpotifyService] Capacitor HTTP status:', status);
    console.log('[SpotifyService] Capacitor native response data type:', typeof nativeResponse.data);
    console.log('[SpotifyService] Capacitor native raw response:', 
      typeof nativeResponse.data === 'string' ? nativeResponse.data.slice(0, 300) : nativeResponse.data
    );
    response = normalizeCapacitorResponseData(nativeResponse);
  } else {
    console.log('[SpotifyService] Token exchange via fetch (web)');
    const body = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody,
    });
    status = body.status;
    ok = body.ok;
    console.log('[SpotifyService] Fetch HTTP status:', status);
    const rawText = await body.text();
    console.log('[SpotifyService] Raw response body (web):', rawText);
    response = parseJsonOrThrow(rawText, status, 'Spotify token endpoint');
  }

  console.log('[SpotifyService] Token exchange response:', {
    ok,
    status,
    error: response?.error,
    errorDescription: response?.error_description,
    hasAccessToken: !!response?.access_token,
    hasRefreshToken: !!response?.refresh_token,
  });

  if (!ok || response?.error) {
    throw new Error(response?.error_description || "Failed to fetch Spotify token");
  }

  localStorage.setItem('spotify_access_token', response.access_token);
  if (response.refresh_token) {
    localStorage.setItem('spotify_refresh_token', response.refresh_token);
  }

  return response.access_token;
};

export const fetchSpotifyProfileAndStats = async (accessToken: string) => {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch Profile
  const profileRes = await fetch("https://api.spotify.com/v1/me", { headers });
  const profileRaw = await profileRes.text();
  console.log('[SpotifyService] Profile raw response:', { status: profileRes.status, body: profileRaw });
  const profile = parseJsonOrThrow(profileRaw, profileRes.status, 'Spotify profile endpoint');
  console.log('[SpotifyService] Profile response:', {
    ok: profileRes.ok,
    status: profileRes.status,
    spotifyUserId: profile.id,
    error: profile.error,
  });
  if (!profileRes.ok) {
    throw new Error(profile.error?.message || 'Failed to fetch Spotify profile');
  }

  // Fetch Top Tracks (Limit 10)
  const tracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term", { headers });
  const tracksRaw = await tracksRes.text();
  console.log('[SpotifyService] Top tracks raw response:', { status: tracksRes.status, body: tracksRaw });
  const topTracksData = parseJsonOrThrow(tracksRaw, tracksRes.status, 'Spotify top tracks endpoint');
  console.log('[SpotifyService] Top tracks response:', {
    ok: tracksRes.ok,
    status: tracksRes.status,
    count: topTracksData.items?.length || 0,
    error: topTracksData.error,
  });
  if (!tracksRes.ok) {
    throw new Error(topTracksData.error?.message || 'Failed to fetch Spotify top tracks');
  }

  // Fetch Top Artists (Limit 10)
  const artistsRes = await fetch("https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term", { headers });
  const artistsRaw = await artistsRes.text();
  console.log('[SpotifyService] Top artists raw response:', { status: artistsRes.status, body: artistsRaw });
  const topArtistsData = parseJsonOrThrow(artistsRaw, artistsRes.status, 'Spotify top artists endpoint');
  console.log('[SpotifyService] Top artists response:', {
    ok: artistsRes.ok,
    status: artistsRes.status,
    count: topArtistsData.items?.length || 0,
    error: topArtistsData.error,
  });
  if (!artistsRes.ok) {
    throw new Error(topArtistsData.error?.message || 'Failed to fetch Spotify top artists');
  }

  // Extract Genres from Artists
  const allGenres = topArtistsData.items.flatMap((artist: any) => artist.genres);
  const genreCounts = allGenres.reduce((acc: Record<string, number>, genre: string) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
  const topGenres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([genre]) => genre);

  return {
    spotifyUserId: profile.id,
    topTracks: topTracksData.items.map((t: any) => `${t.name} by ${t.artists[0].name}`),
    topArtists: topArtistsData.items.map((a: any) => a.name),
    topGenres,
  };
};

export const saveSpotifyProfileToFirestore = async (uid: string, data: any) => {
  const userRef = doc(db, 'users', uid);
  console.log('[SpotifyService] Saving Spotify connection state:', {
    uid,
    spotifyUserId: data?.spotifyUserId,
  });
  await setDoc(userRef, {
    spotifyProfile: {
      spotifyConnected: true,
      spotifyLastSyncedAt: new Date().toISOString(),
      ...data
    }
  }, { merge: true });
  console.log('[SpotifyService] Spotify connection state saved');
};

export const getSpotifyProfileFromFirestore = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return docSnap.data().spotifyProfile;
  }
  return null;
};

export const searchSpotifyTrack = async (accessToken: string, query: string, genres: string[]) => {
  // Build a query, prioritizing genre if available
  const genreQuery = genres.length > 0 ? ` genre:${genres[0].replace(' ', '-')}` : '';
  const fullQuery = encodeURIComponent(`${query}${genreQuery}`);
  
  const headers = { Authorization: `Bearer ${accessToken}` };
  const res = await fetch(`https://api.spotify.com/v1/search?q=${fullQuery}&type=track&limit=5`, { headers });
  const data = await res.json();
  
  if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
    // Pick a random track from top 5 to ensure "The same mood should not always generate the same song"
    const randomIdx = Math.floor(Math.random() * Math.min(5, data.tracks.items.length));
    const track = data.tracks.items[randomIdx];
    return {
      name: track.name,
      artist: track.artists[0].name,
      albumArt: track.album.images[0]?.url,
      url: track.external_urls.spotify
    };
  }
  return null;
};

export const getValidAccessToken = async () => {
  // In a real app, you'd handle refresh token logic here.
  // For now, we'll just return the access token if it exists.
  return localStorage.getItem('spotify_access_token');
};
