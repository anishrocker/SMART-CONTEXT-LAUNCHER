/**
 * Context detector: given tab URLs, returns best-matching context.
 * MVP: rule-based (host + substring); no AI.
 */

import type { Context, InferredState } from '@shared/types';

// TODO: implement getContextForUrls(urls: string[], contexts: Context[]): Context | null
// - For each context, check urlRules (host / substring)
// - Return first context that has at least one rule matching at least one URL
// - Order = contexts array order (priority)

export function getContextForUrls(_urls: string[], _contexts: Context[]): Context | null {
  // TODO: implement
  return null;
}

/**
 * Build inferred state from current window tabs (called by background when needed).
 */
export function buildInferredState(
  _urls: string[],
  _contexts: Context[],
  _tabIds: number[]
): InferredState {
  // TODO: implement - call getContextForUrls, map to InferredState
  return {
    contextId: null,
    contextName: null,
    confidence: 'none',
    tabIds: [],
  };
}
