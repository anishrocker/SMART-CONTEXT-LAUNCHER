/**
 * Message passing utilities for extension components.
 * Background handles all messages; UI (command-center, options) sends requests.
 */

import type { Confidence, Context, Session, Settings, SuggestedTabMatch, Workflow } from './types';

// ---------------------------------------------------------------------------
// Action names (must match background messageHandler)
// ---------------------------------------------------------------------------

export const MSG = {
  GET_CONTEXTS: 'getContexts',
  RUN_WORKFLOW: 'runWorkflow',
  GET_SUGGESTED_CONTEXT: 'getSuggestedContext',
  SAVE_CURRENT_TABS: 'saveCurrentTabs',
  GET_TAB_BUNDLES: 'getTabBundles',
  RESTORE_BUNDLE: 'restoreBundle',
  GET_SETTINGS: 'getSettings',
  SET_SETTINGS: 'setSettings',
  SHOW_SPOTLIGHT: 'showSpotlight',
} as const;

// ---------------------------------------------------------------------------
// Request / Response payloads (type-safe contracts)
// ---------------------------------------------------------------------------

export interface GetContextsResponse {
  contexts: Context[];
  workflows: Workflow[];
}

export interface RunWorkflowRequest {
  action: typeof MSG.RUN_WORKFLOW;
  workflowId: string;
}
export interface RunWorkflowResponse {
  success: boolean;
  error?: string;
}

export interface GetSuggestedContextResponse {
  contextId: string | null;
  contextName: string | null;
  confidence: Confidence;
  matchedTabs: SuggestedTabMatch[];
  reason: string | null;
}

export interface SaveCurrentTabsRequest {
  action: typeof MSG.SAVE_CURRENT_TABS;
  name: string;
}
export interface SaveCurrentTabsResponse {
  bundleId?: string;
  error?: string;
}

export interface GetTabBundlesResponse {
  bundles: Session[];
}

export interface RestoreBundleRequest {
  action: typeof MSG.RESTORE_BUNDLE;
  bundleId: string;
}
export interface RestoreBundleResponse {
  success: boolean;
  error?: string;
}

export interface GetSettingsResponse extends Settings {}

export interface SetSettingsRequest {
  action: typeof MSG.SET_SETTINGS;
  settings: Partial<Settings>;
}
export interface SetSettingsResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Send message to background (from UI pages)
// ---------------------------------------------------------------------------

export function sendMessage<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      reject(new Error('Extension runtime not available'));
      return;
    }
    chrome.runtime.sendMessage(payload, (response: T | undefined) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as T);
    });
  });
}
