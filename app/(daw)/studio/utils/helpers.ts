/**
 * Studio helper functions
 *
 * This file contains utility functions for the studio components
 * so we don't have to import from outside directories with path issues
 */

import * as Tone from 'tone';

// Generate a unique ID for blocks, tracks, etc.
export const generateId = (): string =>
  `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Proxy audio URLs to avoid CORS issues
export const getProxiedAudioUrl = (url: string): string => {
  // Only proxy external URLs, not local ones
  if (url.startsWith('http')) {
    // Add a timestamp to prevent caching
    return `/api/audio-proxy?url=${encodeURIComponent(url)}&_=${Date.now()}`;
  }
  return url;
};

// Format time display based on current beat and BPM
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

// Color palette for tracks
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

// Common BPM presets for music production
export const BPM_PRESETS = [80, 90, 100, 110, 120, 130, 140, 150, 160];
