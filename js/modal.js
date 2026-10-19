// ─── GENERIC DETAIL MODAL ───
function openModal(html) {
  document.getElementById('appModalContent').innerHTML = html;
  document.getElementById('appModal').classList.add('open');
}
function closeModal() {
  document.getElementById('appModal').classList.remove('open');
}
function openLegal(kind) {
  const isTerms = kind === 'termos';
  openModal(`
    <div class="modal-head">
      <div class="modal-head-icon"><i class="fas ${isTerms ? 'fa-file-contract' : 'fa-user-shield'}"></i></div>
      <div><h3>${isTerms ? 'Termos de Uso' : 'Política de Privacidade'}</h3>
      <div class="modal-eyebrow">Colégio Pequeno Aprendiz · 2026</div></div>
    </div>
    <div class="modal-body">
      ${isTerms
        ? '<p>O Portal do Aluno é de uso exclusivo da comunidade escolar. O acesso é pessoal e intransferível, vinculado ao CPF cadastrado.</p><p>É vedado compartilhar senha, alterar dados de terceiros ou usar o sistema para fins não acadêmicos. O descumprimento pode resultar no bloqueio da conta.</p>'
        : '<p>Coletamos nome, CPF, e-mail e dados acadêmicos apenas para operação do portal. As informações ficam armazenadas neste dispositivo (sem envio a servidores externos neste ambiente de demonstração).</p><p>Você pode atualizar a foto de perfil a qualquer momento e encerrar a sessão pelo menu.</p>'}
    </div>
    <div class="modal-actions">
      <button class="btn-primary" onclick="closeModal()">Entendi</button>
    </div>`);
}
document.getElementById('appModal').addEventListener('click', (e) => {
  if(e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });

