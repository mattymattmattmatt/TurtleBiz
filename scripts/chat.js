const section = document.getElementById('turtle-chats');
const list = document.getElementById('chat-container');
const scroll = document.getElementById('chat-scroll');
const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const send = document.getElementById('chat-send');
const connection = document.getElementById('chat-connection');
const feedback = document.getElementById('chat-feedback');
const empty = document.getElementById('chat-empty');
const earlier = document.getElementById('chat-older');
const latest = document.getElementById('chat-latest');
const retry = document.getElementById('chat-retry');
const announcement = document.getElementById('chat-announcement');
const draftKey = 'turtlebiz:chat:draft';
let api, unsubscribe, loadingTimer, sendingTimer;
let inView = false, connecting = false, connected = false, sending = false;
let received = false, generation = 0, visibleCount = 40;
let messages = [], knownIds = new Set();

try { input.value = (sessionStorage.getItem(draftKey) || '').slice(0, 150); } catch {}

function saveDraft() {
  try {
    if (input.value) sessionStorage.setItem(draftKey, input.value);
    else sessionStorage.removeItem(draftKey);
  } catch {}
}

function updateComposer() {
  document.getElementById('chat-remaining').textContent = `${input.value.length} / 150`;
  send.disabled = sending || !connected || !input.value.trim() || input.value.length > 150;
  input.readOnly = sending;
  send.querySelector('span').textContent = sending ? 'Sending…' : 'Send';
  form.setAttribute('aria-busy', String(sending));
}

function setConnection(label, state) {
  connection.querySelector('span:last-child').textContent = label;
  connection.dataset.state = state;
  connected = state === 'live';
  updateComposer();
}

function showFeedback(message = '') {
  feedback.textContent = message;
  feedback.hidden = !message;
}

function timeOf(message) {
  try {
    const value = message.timestamp;
    const time = typeof value?.toMillis === 'function' ? value.toMillis()
      : typeof value === 'number' ? value : 0;
    return Number.isFinite(time) && time > 0 ? time : message.pending ? Date.now() : 0;
  } catch { return 0; }
}

function atBottom() {
  return scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 70;
}

function goToLatest() {
  scroll.scrollTop = scroll.scrollHeight;
  latest.hidden = true;
}

function render({ initial = false, loadEarlier = false } = {}) {
  const follow = initial || (!loadEarlier && atBottom());
  const top = scroll.getBoundingClientRect().top;
  const anchor = [...list.children].find(node => node.getBoundingClientRect().bottom > top);
  const anchorId = anchor?.dataset.messageId;
  const anchorOffset = anchor ? anchor.getBoundingClientRect().top - top : 0;
  const fragment = document.createDocumentFragment();
  for (const message of messages.slice(-visibleCount)) {
    const row = document.createElement('li');
    row.className = 'chat-message';
    row.dataset.messageId = message.id;
    const avatar = document.createElement('span');
    avatar.className = 'chat-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.append(document.getElementById('chat-avatar-template').content.cloneNode(true));
    const body = document.createElement('div');
    body.className = 'chat-message-body';
    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';
    const name = document.createElement('strong');
    name.textContent = 'A fellow turtle';
    const time = document.createElement('time');
    const milliseconds = timeOf(message);
    if (message.pending) time.textContent = 'Sending…';
    else if (milliseconds) {
      const date = new Date(milliseconds);
      if (Number.isFinite(date.getTime())) {
        time.dateTime = date.toISOString();
        time.textContent = date.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else time.textContent = 'Earlier chat';
    } else time.textContent = 'Earlier chat';
    meta.append(name, time);
    const text = document.createElement('p');
    text.textContent = typeof message.text === 'string' ? message.text : '';
    body.append(meta, text);
    row.append(avatar, body);
    fragment.append(row);
  }
  list.replaceChildren(fragment);
  earlier.hidden = visibleCount >= messages.length;
  if (!earlier.hidden) earlier.textContent = `Load earlier messages (${messages.length - visibleCount})`;
  document.getElementById('chat-count').textContent = `${messages.length} ${messages.length === 1 ? 'message' : 'messages'} in the pond`;
  empty.hidden = messages.length > 0;
  if (follow) goToLatest();
  else {
    const nextAnchor = [...list.children].find(node => node.dataset.messageId === anchorId);
    if (nextAnchor) scroll.scrollTop += nextAnchor.getBoundingClientRect().top - scroll.getBoundingClientRect().top - anchorOffset;
  }
}

function receive(snapshot) {
  if (snapshot.fromCache && !snapshot.messages.length && received) {
    setConnection(navigator.onLine ? 'Reconnecting' : 'Offline', 'waiting');
    return;
  }
  const first = !received;
  const incoming = snapshot.messages.filter(message => !knownIds.has(message.id)).length;
  const wasAtBottom = atBottom();
  if (!first && !wasAtBottom) visibleCount += incoming;
  messages = snapshot.messages.slice().sort((a, b) => timeOf(a) - timeOf(b) || a.id.localeCompare(b.id));
  knownIds = new Set(messages.map(message => message.id));
  if (!snapshot.fromCache || messages.length) {
    received = true;
    render({ initial: first });
  }
  if (!snapshot.fromCache) {
    clearTimeout(loadingTimer);
    setConnection('Live', 'live');
    retry.hidden = true;
    if (!sending) showFeedback();
    if (!messages.length) {
      empty.querySelector('strong').textContent = 'Be the first to say shell-o.';
      empty.querySelector('p').textContent = 'A good conversation starts with one little message.';
    }
  } else {
    setConnection(navigator.onLine ? 'Reconnecting' : 'Offline', 'waiting');
  }
  if (!first && incoming) {
    announcement.textContent = `${incoming} new ${incoming === 1 ? 'message' : 'messages'} in Turtle Chat.`;
    if (!wasAtBottom) latest.hidden = false;
  }
}

function fail() {
  clearTimeout(loadingTimer);
  unsubscribe?.();
  unsubscribe = undefined;
  connecting = false;
  setConnection('Unavailable', 'error');
  retry.hidden = false;
  showFeedback('We couldn’t connect to the pond. Your draft is still here. Try reconnecting in a moment.');
  if (!messages.length) {
    empty.querySelector('strong').textContent = 'The pond is a little quiet.';
    empty.querySelector('p').textContent = 'Chat couldn’t connect right now. Please try again.';
  }
}

async function start() {
  if (unsubscribe || connecting || !inView || document.hidden) return;
  if (!navigator.onLine) {
    setConnection('Offline', 'waiting');
    showFeedback('You’re offline. Your draft will stay here while you reconnect.');
    return;
  }
  const attempt = ++generation;
  connecting = true;
  retry.hidden = true;
  setConnection('Connecting', 'waiting');
  loadingTimer = setTimeout(() => {
    showFeedback('The pond is taking a moment to connect. Your draft is safe here.');
    retry.hidden = false;
  }, 15000);
  try {
    api ||= await import('./firebase.js');
    if (attempt !== generation) return;
    unsubscribe = api.subscribeToChats(receive, fail);
  } catch { if (attempt === generation) fail(); }
  finally { if (attempt === generation) connecting = false; }
}

function stop() {
  if (sending) return;
  ++generation;
  clearTimeout(loadingTimer);
  unsubscribe?.();
  unsubscribe = undefined;
  connecting = false;
  setConnection(received ? 'Updates paused' : 'Ready when you are', 'waiting');
}

function syncConnection() {
  if (inView && !document.hidden) start();
  else stop();
}

input.addEventListener('input', () => { saveDraft(); updateComposer(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = input.value.trim();
  if (sending || !connected || !api || !text || text.length > 150) return;
  sending = true;
  saveDraft();
  showFeedback();
  updateComposer();
  sendingTimer = setTimeout(() => showFeedback('Still sending. Keep this tab open; your message will appear when the connection returns.'), 12000);
  try {
    await api.postChat(text);
    input.value = '';
    saveDraft();
    showFeedback('Your message is in the pond. Thanks for stopping by.');
    goToLatest();
  } catch {
    showFeedback('Your message wasn’t sent. Your draft is still here—please try again.');
  } finally {
    clearTimeout(sendingTimer);
    sending = false;
    updateComposer();
    syncConnection();
  }
});

earlier.addEventListener('click', () => {
  visibleCount += 40;
  render({ loadEarlier: true });
  announcement.textContent = 'Earlier messages loaded. Scroll up to read them.';
  if (earlier.hidden) scroll.focus({ preventScroll: true });
});
latest.addEventListener('click', () => { goToLatest(); scroll.focus({ preventScroll: true }); });
scroll.addEventListener('scroll', () => { if (atBottom()) latest.hidden = true; }, { passive: true });
retry.addEventListener('click', () => {
  if (!api) { location.reload(); return; }
  stop(); start();
});
document.addEventListener('visibilitychange', syncConnection);
window.addEventListener('pagehide', stop);
window.addEventListener('pageshow', syncConnection);
window.addEventListener('online', syncConnection);
window.addEventListener('offline', () => {
  setConnection('Offline', 'waiting');
  showFeedback('You’re offline. Your draft will stay here while you reconnect.');
});
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncConnection();
  }, { rootMargin: '240px' }).observe(section);
} else { inView = true; start(); }
updateComposer();
