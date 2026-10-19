// ─── BOLETIM POR BIMESTRE ───
const BOLETIM_SUBJECTS = ['Matemática','Português','Física','Química','História','Biologia','Inglês'];
const BOLETIM_BASE = { 'Matemática':8.9, 'Português':8.4, 'Física':6.6, 'Química':8.2, 'História':8.8, 'Biologia':7.4, 'Inglês':6.0 };
function pillClass(v) { return v >= 8 ? 'a' : (v >= 6 ? 'b' : 'c'); }
function renderBoletim(bim) {
  const body = document.getElementById('boletimBody');
  if(!body) return;
  body.innerHTML = BOLETIM_SUBJECTS.map((s,i) => {
    const base = BOLETIM_BASE[s];
    const seed = (((i+1)*(bim+2)) % 5) - 2;
    const avg  = Math.min(10, Math.max(0, +(base + seed*0.2).toFixed(1)));
    const p1   = Math.min(10, +(avg + 0.3).toFixed(1));
    const trab = Math.max(0, +(avg - 0.4).toFixed(1));
    const part = Math.min(10, Math.round(avg));
    const freq = 80 + ((i*7 + bim*5) % 20);
    let situ;
    if(avg >= 7)        situ = '<span class="status-badge paid"><i class="fas fa-check"></i> Aprovado</span>';
    else if(avg >= 5.5) situ = '<span class="status-badge pending"><i class="fas fa-clock"></i> Atenção</span>';
    else                situ = '<span class="status-badge late"><i class="fas fa-exclamation"></i> Recuperação</span>';
    return `<tr>
      <td><strong>${s}</strong></td>
      <td><span class="grade-pill ${pillClass(p1)}">${p1.toFixed(1)}</span></td>
      <td><span class="grade-pill ${pillClass(trab)}">${trab.toFixed(1)}</span></td>
      <td><span class="grade-pill ${pillClass(part)}">${part}</span></td>
      <td><strong>${avg.toFixed(1)}</strong></td>
      <td><div class="progress-bar-wrap"><div class="progress-bar" style="width:${freq}%"></div></div> ${freq}%</td>
      <td>${situ}</td>
    </tr>`;
  }).join('');
}
const boletimTabs = document.getElementById('boletimTabs');
if(boletimTabs) {
  boletimTabs.querySelectorAll('.periodo-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      boletimTabs.querySelectorAll('.periodo-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderBoletim(parseInt(tab.dataset.bim, 10) || 0);
    });
  });
}

