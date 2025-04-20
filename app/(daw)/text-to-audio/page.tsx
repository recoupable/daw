'use client';

import React from 'react';
import TextToAudioTest from '../../components/daw/TextToAudioTest';

export default function TextToAudioPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Text to Audio Test</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Test the Mureka.ai text-to-speech API by converting text to spoken audio
      </p>

      <div className="grid gap-6">
        <TextToAudioTest />
      </div>
    </div>
  );
}
