/* ===========================
   SmartVocab — js/app.js
   =========================== */

import { initTimer }                                  from './timer.js';
import { initNotification, requestNotification,
         triggerNotification }                        from './notification.js';

// ── State ────────────────────────────────────────────────────────────────────

let VOCAB = [];  // loaded from data/vocab.json

let state = {
  currentIndex:   0,
  activeCategory: 'ทั้งหมด',
  stats:          { known: 0, unknown: 0, total: 0 },
  wordWeights:    {},
  timerStart:     null,
  notifGranted:   false
};

// ── localStorage helpers ──────────────────────────────────────────────────────

function getLS(k)    { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } }
function setLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }

function loadState() {
  const saved = getLS('sv_state');
  if (saved) {
    state.stats          = saved.stats          || state.stats;
    state.wordWeights    = saved.wordWeights    || {};
    state.timerStart     = saved.timerStart     || Date.now();
    state.currentIndex   = saved.currentIndex   || 0;
    state.activeCategory = saved.activeCategory || 'ทั้งหมด';
  } else {
    state.timerStart = Date.now();
  }
}

function saveState() {
  setLS('sv_state', {
    stats:          state.stats,
    wordWeights:    state.wordWeights,
    timerStart:     state.timerStart,
    currentIndex:   state.currentIndex,
    activeCategory: state.activeCategory
  });
}

// ── Vocab helpers ─────────────────────────────────────────────────────────────

function getCategories() {
  const cats = ['ทั้งหมด', ...new Set(VOCAB.map(v => v.category))];
  return cats;
}

function getFilteredVocab() {
  if (state.activeCategory === 'ทั้งหมด') return VOCAB;
  return VOCAB.filter(v => v.category === state.activeCategory);
}

function getNextWord() {
  const filtered = getFilteredVocab();
  if (!filtered.length) return VOCAB[0];

  // Weighted random: unknown words appear 5×, known 1×, unseen 3×
  const weights = filtered.map(w => {
    const wt = state.wordWeights[w.word];
    if (!wt)            return 3;
    if (wt === 'known') return 1;
    return 5;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < filtered.length; i++) {
    r -= weights[i];
    if (r <= 0) return filtered[i];
  }
  return filtered[0];
}

// ── DOM rendering ─────────────────────────────────────────────────────────────

function renderWord(w) {
  document.getElementById('wtype').textContent     = w.type;
  document.getElementById('wcat').textContent      = w.category;
  document.getElementById('wword').textContent     = w.word;
  document.getElementById('wphonetic').textContent = w.phonetic;
  document.getElementById('wmeaning').textContent  = w.meaning;
  document.getElementById('wmeaning_th').textContent = w.meaning_th;
  document.getElementById('wexample').textContent  = '"' + w.example + '"';
}

function buildCatTabs() {
  const container = document.getElementById('cat-tabs');
  container.innerHTML = '';

  getCategories().forEach(cat => {
    const count = cat === 'ทั้งหมด'
      ? VOCAB.length
      : VOCAB.filter(v => v.category === cat).length;

    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (state.activeCategory === cat ? ' active' : '');
    btn.textContent = cat + ' (' + count + ')';
    btn.onclick = () => {
      state.activeCategory = cat;
      state.currentIndex   = 0;
      buildCatTabs();
      renderWord(getNextWord());
      saveState();
    };
    container.appendChild(btn);
  });

  document.getElementById('wcount').textContent =
    getFilteredVocab().length + ' คำ';
}

function updateStats() {
  document.getElementById('s-known').textContent   = state.stats.known;
  document.getElementById('s-unknown').textContent = state.stats.unknown;
  document.getElementById('s-total').textContent   = state.stats.total;
}

// ── Public actions (called from HTML) ─────────────────────────────────────────

window.markWord = function(status) {
  const filtered    = getFilteredVocab();
  const currentWord = filtered[state.currentIndex % filtered.length];

  state.wordWeights[currentWord.word] = status;
  if (status === 'known') state.stats.known++;
  else                    state.stats.unknown++;
  state.stats.total++;

  state.currentIndex++;
  updateStats();
  renderWord(getNextWord());
  saveState();
};

window.speak = function() {
  const word = document.getElementById('wword').textContent;
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
};

window.openNotification = function() {
  requestNotification(state, getNextWord);
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
  // Load vocab from JSON (works on GitHub Pages via fetch)
  const res  = await fetch('data/vocab.json');
  VOCAB      = await res.json();

  loadState();
  buildCatTabs();
  renderWord(getNextWord());
  updateStats();

  initTimer(state, saveState, () => triggerNotification(getNextWord));
  initNotification(state, getNextWord);
}

init();
