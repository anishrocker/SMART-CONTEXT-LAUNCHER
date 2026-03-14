'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { launchFlows } from '@/app/lib/commands';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = launchFlows.filter(
    (flow) =>
      flow.command.toLowerCase().includes(query.toLowerCase().trim()) ||
      flow.label.toLowerCase().includes(query.toLowerCase().trim())
  );

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }, []);

  const launch = useCallback(
    (flow: (typeof launchFlows)[0]) => {
      flow.urls.forEach(({ url }) => window.open(url, '_blank', 'noopener,noreferrer'));
      closePalette();
    },
    [closePalette]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        if (!open) {
          setQuery('');
          setSelectedIndex(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
      if (e.key === 'Escape') {
        closePalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closePalette]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, matches, selectedIndex, launch]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const selected = el.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex, matches.length]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={closePalette}
      />
      <div
        className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
          <span className="text-slate-500" aria-hidden>
            ⌘
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command (e.g. gym, study)..."
            className="min-w-0 flex-1 bg-transparent font-mono text-lg text-white placeholder:text-slate-500 focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="command-list"
            aria-activedescendant={matches[selectedIndex] ? `command-${selectedIndex}` : undefined}
          />
        </div>

        {matches.length > 0 ? (
          <ul
            id="command-list"
            ref={listRef}
            className="mt-2 max-h-[min(60vh,320px)] overflow-y-auto rounded-xl border border-white/5"
            role="listbox"
          >
            {matches.map((flow, index) => (
              <li
                key={flow.command}
                id={`command-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`cursor-pointer rounded-lg px-4 py-3 ${
                  index === selectedIndex
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
                onClick={() => launch(flow)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono font-medium">{flow.command}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-slate-400">
                    {flow.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{flow.summary}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  Opens: {flow.actions.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 rounded-xl border border-white/5 px-4 py-6 text-center text-slate-500">
            No command matching &quot;{query || '…'}&quot;
          </div>
        )}

        <p className="mt-2 px-2 font-mono text-xs text-slate-500">
          ↑↓ choose · Enter open · Esc close
        </p>
      </div>
    </>
  );
}
