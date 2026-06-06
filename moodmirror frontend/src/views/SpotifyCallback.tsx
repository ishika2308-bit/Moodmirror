import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { handleSpotifyCallback } from '../services/spotifyService';

export default function SpotifyCallback({ customUrl }: { customUrl?: string }) {
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = customUrl ? new URL(customUrl).searchParams : new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const err = urlParams.get('error');

      if (err) {
        setError(`Spotify auth error: ${err}`);
        return;
      }

      if (code) {
        try {
          await handleSpotifyCallback(code);
          const redirectBack = localStorage.getItem('spotify_redirect_back') || '/';
          // Clean up the URL
          window.history.replaceState({}, document.title, redirectBack);
          // Reload to mount the main app
          window.location.reload();
        } catch (e: any) {
          setError(`Failed to exchange token: ${e.message}`);
        }
      } else {
        setError('No authorization code found in URL.');
      }
    };

    processCallback();
  }, []);

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
