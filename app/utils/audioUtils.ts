import * as Tone from 'tone';

/**
 * Audio utility functions for DAW application
 */

/**
 * Generate a unique ID for audio components
 */
export const generateId = (): string => {
  return `id-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Color palette for tracks - using subtle, professional colors
 */
export const TRACK_COLORS = [
  'slate',
  'zinc',
  'stone',
  'gray',
  'neutral',
  'blue',
  'sky',
  'indigo',
];

/**
 * Common BPM presets for music production
 */
export const BPM_PRESETS = [80, 90, 100, 110, 120, 130, 140, 150, 160];

/**
 * Convert seconds to a formatted time string (MM:SS.ms)
 */
export const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * Ensures URLs for external audio sources are proxied to avoid CORS issues
 */
export const getProxiedAudioUrl = (url: string): string => {
  // Only proxy external URLs, not local ones
  if (url.startsWith('http')) {
    return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
};

/**
 * Calculates element position and width based on beat positions and beat width
 */
export const getPositionFromBeats = (
  startBeat: number,
  duration: number,
  beatWidth: number,
) => {
  return {
    left: `${(startBeat - 1) * beatWidth}px`,
    width: `${duration * beatWidth}px`,
  };
};

/**
 * Safely initialize the audio context
 */
export const initializeAudioContext = async (): Promise<void> => {
  // Ensure Tone.js is started
  if (Tone.context.state !== 'running') {
    await Tone.start();
    console.log('Tone.js audio context started');
  }
};

/**
 * Format time display based on current beat and BPM
 */
export const formatTimeDisplay = (beat: number, bpm: number): string => {
  const secondsPerBeat = 60 / bpm;
  const totalSeconds = (beat - 1) * secondsPerBeat;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * 30); // 30 frames per second

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${frames
    .toString()
    .padStart(2, '0')}`;
};
