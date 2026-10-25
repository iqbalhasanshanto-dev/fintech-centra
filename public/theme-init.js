(function () {
  try {
    var hint = localStorage.getItem('centra_theme_hint');
    if (hint === 'dark') {
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
