import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

interface MemorySearchHookResult {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: {
    topMatch: any | null;
    clusters: { label: string; entries: any[] }[];
    otherMemories: any[];
  } | null;
  suggestions: { emotions: string[]; goals: string[] };
}

export function useMemorySearch(entries: any[]): MemorySearchHookResult {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Build Fuse document index
  const fuse = useMemo(() => {
    return new Fuse(entries, {
      keys: [
        { name: 'text', weight: 1.0 },
        { name: 'analysis.primaryEmotion', weight: 0.8 },
        { name: 'analysis.topics', weight: 0.6 },
        { name: 'analysis.emotionalDrivers', weight: 0.5 }
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true
    });
  }, [entries]);

  // 2. Compute search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const fuseResults = fuse.search(searchQuery);
    if (fuseResults.length === 0) {
      return { topMatch: null, clusters: [], otherMemories: [] };
    }

    const topMatch = fuseResults[0].item;
    const remainingMatches = fuseResults.slice(1).map(r => r.item);

    // Group remaining into clusters by primary emotion or topic (simple clustering)
    const clustersMap: Record<string, any[]> = {};
    const otherMemories: any[] = [];

    remainingMatches.forEach(match => {
      const emotion = match.analysis?.primaryEmotion;
      if (emotion && emotion === topMatch.analysis?.primaryEmotion) {
        if (!clustersMap[emotion]) clustersMap[emotion] = [];
        clustersMap[emotion].push(match);
      } else {
        otherMemories.push(match);
      }
    });

    const clusters = Object.entries(clustersMap).map(([label, clusterEntries]) => ({
      label: `Related: ${label}`,
      entries: clusterEntries
    }));

    return {
      topMatch,
      clusters,
      otherMemories
    };
  }, [searchQuery, fuse]);

  // 3. Compute suggestions based on common topics/emotions in entries
  const suggestions = useMemo(() => {
    if (entries.length === 0) return { emotions: ['Reflection', 'Joy'], goals: ['Clarity'] };
    
    const emotionFreqs: Record<string, number> = {};
    const goalFreqs: Record<string, number> = {};
    
    entries.forEach(e => {
      if (e.analysis?.primaryEmotion) {
        emotionFreqs[e.analysis.primaryEmotion] = (emotionFreqs[e.analysis.primaryEmotion] || 0) + 1;
      }
      e.analysis?.topics?.forEach((t: string) => {
        goalFreqs[t] = (goalFreqs[t] || 0) + 1;
      });
    });

    return {
      emotions: Object.keys(emotionFreqs).sort((a, b) => emotionFreqs[b] - emotionFreqs[a]).slice(0, 4),
      goals: Object.keys(goalFreqs).sort((a, b) => goalFreqs[b] - goalFreqs[a]).slice(0, 4)
    };
  }, [entries]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    suggestions
  };
}
