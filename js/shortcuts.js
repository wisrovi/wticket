export function initKeyboardShortcuts(options = {}) {
  const { onNewTicket, onSearch, onRefresh, onToggleTheme } = options;

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if (key === 'n' || (e.ctrlKey && key === 'n')) {
      e.preventDefault();
      if (onNewTicket) onNewTicket();
    }

    if (key === '/' || (e.ctrlKey && key === 'f')) {
      e.preventDefault();
      if (onSearch) onSearch();
    }

    if (key === 'r' && !e.ctrlKey) {
      e.preventDefault();
      if (onRefresh) onRefresh();
    }

    if (key === 'd') {
      e.preventDefault();
      if (onToggleTheme) onToggleTheme();
    }
  });
}
