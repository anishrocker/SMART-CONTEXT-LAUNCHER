(function () {
  let overlay = null;

  function showSpotlight() {
    if (overlay) return;

    const container = document.createElement('div');
    container.id = 'smart-context-launcher-root';
    container.innerHTML = `
      <div id="smart-context-launcher-backdrop"></div>
      <iframe id="smart-context-launcher-frame" src="${chrome.runtime.getURL('command-center.html')}"></iframe>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #smart-context-launcher-root {
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
    overlay = container;

    function close() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        overlay = null;
      }
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('message', onMessage);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }

    function onMessage(e) {
      const frame = document.getElementById('smart-context-launcher-frame');
      if (!frame || e.source !== frame.contentWindow) return;
      if (e.data && e.data.type === 'SMART_CONTEXT_LAUNCHER_CLOSE') close();
    }

    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('message', onMessage);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'showSpotlight') showSpotlight();
  });
})();
