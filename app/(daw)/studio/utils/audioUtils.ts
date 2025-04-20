import * as Tone from 'tone';

/**
 * Initializes the Web Audio context for the browser
 * This needs to be called on user interaction due to browser autoplay policies
 */
export const initializeAudioContext = async (): Promise<boolean> => {
  try {
    // If the context is not running, start it
    if (Tone.context.state !== 'running') {
      console.log('Starting Tone.js audio context...');
      await Tone.start();
      console.log('Tone.js audio context started.');
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
    return false;
  }
};

/**
 * Converts beats to seconds based on the current tempo
 * @param beats Number of beats
 * @param bpm Tempo in beats per minute
 * @returns Duration in seconds
 */
export const beatsToSeconds = (beats: number, bpm: number): number => {
  const secondsPerBeat = 60 / bpm;
  return beats * secondsPerBeat;
};

/**
 * Converts seconds to beats based on the current tempo
 * @param seconds Duration in seconds
 * @param bpm Tempo in beats per minute
 * @returns Number of beats
 */
export const secondsToBeats = (seconds: number, bpm: number): number => {
  const beatsPerSecond = bpm / 60;
  return seconds * beatsPerSecond;
};

/**
 * Generate a unique ID for tracks, blocks, etc.
 */
export const generateId = (): string => {
  return `id-${Math.random().toString(36).slice(2, 11)}`;
};

// Default colors for tracks
export const TRACK_COLORS = [
  'blue',
  'purple',
  'pink',
  'orange',
  'green',
  'indigo',
  'teal',
  'amber',
  'cyan',
  'lime',
];
