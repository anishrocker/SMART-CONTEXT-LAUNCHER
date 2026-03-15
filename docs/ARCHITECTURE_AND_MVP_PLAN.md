# Smart Context Launcher — Architecture, MVP Plan & Viral Feature

---

## A. Product framing

**What it is:** A Chrome extension that (1) lets you launch “contexts” (e.g. coding, study) via a Spotlight-style command palette (⌘K), and (2) infers your current context from open tabs and can suggest or auto-apply workflows (open/group/save tabs).

**Core value:** One shortcut to switch mindsets: “I’m coding” or “I’m studying” → right tabs, grouped, no manual setup. Automatic detection makes it feel like the browser knows what you’re doing.

**Positioning:** “Spotlight for your browser context” — manual launcher today, smart context awareness in the MVP, viral hook later.

---

## B. Chrome Extension architecture

### Manifest V3 layout

- **Background:** Service worker only. No long-lived page; use alarms or startup events for periodic work.
- **Content scripts:** Injected on `<all_urls>` (or a restricted list for MVP). One script: inject iframe for command palette, forward URL/tab updates to background when needed.
- **Extension pages:** Command center (iframe), options/settings, optional side panel later. No popup in MVP if the main entry is ⌘K + optional icon.

### Where things run

| Concern | Where it runs | Why |
|--------|----------------|-----|
| Keyboard shortcut (⌘K) | Background (commands API) | Only place that receives `chrome.commands`. |
| “Show palette” order | Background → content script (message) | Background knows active tab; content injects iframe or opens tab. |
| Command palette UI | Extension origin (iframe or tab) | Full extension APIs, no CSP from host page. |
| Context detection | Background (service worker) | Has `chrome.tabs`; can run on `tabs.onUpdated` / `tabs.onActivated` and when worker wakes. |
| URL → context rules | Background | Rules engine lives where tab URLs are visible. |
| Workflow execution (open/close/group tabs) | Background | Only background can create/move/group tabs. |
| Settings (contexts, rules, preferences) | Background reads/writes storage; UI reads/writes via messaging | Single source of truth in `chrome.storage`. |
| Tab/session bundles (save/restore) | Background | Create tabs, restore URLs; optional `sessions` API or manual serialize. |

### Manual launch vs automatic detection

- **Manual:** User presses ⌘K → palette opens → user picks “Coding” or “Study” → workflow runs (open/group tabs). No detection.
- **Automatic (MVP):** Background maintains “current inferred context” from open tabs (URL rules). Palette shows: “Looks like you’re in **Coding** — launch Coding stack?” or highlights that context. User still triggers the palette and chooses; no auto-execution without user action in MVP.
- **Interaction:** Same workflow engine for both. Difference is only input: user choice vs. suggested context. Optional later: “Auto-launch when context switches” (with user setting).

### High-level flow

1. **Tab events** → Background updates “current context” from URL rules (rule-based matcher).
2. **⌘K** → Background tells active tab’s content script “show palette” (or opens command-center in new tab if content script isn’t allowed).
3. **Palette** loads contexts/workflows from storage (or from background via message), shows list + optional “Suggested: Coding” from background.
4. **User selects context** → Palette sends “run workflow X” to background → Background executes (open/group tabs, etc.).
5. **Save/restore** → User action in palette or options → “Save current tabs as bundle” / “Restore bundle” → Background does tab create/close/group.

---

## C. Core modules and responsibilities

| Module | Location | Responsibility |
|--------|----------|-----------------|
| **Command parser** | Background (or shared util) | Parses shortcut input (e.g. “coding”, “study”). Maps to context ID. No NLP in MVP — literal/fuzzy match on context names and aliases. |
| **Context matcher** | Background | Given a list of tab URLs, returns best-matching context (and confidence) using URL rules. Runs on tab updates / activation. |
| **Workflow executor** | Background | Runs a workflow: open URLs, optional group, optional close others. Uses `chrome.tabs` (create, move, group). |
| **Tab/session manager** | Background | Save: collect active window tab URLs (+ optional title); serialize to a “bundle”. Restore: create tabs from bundle, optional grouping. Persist bundles in storage. |
| **Rules engine** | Background | Evaluates URL rules (e.g. `github.com`, `*stackoverflow*`, `docs.*`) against a tab. Returns which context (if any) and optional score. Rule format: per-context list of patterns (string or regex). |
| **Settings manager** | Background + storage | Read/write: contexts, workflows, URL rules, “suggested context” pref, saved bundles. Expose get/set to UI via messages. |
| **Analytics/logging manager** | Optional; Background | In MVP: console or a tiny local log for “context detected”, “workflow run”. No external analytics in MVP. |

**UI (command palette):** Renders contexts/workflows, calls background for “suggested context” and “run workflow” / “save bundle” / “restore bundle”. No business logic.

---

## D. Data structures for contexts, workflows, sessions

Keep these JSON-serializable and in `chrome.storage.local` (sync later).

**Context (predefined + user):**

```ts
interface Context {
  id: string;                    // e.g. "coding" | "study"
  name: string;                  // "Coding"
  summary?: string;              // short description
  urlRules: UrlRule[];           // for detection
  workflowId: string;            // which workflow to run when chosen
}

interface UrlRule {
  pattern: string;               // "github.com" | "*stackoverflow*" | regex string
  type: 'substring' | 'host' | 'regex';
}
```

**Workflow:**

```ts
interface Workflow {
  id: string;                    // "coding-stack"
  name: string;                  // "Coding stack"
  steps: WorkflowStep[];
}

type WorkflowStep =
  | { action: 'open'; urls: string[] }
  | { action: 'group'; name?: string; tabIds?: number[] }  // MVP: group current window
  | { action: 'closeOthers' };   // optional, close tabs not in workflow
```

**Tab bundle (saved session):**

```ts
interface TabBundle {
  id: string;
  name: string;                  // "Tuesday coding session"
  createdAt: number;
  tabs: { url: string; title?: string }[];
  windowId?: number;            // optional, for later
}
```

**Inferred state (in memory in background; optionally persisted for “last suggested”):**

```ts
interface InferredState {
  contextId: string | null;
  confidence: 'high' | 'low' | 'none';   // MVP: high if any tab matches, low if mixed
  tabIds: number[];                      // tabs that contributed to this context
}
```

Store in storage: `contexts`, `workflows`, `urlRules` (or embedded in contexts), `tabBundles`, `settings` (e.g. `{ suggestContext: true }`).

---

## E. Message passing design

**Content script ↔ Background**

- Content → Background: rarely in MVP (only if you need to ask for something from page). Mostly Background → Content.
- Background → Content: `{ action: 'showSpotlight' }` (existing). Optional: `{ action: 'setSuggestedContext', contextId, label }` if palette is iframe and you want to show suggestion without re-querying.

**Command palette (iframe or tab) ↔ Background**

- Palette → Background:
  - `getContexts()` → `{ contexts, workflows, suggestedContext? }`
  - `runWorkflow(workflowId)`
  - `getSuggestedContext()` → `{ contextId?, label? }`
  - `saveCurrentTabs(bundleName)` → `{ bundleId }`
  - `getTabBundles()` → `{ bundles }`
  - `restoreBundle(bundleId)`
- Background → Palette: only in response to the above (no push in MVP except optional “suggested context” on open).

Use one-off `chrome.runtime.sendMessage` from palette; background uses `sendResponse` or Promise-based `chrome.runtime.sendMessage` from palette and handles in `chrome.runtime.onMessage`.

**Tab events (no content script messaging for detection)**

- Background subscribes to `chrome.tabs.onUpdated`, `chrome.tabs.onActivated`. On change, get all tabs in active window (or all windows for “strongest” context), run rules engine, set inferred context in memory and optionally write to storage for “suggested” in palette.

---

## F. MVP scope for 2–3 day build

**In scope**

- Command palette (⌘K) opening in current tab via iframe (keep current behavior).
- 5–8 predefined contexts with names and URL rules (e.g. Coding, Study, Work, Relax, Health).
- One workflow per context: “open a list of URLs” (no grouping required for day 1–2).
- Rule-based context detection: URL rules per context; “current context” = first context whose rule matches any tab in active window.
- Palette shows list of contexts; optionally show “Suggested: Coding” at top when detection matches.
- Workflow execution: open workflow URLs in new tabs (existing behavior).
- Save current tabs as a named bundle (IDs + URLs + titles); store in `chrome.storage.local`.
- Restore: “Restore bundle” from list → close current tabs (or current window) and open bundle’s URLs (simplified: one window).
- Settings: list of contexts/workflows in options (can be read-only for MVP with 5–8 hardcoded), and one toggle: “Show suggested context in palette”.

**Out of scope for MVP**

- AI/ML detection; sync across devices; popup UI; side panel; analytics; “auto-run workflow on context change”; regex URL rules (substring/host only in MVP); tab grouping in workflow; multiple windows; editing URL rules in UI (use hardcoded rules).

**Fake or simplify**

- “Confidence”: binary — matched or not. No scoring.
- Contexts/workflows: hardcoded in a single `contexts.ts` or JSON file; no CRUD UI. Options page can just show “Contexts” list and “Saved bundles” with restore.
- Save/restore: save = current window’s tabs only; restore = one window, no grouping, no “merge”.

**Hard problems to avoid in v1**

- Multi-window context (e.g. “which window is coding?”). MVP: use active window only.
- Conflicting contexts (tabs from two contexts). MVP: pick one (e.g. first matching context by priority order).
- Service worker lifecycle: don’t rely on long-running state. Recompute “suggested context” when palette opens (query tabs then) if you don’t want to persist inferred state.

---

## G. Day-by-day build plan

### Day 1 — Foundation and palette with contexts

**Goals**

- Background has a minimal “context matcher” and “workflow executor”; contexts and workflows are hardcoded (5–8).
- Command palette (existing) reads contexts from background via message and displays them; selecting one runs “open these URLs” (workflow).
- No detection yet; manual launch only.

**Files / modules**

- `background/contexts.ts` (or `.js`): export `CONTEXTS` and `WORKFLOWS` (and optional `URL_RULES`).
- `background/contextMatcher.ts`: function `getContextForUrls(urls: string[]): Context | null` using URL rules (host/substring).
- `background/workflowExecutor.ts`: function `runWorkflow(workflowId): Promise<void>` (open tabs).
- `background/index.ts`: service worker entry; `onMessage` handlers: `getContexts`, `runWorkflow`; keep existing `commands.onCommand` → show palette.
- `command-center.js` (or React later): on load, send `getContexts`; render list; on select, send `runWorkflow(id)` then close.
- Optional: `types.ts` for Context, Workflow, UrlRule.

**Expected output**

- ⌘K → palette with 5–8 contexts (e.g. Coding, Study, Work, Relax, Health). Choose one → opens that context’s URLs. Demo: “I press ⌘K, pick Study, and get Coursera + YouTube + a notes URL.”

**Demo milestone**

- “Manual context launch works: one shortcut, one list, one click to open a full stack.”

---

### Day 2 — Detection and save/restore

**Goals**

- Background computes “suggested context” from active window’s tab URLs using the same URL rules.
- Palette asks for suggested context on open and shows “Suggested: Coding” (or similar) when there is a match.
- Tab/session manager: save current window’s tabs as a bundle; list saved bundles; restore a bundle (open tabs, optionally close current).

**Files / modules**

- `background/tabManager.ts`: `getActiveWindowTabs()`, `saveCurrentTabsAsBundle(name)`, `getBundles()`, `restoreBundle(bundleId)` (implement with `chrome.tabs` + `chrome.storage.local`).
- Background: on `getSuggestedContext`, call `getActiveWindowTabs()` then `getContextForUrls(urls)`; return `{ contextId, name }`.
- Background message handlers: `saveCurrentTabs`, `getTabBundles`, `restoreBundle`.
- Command center UI: “Suggested: …” at top when present; add “Save current tabs” (prompt name) and “Restore” with a dropdown or list of bundles.
- Storage schema: `tabBundles: TabBundle[]` in `chrome.storage.local`.

**Expected output**

- Open GitHub + Stack Overflow → ⌘K → “Suggested: Coding” at top; user can still pick any context.
- “Save current tabs” → name it “My coding session” → later “Restore” → those tabs open.

**Demo milestone**

- “It detects I’m coding and suggests it; I can save and restore tab sets.”

---

### Day 3 — Polish, settings, and demo prep

**Goals**

- Options/settings page: toggle “Show suggested context”, list of contexts (read-only), list of saved bundles with Restore/Delete.
- Stable, presentable command palette (keyboard, Esc, no autofocus issues).
- One coherent demo flow: manual launch, suggested context, save, restore.

**Files / modules**

- `options.html` / `options.js` (or React): read `settings`, `tabBundles` from background (or storage); toggle “Suggest context in palette”; display contexts; list bundles with Restore/Delete; optional “Open command center” link.
- Background: `getSettings`, `setSettings`; ensure `restoreBundle` can delete after restore if desired (or keep).
- Command center: ensure “Suggested” is hidden when setting is off; ensure bundle list doesn’t overwhelm (e.g. last 10).

**Expected output**

- Settings persist; options page is the place to manage bundles and suggestion preference.
- Demo script: (1) show manual launch, (2) open coding sites → show suggestion, (3) save tabs, (4) close all, (5) restore bundle.

**Demo milestone**

- “Full MVP demo in under 2 minutes: launch by command, detection suggestion, save/restore.”

---

## H. Killer viral feature

**Feature: “One-click time machine for your tabs”**

- **What:** A single, prominent action in the palette or toolbar: “**Save this moment**” — saves the current window’s tabs with one click (and optionally a name). Later, one click “**Restore**” or “**Yesterday’s coding**” to bring that exact set back. The hook is the framing: “Your browser never forgets. Save this moment. Restore it anytime.”
- **Why it’s demoable:** One short screen recording: “I had 12 tabs open; I clicked Save; I closed everything; I clicked Restore — everything’s back.” No explanation needed.
- **Why it feels magical:** Restore feels like rewinding the browser. Naming bundles “Monday focus” / “Research for project X” makes it feel like named checkpoints.
- **Why it’s useful:** Real use case: save before closing for the day; restore next morning. Or save “research stack” vs “coding stack” and switch between them.
- **Why people share:** “I never lose my tab chaos anymore” + before/after demo. Relatable pain.
- **Retention:** Habit of “save before I close” and “restore when I start” — daily touchpoints.

**Simplest MVP of this feature**

- One button in the palette: “Save current tabs” → prompt for name (or “Saved just now”) → store in `tabBundles`. Second section: “Restore” with a list of saved names (newest first, cap at 10–20). Restore = open those URLs in new tabs; optional: close current window. No groups, no sync, no timeline — just save + named restore. This is exactly the “save/restore tab bundle” in the MVP; the viral part is the naming and the “time machine” messaging in the UI and landing page.

---

## I. Risks and shortcuts

| Risk | Mitigation / shortcut |
|------|-------------------------|
| Service worker dies; “suggested context” lost | Recompute on demand when palette opens (query tabs, run matcher). Don’t rely on long-lived state. |
| Too many tabs → slow rules or UI | MVP: max 20–50 tabs per window; URL rules are simple substring/host; no regex. |
| Users expect “real” AI detection | Ship as “smart suggestions based on what you have open” (rule-based). Position as v1; “smarter detection later.” |
| Restore overwrites current work | Restore = open in new window (or new tabs in current window) and don’t close by default in MVP; or add “Replace current window” as explicit option. |
| Manifest V3 host_permissions | Keep `<all_urls>` for content script and optional future; background only needs `tabs`, `storage`; no need for script injection on every site if palette is iframe. |

---

## J. Final recommendation

1. **Keep the current UX:** ⌘K → iframe palette, same look and feel. Reuse existing command-center and content script; add only the new messages and background modules.
2. **Implement in this order:** (1) Hardcoded contexts + workflow executor + palette wiring (Day 1). (2) URL-rule matcher + suggested context + save/restore (Day 2). (3) Settings + bundle list in options + demo flow (Day 3).
3. **Ship the “Save this moment” framing** as the main shareable feature: same implementation as save/restore, but copy and UI that emphasize “time machine for tabs.”
4. **Defer:** AI, sync, tab grouping in workflow, multi-window semantics, regex rules, and full context CRUD UI until after the first demo and user feedback.

This gives you a clear architecture, a minimal but complete MVP in 2–3 days, and one strong viral angle that fits the same codebase.
