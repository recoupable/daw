'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic imports with no SSR to avoid hydration issues with browser-only components
const WaveformTest = dynamic(
  () => import('../../../app/components/daw/WaveformTest'),
  { ssr: false },
);
const TimelineGrid = dynamic(
  () => import('../../../app/components/daw/TimelineGrid'),
  { ssr: false },
);
const AudioGenTest = dynamic(
  () => import('../../../app/components/daw/AudioGenTest'),
  { ssr: false },
);

export default function StudioPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">DAW Studio</h1>
      <p className="text-lg text-muted-foreground">
        Create and arrange music with our AI-powered digital audio workstation.
      </p>

      <div className="grid grid-cols-1 gap-8">
        {/* Timeline Grid Component */}
        <TimelineGrid />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Waveform Visualization Component */}
          <WaveformTest />

          {/* Audio Generation Component */}
          <AudioGenTest />

          {/* Placeholder for future components */}
          <div className="border rounded-lg p-6 flex items-center justify-center bg-muted/30 h-[200px]">
            <p className="text-muted-foreground text-center">
              Additional controls and effects will be available here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
