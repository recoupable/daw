'use client';

import dynamic from 'next/dynamic';

// Dynamically import the InputDetector with no SSR
const InputDetector = dynamic(() => import('./InputDetector'), { ssr: false });

export function ClientComponents() {
  return <InputDetector />;
}
