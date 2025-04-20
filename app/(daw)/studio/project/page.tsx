'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectPage() {
  const router = useRouter();

  // Redirect to the demo project to avoid the dynamic route complexity
  useEffect(() => {
    router.push('/studio/demo');
  }, [router]);

  return <div>Redirecting to demo project...</div>;
}
