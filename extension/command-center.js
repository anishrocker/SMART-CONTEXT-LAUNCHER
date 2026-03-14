(function () {
  const launchFlows = [
    {
      command: 'gym',
      label: 'Workout stack',
      summary: 'Workout tracker, Music, Timer',
      urls: [
        { url: 'https://www.strava.com' },
        { url: 'https://open.spotify.com' },
        { url: 'https://timer-tab.com' },
      ],
    },
    {
      command: 'study',
      label: 'Focus stack',
      summary: 'Focus timer, Notes, Blocking apps',
      urls: [
        { url: 'https://pomofocus.io' },
        { url: 'https://keep.google.com' },
        { url: 'https://freedom.to' },
      ],
    },
  ];

  const searchEl = document.getElementById('search');
  const resultsEl = document.getElementById('results');
  let selectedIndex = 0;
  let matches = [];

  function getMatches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return launchFlows;
    return launchFlows.filter(
      (f) =>
        f.command.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q)
    );
  }

  function render() {
    matches = getMatches(searchEl.value);
    selectedIndex = 0;
    if (matches.length > 0) selectedIndex = 0;

    if (matches.length === 0) {
      resultsEl.innerHTML = '<div class="empty-state">' +
        (searchEl.value.trim() ? `No results for “${ escapeHtml(searchEl.value.trim()) }”` : 'Type to search (e.g. gym, study)') +
        '</div>';
      return;
    }

    resultsEl.innerHTML = matches
      .map(
        (flow, i) => `
        <div class="result-item ${ i === selectedIndex ? 'selected' : '' }" data-index="${ i }">
          <span class="command">${ escapeHtml(flow.command) }</span>
          <span class="label">— ${ escapeHtml(flow.label) }</span>
          <span class="summary">${ escapeHtml(flow.summary) }</span>
        </div>
      `
      )
      .join('');

    resultsEl.querySelectorAll('.result-item').forEach((el) => {
      el.addEventListener('click', () => launch(matches[Number(el.dataset.index)]));
      el.addEventListener('mouseenter', () => {
        selectedIndex = Number(el.dataset.index);
        updateSelection();
      });
    });
  }

  function updateSelection() {
    resultsEl.querySelectorAll('.result-item').forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
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
    render();
    searchEl.focus();
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
