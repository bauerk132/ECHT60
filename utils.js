// ─── UTILS ───────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

function slotToTime(slot) {
  const totalMin = slot * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function timeToSlot(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return Math.round((h * 60 + m) / 15);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = type === 'error' ? 'error show' : 'show';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = '', 2800);
}

function blocksOverlap(a, b) {
  return a.day === b.day && a.startSlot < b.endSlot && b.startSlot < a.endSlot;
}
