(function () {
  try {
    var mode = localStorage.getItem('centra_theme_mode');
    var hint = localStorage.getItem('centra_theme_hint');
    var isDark;
    if (mode === 'dark' || (!mode && hint === 'dark')) {
      isDark = true;
    } else if (mode === 'light' || (!mode && hint === 'light')) {
      isDark = false;
    } else {
      // mode === 'system' or unset on first launch
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {
    // Gracefully handle storage errors without throwing
  }
})();
