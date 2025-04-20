'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import client components with no SSR
const AudioTest = dynamic(() => import('../components/daw/AudioTest'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">Loading audio component...</div>
  ),
});

const WaveformTest = dynamic(() => import('../components/daw/WaveformTest'), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">Loading waveform component...</div>
  ),
});

export default function DAWPage() {
  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold mb-6">Generative AI DAW</h1>
      <p className="text-lg mb-8">
        Create music with AI-powered tools and arrange tracks in your browser.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Audio Playback Test</h2>
          <Suspense
            fallback={
              <div className="p-8 text-center">Loading audio component...</div>
            }
          >
            <AudioTest />
          </Suspense>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Waveform Visualization Test
          </h2>
          <Suspense
            fallback={
              <div className="p-8 text-center">
                Loading waveform component...
              </div>
            }
          >
            <WaveformTest />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
