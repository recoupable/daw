/**
 * Enhanced TransportControls component
 * Styled to match professional DAW aesthetics like BandLab
 */
import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipBack, Repeat, Timer } from 'lucide-react';

// Custom Metronome icon since lucide-react doesn't have one
const MetronomeIcon = () => (
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
    className="lucide lucide-metronome"
  >
    <path d="M12 20v-8l-4 8v-8" />
    <path d="M8 10a5 5 0 0 1 8 0" />
    <path d="M13 20h-2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2Z" />
  </svg>
);

interface TransportControlsProps {
  isPlaying: boolean;
  metronomeEnabled: boolean;
  currentTime: string;
  currentBPM: number;
  currentSignature: string;
  onPlayPauseClick: () => void;
  onStopClick: () => void;
  onMetronomeClick: () => void;
  onRewindClick?: () => void;
  onBPMChange?: (bpm: number) => void;
}

export function TransportControls({
  isPlaying,
  metronomeEnabled,
  currentTime,
  currentBPM = 120,
  currentSignature = '4/4',
  onPlayPauseClick,
  onStopClick,
  onMetronomeClick,
  onRewindClick,
  onBPMChange,
}: TransportControlsProps) {
  // State for BPM editing
  const [isEditingBPM, setIsEditingBPM] = useState(false);
  const [tempBPM, setTempBPM] = useState(currentBPM.toString());

  // Format time display
  const formattedTime = currentTime || '00:00:00.00';

  // Update tempBPM when currentBPM changes (from parent)
  useEffect(() => {
    setTempBPM(currentBPM.toString());
  }, [currentBPM]);

  // Handle BPM input change
  const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempBPM(e.target.value);
  };

  // Handle BPM input blur
  const handleBPMBlur = () => {
    const newBPM = Number.parseInt(tempBPM, 10);
    if (!Number.isNaN(newBPM) && newBPM > 0 && newBPM <= 999) {
      if (onBPMChange) {
        onBPMChange(newBPM);
      }
    } else {
      // Reset to current BPM if invalid
      setTempBPM(currentBPM.toString());
    }
    setIsEditingBPM(false);
  };

  // Handle BPM input key down
  const handleBPMKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBPMBlur();
    } else if (e.key === 'Escape') {
      setTempBPM(currentBPM.toString());
      setIsEditingBPM(false);
    }
  };

  return (
    <div className="h-10 flex items-center gap-1 bg-muted/5 p-1 rounded-md">
      {/* Transport position display */}
      <div className="bg-background/80 backdrop-blur-sm rounded border border-border/30 px-2 py-1 flex items-center gap-1 text-sm font-mono mr-1 tabular-nums">
        <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground">{formattedTime}</span>
      </div>

      {/* BPM and time signature */}
      <div className="flex items-center">
        {isEditingBPM ? (
          <input
            type="text"
            value={tempBPM}
            onChange={handleBPMChange}
            onBlur={handleBPMBlur}
            onKeyDown={handleBPMKeyDown}
            className="w-12 h-8 px-2 bg-background border border-primary text-center font-semibold rounded focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            aria-label="BPM"
            placeholder="BPM"
          />
        ) : (
          <button
            className="px-2 h-8 flex items-center gap-1 text-sm font-semibold bg-background/80 backdrop-blur-sm rounded border border-border/30 hover:border-primary/50 transition-colors"
            onClick={() => setIsEditingBPM(true)}
            title="Click to change BPM"
          >
            {currentBPM}
            <span className="text-xs text-muted-foreground">bpm</span>
          </button>
        )}

        <div className="h-8 px-2 ml-1 flex items-center text-sm font-semibold bg-background/80 backdrop-blur-sm rounded border border-border/30">
          {currentSignature}
        </div>
      </div>

      {/* Transport buttons */}
      <div className="h-8 mx-1 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded border border-border/30 px-1">
        {/* Return to start */}
        <button
          type="button"
          onClick={onRewindClick}
          disabled={!onRewindClick}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Return to Start"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={onPlayPauseClick}
          className={`p-1.5 rounded-sm transition-colors ${isPlaying ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/20'}`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={onStopClick}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted/20 transition-colors"
          title="Stop"
        >
          <Square className="h-3.5 w-3.5" />
        </button>

        {/* Loop toggle button*/}
        <button
          type="button"
          onClick={() => {}}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-sm hover:bg-muted/20 transition-colors"
          title="Toggle Loop"
        >
          <Repeat className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Metronome toggle */}
      <button
        type="button"
        onClick={onMetronomeClick}
        className={`h-8 p-1.5 rounded-sm ${metronomeEnabled ? 'bg-primary text-primary-foreground' : 'bg-background/80 text-muted-foreground hover:text-foreground'} backdrop-blur-sm border border-border/30 transition-colors`}
        title={metronomeEnabled ? 'Disable Metronome' : 'Enable Metronome'}
      >
        <MetronomeIcon />
      </button>
    </div>
  );
}
