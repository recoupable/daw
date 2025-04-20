import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { BPM_CHANGE_EVENT } from './useBPM';
import type { CSSProperties } from 'react';

interface PlaybackControlOptions {
  initialBpm?: number;
  onBeatUpdate?: (beat: number) => void;
}

/**
 * Simplified playback control hook focusing on reliable state updates
 */
export function usePlaybackControl(
  options: PlaybackControlOptions | number = 120,
) {
  // Handle both number and object parameters for backward compatibility
  const initialBpm =
    typeof options === 'number' ? options : options.initialBpm || 120;
  const onBeatUpdate =
    typeof options === 'object' ? options.onBeatUpdate : undefined;

  // Basic state for playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(1);
  const [bpm, setBpm] = useState(initialBpm);
  const [displayTime, setDisplayTime] = useState('00:00:00');

  // Refs for timing and animation
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<any>(null); // For backup timer

  // Format time display (e.g., "00:00:00")
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Function to manually update the beat position
  const updateBeatPosition = useCallback(() => {
    // Only update if we're playing
    if (!isPlaying || startTimeRef.current === null) {
      return;
    }

    try {
      // Calculate beats based on elapsed time
      const now = performance.now();
      const elapsedTime = (now - startTimeRef.current) / 1000;
      const beatsPerSecond = bpm / 60;
      const totalBeats = elapsedTime * beatsPerSecond;

      // Update state values
      setCurrentBeat(totalBeats);
      setCurrentBar(Math.floor(totalBeats / 4) + 1);
      setDisplayTime(formatTime(elapsedTime));

      // Call beat update callback if provided
      if (onBeatUpdate) {
        onBeatUpdate(totalBeats);
      }

      // Schedule next frame only if we're still playing
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateBeatPosition);
      }
    } catch (error) {
      console.error('Error updating beat position:', error);

      // Try to recover
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateBeatPosition);
      }
    }
  }, [isPlaying, bpm, formatTime, onBeatUpdate]);

  // Toggle playback state with simplified logic
  const togglePlayback = useCallback(() => {
    setIsPlaying((prevIsPlaying) => {
      const newPlayingState = !prevIsPlaying;
      console.log(
        `[Playback] 🎮 Toggling playback: ${newPlayingState ? 'starting' : 'stopping'}`,
      );

      // Handle starting playback
      if (newPlayingState) {
        // Ensure audio context is running
        try {
          if (Tone.getContext().state !== 'running') {
            Tone.start().then(() => {
              console.log('[Playback] 🔈 Audio context started');
            });
          }
        } catch (e) {
          console.error('[Playback] 🔇 Error starting audio context:', e);
        }

        // Start Tone.js transport
        try {
          Tone.Transport.start();
          console.log('[Playback] 🚂 Transport started:', Tone.Transport.state);
        } catch (e) {
          console.error('[Playback] 🚫 Error starting transport:', e);
        }

        // Set start time and begin animation
        startTimeRef.current = performance.now();
        console.log('[Playback] ⏱️ Start time set:', startTimeRef.current);

        // Start animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(updateBeatPosition);
        console.log('[Playback] 🔄 Animation loop started');

        // Backup: also use an interval as a safety measure
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const now = performance.now();
            const elapsedTime = (now - startTimeRef.current) / 1000;
            const beatsPerSecond = bpm / 60;
            const totalBeats = elapsedTime * beatsPerSecond;

            console.log(`[Backup] Beat: ${totalBeats.toFixed(2)}`);

            // Force update state directly
            setCurrentBeat(totalBeats);
            setCurrentBar(Math.floor(totalBeats / 4) + 1);
            setDisplayTime(formatTime(elapsedTime));

            // Call beat update callback if provided
            if (onBeatUpdate) {
              onBeatUpdate(totalBeats);
            }
          }
        }, 100); // Update every 100ms as a backup
      }
      // Handle stopping playback
      else {
        // Stop Tone.js transport
        try {
          Tone.Transport.stop();
          console.log('[Playback] 🛑 Transport stopped');
        } catch (e) {
          console.error('[Playback] 🚫 Error stopping transport:', e);
        }

        // Stop animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
          console.log('[Playback] 🚫 Animation loop stopped');
        }

        // Clear backup interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          console.log('[Playback] 🚫 Backup interval cleared');
        }

        // Reset timing refs
        startTimeRef.current = null;
      }

      return newPlayingState;
    });
  }, [bpm, formatTime, onBeatUpdate, updateBeatPosition]);

  // Stop playback and reset position
  const stopPlayback = useCallback(() => {
    // Stop tone.js transport
    try {
      Tone.Transport.stop();
      console.log('[Playback] 🛑 Transport stopped');
    } catch (e) {
      console.error('[Playback] 🚫 Error stopping transport:', e);
    }

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('[Playback] 🚫 Animation loop stopped');
    }

    // Clear backup interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[Playback] 🚫 Backup interval cleared');
    }

    // Reset state
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentBar(1);
    setDisplayTime('00:00:00');
    startTimeRef.current = null;

    console.log('[Playback] ↩️ Playback reset');
  }, []);

  // Update BPM
  const changeBpm = useCallback(
    (newBpm: number) => {
      // Validate BPM range
      const validBpm = Math.max(20, Math.min(300, newBpm));
      console.log(`[Playback] 🎵 Changing BPM: ${bpm} -> ${validBpm}`);

      // Update state
      setBpm(validBpm);

      // Update Tone.js transport
      try {
        Tone.Transport.bpm.value = validBpm;
      } catch (e) {
        console.error('[Playback] 🚫 Error updating Transport BPM:', e);
      }

      // If playing, reset the start time to maintain proper timing
      if (isPlaying && startTimeRef.current !== null) {
        // Save the current beat position
        const now = performance.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        const oldBeatsPerSecond = bpm / 60;
        const currentBeatPos = elapsed * oldBeatsPerSecond;

        // Reset the start time based on the new BPM
        const newBeatsPerSecond = validBpm / 60;
        const newElapsed = currentBeatPos / newBeatsPerSecond;
        startTimeRef.current = now - newElapsed * 1000;
      }

      // Dispatch BPM change event
      try {
        const bpmChangeEvent = new CustomEvent(BPM_CHANGE_EVENT, {
          detail: { bpm: validBpm },
        });
        window.dispatchEvent(bpmChangeEvent);
      } catch (e) {
        console.error('[Playback] 🚫 Error dispatching BPM event:', e);
      }
    },
    [bpm, isPlaying],
  );

  // Calculate playhead style
  const getPlayheadStyle = useCallback((): CSSProperties => {
    // Fixed width per beat (must match grid in StudioClient)
    const pixelsPerBeat = 64;

    // Keep playhead within visible range
    const visibleBeats = 16;
    const adjustedBeat = currentBeat % visibleBeats;
    const position = adjustedBeat * pixelsPerBeat;

    console.log(
      `[Debug] 📏 Playhead at ${position.toFixed(0)}px (beat ${currentBeat.toFixed(2)})`,
    );

    return {
      left: `${position}px`,
      height: '100%',
      width: '2px',
      position: 'absolute',
      backgroundColor: 'red',
      zIndex: 100,
      transition: isPlaying ? 'none' : 'left 0.1s ease',
      pointerEvents: 'none' as const,
    };
  }, [currentBeat, isPlaying]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop and clean up animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop backup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Stop transport
      try {
        Tone.Transport.stop();
      } catch (e) {
        console.error('[Playback] 🚫 Error stopping transport on cleanup:', e);
      }
    };
  }, []);

  return {
    isPlaying,
    currentBeat,
    currentBar,
    bpm,
    displayTime,
    togglePlayback,
    stopPlayback,
    changeBpm,
    getPlayheadStyle,
  };
}
