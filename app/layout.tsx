import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CmdKToLaunch } from './components/CmdKToLaunch';

export const metadata: Metadata = {
  title: 'Smart Context Launcher',
  description: 'A command-center landing page for launching full developer workflows.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <CmdKToLaunch />
      </body>
    </html>
  );
}
