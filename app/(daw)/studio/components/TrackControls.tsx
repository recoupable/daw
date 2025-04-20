/**
 * TrackControls component for individual track settings
 * Provides volume, pan, mute and solo controls
 */
import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Users,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Slider } from '../../../../components/ui/slider';

// Simple utility for combining class names
const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

interface TrackControlsProps {
  name: string;
  volume: number;
  pan: number;
  isMuted: boolean;
  isSolo: boolean;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
}

export function TrackControls({
  name,
  volume,
  pan,
  isMuted,
  isSolo,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
}: TrackControlsProps) {
  // State to track whether volume and pan controls are visible
  const [showControls, setShowControls] = useState(true);

  // Calculate dB value for display (-Infinity to +6 dB range)
  const volumeDb =
    volume <= 0 ? '-∞' : `${Math.round(Math.log10(volume) * 20 * 10) / 10} dB`;

  // Format pan value with L/C/R indicator
  const panText =
    pan === 0
      ? 'C'
      : pan < 0
        ? `${Math.abs(Math.round(pan * 100))}L`
        : `${Math.round(pan * 100)}R`;

  // Calculate volume percentage for colored indicator
  const volumePercent = Math.min(volume * 100, 100);

  // Toggle control visibility
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="flex flex-col p-2 bg-background/90 backdrop-blur-sm border-r border-r-border h-full w-[140px]">
      {/* Track Name - enhanced with slightly better typography */}
      <div className="mb-2">
        <div className="text-xs text-muted-foreground mb-0.5">Track</div>
        <div className="text-sm font-medium truncate text-foreground tracking-tight">
          {name}
        </div>
      </div>

      {/* Mute & Solo Buttons with Controls Toggle - enhanced styling */}
      <div className="flex gap-1.5 mb-3">
        <button
          type="button"
          onClick={onMuteToggle}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-sm text-xs font-medium transition-all',
            isMuted
              ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-sm'
              : 'bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground',
          )}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </button>

        <button
          type="button"
          onClick={onSoloToggle}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-sm text-xs font-medium transition-all',
            isSolo
              ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-sm'
              : 'bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground',
          )}
          title={isSolo ? 'Unsolo' : 'Solo'}
        >
          {isSolo ? (
            <User className="h-3 w-3" />
          ) : (
            <Users className="h-3 w-3" />
          )}
        </button>

        {/* Controls Toggle Button */}
        <button
          type="button"
          onClick={toggleControls}
          className="flex items-center justify-center h-6 ml-auto rounded-sm text-xs font-medium bg-muted/50 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
          title={showControls ? 'Hide Controls' : 'Show Controls'}
        >
          {showControls ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Conditional rendering of volume and pan controls */}
      {showControls && (
        <>
          {/* Volume Control - enhanced with colored indicator and better visual hierarchy */}
          <div className="mb-3">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Volume</span>
              <span
                className={cn(
                  'font-mono tabular-nums text-xs px-1 rounded',
                  volume > 0.9
                    ? 'text-orange-500'
                    : volume > 0.7
                      ? 'text-amber-500'
                      : volume > 0.01
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                )}
              >
                {volumeDb}
              </span>
            </div>
            <div className="relative h-5">
              {/* Background track */}
              <div className="absolute inset-0 h-1.5 top-1/2 -translate-y-1/2 rounded-full bg-muted/30" />
              {/* Colored fill based on volume level */}
              <div
                className={cn(
                  'absolute h-1.5 top-1/2 -translate-y-1/2 left-0 rounded-full',
                  'bg-gradient-to-r',
                  volume > 0.9
                    ? 'from-amber-500 to-orange-500'
                    : volume > 0.7
                      ? 'from-primary/70 to-amber-500'
                      : 'from-primary/60 to-primary',
                )}
                style={{ width: `${volumePercent}%` }}
              />
              {/* Slider control */}
              <Slider
                value={[volume * 100]}
                min={0}
                max={125} // Allows slight boost up to +6dB
                step={1}
                onValueChange={(values: number[]) =>
                  onVolumeChange(values[0] / 100)
                }
                className="h-5"
              />
            </div>
          </div>

          {/* Pan Control - with enhanced visualization */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-muted-foreground">Pan</span>
              <span
                className={cn(
                  'font-mono tabular-nums text-xs px-1 rounded',
                  pan === 0
                    ? 'text-muted-foreground'
                    : Math.abs(pan) > 0.7
                      ? 'text-sky-500'
                      : 'text-foreground',
                )}
              >
                {panText}
              </span>
            </div>
            <div className="relative h-4 mb-1">
              {/* Center line */}
              <div className="absolute inset-0 h-1.5 top-1/2 -translate-y-1/2 rounded-full bg-muted/30" />
              {/* Pan indicator - changes sides based on pan value */}
              {pan !== 0 && (
                <div
                  className="absolute h-1.5 top-1/2 -translate-y-1/2 bg-sky-500/70 rounded-full"
                  style={{
                    left: pan < 0 ? `${50 + pan * 50}%` : '50%',
                    right: pan > 0 ? `${50 - pan * 50}%` : '50%',
                  }}
                />
              )}
              {/* Center dot */}
              <div className="absolute h-3 w-1 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-muted/50 rounded-full" />
              <Slider
                value={[pan * 50 + 50]} // Convert -1 to 1 range to 0 to 100 range
                min={0}
                max={100}
                step={1}
                onValueChange={(values: number[]) =>
                  onPanChange((values[0] - 50) / 50)
                }
                className="h-5"
              />
            </div>
            {/* Pan position indicator */}
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>L</span>
              <span>C</span>
              <span>R</span>
            </div>
          </div>
        </>
      )}

      {/* When controls are hidden, show compact volume display */}
      {!showControls && (
        <div className="text-xs flex items-center text-muted-foreground">
          <span className="mr-1">Vol:</span>
          <span
            className={cn(
              'font-mono tabular-nums',
              volume > 0.9
                ? 'text-orange-500'
                : volume > 0.7
                  ? 'text-amber-500'
                  : volume > 0.01
                    ? 'text-foreground'
                    : 'text-muted-foreground',
            )}
          >
            {volumeDb}
          </span>
        </div>
      )}
    </div>
  );
}
