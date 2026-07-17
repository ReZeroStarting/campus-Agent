const API = '/api/chat';
const chat = document.getElementById('chat');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');
const suggestionsEl = document.getElementById('suggestions');

let currentSuggestions = [];

// ── 欢迎界面 ──
showWelcome();

// ── 事件 ──
sendBtn.addEventListener('click', send);
input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

// ── 发送消息 ──
async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.focus();

  addBubble(text, 'user');
  showTyping();

  try {
    const resp = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await resp.json();
    removeTyping();
    addBubble(data.text, 'agent');
    setSuggestions(data.suggestions || []);
  } catch (err) {
    removeTyping();
    addBubble('网络出问题了，请稍后重试 🙏', 'agent');
  }
}

// ── 气泡 ──
function addBubble(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = text + `<div class="time">${timeNow()}</div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// ── 打字动画 ──
function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
function removeTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

// ── 快捷按钮 ──
function setSuggestions(sugs) {
  currentSuggestions = sugs;
  suggestionsEl.innerHTML = sugs.map(s => `<button>${s}</button>`).join('');
  suggestionsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      send();
    });
  });
}

// ── 欢迎 ──
function showWelcome() {
  chat.innerHTML = `
    <div class="welcome">
      <h2>🎒</h2>
      <p>你的大学生活助手</p>
      <p style="font-size:13px;color:#999">说一句话，琐事全安排好</p>
      <div class="quick-start">
        <button onclick="quickStart('早安')">☀️ 早安</button>
        <button onclick="quickStart('明天什么课')">📚 课表</button>
        <button onclick="quickStart('查快递')">📦 快递</button>
        <button onclick="quickStart('考试倒计时')">📝 考试</button>
        <button onclick="quickStart('绩点多少')">📊 绩点</button>
        <button onclick="quickStart('论坛')">💬 论坛</button>
        <button onclick="quickStart('教三在哪')">🗺️ 地图</button>
        <button onclick="quickStart('找空教室')">🏫 教室</button>
      </div>
    </div>
  `;
}

function quickStart(text) {
  input.value = text;
  send();
}

function timeNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
