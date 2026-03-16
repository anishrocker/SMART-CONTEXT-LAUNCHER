/**
 * Background message handler: dispatches extension messages to the right module.
 * TODO: implement all handlers; return proper response shapes for UI.
 */

import { MSG } from '@shared/messages';
import type { GetContextsResponse } from '@shared/messages';
import { CONTEXTS, WORKFLOWS } from './contexts';
import { getBestContextMatch } from './detector';
import { runWorkflow } from './executor';
import { getOpenChromeTabs, saveCurrentTabsAsBundle, restoreBundle } from './sessionManager';
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
      Promise.all([getSettings(), getOpenChromeTabs()])
        .then(([settings, tabs]) => {
          console.debug('[Smart Context Launcher][background] getSuggestedContext requested', {
            suggestContextEnabled: settings.suggestContext,
            tabCount: tabs.length,
            tabs: tabs.map((tab) => ({
              id: tab.id ?? null,
              title: tab.title ?? null,
              url: tab.url ?? null,
            })),
          });

          if (!settings.suggestContext) {
            console.debug('[Smart Context Launcher][background] suggestion skipped because settings.suggestContext=false');
            sendResponse({ contextId: null, contextName: null, confidence: 'none', matchedTabs: [], reason: null });
            return;
          }

          const urls = tabs.map((tab) => tab.url).filter((url): url is string => Boolean(url));
          const match = getBestContextMatch(urls, CONTEXTS);

          if (!match) {
            console.debug('[Smart Context Launcher][background] no suggested context match found');
            sendResponse({ contextId: null, contextName: null, confidence: 'none', matchedTabs: [], reason: null });
            return;
          }

          const matchedTabs = tabs
            .filter((tab): tab is chrome.tabs.Tab & { id: number; url: string } => tab.id != null && typeof tab.url === 'string' && match.matchedUrls.includes(tab.url))
            .map((tab) => {
              let host: string | null = null;
              try {
                host = new URL(tab.url).hostname.replace(/^www\./, '').toLowerCase();
              } catch {
                host = null;
              }

              return {
                tabId: tab.id,
                title: tab.title ?? null,
                url: tab.url,
                host,
              };
            });

          const hostList = Array.from(new Set(matchedTabs.map((tab) => tab.host).filter(Boolean)));
          const reason =
            hostList.length > 0
              ? `Detected from ${matchedTabs.length} open tab${matchedTabs.length === 1 ? '' : 's'} on ${hostList.join(', ')}.`
              : `Detected from ${matchedTabs.length} open tab${matchedTabs.length === 1 ? '' : 's'}.`;

          console.debug('[Smart Context Launcher][background] suggested context resolved', {
            contextId: match.context.id,
            contextName: match.context.name,
            confidence: match.confidence,
            matchedTabs,
            reason,
          });

          sendResponse({
            contextId: match.context.id,
            contextName: match.context.name,
            confidence: match.confidence,
            matchedTabs,
            reason,
          });
        })
        .catch((error) => {
          console.error('[Smart Context Launcher][background] failed to compute suggested context', error);
          sendResponse({ contextId: null, contextName: null, confidence: 'none', matchedTabs: [], reason: null });
        });
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
