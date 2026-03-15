(function () {
  const CATEGORY_ORDER = [
    'Health & Fitness',
    'Creative',
    'Relax & Entertainment',
    'Daily Routine',
    'Study',
    'Work',
    'Development',
    'Personal',
  ];

  let launchFlows = [];

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
    for (let i = 0; i < matches.length; i++) {
      const c = matches[i].category;
      if (!byCat[c]) { byCat[c] = []; catOrder.push(c); }
      byCat[c].push({ flow: matches[i], index: i });
    }
    return { byCat, catOrder };
  }

  function render() {
    matches = getMatches(searchEl.value);
    selectedIndex = 0;
    if (matches.length > 0) selectedIndex = 0;

    if (matches.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state">' +
        (searchEl.value.trim() ? `No results for “${ escapeHtml(searchEl.value.trim()) }”` : 'Type to search (e.g. gym, focus, coding, meeting)') +
        '</div>';
      return;
    }

    const { byCat, catOrder } = groupMatchesByCategory();
    let html = '';
    for (const cat of catOrder) {
      html += '<div class="category-header">' + escapeHtml(cat) + '</div>';
      for (const item of byCat[cat]) {
        const index = item.index;
        const flow = item.flow;
        const editUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL('options.html?command=' + encodeURIComponent(flow.command))
          : '#';
        html += '<div class="result-item ' + (index === selectedIndex ? 'selected' : '') + '" data-index="' + index + '">' +
          '<span class="command">' + escapeHtml(flow.command) + '</span>' +
          '<span class="label">— ' + escapeHtml(flow.label) + '</span>' +
          '<span class="summary">' + escapeHtml(flow.summary) + '</span>' +
          '<a href="' + editUrl + '" target="_blank" class="edit-urls" title="Edit URLs">Edit</a></div>';
      }
    }
    resultsEl.innerHTML = html;

    resultsEl.querySelectorAll('.result-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-urls')) return;
        launch(matches[Number(el.dataset.index)]);
      });
      el.querySelectorAll('.edit-urls').forEach((a) => {
        a.addEventListener('click', (e) => e.stopPropagation());
      });
      el.addEventListener('mouseenter', () => {
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
    flow.urls.forEach(({ url }) => window.open(url, '_blank', 'noopener,noreferrer'));
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
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (matches.length) selectedIndex = (selectedIndex + 1) % matches.length;
      updateSelection();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (matches.length) selectedIndex = (selectedIndex - 1 + matches.length) % matches.length;
      updateSelection();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[selectedIndex]) launch(matches[selectedIndex]);
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
        render();
        searchEl.focus();
      });
    } else {
      launchFlows = defaults.map((f) => ({ ...f }));
      render();
      searchEl.focus();
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
