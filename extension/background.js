const DEFAULT_COMMAND_CENTER_URL = 'http://127.0.0.1:3000/launch';

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-command-center') {
    chrome.storage.sync.get({ commandCenterUrl: DEFAULT_COMMAND_CENTER_URL }, (data) => {
      chrome.tabs.create({ url: data.commandCenterUrl });
    });
  }
});
