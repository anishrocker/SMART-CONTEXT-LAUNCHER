# Smart Context Launcher – Browser Extension

Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) on **any webpage** to open a **Spotlight-style command center** over the page. No new tab — a floating search bar and results, like Apple Spotlight.

## Install (Chrome / Edge / Brave)

1. Open the extensions page:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension` folder inside this project.
4. On any site, press **⌘K** / **Ctrl+K** to open the command center overlay.

## How it works

- **Spotlight-style UI:** Centered search bar with blurred backdrop, list of results below.
- **Search:** Type e.g. `gym` or `study`; use ↑↓ to move, **Enter** to launch.
- **Launch:** Opens the related links in new tabs (e.g. gym → Strava, Spotify, Timer).
- **Close:** **Esc** or click outside (when implemented).

On restricted pages (e.g. `chrome://`) where the overlay can’t run, the shortcut opens the command center in a new tab instead.

## Edit URLs for commands

You can change which links open for each command (add, edit, or remove URLs):

1. **From the command center:** Click **Edit** next to any result to open the options page for that command.
2. **From the extension:** Right-click the extension icon → **Options**, or go to `chrome://extensions` → Smart Context Launcher → **Extension options**.

In the options page, expand a command to see its URLs. Use **+ Add URL**, edit or **Remove** each row, or **Reset to default**. Click **Save all changes** to store your custom URLs (they sync across your Chrome profile).
