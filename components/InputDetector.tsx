'use client';

import { useEffect } from 'react';

export default function InputDetector() {
  useEffect(() => {
    // Function to detect and set input type
    const detectInputType = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      if (e.type.startsWith('mouse')) {
        document.body.setAttribute('data-input-type', 'mouse');
      } else if (e.type.startsWith('touch')) {
        document.body.setAttribute('data-input-type', 'touch');
      } else if (e.type.startsWith('key')) {
        document.body.setAttribute('data-input-type', 'keyboard');
      }
    };

    // Add event listeners
    window.addEventListener('mousemove', detectInputType, { passive: true });
    window.addEventListener('touchstart', detectInputType, { passive: true });
    window.addEventListener('keydown', detectInputType, { passive: true });

    return () => {
      // Clean up event listeners
      window.removeEventListener('mousemove', detectInputType);
      window.removeEventListener('touchstart', detectInputType);
      window.removeEventListener('keydown', detectInputType);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
