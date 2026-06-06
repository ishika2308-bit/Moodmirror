// src/services/spotifyService.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
const REDIRECT_URI = isCapacitor ? 'moodmirror://spotify-callback' : window.location.origin + '/spotify-callback';

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
    redirect_uri: REDIRECT_URI,
  };

  authUrl.search = new URLSearchParams(params).toString();
  console.log("EXACT SPOTIFY REDIRECT URI:", REDIRECT_URI);
  window.location.href = authUrl.toString();
};

export const handleSpotifyCallback = async (code: string) => {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');
  
  if (!codeVerifier) {
    throw new Error("No code verifier found in local storage");
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  };

  const body = await fetch("https://accounts.spotify.com/api/token", payload);
  const response = await body.json();

  if (response.error) {
    throw new Error(response.error_description || "Failed to fetch Spotify token");
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
  const profile = await profileRes.json();

  // Fetch Top Tracks (Limit 10)
  const tracksRes = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term", { headers });
  const topTracksData = await tracksRes.json();

  // Fetch Top Artists (Limit 10)
  const artistsRes = await fetch("https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term", { headers });
  const topArtistsData = await artistsRes.json();

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
  await updateDoc(userRef, {
    spotifyProfile: {
      spotifyConnected: true,
      spotifyLastSyncedAt: new Date().toISOString(),
      ...data
    }
  });
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
