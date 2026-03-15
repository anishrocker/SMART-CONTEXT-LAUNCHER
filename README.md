# SMART CONTEXT LAUNCHER

## Current Status (Implementation Started)

This repository now includes a runnable Next.js + TypeScript + Tailwind MVP skeleton with:
- a keyboard-driven command palette (`CMD/Ctrl + K`),
- command parsing with fuzzy/alias scoring,
- staged workflow execution engine,
- pluggable integrations registry,
- sample contexts (`study`, `work`),
- Convex schema starter,
- parallel development agent plan in `docs/parallel-development-agents.md`.

### Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and press `CMD/Ctrl + K`.

---

# SMART CONTEXT LAUNCHER — MVP Engineering Blueprint

## 1) Product Definition

### Problem it solves
People switch into modes ("study", "work", "gym") but today they manually open a stack of apps/tabs/tools each time. This causes:
- repeated setup friction,
- cognitive overhead,
- inconsistent routines,
- context-switch delays.

SMART CONTEXT LAUNCHER solves this by turning a single intent command into a **multi-action context launch**.

### Why context launching is better than manual opening
- **One intent, many actions:** users express *mode* not tool-by-tool instructions.
- **Reduced startup time:** launch all needed resources in one execution.
- **Consistency:** standardized context recipes improve habit formation.
- **Lower cognitive load:** users decide *what they are doing* (study/work), not *how to assemble* every session.
- **Extensible automation base:** natural foundation for richer automations later.

### Primary user personas
1. **Developers**
   - Commands: `work`, `bugfix`, `standup`
   - Context outputs: task board, calendar, project notes, communication tools.
2. **Students**
   - Commands: `study`, `revision`, `exam`
   - Context outputs: focus timer, notes doc, blocker mode, references.
3. **Creators**
   - Commands: `record`, `edit`, `publish`
   - Context outputs: notes/capture board, soundtrack playlist, checklist.

---

## 2) MVP Scope

### Minimum viable features (v1)
- Global browser command palette (CMD/Ctrl + K).
- Command input with fuzzy matching and alias support.
- Context registry stored in Convex.
- Preview panel showing actions before execute.
- Workflow executor supporting:
  - sequential action groups,
  - parallel action groups.
- MVP integrations:
  - open URL,
  - start timer (in-app),
  - open internal notes,
  - open Spotify playlist URL,
  - open task board URL.
- Execution feedback (running/success/partial-failure).
- Context editor CRUD for contexts/workflows/actions.

### Core user flow (open launcher → execute context)
1. User presses **CMD/Ctrl + K**.
2. Palette overlay opens focused on command input.
3. User types `study`.
4. System provides ranked suggestions + preview of actions.
5. User presses Enter.
6. Execution engine resolves workflow DAG/stages.
7. Actions run sequentially and/or in parallel per definition.
8. UI shows progress and completion with links/opened resources.
9. Execution log written to Convex.

### Version 2 features
- Personalized ranking via usage history.
- Scheduled/automatic context launch.
- Conditional actions (time/day/device).
- Real OAuth integrations (Slack, Google Calendar).
- Smart context suggestions based on active tasks.
- Team-shared contexts + permissions.

---

## 3) Architecture Design

### Frontend structure (Next.js App Router)
- **App shell:** global layout, keyboard listeners, theme.
- **Launcher domain:** input, suggestion list, preview panel, hotkeys.
- **Context management domain:** list/detail editor, action builder.
- **Execution domain:** runtime event state, progress toasts/panel.
- **Client state strategy:**
  - Convex React hooks for server state,
  - lightweight local state (Zustand or React context) for transient UI/runtime state.

### Backend services (Convex)
Use Convex as primary backend/API + persistence.

Function groups:
- `contexts.*` — CRUD contexts and aliases.
- `commands.*` — resolve command text to context candidates.
- `workflows.*` — CRUD workflow/action definitions.
- `executions.*` — create execution record, append action status updates.
- `integrations.*` — metadata for integration providers and credentials references.
- `analytics.*` (optional MVP-lite) — usage counters for suggestion ranking.

### Workflow execution model
- Orchestrator starts from a context’s active workflow.
- Workflow consists of **stages**:
  - actions within a stage execute in parallel,
  - stages execute sequentially.
- Retry policy per action (`none`, `once`, configurable later).
- Execution emits event stream updates to UI.

### Integrations system
- Registry-based plugin abstraction.
- Each integration exposes:
  - metadata,
  - config schema,
  - validate method,
  - execute handler.
- MVP can run integration handlers in browser-safe mode for URL/timer/notes actions; future sensitive integrations can move to server-side handlers.

---

## 4) Data Model

> Convex tables shown conceptually; final schema typed in `convex/schema.ts`.

### `Context`
- `id`
- `name` (e.g., “Study Session”)
- `slug` (unique)
- `description`
- `icon`
- `color`
- `isActive`
- `defaultCommandId`
- `workflowId`
- `tags[]`
- `createdBy`
- `createdAt`, `updatedAt`

### `Command`
- `id`
- `contextId`
- `phrase` (primary trigger, e.g., `study`)
- `aliases[]` (e.g., `focus`, `learn`)
- `keywords[]`
- `priority` (manual ranking override)
- `usageCount`
- `lastUsedAt`
- `createdAt`, `updatedAt`

### `Workflow`
- `id`
- `contextId`
- `name`
- `version`
- `isActive`
- `stages[]` (ordered stage IDs or embedded structure)
- `failurePolicy` (`continue` | `halt`)
- `createdAt`, `updatedAt`

### `Action`
- `id`
- `workflowId`
- `stageIndex`
- `type` (`open_url` | `start_timer` | `open_notes` | `play_music` | `launch_integration`)
- `integrationKey` (nullable for native actions)
- `config` (JSON typed per action)
- `timeoutMs`
- `retryPolicy`
- `isEnabled`
- `order`

### `Integration`
- `id`
- `key` (unique, e.g., `spotify`)
- `name`
- `category` (`media`, `productivity`, `communication`)
- `authType` (`none`, `oauth`, `token`)
- `configSchema` (JSON schema)
- `isInstalled`
- `isEnabled`
- `createdAt`, `updatedAt`

### `ExecutionLog`
- `id`
- `contextId`
- `workflowId`
- `commandText`
- `status` (`queued`, `running`, `success`, `partial_failure`, `failed`)
- `startedAt`, `endedAt`
- `actionResults[]`:
  - `actionId`
  - `status`
  - `startedAt`, `endedAt`
  - `output`/`error`
- `triggeredBy`

---

## 5) Command System Design

### Fuzzy search
- Normalize input: lowercase, trim, remove extra spaces.
- Scoring components:
  1. exact phrase match (highest),
  2. prefix match,
  3. alias match,
  4. keyword fuzzy distance,
  5. recency/usage boosts.
- Return top N candidates with score explanation for debugging.

### Aliases
- Commands maintain `aliases[]` mapped to same context.
- Alias collisions allowed but resolved via score + usage + recency.

### Suggestions
- Show likely context while typing.
- Include “action summary chips” (e.g., `3 actions • 1 parallel stage`).

### Autocomplete
- Tab to complete highest-ranked command.
- Arrow keys to navigate candidate list.

### Unknown command behavior
- If no confident match:
  - show “No exact context found”.
  - offer: create new context from input phrase.
  - offer closest 2–3 fuzzy candidates.
- Log unknown phrases to support future context creation.

---

## 6) Workflow Execution Design

### Action modes
- **Sequential:** stage N+1 waits for stage N completion.
- **Parallel:** all actions in the same stage fire concurrently.

### Supported action examples (MVP)
- `open_url({ url, target })`
- `start_timer({ durationMinutes, label })`
- `open_notes({ noteId | templateId })`
- `play_music({ provider: 'spotify', playlistUrl })`
- `launch_integration({ integrationKey, payload })`

### Execution engine behavior
1. Resolve command → context → active workflow.
2. Validate workflow/action schema.
3. Create `ExecutionLog` in `queued` then `running`.
4. For each stage in order:
   - execute all enabled actions in parallel (`Promise.allSettled` semantics),
   - write per-action result,
   - if stage failure + workflow policy `halt`, terminate.
5. Aggregate final status:
   - all success → `success`,
   - mixed → `partial_failure`,
   - critical fail/early stop → `failed`.
6. Stream updates to UI feedback panel.

---

## 7) Integrations Architecture

### MVP integrations
- **Open URL:** generic browser tab/window open.
- **Start timer:** in-app timer service (client runtime + persisted state optional).
- **Open internal notes:** route to `/notes/[id]`.
- **Open Spotify playlist:** URL launch to playlist.
- **Open task board:** URL launch to board tool.

### Future integrations
- Slack
- Google Calendar
- Local desktop apps
- User automation scripts

### Pluggable design
- Integration registry at `/integrations/registry.ts`.
- Standard interface:
  - `key`, `displayName`, `actionTypes`,
  - `validateConfig(config)`,
  - `execute(context)`.
- Action config stored as JSON but validated by integration schema.
- New integration requires:
  1. add adapter module,
  2. register adapter,
  3. expose config UI schema.
- Keep core executor integration-agnostic.

---

## 8) UI/UX Design

### Command palette interaction
- Trigger: **CMD/Ctrl + K**.
- Modal centered with:
  - command input,
  - ranked contexts list,
  - right-side preview of actions + execution mode.
- Enter executes selected context.
- Escape closes launcher.

### Screen designs
1. **Launcher**
   - Input, suggestions, preview, quick execute.
2. **Context Editor**
   - Context metadata form,
   - commands/aliases editor,
   - workflow builder with stage-based drag/reorder,
   - action config panel per action type.
3. **Execution Feedback**
   - real-time progress timeline,
   - per-action status badges,
   - success/failure summary + retry failed actions.

UX guardrails:
- keyboard-first navigation,
- clear pre-execution preview,
- non-blocking errors (where possible),
- visible “what happened” audit trail.

---

## 9) Repository Structure

```text
/app
  /(launcher)
  /(editor)
  /notes
  /api (only if needed outside Convex)
/components
  /launcher
  /editor
  /execution
/core
  /parser
  /context-engine
  /executor
  /ranking
/workflows
  /schemas
  /builder
/integrations
  /adapters
  /schemas
  registry.ts
/convex
  schema.ts
  contexts.ts
  commands.ts
  workflows.ts
  executions.ts
  integrations.ts
/types
  context.ts
  workflow.ts
  execution.ts
/hooks
  useCommandPalette.ts
  useExecuteContext.ts
  useExecutionFeed.ts
```

---

## 10) Parallel Development Agents

### Agent 1 — Parser
- Build normalization, fuzzy scoring, alias resolution.
- Expose interface:
  - `resolveCommand(input): RankedContext[]`.

### Agent 2 — Workflow Engine
- Implement stage execution runtime and status aggregation.
- Expose interface:
  - `executeWorkflow(workflowId, trigger): ExecutionResult`.

### Agent 3 — Integrations
- Build integration registry + 5 MVP adapters.
- Expose interface:
  - `executeAction(action, runtimeCtx): ActionResult`.

### Agent 4 — UI
- Build launcher modal, preview pane, editor, execution feedback.
- Consume interfaces from Agents 1–3.

### Integration contracts (critical)
- Shared `types/` package is source of truth.
- Weekly contract sync (or PR checks) to avoid interface drift.

---

## 11) Implementation Roadmap

### Phase 1 — Command palette
- UI shell, hotkey, input, static suggestions.
- Keyboard navigation + accessibility baseline.

### Phase 2 — Contexts database
- Convex schema + CRUD for contexts/commands/workflows.
- Basic editor to create and modify contexts.

### Phase 3 — Workflow execution
- Runtime engine with staged sequential/parallel semantics.
- Execution log persistence and basic feedback UI.

### Phase 4 — Integrations
- URL/timer/notes/Spotify/task board adapters.
- Validation and error handling per adapter.

### Phase 5 — Polish
- ranking improvements,
- unknown command capture,
- reliability tuning,
- onboarding sample contexts.

---

## 12) First 10 Engineering Tickets

1. Set up Next.js App Router + Tailwind + Convex baseline skeleton.
2. Define Convex schema for Context, Command, Workflow, Action, ExecutionLog, Integration.
3. Implement `CMD/Ctrl + K` launcher modal with keyboard controls.
4. Build command parser service with fuzzy scoring + aliases.
5. Create context CRUD UI and Convex mutations.
6. Implement workflow builder (stage model + action list editor).
7. Implement execution engine with sequential/parallel stage support.
8. Add ExecutionLog write/read and real-time status feed.
9. Implement MVP integrations (open_url, timer, notes, spotify URL, task board URL).
10. Build execution preview + post-run feedback panel (success/partial/failure).

---

## 13) Risks and Technical Tradeoffs

- **Browser constraints:** cannot launch true local native apps in MVP.
  - Mitigation: URL-first integrations and architecture ready for Tauri.
- **Popup blockers:** opening many tabs can be blocked unless user-triggered.
  - Mitigation: execute from explicit Enter action and prefer same-tab workspace links where possible.
- **Fuzzy matching ambiguity:** short commands may collide.
  - Mitigation: scoring transparency + alias/editor controls + usage-based ranking.
- **Over-flexible JSON configs:** can become inconsistent.
  - Mitigation: strict schema validation per action/integration.
- **Real-time orchestration complexity:** concurrent updates can race.
  - Mitigation: event ordering by timestamp/sequence and idempotent status updates.

---

## 14) Path to Desktop Launcher with Tauri

Design MVP with portability boundaries:

1. **Keep core logic framework-agnostic**
   - Parser, workflow engine, and integration contracts in `/core` + `/types`.
2. **Abstract side effects behind adapters**
   - Browser adapters now; later add Tauri adapters (open native apps, OS automation).
3. **Preserve backend model**
   - Convex remains cloud state + sync backend for both web and desktop clients.
4. **Introduce capability layer**
   - `Capabilities` service checks environment: web vs tauri.
5. **Add desktop-only integrations in vNext**
   - local app launching, shell scripts, OS focus modes.

Migration strategy:
- Reuse UI and domain logic in Tauri webview.
- Replace browser-limited integrations with native plugins gradually.
- Maintain compatibility by keeping action types stable and adding optional platform-specific fields.

---

## Immediate Build Start Checklist
- Confirm schema and types as contract v0.
- Stand up command palette vertical slice (`study` demo context).
- Demo end-to-end: input → preview → execute 3 actions → log completion.
- Then split into the 4 agent workstreams above.
