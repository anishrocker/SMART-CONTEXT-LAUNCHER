/**
 * Background service worker entry.
 * - Listens for ⌘K (open command center).
 * - Handles messages from command-center and options (getContexts, runWorkflow, etc.).
 */

import { handleMessage } from './messageHandler';

// ---------------------------------------------------------------------------
// Keyboard command: open command center
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener((command: string) => {
  if (command === 'open-command-center') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id != null) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showSpotlight' }).catch(() => {
          // Tab may be chrome:// or extension page — open command center in new tab
          chrome.tabs.create({ url: chrome.runtime.getURL('src/command-center/index.html') });
        });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/command-center/index.html') });
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Message handling from UI (command-center, options)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: Record<string, unknown>, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    return handleMessage(message, sender, sendResponse);
  }
);
