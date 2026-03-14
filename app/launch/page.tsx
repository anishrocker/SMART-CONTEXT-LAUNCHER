'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { launchFlows } from '@/app/lib/commands';

export default function LaunchPage() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [launched, setLaunched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = launchFlows.filter(
    (flow) =>
      flow.command.toLowerCase().includes(query.toLowerCase().trim()) ||
      flow.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  const launch = useCallback((flow: (typeof launchFlows)[0]) => {
    flow.urls.forEach(({ url }) => window.open(url, '_blank', 'noopener,noreferrer'));
    setLaunched(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, matches.length));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + matches.length) % Math.max(1, matches.length));
      }
      if (e.key === 'Enter' && matches[selectedIndex]) {
        e.preventDefault();
        launch(matches[selectedIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [matches, selectedIndex, launch]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <main className="flex min-h-screen flex-col bg-[#202124]">
      {/* Minimal top bar */}
      <header className="flex justify-end px-6 py-4">
        <Link
          href="/"
          className="text-sm text-[#9aa0a6] hover:text-white hover:underline"
        >
          Home
        </Link>
      </header>

      {/* Centered: logo + search only */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-normal tracking-tight text-white sm:text-5xl">
          Smart Context Launcher
        </h1>

        <div className="mt-8 w-full max-w-xl">
          <div className="flex items-center rounded-full border border-[#5f6368] bg-[#303134] px-5 py-3 transition hover:border-[#5f6368] hover:bg-[#303134] focus-within:border-[#5f6368] focus-within:shadow-[0_1px_6px_rgba(32,33,36,0.28)]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands..."
              className="min-w-0 flex-1 bg-transparent text-lg text-white placeholder:text-[#9aa0a6] focus:outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Search commands"
            />
          </div>

          {/* Simple suggestions list */}
          {query.trim() && (
            <div className="mt-1 w-full max-w-xl overflow-hidden rounded-2xl border border-[#5f6368] bg-[#303134] py-1">
              {matches.length > 0 ? (
                <ul role="listbox">
                  {matches.map((flow, index) => (
                    <li
                      key={flow.command}
                      role="option"
                      aria-selected={index === selectedIndex}
                      className={`cursor-pointer px-5 py-2.5 ${
                        index === selectedIndex ? 'bg-[#3c4043]' : 'hover:bg-[#3c4043]'
                      }`}
                      onClick={() => launch(flow)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className="text-white">{flow.command}</span>
                      <span className="ml-2 text-sm text-[#9aa0a6]">— {flow.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-4 text-sm text-[#9aa0a6]">
                  No results for &quot;{query}&quot;
                </div>
              )}
            </div>
          )}

          {launched && (
            <p className="mt-4 text-center text-sm text-[#9aa0a6]">
              Opened in new tabs. <Link href="/" className="text-[#8ab4f8] hover:underline">Home</Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-[#9aa0a6]">
          Try <span className="text-white">gym</span> or <span className="text-white">study</span>
        </p>
      </div>

      {/* Minimal footer */}
      <footer className="py-4 text-center text-xs text-[#5f6368]">
        <Link href="/" className="hover:underline">About</Link>
      </footer>
    </main>
  );
}
