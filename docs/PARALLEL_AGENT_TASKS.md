# Parallel agent tasks — 4 workstreams

Use one agent per task. Each task is independent; no shared file edits between agents.

---

## Agent 1 — Parser: `parseCommand(input, contexts) → context id`

**Scope**
- Implement `parseCommand(input: string, contexts: Context[]): string | null` in `extension/src/background/parser.ts`.
- Normalize input (trim, lowercase). Return the first `context.id` where `context.name` or `context.id` matches the input (literal or substring). No regex required for MVP.

**Files to modify**
- `extension/src/background/parser.ts` only.

**Do not touch**
- detector, executor, sessionManager, messageHandler, command-center UI, options UI, shared types.

**Acceptance criteria**
- `parseCommand('coding', CONTEXTS)` returns `'coding'`.
- `parseCommand('  Study  ', CONTEXTS)` returns `'study'` (if a context has id `study`).
- `parseCommand('xyz', CONTEXTS)` returns `null`.
- `parseCommand('', CONTEXTS)` returns `null`.

**Deliverable**
- Parser module with the above behavior; no changes to other modules. Callers (e.g. command center or message handler) can be wired in a later step.

---

## Agent 2 — Detector: `getContextForUrls` + `buildInferredState`

**Scope**
- Implement URL-rule matching in `extension/src/background/detector.ts`.
- `getContextForUrls(urls: string[], contexts: Context[]): Context | null`: for each context, evaluate its `urlRules` (type `host` or `substring` only in MVP). Return the first context that has at least one rule matching at least one URL. Order = order of `contexts` array.
- `buildInferredState(urls, contexts, tabIds)`: call `getContextForUrls`, map result to `InferredState` (contextId, contextName, confidence: 'high' | 'none', tabIds).

**Files to modify**
- `extension/src/background/detector.ts` only.

**Do not touch**
- parser, executor, sessionManager, messageHandler, command-center UI, options UI, shared types, contexts.ts (read-only).

**Acceptance criteria**
- For URLs containing `github.com`, `getContextForUrls` returns the Coding context (given current CONTEXTS in contexts.ts).
- For URLs containing `coursera.org`, returns Study context.
- If no rule matches, returns `null`.
- `buildInferredState` returns `{ contextId, contextName, confidence: 'high', tabIds }` when there is a match, else `{ contextId: null, contextName: null, confidence: 'none', tabIds }`.

**Deliverable**
- Detector module with the above behavior; no other files changed.

---

## Agent 3 — Command center: search/filter + keyboard nav (↑↓ Enter)

**Scope**
- In the React command palette (`extension/src/command-center/`): add a search input that filters the context list by name/summary (client-side, no new background APIs).
- Add keyboard navigation: ↑/↓ to change selection, Enter to run the selected context’s workflow (same as current click). Keep Esc to close (already via postMessage). Optional: focus search on mount (avoid autofocus in iframe if it causes console warnings).

**Files to modify**
- `extension/src/command-center/CommandCenterShell.tsx` (and optionally `index.css` only for focus/accessibility).

**Do not touch**
- background (parser, detector, executor, sessionManager, messageHandler), options, content script, shared types.

**Acceptance criteria**
- Typing in the search box filters the list (e.g. “cod” shows Coding).
- ↑/↓ move selection; Enter runs the selected workflow and closes the palette.
- Esc still closes the palette.
- No new message types or background changes.

**Deliverable**
- Updated CommandCenterShell with search state, filtered list, selectedIndex, and keydown handler.

---

## Agent 4 — Options + palette: delete bundle, “Save current tabs” in palette

**Scope**
- **Options page:** Add a “Delete” (or “Remove”) action per saved bundle in the list. On click, remove that bundle from storage and refresh the list (call a new background action `deleteBundle(bundleId)` or extend existing storage/message API).
- **Command center:** Add a “Save current tabs” (or “Save this moment”) item/button. On click, prompt for a name (or use a default like “Saved just now”), send `saveCurrentTabs` to background, show a brief success message, then optionally refresh or close.

**Files to modify**
- `extension/src/options/OptionsShell.tsx` — delete button + handler; optional: call new message.
- `extension/src/command-center/CommandCenterShell.tsx` — “Save current tabs” UI + prompt + sendMessage(SAVE_CURRENT_TABS).
- **Background:** `extension/src/background/messageHandler.ts` — add handler for `deleteBundle` (action + call to remove one bundle from storage). `extension/src/shared/messages.ts` — add `MSG.DELETE_BUNDLE` and request/response types if needed. `extension/src/shared/storage.ts` — add `deleteTabBundle(bundleId)` (read bundles, filter out id, write back).

**Do not touch**
- parser, detector, executor (except as already used by runWorkflow), content script. Agent 3’s keyboard/search logic (Agent 3 may have added state/handlers; prefer adding only the “Save current tabs” block and not refactoring Agent 3’s code).

**Acceptance criteria**
- Options: each saved bundle has a Delete button; clicking it removes that bundle and the list updates.
- Palette: “Save current tabs” triggers a name prompt (or default), sends save to background, shows success; bundles appear in options after save.
- No regression to runWorkflow or getContexts.

**Deliverable**
- Delete bundle (storage + message + options UI). Save current tabs (palette UI + existing saveCurrentTabs message). Both working end-to-end.

---

## Summary table

| Agent | Focus                    | Main files                                      | Deps        |
|-------|--------------------------|--------------------------------------------------|-------------|
| 1     | Parser                   | `background/parser.ts`                          | None        |
| 2     | Detector                 | `background/detector.ts`                        | None        |
| 3     | Command center UX        | `command-center/CommandCenterShell.tsx`         | None        |
| 4     | Delete bundle + Save UI   | `options/OptionsShell.tsx`, `CommandCenterShell.tsx`, `messageHandler.ts`, `messages.ts`, `storage.ts` | None        |

**Merge order:** Any order; only Agent 4 touches both options and command-center. If Agent 3 and 4 both edit `CommandCenterShell.tsx`, merge Agent 3 first, then add Agent 4’s “Save current tabs” block without overwriting Agent 3’s search/keyboard logic.
