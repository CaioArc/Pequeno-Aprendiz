// ─── PROFILE MENU ───
document.getElementById('topbarAvatar').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('notifPanel').classList.remove('open');
  document.getElementById('profileMenu').classList.toggle('open');
});
document.getElementById('profileMenu').addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', () => document.getElementById('profileMenu').classList.remove('open'));

document.getElementById('photoInput').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if(!file) return;
  if(!file.type.startsWith('image/')) {
    showToast('Escolha um arquivo de imagem.','error');
    return;
  }
  compressImage(file, (dataUrl) => {
    const session = getSession();
    if(session) localStorage.setItem(photoKey(session.cpf), dataUrl);
    applyPhoto(dataUrl);
    showToast('Foto de perfil atualizada!','success');
  });
});

function restoreRemember() {
  try {
    const rem = JSON.parse(localStorage.getItem('pa_remember') || 'null');
    if(rem && rem.cpf) {
      document.getElementById('cpfInput').value = rem.cpf;
      document.getElementById('rememberMe').checked = true;
      if(rem.role) setLoginRole(rem.role);
      return;
    }
  } catch {}
  document.getElementById('rememberMe').checked = false;
}
function doLogout() {
  document.getElementById('profileMenu').classList.remove('open');
  resetPageHistory();
  clearSession();
  document.body.classList.remove('role-professor','role-aluno');
  document.getElementById('app').classList.remove('active');
  document.getElementById('login-page').style.display = 'flex';
  switchAuthTab('login');
  setLoginRole('aluno');
  restoreRemember();
  showToast('Sessão encerrada com segurança.','info');
}

// ─── LOGOUT ───
document.getElementById('btnLogout').addEventListener('click', doLogout);
document.getElementById('menuLogout').addEventListener('click', doLogout);

