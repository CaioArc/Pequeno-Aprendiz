// ─── BIBLIOTECA ───
const booksGrid = document.getElementById('booksGrid');
const bookCards = booksGrid ? [...booksGrid.querySelectorAll('.book-card')] : [];
function openBook(card) {
  const title  = (card.querySelector('.book-title') || {}).textContent || 'Livro';
  const author = (card.querySelector('.book-author') || {}).textContent || '';
  const tag    = (card.querySelector('.book-tag') || {}).textContent || '';
  const img    = card.querySelector('img');
  openModal(`
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-book-open"></i></div>
      <div><h3>${title.trim()}</h3><div class="modal-eyebrow">${author.trim()}</div></div>
    </div>
    ${img ? `<img src="${img.src}" alt="${title.trim()}" style="width:100%;height:190px;object-fit:cover;border-radius:14px;margin-bottom:16px">` : ''}
    <div class="modal-body">
      <span class="modal-tag">${tag.trim()}</span>
      <p style="margin:8px 0 12px">Disponível na biblioteca virtual. Leia online ou baixe o PDF para estudar offline.</p>
      <div class="modal-detail-row"><strong>Formato</strong><span>PDF · ePub</span></div>
      <div class="modal-detail-row"><strong>Disponibilidade</strong><span>Livre acesso</span></div>
    </div>
    <div class="modal-actions">
      <button class="btn-outline" onclick="closeModal()">Fechar</button>
      <button class="btn-primary" onclick="closeModal();showToast('Abrindo o livro para leitura...','success')"><i class="fas fa-book-reader"></i> Ler agora</button>
    </div>`);
}
bookCards.forEach(card => card.addEventListener('click', () => openBook(card)));

const libSearchInput = document.getElementById('libSearchInput');
function filterBooks() {
  if(!booksGrid) return;
  const q = (libSearchInput.value || '').trim().toLowerCase();
  let visible = 0;
  bookCards.forEach(c => {
    const match = !q || c.textContent.toLowerCase().includes(q);
    c.style.display = match ? '' : 'none';
    if(match) visible++;
  });
  let empty = document.getElementById('libEmpty');
  if(visible === 0) {
    if(!empty) {
      empty = document.createElement('div');
      empty.id = 'libEmpty';
      empty.className = 'event-empty';
      empty.style.gridColumn = '1 / -1';
      empty.innerHTML = '<i class="fas fa-search"></i><br>Nenhum livro encontrado para a sua busca.';
      booksGrid.appendChild(empty);
    }
  } else if(empty) {
    empty.remove();
  }
}
if(libSearchInput) libSearchInput.addEventListener('input', filterBooks);
const libSearchBtn = document.getElementById('libSearchBtn');
if(libSearchBtn) libSearchBtn.addEventListener('click', () => {
  filterBooks();
  const q = (libSearchInput.value || '').trim();
  showToast(q ? `Buscando por "${q}"...` : 'Mostrando todos os livros.', 'info');
});

