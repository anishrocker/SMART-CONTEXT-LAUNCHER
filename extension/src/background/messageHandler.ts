/**
 * Background message handler: dispatches extension messages to the right module.
 * TODO: implement all handlers; return proper response shapes for UI.
 */

import { MSG } from '@shared/messages';
import type { GetContextsResponse } from '@shared/messages';
import { CONTEXTS, WORKFLOWS } from './contexts';
import { getContextForUrls } from './detector';
import { runWorkflow } from './executor';
import { getActiveWindowTabs, saveCurrentTabsAsBundle, restoreBundle } from './sessionManager';
import { getTabBundles } from '@shared/storage';
import { getSettings, setSettings } from '@shared/storage';

export function handleMessage(
  message: Record<string, unknown>,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): boolean {
  const action = message?.action as string | undefined;
  if (!action) {
    sendResponse({ error: 'Missing action' });
    return true;
  }

  switch (action) {
    case MSG.GET_CONTEXTS: {
      const response: GetContextsResponse = { contexts: CONTEXTS, workflows: WORKFLOWS };
      sendResponse(response);
      return true;
    }

    case MSG.RUN_WORKFLOW: {
      const workflowId = message.workflowId as string;
      runWorkflow(workflowId, WORKFLOWS).then(() => sendResponse({ success: true })).catch((err) => sendResponse({ success: false, error: String(err) }));
      return true; // async response
    }

    case MSG.GET_SUGGESTED_CONTEXT: {
      getActiveWindowTabs()
        .then((tabs) => {
          const urls = tabs.map((t) => t.url).filter(Boolean);
          const ctx = getContextForUrls(urls, CONTEXTS);
          sendResponse({ contextId: ctx?.id ?? null, contextName: ctx?.name ?? null });
        })
        .catch(() => sendResponse({ contextId: null, contextName: null }));
      return true;
    }

    case MSG.SAVE_CURRENT_TABS: {
      const name = (message.name as string) || 'Saved tabs';
      saveCurrentTabsAsBundle(name)
        .then((bundleId) => sendResponse({ bundleId }))
        .catch((err) => sendResponse({ error: String(err) }));
      return true;
    }

    case MSG.GET_TAB_BUNDLES: {
      getTabBundles().then((bundles) => sendResponse({ bundles }));
      return true;
    }

    case MSG.RESTORE_BUNDLE: {
      const bundleId = message.bundleId as string;
      restoreBundle(bundleId)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: String(err) }));
      return true;
    }

    case MSG.GET_SETTINGS: {
      getSettings().then((settings) => sendResponse(settings));
      return true;
    }

    case MSG.SET_SETTINGS: {
      const settings = message.settings as Partial<import('@shared/types').Settings>;
      setSettings(settings ?? {}).then(() => sendResponse({ success: true }));
      return true;
    }

    default:
      sendResponse({ error: `Unknown action: ${action}` });
      return true;
  }
}
