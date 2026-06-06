import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  fetchSpotifyProfileAndStats,
  handleSpotifyCallback,
  saveSpotifyProfileToFirestore,
} from '../services/spotifyService';
import { useAuth } from '../context/AuthContext';

export default function SpotifyCallback({ customUrl }: { customUrl?: string }) {
  const [error, setError] = useState('');
  const { currentUser, refreshProfile } = useAuth();
  const hasProcessedCallback = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      if (hasProcessedCallback.current) return;
      hasProcessedCallback.current = true;

      const fullUrl = customUrl || window.location.href;
      console.log('[SpotifyCallback] Full callback URL:', fullUrl);
      const urlParams = customUrl ? new URL(customUrl).searchParams : new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const err = urlParams.get('error');
      console.log('[SpotifyCallback] Extracted authorization code:', code);

      if (err) {
        console.error('[SpotifyCallback] Spotify returned OAuth error:', err);
        setError(`Spotify auth error: ${err}`);
        return;
      }

      if (code) {
        try {
          if (!currentUser) {
            throw new Error('No authenticated Firebase user available during Spotify callback');
          }

          const accessToken = await handleSpotifyCallback(code);
          console.log('[SpotifyCallback] Stored token result:', {
            accessTokenStored: !!localStorage.getItem('spotify_access_token'),
            refreshTokenStored: !!localStorage.getItem('spotify_refresh_token'),
          });

          const spotifyStats = await fetchSpotifyProfileAndStats(accessToken);
          console.log('[SpotifyCallback] Spotify profile/stats fetched:', {
            spotifyUserId: spotifyStats.spotifyUserId,
            topTracks: spotifyStats.topTracks?.length || 0,
            topArtists: spotifyStats.topArtists?.length || 0,
            topGenres: spotifyStats.topGenres?.length || 0,
          });

          await saveSpotifyProfileToFirestore(currentUser.uid, spotifyStats);
          await refreshProfile();
          console.log('[SpotifyCallback] Final connection state:', {
            uid: currentUser.uid,
            spotifyConnected: true,
          });

          const redirectBack = localStorage.getItem('spotify_redirect_back') || '/';
          // Clean up the URL
          window.history.replaceState({}, document.title, redirectBack);
          // Reload to mount the main app
          window.location.reload();
        } catch (e: any) {
          console.error('[SpotifyCallback] Exact callback exception:', e);
          setError(`Failed to exchange token: ${e.message}`);
        }
      } else {
        setError('No authorization code found in URL.');
      }
    };

    processCallback();
  }, [customUrl, currentUser, refreshProfile]);

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center p-8 bg-[#121212] text-white">
      {error ? (
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20"
          >
            Go Back
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
          <p className="font-sans tracking-widest uppercase text-sm text-white/70">Connecting to Spotify...</p>
        </div>
      )}
    </div>
  );
}
