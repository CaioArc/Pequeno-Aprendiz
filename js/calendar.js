// ─── CALENDAR ENGINE ───
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const pad2 = n => String(n).padStart(2,'0');
const ymd = (y,m,d) => `${y}-${pad2(m+1)}-${pad2(d)}`;
const daysInMonth = (y,m) => new Date(y, m+1, 0).getDate();
const firstWeekday = (y,m) => new Date(y, m, 1).getDay();
const TODAY = new Date();
const TODAY_STR = ymd(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
const EVENTS_KEY = 'pa_events';
let userEvents = {};
try { userEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || '{}') || {}; } catch { userEvents = {}; }

const BASE_EVENT_DEFS = [
  { d:3,  title:'Reunião de Pais e Mestres', desc:'Auditório principal', time:'19:00', type:'warning' },
  { d:7,  title:'Simulado de Matemática', desc:'Capítulos 1 a 6', time:'08:00', type:'urgent' },
  { d:11, title:'Semana Cultural', desc:'Apresentações e oficinas', time:'—', type:'info' },
  { d:15, title:'Entrega – Redação', desc:'Português · dissertação', time:'23:59', type:'info' },
  { d:18, title:'Seminário de Biologia', desc:'Genética e hereditariedade', time:'10:00', type:'success' },
  { d:22, title:'Conselho de Classe', desc:'Reunião pedagógica', time:'14:00', type:'info' },
  { d:26, title:'Prova de Física', desc:'Termodinâmica', time:'08:00', type:'urgent' },
  { d:28, title:'Entrega de Notas', desc:'Fechamento do bimestre', time:'12:00', type:'success' }
];

function baseEventsFor(y,m) {
  const dim = daysInMonth(y,m);
  return BASE_EVENT_DEFS.filter(e => e.d <= dim).map(e => ({ ...e, date: ymd(y,m,e.d) }));
}
function eventsFor(dateStr) {
  const parts = dateStr.split('-').map(Number);
  const base = baseEventsFor(parts[0], parts[1]-1).filter(e => e.date === dateStr);
  const list = base.concat(userEvents[dateStr] || []);
  if(dateStr === TODAY_STR && !list.length) {
    list.push({ title:'Aulas do dia', desc:'Confira sua grade horária', time:'07:00', type:'info' });
  }
  return list;
}
function saveUserEvents() {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(userEvents)); } catch {}
}
function formatDateLong(dateStr) {
  const parts = dateStr.split('-').map(Number);
  return `${parts[2]} de ${MONTHS_PT[parts[1]-1]} de ${parts[0]}`;
}

let calState = { year: TODAY.getFullYear(), month: TODAY.getMonth(), selected: TODAY_STR };

function buildGrid(year, month, opts) {
  const frag = document.createDocumentFragment();
  WEEKDAYS_PT.forEach(w => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = w;
    frag.appendChild(el);
  });
  const startDay = firstWeekday(year, month);
  const dim = daysInMonth(year, month);
  const prevDim = daysInMonth(year, month-1);
  const cells = [];
  for(let i=startDay-1; i>=0; i--) cells.push({ d: prevDim-i, other:true, offset:-1 });
  for(let d=1; d<=dim; d++) cells.push({ d, offset:0 });
  let extra = 1;
  while(cells.length % 7 !== 0) cells.push({ d: extra++, other:true, offset:1 });

  cells.forEach(cell => {
    const cd = new Date(year, month + cell.offset, cell.d);
    const dateStr = ymd(cd.getFullYear(), cd.getMonth(), cd.getDate());
    const el = document.createElement('div');
    el.className = 'cal-day';
    if(cell.other) el.classList.add('other-month');
    if(dateStr === TODAY_STR) el.classList.add('today');
    const evs = eventsFor(dateStr);
    if(evs.length) el.classList.add('has-event');
    if(opts.selected && dateStr === opts.selected) el.classList.add('selected');
    const num = document.createElement('span');
    num.className = 'cal-day-num';
    num.textContent = cell.d;
    el.appendChild(num);
    el.title = evs.length ? `${evs.length} evento(s)` : '';
    el.addEventListener('click', () => opts.mini ? goToCalendar(dateStr) : selectDay(dateStr));
    frag.appendChild(el);
  });
  return frag;
}

function renderMiniCal() {
  const wrap = document.getElementById('miniCalGrid');
  if(!wrap) return;
  const lbl = document.getElementById('miniCalMonth');
  if(lbl) lbl.textContent = `${MONTHS_PT[calState.month]} ${calState.year}`;
  wrap.innerHTML = '';
  wrap.appendChild(buildGrid(calState.year, calState.month, { mini:true, selected: calState.selected }));
}

function renderFullCal() {
  const wrap = document.getElementById('fullCalGrid');
  if(!wrap) return;
  const lbl = document.getElementById('fullCalLabel');
  if(lbl) lbl.textContent = `${MONTHS_PT[calState.month]} ${calState.year}`;
  wrap.innerHTML = '';
  wrap.appendChild(buildGrid(calState.year, calState.month, { mini:false, selected: calState.selected }));
  renderEventList(calState.selected);
}

function renderEventList(dateStr) {
  const list = document.getElementById('calEventList');
  const sub = document.getElementById('calSideSub');
  if(!list) return;
  if(!dateStr) {
    if(sub) sub.textContent = 'Selecione um dia no calendário';
    list.innerHTML = '<div class="event-empty">Nenhum dia selecionado.</div>';
    return;
  }
  if(sub) sub.textContent = formatDateLong(dateStr);
  const evs = eventsFor(dateStr);
  if(!evs.length) {
    list.innerHTML = '<div class="event-empty">Nenhum evento neste dia.<br>Aproveite para descansar!</div>';
    return;
  }
  list.innerHTML = evs.map(e => `
    <div class="event-item ${e.type || 'info'}">
      <div class="event-item-info">
        <div class="event-item-title">${e.title}</div>
        <div class="event-item-desc">${e.desc || ''}</div>
      </div>
      <div class="event-item-time">${e.time || ''}</div>
    </div>`).join('');
}

function selectDay(dateStr) {
  calState.selected = dateStr;
  renderFullCal();
}

function calShift(delta) {
  let m = calState.month + delta, y = calState.year;
  if(m < 0) { m = 11; y--; }
  else if(m > 11) { m = 0; y++; }
  calState.year = y; calState.month = m;
  calState.selected = (y === TODAY.getFullYear() && m === TODAY.getMonth()) ? TODAY_STR : ymd(y, m, 1);
  renderFullCal();
  renderMiniCal();
}

function calToday() {
  calState.year = TODAY.getFullYear();
  calState.month = TODAY.getMonth();
  calState.selected = TODAY_STR;
  renderFullCal();
  renderMiniCal();
}

function goToCalendar(dateStr) {
  const parts = dateStr.split('-').map(Number);
  calState.year = parts[0]; calState.month = parts[1]-1; calState.selected = dateStr;
  goToPage('calendario');
  renderFullCal();
  renderMiniCal();
}

document.getElementById('miniCalPrev').addEventListener('click', () => {
  let m = calState.month - 1, y = calState.year;
  if(m < 0) { m = 11; y--; }
  calState.year = y; calState.month = m;
  renderMiniCal();
});
document.getElementById('miniCalNext').addEventListener('click', () => {
  let m = calState.month + 1, y = calState.year;
  if(m > 11) { m = 0; y++; }
  calState.year = y; calState.month = m;
  renderMiniCal();
});

function calAddEvent() {
  const dateStr = calState.selected || TODAY_STR;
  openModal(`
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas fa-calendar-plus"></i></div>
      <div><h3>Novo evento</h3><div class="modal-eyebrow">${formatDateLong(dateStr)}</div></div>
    </div>
    <div class="modal-body">
      <div class="form-group"><label>Título</label><input class="form-input" id="evTitle" placeholder="Ex.: Prova de Química" maxlength="60"></div>
      <div class="form-group"><label>Detalhes</label><input class="form-input" id="evDesc" placeholder="Opcional" maxlength="90"></div>
      <div style="display:flex;gap:12px">
        <div class="form-group" style="flex:1"><label>Horário</label><input class="form-input" id="evTime" placeholder="08:00" maxlength="5"></div>
        <div class="form-group" style="flex:1"><label>Tipo</label>
          <select class="select-input" id="evType" style="padding-left:12px">
            <option value="info">Informativo</option>
            <option value="urgent">Urgente</option>
            <option value="success">Novidade</option>
            <option value="warning">Atenção</option>
          </select>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="saveEvent('${dateStr}')">Salvar evento</button>
      </div>
    </div>`);
}

function saveEvent(dateStr) {
  const title = document.getElementById('evTitle').value.trim();
  if(!title) { showToast('Informe um título para o evento.','error'); return; }
  const desc = document.getElementById('evDesc').value.trim();
  const time = document.getElementById('evTime').value.trim() || '—';
  const type = document.getElementById('evType').value;
  if(!userEvents[dateStr]) userEvents[dateStr] = [];
  userEvents[dateStr].push({ title, desc, time, type });
  saveUserEvents();
  closeModal();
  calState.selected = dateStr;
  renderFullCal();
  renderMiniCal();
  showToast('Evento adicionado ao calendário!','success');
}

