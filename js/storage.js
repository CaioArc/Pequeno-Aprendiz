// ─── AUTH STORAGE (localStorage) ───
function getAccounts() {
  try { return JSON.parse(localStorage.getItem('pa_accounts') || '[]'); }
  catch { return []; }
}
function saveAccounts(accounts) {
  localStorage.setItem('pa_accounts', JSON.stringify(accounts));
}
function findAccount(cpf) {
  return getAccounts().find(a => a.cpf === cpf) || null;
}
function setSession(account) {
  localStorage.setItem('pa_session', JSON.stringify({
    cpf: account.cpf, nome: account.nome,
    sobrenome: account.sobrenome, serie: account.serie, turno: account.turno,
    email: account.email || '',
    role: account.role || 'aluno',
    disciplina: account.disciplina || ''
  }));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem('pa_session') || 'null'); }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem('pa_session');
}

