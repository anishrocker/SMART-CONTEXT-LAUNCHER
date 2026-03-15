/**
 * Content script: injects command palette iframe when background sends showSpotlight.
 * Runs in page context; does not have access to chrome.storage or full extension APIs.
 */

const IFRAME_ID = 'smart-context-launcher-root';

function showSpotlight(): void {
  if (document.getElementById(IFRAME_ID)) return;

  const container = document.createElement('div');
  container.id = IFRAME_ID;
  const iframeSrc = chrome.runtime.getURL('src/command-center/index.html');
  container.innerHTML = `
    <div id="smart-context-launcher-backdrop"></div>
    <iframe id="smart-context-launcher-frame" src="${iframeSrc}"></iframe>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #${IFRAME_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #smart-context-launcher-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    #smart-context-launcher-frame {
      position: absolute;
      inset: 0;
      border: none;
      width: 100%;
      height: 100%;
      background: transparent;
    }
  `;

  document.documentElement.appendChild(style);
  document.body.appendChild(container);

  function close(): void {
    const el = document.getElementById(IFRAME_ID);
    if (el?.parentNode) {
      el.parentNode.removeChild(el);
    }
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('message', onMessage);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  function onMessage(e: MessageEvent): void {
    const frame = document.getElementById('smart-context-launcher-frame') as HTMLIFrameElement | null;
    if (!frame?.contentWindow || e.source !== frame.contentWindow) return;
    if (e.data?.type === 'SMART_CONTEXT_LAUNCHER_CLOSE') close();
  }

  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('message', onMessage);
}

chrome.runtime.onMessage.addListener((msg: { action?: string }) => {
  if (msg.action === 'showSpotlight') showSpotlight();
});
