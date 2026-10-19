// ─── AVA COURSE CARDS ───
document.querySelectorAll('.ava-course-card').forEach(card => {
  card.addEventListener('click', () => {
    const name    = (card.querySelector('.ava-course-name') || {}).textContent || 'Curso';
    const teacher = (card.querySelector('.ava-teacher') || {}).textContent || '';
    const prog    = (card.querySelector('.ava-progress-label span:last-child') || {}).textContent || '0%';
    const metas   = [...card.querySelectorAll('.ava-meta span')].map(s => s.textContent.trim());
    const img     = card.querySelector('.ava-thumb img');
    openModal(`
      <div class="modal-head">
        <div class="modal-head-icon"><i class="fas fa-graduation-cap"></i></div>
        <div><h3>${name.trim()}</h3><div class="modal-eyebrow">${teacher.trim()}</div></div>
      </div>
      ${img ? `<img src="${img.src}" alt="${name.trim()}" style="width:100%;height:170px;object-fit:cover;border-radius:14px;margin-bottom:16px">` : ''}
      <div class="modal-body">
        <span class="modal-tag">Progresso: ${prog.trim()}</span>
        <div class="ava-progress" style="margin-bottom:16px"><div class="ava-progress-fill" style="width:${prog.replace('%','')}%"></div></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${metas.map(m => `<span class="modal-tag" style="margin:0">${m}</span>`).join('')}
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-outline" onclick="closeModal()">Fechar</button>
        <button class="btn-primary" onclick="closeModal();showToast('Abrindo a próxima aula...','success')"><i class="fas fa-play"></i> Continuar</button>
      </div>`);
  });
});

