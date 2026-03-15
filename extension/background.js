function injectSpotlightOnPage(iframeUrl) {
  if (document.getElementById('smart-context-launcher-root')) return;
  var root = document.createElement('div');
  root.id = 'smart-context-launcher-root';
  root.innerHTML =
    '<div id="smart-context-launcher-backdrop"></div>' +
    '<iframe id="smart-context-launcher-frame" src="' + iframeUrl + '"></iframe>';
  var style = document.createElement('style');
  style.textContent =
    '#smart-context-launcher-root{position:fixed;inset:0;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
    '#smart-context-launcher-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.35);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}' +
    '#smart-context-launcher-frame{position:absolute;inset:0;border:none;width:100%;height:100%;background:transparent}';
  document.documentElement.appendChild(style);
  document.body.appendChild(root);
  function close() {
    var el = document.getElementById('smart-context-launcher-root');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('message', onMessage);
  }
  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
  function onMessage(e) {
    var frame = document.getElementById('smart-context-launcher-frame');
    if (!frame || e.source !== frame.contentWindow) return;
    if (e.data && e.data.type === 'SMART_CONTEXT_LAUNCHER_CLOSE') close();
  }
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('message', onMessage);
}

var TAB_MEMORY_KEY = 'lastTabsByContext';
var LAST_RUN_CONTEXT_KEY = 'lastRunContextKey';

function getTabMemory() {
  return new Promise(function (resolve) {
    chrome.storage.local.get([TAB_MEMORY_KEY], function (data) {
      var obj = data[TAB_MEMORY_KEY];
      resolve(typeof obj === 'object' && obj !== null ? obj : {});
    });
  });
}

function setTabMemory(contextKey, urls) {
  return getTabMemory().then(function (mem) {
    mem[contextKey] = { urls: urls, openedAt: Date.now() };
    return chrome.storage.local.set({ [TAB_MEMORY_KEY]: mem });
  });
}

function getLastRunContext() {
  return new Promise(function (resolve) {
    chrome.storage.local.get([LAST_RUN_CONTEXT_KEY, TAB_MEMORY_KEY], function (data) {
      var key = data[LAST_RUN_CONTEXT_KEY];
      var mem = data[TAB_MEMORY_KEY];
      if (!key || typeof mem !== 'object' || !mem[key] || !Array.isArray(mem[key].urls) || mem[key].urls.length === 0) {
        resolve(null);
        return;
      }
      resolve(key);
    });
  });
}

function getContextsWithSavedTabs() {
  return getLastRunContext().then(function (key) {
    return key ? [key] : [];
  });
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  var action = msg && msg.action;
  if (action === 'SAVE_CONTEXT_TABS') {
    var contextKey = msg.contextKey;
    var urls = msg.urls;
    if (contextKey && Array.isArray(urls)) {
      setTabMemory(contextKey, urls).then(function () {
        return chrome.storage.local.set({ [LAST_RUN_CONTEXT_KEY]: contextKey });
      }).then(function () { sendResponse({ ok: true }); });
    } else {
      sendResponse({ ok: false });
    }
    return true;
  }
  if (action === 'RESTORE_CONTEXT_TABS') {
    var contextKey = msg.contextKey;
    if (!contextKey) {
      sendResponse({ ok: false, error: 'missing contextKey' });
      return true;
    }
    getTabMemory().then(function (mem) {
      var saved = mem[contextKey];
      if (!saved || !saved.urls || !saved.urls.length) {
        sendResponse({ ok: false, error: 'no saved session' });
        return;
      }
      Promise.all(saved.urls.map(function (url) {
        return chrome.tabs.create({ url: url });
      })).then(function () {
        sendResponse({ ok: true, count: saved.urls.length });
      }).catch(function (err) {
        sendResponse({ ok: false, error: String(err) });
      });
    });
    return true;
  }
  if (action === 'GET_CONTEXTS_WITH_SAVED_TABS') {
    getContextsWithSavedTabs().then(function (keys) {
      sendResponse({ contextKeys: keys });
    });
    return true;
  }
  if (action === 'GET_FAVORITES') {
    chrome.storage.local.get(['favoriteCommands'], function (data) {
      var arr = data.favoriteCommands;
      sendResponse({ commandKeys: Array.isArray(arr) ? arr : [] });
    });
    return true;
  }
  if (action === 'TOGGLE_FAVORITE') {
    var commandKey = msg.commandKey;
    if (commandKey == null || commandKey === '') {
      sendResponse({ ok: false, commandKeys: [] });
      return true;
    }
    chrome.storage.local.get(['favoriteCommands'], function (data) {
      var arr = Array.isArray(data.favoriteCommands) ? data.favoriteCommands.slice() : [];
      var i = arr.indexOf(commandKey);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(commandKey);
      chrome.storage.local.set({ favoriteCommands: arr }, function () {
        sendResponse({ ok: true, commandKeys: arr });
      });
    });
    return true;
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-command-center') {
    var commandCenterUrl = chrome.runtime.getURL('command-center.html');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || tabs[0].id == null) {
        chrome.tabs.create({ url: commandCenterUrl });
        return;
      }
      var tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { action: 'showSpotlight' }).catch(() => {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: injectSpotlightOnPage,
          args: [commandCenterUrl]
        }).catch(() => {
          chrome.tabs.create({ url: commandCenterUrl });
        });
      });
    });
  }
});
