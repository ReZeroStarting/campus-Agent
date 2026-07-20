// ═══════════════════════════════════════
//  校园搭子 - 前端 v3（DeepSeek Design System）
// ═══════════════════════════════════════

// ── Icon Helper (inline SVG, no sprite dependency) ──
const ICONS = {
  'calendar-dots': '<rect x="40" y="40" width="176" height="176" rx="16"/><line x1="40" y1="88" x2="216" y2="88"/><line x1="88" y1="24" x2="88" y2="56"/><line x1="168" y1="24" x2="168" y2="56"/><circle cx="96" cy="128" r="8" fill="currentColor" stroke="none"/><circle cx="128" cy="128" r="8" fill="currentColor" stroke="none"/><circle cx="160" cy="128" r="8" fill="currentColor" stroke="none"/>',
  'clipboard-text': '<path d="M160 40a8 8 0 0 1 8 8v16H88V48a8 8 0 0 1 8-8Z"/><rect x="56" y="64" width="144" height="168" rx="16"/><line x1="96" y1="112" x2="160" y2="112"/><line x1="96" y1="144" x2="160" y2="144"/><line x1="96" y1="176" x2="128" y2="176"/>',
  'chart-bar': '<rect x="40" y="144" width="40" height="72" rx="8"/><rect x="108" y="88" width="40" height="128" rx="8"/><rect x="176" y="40" width="40" height="176" rx="8"/>',
  'buildings': '<rect x="32" y="64" width="72" height="168" rx="8"/><line x1="56" y1="96" x2="80" y2="96"/><line x1="56" y1="128" x2="80" y2="128"/><line x1="56" y1="160" x2="80" y2="160"/><rect x="120" y="112" width="72" height="120" rx="8"/><line x1="144" y1="144" x2="168" y2="144"/><line x1="144" y1="176" x2="168" y2="176"/><rect x="160" y="40" width="64" height="72" rx="8"/><line x1="184" y1="64" x2="200" y2="64"/><line x1="184" y1="88" x2="200" y2="88"/>',
  'credit-card': '<rect x="24" y="56" width="208" height="144" rx="16"/><line x1="24" y1="104" x2="232" y2="104"/><line x1="64" y1="160" x2="96" y2="160"/><line x1="120" y1="160" x2="136" y2="160"/>',
  'map-pin': '<circle cx="128" cy="80" r="40"/><path d="M128 232c64-80 64-152 0-152S64 152 64 232Z"/>',
  'clock': '<circle cx="128" cy="128" r="96"/><polyline points="128 72 128 128 176 152"/>',
  'package': '<path d="M128 128 32 72l96-56 96 56-96 56Z"/><polyline points="32 72 128 128 128 216"/><polyline points="224 72 128 128 128 216"/>',
  'shopping-cart': '<circle cx="88" cy="216" r="16"/><circle cx="192" cy="216" r="16"/><path d="M24 40h24l16 24m0 0 24 120a8 8 0 0 0 8 8h80a8 8 0 0 0 8-8l24-104H64Z"/>',
  'graduation-cap': '<path d="M128 136 16 80l112-56 112 56-112 56Z"/><polyline points="48 96 48 176 128 216 208 176 208 96"/><polyline points="80 128 80 184 128 208 176 184 176 128"/>',
  'sun': '<circle cx="128" cy="128" r="48"/><line x1="128" y1="32" x2="128" y2="56"/><line x1="128" y1="200" x2="128" y2="224"/><line x1="56" y1="56" x2="72" y2="72"/><line x1="184" y1="184" x2="200" y2="200"/><line x1="32" y1="128" x2="56" y2="128"/><line x1="200" y1="128" x2="224" y2="128"/><line x1="56" y1="200" x2="72" y2="184"/><line x1="184" y1="72" x2="200" y2="56"/>',
  'spinner': '<line x1="128" y1="32" x2="128" y2="64"/><line x1="196" y1="60" x2="173.3" y2="82.7"/><line x1="224" y1="128" x2="192" y2="128"/><line x1="196" y1="196" x2="173.3" y2="173.3"/><line x1="128" y1="224" x2="128" y2="192"/><line x1="60" y1="196" x2="82.7" y2="173.3"/><line x1="32" y1="128" x2="64" y2="128"/><line x1="60" y1="60" x2="82.7" y2="82.7"/>',
  'article': '<rect x="40" y="40" width="176" height="176" rx="16"/><line x1="88" y1="96" x2="168" y2="96"/><line x1="88" y1="128" x2="168" y2="128"/><line x1="88" y1="160" x2="136" y2="160"/>',
  'caret-right': '<polyline points="96 48 176 128 96 208"/>',
  'house': '<path d="M152 208v-56a8 8 0 0 0-8-8h-32a8 8 0 0 0-8 8v56a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8v-92.54a8 8 0 0 1 2.62-5.92l85.37-75.66a8 8 0 0 1 10.02 0l85.37 75.66a8 8 0 0 1 2.62 5.92V208a8 8 0 0 1-8 8h-56a8 8 0 0 1-8-8Z"/>',
  'robot': '<rect x="32" y="56" width="192" height="144" rx="24"/><circle cx="92" cy="112" r="12"/><circle cx="164" cy="112" r="12"/><line x1="128" y1="136" x2="128" y2="168"/><line x1="92" y1="168" x2="164" y2="168"/><line x1="80" y1="56" x2="80" y2="32"/><line x1="176" y1="56" x2="176" y2="32"/><circle cx="84" cy="192" r="12"/><circle cx="172" cy="192" r="12"/>',
  'squares-four': '<rect x="40" y="40" width="72" height="72" rx="12"/><rect x="144" y="40" width="72" height="72" rx="12"/><rect x="40" y="144" width="72" height="72" rx="12"/><rect x="144" y="144" width="72" height="72" rx="12"/>',
  'users': '<circle cx="92" cy="56" r="24"/><path d="M150 104a56 56 0 0 0-116 0"/><circle cx="176" cy="96" r="20"/><path d="M220 144a48 48 0 0 0-88 0"/>',
  'user': '<circle cx="128" cy="80" r="40"/><path d="M64 216a96 96 0 0 1 128 0"/>',
  'user-circle': '<circle cx="128" cy="128" r="96"/><circle cx="128" cy="92" r="32"/><path d="M64 200a80 80 0 0 1 128 0"/>',
  'arrow-left': '<line x1="216" y1="128" x2="40" y2="128"/><polyline points="96 72 40 128 96 184"/>',
  'chat-circle-text': '<path d="M128 224a96 96 0 1 0-96-96c0 24.3 4.7 47.4 13.2 68.77L32 232l35.23-13.2A95.04 95.04 0 0 0 128 224Z"/><line x1="96" y1="112" x2="160" y2="112"/><line x1="96" y1="144" x2="160" y2="144"/>',
  'magnifying-glass': '<circle cx="112" cy="112" r="72"/><line x1="168" y1="168" x2="224" y2="224"/>',
};

const ICON_SIZES = { 'icon-sm': 14, 'icon-md': 20, 'icon-lg': 24, 'icon-xl': 28, 'zone-item-icon': 22, 'nav-icon': 22 };

function iconSVG(name, cls) {
  const c = cls || '';
  const size = ICON_SIZES[c] || 18;
  const body = ICONS[name] || '';
  return `<svg class="icon ${c}" width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ── Utility ──
const API = '/api/chat';
const DATA = '/api/data';

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

function el(id) { return document.getElementById(id); }
function q(sel, ctx) { return (ctx || document).querySelector(sel); }
function qa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

const WEEKDAY = ['日','一','二','三','四','五','六'];
const SECTION_LABEL = {
  secondhand: '二手交易', lostfound: '失物招领',
  coursereview: '课程评价', activity: '校园活动',
  general: '综合讨论', help: '互助问答',
};

// ── Navigation ──
function switchTab(tab) {
  qa('.page').forEach(p => p.classList.remove('active'));
  qa('.nav-item').forEach(n => n.classList.remove('active'));
  const page = el('page-' + tab);
  if (page) page.classList.add('active');
  const nav = q('[data-tab="' + tab + '"]');
  if (nav) nav.classList.add('active');

  if (tab === 'agent') { chat.scrollTop = chat.scrollHeight; input.focus(); }
  if (tab === 'community') commLoad('forum');
  if (tab === 'profile') profileLoad();
}

document.querySelectorAll('.nav-item').forEach(b =>
  b.addEventListener('click', () => switchTab(b.dataset.tab))
);

// ═══════════════════════════════════════
//  综合区 — Card Renderers
// ═══════════════════════════════════════

const zoneRenderers = {
  async schedule(data) {
    const w = data.weatherEmoji || '⛅';
    const wt = data.weather ? `${data.weather.condition} ${data.weather.tempLow}~${data.weather.tempHigh}°C` : '';
    let html = `<div class="card weather-card">
      <span class="w-icon">${w}</span>
      <div><b>${wt || '天气数据暂不可用'}</b></div>
      <div class="w-tip">${data.weather?.tips || ''}</div>
    </div>`;
    if (!data.courses || !data.courses.length) {
      html += `<div class="card empty-card">📭 ${data.isWeekend ? '周末没课，好好休息吧~' : '今天没有排课'}</div>`;
    } else {
      const early8 = data.courses[0].startTime === '08:00';
      html += `<div class="card-list-title">${iconSVG('calendar-dots','icon-sm')} 今日 ${data.count} 节课 ${early8 ? '🕗 第一节是早八！' : ''}</div>`;
      for (const c of data.courses) {
        const isEarly = c.startTime === '08:00';
        html += `<div class="card course-card">
          <div class="course-time">${c.startTime}-${c.endTime}</div>
          <div class="course-info">
            <div class="course-name">${c.name}</div>
            <div class="course-detail">${c.teacher} · ${c.location || '待定'} ${isEarly ? '🕗 早八' : ''}</div>
          </div>
        </div>`;
      }
    }
    return html;
  },

  async exam(data) {
    let html = `<div class="card stat-card">
      <span>📊 本周 <b>${data.thisWeek}</b> 场考试</span>
      <span>共 ${data.total} 门待考</span>
    </div>`;
    if (!data.exams?.length) {
      html += `<div class="card empty-card">🎉 暂无近期考试</div>`;
    } else {
      for (const e of data.exams) {
        const urgency = e.daysLeft === 0 ? '🔴 今天！' : e.daysLeft === 1 ? '🟠 明天' : e.daysLeft <= 3 ? `🟡 ${e.daysLeft}天后` : `📅 ${e.daysLeft}天后`;
        html += `<div class="card exam-card">
          <div class="exam-urgency">${urgency}</div>
          <div class="exam-info">
            <div class="exam-name">${e.exam.courseName}</div>
            <div class="exam-detail">${e.exam.time || ''} · ${e.exam.location || '待定'} · ${e.exam.note || ''}</div>
          </div>
          <div class="exam-countdown">D-${e.daysLeft}</div>
        </div>`;
      }
    }
    return html;
  },

  async grade(data) {
    const color = data.gpa >= 3.5 ? '#10B981' : data.gpa >= 3.0 ? '#F59E0B' : '#EF4444';
    let html = `<div class="card gpa-card">
      <div class="gpa-big" style="color:${color}">${data.gpa?.toFixed(2) || '--'}</div>
      <div class="gpa-label">GPA · ${data.totalCredits} 学分</div>
    </div>`;
    if (data.trend?.length) {
      html += `<div class="card-list-title">${iconSVG('chart-bar','icon-sm')} 学期趋势</div>
        <div class="card trend-bar">`;
      const maxGpa = Math.max(...data.trend.map(t => t.gpa), 1);
      for (const t of data.trend) {
        const h = (t.gpa / maxGpa * 100).toFixed(0);
        html += `<div class="trend-item"><div class="trend-fill" style="height:${h}%"></div><span>${t.semester}</span><span>${t.gpa.toFixed(2)}</span></div>`;
      }
      html += `</div>`;
    }
    if (data.grades?.length) {
      html += `<div class="card-list-title">${iconSVG('article','icon-sm')} 各科成绩</div>`;
      for (const g of data.grades.slice(0, 8)) {
        html += `<div class="card grade-row">
          <span>${g.courseName}</span>
          <span class="grade-score">${g.score || g.grade || '--'}</span>
          <span class="grade-credit">${g.credits}学分</span>
        </div>`;
      }
    }
    return html;
  },

  async classroom(data) {
    let html = '';
    for (const [bld, rooms] of Object.entries(data.byBuilding || {})) {
      html += `<div class="card-list-title">${iconSVG('buildings','icon-sm')} ${bld}（${rooms.length} 间）</div>`;
      for (const r of rooms.slice(0, 5)) {
        const tags = [];
        if (r.room.hasAC) tags.push('空调');
        if (r.room.hasSocket) tags.push('插座');
        html += `<div class="card class-card">
          <div class="class-name">${r.room.name} <span class="class-tags">${tags.join(' · ')}</span></div>
          <div class="class-detail">${r.room.seats || '?'}座 · ${r.room.floor || ''}楼 · 下节占用: ${r.nextOccupied || '无'}</div>
        </div>`;
      }
    }
    if (!html) html = `<div class="card empty-card">暂无可用的空教室</div>`;
    return html;
  },

  async card(data) {
    let html = `<div class="card balance-card">
      <div class="balance-icon">${iconSVG('credit-card','icon-lg')}</div>
      <div class="balance-num">¥${data.balance?.toFixed(1) || '0.0'}</div>
      <div class="balance-status">${data.statusText}</div>
    </div>
    <div class="card stat-card">
      <span>💸 今日消费 <b>¥${data.todaySpent?.toFixed(1) || '0'}</b></span>
      <span>📅 本周消费 <b>¥${data.weekSpent?.toFixed(1) || '0'}</b></span>
    </div>`;
    if (data.byCategory) {
      html += `<div class="card-list-title">${iconSVG('chart-bar','icon-sm')} 本周消费分类</div>`;
      for (const [cat, amount] of Object.entries(data.byCategory)) {
        html += `<div class="card cat-row">
          <span>${cat}</span>
          <span>¥${Number(amount).toFixed(1)}</span>
        </div>`;
      }
    }
    if (data.todayTx?.length) {
      html += `<div class="card-list-title">${iconSVG('clock','icon-sm')} 今日流水</div>`;
      for (const t of data.todayTx.slice(0, 8)) {
        const time = new Date(t.time);
        const ts = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;
        html += `<div class="card tx-row">
          <span>${ts}</span>
          <span>${t.location}</span>
          <span>−¥${Math.abs(t.amount).toFixed(1)}</span>
        </div>`;
      }
    }
    return html;
  },

  async map(data) {
    let html = '';
    for (const [type, blds] of Object.entries(data.byType || {})) {
      html += `<div class="card-list-title">${iconSVG('map-pin','icon-sm')} ${type}（${blds.length} 处）</div>`;
      for (const b of blds) {
        html += `<div class="card map-card">
          <div class="map-name">${b.name}</div>
          <div class="map-desc">${b.description || ''} · ${b.floor || ''} · ${b.openTime || ''}-${b.closeTime || ''}</div>
          ${b.services?.length ? `<div class="map-services">${b.services.map(s => '<span class="tag">'+s+'</span>').join('')}</div>` : ''}
        </div>`;
      }
    }
    return html;
  },
};

const ZONE_TITLES = {
  schedule: iconSVG('calendar-dots','icon-sm') + ' 今日课表',
  exam: iconSVG('clipboard-text','icon-sm') + ' 考试日程',
  grade: iconSVG('chart-bar','icon-sm') + ' 成绩绩点',
  classroom: iconSVG('buildings','icon-sm') + ' 空教室',
  card: iconSVG('credit-card','icon-sm') + ' 一卡通',
  map: iconSVG('map-pin','icon-sm') + ' 校园地图',
};

let currentZone = '';

async function zoneLoad(type) {
  currentZone = type;
  el('zone-grid').classList.add('hidden');
  el('zone-detail').classList.remove('hidden');
  el('zone-detail-title').innerHTML = ZONE_TITLES[type] || type;
  el('zone-detail-body').innerHTML = `<div class="loading-spinner">${iconSVG('spinner','icon-spin icon-lg')}<span>加载中…</span></div>`;
  try {
    const data = await fetchJSON(DATA + '/zone/' + type);
    const render = zoneRenderers[type];
    const html = render ? await render(data) : '<div class="card empty-card">暂无数据</div>';
    el('zone-detail-body').innerHTML = html;
  } catch (e) {
    el('zone-detail-body').innerHTML = '<div class="card empty-card">❌ 加载失败，请检查服务是否启动</div>';
  }
}

function zoneBack() {
  el('zone-grid').classList.remove('hidden');
  el('zone-detail').classList.add('hidden');
  currentZone = '';
}

// ═══════════════════════════════════════
//  社区 — 帖子/活动卡片
// ═══════════════════════════════════════

function commLoad(type) {
  qa('.comm-tab').forEach(t => t.classList.remove('active'));
  const labels = { forum:'论坛热帖', events:'校园活动', secondhand:'二手交易', lostfound:'失物招领' };
  qa('#comm-tabs .comm-tab').forEach(t => {
    if (t.textContent.includes(labels[type])) t.classList.add('active');
  });
  el('comm-body').innerHTML = `<div class="loading-spinner">${iconSVG('spinner','icon-spin icon-lg')}<span>加载中…</span></div>`;

  fetchJSON(DATA + '/community/' + type).then(data => {
    let html = '';
    if (type === 'forum') {
      for (const sec of Object.keys(data.sections || {})) {
        const posts = data.sections[sec];
        html += `<div class="card-list-title">${SECTION_LABEL[sec] || sec}（${posts.length} 帖）</div>`;
        for (const p of posts) {
          html += `<div class="card post-card">
            <div class="post-title">${p.hot ? '🔥 ' : ''}${p.title}</div>
            <div class="post-meta">${p.author} · ${timeAgo(p.createdAt)} · ${p.replyCount}回复 · ${p.viewCount}浏览</div>
            <div class="post-tags">${(p.tags || []).map(t => '<span class="tag">#'+t+'</span>').join(' ')}</div>
          </div>`;
        }
      }
      if (!Object.keys(data.sections || {}).length) html += '<div class="card empty-card">暂无帖子</div>';
    } else if (type === 'events') {
      if (!data.events?.length) html += '<div class="card empty-card">近期暂无活动</div>';
      else for (const e of data.events) {
        html += `<div class="card event-card">
          <div class="event-summary">${e.summary}</div>
          <div class="event-detail">${e.detail?.date || ''} · ${e.detail?.time || ''} · ${e.detail?.location || ''} · ${e.detail?.organizer || ''}</div>
          ${e.detail?.hasLottery ? '<span class="tag">🎁 有抽奖</span>' : ''}
        </div>`;
      }
    } else {
      const posts = data.posts || [];
      if (!posts.length) html += '<div class="card empty-card">暂无内容</div>';
      else for (const p of posts) {
        html += `<div class="card post-card">
          <div class="post-title">${p.title}</div>
          <div class="post-meta">${p.author} · ${timeAgo(p.createdAt)} · ${p.replyCount}回复</div>
          <div class="post-preview">${p.content?.substring(0, 100)}…</div>
          ${p.tags?.length ? `<div class="post-tags">${p.tags.map(t => '<span class="tag">#'+t+'</span>').join(' ')}</div>` : ''}
        </div>`;
      }
    }
    el('comm-body').innerHTML = html;
  }).catch(() => {
    el('comm-body').innerHTML = '<div class="card empty-card">❌ 加载失败</div>';
  });
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
  return Math.floor(diff / 86400) + '天前';
}

// ═══════════════════════════════════════
//  个人主页
// ═══════════════════════════════════════

async function profileLoad() {
  el('profile-body').innerHTML = `<div class="loading-spinner">${iconSVG('spinner','icon-spin icon-lg')}<span>加载中…</span></div>`;
  try {
    const data = await fetchJSON(DATA + '/profile');
    let html = `
      <div class="profile-hero">
        <div class="profile-avatar">${iconSVG('graduation-cap','icon-xl')}</div>
        <div class="profile-name">同学你好</div>
      </div>
      <div class="card balance-card">
        <div class="balance-icon">${iconSVG('credit-card','icon-lg')}</div>
        <div class="balance-num">¥${data.card?.balance?.toFixed(1) || '--'}</div>
        <div class="balance-status">${data.card?.statusText || ''} · 今日消费 ¥${data.card?.todaySpent?.toFixed(1) || '0'}</div>
      </div>`;

    if (data.exams?.length) {
      html += `<div class="card-list-title">${iconSVG('clipboard-text','icon-sm')} 最近考试</div>`;
      for (const e of data.exams) {
        html += `<div class="card sm-card">
          <span>${e.daysLeft === 0 ? '🔴 今天' : e.daysLeft === 1 ? '🟠 明天' : '📅 ' + e.daysLeft + '天后'}</span>
          <span>${e.name} · ${e.location || ''}</span>
        </div>`;
      }
    }

    if (data.gpa) {
      html += `<div class="card-list-title">${iconSVG('chart-bar','icon-sm')} 绩点趋势</div>
        <div class="card stat-card">
          <span>GPA <b>${data.gpa.gpa?.toFixed(2) || '--'}</b></span>
          <span>学分 ${data.gpa.totalCredits || 0}</span>
        </div>`;
    }

    if (data.delivery?.packages?.length) {
      html += `<div class="card-list-title">${iconSVG('package','icon-sm')} 待取快递</div>`;
      for (const p of data.delivery.packages) {
        html += `<div class="card sm-card"><span>${p.carrier}</span><span>${p.desc}</span><span>取件码: ${p.code}</span></div>`;
      }
    } else {
      html += `<div class="card empty-card" style="margin: 8px 0">${iconSVG('package','icon-md')} 暂无待取快递</div>`;
    }

    if (data.delivery?.orders?.length) {
      html += `<div class="card-list-title">${iconSVG('shopping-cart','icon-sm')} 外卖状态</div>`;
      for (const o of data.delivery.orders) {
        html += `<div class="card sm-card"><span>${o.platform}</span><span>${o.restaurant}</span><span>${o.status}</span></div>`;
      }
    }

    el('profile-body').innerHTML = html;
  } catch (e) {
    el('profile-body').innerHTML = '<div class="card empty-card">❌ 加载失败</div>';
  }
}

// ═══════════════════════════════════════
//  Agent 聊天
// ═══════════════════════════════════════
const chat = el('chat');
const input = el('input');
const sendBtn = el('send');
const suggestionsEl = el('suggestions');

showWelcome();
sendBtn.addEventListener('click', send);
input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

async function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.focus();
  addBubble(text, 'user');
  showTyping();
  try {
    const r = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text}) });
    const data = await r.json();
    removeTyping();
    addBubble(data.text, 'agent');
    setSuggestions(data.suggestions || []);
  } catch {
    removeTyping();
    addBubble('😵 网络出问题了，稍后重试~', 'agent');
  }
}

function addBubble(text, role) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = text + '<div class="time">' + timeNow() + '</div>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div'); div.className = 'typing'; div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
function removeTyping() { const e = el('typing'); if (e) e.remove(); }

function setSuggestions(sugs) {
  if (!sugs?.length) { suggestionsEl.innerHTML = ''; return; }
  suggestionsEl.innerHTML = sugs.map(s => '<button>' + s + '</button>').join('');
  qa('button', suggestionsEl).forEach(b => b.addEventListener('click', () => {
    input.value = b.textContent;
    send();
  }));
}

function showWelcome() {
  chat.innerHTML = `<div class="welcome">
    <h2>🎒</h2><p>你的大学生活助手</p>
    <p style="font-size:13px;color:#999">说一句话，琐事全安排好</p>
    <div class="quick-start">
      <button onclick="quickStart('早安')">${iconSVG('sun','icon-sm')} 早安</button>
      <button onclick="quickStart('明天什么课')">${iconSVG('calendar-dots','icon-sm')} 课表</button>
      <button onclick="quickStart('查快递')">${iconSVG('package','icon-sm')} 快递</button>
      <button onclick="quickStart('考试倒计时')">${iconSVG('clipboard-text','icon-sm')} 考试</button>
      <button onclick="quickStart('绩点多少')">${iconSVG('chart-bar','icon-sm')} 绩点</button>
      <button onclick="quickStart('论坛')">${iconSVG('chat-circle-text','icon-sm')} 论坛</button>
      <button onclick="quickStart('教三在哪')">${iconSVG('map-pin','icon-sm')} 地图</button>
      <button onclick="quickStart('找空教室')">${iconSVG('buildings','icon-sm')} 教室</button>
    </div></div>`;
}
function quickStart(text) { input.value = text; send(); }
function timeNow() { const d = new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

// ═══════════════════════════════════════
//  对话管理 — 历史 & 新对话
// ═══════════════════════════════════════

let historyState = 'idle'; // 'idle' | 'list' | 'detail'
let historySessions = [];
let historyViewSessionId = null;

const historyOverlay = el('history-overlay');
const historyPanel = el('history-panel');
const historyBody = el('history-panel-body');
const historyTitle = el('history-panel-title');

// ── 打开历史面板 ──
async function openHistory() {
  historyState = 'list';
  historyTitle.textContent = '历史对话';
  historyBody.innerHTML = `<div class="loading-spinner">${iconSVG('spinner','icon-spin icon-lg')}<span>加载中…</span></div>`;
  historyOverlay.classList.add('open');
  historyPanel.classList.add('open');

  try {
    const data = await fetchJSON('/api/conversations');
    historySessions = data.sessions || [];
    renderSessionList();
  } catch (e) {
    historyBody.innerHTML = '<div class="history-empty"><div class="history-empty-icon">⚠️</div><div>加载失败，请重试</div></div>';
  }
}

// ── 关闭面板 ──
function closeHistory() {
  historyOverlay.classList.remove('open');
  historyPanel.classList.remove('open');
  historyState = 'idle';
  historyViewSessionId = null;
}

// ── 返回（列表 ← 详情 ← 面板） ──
function historyBack() {
  if (historyState === 'detail') {
    // 从详情回到列表
    historyState = 'list';
    historyTitle.textContent = '历史对话';
    historyViewSessionId = null;
    renderSessionList();
  } else {
    closeHistory();
  }
}

// ── 渲染会话列表 ──
function renderSessionList() {
  const sessions = historySessions;
  if (!sessions.length) {
    historyBody.innerHTML = '<div class="history-empty"><div class="history-empty-icon">📭</div><div>还没有历史对话</div><div style="font-size:12px;color:#bbb">聊几句后就会出现在这里</div></div>';
    return;
  }

  let html = '';
  for (const s of sessions) {
    const time = formatSessionTime(s.startTime);
    html += `<div class="history-session" onclick="viewSession('${s.sessionId}')">
      <div class="history-session-info">
        <div class="history-session-title">${escapeHtml(s.title || '无标题')}</div>
        <div class="history-session-meta">${s.messageCount}条消息 · ${time}</div>
      </div>
      <button class="history-session-delete" onclick="event.stopPropagation();deleteHistorySession('${s.sessionId}')" title="删除">
        <svg class="icon icon-sm" width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><line x1="216" y1="56" x2="40" y2="56"/><line x1="104" y1="104" x2="104" y2="168"/><line x1="152" y1="104" x2="152" y2="168"/><path d="M56 56v168a8 8 0 0 0 8 8h128a8 8 0 0 0 8-8V56"/><path d="M88 56V40a8 8 0 0 1 8-8h64a8 8 0 0 1 8 8v16"/></svg>
      </button>
      <svg class="icon icon-sm history-session-arrow" width="14" height="14" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"><polyline points="96 48 176 128 96 208"/></svg>
    </div>`;
  }

  historyBody.innerHTML = html;
}

// ── 删除历史会话 ──
async function deleteHistorySession(sessionId) {
  if (!confirm('确定删除这条对话记录？')) return;
  try {
    const r = await fetch('/api/conversations/' + sessionId, { method: 'DELETE' });
    if (!r.ok) throw new Error();
    const data = await r.json();
    showHistoryToast('已删除：' + (data.deleted || ''));
    closeHistory();
  } catch (e) {
    showHistoryToast('删除失败');
  }
}

// ── 查看会话详情 ──
async function viewSession(sessionId) {
  historyState = 'detail';
  historyViewSessionId = sessionId;
  historyTitle.textContent = '对话详情';
  historyBody.innerHTML = `<div class="loading-spinner">${iconSVG('spinner','icon-spin icon-lg')}<span>加载中…</span></div>`;

  try {
    const session = await fetchJSON('/api/conversations/' + sessionId);
    renderSessionDetail(session);
  } catch (e) {
    historyBody.innerHTML = '<div class="history-empty"><div class="history-empty-icon">⚠️</div><div>加载失败</div></div>';
  }
}

// ── 渲染会话详情 ──
function renderSessionDetail(session) {
  const msgs = session.history || [];
  if (!msgs.length) {
    historyBody.innerHTML = '<div class="history-empty"><div class="history-empty-icon">💬</div><div>空对话</div></div>';
    return;
  }

  let html = '';
  for (const m of msgs) {
    const time = new Date(m.time);
    const ts = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;
    html += `<div class="history-msg ${m.role}">
      <div class="history-msg-role">${m.role === 'user' ? '👤 你' : '🎒 校园搭子'}</div>
      <div class="history-msg-content">${escapeHtml(m.text)}</div>
      <div class="history-msg-time">${ts}</div>
    </div>`;
  }

  // 底部继续对话按钮
  html += `<div class="history-resume-bar">
    <button class="history-resume-btn" onclick="resumeSession('${session.sessionId}')">
      ↩️ 继续这段对话
    </button>
  </div>`;

  historyBody.innerHTML = html;
  // 滚动到底部
  historyBody.scrollTop = 0;
}

// ── 恢复对话 ──
async function resumeSession(sessionId) {
  try {
    const data = await fetch('/api/conversations/' + sessionId + '/resume', { method: 'POST' });
    const result = await data.json();
    if (result.success) {
      closeHistory();
      // 重新加载聊天界面
      chat.innerHTML = '';
      showWelcome();
      // 显示通知
      showHistoryToast('已恢复历史对话（' + result.messageCount + '条消息）');
    }
  } catch (e) {
    showHistoryToast('恢复失败，请重试');
  }
}

// ── 开启新对话 ──
async function newConversation() {
  try {
    await fetch('/api/conversations/new', { method: 'POST' });
    chat.innerHTML = '';
    showWelcome();
    suggestionsEl.innerHTML = '';
    input.value = '';
    input.focus();
    showHistoryToast('✨ 已开启新对话');
  } catch (e) {
    showHistoryToast('操作失败');
  }
}

// ── 提示 Toast ──
function showHistoryToast(msg) {
  const existing = q('.history-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'history-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Toast CSS (注入)
(function addToastCSS() {
  const style = document.createElement('style');
  style.textContent = `
.history-toast{
  position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);
  background:var(--text-primary);color:#FFFFFF;
  padding:10px 24px;border-radius:var(--radius-full);
  font-size:14px;font-weight:500;font-family:var(--font);
  z-index:300;
  opacity:0;
  transition:all .3s cubic-bezier(0.16,1,0.3,1);
  pointer-events:none;
  white-space:nowrap;
}
.history-toast.show{
  opacity:1;
  transform:translateX(-50%) translateY(0);
}
`;
  document.head.appendChild(style);
})();

// ── 辅助函数 ──
function formatSessionTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return '今天 ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return diffDays + '天前';
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 初始加载 ──
commLoad('forum');
profileLoad();
