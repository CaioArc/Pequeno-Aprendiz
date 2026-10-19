// ─── TOPBAR SEARCH ───
const topbarSearchInput = document.getElementById('topbarSearchInput');
const searchResults = document.getElementById('searchResults');
function runSearch() {
  if(!topbarSearchInput || !searchResults) return;
  const q = topbarSearchInput.value.trim().toLowerCase();
  if(!q) { searchResults.classList.remove('open'); searchResults.innerHTML = ''; return; }
  const isProf = document.body.classList.contains('role-professor');
  const items = Object.entries(pages).filter(([id]) => {
    const el = document.getElementById('page-'+id);
    if(!el) return false;
    if(el.classList.contains('page-aluno') && isProf) return false;
    if(el.classList.contains('page-prof') && !isProf) return false;
    return true;
  }).filter(([id, label]) => label.toLowerCase().includes(q) || id.includes(q));

  if(!items.length) {
    searchResults.innerHTML = `<div class="search-empty">Nada encontrado para "${q}".</div>`;
  } else {
    searchResults.innerHTML = items.map(([id, label], i) =>
      `<div class="search-result-item${i===0?' hl':''}" data-target="${id}"><i class="fas fa-arrow-right"></i>${label}</div>`
    ).join('');
    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        goToPage(el.dataset.target);
        topbarSearchInput.value = '';
        searchResults.classList.remove('open');
      });
    });
  }
  searchResults.classList.add('open');
}
if(topbarSearchInput) {
  topbarSearchInput.addEventListener('input', runSearch);
  topbarSearchInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') {
      const first = searchResults.querySelector('.search-result-item');
      if(first) { goToPage(first.dataset.target); topbarSearchInput.value = ''; searchResults.classList.remove('open'); }
    }
    if(e.key === 'Escape') searchResults.classList.remove('open');
  });
}
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('topbarSearchWrap');
  if(wrap && searchResults && !wrap.contains(e.target)) searchResults.classList.remove('open');
});

