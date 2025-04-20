import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { BPM_CHANGE_EVENT } from './useBPM';

export function useMetronome(initialBpm = 120) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loadingMetronome, setLoadingMetronome] = useState(true);
  const [tickCount, setTickCount] = useState(0);

  // Reference to store metronome player
  const metronomeRef = useRef<Tone.Synth | null>(null);
  const metronomeSequenceRef = useRef<Tone.Sequence | null>(null);

  // Load metronome sounds and setup
  const initializeMetronome = useCallback(async () => {
    try {
      console.log('[Metronome] Initializing metronome...');
      setLoadingMetronome(true);

      // Ensure we don't have multiple metronomes
      if (metronomeRef.current) {
        metronomeRef.current.dispose();
        metronomeRef.current = null;
      }

      if (metronomeSequenceRef.current) {
        metronomeSequenceRef.current.dispose();
        metronomeSequenceRef.current = null;
      }

      // Create a simple synth directly - skip trying to load audio files
      try {
        console.log('[Metronome] Creating synth for metronome');
        const synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination();

        metronomeRef.current = synth;
        setupMetronomeSequence();
        setLoadingMetronome(false);
      } catch (error) {
        console.error('[Metronome] Error creating synth:', error);
        setLoadingMetronome(false);
      }
    } catch (err) {
      console.error('[Metronome] Failed to initialize metronome:', err);
      setLoadingMetronome(false);
    }
  }, []);

  // Setup the metronome sequence pattern
  const setupMetronomeSequence = useCallback(() => {
    if (!metronomeRef.current) {
      console.error(
        '[Metronome] Cannot setup sequence, metronome not initialized',
      );
      return;
    }

    try {
      // Create a sequence for a 4/4 time signature
      // First beat is high, remaining beats are low
      const sequence = new Tone.Sequence(
        (time, beat) => {
          if (!metronomeRef.current) return;

          try {
            // Update tick count for visualization
            setTickCount((prev) => (prev + 1) % 4);

            // Use different pitches for different beats in a bar
            const note = beat === 0 ? 'C5' : 'G4';
            metronomeRef.current.triggerAttackRelease(note, '32n', time);
          } catch (err) {
            console.error('[Metronome] Error in sequence callback:', err);
          }
        },
        [0, 1, 2, 3],
        '4n', // quarter notes
      );

      // Store sequence for later disposal
      metronomeSequenceRef.current = sequence;
      console.log('[Metronome] Metronome sequence created');

      // Start/stop based on both transport state and metronome enabled state
      updateMetronomeState();
    } catch (err) {
      console.error('[Metronome] Failed to setup metronome sequence:', err);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeMetronome();

    // Clean up on unmount
    return () => {
      try {
        if (metronomeSequenceRef.current) {
          metronomeSequenceRef.current.dispose();
          metronomeSequenceRef.current = null;
        }

        if (metronomeRef.current) {
          metronomeRef.current.dispose();
          metronomeRef.current = null;
        }

        console.log('[Metronome] Metronome resources cleaned up');
      } catch (err) {
        console.error('[Metronome] Error during cleanup:', err);
      }
    };
  }, [initializeMetronome]);

  // Function to update metronome state based on both transport state and metronome enabled state
  const updateMetronomeState = useCallback(() => {
    if (!metronomeSequenceRef.current) {
      console.log('[Metronome] Sequence not ready yet');
      return;
    }

    try {
      const transportPlaying = Tone.Transport.state === 'started';
      const shouldPlay = isEnabled && transportPlaying;

      console.log(
        `[Metronome] Update state - Transport: ${transportPlaying ? 'playing' : 'stopped'}, Metronome: ${isEnabled ? 'enabled' : 'disabled'}`,
      );

      if (shouldPlay) {
        // Only play if both transport is playing AND metronome is enabled
        console.log('[Metronome] Starting metronome sequence');

        // Make sure Tone is started
        if (Tone.getContext().state !== 'running') {
          Tone.start().catch((err) => {
            console.error('[Metronome] Failed to start Tone context:', err);
          });
        }

        metronomeSequenceRef.current.start(0);
      } else {
        // Stop metronome if either transport stops OR metronome is disabled
        console.log('[Metronome] Stopping metronome sequence');
        try {
          metronomeSequenceRef.current.stop();
        } catch (stopError) {
          console.warn('[Metronome] Error stopping sequence:', stopError);
          // Try again with a small timeout to avoid timing issues
          setTimeout(() => {
            try {
              if (metronomeSequenceRef.current) {
                metronomeSequenceRef.current.stop();
              }
            } catch (retryError) {
              console.error(
                '[Metronome] Failed to stop sequence on retry:',
                retryError,
              );
            }
          }, 10);
        }
      }
    } catch (err) {
      console.error('[Metronome] Error updating metronome state:', err);
    }
  }, [isEnabled]);

  // Listen for transport state changes
  useEffect(() => {
    const handleTransportStart = () => {
      console.log('[Metronome] Transport started');
      updateMetronomeState();
    };

    const handleTransportStop = () => {
      console.log('[Metronome] Transport stopped');
      updateMetronomeState();
    };

    // Add event listeners for transport state changes
    Tone.Transport.on('start', handleTransportStart);
    Tone.Transport.on('stop', handleTransportStop);
    Tone.Transport.on('pause', handleTransportStop);

    return () => {
      // Clean up event listeners
      Tone.Transport.off('start', handleTransportStart);
      Tone.Transport.off('stop', handleTransportStop);
      Tone.Transport.off('pause', handleTransportStop);
    };
  }, [updateMetronomeState]);

  // Start/stop the metronome sequence when isEnabled changes
  useEffect(() => {
    updateMetronomeState();
  }, [isEnabled, updateMetronomeState]);

  // Toggle metronome on/off
  const toggleMetronome = useCallback(() => {
    if (loadingMetronome) {
      console.log('[Metronome] Cannot toggle, metronome still loading');
      return;
    }

    setIsEnabled((prev) => {
      const newState = !prev;
      console.log(
        `[Metronome] Toggled to ${newState ? 'enabled' : 'disabled'}`,
      );
      return newState;
    });
  }, [loadingMetronome]);

  // Listen for BPM changes globally
  useEffect(() => {
    const handleBpmChange = (e: CustomEvent) => {
      const newBpm = e.detail.bpm;
      console.log(`[Metronome] Received BPM change: ${newBpm}`);
    };

    window.addEventListener(BPM_CHANGE_EVENT, handleBpmChange as EventListener);

    return () => {
      window.removeEventListener(
        BPM_CHANGE_EVENT,
        handleBpmChange as EventListener,
      );
    };
  }, []);

  return {
    isMetronomePlaying: isEnabled && Tone.Transport.state === 'started',
    isMetronomeEnabled: isEnabled,
    toggleMetronome,
    currentBpm: Tone.Transport?.bpm?.value ?? initialBpm, // Add proper safety checks
    tickCount,
    isLoading: loadingMetronome,
  };
}
