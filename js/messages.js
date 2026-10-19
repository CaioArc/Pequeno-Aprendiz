// ─── MESSAGES ───
function selectContact(el, name, subject) {
  document.querySelectorAll('.msg-contact').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('msgContactName').textContent = name;
  document.getElementById('msgThread').innerHTML = `
    <div class="msg-bubble-wrap">
      <div class="bubble-avatar" style="background:var(--purple-xlight);color:var(--purple);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">${name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <div><div class="msg-bubble other">Olá! Como posso ajudar você em ${subject}?</div><div class="msg-time">Agora</div></div>
    </div>`;
}

function sendMsg() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if(!text) return;
  const thread = document.getElementById('msgThread');
  const wrap = document.createElement('div');
  wrap.className = 'msg-bubble-wrap mine';
  const now = new Date();
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  const sess = getSession();
  const initMe = sess ? (sess.nome[0]+(sess.sobrenome?.[0]||'')).toUpperCase() : 'EU';
  wrap.innerHTML = `
    <div class="bubble-avatar" style="background:var(--purple);color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">${initMe}</div>
    <div><div class="msg-bubble mine">${text}</div><div class="msg-time">${h}:${m}</div></div>`;
  thread.appendChild(wrap);
  input.value = '';
  thread.scrollTop = thread.scrollHeight;
  setTimeout(() => {
    const resp = document.createElement('div');
    resp.className = 'msg-bubble-wrap';
    const cname = document.getElementById('msgContactName').textContent;
    const initials = cname.split(' ').map(w=>w[0]).join('').slice(0,2);
    resp.innerHTML = `
      <div class="bubble-avatar" style="background:var(--purple-xlight);color:var(--purple);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700">${initials}</div>
      <div><div class="msg-bubble other">Obrigado pela sua mensagem! Responderei em breve. 📚</div><div class="msg-time">${h}:${(parseInt(m)+1).toString().padStart(2,'0')}</div></div>`;
    thread.appendChild(resp);
    thread.scrollTop = thread.scrollHeight;
  }, 1200);
}

