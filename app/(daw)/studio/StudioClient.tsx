'use client';

import { useMemo } from 'react';

interface StudioClientProps {
  projectId: string;
}

export default function StudioClient({ projectId }: StudioClientProps) {
  // Generate beat markers without array index keys
  const beatMarkers = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: `beat-${i + 1}`,
        number: i + 1,
      })),
    [],
  );

  // Define track data with unique IDs to avoid index keys
  const tracks = useMemo(
    () => [
      { id: 'drums', name: 'Drums' },
      { id: 'bass', name: 'Bass' },
      { id: 'synth', name: 'Synth' },
      { id: 'piano', name: 'Piano' },
    ],
    [],
  );

  return (
    <div className="container-fluid p-0">
      <div className="bg-secondary p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Project {projectId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-1 bg-secondary-foreground/10 rounded"
          >
            110 BPM
          </button>
          <button
            type="button"
            className="px-4 py-1 bg-secondary-foreground/10 rounded"
          >
            C Minor
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 bg-primary text-primary-foreground rounded-full"
          >
            ▶
          </button>
          <button type="button" className="p-2 bg-muted rounded-full">
            ■
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left sidebar - track controls */}
        <div className="w-48 bg-muted p-2 flex flex-col gap-2">
          {tracks.map((track) => (
            <div key={track.id} className="p-2 bg-card rounded">
              <p className="font-medium">{track.name}</p>
            </div>
          ))}
          <button
            type="button"
            className="mt-auto p-2 bg-primary/10 text-primary rounded"
          >
            + Add Track
          </button>
        </div>

        {/* Main timeline area */}
        <div className="flex-1 bg-background overflow-auto">
          <div className="h-10 bg-muted border-b flex items-center px-2">
            <div className="flex space-x-1">
              {beatMarkers.map((beat) => (
                <div
                  key={beat.id}
                  className="w-16 text-xs flex items-center justify-center"
                >
                  {beat.number}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            {/* Track lanes - these will be replaced with actual audio blocks */}
            {tracks.map((track, index) => (
              <div key={track.id} className="h-24 border-b flex items-center">
                <div className="min-w-[1024px] h-full p-2">
                  {/* Placeholder for audio blocks */}
                  {index === 0 && (
                    <div className="absolute left-16 w-64 h-16 bg-blue-500/20 border border-blue-500 rounded">
                      <div className="p-1 text-xs">Drum Loop</div>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute left-80 w-96 h-16 bg-green-500/20 border border-green-500 rounded">
                      <div className="p-1 text-xs">Bass Line</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom chat input */}
      <div className="h-16 bg-muted border-t p-2 flex items-center">
        <input
          type="text"
          placeholder="Type a prompt to generate audio... (e.g. 'lofi drums')"
          className="w-full px-4 py-2 rounded bg-background"
        />
      </div>
    </div>
  );
}
