# Smart Context Launcher — Extension scaffold

## Stack

- **Manifest V3** · **TypeScript** · **React** · **Tailwind** · **Vite**
- Modular layout: `src/background`, `src/content`, `src/command-center`, `src/options`, `src/shared`.

## Structure

```
extension/
├── public/
│   └── manifest.json
├── src/
│   ├── background/          # Service worker
│   │   ├── index.ts         # Entry: commands + onMessage
│   │   ├── types.ts         # (in shared) — Context, Workflow, Session, etc.
│   │   ├── contexts.ts      # Hardcoded CONTEXTS + WORKFLOWS
│   │   ├── contextMatcher.ts # TODO: getContextForUrls
│   │   ├── workflowExecutor.ts # runWorkflow (open tabs)
│   │   ├── sessionManager.ts   # save/restore tab bundles
│   │   ├── messageHandler.ts  # Dispatches getContexts, runWorkflow, etc.
│   │   ├── parser.ts        # TODO: parseCommand
│   │   └── detector.ts      # TODO: buildInferredState
│   ├── content/
│   │   └── index.ts         # Injects iframe for command palette
│   ├── command-center/      # React command palette
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── index.css        # Tailwind
│   │   └── CommandCenterShell.tsx
│   ├── options/             # React options page
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── OptionsShell.tsx
│   └── shared/
│       ├── types.ts         # Context, Workflow, Action, Session, Settings
│       ├── messages.ts      # MSG constants + sendMessage()
│       └── storage.ts       # getTabBundles, setTabBundles, getSettings, setSettings
├── dist/                    # Build output (load unpacked from here)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Commands

```bash
cd extension
npm install
npm run build
```

Then in Chrome: **Extensions** → **Load unpacked** → select the `extension/dist` folder.

## Shortcuts

- **⌘K** (Mac) / **Ctrl+K** (Windows): open command center (iframe on current tab, or new tab on chrome:// pages).

## What’s implemented (scaffold)

- Background: command handler, message handler (getContexts, runWorkflow, getSuggestedContext, save/restore bundles, get/set settings).
- Contexts: 2 hardcoded (Coding, Study) with URL rules and workflows.
- Executor: `runWorkflow` opens tabs for the `open` step.
- Session manager: save current window tabs as bundle; restore by id (open tabs).
- Storage: tab bundles and settings in `chrome.storage.local`.
- Command center: React shell, loads contexts and suggested context, runs workflow on click.
- Options: React shell, suggest-context toggle, saved bundles list with Restore.

## TODOs (no logic yet)

- **parser.ts**: `parseCommand(input, contexts)` → context id.
- **detector.ts**: `getContextForUrls(urls, contexts)` (host/substring rules); `buildInferredState`.
- **contextMatcher**: URL rule matching (detector is the matcher; rename or merge as you like).
- **Command center**: search/filter, keyboard nav (↑↓ Enter).
- **Options**: delete bundle, “Save current tabs” from palette.

## Types (see `src/shared/types.ts`)

- `Context`, `Workflow`, `WorkflowStep`, `UrlRule`
- `Action`, `Session`, `SessionTab`
- `InferredState`, `Settings`
- Message request/response shapes in `src/shared/messages.ts`
