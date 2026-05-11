/* ===========================
   SmartVocab — js/timer.js
   =========================== */

const THREE_HOURS = 3 * 60 * 60;

export function initTimer(state, saveStateFn, onTimerEnd) {
  setInterval(() => tick(state, saveStateFn, onTimerEnd), 1000);
  tick(state, saveStateFn, onTimerEnd);
}

function tick(state, saveStateFn, onTimerEnd) {
  const elapsed    = Math.floor((Date.now() - state.timerStart) / 1000);
  const remaining  = Math.max(0, THREE_HOURS - elapsed);
  const pct        = ((THREE_HOURS - remaining) / THREE_HOURS) * 100;

  document.getElementById('timer-progress').style.width = pct + '%';

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  document.getElementById('timer-text').textContent =
    h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

  if (remaining === 0) {
    state.timerStart = Date.now();
    saveStateFn();
    onTimerEnd();
  }
}
