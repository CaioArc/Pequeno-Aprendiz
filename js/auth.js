// ─── LOGIN ───
const cpfInput = document.getElementById('cpfInput');
cpfInput.addEventListener('input', () => { cpfInput.value = cpfMask(cpfInput.value); });

const togglePw = document.getElementById('togglePw');
const pwInput  = document.getElementById('pwInput');
const eyeIcon  = document.getElementById('eyeIcon');
togglePw.addEventListener('click', () => {
  const vis = pwInput.type === 'password';
  pwInput.type = vis ? 'text' : 'password';
  eyeIcon.className = vis ? 'fas fa-eye-slash' : 'fas fa-eye';
});

function performLogin() {
  const cpf = cpfInput.value.replace(/\D/g,'');
  const pw  = pwInput.value;

  document.getElementById('cpfError').classList.remove('show');
  document.getElementById('pwError').classList.remove('show');
  cpfInput.classList.remove('input-error');
  pwInput.classList.remove('input-error');

  let ok = true;
  if(cpf.length !== 11) {
    document.getElementById('cpfError').textContent = 'CPF inválido. Verifique o formato.';
    document.getElementById('cpfError').classList.add('show');
    cpfInput.classList.add('input-error');
    ok = false;
  }
  if(pw.length < 3) {
    document.getElementById('pwError').textContent = 'Digite sua senha.';
    document.getElementById('pwError').classList.add('show');
    pwInput.classList.add('input-error');
    ok = false;
  }
  if(!ok) return;

  const account = findAccount(cpf);
  if(!account) {
    document.getElementById('cpfError').textContent = 'CPF não encontrado. Crie uma conta primeiro.';
    document.getElementById('cpfError').classList.add('show');
    cpfInput.classList.add('input-error');
    const tabSignup = document.getElementById('tabSignup');
    tabSignup.style.background = 'var(--yellow)';
    tabSignup.style.color = 'var(--gray-800)';
    setTimeout(() => { tabSignup.style.background = ''; tabSignup.style.color = ''; }, 1500);
    return;
  }
  const accRole = account.role || 'aluno';
  if(accRole !== loginRole) {
    const msg = loginRole === 'professor'
      ? 'Esta conta é de aluno. Selecione a opção Aluno.'
      : 'Esta conta é de professor. Selecione a opção Professor.';
    document.getElementById('cpfError').textContent = msg;
    document.getElementById('cpfError').classList.add('show');
    cpfInput.classList.add('input-error');
    return;
  }
  if(account.senha !== pw) {
    document.getElementById('pwError').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('pwError').classList.add('show');
    pwInput.classList.add('input-error');
    return;
  }

  const remember = document.getElementById('rememberMe').checked;
  if(remember) localStorage.setItem('pa_remember', JSON.stringify({ cpf: cpfInput.value, role: loginRole }));
  else localStorage.removeItem('pa_remember');

  const btn = document.getElementById('btnLogin');
  const txt = document.getElementById('btnLoginText');
  const spinner = document.getElementById('loginSpinner');
  txt.style.display = 'none'; spinner.style.display = 'block'; btn.disabled = true;
  setSession(account);

  setTimeout(() => {
    document.getElementById('login-page').style.display = 'none';
    const loader = document.getElementById('pageLoader');
    loader.classList.add('active');
    setTimeout(() => {
      loader.classList.remove('active');
      document.getElementById('app').classList.add('active');
      applySession(account);
      showToast(account.role === 'professor' ? `Bem-vindo(a), Prof. ${account.nome}!` : `Bem-vindo(a), ${account.nome}!`, 'success');
      txt.style.display = 'block'; spinner.style.display = 'none'; btn.disabled = false;
      cpfInput.value = ''; pwInput.value = '';
    }, 1800);
  }, 1000);
}
document.getElementById('btnLogin').addEventListener('click', performLogin);
[cpfInput, pwInput].forEach(el => el.addEventListener('keydown', e => { if(e.key === 'Enter') performLogin(); }));

// ─── FORGOT PASSWORD ───
document.getElementById('forgotLink').addEventListener('click', () => {
  document.getElementById('forgotModal').classList.add('open');
});
document.getElementById('cancelForgot').addEventListener('click', () => {
  document.getElementById('forgotModal').classList.remove('open');
});
document.getElementById('forgotCpf').addEventListener('input', function() { this.value = cpfMask(this.value); });
document.getElementById('sendRecovery').addEventListener('click', () => {
  const cpfEl = document.getElementById('forgotCpf');
  const emailEl = document.getElementById('forgotEmail');
  const cpfErr = document.getElementById('forgotCpfError');
  const emailErr = document.getElementById('forgotEmailError');
  cpfErr.classList.remove('show'); emailErr.classList.remove('show');
  cpfEl.classList.remove('input-error'); emailEl.classList.remove('input-error');
  const cpf = cpfEl.value.replace(/\D/g,'');
  const email = emailEl.value.trim();
  let ok = true;
  if(cpf.length !== 11) { cpfErr.classList.add('show'); cpfEl.classList.add('input-error'); ok = false; }
  if(!email || !email.includes('@')) { emailErr.classList.add('show'); emailEl.classList.add('input-error'); ok = false; }
  if(!ok) return;
  const acc = findAccount(cpf);
  if(acc && acc.email && acc.email.toLowerCase() !== email.toLowerCase()) {
    emailErr.textContent = 'E-mail não confere com o cadastro.';
    emailErr.classList.add('show'); emailEl.classList.add('input-error');
    return;
  }
  document.getElementById('forgotModal').classList.remove('open');
  cpfEl.value = ''; emailEl.value = '';
  showToast('Link de recuperação enviado para seu e-mail!','success');
});
document.getElementById('forgotModal').addEventListener('click', (e) => {
  if(e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

// ─── AUTH TABS ───
function switchAuthTab(tab) {
  const loginPanel  = document.getElementById('login-panel');
  const signupPanel = document.getElementById('signup-panel');
  const tabLogin    = document.getElementById('tabLogin');
  const tabSignup   = document.getElementById('tabSignup');
  if(tab === 'login') {
    loginPanel.style.display = 'block'; signupPanel.style.display = 'none';
    tabLogin.classList.add('active'); tabSignup.classList.remove('active');
  } else {
    loginPanel.style.display = 'none'; signupPanel.style.display = 'block';
    tabLogin.classList.remove('active'); tabSignup.classList.add('active');
    document.getElementById('signupSuccess').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
  }
}

// ─── CPF MASK no cadastro ───
document.getElementById('regCpf').addEventListener('input', function() {
  this.value = cpfMask(this.value);
});

// ─── FORÇA DA SENHA ───
function checkStrength(val) {
  const segs = ['seg1','seg2','seg3','seg4'].map(id => document.getElementById(id));
  const label = document.getElementById('strengthLabel');
  segs.forEach(s => { s.style.background = 'var(--gray-100)'; });
  let score = 0;
  if(val.length >= 8) score++;
  if(/[A-Z]/.test(val)) score++;
  if(/[0-9]/.test(val)) score++;
  if(/[^A-Za-z0-9]/.test(val)) score++;
  const colors = ['var(--danger)','var(--warning)','var(--blue)','var(--success)'];
  const labels = ['Muito fraca','Fraca','Boa','Forte 💪'];
  for(let i = 0; i < score; i++) segs[i].style.background = colors[score-1];
  label.textContent = score > 0 ? labels[score-1] : 'Digite uma senha';
  label.style.color  = score > 0 ? colors[score-1] : 'var(--gray-600)';
}

// ─── TOGGLE VISIBILIDADE ───
function toggleField(id, btn) {
  const input = document.getElementById(id);
  const icon  = btn.querySelector('i');
  if(input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { input.type = 'password'; icon.className = 'fas fa-eye'; }
}

// ─── CADASTRO ───
function submitSignup() {
  ['regNome','regSobrenome','regCpf','regEmail','regNasc','regTurno','regSerie','regDisciplina','regSenha','regConfirm'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('input-error');
  });
  document.querySelectorAll('#signup-panel .error-msg').forEach(e => e.classList.remove('show'));

  let valid = true;
  function err(fieldId, msgId, msg) {
    const el = document.getElementById(fieldId);
    if(el) el.classList.add('input-error');
    const msgEl = document.getElementById(msgId);
    if(msgEl) { if(msg) msgEl.textContent = msg; msgEl.classList.add('show'); }
    valid = false;
  }

  const nome      = document.getElementById('regNome').value.trim();
  const sobrenome = document.getElementById('regSobrenome').value.trim();
  const cpf       = document.getElementById('regCpf').value.replace(/\D/g,'');
  const email     = document.getElementById('regEmail').value.trim();
  const nasc      = document.getElementById('regNasc').value;
  const turno     = document.getElementById('regTurno').value;
  const serie      = document.getElementById('regSerie').value;
  const disciplina = document.getElementById('regDisciplina').value;
  const senha      = document.getElementById('regSenha').value;
  const confirm    = document.getElementById('regConfirm').value;
  const terms      = document.getElementById('acceptTerms').checked;
  const role       = loginRole;

  if(!nome)                          err('regNome',      'regNomeError',     'Nome obrigatório.');
  if(!sobrenome)                     err('regSobrenome', 'regSobrenomeError','Sobrenome obrigatório.');
  if(cpf.length !== 11)              err('regCpf',       'regCpfError',      'CPF inválido.');
  if(!email || !email.includes('@')) err('regEmail',     'regEmailError',    'E-mail inválido.');
  if(!nasc)                          err('regNasc',      'regNascError',     'Data obrigatória.');
  if(!turno)                         err('regTurno',     'regTurnoError',    'Selecione o turno.');
  if(role === 'aluno' && !serie)     err('regSerie',     'regSerieError',    'Selecione a série.');
  if(role === 'professor' && !disciplina) err('regDisciplina','regDiscError', 'Selecione a disciplina.');
  if(senha.length < 8)               err('regSenha',     'regSenhaError',    'Senha muito fraca (mín. 8 caracteres).');
  if(senha !== confirm)              err('regConfirm',   'regConfirmError',  'As senhas não coincidem.');
  if(!terms) { document.getElementById('termsError').classList.add('show'); valid = false; }
  if(!valid) return;

  // Verifica CPF duplicado
  if(findAccount(cpf)) {
    err('regCpf','regCpfError','Este CPF já possui uma conta. Faça login.');
    return;
  }

  // ✅ Salva conta no localStorage
  const accounts = getAccounts();
  accounts.push({ cpf, nome, sobrenome, email, nasc, turno, serie, disciplina, senha, role });
  saveAccounts(accounts);

  const btn = document.getElementById('btnSignup');
  document.getElementById('btnSignupText').style.display = 'none';
  document.getElementById('signupSpinner').style.display = 'block';
  btn.disabled = true;

  setTimeout(() => {
    document.getElementById('btnSignupText').style.display = 'block';
    document.getElementById('signupSpinner').style.display = 'none';
    btn.disabled = false;
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('signupSuccess').style.display = 'block';
    showToast('Conta criada! Agora faça login. 🎉','success');
  }, 1600);
}

