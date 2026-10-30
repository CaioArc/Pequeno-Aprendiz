const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const PORTAL_FILE = path.join(DATA_DIR, 'portal.json');

const SUBJECTS = ['Matemática', 'Português', 'Física', 'Química', 'História', 'Biologia', 'Inglês'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function hashPassword(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(senha), salt, 32).toString('hex');
  return { salt, hash };
}

function verifyPassword(senha, salt, hash) {
  if (!salt || !hash) return false;
  try {
    const a = Buffer.from(hash, 'hex');
    const b = crypto.scryptSync(String(senha), salt, 32);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
}

function digits(v) {
  return String(v || '').replace(/\D/g, '');
}

function publicUser(u) {
  if (!u) return null;
  return {
    cpf: u.cpf,
    nome: u.nome,
    sobrenome: u.sobrenome,
    email: u.email || '',
    nasc: u.nasc || '',
    turno: u.turno || '',
    serie: u.serie || '',
    disciplina: u.disciplina || '',
    role: u.role || 'aluno',
    matricula: u.matricula || '',
    telefone: u.telefone || '',
    status: u.status || 'ativo',
    createdAt: u.createdAt || 0
  };
}

function seedGrades() {
  const out = {};
  SUBJECTS.forEach((s, i) => {
    const base = 6.5 + ((i * 1.3) % 3.2);
    out[s] = [0, 1, 2, 3].map(bim => {
      const avg = Math.min(10, Math.max(0, +(base + ((bim + i) % 3) * 0.3 - 0.2).toFixed(1)));
      return {
        p1: Math.min(10, +(avg + 0.3).toFixed(1)),
        trab: Math.max(0, +(avg - 0.4).toFixed(1)),
        part: Math.min(10, Math.round(avg)),
        avg,
        freq: 82 + ((i * 5 + bim * 3) % 16)
      };
    });
  });
  return out;
}

function seedPayments() {
  return MONTHS.slice(0, 10).map((month, i) => ({
    id: 'pay_' + (i + 1),
    month,
    desc: 'Mensalidade – Ensino Médio',
    value: 960,
    due: '28/' + String(i + 1).padStart(2, '0') + '/2026',
    status: i < 8 ? 'pago' : 'pendente',
    paidAt: i < 8 ? '2026-' + String(i + 1).padStart(2, '0') + '-20' : null
  }));
}

function emptyPortal() {
  const now = Date.now();
  const admin = hashPassword('Admin@2026');
  const aluno = hashPassword('Aluno@2026');
  const prof = hashPassword('Prof@2026');
  return {
    users: {
      '99999999999': {
        cpf: '99999999999', nome: 'Marina', sobrenome: 'Almeida', email: 'admin@pequenoaprendiz.edu',
        role: 'admin', turno: 'Integral', serie: '', disciplina: '', nasc: '1985-04-12',
        senhaSalt: admin.salt, senhaHash: admin.hash, matricula: 'ADM-0001', status: 'ativo',
        telefone: '', createdAt: now
      },
      '12345678901': {
        cpf: '12345678901', nome: 'Ana', sobrenome: 'Martins', email: 'ana.martins@aluno.edu',
        role: 'aluno', turno: 'Matutino', serie: '3º Ano – Ensino Médio', disciplina: '', nasc: '2009-03-14',
        senhaSalt: aluno.salt, senhaHash: aluno.hash, matricula: '2023001547', status: 'ativo',
        telefone: '', createdAt: now
      },
      '98765432100': {
        cpf: '98765432100', nome: 'Carlos', sobrenome: 'Eduardo', email: 'carlos.eduardo@prof.edu',
        role: 'professor', turno: 'Matutino', serie: '', disciplina: 'Matemática', nasc: '1982-08-09',
        senhaSalt: prof.salt, senhaHash: prof.hash, matricula: 'PRF-1044', status: 'ativo',
        telefone: '', createdAt: now
      }
    },
    sessions: {},
    grades: { '12345678901': seedGrades() },
    attendance: {},
    activities: [
      { id: 'act_fisica', title: 'Prova de Física', subject: 'Física', desc: 'Cap. 5 – Termodinâmica', open: '2026-10-10', due: '2026-10-28', teacher: '98765432100' },
      { id: 'act_redacao', title: 'Entrega – Redação', subject: 'Português', desc: 'Dissertação argumentativa', open: '2026-10-12', due: '2026-10-30', teacher: '98765432100' },
      { id: 'act_bio', title: 'Seminário de Biologia', subject: 'Biologia', desc: 'Grupo C – Genética', open: '2026-10-01', due: '2026-11-02', teacher: '98765432100' },
      { id: 'act_mat', title: 'Lista – Matemática', subject: 'Matemática', desc: 'Funções trigonométricas', open: '2026-10-18', due: '2026-11-05', teacher: '98765432100' }
    ],
    submissions: {},
    payments: { '12345678901': seedPayments() },
    requests: [],
    notices: [
      { id: 'n1', title: 'Rematrícula 2026/2 até 31/10', body: 'A secretaria recebe pedidos de rematrícula até 31/10.', tag: 'Urgente', date: '2026-10-20', author: 'admin' },
      { id: 'n2', title: 'Semana cultural: 07 a 11 de Abril', body: 'Oficinas, apresentações e mostra de projetos no pátio.', tag: 'Informativo', date: '2026-10-18', author: 'admin' },
      { id: 'n3', title: 'Novas videoaulas de Química', body: 'Conteúdos do 3º bimestre disponíveis no AVA.', tag: 'Novidade', date: '2026-10-15', author: 'admin' }
    ],
    materials: [
      { id: 'm1', course: 'Matemática', title: 'Lista de trigonometria', type: 'PDF', url: '/materials/trigonometria.pdf', module: 'Unidade 1' },
      { id: 'm2', course: 'Física', title: 'Videoaula – Termodinâmica', type: 'Vídeo', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', module: 'Unidade 2' },
      { id: 'm3', course: 'Português', title: 'Modelo de dissertação', type: 'Documento', url: '/materials/dissertacao.pdf', module: 'Unidade 1' },
      { id: 'm4', course: 'Química', title: 'Tabela periódica comentada', type: 'PDF', url: '/materials/tabela.pdf', module: 'Unidade 1' },
      { id: 'm5', course: 'Biologia', title: 'Videoaula – Genética', type: 'Vídeo', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', module: 'Unidade 3' },
      { id: 'm6', course: 'História', title: 'Linha do tempo do Brasil', type: 'Imagem', url: '/materials/linha-tempo.png', module: 'Unidade 2' },
      { id: 'm7', course: 'Inglês', title: 'Áudio – listening B1', type: 'Áudio', url: '/materials/listening.mp3', module: 'Unidade 1' }
    ],
    courses: [
      { id: 'mat', name: 'Matemática Avançada', teacher: 'Prof. Carlos Eduardo', subject: 'Matemática', aulas: 24, progress: 78 },
      { id: 'qui', name: 'Química Orgânica', teacher: 'Profa. Márcia Silva', subject: 'Química', aulas: 18, progress: 62 },
      { id: 'fis', name: 'Física – Termodinâmica', teacher: 'Prof. Roberto Alves', subject: 'Física', aulas: 20, progress: 45 },
      { id: 'bio', name: 'Biologia Celular', teacher: 'Profa. Juliana Costa', subject: 'Biologia', aulas: 16, progress: 88 },
      { id: 'his', name: 'História do Brasil', teacher: 'Prof. André Ferreira', subject: 'História', aulas: 22, progress: 95 },
      { id: 'ing', name: 'Inglês Intermediário', teacher: 'Profa. Sarah Johnson', subject: 'Inglês', aulas: 30, progress: 52 },
      { id: 'por', name: 'Português', teacher: 'Profa. Helena Dias', subject: 'Português', aulas: 20, progress: 70 }
    ],
    classes: [
      { id: '3A', name: '3º Ano A', course: 'Ensino Médio', shift: 'Matutino', students: 32 },
      { id: '3B', name: '3º Ano B', course: 'Ensino Médio', shift: 'Matutino', students: 30 },
      { id: '2B', name: '2º Ano B', course: 'Ensino Médio', shift: 'Vespertino', students: 34 }
    ],
    quizzes: [
      {
        id: 'quiz_mat',
        title: 'Quiz – Funções trigonométricas',
        subject: 'Matemática',
        open: '2026-10-01',
        due: '2026-11-10',
        questions: [
          { q: 'O seno de 90° vale:', options: ['0', '1', '0,5', '-1'], answer: 1 },
          { q: 'Cosseno de 0° vale:', options: ['1', '0', '-1', '0,5'], answer: 0 },
          { q: 'Tangente de 45° vale:', options: ['0', '2', '1', 'indefinida'], answer: 2 }
        ]
      },
      {
        id: 'quiz_fis',
        title: 'Quiz – Termodinâmica',
        subject: 'Física',
        open: '2026-10-05',
        due: '2026-11-08',
        questions: [
          { q: 'A 1ª lei da termodinâmica relaciona:', options: ['Calor, trabalho e energia interna', 'Só temperatura', 'Só pressão', 'Óptica'], answer: 0 },
          { q: 'Temperatura absoluta se mede em:', options: ['Celsius', 'Fahrenheit', 'Kelvin', 'Joule'], answer: 2 }
        ]
      }
    ],
    quizAttempts: {},
    books: [
      { id: 'b1', title: 'Álgebra Linear e suas Aplicações', author: 'David C. Lay', subject: 'Matemática', copies: 4 },
      { id: 'b2', title: 'Biologia Celular e Molecular', author: 'Alberts et al.', subject: 'Ciências', copies: 3 },
      { id: 'b3', title: 'Dom Casmurro', author: 'Machado de Assis', subject: 'Literatura', copies: 6 },
      { id: 'b4', title: 'Fundamentos de Física', author: 'Halliday & Resnick', subject: 'Física', copies: 2 },
      { id: 'b5', title: 'História Geral e do Brasil', author: 'Boris Fausto', subject: 'História', copies: 5 },
      { id: 'b6', title: 'Química Geral – Princípios', author: 'Peter Atkins', subject: 'Química', copies: 3 },
      { id: 'b7', title: 'Grande Sertão: Veredas', author: 'Guimarães Rosa', subject: 'Literatura', copies: 2 },
      { id: 'b8', title: 'Cálculo – Vol. 1', author: 'James Stewart', subject: 'Matemática', copies: 4 }
    ],
    loans: [],
    noticeReads: {},
    recentMaterials: {},
    tickets: [],
    evals: [],
    diary: [],
    events: [
      { id: 'ev1', date: '2026-10-28', title: 'Prova de Física', desc: 'Termodinâmica', time: '08:00', type: 'urgent' },
      { id: 'ev2', date: '2026-10-30', title: 'Entrega – Redação', desc: 'Português', time: '23:59', type: 'info' },
      { id: 'ev3', date: '2026-11-02', title: 'Seminário de Biologia', desc: 'Genética', time: '10:00', type: 'success' }
    ],
    notifications: [],
    audit: [],
    loginFails: {}
  };
}

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PORTAL_FILE)) {
    const seed = emptyPortal();
    fs.writeFileSync(PORTAL_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(PORTAL_FILE, 'utf8'));
    const base = emptyPortal();
    return Object.assign(base, data, {
      users: Object.assign(base.users, data.users || {}),
      sessions: data.sessions || {},
      grades: data.grades || {},
      attendance: data.attendance || {},
      activities: data.activities || base.activities,
      submissions: data.submissions || {},
      payments: data.payments || {},
      requests: data.requests || [],
      notices: data.notices || base.notices,
      materials: data.materials || base.materials,
      courses: data.courses || base.courses,
      classes: data.classes || base.classes,
      quizzes: data.quizzes || base.quizzes,
      quizAttempts: data.quizAttempts || {},
      books: data.books || base.books,
      loans: data.loans || [],
      noticeReads: data.noticeReads || {},
      recentMaterials: data.recentMaterials || {},
      tickets: data.tickets || [],
      evals: data.evals || [],
      diary: data.diary || [],
      events: data.events || base.events,
      notifications: data.notifications || [],
      audit: data.audit || [],
      loginFails: data.loginFails || {}
    });
  } catch {
    return emptyPortal();
  }
}

let db = load();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(PORTAL_FILE, JSON.stringify(db, null, 2)); } catch {}
  }, 120);
}

function audit(actor, action, detail) {
  db.audit.push({ at: Date.now(), actor: actor || 'sistema', action, detail: String(detail || '').slice(0, 300) });
  if (db.audit.length > 400) db.audit = db.audit.slice(-400);
  save();
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function tokenFrom(req) {
  const auth = String(req.headers.authorization || '');
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return parseCookies(req).pa_token || '';
}

function cleanSessions() {
  const now = Date.now();
  Object.keys(db.sessions).forEach(k => {
    if (db.sessions[k].expires < now) delete db.sessions[k];
  });
}

function getAuth(req) {
  cleanSessions();
  const token = tokenFrom(req);
  const sess = token && db.sessions[token];
  if (!sess) return null;
  const user = db.users[sess.cpf];
  if (!user || user.status === 'inativo') return null;
  return { token, user };
}

function requireAuth(req, res, json) {
  const auth = getAuth(req);
  if (!auth) { json(res, 401, { error: 'auth' }); return null; }
  return auth;
}

function requireRole(auth, res, json, roles) {
  if (!roles.includes(auth.user.role)) { json(res, 403, { error: 'forbidden' }); return false; }
  return true;
}

function setTokenCookie(res, token, maxAge) {
  const parts = [
    'pa_token=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + maxAge
  ];
  res.setHeader('Set-Cookie', parts.join('; '));
}

function createSession(cpf, remember) {
  const token = crypto.randomBytes(24).toString('hex');
  const ttl = remember ? 30 * 86400000 : 12 * 3600000;
  db.sessions[token] = { cpf, created: Date.now(), expires: Date.now() + ttl };
  save();
  return { token, ttl };
}

function locked(cpf) {
  const rec = db.loginFails[cpf];
  return rec && rec.until && rec.until > Date.now();
}

function failLogin(cpf) {
  const rec = db.loginFails[cpf] || { n: 0, until: 0 };
  rec.n += 1;
  if (rec.n >= 5) { rec.until = Date.now() + 120000; rec.n = 0; }
  db.loginFails[cpf] = rec;
  save();
}

function clearFails(cpf) {
  delete db.loginFails[cpf];
  save();
}

function upsertUser(body, role) {
  const cpf = digits(body.cpf);
  if (cpf.length !== 11) return { error: 'cpf' };
  if (db.users[cpf]) return { error: 'exists' };
  const senha = String(body.senha || '');
  if (senha.length < 8) return { error: 'senha' };
  const hp = hashPassword(senha);
  const matricula = role === 'aluno'
    ? '20' + String(new Date().getFullYear()).slice(2) + String(Object.keys(db.users).length + 1000)
    : (role === 'professor' ? 'PRF-' + String(1000 + Object.keys(db.users).length) : 'ADM-' + String(100 + Object.keys(db.users).length));
  const user = {
    cpf,
    nome: String(body.nome || '').trim().slice(0, 40),
    sobrenome: String(body.sobrenome || '').trim().slice(0, 40),
    email: String(body.email || '').trim().slice(0, 80),
    nasc: String(body.nasc || ''),
    turno: String(body.turno || ''),
    serie: role === 'aluno' ? String(body.serie || '') : '',
    disciplina: role === 'professor' ? String(body.disciplina || '') : '',
    role,
    senhaSalt: hp.salt,
    senhaHash: hp.hash,
    matricula,
    telefone: String(body.telefone || ''),
    status: 'ativo',
    createdAt: Date.now()
  };
  if (!user.nome || !user.sobrenome || !user.email.includes('@')) return { error: 'dados' };
  db.users[cpf] = user;
  if (role === 'aluno') {
    db.grades[cpf] = seedGrades();
    db.payments[cpf] = seedPayments();
  }
  audit('sistema', 'signup', cpf + ' ' + role);
  save();
  return { user };
}

function situacao(avg) {
  if (avg >= 7) return 'Aprovado';
  if (avg >= 5) return 'Recuperação';
  return 'Reprovado';
}

function teacherFor(subject) {
  const course = (db.courses || []).find(c => c.subject === subject);
  if (course) return course.teacher;
  const prof = Object.values(db.users).find(u => u.role === 'professor' && u.disciplina === subject);
  return prof ? ('Prof. ' + prof.nome + ' ' + prof.sobrenome) : 'Docente';
}

function WEEK_SCHEDULE() {
  return {
    1: [{ time: '07:00', title: 'Matemática' }, { time: '08:00', title: 'Química' }, { time: '09:00', title: 'Física' }, { time: '10:00', title: 'Inglês' }],
    2: [{ time: '07:00', title: 'Português' }, { time: '08:00', title: 'Inglês' }, { time: '09:00', title: 'História' }, { time: '10:00', title: 'Biologia' }],
    3: [{ time: '07:00', title: 'Física' }, { time: '08:00', title: 'Matemática' }, { time: '09:00', title: 'Biologia' }, { time: '10:00', title: 'Português' }],
    4: [{ time: '07:00', title: 'Biologia' }, { time: '08:00', title: 'Português' }, { time: '09:00', title: 'Inglês' }, { time: '10:00', title: 'Física' }],
    5: [{ time: '07:00', title: 'História' }, { time: '08:00', title: 'Química' }, { time: '09:00', title: 'Matemática' }, { time: '10:00', title: 'Ed. Física' }]
  };
}

function nextClass() {
  const now = new Date();
  const wd = now.getDay();
  const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const map = WEEK_SCHEDULE();
  const today = map[wd] || [];
  const upcoming = today.find(c => c.time > hh) || (map[(wd % 5) + 1] || [])[0];
  return upcoming || { time: '07:00', title: 'Matemática' };
}

function pushNotif(cpf, title, page, kind) {
  db.notifications.push({
    id: uid('ntf'),
    cpf,
    title: String(title).slice(0, 120),
    page: page || 'dashboard',
    kind: kind || 'info',
    at: Date.now(),
    read: false
  });
  if (db.notifications.length > 500) db.notifications = db.notifications.slice(-500);
}

function studentSnapshot(cpf) {
  const grades = db.grades[cpf] || {};
  const avgs = Object.values(grades).map(bims => (bims[2] && bims[2].avg) || 0);
  const media = avgs.length ? +(avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(1) : 0;
  const freqs = Object.values(grades).map(bims => (bims[2] && bims[2].freq) || 0);
  const freq = freqs.length ? Math.round(freqs.reduce((a, b) => a + b, 0) / freqs.length) : 0;
  const subs = db.submissions;
  const pending = db.activities.filter(a => !(subs[a.id] && subs[a.id][cpf])).length;
  const pays = db.payments[cpf] || [];
  const due = pays.filter(p => p.status !== 'pago');
  const nxt = nextClass();
  return {
    media, freq, pending, disciplinas: Object.keys(grades).length,
    dueCount: due.length, dueValue: due.reduce((s, p) => s + p.value, 0),
    nextClass: nxt.title, nextTime: nxt.time
  };
}

async function handlePortalApi(req, res, url, helpers) {
  const { json, readBody } = helpers;
  const p = url.pathname;
  const method = req.method;

  if (method === 'POST' && p === '/api/auth/signup') {
    const body = await readBody(req);
    const role = body.role === 'professor' ? 'professor' : 'aluno';
    const out = upsertUser(body, role);
    if (out.error) { json(res, 400, out); return true; }
    json(res, 200, { user: publicUser(out.user) });
    return true;
  }

  if (method === 'POST' && p === '/api/auth/migrate') {
    const body = await readBody(req);
    const list = Array.isArray(body.accounts) ? body.accounts : [];
    let n = 0;
    list.forEach(acc => {
      const cpf = digits(acc.cpf);
      if (cpf.length !== 11 || db.users[cpf] || !acc.senha) return;
      const hp = hashPassword(acc.senha);
      db.users[cpf] = {
        cpf, nome: acc.nome || 'Aluno', sobrenome: acc.sobrenome || '',
        email: acc.email || '', nasc: acc.nasc || '', turno: acc.turno || '',
        serie: acc.serie || '', disciplina: acc.disciplina || '',
        role: acc.role === 'professor' ? 'professor' : (acc.role === 'admin' ? 'admin' : 'aluno'),
        senhaSalt: hp.salt, senhaHash: hp.hash,
        matricula: acc.matricula || ('MIG' + cpf.slice(-6)),
        telefone: '', status: 'ativo', createdAt: Date.now()
      };
      if (db.users[cpf].role === 'aluno') {
        db.grades[cpf] = db.grades[cpf] || seedGrades();
        db.payments[cpf] = db.payments[cpf] || seedPayments();
      }
      n++;
    });
    save();
    json(res, 200, { imported: n });
    return true;
  }

  if (method === 'POST' && p === '/api/auth/login') {
    const body = await readBody(req);
    const loginId = String(body.login || body.cpf || body.email || body.matricula || '').trim();
    const senha = String(body.senha || '');
    const want = body.role === 'professor' ? 'professor' : (body.role === 'admin' ? 'admin' : 'aluno');
    const cpfDigits = digits(loginId);
    let user = null;
    if (cpfDigits.length === 11 && db.users[cpfDigits]) user = db.users[cpfDigits];
    if (!user) {
      const needle = loginId.toLowerCase();
      user = Object.values(db.users).find(u =>
        (u.email && u.email.toLowerCase() === needle) ||
        (u.matricula && String(u.matricula).toLowerCase() === needle)
      ) || null;
    }
    const cpf = user ? user.cpf : (cpfDigits || loginId);
    if (!user) { json(res, 401, { error: 'credenciais' }); return true; }
    if (locked(cpf)) { json(res, 429, { error: 'locked' }); return true; }
    if (!user || user.status === 'inativo' || !verifyPassword(senha, user.senhaSalt, user.senhaHash)) {
      failLogin(cpf);
      json(res, 401, { error: 'credenciais' });
      return true;
    }
    if (user.role !== 'admin' && user.role !== want) {
      json(res, 403, { error: 'role' });
      return true;
    }
    clearFails(cpf);
    const sess = createSession(cpf, !!body.remember);
    setTokenCookie(res, sess.token, Math.floor(sess.ttl / 1000));
    audit(cpf, 'login', user.role);
    json(res, 200, { token: sess.token, user: publicUser(user) });
    return true;
  }

  if (method === 'POST' && p === '/api/auth/logout') {
    const auth = getAuth(req);
    if (auth) { delete db.sessions[auth.token]; save(); }
    setTokenCookie(res, '', 0);
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/auth/recover') {
    const body = await readBody(req);
    const loginId = String(body.login || body.cpf || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const cpfDigits = digits(loginId);
    let user = null;
    if (cpfDigits.length === 11 && db.users[cpfDigits]) user = db.users[cpfDigits];
    if (!user) {
      const needle = loginId.toLowerCase();
      user = Object.values(db.users).find(u =>
        (u.email && u.email.toLowerCase() === needle) ||
        (u.matricula && String(u.matricula).toLowerCase() === needle)
      ) || null;
    }
    if (user && (user.email || '').toLowerCase() === email) {
      audit(user.cpf, 'recover', email);
    }
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'GET' && p === '/api/me') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    json(res, 200, { user: publicUser(auth.user), snapshot: auth.user.role === 'aluno' ? studentSnapshot(auth.user.cpf) : null });
    return true;
  }

  if (method === 'POST' && p === '/api/me/password') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    if (!verifyPassword(body.atual, auth.user.senhaSalt, auth.user.senhaHash)) {
      json(res, 400, { error: 'atual' });
      return true;
    }
    if (String(body.nova || '').length < 8) { json(res, 400, { error: 'senha' }); return true; }
    const hp = hashPassword(body.nova);
    auth.user.senhaSalt = hp.salt;
    auth.user.senhaHash = hp.hash;
    audit(auth.user.cpf, 'password', 'alteração');
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/me/profile') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    if (body.telefone !== undefined) auth.user.telefone = String(body.telefone).slice(0, 20);
    if (body.email && String(body.email).includes('@')) auth.user.email = String(body.email).slice(0, 80);
    audit(auth.user.cpf, 'profile', 'edição');
    save();
    json(res, 200, { user: publicUser(auth.user) });
    return true;
  }

  if (method === 'GET' && p === '/api/academic/grades') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const cpf = auth.user.role === 'aluno' ? auth.user.cpf : digits(url.searchParams.get('cpf'));
    if (auth.user.role === 'aluno' && cpf !== auth.user.cpf) { json(res, 403, { error: 'forbidden' }); return true; }
    json(res, 200, { grades: db.grades[cpf] || {}, snapshot: studentSnapshot(cpf) });
    return true;
  }

  if (method === 'GET' && p === '/api/academic/schedule') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    json(res, 200, { schedule: WEEK_SCHEDULE(), next: nextClass() });
    return true;
  }

  if (method === 'GET' && p === '/api/academic/attendance') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const cpf = auth.user.role === 'aluno' ? auth.user.cpf : digits(url.searchParams.get('cpf') || auth.user.cpf);
    if (auth.user.role === 'aluno' && cpf !== auth.user.cpf) { json(res, 403, { error: 'forbidden' }); return true; }
    const days = Object.keys(db.attendance).sort().slice(-20).map(day => ({
      day,
      mark: (db.attendance[day] || {})[cpf] || 'P'
    }));
    const grades = db.grades[cpf] || {};
    const byDisc = Object.entries(grades).map(([disc, bims]) => {
      const g = bims[2] || bims[0] || { freq: 0 };
      return { disciplina: disc, freq: g.freq, teacher: teacherFor(disc), faltas: Math.max(0, Math.round((100 - g.freq) / 5)) };
    });
    json(res, 200, { days, byDisc });
    return true;
  }

  if (method === 'GET' && p === '/api/academic/history') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (auth.user.role !== 'aluno') { json(res, 200, { rows: [] }); return true; }
    const grades = db.grades[auth.user.cpf] || {};
    const rows = Object.entries(grades).map(([disc, bims]) => {
      const last = bims[2] || bims[0];
      return { ano: '2026 – 3º Ano', disciplina: disc, carga: '80h', nota: last.avg, situacao: situacao(last.avg), teacher: teacherFor(disc) };
    });
    json(res, 200, { rows });
    return true;
  }

  if (method === 'GET' && p === '/api/activities') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const mine = db.activities.map(a => {
      const sub = (db.submissions[a.id] || {})[auth.user.cpf];
      const dueMs = Date.parse(a.due + 'T23:59:59');
      const soon = !sub && dueMs && dueMs - Date.now() < 3 * 86400000 && dueMs >= Date.now();
      return {
        ...a,
        delivered: !!sub,
        deliveredAt: sub ? sub.at : null,
        fileName: sub ? sub.fileName : '',
        note: sub ? sub.note : '',
        comment: sub ? (sub.comment || '') : '',
        grade: sub && sub.grade != null ? sub.grade : null,
        soon
      };
    });
    json(res, 200, { activities: mine });
    return true;
  }

  if (method === 'POST' && p === '/api/activities/submit') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    const act = db.activities.find(a => a.id === body.id);
    if (!act) { json(res, 404, { error: 'not found' }); return true; }
    db.submissions[act.id] = db.submissions[act.id] || {};
    db.submissions[act.id][auth.user.cpf] = {
      at: Date.now(),
      note: String(body.note || '').slice(0, 400),
      fileName: String(body.fileName || 'entrega.txt').slice(0, 80),
      comment: '',
      grade: null
    };
    pushNotif(auth.user.cpf, 'Entrega confirmada: ' + act.title, 'atividades', 'success');
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'GET' && p === '/api/finance') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const list = db.payments[auth.user.cpf] || [];
    json(res, 200, { payments: list });
    return true;
  }

  if (method === 'POST' && p === '/api/finance/boleto') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    const list = db.payments[auth.user.cpf] || [];
    const item = list.find(p => p.id === body.id);
    if (!item) { json(res, 404, { error: 'not found' }); return true; }
    json(res, 200, {
      boleto: {
        id: item.id,
        linha: '23790.00009 00000.000000 00000.000000 1 ' + String(item.value).padStart(10, '0'),
        valor: item.value,
        vencimento: item.due,
        aluno: auth.user.nome + ' ' + auth.user.sobrenome
      }
    });
    return true;
  }

  if (method === 'POST' && p === '/api/requests') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('req'),
      cpf: auth.user.cpf,
      type: String(body.type || 'declaração').slice(0, 40),
      status: 'em análise',
      created: Date.now(),
      note: String(body.note || '').slice(0, 300)
    };
    db.requests.push(item);
    audit(auth.user.cpf, 'request', item.type);
    save();
    json(res, 200, { request: item });
    return true;
  }

  if (method === 'GET' && p.startsWith('/api/requests/') && p.endsWith('/download')) {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const id = p.split('/')[3];
    const item = db.requests.find(r => r.id === id);
    if (!item) { json(res, 404, { error: 'not found' }); return true; }
    if (auth.user.role === 'aluno' && item.cpf !== auth.user.cpf) { json(res, 403, { error: 'forbidden' }); return true; }
    if (item.status !== 'concluído') { json(res, 400, { error: 'pendente' }); return true; }
    json(res, 200, {
      document: {
        id: item.id,
        type: item.type,
        aluno: publicUser(db.users[item.cpf]),
        issuedAt: Date.now(),
        body: 'Documento oficial do Colégio Pequeno Aprendiz. Protocolo ' + item.id + '. Tipo: ' + item.type + '.'
      }
    });
    return true;
  }

  if (method === 'GET' && p === '/api/requests') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const list = auth.user.role === 'aluno'
      ? db.requests.filter(r => r.cpf === auth.user.cpf)
      : db.requests;
    json(res, 200, { requests: list.slice().reverse() });
    return true;
  }

  if (method === 'POST' && p === '/api/tickets') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    const item = {
      id: uid('tkt'),
      cpf: auth.user.cpf,
      subject: String(body.subject || 'Atendimento').slice(0, 80),
      body: String(body.body || '').slice(0, 800),
      status: 'aberto',
      created: Date.now(),
      replies: []
    };
    db.tickets.push(item);
    save();
    json(res, 200, { ticket: item });
    return true;
  }

  if (method === 'GET' && p === '/api/tickets') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const list = auth.user.role === 'admin'
      ? db.tickets
      : db.tickets.filter(t => t.cpf === auth.user.cpf);
    json(res, 200, { tickets: list.slice().reverse() });
    return true;
  }

  if (method === 'POST' && p === '/api/evals') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    db.evals = db.evals.filter(e => !(e.cpf === auth.user.cpf && e.prof === body.prof));
    db.evals.push({
      cpf: auth.user.cpf,
      prof: String(body.prof || '').slice(0, 40),
      stars: Math.max(1, Math.min(5, Number(body.stars) || 1)),
      comment: String(body.comment || '').slice(0, 400),
      at: Date.now()
    });
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'GET' && p === '/api/teacher/students') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const alunos = Object.values(db.users).filter(u => u.role === 'aluno' && u.status !== 'inativo').map(u => {
      const g = ((db.grades[u.cpf] || {})[auth.user.disciplina || 'Matemática'] || [])[2] || { avg: 0, freq: 0 };
      return { ...publicUser(u), nota: g.avg, freq: g.freq };
    });
    json(res, 200, { students: alunos, disciplina: auth.user.disciplina || 'Matemática' });
    return true;
  }

  if (method === 'POST' && p === '/api/teacher/grades') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const body = await readBody(req);
    const disc = auth.user.disciplina || 'Matemática';
    const items = Array.isArray(body.items) ? body.items : [];
    items.forEach(it => {
      const cpf = digits(it.cpf);
      const aluno = db.users[cpf];
      if (!aluno || aluno.role !== 'aluno') return;
      db.grades[cpf] = db.grades[cpf] || seedGrades();
      db.grades[cpf][disc] = db.grades[cpf][disc] || seedGrades()[disc];
      const bim = db.grades[cpf][disc][2];
      const avg = Math.max(0, Math.min(10, Number(it.nota)));
      bim.avg = avg; bim.p1 = avg; bim.trab = avg; bim.part = Math.round(avg);
      pushNotif(cpf, 'Nota atualizada em ' + disc + ': ' + avg, 'boletim', 'info');
    });
    audit(auth.user.cpf, 'grades', disc);
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/teacher/comment') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const body = await readBody(req);
    const act = db.activities.find(a => a.id === body.id);
    const cpf = digits(body.cpf);
    if (!act || !db.submissions[act.id] || !db.submissions[act.id][cpf]) {
      json(res, 404, { error: 'not found' }); return true;
    }
    db.submissions[act.id][cpf].comment = String(body.comment || '').slice(0, 400);
    if (body.grade != null) db.submissions[act.id][cpf].grade = Math.max(0, Math.min(10, Number(body.grade)));
    pushNotif(cpf, 'Comentário do professor em ' + act.title, 'atividades', 'info');
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/teacher/attendance') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const body = await readBody(req);
    const day = String(body.date || new Date().toISOString().slice(0, 10));
    db.attendance[day] = db.attendance[day] || {};
    const marks = body.marks || {};
    Object.keys(marks).forEach(cpf => {
      db.attendance[day][digits(cpf)] = marks[cpf] === 'F' ? 'F' : 'P';
    });
    audit(auth.user.cpf, 'attendance', day);
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/teacher/diary') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const body = await readBody(req);
    db.diary.push({
      id: uid('dia'),
      teacher: auth.user.cpf,
      turma: String(body.turma || '').slice(0, 40),
      content: String(body.content || '').slice(0, 800),
      at: Date.now()
    });
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'POST' && p === '/api/teacher/notice') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['professor', 'admin'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('n'),
      title: String(body.title || 'Aviso').slice(0, 80),
      body: String(body.body || '').slice(0, 600),
      tag: auth.user.role === 'admin' ? 'Institucional' : 'Professor',
      date: new Date().toISOString().slice(0, 10),
      author: auth.user.cpf
    };
    db.notices.push(item);
    Object.values(db.users).filter(u => u.role === 'aluno').forEach(u => {
      pushNotif(u.cpf, item.title, 'avisos-mural', item.tag === 'Urgente' ? 'urgent' : 'info');
    });
    save();
    json(res, 200, { notice: item });
    return true;
  }

  if (method === 'GET' && p === '/api/events') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    json(res, 200, { events: db.events || [] });
    return true;
  }

  if (method === 'GET' && p === '/api/notifications') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const list = (db.notifications || []).filter(n => n.cpf === auth.user.cpf).slice().reverse().slice(0, 20);
    json(res, 200, { notifications: list });
    return true;
  }

  if (method === 'POST' && p === '/api/notifications/read') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    (db.notifications || []).forEach(n => {
      if (n.cpf === auth.user.cpf && (!body.id || n.id === body.id)) n.read = true;
    });
    save();
    json(res, 200, { ok: true });
    return true;
  }

  if (method === 'GET' && p === '/api/admin/users') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    json(res, 200, { users: Object.values(db.users).map(publicUser) });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/user') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const role = body.role === 'professor' ? 'professor' : (body.role === 'admin' ? 'admin' : 'aluno');
    const out = upsertUser(body, role);
    if (out.error) { json(res, 400, out); return true; }
    audit(auth.user.cpf, 'admin-create', out.user.cpf);
    json(res, 200, { user: publicUser(out.user) });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/user/status') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const cpf = digits(body.cpf);
    const user = db.users[cpf];
    if (!user) { json(res, 404, { error: 'not found' }); return true; }
    user.status = body.status === 'inativo' ? 'inativo' : 'ativo';
    audit(auth.user.cpf, 'admin-status', cpf + ' ' + user.status);
    save();
    json(res, 200, { user: publicUser(user) });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/request') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const item = db.requests.find(r => r.id === body.id);
    if (!item) { json(res, 404, { error: 'not found' }); return true; }
    item.status = body.status === 'concluído' ? 'concluído' : 'em análise';
    audit(auth.user.cpf, 'admin-request', item.id);
    save();
    json(res, 200, { request: item });
    return true;
  }

  if (method === 'GET' && p === '/api/admin/audit') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    json(res, 200, { audit: db.audit.slice().reverse().slice(0, 80) });
    return true;
  }

  if (method === 'GET' && p === '/api/dashboard') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    json(res, 200, {
      user: publicUser(auth.user),
      snapshot: auth.user.role === 'aluno' ? studentSnapshot(auth.user.cpf) : null,
      notices: db.notices.slice(-5).reverse(),
      activities: db.activities,
      materials: db.materials
    });
    return true;
  }

  if (method === 'GET' && p === '/api/courses') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    json(res, 200, { courses: db.courses || [] });
    return true;
  }

  if (method === 'GET' && p === '/api/materials') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const q = String(url.searchParams.get('q') || '').toLowerCase();
    const course = String(url.searchParams.get('course') || '');
    let list = db.materials || [];
    if (course) list = list.filter(m => m.course === course);
    if (q) list = list.filter(m => (m.title + ' ' + m.course + ' ' + m.type).toLowerCase().includes(q));
    const recent = (db.recentMaterials[auth.user.cpf] || []).slice(-6).reverse();
    json(res, 200, { materials: list, recent });
    return true;
  }

  if (method === 'POST' && p === '/api/materials/access') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    const mat = (db.materials || []).find(m => m.id === body.id);
    if (!mat) { json(res, 404, { error: 'not found' }); return true; }
    db.recentMaterials[auth.user.cpf] = db.recentMaterials[auth.user.cpf] || [];
    db.recentMaterials[auth.user.cpf] = db.recentMaterials[auth.user.cpf].filter(x => x.id !== mat.id);
    db.recentMaterials[auth.user.cpf].push({ id: mat.id, title: mat.title, at: Date.now() });
    save();
    json(res, 200, { material: mat });
    return true;
  }

  if (method === 'GET' && p === '/api/quizzes') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const list = (db.quizzes || []).map(qz => {
      const att = (db.quizAttempts[qz.id] || {})[auth.user.cpf];
      return { id: qz.id, title: qz.title, subject: qz.subject, open: qz.open, due: qz.due, questions: qz.questions.length, score: att ? att.score : null };
    });
    json(res, 200, { quizzes: list });
    return true;
  }

  if (method === 'GET' && p.startsWith('/api/quizzes/') && !p.endsWith('/submit')) {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const id = p.split('/')[3];
    const qz = (db.quizzes || []).find(q => q.id === id);
    if (!qz) { json(res, 404, { error: 'not found' }); return true; }
    json(res, 200, { quiz: { id: qz.id, title: qz.title, subject: qz.subject, questions: qz.questions.map(q => ({ q: q.q, options: q.options })) } });
    return true;
  }

  if (method === 'POST' && p === '/api/quizzes/submit') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    const qz = (db.quizzes || []).find(q => q.id === body.id);
    if (!qz) { json(res, 404, { error: 'not found' }); return true; }
    const answers = Array.isArray(body.answers) ? body.answers : [];
    let correct = 0;
    qz.questions.forEach((q, i) => { if (Number(answers[i]) === q.answer) correct++; });
    const score = Math.round((correct / qz.questions.length) * 10 * 10) / 10;
    db.quizAttempts[qz.id] = db.quizAttempts[qz.id] || {};
    db.quizAttempts[qz.id][auth.user.cpf] = { score, correct, total: qz.questions.length, at: Date.now() };
    save();
    json(res, 200, { score, correct, total: qz.questions.length });
    return true;
  }

  if (method === 'POST' && p === '/api/notices/read') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    db.noticeReads[auth.user.cpf] = db.noticeReads[auth.user.cpf] || [];
    if (body.id && !db.noticeReads[auth.user.cpf].includes(body.id)) db.noticeReads[auth.user.cpf].push(body.id);
    save();
    json(res, 200, { ok: true, read: db.noticeReads[auth.user.cpf] });
    return true;
  }

  if (method === 'GET' && p === '/api/notices') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const tag = String(url.searchParams.get('tag') || '');
    const date = String(url.searchParams.get('date') || '');
    const read = db.noticeReads[auth.user.cpf] || [];
    let list = db.notices.slice().reverse().map(n => ({ ...n, read: read.includes(n.id) }));
    if (tag) list = list.filter(n => n.tag === tag);
    if (date) list = list.filter(n => n.date === date);
    json(res, 200, { notices: list });
    return true;
  }

  if (method === 'GET' && p === '/api/library') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const q = String(url.searchParams.get('q') || '').toLowerCase();
    let books = (db.books || []).map(b => {
      const taken = (db.loans || []).filter(l => l.bookId === b.id && !l.returned).length;
      return { ...b, available: Math.max(0, b.copies - taken) };
    });
    if (q) books = books.filter(b => (b.title + ' ' + b.author + ' ' + b.subject).toLowerCase().includes(q));
    const mine = (db.loans || []).filter(l => l.cpf === auth.user.cpf);
    json(res, 200, { books, loans: mine });
    return true;
  }

  if (method === 'POST' && p === '/api/library/loan') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['aluno'])) return true;
    const body = await readBody(req);
    const book = (db.books || []).find(b => b.id === body.id);
    if (!book) { json(res, 404, { error: 'not found' }); return true; }
    const taken = (db.loans || []).filter(l => l.bookId === book.id && !l.returned).length;
    if (taken >= book.copies) { json(res, 400, { error: 'indisponível' }); return true; }
    if ((db.loans || []).some(l => l.cpf === auth.user.cpf && l.bookId === book.id && !l.returned)) {
      json(res, 400, { error: 'já emprestado' }); return true;
    }
    const loan = { id: uid('loan'), bookId: book.id, title: book.title, cpf: auth.user.cpf, at: Date.now(), due: Date.now() + 14 * 86400000, returned: false };
    db.loans.push(loan);
    save();
    json(res, 200, { loan });
    return true;
  }

  if (method === 'POST' && p === '/api/library/return') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    const body = await readBody(req);
    const loan = (db.loans || []).find(l => l.id === body.id && l.cpf === auth.user.cpf);
    if (!loan) { json(res, 404, { error: 'not found' }); return true; }
    loan.returned = true;
    loan.returnedAt = Date.now();
    save();
    json(res, 200, { loan });
    return true;
  }

  if (method === 'GET' && p === '/api/faq') {
    json(res, 200, {
      faq: [
        { q: 'Como recupero minha senha?', a: 'Na tela de login, use “Esqueci a senha” com CPF, e-mail ou matrícula e o e-mail cadastrado.' },
        { q: 'Onde vejo minhas notas?', a: 'Menu Acadêmico → Boletim de Notas. As médias são atualizadas pelo professor.' },
        { q: 'Como emito um boleto?', a: 'Em Financeiro, clique em Gerar Boleto na mensalidade pendente.' },
        { q: 'Como solicito declaração?', a: 'Em Secretaria Virtual, escolha o documento. Acompanhe o protocolo na mesma página.' },
        { q: 'O chat não conecta. E agora?', a: 'O portal usa fallback HTTP a cada 1,5s. Recarregue a página ou abra um chamado na Central de Ajuda.' }
      ]
    });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/course') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const item = { id: uid('crs'), name: String(body.name || '').slice(0, 60), teacher: String(body.teacher || '').slice(0, 60), subject: String(body.subject || '').slice(0, 40), aulas: Number(body.aulas) || 0, progress: 0 };
    if (!item.name) { json(res, 400, { error: 'name' }); return true; }
    db.courses.push(item);
    audit(auth.user.cpf, 'admin-course', item.name);
    save();
    json(res, 200, { course: item });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/class') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const item = { id: uid('cls'), name: String(body.name || '').slice(0, 40), course: String(body.course || 'Ensino Médio').slice(0, 40), shift: String(body.shift || 'Matutino').slice(0, 20), students: Number(body.students) || 0 };
    if (!item.name) { json(res, 400, { error: 'name' }); return true; }
    db.classes.push(item);
    audit(auth.user.cpf, 'admin-class', item.name);
    save();
    json(res, 200, { class: item });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/material') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin', 'professor'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('mat'),
      course: String(body.course || '').slice(0, 40),
      title: String(body.title || '').slice(0, 80),
      type: String(body.type || 'PDF').slice(0, 20),
      url: String(body.url || '#').slice(0, 200),
      module: String(body.module || 'Unidade 1').slice(0, 40)
    };
    if (!item.title || !item.course) { json(res, 400, { error: 'dados' }); return true; }
    db.materials.push(item);
    audit(auth.user.cpf, 'admin-material', item.title);
    save();
    json(res, 200, { material: item });
    return true;
  }

  if (method === 'GET' && p === '/api/admin/stats') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const users = Object.values(db.users);
    json(res, 200, {
      alunos: users.filter(u => u.role === 'aluno').length,
      professores: users.filter(u => u.role === 'professor').length,
      admins: users.filter(u => u.role === 'admin').length,
      ativos: users.filter(u => u.status !== 'inativo').length,
      cursos: (db.courses || []).length,
      turmas: (db.classes || []).length,
      atividades: (db.activities || []).length,
      protocolos: (db.requests || []).length,
      chamados: (db.tickets || []).length,
      emprestimos: (db.loans || []).filter(l => !l.returned).length
    });
    return true;
  }

  if (method === 'GET' && p === '/api/admin/catalog') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    json(res, 200, { courses: db.courses || [], classes: db.classes || [], materials: db.materials || [], events: db.events || [], activities: db.activities || [] });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/event') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin', 'professor'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('ev'),
      date: String(body.date || '').slice(0, 10),
      title: String(body.title || '').slice(0, 80),
      desc: String(body.desc || '').slice(0, 120),
      time: String(body.time || '—').slice(0, 8),
      type: String(body.type || 'info').slice(0, 20)
    };
    if (!item.date || !item.title) { json(res, 400, { error: 'dados' }); return true; }
    db.events.push(item);
    audit(auth.user.cpf, 'admin-event', item.title);
    save();
    json(res, 200, { event: item });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/activity') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin', 'professor'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('act'),
      title: String(body.title || '').slice(0, 80),
      subject: String(body.subject || '').slice(0, 40),
      desc: String(body.desc || '').slice(0, 160),
      open: String(body.open || new Date().toISOString().slice(0, 10)),
      due: String(body.due || '').slice(0, 10),
      teacher: auth.user.cpf
    };
    if (!item.title || !item.due) { json(res, 400, { error: 'dados' }); return true; }
    db.activities.push(item);
    Object.values(db.users).filter(u => u.role === 'aluno').forEach(u => {
      pushNotif(u.cpf, 'Nova atividade: ' + item.title, 'atividades', 'info');
    });
    audit(auth.user.cpf, 'admin-activity', item.title);
    save();
    json(res, 200, { activity: item });
    return true;
  }

  if (method === 'POST' && p === '/api/admin/notice') {
    const auth = requireAuth(req, res, json);
    if (!auth) return true;
    if (!requireRole(auth, res, json, ['admin'])) return true;
    const body = await readBody(req);
    const item = {
      id: uid('n'),
      title: String(body.title || 'Aviso').slice(0, 80),
      body: String(body.body || '').slice(0, 600),
      tag: String(body.tag || 'Institucional').slice(0, 20),
      date: new Date().toISOString().slice(0, 10),
      author: auth.user.cpf
    };
    db.notices.push(item);
    Object.values(db.users).filter(u => u.role === 'aluno').forEach(u => {
      pushNotif(u.cpf, item.title, 'avisos-mural', item.tag === 'Urgente' ? 'urgent' : 'info');
    });
    audit(auth.user.cpf, 'admin-notice', item.title);
    save();
    json(res, 200, { notice: item });
    return true;
  }

  return false;
}

module.exports = { handlePortalApi, publicUser, getAuth, digits };
