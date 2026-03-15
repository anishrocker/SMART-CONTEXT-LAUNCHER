# Smart Context Launcher — Implementation Tickets

Implementation-ready breakdown: folder structure, file list, first 15 tickets, dependencies, types, stubs, and acceptance criteria.

---

## 1. Exact folder structure

```
smart-context-launcher/
├── docs/
│   ├── ARCHITECTURE_AND_MVP_PLAN.md
│   └── IMPLEMENTATION_TICKETS.md          # this file
├── extension/
│   ├── manifest.json
│   ├── background.js                       # built from background/index.ts (entry)
│   ├── background/
│   │   ├── index.ts                        # SW entry, commands + onMessage
│   │   ├── types.ts                        # Context, Workflow, UrlRule, TabBundle, etc.
│   │   ├── contexts.ts                     # CONTEXTS, WORKFLOWS (hardcoded)
│   │   ├── contextMatcher.ts               # getContextForUrls(urls)
│   │   ├── workflowExecutor.ts             # runWorkflow(workflowId)
│   │   ├── tabManager.ts                   # save/restore bundles, getActiveWindowTabs
│   │   ├── messageHandler.ts               # handle getContexts, runWorkflow, etc.
│   │   └── settings.ts                     # get/set settings (storage)
│   ├── content.js                          # unchanged: inject iframe, postMessage close
│   ├── command-center.html
│   ├── command-center.js                   # palette UI: getContexts, runWorkflow, UI
│   ├── commands-data.js                    # keep for now; can be migrated to contexts.ts
│   ├── options.html
│   └── options.js
├── extension-build/                        # optional: build output if not in-place
│   └── (compiled .js from background/*.ts)
└── (app/, etc. — existing Next.js, unchanged)
```

**Notes:**

- `background.js` in manifest points to the compiled service worker. Either compile `background/index.ts` → `extension/background.js` or use a single `background.js` that uses `importScripts()` to load other built files (e.g. `background/contexts.js`, `background/contextMatcher.js`, …).
- No `shared/` folder in MVP: types live in `background/types.ts`; palette uses plain JS and expects JSON from messages (no shared TS with content script without a bundler).
- `tabManager.ts` and `settings.ts` are Day 2; list them in folder structure for completeness.

---

## 2. Exact file list

| # | Path | Purpose |
|---|------|--------|
| 1 | `extension/manifest.json` | MV3 manifest; background, content_scripts, commands, storage, options_ui |
| 2 | `extension/background/index.ts` | Service worker entry: chrome.commands, chrome.runtime.onMessage delegation |
| 3 | `extension/background/types.ts` | Context, Workflow, WorkflowStep, UrlRule, TabBundle, InferredState, Settings |
| 4 | `extension/background/contexts.ts` | CONTEXTS (5–8), WORKFLOWS; export constants |
| 5 | `extension/background/contextMatcher.ts` | getContextForUrls(urls: string[]): Context \| null |
| 6 | `extension/background/workflowExecutor.ts` | runWorkflow(workflowId: string): Promise\<void\> |
| 7 | `extension/background/messageHandler.ts` | Handle getContexts, runWorkflow (Day 1); getSuggestedContext, saveCurrentTabs, getTabBundles, restoreBundle (Day 2) |
| 8 | `extension/background/tabManager.ts` | getActiveWindowTabs(), saveCurrentTabsAsBundle(name), getBundles(), restoreBundle(id) |
| 9 | `extension/background/settings.ts` | getSettings(), setSettings(partial); storage keys: suggestContext, etc. |
| 10 | `extension/content.js` | Existing: inject iframe, listen for showSpotlight, postMessage close |
| 11 | `extension/command-center.html` | Existing: search UI, results, hint |
| 12 | `extension/command-center.js` | Update: call background getContexts/getSuggestedContext, render list, runWorkflow on select, optional Save/Restore UI |
| 13 | `extension/commands-data.js` | Existing: keep; optional migration to contexts.ts later |
| 14 | `extension/options.html` | Existing: add section for “Suggest context” toggle and “Saved bundles” list |
| 15 | `extension/options.js` | Existing: add handlers for settings toggle, getTabBundles, restoreBundle, deleteBundle |

**Build:** One of (a) tsc/esbuild: `background/index.ts` + imports → single `background.js`, or (b) tsc per-file → `background/*.js` and `background.js` uses `importScripts('background/contexts.js', ...)`. Manifest’s `background.script` stays one file in MV3.

---

## 3. First 15 engineering tickets

| ID | Title |
|----|--------|
| T1 | Define shared types (Context, Workflow, UrlRule, TabBundle, Settings, message payloads) |
| T2 | Add hardcoded CONTEXTS and WORKFLOWS (5–8 contexts, one workflow per context with open URLs) |
| T3 | Implement contextMatcher.getContextForUrls (host + substring rules only) |
| T4 | Implement workflowExecutor.runWorkflow (open tabs for workflow’s open step) |
| T5 | Wire background entry: commands.onCommand, onMessage → messageHandler |
| T6 | Implement messageHandler.getContexts and messageHandler.runWorkflow |
| T7 | Build pipeline: compile background/*.ts → background.js (or importScripts bundle) |
| T8 | Palette: request getContexts from background on load and render context list |
| T9 | Palette: on context select send runWorkflow(workflowId) then close palette |
| T10 | Implement getSuggestedContext: getActiveWindowTabs + getContextForUrls, return { contextId, name } |
| T11 | Palette: on open request getSuggestedContext; show “Suggested: &lt;name&gt;” when present |
| T12 | Implement tabManager: getActiveWindowTabs, saveCurrentTabsAsBundle, getBundles, restoreBundle |
| T13 | Message handlers: saveCurrentTabs, getTabBundles, restoreBundle |
| T14 | Settings: getSettings/setSettings (suggestContext boolean); options UI toggle |
| T15 | Options: Saved bundles list with Restore and Delete; palette “Save current tabs” + name prompt |

---

## 4. Ticket dependencies

```
T1 (types)
  └── T2 (contexts), T3 (matcher), T4 (executor), T6 (messageHandler), T12 (tabManager), T14 (settings)
T2 ──┬── T3, T4, T6
     └── T8 (palette uses context list)
T3 ──┬── T6 (getContexts uses contexts; getSuggestedContext uses matcher)
     └── T10 (getSuggestedContext)
T4 ── T6 (runWorkflow)
T5 ── T6 (wire messageHandler)
T6 ── T8, T9 (palette calls getContexts, runWorkflow)
T7 ── T5 (build before testing background)
T8 ── T9 (render then select)
T10 ── T11 (palette shows suggestion)
T12 ── T13 (messageHandler calls tabManager)
T13 ── T15 (palette/options call save/restore)
T14 ── T11 (optional: hide suggestion if suggestContext false), T15 (options UI)
T15 ── T13
```

**Suggested implementation order (no parallel):**  
T1 → T2 → T3 → T4 → T6 → T5 → T7 → T8 → T9 (Day 1 done).  
T10 → T11 → T12 → T13 → T14 → T15 (Day 2–3).

**Parallelizable after T1:** T2+T3+T4 in parallel; then T6; T8+T9 after T6.

---

## 5. Interface/type definitions needed first

Define these in `extension/background/types.ts` (or equivalent) before implementing T2–T6, T12, T14.

```ts
// Context & rules
interface UrlRule {
  pattern: string;
  type: 'substring' | 'host';
}

interface Context {
  id: string;
  name: string;
  summary?: string;
  urlRules: UrlRule[];
  workflowId: string;
}

// Workflow
type WorkflowStepOpen = { action: 'open'; urls: string[] };
type WorkflowStep = WorkflowStepOpen;  // MVP: only open

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

// Tab bundle
interface TabBundleTab {
  url: string;
  title?: string;
}

interface TabBundle {
  id: string;
  name: string;
  createdAt: number;
  tabs: TabBundleTab[];
}

// Inferred state (in-memory or for API response)
interface InferredState {
  contextId: string | null;
  contextName: string | null;
  confidence: 'high' | 'none';
}

// Settings (storage)
interface Settings {
  suggestContext: boolean;
}

// Message payloads (palette ↔ background)
type GetContextsRequest = { action: 'getContexts' };
type GetContextsResponse = { contexts: Context[]; workflows: Workflow[] };

type RunWorkflowRequest = { action: 'runWorkflow'; workflowId: string };
type RunWorkflowResponse = { success: boolean; error?: string };

type GetSuggestedContextRequest = { action: 'getSuggestedContext' };
type GetSuggestedContextResponse = { contextId: string | null; contextName: string | null };

type SaveCurrentTabsRequest = { action: 'saveCurrentTabs'; name: string };
type SaveCurrentTabsResponse = { bundleId: string } | { error: string };

type GetTabBundlesRequest = { action: 'getTabBundles' };
type GetTabBundlesResponse = { bundles: TabBundle[] };

type RestoreBundleRequest = { action: 'restoreBundle'; bundleId: string };
type RestoreBundleResponse = { success: boolean; error?: string };

type GetSettingsRequest = { action: 'getSettings' };
type GetSettingsResponse = Settings;

type SetSettingsRequest = { action: 'setSettings'; settings: Partial<Settings> };
type SetSettingsResponse = { success: boolean };
```

Use these types in background modules only; palette sends/receives JSON and uses the same shape without importing types (no shared TS in MVP).

---

## 6. What to stub/mock initially

| Component | Stub/mock approach |
|-----------|--------------------|
| **contextMatcher** | T3: Return first context that has any matching rule for any URL; no scoring. Stub: `getContextForUrls` return `null` until URL rule logic is implemented. |
| **workflowExecutor** | T4: Stub: `runWorkflow` does nothing or logs; then implement `chrome.tabs.create` for each URL. |
| **messageHandler** | T6: Stub: `getContexts` return `{ contexts: [], workflows: [] }`; `runWorkflow` call stub executor. Replace with real contexts + executor when T2, T4 done. |
| **getSuggestedContext** | T10: Stub: return `{ contextId: null, contextName: null }` until tabManager + matcher are wired. |
| **tabManager** | T12: Stub: `getActiveWindowTabs` return `[]`; `saveCurrentTabsAsBundle` write to storage with empty tabs; `getBundles` return `[]`; `restoreBundle` no-op. Then implement with `chrome.tabs.query`, `chrome.tabs.create`, `chrome.tabs.remove`. |
| **settings** | T14: Stub: `getSettings` return default `{ suggestContext: true }`; `setSettings` no-op. Then implement with `chrome.storage.local`. |
| **chrome.tabs / chrome.storage** | No mocks: use real APIs in extension. If unit-testing outside extension, inject a small adapter (e.g. `tabsAdapter.query(...)`) and pass a mock in tests. |

**Order:** Implement types and contexts (T1, T2) first, then matcher and executor with real logic; stub only messageHandler responses if you want to drive UI (T8, T9) before T3/T4 are done.

---

## 7. Acceptance criteria for each ticket

**T1 — Define shared types**  
- [ ] File `extension/background/types.ts` exists.  
- [ ] Contains: `UrlRule`, `Context`, `Workflow`, `WorkflowStep`, `TabBundle`, `TabBundleTab`, `InferredState`, `Settings`.  
- [ ] Contains request/response types for: getContexts, runWorkflow, getSuggestedContext, saveCurrentTabs, getTabBundles, restoreBundle, getSettings, setSettings.  
- [ ] No runtime dependency on these in content script or HTML; used only in background.

**T2 — Hardcoded CONTEXTS and WORKFLOWS**  
- [ ] File `extension/background/contexts.ts` exists.  
- [ ] Exports `CONTEXTS`: array of 5–8 contexts (id, name, summary, urlRules, workflowId).  
- [ ] Exports `WORKFLOWS`: array of workflows (id, name, steps with action `open` and non-empty `urls`).  
- [ ] Every context’s `workflowId` matches a workflow `id`.  
- [ ] At least one URL rule per context (host or substring).  
- [ ] Example contexts: Coding, Study, Work, Relax, Health (and optionally 2–3 more).

**T3 — contextMatcher.getContextForUrls**  
- [ ] Function `getContextForUrls(urls: string[]): Context | null`.  
- [ ] Uses `CONTEXTS` and each context’s `urlRules`.  
- [ ] For `type: 'host'`: match if new URL(url).host includes pattern (or pattern is substring of host).  
- [ ] For `type: 'substring'`: match if pattern appears in tab URL.  
- [ ] Returns first context that has at least one rule matching at least one URL; order = CONTEXTS order.  
- [ ] Returns null if no context matches.

**T4 — workflowExecutor.runWorkflow**  
- [ ] Function `runWorkflow(workflowId: string): Promise<void>`.  
- [ ] Finds workflow by id in WORKFLOWS.  
- [ ] For each step with `action: 'open'`, calls `chrome.tabs.create` for each URL (in current window).  
- [ ] Rejects with clear error if workflowId not found or workflow has no open step.  
- [ ] Does not close existing tabs in MVP.

**T5 — Wire background entry**  
- [ ] Service worker entry (e.g. `background/index.ts`) registers `chrome.commands.onCommand` for `open-command-center`: query active tab, send `showSpotlight` to content script, else open command-center in new tab.  
- [ ] Registers `chrome.runtime.onMessage`: delegate to messageHandler (by `msg.action`).  
- [ ] Returns true from onMessage listener where async response is used (sendResponse callback or Promise).

**T6 — messageHandler.getContexts and runWorkflow**  
- [ ] On `action: 'getContexts'`: return `{ contexts: CONTEXTS, workflows: WORKFLOWS }` (or from storage if migrated).  
- [ ] On `action: 'runWorkflow'` with `workflowId`: call `workflowExecutor.runWorkflow(workflowId)`; return `{ success: true }` or `{ success: false, error }`.  
- [ ] No other actions required for Day 1.

**T7 — Build pipeline**  
- [ ] Script or config (e.g. npm script) compiles `background/*.ts` so that the manifest’s `background.service_worker` runs and can call contextMatcher, workflowExecutor, contexts, messageHandler.  
- [ ] Either single `background.js` bundle or `background.js` + importScripts of separate .js files.  
- [ ] Loading extension in chrome://extensions and pressing ⌘K does not throw (worker loads).

**T8 — Palette: getContexts and render list**  
- [ ] On load, palette sends `chrome.runtime.sendMessage({ action: 'getContexts' })`.  
- [ ] Receives `{ contexts, workflows }` and renders a list of context names (and optional summary).  
- [ ] List is keyboard-navigable (↑↓) and shows at least 5–8 items when backend has 5–8 contexts.  
- [ ] No selection action yet (T9).

**T9 — Palette: runWorkflow on select and close**  
- [ ] On Enter or click for a selected context, palette sends `{ action: 'runWorkflow', workflowId }` (workflowId from selected context).  
- [ ] After send, palette closes (postMessage to parent or window.close if standalone).  
- [ ] New tabs open from workflow’s open step (same as current “launch” behavior).

**T10 — getSuggestedContext**  
- [ ] Handler for `action: 'getSuggestedContext'`: call `tabManager.getActiveWindowTabs()`, then `contextMatcher.getContextForUrls(urls)`.  
- [ ] Return `{ contextId, contextName }` when match; else `{ contextId: null, contextName: null }`.  
- [ ] tabManager.getActiveWindowTabs returns array of `{ url }` (or `{ url, title }`) for current window tabs (excluding extension pages if desired).

**T11 — Palette: show “Suggested: …”**  
- [ ] On open, palette sends both getContexts and getSuggestedContext (or getContexts returns suggestedContext in one call).  
- [ ] When suggestedContext is present, show a line at top: e.g. “Suggested: Coding” or “Looks like you’re in Coding”.  
- [ ] When settings.suggestContext is false, do not show suggestion (options can read settings; palette can receive it in getContexts response).

**T12 — tabManager**  
- [ ] `getActiveWindowTabs()`: `chrome.tabs.query({ currentWindow: true })` → return array of `{ url, title }` for each tab.  
- [ ] `saveCurrentTabsAsBundle(name)`: get current window tabs, create TabBundle (id = generated, createdAt = Date.now()), append to storage key `tabBundles`, return bundleId.  
- [ ] `getBundles()`: read `tabBundles` from chrome.storage.local, return array.  
- [ ] `restoreBundle(bundleId)`: find bundle, create tabs for each tab.url (in current window), optionally close existing tabs (product decision: MVP can “add tabs” only to avoid data loss).

**T13 — Message handlers: save, getTabBundles, restore**  
- [ ] `saveCurrentTabs`: call tabManager.saveCurrentTabsAsBundle(name), return { bundleId } or { error }.  
- [ ] `getTabBundles`: return { bundles }.  
- [ ] `restoreBundle`: call tabManager.restoreBundle(bundleId), return { success } or { error }.  
- [ ] All handlers registered in messageHandler and wired from background entry.

**T14 — Settings get/set and options toggle**  
- [ ] settings.getSettings(): read from chrome.storage.local key `settings`, return defaults { suggestContext: true } if missing.  
- [ ] settings.setSettings(partial): merge into stored settings, write back.  
- [ ] Message handlers getSettings/setSettings call these.  
- [ ] Options page has toggle “Suggest context in palette”; on change, call setSettings({ suggestContext: value }).

**T15 — Options: Saved bundles + palette Save**  
- [ ] Options page: section “Saved tab bundles” lists bundles (name, date); each row has Restore and Delete. Restore calls restoreBundle; Delete removes from storage and refreshes list.  
- [ ] Palette: “Save current tabs” (button or item) prompts for name, sends saveCurrentTabs(name), shows brief success; list of bundles with Restore can be in options only for MVP, or also in palette (simplest: options only for MVP).

---

## Summary

- **Folder structure:** `extension/` with `background/` (types, contexts, contextMatcher, workflowExecutor, tabManager, messageHandler, settings) and existing content, command-center, options.  
- **Files:** 15 files listed; build produces `background.js` (and optionally separate .js for importScripts).  
- **Tickets:** T1–T9 = Day 1 (types, contexts, matcher, executor, messaging, build, palette load + run + close); T10–T15 = Day 2–3 (suggested context, tab bundles, settings, options UI).  
- **Dependencies:** T1 first; T2–T4 and T6 depend on T1; T8–T9 depend on T6; T10–T11 depend on T3 and tabManager; T12–T13 and T14–T15 for save/restore and settings.  
- **Types:** All in `background/types.ts`; define before T2–T6, T12, T14.  
- **Stubs:** messageHandler can return empty getContexts until T2; getSuggestedContext return null until T10; tabManager/settings stubbed until T12/T14.  
- **Acceptance criteria:** Per-ticket checklists above; each ticket is done when its criteria pass and the extension still loads and ⌘K works.
