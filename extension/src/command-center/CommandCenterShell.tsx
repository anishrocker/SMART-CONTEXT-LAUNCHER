import { useEffect, useState } from 'react';
import { sendMessage, MSG } from '@shared/messages';
import type { Context } from '@shared/types';
import type { GetContextsResponse, GetSuggestedContextResponse } from '@shared/messages';

/**
 * Command palette shell: loads contexts from background, lists them, runs workflow on select.
 * TODO: add search/filter, keyboard nav (↑↓ Enter), suggested context banner.
 */
export function CommandCenterShell() {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [suggested, setSuggested] = useState<GetSuggestedContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      sendMessage<GetContextsResponse>({ action: MSG.GET_CONTEXTS }),
      sendMessage<GetSuggestedContextResponse>({ action: MSG.GET_SUGGESTED_CONTEXT }),
    ])
      .then(([ctxRes, sugRes]) => {
        setContexts(ctxRes.contexts);
        setSuggested(sugRes.contextId ? sugRes : null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const runWorkflow = (workflowId: string) => {
    sendMessage({ action: MSG.RUN_WORKFLOW, workflowId }).then(() => {
      // Close palette (postMessage to parent for iframe; or window.close() if standalone)
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'SMART_CONTEXT_LAUNCHER_CLOSE' }, '*');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white/90 backdrop-blur-xl p-6">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white/90 backdrop-blur-xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl max-w-xl mx-auto mt-[18vh] overflow-hidden">
      {/* Suggested context banner */}
      {suggested?.contextName && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
          Suggested: <strong>{suggested.contextName}</strong>
        </div>
      )}

      <div className="p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search commands…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
          readOnly
          aria-label="Search commands"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {contexts.length === 0 ? (
          <p className="px-4 py-6 text-gray-500 text-sm">No contexts defined. TODO: add contexts in background.</p>
        ) : (
          <ul className="space-y-0.5">
            {contexts.map((ctx) => (
              <li key={ctx.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onClick={() => runWorkflow(ctx.workflowId)}
                >
                  <span className="font-medium text-gray-900">{ctx.name}</span>
                  {ctx.summary && <span className="ml-2 text-gray-500 text-sm">— {ctx.summary}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
        ↑↓ move · Enter launch · Esc close
      </div>
    </div>
  );
}
