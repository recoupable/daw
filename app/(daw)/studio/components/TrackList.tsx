/**
 * TrackList component for displaying the sequencer grid with tracks and audio blocks
 * Enhanced with our new components for a more professional DAW experience
 */
import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Track, AudioBlock, Selection } from '@/app/types/daw';
import { TrackControls } from './TrackControls';
import { AudioBlock as AudioBlockComponent } from './AudioBlock';

interface TrackListProps {
  tracks: Track[];
  audioBlocks: AudioBlock[];
  beatMarkers: { id: string; number: number }[];
  currentBeat: number;
  isPlaying: boolean;
  selection: Selection | null;
  isSelecting: boolean;
  draggedBlock: string | null;
  onTrackDelete: (trackId: string) => void;
  onAddTrack: () => void;
  onSelectionStart: (e: React.MouseEvent, trackId: string) => void;
  onSelectionUpdate: (e: React.MouseEvent) => void;
  onSelectionEnd: () => void;
  onBlockMouseDown: (e: React.MouseEvent, block: AudioBlock) => void;
  onPlayAudioBlock: (blockId: string) => void;
  onTrackVolumeChange?: (trackId: string, volume: number) => void;
  onTrackPanChange?: (trackId: string, pan: number) => void;
  onTrackMuteToggle?: (trackId: string) => void;
  onTrackSoloToggle?: (trackId: string) => void;
  getAudioBlockStyle: (
    block: AudioBlock,
    beatWidth?: number,
  ) => React.CSSProperties;
  getSelectionStyle: () => React.CSSProperties;
  getPlayheadStyle: (beatWidth?: number) => React.CSSProperties;
  isGenerating: boolean;
}

export function TrackList({
  tracks,
  audioBlocks,
  beatMarkers,
  currentBeat = 1,
  isPlaying = false,
  selection,
  isSelecting,
  draggedBlock,
  onTrackDelete,
  onAddTrack,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd,
  onBlockMouseDown,
  onPlayAudioBlock,
  onTrackVolumeChange = () => {},
  onTrackPanChange = () => {},
  onTrackMuteToggle = () => {},
  onTrackSoloToggle = () => {},
  getAudioBlockStyle,
  getSelectionStyle,
  getPlayheadStyle,
  isGenerating,
}: TrackListProps) {
  // Track which blocks are currently playing
  const [playingBlocks, setPlayingBlocks] = useState<Set<string>>(new Set());

  // Track state for each track (volume, pan, mute, solo)
  const [trackStates, setTrackStates] = useState<
    Record<
      string,
      { volume: number; pan: number; muted: boolean; soloed: boolean }
    >
  >({});

  // Ensure each track has a state
  const getTrackState = (trackId: string) => {
    return (
      trackStates[trackId] || {
        volume: 0.8,
        pan: 0,
        muted: false,
        soloed: false,
      }
    );
  };

  // Handle track controls events
  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...getTrackState(trackId), volume },
    }));
    onTrackVolumeChange(trackId, volume);
  };

  const handleTrackPanChange = (trackId: string, pan: number) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...getTrackState(trackId), pan },
    }));
    onTrackPanChange(trackId, pan);
  };

  const handleTrackMuteToggle = (trackId: string) => {
    const currentState = getTrackState(trackId);
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...currentState, muted: !currentState.muted },
    }));
    onTrackMuteToggle(trackId);
  };

  const handleTrackSoloToggle = (trackId: string) => {
    const currentState = getTrackState(trackId);
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: { ...currentState, soloed: !currentState.soloed },
    }));
    onTrackSoloToggle(trackId);
  };

  // Handle audio block play/pause
  const handlePlayAudioBlock = (blockId: string) => {
    onPlayAudioBlock(blockId);

    // Update playingBlocks state
    setPlayingBlocks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const BEAT_WIDTH = 64; // Width in pixels of each beat

  return (
    <div className="flex-1 flex flex-col">
      {tracks.map((track) => (
        <div key={track.id} className="flex border-b border-border/10">
          {/* Track Controls */}
          <div className="w-[140px] flex-shrink-0 relative">
            <TrackControls
              name={track.name}
              volume={getTrackState(track.id).volume}
              pan={getTrackState(track.id).pan}
              isMuted={getTrackState(track.id).muted}
              isSolo={getTrackState(track.id).soloed}
              onVolumeChange={(volume) =>
                handleTrackVolumeChange(track.id, volume)
              }
              onPanChange={(pan) => handleTrackPanChange(track.id, pan)}
              onMuteToggle={() => handleTrackMuteToggle(track.id)}
              onSoloToggle={() => handleTrackSoloToggle(track.id)}
            />
            {/* Delete Track Button */}
            <button
              onClick={() => onTrackDelete(track.id)}
              className="absolute top-3 right-3 p-1 bg-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors rounded-sm"
              title="Delete Track"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Main track lane with audio blocks */}
          <div
            className="flex-1 h-[180px] relative border-l border-border/10 bg-background/50"
            onMouseDown={(e) => onSelectionStart(e, track.id)}
            onMouseMove={isSelecting ? onSelectionUpdate : undefined}
            onMouseUp={() => {
              if (isSelecting) {
                // End the selection but keep the selection visible for generating audio
                onSelectionEnd();
              }
            }}
          >
            {/* Beat grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {beatMarkers.map((beat) => (
                <div
                  key={beat.id}
                  className={`absolute h-full w-px ${
                    beat.number % 4 === 1 ? 'bg-border' : 'bg-border/30'
                  }`}
                  style={{ left: `${(beat.number - 1) * BEAT_WIDTH}px` }}
                />
              ))}
            </div>

            {/* Audio blocks for this track */}
            {audioBlocks
              .filter((block) => block.trackId === track.id)
              .map((block) => (
                <AudioBlockComponent
                  key={block.id}
                  id={block.id}
                  trackId={block.trackId}
                  name={block.name}
                  start={block.start}
                  duration={block.duration}
                  audioUrl={block.audioUrl ?? ''}
                  isPlaying={playingBlocks.has(block.id)}
                  style={getAudioBlockStyle(block, BEAT_WIDTH)}
                  onMouseDown={(e) => onBlockMouseDown(e, block)}
                  onPlay={() => handlePlayAudioBlock(block.id)}
                  onDelete={() => {
                    const audioBlocksForTrack = audioBlocks.filter(
                      (b) => b.trackId === track.id,
                    );
                    // Only delete track if it's the last block and user confirms
                    if (audioBlocksForTrack.length <= 1) {
                      if (confirm('Delete last block and track?')) {
                        onTrackDelete(track.id);
                      }
                    }
                  }}
                />
              ))}

            {/* Selection highlight */}
            {selection && selection.trackId === track.id && (
              <div
                className="absolute h-full border-2 border-dashed border-primary/50 bg-primary/10 rounded-sm flex items-center justify-center"
                style={getSelectionStyle()}
              >
                {isGenerating && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                    <span className="text-xs font-medium text-primary/90 bg-background/40 px-2 py-1 rounded-sm">
                      Generating audio...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Playhead */}
            {isPlaying && (
              <div
                className="absolute h-full w-px bg-primary z-10 pointer-events-none"
                style={getPlayheadStyle(BEAT_WIDTH)}
              />
            )}
          </div>
        </div>
      ))}

      {/* Add track button */}
      <div className="flex">
        <div className="w-full p-2 bg-muted/5 border-t border-border/30 flex justify-start">
          <button
            type="button"
            onClick={onAddTrack}
            className="px-4 py-1.5 flex items-center justify-center gap-1 text-xs bg-muted/20 rounded-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30"
          >
            <Plus className="h-3.5 w-3.5" /> Add Track
          </button>
        </div>
      </div>

      {selection && (
        <div className="py-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-md text-sm text-muted-foreground">
            {isGenerating ? (
              <>
                <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                <span>
                  Generating audio for beats {selection.startBeat}-
                  {selection.endBeat} on{' '}
                  {tracks.find((t) => t.id === selection.trackId)?.name ||
                    'Unknown Track'}
                </span>
              </>
            ) : (
              <span>
                Selected beats {selection.startBeat}-{selection.endBeat} on{' '}
                {tracks.find((t) => t.id === selection.trackId)?.name ||
                  'Unknown Track'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
