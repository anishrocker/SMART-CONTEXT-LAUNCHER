# Smart Context Launcher – Browser Extension

Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) on **any website** to open the command center in a new tab.

## Install (Chrome / Edge / Brave)

1. Open the extensions page:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the `extension` folder inside this project.
4. The extension is now active. Use **⌘K** / **Ctrl+K** from any page to open the command center.

## Set the command center URL

- Default: `http://127.0.0.1:3000/launch` (local dev).
- To use a deployed app: right‑click the extension icon → **Options**, enter your URL (e.g. `https://your-app.com/launch`), and click **Save**.

## Requirements

- Your command center must be running (e.g. `npm run dev` for local, or your live site).
