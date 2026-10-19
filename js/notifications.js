// ─── NOTIFICATIONS ───
const NOTIF_KEY = 'pa_notif_read';
const BADGE_KEY = 'pa_badges_seen';
function loadNotifRead() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); } catch { return []; }
}
function saveNotifRead(ids) {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(ids)); } catch {}
}
function loadBadgesSeen() {
  try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]'); } catch { return []; }
}
function saveBadgesSeen(ids) {
  try { localStorage.setItem(BADGE_KEY, JSON.stringify(ids)); } catch {}
}
function refreshNotifDot() {
  const unread = document.querySelectorAll('.notif-item.unread').length;
  const dot = document.querySelector('.notif-dot');
  if(dot) dot.classList.toggle('off', unread === 0);
}
function markNotifRead(id) {
  if(!id) return;
  const ids = loadNotifRead();
  if(!ids.includes(id)) { ids.push(id); saveNotifRead(ids); }
  document.querySelectorAll('.notif-item[data-notif="'+id+'"]').forEach(n => n.classList.remove('unread'));
  refreshNotifDot();
}
function markAllNotifsRead() {
  const ids = loadNotifRead();
  document.querySelectorAll('.notif-item[data-notif]').forEach(n => {
    const id = n.dataset.notif;
    if(id && !ids.includes(id)) ids.push(id);
    n.classList.remove('unread');
  });
  saveNotifRead(ids);
  refreshNotifDot();
}
function restoreNotifs() {
  const ids = loadNotifRead();
  ids.forEach(id => {
    document.querySelectorAll('.notif-item[data-notif="'+id+'"]').forEach(n => n.classList.remove('unread'));
  });
  refreshNotifDot();
}
function hideNavBadge(page) {
  if(!page) return;
  const seen = loadBadgesSeen();
  if(!seen.includes(page)) { seen.push(page); saveBadgesSeen(seen); }
  document.querySelectorAll('.nav-badge[data-badge="'+page+'"]').forEach(b => b.classList.add('off'));
}
function restoreNavBadges() {
  loadBadgesSeen().forEach(page => {
    document.querySelectorAll('.nav-badge[data-badge="'+page+'"]').forEach(b => b.classList.add('off'));
  });
}
document.getElementById('notifBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profileMenu').classList.remove('open');
  const panel = document.getElementById('notifPanel');
  const opening = !panel.classList.contains('open');
  panel.classList.toggle('open');
  if(opening) {
    document.querySelectorAll('.notif-item.unread').forEach(n => {
      if(n.dataset.notif) markNotifRead(n.dataset.notif);
    });
  }
});
document.addEventListener('click', () => document.getElementById('notifPanel').classList.remove('open'));
document.getElementById('notifPanel').addEventListener('click', e => e.stopPropagation());
document.getElementById('clearNotif').addEventListener('click', () => {
  markAllNotifsRead();
  showToast('Todas notificações marcadas como lidas','info');
});

// ─── NOTIFICATIONS NAVIGATION ───
document.querySelectorAll('.notif-item').forEach((item) => {
  item.addEventListener('click', () => {
    markNotifRead(item.dataset.notif);
    document.getElementById('notifPanel').classList.remove('open');
    goToPage(item.dataset.goto || 'dashboard');
  });
});

