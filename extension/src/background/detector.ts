/**
 * Context detector: given tab URLs, returns best-matching context.
 * MVP: rule-based (host + substring); no AI.
 */

import type { Context, InferredState } from '@shared/types';

function normalizeHost(value: string): string | null {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function matchesRule(url: string, rule: Context['urlRules'][number]): boolean {
  const normalizedPattern = rule.pattern.toLowerCase();
  const normalizedUrl = url.toLowerCase();

  switch (rule.type) {
    case 'host': {
      const host = normalizeHost(url);
      return host === normalizedPattern || host?.endsWith(`.${normalizedPattern}`) === true;
    }
    case 'regex':
      try {
        return new RegExp(rule.pattern, 'i').test(url);
      } catch {
        return false;
      }
    case 'substring':
    default:
      return normalizedUrl.includes(normalizedPattern);
  }
}

export function getContextForUrls(urls: string[], contexts: Context[]): Context | null {
  const best = getBestContextMatch(urls, contexts);
  return best?.context ?? null;
}

export function getBestContextMatch(
  urls: string[],
  contexts: Context[]
): { context: Context; matchedUrls: string[]; confidence: InferredState['confidence'] } | null {
  let bestMatch: { context: Context; matchedUrls: string[]; confidence: InferredState['confidence'] } | null = null;

  for (const context of contexts) {
    const matchedUrls = urls.filter((url) => context.urlRules.some((rule) => matchesRule(url, rule)));
    if (matchedUrls.length === 0) continue;

    const confidence: InferredState['confidence'] = matchedUrls.length >= 2 ? 'high' : 'low';
    if (
      !bestMatch ||
      matchedUrls.length > bestMatch.matchedUrls.length ||
      (matchedUrls.length === bestMatch.matchedUrls.length && confidence === 'high' && bestMatch.confidence === 'low')
    ) {
      bestMatch = { context, matchedUrls, confidence };
    }
  }

  console.debug('[Smart Context Launcher][detector] evaluated URLs', {
    urlCount: urls.length,
    urls,
    bestMatch: bestMatch
      ? {
          contextId: bestMatch.context.id,
          contextName: bestMatch.context.name,
          matchedUrls: bestMatch.matchedUrls,
          confidence: bestMatch.confidence,
        }
      : null,
  });

  return bestMatch;
}

/**
 * Build inferred state from current window tabs (called by background when needed).
 */
export function buildInferredState(
  urls: string[],
  contexts: Context[],
  tabIds: number[]
): InferredState {
  const match = getBestContextMatch(urls, contexts);
  if (!match) {
    return {
      contextId: null,
      contextName: null,
      confidence: 'none',
      tabIds: [],
    };
  }

  return {
    contextId: match.context.id,
    contextName: match.context.name,
    confidence: match.confidence,
    tabIds,
  };
}
