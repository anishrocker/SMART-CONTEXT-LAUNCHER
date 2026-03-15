(function () {
  const CATEGORY_ORDER = [
    'Favorites',
    'Resume',
    'Personal',
    'Health & Fitness',
    'Creative',
    'Relax & Entertainment',
    'Daily Routine',
    'Study',
    'Work',
    'Development',
  ];

  let launchFlows = [];
  let favoriteCommandKeys = [];

  const searchEl = document.getElementById('search');
  const resultsEl = document.getElementById('results');
  let selectedIndex = 0;
  let matches = [];

  function sortByCategory(flows) {
    const order = {};
    CATEGORY_ORDER.forEach((c, i) => { order[c] = i; });
    return flows.slice().sort((a, b) => (order[a.category] ?? 99) - (order[b.category] ?? 99));
  }

  function getMatches(query) {
    const q = query.trim().toLowerCase();
    const list = !q
      ? launchFlows
      : launchFlows.filter(
          (f) => {
            const cmd = f.command.toLowerCase();
            const cmdNoSpaces = cmd.replace(/\s+/g, '');
            return cmd.includes(q) ||
              cmdNoSpaces.includes(q) ||
              q.replace(/\s+/g, '').includes(cmdNoSpaces) ||
              f.label.toLowerCase().includes(q) ||
              (f.category && f.category.toLowerCase().includes(q));
          }
        );
    return sortByCategory(list);
  }

  function groupMatchesByCategory() {
    const byCat = {};
    const catOrder = [];
    const favFlows = matches.filter(function (f) {
      return !f.isResume && favoriteCommandKeys.indexOf(f.command) >= 0;
    });
    if (favFlows.length > 0) {
      byCat['Favorites'] = favFlows.map(function (flow) {
        return { flow: flow, index: matches.indexOf(flow) };
      });
      catOrder.push('Favorites');
    }
    for (let i = 0; i < matches.length; i++) {
      const c = matches[i].category;
      if (c === 'Favorites') continue;
      if (!byCat[c]) { byCat[c] = []; catOrder.push(c); }
      byCat[c].push({ flow: matches[i], index: i });
    }
    var visibleItems = [];
    var seen = {};
    if (byCat['Favorites']) {
      byCat['Favorites'].forEach(function (item) {
        visibleItems.push(item);
        seen[item.flow.command] = true;
      });
    }
    catOrder.forEach(function (cat) {
      if (cat === 'Favorites') return;
      (byCat[cat] || []).forEach(function (item) {
        if (!seen[item.flow.command]) {
          visibleItems.push(item);
          seen[item.flow.command] = true;
        }
      });
    });
    return { byCat, catOrder, visibleItems: visibleItems };
  }

  function render() {
    matches = getMatches(searchEl.value);
    const grouped = groupMatchesByCategory();
    const visibleItems = grouped.visibleItems;
    selectedIndex = 0;
    if (visibleItems.length > 0) selectedIndex = 0;

    if (visibleItems.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state">' +
        (searchEl.value.trim() ? 'No results for "' + escapeHtml(searchEl.value.trim()) + '"' : 'Type to search (e.g. gym, focus, coding, meeting)') +
        '</div>';
      return;
    }

    const { byCat, catOrder } = grouped;
    let html = '';
    for (const cat of catOrder) {
      html += '<div class="category-header">' + escapeHtml(cat) + '</div>';
      for (const item of byCat[cat]) {
        const flow = item.flow;
        const visibleIndex = visibleItems.indexOf(item);
        const isSelected = visibleIndex === selectedIndex;
        const isResume = flow.isResume === true;
        const isFav = !isResume && favoriteCommandKeys.indexOf(flow.command) >= 0;
        const editUrl = !isResume && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL('options.html?command=' + encodeURIComponent(flow.command))
          : '#';
        const starTitle = isFav ? 'Remove from favorites' : 'Add to favorites';
        const starChar = isFav ? '★' : '☆';
        html += '<div class="result-item ' + (isSelected ? 'selected' : '') + '" data-index="' + visibleIndex + '">' +
          (isResume ? '' : '<button type="button" class="star-fav" data-command="' + escapeHtml(flow.command) + '" title="' + escapeHtml(starTitle) + '" aria-label="' + escapeHtml(starTitle) + '">' + starChar + '</button>') +
          '<span class="command">' + escapeHtml(flow.command) + '</span>' +
          '<span class="label">— ' + escapeHtml(flow.label) + '</span>' +
          '<span class="summary">' + escapeHtml(flow.summary) + '</span>' +
          (isResume ? '' : '<a href="' + editUrl + '" target="_blank" class="edit-urls" title="Edit URLs">Edit</a>') +
          '</div>';
      }
    }
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.result-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-urls') || e.target.classList.contains('star-fav')) return;
        var idx = Number(el.dataset.index);
        if (visibleItems[idx]) launch(visibleItems[idx].flow);
      });
      el.querySelectorAll('.edit-urls').forEach((a) => {
        a.addEventListener('click', (e) => e.stopPropagation());
      });
      el.querySelectorAll('.star-fav').forEach((btn) => {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          var cmd = btn.getAttribute('data-command');
          if (!cmd) return;
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'TOGGLE_FAVORITE', commandKey: cmd }, function (res) {
              if (res && res.commandKeys) { favoriteCommandKeys = res.commandKeys; render(); }
            });
          }
        });
      });
      el.addEventListener('mouseenter', function () {
        selectedIndex = Number(el.dataset.index);
        updateSelection();
      });
    });
  }

  function updateSelection() {
    resultsEl.querySelectorAll('.result-item').forEach((el) => {
      el.classList.toggle('selected', Number(el.dataset.index) === selectedIndex);
    });
    const selected = resultsEl.querySelector('.result-item.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function launch(flow) {
    if (flow.isResume && flow.contextKey) {
      chrome.runtime.sendMessage({ action: 'RESTORE_CONTEXT_TABS', contextKey: flow.contextKey }, function () {
        postClose();
      });
      return;
    }
    var urls = flow.urls || [];
    urls.forEach(function (u) {
      window.open(typeof u === 'string' ? u : u.url, '_blank', 'noopener,noreferrer');
    });
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage && flow.command) {
      var urlStrings = urls.map(function (u) { return typeof u === 'string' ? u : u.url; });
      chrome.runtime.sendMessage({ action: 'SAVE_CONTEXT_TABS', contextKey: flow.command, urls: urlStrings });
    }
    try {
      if (window.opener) window.opener.postMessage({ type: 'SMART_CONTEXT_LAUNCHER_CLOSE' }, '*');
    } catch (_) {}
    postClose();
  }

  function postClose() {
    try {
      window.parent.postMessage({ type: 'SMART_CONTEXT_LAUNCHER_CLOSE' }, '*');
    } catch (_) {}
  }

  searchEl.addEventListener('input', render);
  searchEl.addEventListener('keydown', (e) => {
    var visibleItems = groupMatchesByCategory().visibleItems;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleItems.length) selectedIndex = (selectedIndex + 1) % visibleItems.length;
      updateSelection();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleItems.length) selectedIndex = (selectedIndex - 1 + visibleItems.length) % visibleItems.length;
      updateSelection();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleItems[selectedIndex]) launch(visibleItems[selectedIndex].flow);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      postClose();
    }
  });

  document.getElementById('backdrop-close').addEventListener('click', postClose);

  function init() {
    const defaults = window.SMART_CONTEXT_LAUNCHER_COMMANDS;
    if (!defaults || !defaults.length) {
      launchFlows = [];
      render();
      searchEl.focus();
      return;
    }
    function finishInit() {
      function addResumeAndRender() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'GET_CONTEXTS_WITH_SAVED_TABS' }, function (res) {
            if (chrome.runtime.lastError) {
              render();
              searchEl.focus();
              return;
            }
            var keys = (res && res.contextKeys) ? res.contextKeys : [];
            keys.forEach(function (contextKey) {
              launchFlows.unshift({
                category: 'Resume',
                command: 'resume ' + contextKey,
                label: 'Resume ' + contextKey,
                summary: 'Restore tabs from last session',
                isResume: true,
                contextKey: contextKey,
                urls: [],
              });
            });
            render();
            searchEl.focus();
          });
        } else {
          render();
          searchEl.focus();
        }
      }
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: 'GET_FAVORITES' }, function (res) {
          if (!chrome.runtime.lastError && res && res.commandKeys) {
            favoriteCommandKeys = res.commandKeys;
          }
          addResumeAndRender();
        });
      } else {
        addResumeAndRender();
      }
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['urlOverrides', 'customCommands'], (data) => {
        const overrides = data.urlOverrides || {};
        const customCommands = data.customCommands || [];
        launchFlows = defaults.map((f) => ({
          ...f,
          urls: overrides[f.command] !== undefined ? overrides[f.command] : f.urls,
        }));
        customCommands.forEach((c) => {
          launchFlows.push({
            category: 'Personal',
            command: c.command,
            label: c.label || c.command,
            summary: (c.urls || []).map((u) => u.url).join(', ') || 'Custom',
            urls: c.urls && c.urls.length ? c.urls : [{ url: 'about:blank' }],
          });
        });
        finishInit();
      });
    } else {
      launchFlows = defaults.map((f) => ({ ...f }));
      finishInit();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // When opened as standalone tab (e.g. chrome:// page), close via Esc
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      window.close();
    }
  });
})();
