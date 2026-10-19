// ─── STAR RATING ───
function rateStar(el, val) {
  el.parentElement.querySelectorAll('.star').forEach((s,i) => s.classList.toggle('active', i < val));
}

// ─── ANIMATE PROGRESS BARS ───
setTimeout(() => {
  document.querySelectorAll('.ava-progress-fill, .progress-bar').forEach(bar => {
    const w = bar.style.width; bar.style.width = '0';
    setTimeout(() => { bar.style.width = w; }, 100);
  });
}, 500);

