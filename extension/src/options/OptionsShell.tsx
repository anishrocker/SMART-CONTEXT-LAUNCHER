import { useEffect, useState } from 'react';
import { sendMessage, MSG } from '@shared/messages';
import type { Settings } from '@shared/types';
import type { GetTabBundlesResponse } from '@shared/messages';
import type { Session } from '@shared/types';

/**
 * Options/settings page shell.
 * TODO: suggest-context toggle, saved bundles list with Restore/Delete.
 */
export function OptionsShell() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bundles, setBundles] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sendMessage<Settings>({ action: MSG.GET_SETTINGS }),
      sendMessage<GetTabBundlesResponse>({ action: MSG.GET_TAB_BUNDLES }),
    ])
      .then(([s, b]) => {
        setSettings(s ?? { suggestContext: true });
        setBundles(b.bundles ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const onSuggestToggle = (value: boolean) => {
    sendMessage({ action: MSG.SET_SETTINGS, settings: { suggestContext: value } }).then(() => {
      setSettings((prev) => (prev ? { ...prev, suggestContext: value } : null));
    });
  };

  const onRestore = (bundleId: string) => {
    sendMessage({ action: MSG.RESTORE_BUNDLE, bundleId });
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-semibold text-gray-900">Smart Context Launcher</h1>

        <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.suggestContext ?? true}
              onChange={(e) => onSuggestToggle(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Suggest context in command palette</span>
          </label>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Saved tab bundles</h2>
          {bundles.length === 0 ? (
            <p className="text-gray-500 text-sm">No saved bundles yet. TODO: Save from command palette.</p>
          ) : (
            <ul className="space-y-2">
              {bundles.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-900">{b.name}</span>
                  <button
                    type="button"
                    onClick={() => onRestore(b.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-gray-400">
          Use <kbd className="px-1 py-0.5 bg-gray-200 rounded">⌘K</kbd> (Mac) or <kbd className="px-1 py-0.5 bg-gray-200 rounded">Ctrl+K</kbd> to open the command center.
        </p>
      </div>
    </div>
  );
}
