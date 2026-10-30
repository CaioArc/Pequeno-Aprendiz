const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { handlePortalApi, getAuth, digits } = require('./portal');

const PORT = Number(process.env.PORT) || 8000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'chat.json');
const WS_MAGIC = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const SYSTEM_USERS = [
  { id: 'sys-secretaria', nome: 'Secretaria Escolar', sobrenome: '', role: 'sistema', cargo: 'Atendimento institucional', alwaysOnline: true },
  { id: 'sys-coordenacao', nome: 'Coordenação Pedagógica', sobrenome: '', role: 'sistema', cargo: 'Acompanhamento acadêmico', alwaysOnline: true },
  { id: 'sys-suporte', nome: 'Suporte Técnico', sobrenome: '', role: 'sistema', cargo: 'Portal e acesso', alwaysOnline: true },
  { id: 'sys-direcao', nome: 'Direção', sobrenome: '', role: 'sistema', cargo: 'Gestão escolar', alwaysOnline: true }
];

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const seed = { users: {}, messages: {} };
    SYSTEM_USERS.forEach(u => { seed.users[u.id] = u; });
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
  }
}

function loadStore() {
  ensureStore();
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    data.users = data.users || {};
    data.messages = data.messages || {};
    SYSTEM_USERS.forEach(u => {
      data.users[u.id] = { ...(data.users[u.id] || {}), ...u };
    });
    return data;
  } catch {
    const seed = { users: {}, messages: {} };
    SYSTEM_USERS.forEach(u => { seed.users[u.id] = u; });
    return seed;
  }
}

let store = loadStore();
let saveTimer = null;
function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2)); } catch {}
  }, 200);
}

const sockets = new Map();

function convId(a, b) {
  return [String(a), String(b)].sort().join(':');
}

function publicUser(u, onlineSet) {
  if (!u) return null;
  const id = u.id;
  const isSys = u.role === 'sistema';
  return {
    id,
    nome: u.nome || '',
    sobrenome: u.sobrenome || '',
    role: u.role || 'aluno',
    cargo: u.cargo || '',
    disciplina: u.disciplina || '',
    serie: u.serie || '',
    turno: u.turno || '',
    online: isSys || onlineSet.has(id)
  };
}

function onlineIds() {
  return new Set(sockets.keys());
}

function listUsers() {
  const online = onlineIds();
  return Object.values(store.users).map(u => publicUser(u, online));
}

function sanitizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

function makeMessage(from, to, text) {
  return {
    id: 'm_' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    from,
    to,
    text: sanitizeText(text),
    time: Date.now()
  };
}

function pushMessage(msg) {
  if (!msg.text) return null;
  const id = convId(msg.from, msg.to);
  if (!store.messages[id]) store.messages[id] = [];
  store.messages[id].push(msg);
  if (store.messages[id].length > 400) store.messages[id] = store.messages[id].slice(-400);
  saveStore();
  return msg;
}

function getThread(a, b) {
  return store.messages[convId(a, b)] || [];
}

function lastMessagesFor(userId) {
  const out = {};
  Object.entries(store.messages).forEach(([id, list]) => {
    if (!id.split(':').includes(userId) || !list.length) return;
    out[id] = list[list.length - 1];
  });
  return out;
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.sendFrame(JSON.stringify(obj));
}

function sendToUser(userId, obj) {
  const set = sockets.get(userId);
  if (!set) return;
  set.forEach(ws => send(ws, obj));
}

function broadcast(obj, exceptId) {
  sockets.forEach((set, id) => {
    if (id === exceptId) return;
    set.forEach(ws => send(ws, obj));
  });
}

function registerUser(body) {
  const cpf = String(body.cpf || body.id || '').replace(/\D/g, '');
  if (cpf.length !== 11) return null;
  const prev = store.users[cpf] || {};
  const user = {
    id: cpf,
    nome: String(body.nome || prev.nome || 'Usuário').trim().slice(0, 40),
    sobrenome: String(body.sobrenome || prev.sobrenome || '').trim().slice(0, 40),
    role: body.role === 'professor' ? 'professor' : 'aluno',
    disciplina: String(body.disciplina || prev.disciplina || '').slice(0, 40),
    serie: String(body.serie || prev.serie || '').slice(0, 40),
    turno: String(body.turno || prev.turno || '').slice(0, 40),
    cargo: ''
  };
  store.users[cpf] = user;
  saveStore();
  broadcast({ type: 'users', users: listUsers() });
  return publicUser(user, onlineIds());
}

function systemReply(toId, sysId, userText) {
  const t = userText.toLowerCase();
  let text = 'Recebemos sua mensagem. A equipe acompanha este canal em tempo real e retorna por aqui.';
  if (sysId === 'sys-secretaria') {
    text = 'Secretaria: sua solicitação foi registrada. Documentos, matrícula e declarações são tratados neste canal.';
    if (/declara|matríc|matric|histórico|historico|carteir/.test(t)) {
      text = 'Secretaria: para declarações e histórico, use também a Secretaria Virtual. Se precisar de um protocolo, descreva o documento aqui.';
    }
  } else if (sysId === 'sys-coordenacao') {
    text = 'Coordenação: obrigado pelo contato. Conte o ocorrido (turma, disciplina e data) que orientamos o encaminhamento.';
    if (/nota|prova|recuper|frequên|frequen|boletim/.test(t)) {
      text = 'Coordenação: questões de notas e frequência são alinhadas com o docente da disciplina. Descreva o caso para acompanharmos.';
    }
  } else if (sysId === 'sys-suporte') {
    text = 'Suporte: estamos online. Informe o que aparece na tela (login, senha ou página) que te guiamos no portal.';
    if (/senha|login|entrar|cpf|acesso/.test(t)) {
      text = 'Suporte: no login use o CPF cadastrado e a senha criada. Se esqueceu, utilize Recuperar senha na tela inicial.';
    }
  } else if (sysId === 'sys-direcao') {
    text = 'Direção: mensagem recebida. Assuntos institucionais são lidos pela gestão e respondidos neste chat.';
  }
  const msg = pushMessage(makeMessage(sysId, toId, text));
  if (msg) sendToUser(toId, { type: 'message', message: msg });
}

function attachUser(ws, userId) {
  if (!sockets.has(userId)) sockets.set(userId, new Set());
  sockets.get(userId).add(ws);
  ws.userId = userId;
  broadcast({ type: 'presence', id: userId, online: true });
}

function detachUser(ws) {
  const userId = ws.userId;
  if (!userId) return;
  const set = sockets.get(userId);
  if (set) {
    set.delete(ws);
    if (!set.size) {
      sockets.delete(userId);
      broadcast({ type: 'presence', id: userId, online: false });
    }
  }
}

function handleWsMessage(ws, raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return; }
  const me = ws.userId;
  if (!me) return;
  if (data.type === 'send') {
    const to = String(data.to || '');
    const text = sanitizeText(data.text);
    if (!to || !text || to === me) return;
    if (!store.users[to]) return;
    const msg = pushMessage(makeMessage(me, to, text));
    if (!msg) return;
    sendToUser(me, { type: 'message', message: msg });
    if (to !== me) sendToUser(to, { type: 'message', message: msg });
    if (String(to).startsWith('sys-')) {
      setTimeout(() => systemReply(me, to, text), 700 + Math.floor(Math.random() * 900));
    }
    return;
  }
  if (data.type === 'typing') {
    const to = String(data.to || '');
    if (!to) return;
    sendToUser(to, { type: 'typing', from: me, on: !!data.on });
    return;
  }
  if (data.type === 'history') {
    const withId = String(data.with || '');
    send(ws, { type: 'history', with: withId, messages: getThread(me, withId) });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => {
      buf += c;
      if (buf.length > 1e6) { req.destroy(); reject(new Error('too large')); }
    });
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? '/index.html' : decoded;
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT)) return null;
  if (abs.startsWith(DATA_DIR)) return null;
  const base = path.basename(abs);
  if (base === 'server.js' || base === 'package.json' || base === 'portal.js') return null;
  return abs;
}

function serveStatic(req, res) {
  const file = safePath(req.url || '/');
  if (!file) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, { ok: true });
    return;
  }
  const handled = await handlePortalApi(req, res, url, { json, readBody });
  if (handled) return;
  if (req.method === 'GET' && url.pathname === '/api/chat/users') {
    json(res, 200, { users: listUsers() });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/chat/register') {
    const body = await readBody(req);
    const user = registerUser(body);
    if (!user) { json(res, 400, { error: 'cpf' }); return; }
    json(res, 200, { user, users: listUsers() });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/chat/thread') {
    const a = url.searchParams.get('a') || '';
    const b = url.searchParams.get('b') || '';
    json(res, 200, { messages: getThread(a, b) });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/chat/send') {
    const body = await readBody(req);
    const from = String(body.from || '').replace(/\D/g, '') || String(body.from || '');
    const to = String(body.to || '');
    const text = sanitizeText(body.text);
    if (!from || !to || !text || !store.users[from] || !store.users[to]) {
      json(res, 400, { error: 'invalid' });
      return;
    }
    const msg = pushMessage(makeMessage(from, to, text));
    if (!msg) { json(res, 400, { error: 'empty' }); return; }
    sendToUser(from, { type: 'message', message: msg });
    if (to !== from) sendToUser(to, { type: 'message', message: msg });
    if (String(to).startsWith('sys-')) {
      setTimeout(() => systemReply(from, to, text), 700 + Math.floor(Math.random() * 900));
    }
    json(res, 200, { message: msg });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/chat/sync') {
    const cpf = String(url.searchParams.get('cpf') || '').replace(/\D/g, '');
    const since = Number(url.searchParams.get('since') || 0);
    if (cpf.length !== 11) { json(res, 400, { error: 'cpf' }); return; }
    const messages = [];
    Object.entries(store.messages).forEach(([id, list]) => {
      if (!id.split(':').includes(cpf)) return;
      list.forEach(m => { if (m.time > since) messages.push(m); });
    });
    messages.sort((a, b) => a.time - b.time);
    json(res, 200, {
      users: listUsers(),
      previews: lastMessagesFor(cpf),
      messages,
      now: Date.now()
    });
    return;
  }
  json(res, 404, { error: 'not found' });
}

function decodeWsFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    const big = buf.readUInt32BE(2);
    if (big !== 0) return { opcode: 8, payload: Buffer.alloc(0), rest: Buffer.alloc(0) };
    len = buf.readUInt32BE(6);
    offset = 10;
  }
  const maskLen = masked ? 4 : 0;
  if (buf.length < offset + maskLen + len) return null;
  let payload = buf.slice(offset + maskLen, offset + maskLen + len);
  if (masked) {
    const mask = buf.slice(offset, offset + 4);
    const out = Buffer.alloc(len);
    for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i % 4];
    payload = out;
  }
  return { opcode, payload, rest: buf.slice(offset + maskLen + len) };
}

function encodeWsFrame(data, opcode) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data));
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  return Buffer.concat([header, payload]);
}

function upgradeWs(req, socket, userId) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + WS_MAGIC).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n'
  );
  const ws = {
    readyState: 1,
    userId: null,
    socket,
    buf: Buffer.alloc(0),
    sendFrame(text) {
      try { socket.write(encodeWsFrame(text, 1)); } catch {}
    },
    ping() {
      try { socket.write(encodeWsFrame(Buffer.alloc(0), 9)); } catch {}
    },
    close() {
      this.readyState = 3;
      try { socket.end(); } catch {}
    }
  };
  attachUser(ws, userId);
  send(ws, {
    type: 'hello',
    me: publicUser(store.users[userId], onlineIds()),
    users: listUsers(),
    previews: lastMessagesFor(userId)
  });
  socket.on('data', chunk => {
    ws.buf = Buffer.concat([ws.buf, chunk]);
    while (true) {
      const frame = decodeWsFrame(ws.buf);
      if (!frame) break;
      ws.buf = frame.rest;
      if (frame.opcode === 8) { ws.close(); return; }
      if (frame.opcode === 9) {
        try { socket.write(encodeWsFrame(frame.payload, 10)); } catch {}
        continue;
      }
      if (frame.opcode === 1) handleWsMessage(ws, frame.payload.toString('utf8'));
    }
  });
  socket.on('close', () => { ws.readyState = 3; detachUser(ws); });
  socket.on('error', () => { ws.readyState = 3; detachUser(ws); });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res);
  } catch {
    res.writeHead(500);
    res.end('Error');
  }
});

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/ws') { socket.destroy(); return; }
  const auth = getAuth(req);
  let cpf = auth && auth.user ? auth.user.cpf : digits(url.searchParams.get('cpf'));
  if (cpf.length !== 11) { socket.destroy(); return; }
  if (!store.users[cpf] && auth && auth.user) {
    registerUser({
      cpf,
      nome: auth.user.nome,
      sobrenome: auth.user.sobrenome,
      role: auth.user.role,
      disciplina: auth.user.disciplina,
      serie: auth.user.serie,
      turno: auth.user.turno
    });
  }
  if (!store.users[cpf]) { socket.destroy(); return; }
  upgradeWs(req, socket, cpf);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Portal Pequeno Aprendiz em http://0.0.0.0:' + PORT);
});
