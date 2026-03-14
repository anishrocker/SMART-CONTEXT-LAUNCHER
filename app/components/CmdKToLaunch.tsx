'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Listens for Cmd+K (Mac) / Ctrl+K and navigates to the command center page.
 * No overlay — command center is its own page.
 */
export function CmdKToLaunch() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/launch');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return null;
}
