/**
 * MixerControls.tsx
 *
 * UI controls for the audio mixer
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Disc } from 'lucide-react';
import { Slider } from '../../../components/ui/slider';
import { useAudioMixer } from '../hooks/useAudioMixer';

interface MixerControlsProps {
  className?: string;
}

export function MixerControls({ className = '' }: MixerControlsProps) {
  const { masterVolume, setVolume, muted, toggleMute, activeSourceIds } =
    useAudioMixer();

  // Convert 0-1 to percentage for display
  const volumePercentage = Math.round(masterVolume * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground mb-1">Master</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className={`p-1.5 rounded-full transition-colors ${
              muted
                ? 'bg-red-500/10 text-red-500'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground'
            }`}
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5" />
            ) : (
              <Volume2 className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="w-24">
            <Slider
              value={[masterVolume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values: number[]) => {
                setVolume(values[0] / 100);
              }}
              aria-label="Master Volume"
            />
          </div>

          <div className="text-xs w-8 text-muted-foreground">
            {volumePercentage}%
          </div>
        </div>
      </div>

      {activeSourceIds.length > 0 && (
        <div className="ml-4 border-l border-border/30 pl-4 flex items-center gap-2">
          <Disc className="h-3.5 w-3.5 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground">
            {activeSourceIds.length} active source
            {activeSourceIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
