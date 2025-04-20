'use client';

import StudioClient from './StudioClient';

export default function StudioPage() {
  // Use a fixed demo project ID for simplicity
  const projectId = 'demo';

  return <StudioClient projectId={projectId} />;
}
