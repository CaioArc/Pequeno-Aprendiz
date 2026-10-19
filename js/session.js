// ─── CPF MASK ───
function cpfMask(v) {
  v = v.replace(/\D/g,'');
  if(v.length<=3) return v;
  if(v.length<=6) return v.slice(0,3)+'.'+v.slice(3);
  if(v.length<=9) return v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6);
  return v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9,11);
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=280&q=80';

function photoKey(cpf) { return 'pa_photo_' + (cpf || 'guest'); }
function getStoredPhoto(cpf) { return localStorage.getItem(photoKey(cpf)) || DEFAULT_PHOTO; }
function applyPhoto(src) {
  document.querySelectorAll('.js-user-photo').forEach(el => { el.src = src; });
}
function openPhotoPicker() {
  document.getElementById('profileMenu').classList.remove('open');
  document.getElementById('photoInput').click();
}
function resetPhoto() {
  const session = getSession();
  if(session) localStorage.removeItem(photoKey(session.cpf));
  applyPhoto(DEFAULT_PHOTO);
  showToast('Foto restaurada para o padrão.','info');
}
function compressImage(file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 360;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function formatCpf(cpf) {
  const v = (cpf || '').replace(/\D/g,'');
  if(v.length !== 11) return cpf || '—';
  return v.slice(0,3)+'.'+v.slice(3,6)+'.'+v.slice(6,9)+'-'+v.slice(9);
}

let loginRole = 'aluno';
function setLoginRole(role) {
  loginRole = role === 'professor' ? 'professor' : 'aluno';
  const isProf = loginRole === 'professor';
  document.getElementById('roleAluno').classList.toggle('active', !isProf);
  document.getElementById('roleProf').classList.toggle('active', isProf);
  document.getElementById('regRoleAluno').classList.toggle('active', !isProf);
  document.getElementById('regRoleProf').classList.toggle('active', isProf);
  document.getElementById('roleHint').classList.toggle('show', isProf);
  document.getElementById('loginTitle').textContent = isProf ? 'Portal do Professor' : 'Entrar no portal';
  document.getElementById('loginSubtitle').textContent = isProf
    ? 'Acesso para docentes e profissionais da instituição'
    : 'Use o CPF e a senha cadastrados na secretaria';
  document.getElementById('signupTitle').textContent = isProf ? 'Cadastro docente' : 'Criar Conta';
  document.getElementById('signupSubtitle').textContent = isProf
    ? 'Preencha os dados da equipe escolar'
    : 'Preencha seus dados para se cadastrar';
  document.getElementById('regSerieWrap').style.display = isProf ? 'none' : 'block';
  document.getElementById('regDiscWrap').style.display = isProf ? 'block' : 'none';
  document.getElementById('btnLoginText').textContent = isProf ? 'Entrar como professor' : 'Entrar no Portal';
  const sTitle = document.getElementById('successTitle');
  const sText = document.getElementById('successText');
  if(sTitle) sTitle.textContent = isProf ? 'Cadastro docente enviado!' : 'Conta criada com sucesso!';
  if(sText) sText.textContent = isProf
    ? 'Seu cadastro passará pela aprovação da coordenação. Após liberado, acesse com CPF e senha na opção Professor.'
    : 'Enviamos um e-mail de confirmação. Verifique sua caixa de entrada e acesse com seu CPF e senha.';
}

function applyRole(role) {
  const isProf = role === 'professor';
  document.body.classList.toggle('role-professor', isProf);
  document.body.classList.toggle('role-aluno', !isProf);
  const label = document.getElementById('portalLabel');
  if(label) label.textContent = isProf ? 'Portal do Professor' : 'Portal do Aluno';
  const navHome = document.getElementById('navHome');
  const navHomeLabel = document.getElementById('navHomeLabel');
  if(navHome) navHome.dataset.page = isProf ? 'dash-prof' : 'dashboard';
  if(navHomeLabel) navHomeLabel.textContent = 'Dashboard';
}

function toggleFreq(btn) {
  const on = btn.classList.toggle('on');
  btn.classList.toggle('off', !on);
  btn.textContent = on ? 'P' : 'F';
}

// ─── APPLY SESSION TO UI ───
function applySession(session) {
  const nomeCompleto = `${session.nome} ${session.sobrenome}`;
  const iniciais = (session.nome[0] + (session.sobrenome ? session.sobrenome[0] : '')).toUpperCase();
  const isProf = (session.role || 'aluno') === 'professor';
  applyRole(session.role || 'aluno');
  document.querySelectorAll('.user-avatar').forEach(el => { if(!el.querySelector('img')) el.textContent = iniciais; });
  document.querySelectorAll('.user-name').forEach(el => el.textContent = nomeCompleto);
  document.querySelectorAll('.user-role').forEach(el => {
    el.textContent = isProf
      ? `Professor(a)${session.disciplina ? ' – ' + session.disciplina : ''}`
      : (session.serie ? `Aluno(a) – ${session.serie}` : 'Aluno(a)');
  });
  const greet = document.querySelector('#page-dashboard .greeting-text h3');
  if(greet) greet.textContent = `Ola, ${session.nome}! Bem-vindo(a) de volta`;
  const greetProf = document.getElementById('greetProf');
  if(greetProf) greetProf.textContent = `Ola, Prof. ${session.nome}!`;
  const chipDisc = document.getElementById('chipDisc');
  if(chipDisc) chipDisc.textContent = session.disciplina || 'Docente';
  const histTitle = document.querySelector('#page-historico .card-title');
  if(histTitle) histTitle.innerHTML = `<i class="fas fa-scroll"></i> Histórico – ${nomeCompleto}`;
  applyPhoto(getStoredPhoto(session.cpf));
  const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val || '—'; };
  setTxt('perfilNome', nomeCompleto);
  setTxt('perfilCpf', formatCpf(session.cpf));
  setTxt('perfilEmail', session.email);
  setTxt('perfilSerie', isProf ? (session.disciplina || 'Docente') : session.serie);
  setTxt('perfilTurno', session.turno);
  setTxt('carteiraNome', nomeCompleto);
  setTxt('carteiraCpf', formatCpf(session.cpf));
  setTxt('carteiraSerie', [session.serie, session.turno].filter(Boolean).join(' · '));
  resetPageHistory();
  goToPage(isProf ? 'dash-prof' : 'dashboard');
}

