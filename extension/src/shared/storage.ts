/**
 * Storage utilities for chrome.storage.local.
 * Used by background only; UI reads/writes via message passing.
 */

import type { Session, Settings } from './types';

const KEYS = {
  TAB_BUNDLES: 'tabBundles',
  SETTINGS: 'settings',
} as const;

const DEFAULT_SETTINGS: Settings = {
  suggestContext: true,
};

// ---------------------------------------------------------------------------
// Tab bundles (sessions)
// ---------------------------------------------------------------------------

export async function getTabBundles(): Promise<Session[]> {
  // TODO: implement - chrome.storage.local.get(KEYS.TAB_BUNDLES)
  const result = await chrome.storage.local.get(KEYS.TAB_BUNDLES);
  const raw = result[KEYS.TAB_BUNDLES];
  return Array.isArray(raw) ? raw : [];
}

export async function setTabBundles(bundles: Session[]): Promise<void> {
  // TODO: implement - chrome.storage.local.set
  await chrome.storage.local.set({ [KEYS.TAB_BUNDLES]: bundles });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(KEYS.SETTINGS);
  const raw = result[KEYS.SETTINGS];
  if (raw && typeof raw === 'object' && 'suggestContext' in raw) {
    return { ...DEFAULT_SETTINGS, ...raw };
  }
  return { ...DEFAULT_SETTINGS };
}

export async function setSettings(partial: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({
    [KEYS.SETTINGS]: { ...current, ...partial },
  });
}
