/**
 * Background service worker entry.
 * - Listens for ⌘K (open command center).
 * - Shows command center as overlay on current page; only opens new tab if injection fails (e.g. chrome://).
 */

import { handleMessage } from './messageHandler';

// Injected into the tab when content script isn't loaded (must be self-contained for executeScript)
function injectSpotlightOnPage(iframeUrl: string): void {
  if (document.getElementById('smart-context-launcher-root')) return;
  const root = document.createElement('div');
  root.id = 'smart-context-launcher-root';
  root.innerHTML =
    '<div id="smart-context-launcher-backdrop"></div>' +
    '<iframe id="smart-context-launcher-frame" src="' + iframeUrl + '"></iframe>';
  const style = document.createElement('style');
  style.textContent =
    '#smart-context-launcher-root{position:fixed;inset:0;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '#smart-context-launcher-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}' +
    '#smart-context-launcher-frame{position:absolute;inset:0;border:none;width:100%;height:100%;background:transparent}';
  document.documentElement.appendChild(style);
  document.body.appendChild(root);
  function close(): void {
    const el = document.getElementById('smart-context-launcher-root');
    if (el?.parentNode) el.parentNode.removeChild(el);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('message', onMessage);
  }
  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }
  function onMessage(e: MessageEvent): void {
    const frame = document.getElementById('smart-context-launcher-frame');
    if (!frame || e.source !== (frame as HTMLIFrameElement).contentWindow) return;
    if (e.data?.type === 'SMART_CONTEXT_LAUNCHER_CLOSE') close();
  }
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('message', onMessage);
}

// ---------------------------------------------------------------------------
// Keyboard command: open command center on current page
// ---------------------------------------------------------------------------

chrome.commands.onCommand.addListener((command: string) => {
  if (command !== 'open-command-center') return;
  const commandCenterUrl = chrome.runtime.getURL('command-center.html');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) {
      chrome.tabs.create({ url: commandCenterUrl });
      return;
    }
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { action: 'showSpotlight' }).catch(() => {
      chrome.scripting.executeScript({
        target: { tabId },
        func: injectSpotlightOnPage,
        args: [commandCenterUrl],
      }).catch(() => {
        chrome.tabs.create({ url: commandCenterUrl });
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Message handling from UI (command-center, options)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(
  (message: Record<string, unknown>, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    return handleMessage(message, sender, sendResponse);
  }
);
