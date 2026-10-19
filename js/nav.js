// ─── NAVIGATION ───
const pages = { dashboard:'Dashboard', 'dash-prof':'Dashboard', boletim:'Boletim de Notas', ava:'AVA', financeiro:'Financeiro', biblioteca:'Biblioteca Virtual', mensagens:'Mensagens', secretaria:'Secretaria', avaliacao:'Avaliação de Docentes', calendario:'Calendário', grade:'Grade de Disciplinas', historico:'Histórico Escolar', perfil:'Meu Perfil', carteira:'Carteira de Estudante', turmas:'Minhas Turmas', 'lancar-notas':'Lançar Notas', frequencia:'Frequência', diario:'Diário de Classe', avisos:'Avisos às turmas' };

let pageHistory = [];
let currentPageId = null;
let skipHistory = false;

function updateBackBtn() {
  const btn = document.getElementById('btnBack');
  if(!btn) return;
  btn.disabled = pageHistory.length === 0;
}
function goBack() {
  if(!pageHistory.length) return;
  const prev = pageHistory.pop();
  skipHistory = true;
  goToPage(prev);
  skipHistory = false;
  updateBackBtn();
}
function resetPageHistory() {
  pageHistory = [];
  currentPageId = null;
  updateBackBtn();
}
function goToPage(id) {
  const pg = document.getElementById('page-'+id);
  if(!pg) { showToast('Página não encontrada.','error'); return; }
  const isProf = document.body.classList.contains('role-professor');
  if(pg.classList.contains('page-aluno') && isProf) { showToast('Área exclusiva do aluno.','info'); return; }
  if(pg.classList.contains('page-prof') && !isProf) { showToast('Área exclusiva do professor.','info'); return; }
  if(!skipHistory && currentPageId && currentPageId !== id) {
    pageHistory.push(currentPageId);
    if(pageHistory.length > 20) pageHistory.shift();
  }
  currentPageId = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  pg.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === id));
  document.getElementById('topbarTitle').textContent = pages[id] || id;
  document.getElementById('profileMenu').classList.remove('open');
  closeSidebar();
  hideNavBadge(id);
  updateBackBtn();
}
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => goToPage(item.dataset.page));
});
const btnBack = document.getElementById('btnBack');
if(btnBack) btnBack.addEventListener('click', goBack);
document.querySelectorAll('[data-goto]:not(.notif-item)').forEach(el => {
  el.addEventListener('click', () => goToPage(el.dataset.goto));
});
const HERO_INFO = {
  campus: {
    title: 'Campus Pequeno Aprendiz',
    eyebrow: 'Infraestrutura',
    icon: 'fa-school',
    body: 'Laboratórios, biblioteca, salas interativas e pátio principal. Explore os espaços do colégio.',
    action: 'biblioteca',
    actionLabel: 'Ir à biblioteca'
  },
  cultural: {
    title: 'Semana Cultural',
    eyebrow: '07 a 11 de Abril',
    icon: 'fa-users',
    body: 'Apresentações, oficinas e mostra de projetos no pátio principal. Confira as datas no calendário.',
    action: 'calendario',
    actionLabel: 'Ver no calendário'
  }
};
document.querySelectorAll('.hero-panel[data-hero]').forEach(el => {
  el.addEventListener('click', () => {
    const info = HERO_INFO[el.dataset.hero];
    if(!info) { goToPage('calendario'); return; }
    openModal(`
      <div class="modal-head">
        <div class="modal-head-icon"><i class="fas ${info.icon}"></i></div>
        <div><h3>${info.title}</h3><div class="modal-eyebrow">${info.eyebrow}</div></div>
      </div>
      <div class="modal-body"><p>${info.body}</p></div>
      <div class="modal-actions">
        <button class="btn-outline" onclick="closeModal()">Fechar</button>
        <button class="btn-primary" onclick="closeModal();goToPage('${info.action}')">${info.actionLabel}</button>
      </div>`);
  });
});

// ─── MOBILE SIDEBAR ───
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay').classList.toggle('visible');
});
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

