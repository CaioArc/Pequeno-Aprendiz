function bootSession() {
  const session = getSession();
  if(session) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').classList.add('active');
    applySession(session);
    return;
  }
  restoreRemember();
}

function initInteractive() {
  renderMiniCal();
  renderFullCal();
  renderBoletim(0);
  restoreNotifs();
  restoreNavBadges();
}

initInteractive();
setLoginRole('aluno');
bootSession();
