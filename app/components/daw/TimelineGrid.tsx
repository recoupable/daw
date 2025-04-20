'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

// Constants for grid layout
const PIXELS_PER_BEAT = 60; // Width of one beat in pixels
const TRACK_HEIGHT = 80; // Height of each track in pixels
const DEFAULT_BEATS = 16; // Default number of beats to display
const DEFAULT_TRACKS = 4; // Default number of tracks

// Interfaces for component props and track data
interface TimelineGridProps {
  className?: string;
}

interface Track {
  id: string;
  name: string;
  color: string;
}

export function TimelineGrid({ className }: TimelineGridProps) {
  // State for managing tracks and the timeline
  const [tracks, setTracks] = useState<Track[]>(() =>
    Array(DEFAULT_TRACKS)
      .fill(0)
      .map((_, i) => ({
        id: `track-${i}-${Date.now()}-${Math.random()}`, // Unique ID for each track
        name: `Track ${i + 1}`,
        color: getRandomPastelColor(),
      })),
  );
  const [beatsToShow, setBeatsToShow] = useState(DEFAULT_BEATS);
  const [zoom, setZoom] = useState(1); // Zoom level

  // References for grid elements
  const gridRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksAreaRef = useRef<HTMLDivElement>(null);

  // Effect to ensure the tracks area and timeline are scrolled horizontally together
  useEffect(() => {
    const tracksArea = tracksAreaRef.current;
    const timeline = timelineRef.current;

    if (!tracksArea || !timeline) return;

    const handleTracksScroll = () => {
      if (timeline) {
        timeline.scrollLeft = tracksArea.scrollLeft;
      }
    };

    tracksArea.addEventListener('scroll', handleTracksScroll);

    return () => {
      tracksArea.removeEventListener('scroll', handleTracksScroll);
    };
  }, []);

  // Calculate the grid width based on number of beats and zoom level
  const gridWidthPx = beatsToShow * PIXELS_PER_BEAT * zoom;

  // Add a new track
  const addTrack = () => {
    setTracks([
      ...tracks,
      {
        id: `track-${tracks.length}-${Date.now()}-${Math.random()}`, // Unique ID
        name: `Track ${tracks.length + 1}`,
        color: getRandomPastelColor(),
      },
    ]);
  };

  // Remove the last track if there's more than one
  const removeTrack = () => {
    if (tracks.length > 1) {
      setTracks(tracks.slice(0, -1));
    }
  };

  // Zoom in (increase the zoom level)
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  // Zoom out (decrease the zoom level)
  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  // Generate beat markers with unique IDs
  const beatMarkers = Array.from({ length: beatsToShow + 1 }).map((_, i) => ({
    id: `beat-marker-${i}-${Date.now()}`,
    position: i,
  }));

  // Generate grid lines with unique IDs
  const gridLines = Array.from({ length: beatsToShow + 1 }).map((_, i) => ({
    id: `grid-line-${i}-${Date.now()}`,
    position: i,
  }));

  // Render the component
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Timeline Grid</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={zoomOut}>
              Zoom Out
            </Button>
            <Button size="sm" variant="outline" onClick={zoomIn}>
              Zoom In
            </Button>
            <Button size="sm" variant="outline" onClick={removeTrack}>
              Remove Track
            </Button>
            <Button size="sm" variant="outline" onClick={addTrack}>
              Add Track
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={gridRef} className="border rounded-md overflow-hidden">
          {/* Timeline ruler with beat markers */}
          <div
            ref={timelineRef}
            className="h-8 bg-muted border-b overflow-x-hidden relative"
          >
            <div
              className="absolute top-0 left-0 h-full"
              style={{ width: `${gridWidthPx}px` }}
            >
              {beatMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="absolute top-0 h-full border-l border-border flex items-end justify-center text-xs text-muted-foreground pb-1"
                  style={{
                    left: `${marker.position * PIXELS_PER_BEAT * zoom}px`,
                    width: PIXELS_PER_BEAT * zoom,
                  }}
                >
                  {marker.position}
                </div>
              ))}
            </div>
          </div>

          {/* Tracks area with vertical track lanes */}
          <div
            ref={tracksAreaRef}
            className="overflow-x-auto"
            style={{ height: `${tracks.length * TRACK_HEIGHT + 16}px` }}
          >
            <div
              className="relative"
              style={{ width: `${gridWidthPx}px`, height: '100%' }}
            >
              {/* Vertical grid lines */}
              {gridLines.map((line) => (
                <div
                  key={line.id}
                  className="absolute top-0 h-full border-l border-border"
                  style={{
                    left: `${line.position * PIXELS_PER_BEAT * zoom}px`,
                  }}
                />
              ))}

              {/* Track lanes */}
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="absolute left-0 right-0 border-b border-border flex items-center px-4"
                  style={{
                    top: `${index * TRACK_HEIGHT}px`,
                    height: `${TRACK_HEIGHT}px`,
                  }}
                >
                  {/* Track label */}
                  <div
                    className="w-24 h-12 rounded flex items-center justify-center text-sm font-medium"
                    style={{ backgroundColor: track.color }}
                  >
                    {track.name}
                  </div>

                  {/* Track content area - will hold audio blocks later */}
                  <div className="flex-1 h-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to generate random pastel colors for tracks
function getRandomPastelColor() {
  // Generate a pastel color by using higher base values
  const r = Math.floor(Math.random() * 55 + 200);
  const g = Math.floor(Math.random() * 55 + 200);
  const b = Math.floor(Math.random() * 55 + 200);
  return `rgb(${r}, ${g}, ${b})`;
}

export default TimelineGrid;
