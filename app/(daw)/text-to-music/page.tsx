'use client';

import React from 'react';
import TextToMusicTest from '../../components/daw/TextToMusicTest';

export default function TextToMusicPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Text to Music Test</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Generate instrumental music from text descriptions using Mureka.ai
      </p>

      <div className="grid gap-6">
        <TextToMusicTest />
      </div>
    </div>
  );
}
