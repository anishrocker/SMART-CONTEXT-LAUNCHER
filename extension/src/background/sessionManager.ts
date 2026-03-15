/**
 * Session (tab bundle) manager: save current window tabs, restore by id.
 * Persists to chrome.storage.local via shared/storage.
 */

import type { Session, SessionTab } from '@shared/types';
import { getTabBundles, setTabBundles } from '@shared/storage';

// TODO: implement getActiveWindowTabs(): Promise<SessionTab[]>
// - chrome.tabs.query({ currentWindow: true })
// - Return { url, title } for each tab (exclude extension pages if desired)

export async function getActiveWindowTabs(): Promise<SessionTab[]> {
  // TODO: implement
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map((t) => ({ url: t.url ?? '', title: t.title }));
}

// TODO: implement saveCurrentTabsAsBundle(name: string): Promise<string>
// - getActiveWindowTabs(), generate id (crypto.randomUUID or timestamp)
// - Append to tabBundles in storage, return bundleId

export async function saveCurrentTabsAsBundle(name: string): Promise<string> {
  const tabs = await getActiveWindowTabs();
  const bundles = await getTabBundles();
  const id = `bundle-${Date.now()}`;
  const session: Session = {
    id,
    name,
    createdAt: Date.now(),
    tabs: tabs.filter((t) => t.url && !t.url.startsWith('chrome://')),
  };
  await setTabBundles([...bundles, session]);
  return id;
}

// TODO: option to close existing tabs; currently adds tabs only

export async function restoreBundle(bundleId: string): Promise<void> {
  const bundles = await getTabBundles();
  const bundle = bundles.find((b) => b.id === bundleId);
  if (!bundle) throw new Error(`Bundle not found: ${bundleId}`);
  for (const tab of bundle.tabs) {
    if (tab.url) await chrome.tabs.create({ url: tab.url });
  }
}
