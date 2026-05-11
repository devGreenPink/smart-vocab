/* ===========================
   SmartVocab — js/notification.js
   =========================== */

const ICON = 'https://img.icons8.com/fluency/48/book.png';

export function initNotification(state, getNextWordFn) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    fireWelcome(state, getNextWordFn);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => {
      if (p === 'granted') fireWelcome(state, getNextWordFn);
      updateBtn();
    });
  } else {
    updateBtn();
  }
}

export function requestNotification(state, getNextWordFn) {
  if (!('Notification' in window)) {
    alert('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');
    return;
  }
  if (Notification.permission === 'granted') {
    state.notifGranted = true;
    updateBtn();
    new Notification('SmartVocab', { body: '✅ การแจ้งเตือนเปิดใช้งานแล้ว!', icon: ICON });
    return;
  }
  if (Notification.permission === 'denied') {
    alert('การแจ้งเตือนถูกบล็อก กรุณาเปิดในการตั้งค่าเบราว์เซอร์');
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') { state.notifGranted = true; updateBtn(); }
  });
}

export function triggerNotification(getNextWordFn) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const w = getNextWordFn();
  new Notification('SmartVocab · คำศัพท์ใหม่มาแล้ว! 📚', {
    body: w.word + ' — ' + w.meaning_th,
    icon: ICON
  });
}

function fireWelcome(state, getNextWordFn) {
  const w = getNextWordFn();
  new Notification('SmartVocab 📚 ยินดีต้อนรับ!', {
    body: '🔤 คำวันนี้: ' + w.word + '\n' + w.meaning_th,
    icon: ICON
  });
  state.notifGranted = true;
  updateBtn();
}

function updateBtn() {
  const btn = document.getElementById('notif-btn');
  if (!btn) return;
  if (Notification.permission === 'granted') {
    btn.textContent = '✅ การแจ้งเตือนเปิดใช้งานแล้ว';
    btn.classList.add('granted');
  } else if (Notification.permission === 'denied') {
    btn.textContent = '🚫 การแจ้งเตือนถูกบล็อก';
    btn.classList.add('denied');
  }
}
