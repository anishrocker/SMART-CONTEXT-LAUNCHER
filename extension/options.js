(function () {
  const commands = window.SMART_CONTEXT_LAUNCHER_COMMANDS || [];
  let overrides = {}; // command -> [ { url }, ... ]
  let customCommands = []; // [ { command, label, urls: [ { url } ] } ]
  const listEl = document.getElementById('command-list');
  const personalListEl = document.getElementById('personal-list');
  const saveBtn = document.getElementById('save-btn');
  const saveMsg = document.getElementById('save-msg');

  function getParams() {
    const m = /command=([^&]+)/.exec(window.location.search || '');
    return m ? decodeURIComponent(m[1]) : null;
  }

  function renderCommand(cmd, expanded) {
    const urls = overrides[cmd.command] !== undefined ? overrides[cmd.command] : cmd.urls;
    const block = document.createElement('div');
    block.className = 'command-block';
    block.dataset.command = cmd.command;
    block.innerHTML =
      '<div class="command-head">' +
        '<span><span class="command-name">' + escapeHtml(cmd.command) + '</span>' +
        '<span class="command-cat">' + escapeHtml(cmd.category) + '</span></span>' +
        '<span class="expand">' + (expanded ? '−' : '+') + '</span>' +
      '</div>' +
      '<div class="command-body' + (expanded ? '' : ' hidden') + '">' +
        '<div class="url-list"></div>' +
        '<button type="button" class="btn add-url">+ Add URL</button>' +
        '<button type="button" class="btn btn-danger reset-urls" style="margin-left:8px;margin-top:8px">Reset to default</button>' +
      '</div>';
    const urlList = block.querySelector('.url-list');
    const body = block.querySelector('.command-body');
    const addBtn = block.querySelector('.add-url');
    const resetBtn = block.querySelector('.reset-urls');

    function renderUrls() {
      const list = overrides[cmd.command] !== undefined ? overrides[cmd.command] : cmd.urls;
      urlList.innerHTML = '';
      list.forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'url-row';
        row.innerHTML =
          '<input type="url" value="' + escapeHtml(u.url) + '" placeholder="https://..." data-i="' + i + '">' +
          '<button type="button" class="btn btn-danger remove-url">Remove</button>';
        row.querySelector('input').addEventListener('change', (e) => {
          const arr = overrides[cmd.command] !== undefined ? overrides[cmd.command].slice() : cmd.urls.map((x) => ({ url: x.url }));
          arr[i] = { url: e.target.value.trim() || u.url };
          overrides[cmd.command] = arr;
        });
        row.querySelector('.remove-url').addEventListener('click', () => {
          const arr = overrides[cmd.command] !== undefined ? overrides[cmd.command].slice() : cmd.urls.map((x) => ({ url: x.url }));
          arr.splice(i, 1);
          if (arr.length) overrides[cmd.command] = arr;
          else delete overrides[cmd.command];
          renderUrls();
        });
        urlList.appendChild(row);
      });
    }

    addBtn.addEventListener('click', () => {
      const arr = overrides[cmd.command] !== undefined ? overrides[cmd.command].slice() : cmd.urls.map((x) => ({ url: x.url }));
      arr.push({ url: 'https://' });
      overrides[cmd.command] = arr;
      renderUrls();
    });
    resetBtn.addEventListener('click', () => {
      delete overrides[cmd.command];
      renderUrls();
    });

    block.querySelector('.command-head').addEventListener('click', () => {
      const isHidden = body.classList.contains('hidden');
      body.classList.toggle('hidden', !isHidden);
      block.querySelector('.expand').textContent = isHidden ? '−' : '+';
    });

    renderUrls();
    return block;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderPersonalCommand(custom, index, expanded) {
    const block = document.createElement('div');
    block.className = 'command-block personal-cmd';
    block.dataset.command = custom.command;
    block.dataset.index = String(index);
    block.innerHTML =
      '<div class="command-head">' +
        '<span><span class="command-name">' + escapeHtml(custom.command) + '</span>' +
        '<span class="command-cat">Personal</span>' +
        '<span class="expand">' + (expanded ? '−' : '+') + '</span></span>' +
        '<button type="button" class="btn btn-danger delete-cmd">Delete</button>' +
      '</div>' +
      '<div class="command-body' + (expanded ? '' : ' hidden') + '">' +
        '<div class="url-list"></div>' +
        '<button type="button" class="btn add-url">+ Add URL</button>' +
      '</div>';
    const urlList = block.querySelector('.url-list');
    const body = block.querySelector('.command-body');
    const addBtn = block.querySelector('.add-url');

    function renderUrls() {
      const list = (customCommands[index] && customCommands[index].urls) ? customCommands[index].urls : (custom.urls || []);
      urlList.innerHTML = '';
      (list || []).forEach((u, i) => {
        const row = document.createElement('div');
        row.className = 'url-row';
        row.innerHTML =
          '<input type="url" value="' + escapeHtml(u.url) + '" placeholder="https://...">' +
          '<button type="button" class="btn btn-danger remove-url">Remove</button>';
        row.querySelector('input').addEventListener('change', (e) => {
          if (!customCommands[index]) return;
          const arr = customCommands[index].urls.slice();
          arr[i] = { url: e.target.value.trim() || u.url };
          customCommands[index].urls = arr;
        });
        row.querySelector('.remove-url').addEventListener('click', () => {
          if (!customCommands[index]) return;
          customCommands[index].urls.splice(i, 1);
          if (customCommands[index].urls.length === 0) customCommands[index].urls = [{ url: 'https://' }];
          renderUrls();
        });
        urlList.appendChild(row);
      });
    }

    addBtn.addEventListener('click', () => {
      if (!customCommands[index]) return;
      customCommands[index].urls.push({ url: 'https://' });
      renderUrls();
    });

    const expandSpan = block.querySelector('.expand');
    block.querySelector('.command-head').addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-cmd')) return;
      const isHidden = body.classList.contains('hidden');
      body.classList.toggle('hidden', !isHidden);
      if (expandSpan) expandSpan.textContent = isHidden ? '−' : '+';
    });
    block.querySelector('.delete-cmd').addEventListener('click', (e) => {
      e.stopPropagation();
      customCommands.splice(index, 1);
      chrome.storage.sync.set({ customCommands: customCommands });
      renderPersonal();
    });

    renderUrls();
    return block;
  }

  function renderPersonal() {
    personalListEl.innerHTML = '';
    customCommands.forEach((c, i) => {
      personalListEl.appendChild(renderPersonalCommand(c, i, false));
    });
  }

  function render() {
    listEl.innerHTML = '';
    const focusCommand = getParams();
    commands.forEach((cmd) => {
      const expanded = focusCommand === cmd.command;
      listEl.appendChild(renderCommand(cmd, expanded));
    });
    renderPersonal();
    if (focusCommand) {
      const el = Array.from(listEl.querySelectorAll('[data-command]')).find(
        (n) => n.getAttribute('data-command') === focusCommand
      );
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function harvestInputs() {
    listEl.querySelectorAll('.command-block').forEach((block) => {
      const command = block.getAttribute('data-command');
      const inputs = block.querySelectorAll('.url-list input[type="url"]');
      if (inputs.length === 0) return;
      const urls = Array.from(inputs).map((inp) => ({ url: inp.value.trim() || inp.value }));
      const defaultUrls = (commands.find((c) => c.command === command) || {}).urls || [];
      const same = defaultUrls.length === urls.length && defaultUrls.every((d, i) => d.url === (urls[i] && urls[i].url));
      const filtered = urls.filter((u) => u.url);
      if (same || filtered.length === 0) delete overrides[command];
      else overrides[command] = filtered;
    });
  }

  function save() {
    harvestInputs();
    chrome.storage.sync.set({ urlOverrides: overrides, customCommands: customCommands }, () => {
      saveMsg.classList.remove('hidden');
      setTimeout(() => saveMsg.classList.add('hidden'), 2000);
    });
  }

  saveBtn.addEventListener('click', save);

  document.getElementById('back-to-command-center').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = chrome.runtime.getURL('command-center.html');
  });

  const personalForm = document.getElementById('personal-form');
  const addPersonalBtn = document.getElementById('add-personal-cmd');
  const cancelPersonalBtn = document.getElementById('cancel-personal-cmd');
  addPersonalBtn.addEventListener('click', () => {
    personalForm.classList.remove('hidden');
    document.getElementById('new-command').focus();
  });
  cancelPersonalBtn.addEventListener('click', () => {
    personalForm.classList.add('hidden');
    document.getElementById('new-command').value = '';
    document.getElementById('new-label').value = '';
    document.getElementById('new-urls').value = '';
  });
  document.getElementById('save-personal-cmd').addEventListener('click', () => {
    const trigger = (document.getElementById('new-command').value || '').trim().toLowerCase();
    const label = (document.getElementById('new-label').value || '').trim() || trigger;
    const urlsText = (document.getElementById('new-urls').value || '').trim();
    const urls = urlsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => ({ url: s.indexOf('://') !== -1 ? s : 'https://' + s }));
    if (!trigger) {
      alert('Enter a trigger word (e.g. mywork).');
      return;
    }
    if (urls.length === 0) {
      alert('Add at least one URL.');
      return;
    }
    customCommands.push({ command: trigger, label: label, urls: urls });
    chrome.storage.sync.set({ customCommands: customCommands });
    personalForm.classList.add('hidden');
    document.getElementById('new-command').value = '';
    document.getElementById('new-label').value = '';
    document.getElementById('new-urls').value = '';
    renderPersonal();
  });

  chrome.storage.sync.get(['urlOverrides', 'customCommands'], (data) => {
    overrides = data.urlOverrides ? JSON.parse(JSON.stringify(data.urlOverrides)) : {};
    customCommands = data.customCommands ? JSON.parse(JSON.stringify(data.customCommands)) : [];
    render();
    renderPersonal();
  });
})();
