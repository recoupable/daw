'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import * as Tone from 'tone';
import type { AudioBlock, Selection } from '@/app/types/daw';

// Import hooks
import { useMetronome } from './hooks/useMetronome';
import { useSelectionManager } from './hooks/useSelectionManager';
import { usePlaybackControl } from './hooks/usePlaybackControl';
import { useAudioBlockManager } from './hooks/useAudioBlockManager';
import { useTrackManager } from './hooks/useTrackManager';
import { useBPM, BPMProvider } from './hooks/useBPM';
import { useAudioMixer } from './hooks/useAudioMixer';
import { BPMSelector } from './components/BPMSelector';

// Import components
import { TransportControls } from './components/TransportControls';
import { TrackList } from './components/TrackList';
import { MixerControls } from './components/MixerControls';

// Define utility functions locally
const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;
const getProxiedAudioUrl = (url: string) => {
  // Only proxy external URLs, not local ones
  if (url.startsWith('http')) {
    return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

// Add a helper function to handle audio context issues
const safeAudioAction = async (
  action: () => Promise<void> | void,
  errorHandler: (error: any) => void,
) => {
  try {
    await action();
  } catch (error) {
    console.error('Audio action failed:', error);
    errorHandler(error);

    // Try to recover by resetting Tone.js if possible
    try {
      if (Tone.context.state === 'closed') {
        console.log('Attempting to reset Tone.js...');
        // Wait a moment before trying to restart
        await new Promise((resolve) => setTimeout(resolve, 100));
        await Tone.start();
        console.log('Tone.js reset successful');
      }
    } catch (recoveryError) {
      console.error('Failed to recover Tone.js:', recoveryError);
    }
  }
};

interface StudioClientProps {
  projectId: string;
}

export default function StudioClient({ projectId }: StudioClientProps) {
  // State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Use the useBPM hook correctly
  const { bpm, setBpm } = useBPM();

  // Forward BPM changes to the UI
  const handleBpmChange = useCallback(
    (newBpm: number) => {
      console.log(`[StudioClient] Setting BPM to: ${newBpm}`);

      // Update BPM using the provider
      setBpm(newBpm);

      // Explicitly set the transport BPM to ensure it updates immediately
      try {
        Tone.Transport.bpm.value = newBpm;
        console.log(`[StudioClient] Transport BPM updated to: ${newBpm}`);
      } catch (err) {
        console.error('[StudioClient] Error updating Transport BPM:', err);
      }
    },
    [setBpm],
  );

  // Pass BPM changes from the transport controls to our handler
  useEffect(() => {
    console.log(`[StudioClient] BPM from useBPM hook: ${bpm}`);
  }, [bpm]);

  // Get audio block manager functions first
  const {
    audioBlocks,
    draggedBlock,
    addAudioBlock,
    removeAudioBlock,
    removeTrackBlocks,
    getAudioBlockStyle,
    handleBlockMouseDown,
    playAudioBlock,
    stopAudioBlock,
    checkBlocksForPlayback,
  } = useAudioBlockManager({ bpm });

  // Now we can reference checkBlocksForPlayback
  const checkBlocksForPlaybackWrapper = useCallback(
    (beat: number) => {
      console.log(`[Debug] Checking blocks at beat: ${beat.toFixed(2)}`);
      // Pass the previous beat (or current beat if not available) as second parameter
      checkBlocksForPlayback(beat, beat - 0.01);
    },
    [checkBlocksForPlayback],
  );

  // Callback to handle beat updates from playback
  const handleBeatUpdate = useCallback((beat: number) => {
    console.log(`[Debug] Beat update: ${beat}`);
    // Update active audio blocks or other state based on current beat
  }, []);

  // Create playback control with correct initialBpm and beat update callback
  const {
    isPlaying,
    currentBeat,
    currentBar,
    bpm: playbackBpm,
    displayTime,
    togglePlayback: originalTogglePlayback,
    stopPlayback: originalStopPlayback,
    changeBpm,
    getPlayheadStyle,
  } = usePlaybackControl({
    initialBpm: bpm,
    onBeatUpdate: checkBlocksForPlaybackWrapper,
  });

  // Force start the audio context before any playback-related actions
  const ensureAudioContext = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      console.log('[Debug] Starting Tone audio context');
      try {
        await Tone.start();
        console.log('[Debug] Tone audio context started successfully');
        return true;
      } catch (err) {
        console.error('[Debug] Failed to start Tone audio context:', err);
        return false;
      }
    }
    return true;
  }, []);

  // Debug function to help trace and solve playback issues
  const debugTogglePlayback = useCallback(async () => {
    console.log('[Debug] ===== Toggle Play/Pause Pressed =====');
    console.log('[Debug] Current state - isPlaying:', isPlaying);
    console.log('[Debug] Audio context state:', Tone.getContext().state);
    console.log('[Debug] Transport state:', Tone.Transport.state);
    console.log('[Debug] Transport BPM:', Tone.Transport?.bpm?.value);

    // Always ensure audio context is started first
    const contextStarted = await ensureAudioContext();
    if (!contextStarted) {
      console.error(
        '[Debug] Could not start audio context - cannot proceed with playback',
      );
      setError('Could not start audio playback. Try refreshing the page.');
      return;
    }

    // Now toggle playback
    console.log('[Debug] Audio context ready, toggling playback');
    originalTogglePlayback();

    // Check state after toggle
    setTimeout(() => {
      console.log('[Debug] ===== Playback State After Toggle =====');
      console.log('[Debug] New state - isPlaying:', !isPlaying);
      console.log('[Debug] Audio context state:', Tone.getContext().state);
      console.log('[Debug] Transport state:', Tone.Transport.state);
      console.log('[Debug] Current beat:', currentBeat);
    }, 100);
  }, [isPlaying, originalTogglePlayback, currentBeat, ensureAudioContext]);

  // Wrap the stopPlayback function with debugging
  const debugStopPlayback = useCallback(async () => {
    console.log('[Debug] ===== Stop Playback Pressed =====');

    // Always ensure audio context is started first
    await ensureAudioContext();

    // Stop playback
    originalStopPlayback();

    // Log state after stopping
    setTimeout(() => {
      console.log('[Debug] ===== Playback State After Stop =====');
      console.log('[Debug] Audio context state:', Tone.getContext().state);
      console.log('[Debug] Transport state:', Tone.Transport.state);
    }, 100);
  }, [originalStopPlayback, ensureAudioContext]);

  // Replace the original handleTogglePlayback with our debug version
  const handleTogglePlayback = useCallback(() => {
    safeAudioAction(
      async () => debugTogglePlayback(),
      (error) =>
        setError(`Playback error: ${error.message}. Try refreshing the page.`),
    );
  }, [debugTogglePlayback]);

  // Replace the original handleStopPlayback with our debug version
  const handleStopPlayback = useCallback(() => {
    safeAudioAction(
      async () => debugStopPlayback(),
      (error) =>
        setError(
          `Stop playback error: ${error.message}. Try refreshing the page.`,
        ),
    );
  }, [debugStopPlayback]);

  // Fix the metronome hook usage
  const { isMetronomePlaying: metronomeEnabled, toggleMetronome } =
    useMetronome(bpm);

  // Define seekToBeat function since it's missing
  const seekToBeat = useCallback(
    (beat: number) => {
      // Implementation for seeking to a specific beat
      console.log(`Seeking to beat: ${beat}`);
      // You might want to implement this properly based on your requirements
      handleStopPlayback();
      // You'd need additional logic here to set the current beat
    },
    [handleStopPlayback],
  );

  // Then the rest of your hooks and state
  const { setSourceVolume, setSourcePan, toggleSourceMute, toggleSourceSolo } =
    useAudioMixer();

  const {
    selection,
    isSelecting,
    selectionStart,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    getSelectionStyle,
  } = useSelectionManager();

  const { tracks, addTrack, deleteTrack, getTrack } = useTrackManager({
    onTrackDelete: (trackId) => {
      // When a track is deleted, we need to:
      // 1. Remove all its audio blocks
      removeTrackBlocks(trackId);
      // 2. Clear selection if it was on this track
      if (selection?.trackId === trackId) {
        clearSelection();
      }
    },
  });

  // Generate beat markers (1 through 24)
  const beatMarkers = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: `beat-${i + 1}`,
        number: i + 1,
      })),
    [],
  );

  // Define a constant for beat width to ensure consistency
  const BEAT_WIDTH = 64; // Width in pixels of each beat

  // Reference to the arrangement view for keyboard focus
  const arrangementViewRef = useRef<HTMLDivElement>(null);
  const [isArrangementFocused, setIsArrangementFocused] = useState(false);

  // References for selection management
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectionDataRef = useRef<{ trackId: string; beat: number } | null>(
    null,
  );

  // Initialize with default track if needed
  useEffect(() => {
    // For demo purposes, create a sample track if none exist
    if (tracks.length === 0) {
      addTrack();
    }
  }, [tracks.length, addTrack]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Poll for task status
  const startPolling = (taskId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let pollingCount = 0;
    const MAX_POLLS = 30; // Stop after 30 attempts

    console.log(`Starting to poll for task ID: ${taskId}`);
    setCurrentTaskId(taskId);

    const interval = setInterval(async () => {
      try {
        pollingCount++;
        console.log(`Polling attempt ${pollingCount} for task ID: ${taskId}`);

        if (pollingCount >= MAX_POLLS) {
          clearInterval(interval);
          setError('Generation timed out. Please try again.');
          setCurrentTaskId(null);
          setPollingInterval(null);
          return;
        }

        // Use relative URL which works on any port
        const response = await fetch(
          `/api/text-to-music/status?id=${encodeURIComponent(taskId)}`,
        );

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Status response:', data);

        // If completed, process the result
        if (data.status === 'completed' || data.status === 'succeeded') {
          clearInterval(interval);
          setCurrentTaskId(null);
          setPollingInterval(null);

          // Get the audio URL
          let audioUrl = null;
          if (data.choices && data.choices.length > 0) {
            audioUrl = data.choices[0]?.url || data.choices[0]?.flac_url;
          } else if (data.url) {
            audioUrl = data.url;
          } else if (data.audioUrl) {
            audioUrl = data.audioUrl;
          }

          if (!audioUrl) {
            setError('Generation completed but no audio URL found.');
            return;
          }

          // Proxy the audio URL to avoid CORS issues
          const proxiedAudioUrl = `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`;

          // Get track color
          const trackColor =
            getTrack(selection?.trackId || '')?.color || 'gray';

          // Create a new audio block
          const newBlock: AudioBlock = {
            id: `block-${Date.now()}`,
            trackId: selection?.trackId || tracks[0].id,
            name: prompt,
            start: selection?.startBeat || 1,
            duration: selection
              ? selection.endBeat - selection.startBeat + 1
              : 4,
            audioUrl: proxiedAudioUrl,
            color: trackColor,
          };

          // Add the block
          addAudioBlock(newBlock);
          setPrompt('');
          clearSelection();
          setError('Audio generated successfully!');

          // Clear success message after 3 seconds
          setTimeout(() => setError(null), 3000);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setCurrentTaskId(null);
          setPollingInterval(null);
          setError(`Generation failed: ${data.error || 'Unknown error'}`);
        } else {
          // Still in progress, update message
          const statusText = data.status || 'processing';
          const progress = data.progress
            ? ` (${Math.round(data.progress * 100)}%)`
            : '';
          // Only log to console instead of showing error message
          console.log(
            `Audio generation in progress - status: ${statusText}${progress}. Please wait...`,
          );
        }
      } catch (err) {
        console.error('Error checking generation status:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Error checking generation status',
        );

        clearInterval(interval);
        setCurrentTaskId(null);
        setPollingInterval(null);
      }
    }, 5000); // Check every 5 seconds

    setPollingInterval(interval);
  };

  // Generate audio from prompt
  const generateAudio = async () => {
    if (!selection || !prompt.trim()) {
      setError('Please select a region and enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);

      // Calculate duration in seconds (assume 4/4 time signature)
      const beatsPerSecond = bpm / 60; // BPM / 60 = beats per second
      const durationInSeconds =
        (selection.endBeat - selection.startBeat + 1) / beatsPerSecond;

      console.log(
        `Generating audio with prompt: "${prompt}", duration: ${durationInSeconds}s, tempo: ${bpm}`,
      );

      // Use relative URL which works on any port
      const response = await fetch('/api/text-to-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mureka-6',
          prompt: prompt,
          duration: durationInSeconds,
          tempo: bpm,
          key: 'C Minor',
        }),
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Generation API response:', result);

      if (result.id) {
        startPolling(result.id);
      } else if (result.status === 'completed' && result.audioUrl) {
        // In case of immediate completion
        const proxiedAudioUrl = `/api/audio-proxy?url=${encodeURIComponent(result.audioUrl)}`;

        // Get track color
        const trackColor = getTrack(selection.trackId)?.color || 'gray';

        // Create new audio block
        const newBlock: AudioBlock = {
          id: `block-${Date.now()}`,
          trackId: selection.trackId,
          name: prompt,
          start: selection.startBeat,
          duration: selection.endBeat - selection.startBeat + 1,
          audioUrl: proxiedAudioUrl,
          color: trackColor,
        };

        addAudioBlock(newBlock);
        setPrompt('');
        clearSelection();
        setError('Audio generated successfully!');

        // Clear success message after 3 seconds
        setTimeout(() => setError(null), 3000);
      } else {
        setError('Failed to start audio generation. Please try again.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle click on beat in arrangement view
  const handleArrangementClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle direct clicks on the arrangement view (not its children)
      if (e.target === e.currentTarget) {
        // Focus the arrangement view
        arrangementViewRef.current?.focus();

        // Calculate beat position from mouse coordinates
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedBeat = Math.max(1, Math.floor(x / BEAT_WIDTH) + 1);

        // Only seek to the clicked beat, but don't start playback
        seekToBeat(clickedBeat);
      }
    },
    [seekToBeat, BEAT_WIDTH],
  );

  // Update selection start handler to work with mouse events
  const handleSelectionStart = useCallback(
    (e: React.MouseEvent, trackId: string) => {
      // Calculate beat position from mouse coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const beat = Math.floor(x / BEAT_WIDTH) + 1;

      // Store the initial selection data
      selectionDataRef.current = { trackId, beat };

      // Clear any existing timeout
      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }

      // Use a timeout to differentiate between click and click-and-hold
      selectionTimeoutRef.current = setTimeout(() => {
        // Only start selection if mouse is still down after delay
        if (selectionDataRef.current) {
          startSelection(
            selectionDataRef.current.trackId,
            selectionDataRef.current.beat,
          );
          selectionTimeoutRef.current = null;
        }
      }, 300); // 300ms delay before starting selection

      // Add document-level mouseup listener to clear selection if released early
      const handleMouseUp = () => {
        // If we have a pending selection timeout, clear it
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
          selectionTimeoutRef.current = null;

          // If we haven't started selecting yet, this was a click - only position the playhead
          if (!isSelecting && selectionDataRef.current) {
            // Position playhead at clicked beat without starting playback
            seekToBeat(selectionDataRef.current.beat);
          }
        }

        // Always end selection on mouse up if we were selecting
        if (isSelecting) {
          endSelection();
        }

        // Clean up
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mouseup', handleMouseUp, { once: true });
    },
    [startSelection, isSelecting, endSelection, seekToBeat, BEAT_WIDTH],
  );

  // Update selection update handler to work with mouse events
  const handleSelectionUpdate = useCallback(
    (e: React.MouseEvent) => {
      if (!selection) return;

      // Calculate beat position from mouse coordinates
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // Use the BEAT_WIDTH constant
      const beat = Math.floor(x / BEAT_WIDTH) + 1;

      updateSelection(beat);
    },
    [selection, updateSelection, BEAT_WIDTH],
  );

  // Keyboard shortcut handler for spacebar play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar when arrangement view is focused
      if (e.code === 'Space' && isArrangementFocused) {
        e.preventDefault(); // Prevent page scroll
        handleTogglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlayback, isArrangementFocused]);

  // Effect to initialize Tone.js
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        // Initialize Tone.js context
        await Tone.start();
        console.log('[StudioClient] Tone.js context started');

        // Set initial BPM on Tone.js transport - this will be managed by the useBPM hook afterwards
        Tone.Transport.bpm.value = bpm;
        console.log(`[StudioClient] Initial BPM set to: ${bpm}`);

        setAudioInitialized(true);
      } catch (error) {
        console.error('[StudioClient] Failed to initialize audio:', error);
        setAudioInitialized(false);
      }
    };

    if (!audioInitialized) {
      initializeAudio();
    }

    return () => {
      // Clean up Tone.js context on unmount
      if (audioInitialized) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        console.log('[StudioClient] Tone.js transport stopped and cleaned up');
      }
    };
  }, [bpm, audioInitialized]);

  return (
    <BPMProvider initialBpm={120}>
      <div className="h-screen flex flex-col bg-background text-foreground">
        {/* Header with project name and controls */}
        <header className="border-b border-border/30 bg-background py-2 px-4 flex items-center shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {projectId}
          </h1>

          {/* Transport controls */}
          <div className="flex items-center ml-4">
            <TransportControls
              isPlaying={isPlaying}
              metronomeEnabled={metronomeEnabled}
              currentTime={displayTime}
              currentBPM={bpm}
              currentSignature="4/4"
              onPlayPauseClick={handleTogglePlayback}
              onStopClick={handleStopPlayback}
              onMetronomeClick={toggleMetronome}
              onRewindClick={() => {
                handleStopPlayback();
                // Additional rewind logic can be added here
              }}
              onBPMChange={handleBpmChange}
            />

            {/* Debug indicators for playback values */}
            <div className="flex gap-2 ml-2">
              <div className="px-3 py-1 bg-black/10 rounded text-xs font-mono">
                Time: {displayTime}
              </div>
            </div>
          </div>

          {/* Project settings grouped together */}
          <div className="flex items-center gap-4 ml-4 border-l border-border/30 pl-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Tempo
              </span>
              <BPMSelector />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Key
              </span>
              <button
                type="button"
                className="h-8 px-3 bg-background border border-border rounded-md flex items-center gap-1 text-foreground hover:border-primary/50 transition-colors"
              >
                C Minor <ChevronDown className="h-3 w-3 opacity-70 ml-1" />
              </button>
            </div>
          </div>

          {/* Add mixer controls */}
          <div className="ml-auto flex items-center">
            <MixerControls />
          </div>
        </header>

        {/* Main content area with better spacing and grid */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main timeline area with integrated track labels */}
          <div
            className={`flex-1 flex flex-col overflow-auto relative outline-none ${
              isArrangementFocused ? 'ring-1 ring-primary/20' : ''
            }`}
            ref={arrangementViewRef}
            tabIndex={-1}
            onFocus={() => setIsArrangementFocused(true)}
            onBlur={() => setIsArrangementFocused(false)}
            onClick={handleArrangementClick}
          >
            {/* Beat markers header - enhanced with cleaner styling */}
            <div className="flex border-b border-border/10 sticky top-0 z-10 bg-background/90 backdrop-blur-sm shadow-sm">
              {/* Track label area */}
              <div className="w-[140px] h-10 bg-muted/5 border-r border-border/10 flex items-center px-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Tracks
                </span>
              </div>

              {/* Beat numbers with more professional styling */}
              <div
                className="flex-1 h-10 bg-background/90 flex items-center relative cursor-pointer"
                onClick={(e) => {
                  // Calculate beat position from mouse coordinates
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const clickedBeat = Math.max(
                    1,
                    Math.floor(x / BEAT_WIDTH) + 1,
                  );

                  // Only seek to the clicked beat, don't start playback
                  seekToBeat(clickedBeat);
                }}
              >
                <div className="flex absolute inset-0">
                  {beatMarkers.map((beat) => (
                    <div
                      key={beat.id}
                      className="flex flex-col items-start absolute"
                      style={{
                        left: `${(beat.number - 1) * BEAT_WIDTH}px`,
                        width: `${BEAT_WIDTH}px`,
                        paddingLeft: '4px',
                      }}
                    >
                      <span
                        className={`text-sm tabular-nums font-medium ${
                          beat.number % 4 === 1
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {beat.number}
                      </span>
                      {/* Add subtle tick marks */}
                      <div
                        className={`h-2 w-px mt-0.5 ${
                          beat.number % 4 === 1
                            ? 'bg-foreground/30'
                            : 'bg-muted-foreground/20'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Track lanes with integrated labels */}
            <TrackList
              tracks={tracks}
              audioBlocks={audioBlocks}
              beatMarkers={beatMarkers}
              currentBeat={currentBeat}
              isPlaying={isPlaying}
              selection={selection}
              isSelecting={isSelecting}
              draggedBlock={draggedBlock}
              onTrackDelete={deleteTrack}
              onAddTrack={addTrack}
              onSelectionStart={handleSelectionStart}
              onSelectionUpdate={handleSelectionUpdate}
              onSelectionEnd={endSelection}
              onBlockMouseDown={handleBlockMouseDown}
              onPlayAudioBlock={playAudioBlock}
              onTrackVolumeChange={(trackId, volume) =>
                setSourceVolume(trackId, volume)
              }
              onTrackPanChange={(trackId, pan) => setSourcePan(trackId, pan)}
              onTrackMuteToggle={(trackId) => toggleSourceMute(trackId)}
              onTrackSoloToggle={(trackId) => toggleSourceSolo(trackId)}
              getAudioBlockStyle={getAudioBlockStyle}
              getSelectionStyle={getSelectionStyle}
              getPlayheadStyle={getPlayheadStyle as any}
              isGenerating={isGenerating || currentTaskId !== null}
            />
          </div>
        </div>

        {/* Bottom prompt input - redesigned to match chat components */}
        <div className="border-t border-border/20 bg-background sticky bottom-0 left-0 right-0">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="relative flex items-center">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Send a message..."
                className="w-full min-h-[24px] overflow-hidden resize-none rounded-2xl text-base bg-muted p-4 pb-10 border border-input dark:border-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={1}
                disabled={isGenerating || currentTaskId !== null}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (selection) {
                      generateAudio();
                    } else {
                      setError('Please select a region on a track first');
                    }
                  }
                }}
              />

              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (selection) {
                      generateAudio();
                    } else {
                      setError('Please select a region on a track first');
                    }
                  }}
                  disabled={
                    !prompt.trim() || isGenerating || currentTaskId !== null
                  }
                  className="rounded-full p-1.5 h-fit border dark:border-zinc-600 bg-background hover:bg-muted/80 transition-colors disabled:opacity-50"
                  aria-label="Generate audio"
                >
                  {isGenerating || currentTaskId !== null ? (
                    <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-foreground animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-arrow-up"
                    >
                      <path d="m5 12 7-7 7 7" />
                      <path d="M12 19V5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {!selection && (
            <div className="text-center text-sm text-muted-foreground/60 pb-4">
              Click and drag on a track to select where to place generated audio
            </div>
          )}
        </div>

        {/* Error message - only show for actual errors or success messages, not status updates */}
        {error &&
          !error.includes('in progress') &&
          !error.includes('Please wait') && (
            <div
              className={`absolute bottom-20 right-4 p-2 rounded-md shadow-lg backdrop-blur-sm border ${
                error.includes('success')
                  ? 'bg-green-500/90 text-white border-green-600'
                  : 'bg-destructive/90 text-destructive-foreground border-destructive'
              }`}
            >
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 font-bold hover:text-opacity-80 transition-colors"
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          )}
      </div>
    </BPMProvider>
  );
}
