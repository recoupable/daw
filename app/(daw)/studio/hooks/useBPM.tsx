import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import * as Tone from 'tone';

// Common BPM constants
export const MIN_BPM = 20;
export const MAX_BPM = 300;
export const BPM_PRESETS = [60, 80, 90, 100, 120, 140, 160, 180];

// Create a custom event name for BPM changes
export const BPM_CHANGE_EVENT = 'daw-bpm-change';

// Create a context for BPM to share across components
interface BPMContextType {
  bpm: number;
  setBpm: (newBpm: number) => void;
  MIN_BPM: number;
  MAX_BPM: number;
}

const BPMContext = createContext<BPMContextType | null>(null);

export function BPMProvider({
  children,
  initialBpm = 120,
}: {
  children: React.ReactNode;
  initialBpm?: number;
}) {
  const { bpm, setBpm } = useBPM(initialBpm);

  return (
    <BPMContext.Provider value={{ bpm, setBpm, MIN_BPM, MAX_BPM }}>
      {children}
    </BPMContext.Provider>
  );
}

export function useBPMContext() {
  const context = useContext(BPMContext);
  if (!context) {
    throw new Error('useBPMContext must be used within a BPMProvider');
  }
  return context;
}

// Hook for handling BPM state and synchronization
export function useBPM(initialBpm = 120) {
  // Ensure initial BPM is within valid range
  const validInitialBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, initialBpm));
  const [bpm, setBpmState] = useState(validInitialBpm);

  // Use a ref to track the latest BPM value for event listeners
  const bpmRef = useRef(validInitialBpm);

  // Track if Tone.js is initialized
  const isToneInitializedRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Initialize Tone.Transport BPM on mount
  useEffect(() => {
    // Set initial BPM for Tone.js transport
    try {
      // Check if Tone context is already running
      const toneContext = Tone.getContext();
      const needsStart = toneContext.state !== 'running';

      if (needsStart) {
        console.log('[BPM] Starting Tone.js context...');
        Tone.start()
          .then(() => {
            console.log('[BPM] Tone.js context started successfully');

            // Set Transport BPM once context is running
            Tone.Transport.bpm.value = validInitialBpm;

            // Force scheduler update
            Tone.Transport.start().pause();

            isToneInitializedRef.current = true;
            console.log(
              `[BPM] Initialized Tone.Transport.bpm to ${validInitialBpm}`,
            );
          })
          .catch((err) => {
            console.error('[BPM] Failed to start Tone.js context:', err);
          });
      } else {
        // Context already running, set BPM directly
        Tone.Transport.bpm.value = validInitialBpm;

        // Force scheduler update
        const wasPlaying = Tone.Transport.state === 'started';
        if (!wasPlaying) {
          Tone.Transport.start().pause();
        }

        isToneInitializedRef.current = true;
        console.log(
          `[BPM] Initialized Tone.Transport.bpm to ${validInitialBpm}`,
        );
      }
    } catch (err) {
      console.error('[BPM] Error setting initial BPM:', err);
    }

    // Listen for BPM changes from other components
    const handleExternalBPMChange = (event: CustomEvent<{ bpm: number }>) => {
      const newBpm = event.detail.bpm;
      // Only update state if value is different from current ref value
      // This prevents potential circular updates
      if (newBpm !== bpmRef.current) {
        console.log(`[BPM] Received external BPM change: ${newBpm}`);
        setBpmState(newBpm);
      }
    };

    window.addEventListener(
      BPM_CHANGE_EVENT,
      handleExternalBPMChange as EventListener,
    );

    // Clean up function
    return () => {
      window.removeEventListener(
        BPM_CHANGE_EVENT,
        handleExternalBPMChange as EventListener,
      );
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Function to update BPM across the application
  const setBpm = useCallback((newBpm: number) => {
    // Apply constraints to BPM value without reassigning parameter
    const validBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));

    console.log(`[BPM] Setting new BPM: ${validBpm}`);

    try {
      // Update internal state immediately
      setBpmState(validBpm);

      // Update ref immediately to prevent circular updates
      bpmRef.current = validBpm;

      // Wait for tone.js to be initialized
      if (!isToneInitializedRef.current) {
        console.warn(
          '[BPM] Tone.js not fully initialized yet, queuing BPM update',
        );

        // Try to initialize Tone if needed
        const toneContext = Tone.getContext();
        if (toneContext.state !== 'running') {
          Tone.start()
            .then(() => {
              Tone.Transport.bpm.value = validBpm;
              isToneInitializedRef.current = true;
              console.log(`[BPM] Deferred BPM update applied: ${validBpm}`);
            })
            .catch((err) => {
              console.error('[BPM] Failed to start Tone.js context:', err);
            });
        } else {
          // Context running but not marked as initialized
          Tone.Transport.bpm.value = validBpm;
          isToneInitializedRef.current = true;
          console.log(`[BPM] Applied BPM after initialization: ${validBpm}`);
        }
      } else {
        // Normal flow - update Tone.js Transport BPM immediately
        Tone.Transport.bpm.value = validBpm;
        console.log(`[BPM] Updated Tone.Transport.bpm to ${validBpm}`);

        // Force immediate update if transport isn't running
        const transportState = Tone.Transport.state;
        if (transportState !== 'started') {
          // This helps ensure internal Tone.js timing is updated immediately
          Tone.Transport.start();
          Tone.Transport.pause();
          console.log('[BPM] Forced Transport scheduler update');
        }
      }

      // Dispatch global event for other components to react
      const bpmChangeEvent = new CustomEvent(BPM_CHANGE_EVENT, {
        detail: { bpm: validBpm },
      });

      window.dispatchEvent(bpmChangeEvent);
      console.log(`[BPM] BPM change event dispatched: ${validBpm}`);
    } catch (err) {
      console.error('[BPM] Error updating BPM:', err);
    }
  }, []);

  return {
    bpm,
    setBpm,
    MIN_BPM,
    MAX_BPM,
  };
}
