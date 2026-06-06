import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getValidAccessToken, searchSpotifyTrack } from '../services/spotifyService';
import type { EmotionState } from '../types';

export interface PlaylistTrack {
  name: string;
  artist: string;
  albumArt: string;
  url: string;
}

export function useEmotionalPlaylist(emotion: EmotionState) {
  const { userProfile } = useAuth();
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlaylist() {
      // Check if user has Spotify connected
      if (!userProfile?.spotifyProfile?.spotifyConnected) {
        setTracks([]);
        return;
      }

      const token = await getValidAccessToken();
      if (!token) {
        setError('No valid Spotify token');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const topGenres = userProfile.spotifyProfile.topGenres || [];
        
        // Map emotions to search queries/vibes
        let queries: string[] = [];
        if (emotion === 'calm') queries = ['ambient', 'lo-fi', 'peaceful piano', 'chill indie'];
        else if (emotion === 'hopeful') queries = ['uplifting indie', 'happy acoustic', 'feel good', 'sunny day'];
        else if (emotion === 'excited') queries = ['upbeat pop', 'dance energetic', 'pump up', 'synth pop'];
        else if (emotion === 'reflective') queries = ['thoughtful indie', 'melancholy piano', 'deep focus', 'cinematic'];
        else if (emotion === 'stressed') queries = ['binaural beats', 'calming meditation', 'slow breathing', 'gentle rain'];
        else queries = ['indie pop', 'acoustic chill', 'easy listening', 'soft pop'];

        // Shuffle and pick 3 queries
        const selectedQueries = queries.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        const fetchedTracks: PlaylistTrack[] = [];
        
        for (const query of selectedQueries) {
          const track = await searchSpotifyTrack(token, query, topGenres);
          if (track && !fetchedTracks.find(t => t.url === track.url)) {
            fetchedTracks.push(track);
          }
        }
        
        setTracks(fetchedTracks);
      } catch (err: any) {
        console.error('Failed to fetch emotional playlist:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylist();
  }, [emotion, userProfile?.spotifyProfile?.spotifyConnected]);

  return { tracks, isLoading, error };
}
