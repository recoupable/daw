// Define types for our DAW application

export interface Track {
  id: string;
  name: string;
  color: string;
}

export interface AudioBlock {
  id: string;
  trackId: string;
  name: string;
  start: number; // Start position in beats
  duration: number; // Duration in beats
  audioUrl?: string;
  color?: string;
}

export interface Selection {
  trackId: string;
  startBeat: number;
  endBeat: number;
}

export interface StudioClientProps {
  projectId: string;
}
