chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-command-center') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showSpotlight' }).catch(() => {
          // Tab might be chrome:// or extension page where we can't inject
          chrome.tabs.create({ url: chrome.runtime.getURL('command-center.html') });
        });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('command-center.html') });
      }
    });
  }
});
