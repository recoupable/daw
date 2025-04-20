'use client';

export default function StudioPage({
  params,
}: { params: { projectId: string } }) {
  return (
    <div className="container-fluid p-0">
      <div className="bg-secondary p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Project {params.projectId}</h1>
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
          <div className="p-2 bg-card rounded">
            <p className="font-medium">Drums</p>
          </div>
          <div className="p-2 bg-card rounded">
            <p className="font-medium">Bass</p>
          </div>
          <div className="p-2 bg-card rounded">
            <p className="font-medium">Synth</p>
          </div>
          <div className="p-2 bg-card rounded">
            <p className="font-medium">Piano</p>
          </div>
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
              {[...Array(32)].map((_, i) => (
                <div
                  key={`beat-${i}`}
                  className="w-16 text-xs flex items-center justify-center"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            {/* Track lanes - these will be replaced with actual audio blocks */}
            {['Drums', 'Bass', 'Synth', 'Piano'].map((track, i) => (
              <div key={track} className="h-24 border-b flex items-center">
                <div className="min-w-[1024px] h-full p-2">
                  {/* Placeholder for audio blocks */}
                  {i === 0 && (
                    <div className="absolute left-16 w-64 h-16 bg-blue-500/20 border border-blue-500 rounded">
                      <div className="p-1 text-xs">Drum Loop</div>
                    </div>
                  )}
                  {i === 1 && (
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
