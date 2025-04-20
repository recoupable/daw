import { useState, useCallback } from 'react';
import type { Track } from '@/app/types/daw';
import { generateId, TRACK_COLORS } from '../utils/helpers';

interface UseTrackManagerProps {
  onTrackDelete?: (trackId: string) => void;
}

export function useTrackManager({ onTrackDelete }: UseTrackManagerProps = {}) {
  const [tracks, setTracks] = useState<Track[]>([
    { id: generateId(), name: 'Track 1', color: 'slate' },
  ]);

  // Add new track
  const addTrack = useCallback(() => {
    const trackId = generateId();
    const colorIndex = tracks.length % TRACK_COLORS.length;

    const newTrack = {
      id: trackId,
      name: `Track ${tracks.length + 1}`,
      color: TRACK_COLORS[colorIndex],
    };

    setTracks((prev) => [...prev, newTrack]);
    return newTrack;
  }, [tracks]);

  // Delete track
  const deleteTrack = useCallback(
    (trackId: string) => {
      setTracks((prev) => prev.filter((track) => track.id !== trackId));

      // Call the onTrackDelete callback if provided
      if (onTrackDelete) {
        onTrackDelete(trackId);
      }
    },
    [onTrackDelete],
  );

  // Update track properties
  const updateTrack = useCallback(
    (trackId: string, updates: Partial<Track>) => {
      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId ? { ...track, ...updates } : track,
        ),
      );
    },
    [],
  );

  // Get a track by ID
  const getTrack = useCallback(
    (trackId: string) => {
      return tracks.find((track) => track.id === trackId);
    },
    [tracks],
  );

  return {
    tracks,
    addTrack,
    deleteTrack,
    updateTrack,
    getTrack,
  };
}
