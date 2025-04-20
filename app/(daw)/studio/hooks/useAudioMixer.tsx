/**
 * useAudioMixer.tsx
 *
 * React hook for the AudioMixer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  AudioMixer,
  type AudioSourceOptions,
  type AudioSource,
} from '../audio/AudioMixer';

interface UseAudioMixerProps {
  initialVolume?: number;
}

export function useAudioMixer({
  initialVolume = 0.9,
}: UseAudioMixerProps = {}) {
  // Use ref to maintain the mixer instance across renders
  const mixerRef = useRef<AudioMixer | null>(null);

  // Track master volume as state for UI updates
  const [masterVolume, setMasterVolume] = useState(initialVolume);

  // Track mute state for UI updates
  const [muted, setMuted] = useState(false);

  // Track active source IDs for UI updates
  const [activeSourceIds, setActiveSourceIds] = useState<string[]>([]);

  // Initialize the mixer
  useEffect(() => {
    // Create the mixer instance
    mixerRef.current = new AudioMixer();

    // Set initial volume
    mixerRef.current.setMasterVolume(initialVolume);

    // Cleanup function
    return () => {
      if (mixerRef.current) {
        mixerRef.current.dispose();
        mixerRef.current = null;
      }
    };
  }, [initialVolume]);

  // Add a source to the mixer
  const addSource = useCallback(
    (
      id: string,
      sourceNode: Tone.ToneAudioNode,
      options?: AudioSourceOptions,
    ) => {
      if (!mixerRef.current) return null;

      const source = mixerRef.current.addSource(id, sourceNode, options);

      // Update active source IDs
      setActiveSourceIds((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });

      return source;
    },
    [],
  );

  // Remove a source from the mixer
  const removeSource = useCallback((id: string) => {
    if (!mixerRef.current) return;

    mixerRef.current.removeSource(id);

    // Update active source IDs
    setActiveSourceIds((prev) => prev.filter((sourceId) => sourceId !== id));
  }, []);

  // Set master volume
  const setVolume = useCallback((volume: number) => {
    if (!mixerRef.current) return;

    mixerRef.current.setMasterVolume(volume);
    setMasterVolume(volume);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!mixerRef.current) return;

    const newMuted = !muted;
    mixerRef.current.setMute(newMuted);
    setMuted(newMuted);
  }, [muted]);

  // Set source volume
  const setSourceVolume = useCallback((id: string, volume: number) => {
    if (!mixerRef.current) return;

    mixerRef.current.setSourceGain(id, volume);
  }, []);

  // Set source panning
  const setSourcePan = useCallback((id: string, pan: number) => {
    if (!mixerRef.current) return;

    mixerRef.current.setSourcePan(id, pan);
  }, []);

  // Toggle source mute
  const toggleSourceMute = useCallback((id: string) => {
    if (!mixerRef.current) return;

    const sources = mixerRef.current.getActiveSources();
    const source = sources.get(id);

    if (source) {
      const newMuted = !source.options.mute;
      mixerRef.current.setSourceMute(id, newMuted);
    }
  }, []);

  // Toggle source solo
  const toggleSourceSolo = useCallback((id: string) => {
    if (!mixerRef.current) return;

    const sources = mixerRef.current.getActiveSources();
    const source = sources.get(id);

    if (source) {
      const newSolo = !source.options.solo;
      mixerRef.current.setSourceSolo(id, newSolo);
    }
  }, []);

  // Load and play an audio file
  const playAudioFile = useCallback(
    async (id: string, url: string, options?: AudioSourceOptions) => {
      try {
        // Create a new player
        const player = new Tone.Player({
          url,
          autostart: false,
          loop: false,
          onload: () => {
            console.log(`[AudioMixer] Audio loaded: ${id}`);
          },
        });

        // Add to mixer
        const source = addSource(id, player, options);

        // Start playback
        if (player.loaded) {
          player.start();
        } else {
          player.load(url).then(() => {
            player.start();
          });
        }

        return source;
      } catch (error) {
        console.error(`[AudioMixer] Failed to play audio: ${error}`);
        return null;
      }
    },
    [addSource],
  );

  // Stop all audio
  const stopAll = useCallback(() => {
    if (!mixerRef.current) return;

    mixerRef.current.clearAllSources();
    setActiveSourceIds([]);
  }, []);

  return {
    addSource,
    removeSource,
    setVolume,
    toggleMute,
    setSourceVolume,
    setSourcePan,
    toggleSourceMute,
    toggleSourceSolo,
    playAudioFile,
    stopAll,
    masterVolume,
    muted,
    activeSourceIds,
  };
}
