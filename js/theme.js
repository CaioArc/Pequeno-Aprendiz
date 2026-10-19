// ─── DARK MODE ───
function applyTheme(dark) {
  document.documentElement.classList.toggle('dark-mode', dark);
  const icon = document.getElementById('themeIcon');
  const btn = document.getElementById('themeToggle');
  if(icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
  if(btn) {
    btn.title = dark ? 'Modo claro' : 'Modo escuro';
    btn.classList.toggle('theme-on', dark);
  }
}
(function initTheme() {
  applyTheme(localStorage.getItem('pa_theme') === 'dark');
})();
document.getElementById('themeToggle').addEventListener('click', () => {
  const dark = !document.documentElement.classList.contains('dark-mode');
  localStorage.setItem('pa_theme', dark ? 'dark' : 'light');
  applyTheme(dark);
  showToast(dark ? 'Modo escuro ativado' : 'Modo claro ativado', 'info');
});

