import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { useAudioMixer } from './useAudioMixer';
import { initializeAudioContext, beatsToSeconds } from '../utils/audioUtils';
import type { AudioBlock } from '@/app/types/daw';

interface UseAudioBlockManagerProps {
  bpm: number;
}

export function useAudioBlockManager({ bpm }: UseAudioBlockManagerProps) {
  const [audioBlocks, setAudioBlocks] = useState<AudioBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartBeat, setDragStartBeat] = useState<number>(0);

  // Use our new audio mixer
  const { addSource, removeSource, playAudioFile, stopAll, activeSourceIds } =
    useAudioMixer();

  // Keep a reference to playing blocks
  const playingBlocksRef = useRef<Set<string>>(new Set());

  // Refs for audio player nodes
  const audioPlayersRef = useRef<Map<string, Tone.Player>>(new Map());

  // Ensure audio context is ready
  const ensureAudioContext = useCallback(async () => {
    return await initializeAudioContext();
  }, []);

  // Stop a playing block
  const stopAudioBlock = useCallback(
    (blockId: string) => {
      // Remove from the mixer
      removeSource(blockId);

      // Also remove from our internal tracking
      playingBlocksRef.current.delete(blockId);

      console.log(`Stopped block ${blockId}`);
    },
    [removeSource],
  );

  // Add a new audio block
  const addAudioBlock = useCallback((block: AudioBlock) => {
    setAudioBlocks((prev) => [...prev, block]);

    // If the block has audio, preload it
    if (block.audioUrl) {
      preloadAudioBlock(block);
    }

    return block;
  }, []);

  // Preload audio for a block
  const preloadAudioBlock = useCallback((block: AudioBlock) => {
    if (!block.audioUrl || audioPlayersRef.current.has(block.id)) return;

    try {
      console.log(`Loading audio for block ${block.id}: ${block.audioUrl}`);

      // Create a player but don't connect it to destination yet
      const player = new Tone.Player({
        url: block.audioUrl,
        loop: false,
        fadeIn: 0.01, // Small fade in to prevent clicks
        fadeOut: 0.01, // Small fade out to prevent clicks
        onload: () =>
          console.log(`Audio loaded successfully for block ${block.id}`),
        onerror: (e) =>
          console.error(`Error loading audio for block ${block.id}:`, e),
      });

      audioPlayersRef.current.set(block.id, player);
    } catch (err) {
      console.error(`Error creating player for block ${block.id}:`, err);
    }
  }, []);

  // Remove audio block
  const removeAudioBlock = useCallback(
    (blockId: string) => {
      // First stop any playback
      stopAudioBlock(blockId);

      // Remove from preloaded players
      const player = audioPlayersRef.current.get(blockId);
      if (player) {
        player.dispose();
        audioPlayersRef.current.delete(blockId);
      }

      // Remove from state
      setAudioBlocks((prev) => prev.filter((block) => block.id !== blockId));
    },
    [stopAudioBlock],
  );

  // Remove blocks for a specific track
  const removeTrackBlocks = useCallback(
    (trackId: string) => {
      // Get blocks for this track
      const blocksToRemove = audioBlocks.filter(
        (block) => block.trackId === trackId,
      );

      // Remove each block and its player
      blocksToRemove.forEach((block) => {
        removeAudioBlock(block.id);
      });
    },
    [audioBlocks, removeAudioBlock],
  );

  // Update a block's position or properties
  const updateAudioBlock = useCallback(
    (blockId: string, updates: Partial<AudioBlock>) => {
      setAudioBlocks((prev) =>
        prev.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block,
        ),
      );

      // If the audioUrl is updated, we need to reload the player
      if (updates.audioUrl) {
        const player = audioPlayersRef.current.get(blockId);
        if (player) {
          player.dispose();
          audioPlayersRef.current.delete(blockId);
        }

        const updatedBlock = audioBlocks.find((b) => b.id === blockId);
        if (updatedBlock) {
          preloadAudioBlock({ ...updatedBlock, ...updates });
        }
      }
    },
    [audioBlocks, preloadAudioBlock],
  );

  // Get blocks for a specific track
  const getTrackBlocks = useCallback(
    (trackId: string) => {
      return audioBlocks.filter((block) => block.trackId === trackId);
    },
    [audioBlocks],
  );

  // Calculate block style
  const getAudioBlockStyle = useCallback(
    (block: AudioBlock, beatWidth = 64) => {
      return {
        left: `${(block.start - 1) * beatWidth}px`,
        width: `${block.duration * beatWidth}px`,
      };
    },
    [],
  );

  // Handle block mouse down (for dragging)
  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, block: AudioBlock) => {
      // Prevent selection when dragging blocks
      e.stopPropagation();

      // Start drag operation
      setDraggedBlock(block.id);
      setDragStartX(e.clientX);
      setDragStartBeat(block.start);

      console.log(
        `Starting drag of block ${block.id} from beat ${block.start}`,
      );
    },
    [],
  );

  // Handle mouse move (for dragging)
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggedBlock) return;

      // Find the block being dragged
      const block = audioBlocks.find((b) => b.id === draggedBlock);
      if (!block) return;

      // Calculate new position based on mouse movement
      const deltaX = e.clientX - dragStartX;
      const deltaBeats = Math.round(deltaX / 64); // Convert pixels to beats (64px per beat)
      const newStart = Math.max(1, dragStartBeat + deltaBeats); // Ensure we don't go before beat 1

      // Update the block position
      updateAudioBlock(draggedBlock, { start: newStart });
    },
    [draggedBlock, dragStartX, dragStartBeat, audioBlocks, updateAudioBlock],
  );

  // Handle mouse up (end dragging)
  const handleMouseUp = useCallback(() => {
    // End drag operation
    if (draggedBlock) {
      console.log(`Finished dragging block ${draggedBlock}`);
      setDraggedBlock(null);
    }
  }, [draggedBlock]);

  // Add document-level event listeners for dragging
  useEffect(() => {
    // Only add listeners if we're dragging
    if (draggedBlock) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedBlock, handleMouseMove, handleMouseUp]);

  // Play an audio block
  const playAudioBlock = useCallback(
    async (blockId: string) => {
      // First ensure audio context is ready
      const contextReady = await ensureAudioContext();
      if (!contextReady) {
        console.error('Cannot play audio - audio context not ready');
        return;
      }

      // Find the block and its preloaded player
      const block = audioBlocks.find((b) => b.id === blockId);
      const player = audioPlayersRef.current.get(blockId);

      if (!block) {
        console.error(`Cannot find block with ID ${blockId}`);
        return;
      }

      console.log(`🔊 PLAYING BLOCK: ${blockId} (${block.name})`);

      // Check if this block is already playing
      if (playingBlocksRef.current.has(blockId)) {
        console.log(`Block ${blockId} is already playing`);
        return;
      }

      // First try to use the preloaded Tone.js player
      if (player?.loaded) {
        try {
          // Add to the mixer with the block's color as an identifier
          addSource(blockId, player, {
            fadeIn: 0.01,
            fadeOut: 0.01,
            gain: 0.8,
          });

          // Start playback
          player.start();

          // Track that this block is playing
          playingBlocksRef.current.add(blockId);

          console.log(`Block ${blockId} started playing via Tone.Player`);
        } catch (err) {
          console.error(`Error playing block ${blockId}:`, err);
          // Fall through to direct audio playback if player fails
        }
      } else if (block.audioUrl) {
        // Player not loaded, try direct audio playback
        try {
          // Play the audio directly through the mixer
          await playAudioFile(blockId, block.audioUrl, {
            fadeIn: 0.01,
            fadeOut: 0.01,
            gain: 0.8,
          });

          // Track that this block is playing
          playingBlocksRef.current.add(blockId);

          console.log(`Block ${blockId} playing via direct audio playback`);
        } catch (err) {
          console.error(`Failed to play block ${blockId}:`, err);
        }
      } else {
        console.error(`No audio URL for block ${blockId}`);
      }
    },
    [audioBlocks, ensureAudioContext, addSource, playAudioFile],
  );

  // Check which blocks should play based on the current beat
  const checkBlocksForPlayback = useCallback(
    (currentBeat: number, prevBeat: number) => {
      // FIRST: Handle stopping - always do this first to prevent feedback
      // Get all currently playing blocks
      const currentlyPlaying = Array.from(playingBlocksRef.current);

      // For each block that's playing, check if it should still be playing
      for (const blockId of currentlyPlaying) {
        const block = audioBlocks.find((b) => b.id === blockId);
        if (!block) {
          // Block no longer exists, stop it
          stopAudioBlock(blockId);
          continue;
        }

        // Calculate block boundaries
        const blockStart = block.start;
        const blockEnd = block.start + block.duration;

        // If playhead is outside this block's range, stop it immediately
        if (currentBeat < blockStart || currentBeat >= blockEnd) {
          console.log(
            `🛑 Stopping block ${blockId} - playhead (${currentBeat.toFixed(2)}) outside range (${blockStart}-${blockEnd})`,
          );
          stopAudioBlock(blockId);
        }
      }

      // SECOND: Handle starting - check each block that should be playing
      // This allows multiple blocks to play simultaneously
      for (const block of audioBlocks) {
        const blockStart = block.start;
        const blockEnd = block.start + block.duration;

        // Check if playhead is inside this block and it's not already playing
        if (
          currentBeat >= blockStart &&
          currentBeat < blockEnd &&
          !playingBlocksRef.current.has(block.id)
        ) {
          // Check if we just entered the block
          const justEntered =
            prevBeat < blockStart && currentBeat >= blockStart;

          if (justEntered) {
            console.log(
              `🎵 Playhead just entered block ${block.id} at beat ${currentBeat.toFixed(2)}`,
            );
          } else {
            console.log(
              `🎵 Playhead is inside block ${block.id} at beat ${currentBeat.toFixed(2)}`,
            );
          }

          // Play the block
          playAudioBlock(block.id);
        }
      }
    },
    [audioBlocks, playAudioBlock, stopAudioBlock],
  );

  // Ensure Tone.js Transport is properly cleaned up when component unmounts
  useEffect(() => {
    // Set up Tone.js
    const setupTone = async () => {
      await ensureAudioContext();
    };

    setupTone();

    return () => {
      // Stop all audio
      stopAll();

      // Dispose all preloaded players
      audioPlayersRef.current.forEach((player) => {
        try {
          player.dispose();
        } catch (error) {
          console.error('Error disposing player:', error);
        }
      });
      audioPlayersRef.current.clear();

      // Clear Transport schedule
      Tone.Transport.cancel();

      console.log('Audio resources cleaned up');
    };
  }, [ensureAudioContext, stopAll]);

  return {
    audioBlocks,
    draggedBlock,
    playingBlocks: playingBlocksRef.current,
    addAudioBlock,
    removeAudioBlock,
    removeTrackBlocks,
    updateAudioBlock,
    getTrackBlocks,
    getAudioBlockStyle,
    handleBlockMouseDown,
    playAudioBlock,
    stopAudioBlock,
    checkBlocksForPlayback,
  };
}
