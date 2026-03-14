const DEFAULT_URL = 'http://127.0.0.1:3000/launch';

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ commandCenterUrl: DEFAULT_URL }, (data) => {
    document.getElementById('url').value = data.commandCenterUrl;
  });

  document.getElementById('save').addEventListener('click', () => {
    const url = document.getElementById('url').value.trim() || DEFAULT_URL;
    chrome.storage.sync.set({ commandCenterUrl: url }, () => {
      const status = document.createElement('span');
      status.textContent = ' Saved';
      status.style.color = '#1e8e3e';
      document.getElementById('save').after(status);
      setTimeout(() => status.remove(), 2000);
    });
  });
});
