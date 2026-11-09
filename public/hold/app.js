// ============================================================================
// HOLD — Official Sapphire Web3 Mini App (Clean SVG Icons, Hidden Cipher, Top 10)
// ============================================================================

const MORSE_MAP = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',   E: '.',     F: '..-.',
  G: '--.',   H: '....',  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',  Q: '--.-',  R: '.-.',
  S: '...',   T: '-',     U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
};

const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

const SVG_ICONS = {
  trophy: `<svg viewBox="0 0 24 24" class="svg-ico"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  server: `<svg viewBox="0 0 24 24" class="svg-ico"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" class="svg-ico"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" class="svg-ico"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  target: `<svg viewBox="0 0 24 24" class="svg-ico"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" class="svg-ico"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" class="svg-ico"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  radio: `<svg viewBox="0 0 24 24" class="svg-ico"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" class="svg-ico"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" class="svg-ico"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></svg>`,
  award: `<svg viewBox="0 0 24 24" class="svg-ico"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" class="svg-ico"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  diamond: `<svg viewBox="0 0 24 24" class="svg-ico"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>`,
  users: `<svg viewBox="0 0 24 24" class="svg-ico"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" class="svg-ico"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" class="svg-ico"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/></svg>`
};

function renderIcon(name) {
  return SVG_ICONS[name] || SVG_ICONS.zap;
}

const STATE = {
  user: null,
  authToken: localStorage.getItem('hold_auth_token') || '',
  username: localStorage.getItem('hold_username') || '',
  mineCat: 'all',
  totalPlayers: 0,
  top10Prizes: [],
  leaderboard: [],
  morseMode: false,
  morseCurrentSignal: '',
  morseDecodedLetters: [],
  morseEvalTimer: null,
  secretTapCount: 0,
  secretTapTimer: null,
  pointerDownTime: 0,
  pendingTaps: 0,
  tapSyncTimer: null,
  turboActiveUntil: 0
};

function haptic(style = 'light') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
  } catch {}
}

const fmtInt = (n) => Math.floor(Number(n) || 0).toLocaleString('en-US');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function showToast(msg) {
  const el = document.getElementById('holdToast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2800);
}

function openModal(title, html, onMount) {
  const bd = document.getElementById('holdModalBackdrop');
  const tEl = document.getElementById('holdModalTitle');
  const bEl = document.getElementById('holdModalBody');
  if (!bd || !tEl || !bEl) return;
  tEl.textContent = title;
  bEl.innerHTML = html;
  bd.hidden = false;
  if (typeof onMount === 'function') onMount(bEl);
}

function closeModal() {
  const bd = document.getElementById('holdModalBackdrop');
  if (bd) bd.hidden = true;
}

function openSheet(sheetName) {
  const map = {
    market: 'sheetMarket',
    mine: 'sheetMine',
    boosts: 'sheetBoosts',
    top: 'sheetTop'
  };
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  const targetId = map[sheetName];
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) el.hidden = false;
    if (sheetName === 'top' && !STATE.top10Prizes.length) {
      loadLeaderboardData();
    }
  }
}

function closeAllSheets() {
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
}

// ---- API Helper ----
function getWebAppInitData() {
  try {
    if (window.Telegram?.WebApp?.initData) return window.Telegram.WebApp.initData;
  } catch {}
  return '';
}

async function api(url, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (STATE.authToken) headers['X-Auth-Token'] = STATE.authToken;
  const initData = getWebAppInitData();
  if (initData) headers['X-Init-Data'] = initData;

  const res = await fetch(url, { ...opts, headers });
  return await res.json();
}

// ---- Sync User State ----
async function syncHoldUser() {
  const params = new URLSearchParams(window.location.search);
  const urlAuth = params.get('auth');
  const urlRef = params.get('ref');
  if (urlAuth) {
    STATE.authToken = urlAuth;
    localStorage.setItem('hold_auth_token', urlAuth);
  }

  let tgUser = null;
  try {
    tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
  } catch {}

  const username = tgUser?.username || STATE.username || `holder_${Math.floor(100 + Math.random() * 899)}`;
  const displayName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : username;
  const paxtaId = tgUser?.id || null;

  const data = await api('/api/hold/sync', {
    method: 'POST',
    body: JSON.stringify({
      username,
      displayName,
      paxtaId,
      ref: urlRef || null
    })
  });

  if (data.ok && data.user) {
    STATE.user = data.user;
    STATE.username = data.user.username;
    localStorage.setItem('hold_username', STATE.username);
    if (data.authToken) {
      STATE.authToken = data.authToken;
      localStorage.setItem('hold_auth_token', data.authToken);
    }
    renderAll();

    if (data.user.passiveEarnedJustNow > 100 && data.user.ogBonusClaimed) {
      showToast(`Passiv daromad: +${fmtInt(data.user.passiveEarnedJustNow)} HOLD`);
    }

    if (!data.user.ogBonusClaimed) {
      setTimeout(openOgSnapshotModal, 350);
    }
  }
}

// ---- Clean Initial OG Snapshot Modal ----
function openOgSnapshotModal() {
  openModal('Welcome to HOLD', `
    <div style="text-align:center;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:14px;">
      <img src="/hold/hold-coin.png" style="width:76px;height:76px;object-fit:contain;" />
      <div>
        <h3 style="font-size:20px;font-weight:800;">Nothing to sell. Just hold.</h3>
        <p style="font-size:13.5px;color:var(--text-2);margin-top:4px;">
          PaxtaGram profilingiz tekshirildi va boshlangʻich HOLD bonusingiz tayyor.
        </p>
      </div>
      <div style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Profil</span>
          <b>@${esc(STATE.user?.username)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Daraja</span>
          <b style="color:#38b6ff;">${(STATE.user?.paxtaId && STATE.user.paxtaId <= 600) ? 'Early Pioneer' : 'Verified Holder'}</b>
        </div>
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnClaimOgNow">Bonusni qabul qilish</button>
    </div>
  `, (body) => {
    body.querySelector('#btnClaimOgNow')?.addEventListener('click', async () => {
      const res = await api('/api/hold/claim-og', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        haptic('medium');
        closeModal();
        renderAll();
        showToast(`+${fmtInt(res.ogDetails?.totalBonus || 80000)} HOLD`);
      }
    });
  });
}

// ---- Render UI ----
function renderAll() {
  const u = STATE.user;
  if (!u) return;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  document.body.classList.toggle('turbo-active', isTurbo);

  // 1. Top Community Pill
  const squads = u.squads || [];
  const activeSq = squads.find(s => s.id === u.squadId) || squads[3] || squads[0] || {
    name: 'Hold Community',
    totalHold: 34_800_000
  };
  const sqAvatar = document.getElementById('uiSquadAvatar');
  const sqName = document.getElementById('uiSquadName');
  const sqScore = document.getElementById('uiSquadScore');
  const sqRank = document.getElementById('uiSquadRankName');
  if (sqAvatar) sqAvatar.textContent = (activeSq.name || 'H').charAt(0).toUpperCase();
  if (sqName) sqName.textContent = activeSq.name;
  if (sqScore) sqScore.textContent = fmtInt(activeSq.totalHold);
  if (sqRank) sqRank.textContent = u.league?.name || 'Bronze';

  // 2. Balance & League
  const balEl = document.getElementById('uiHoldBalance');
  if (balEl) balEl.textContent = fmtInt(u.holdBalance);

  const lgText = document.getElementById('uiLeagueNameText');
  if (lgText) lgText.textContent = u.league?.name || 'Bronze';

  const pphTop = document.getElementById('uiPphTop');
  if (pphTop) pphTop.textContent = `+${fmtInt(u.profitPerHour)}/s`;

  const starsEl = document.getElementById('uiStars');
  if (starsEl) starsEl.textContent = fmtInt(u.stars);

  const pphEl = document.getElementById('uiPph');
  if (pphEl) pphEl.textContent = `+${fmtInt(u.profitPerHour)} / soat`;

  // 3. Energy & Progress Bar
  const eNow = document.getElementById('uiEnergyNow');
  const eMax = document.getElementById('uiEnergyMax');
  const eFill = document.getElementById('uiEnergyBarFill');
  if (eNow) eNow.textContent = fmtInt(u.energy);
  if (eMax) eMax.textContent = `/ ${fmtInt(u.maxEnergy)}`;
  if (eFill) {
    const ePct = Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100));
    eFill.style.width = `${ePct}%`;
  }

  // 4. Admin button
  const adminBtn = document.getElementById('btnOpenAdminModal');
  if (adminBtn) adminBtn.hidden = !u.isAdmin;

  renderSecretCipherHud();
  renderMarketSheet();
  renderMineSheet();
  renderBoostsSheet();
  renderTopSheet();
}

// ---- Hidden Secret Morse Cipher Logic (Unlocked via 3x tap on balance coin) ----
function toggleSecretCipherMode(forceState) {
  STATE.morseMode = typeof forceState === 'boolean' ? forceState : !STATE.morseMode;
  STATE.morseCurrentSignal = '';
  STATE.morseDecodedLetters = [];
  document.body.classList.toggle('morse-mode-active', STATE.morseMode);
  const hud = document.getElementById('secretCipherHud');
  if (hud) hud.hidden = !STATE.morseMode;
  renderSecretCipherHud();
  if (STATE.morseMode) {
    haptic('heavy');
    showToast('Yashirin shifr rejimi yoqildi');
  }
}

function renderSecretCipherHud() {
  const u = STATE.user;
  if (!u || !u.morse) return;

  const slotsEl = document.getElementById('morseWordSlots');
  const guideWord = u.morse.lettersGuide || [];

  if (slotsEl) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < guideWord.length; i++) {
      const decodedChar = STATE.morseDecodedLetters[i] || '';
      const box = document.createElement('div');
      box.className = `morse-slot-box ${decodedChar ? 'filled' : ''}`;
      box.textContent = decodedChar || '·';
      slotsEl.appendChild(box);
    }
  }
}

function updateMorseBufferUI() {
  const bufEl = document.getElementById('uiMorseBuffer');
  if (!bufEl) return;
  if (!STATE.morseCurrentSignal) {
    bufEl.textContent = '• —';
  } else {
    const pretty = STATE.morseCurrentSignal.replace(/\./g, '•').replace(/-/g, '—');
    const matchLetter = REVERSE_MORSE[STATE.morseCurrentSignal] || '?';
    bufEl.textContent = `${pretty} (${matchLetter})`;
  }
}

function pushMorseSymbol(sym) {
  haptic(sym === '.' ? 'light' : 'medium');
  STATE.morseCurrentSignal += sym;
  updateMorseBufferUI();

  clearTimeout(STATE.morseEvalTimer);
  STATE.morseEvalTimer = setTimeout(finalizeCurrentMorseSignal, 850);
}

async function finalizeCurrentMorseSignal() {
  clearTimeout(STATE.morseEvalTimer);
  const sig = STATE.morseCurrentSignal;
  if (!sig) return;
  STATE.morseCurrentSignal = '';
  updateMorseBufferUI();

  const letter = REVERSE_MORSE[sig];
  if (!letter) return;

  const guide = STATE.user?.morse?.lettersGuide || [];
  const nextIdx = STATE.morseDecodedLetters.length;
  const expectedLetter = guide[nextIdx]?.letter;

  if (expectedLetter && letter === expectedLetter) {
    STATE.morseDecodedLetters.push(letter);
    haptic('medium');
    renderSecretCipherHud();

    if (STATE.morseDecodedLetters.length === guide.length) {
      const fullWord = STATE.morseDecodedLetters.join('');
      await submitMorseWord(fullWord);
    }
  } else {
    STATE.morseDecodedLetters = [];
    renderSecretCipherHud();
  }
}

async function submitMorseWord(word) {
  const res = await api('/api/hold/solve-morse', {
    method: 'POST',
    body: JSON.stringify({ username: STATE.username, word })
  });
  if (res.ok && res.user) {
    STATE.user = res.user;
    STATE.morseDecodedLetters = [];
    toggleSecretCipherMode(false);
    haptic('heavy');
    renderAll();
    showToast(`+${fmtInt(res.reward)} HOLD`);
  } else {
    showToast(res.error || 'Notoʻgʻri shifr');
  }
}

// ---- Tap Handling ----
function handleCoinTap(clientX, clientY) {
  const u = STATE.user;
  if (!u) return;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const tapVal = isTurbo ? u.tapPower * 7 : u.tapPower;

  if (!isTurbo && u.energy < u.tapPower) {
    showToast('Energiya tugadi');
    return;
  }

  if (!isTurbo) {
    u.energy = Math.max(0, u.energy - u.tapPower);
  }
  u.holdBalance += tapVal;
  u.lifetimeHold += tapVal;
  STATE.pendingTaps++;

  haptic('light');

  document.getElementById('uiHoldBalance').textContent = fmtInt(u.holdBalance);
  document.getElementById('uiEnergyNow').textContent = fmtInt(u.energy);
  document.getElementById('uiEnergyBarFill').style.width = `${Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100))}%`;

  const floatEl = document.createElement('div');
  floatEl.className = 'tap-float-num';
  floatEl.textContent = `+${tapVal}`;
  floatEl.style.left = `${(clientX || window.innerWidth / 2) - 16}px`;
  floatEl.style.top = `${(clientY || window.innerHeight / 2) - 24}px`;
  document.body.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 760);

  if (!STATE.tapSyncTimer) {
    STATE.tapSyncTimer = setTimeout(flushPendingTaps, 850);
  }
}

async function flushPendingTaps() {
  STATE.tapSyncTimer = null;
  if (STATE.pendingTaps <= 0) return;
  const count = STATE.pendingTaps;
  STATE.pendingTaps = 0;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const res = await api('/api/hold/tap', {
    method: 'POST',
    body: JSON.stringify({
      username: STATE.username,
      taps: count,
      turbo: isTurbo
    })
  });
  if (res.ok && res.user) {
    STATE.user = res.user;
    renderAll();
  }
}

// ---- SHEET 1: Render Frens & Shop (Stars Exchange + Invites + Tasks + Squads) ----
function renderMarketSheet() {
  const u = STATE.user;
  if (!u) return;

  const refCountEl = document.getElementById('uiRefCount');
  if (refCountEl) refCountEl.textContent = `${(u.referrals || []).length} ta`;

  // Stars Power Packs (Buy HOLD & Boosts with Stars)
  const vipList = document.getElementById('vipPacksList');
  if (vipList) {
    vipList.innerHTML = (u.vipPacks || []).map(p => `
      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon('diamond')}</div>
          <div>
            <div class="lrc-title">${esc(p.name)}</div>
            <div class="lrc-sub">${esc(p.desc)}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-pack="${esc(p.id)}">${p.starsPrice} Stars</button>
      </div>
    `).join('');

    vipList.querySelectorAll('[data-pack]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packId = btn.dataset.pack;
        const packObj = (u.vipPacks || []).find(x => x.id === packId);
        const res = await api('/api/hold/buy-vip-pack', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, packId })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          haptic('heavy');
          renderAll();
          showToast(res.message);
        } else if (res.needStars) {
          openTopUpStarsModal(res.deficit || res.required, packObj?.name || 'HOLD Boost');
        } else {
          showToast(res.error || 'Xatolik');
        }
      });
    });
  }

  // Quests
  const qList = document.getElementById('questsList');
  if (qList) {
    qList.innerHTML = '';
    const done = u.tasksCompleted || [];
    for (const q of u.quests || []) {
      const isDone = done.includes(q.id);
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon(q.icon)}</div>
          <div>
            <div class="lrc-title">${esc(q.title)}</div>
            <div class="lrc-sub">+${fmtInt(q.reward)} HOLD</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${isDone ? 'disabled style="opacity:0.45;"' : ''}>
          ${isDone ? 'Olingan' : 'Olish'}
        </button>
      `;
      if (!isDone) {
        row.querySelector('button')?.addEventListener('click', async () => {
          const res = await api('/api/hold/claim-quest', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, questId: q.id })
          });
          if (res.ok && res.user) {
            STATE.user = res.user;
            haptic('medium');
            renderAll();
            showToast(`+${fmtInt(res.reward)} HOLD`);
          } else {
            showToast(res.error || 'Shart hali bajarilmagan');
          }
        });
      }
      qList.appendChild(row);
    }
  }

  // Squads
  const sList = document.getElementById('squadsList');
  if (sList) {
    sList.innerHTML = '';
    for (const sq of u.squads || []) {
      const joined = u.squadId === sq.id;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon(sq.icon)}</div>
          <div>
            <div class="lrc-title">${esc(sq.name)}</div>
            <div class="lrc-sub">${fmtInt(sq.members)} aʼzo · ${fmtInt(sq.totalHold)} HOLD</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${joined ? 'disabled style="opacity:0.55;"' : ''}>
          ${joined ? 'Jamoangiz' : 'Qoʻshilish'}
        </button>
      `;
      if (!joined) {
        row.querySelector('button')?.addEventListener('click', async () => {
          const res = await api('/api/hold/join-squad', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username, squadId: sq.id })
          });
          if (res.ok && res.user) {
            STATE.user = res.user;
            haptic('medium');
            renderAll();
            showToast(res.message);
          }
        });
      }
      sList.appendChild(row);
    }
  }
}

// ---- SHEET 2: Render Mine & Daily Combo (Crystal-Clear & Intuitive) ----
function renderMineSheet() {
  const u = STATE.user;
  if (!u) return;

  // 3 Combo Slots
  const slotsRow = document.getElementById('comboSlotsRow');
  if (slotsRow) {
    const foundIds = u.combo?.foundCardIds || [];
    slotsRow.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const cId = foundIds[i];
      const cardObj = (u.cards || []).find(c => c.id === cId);
      const slot = document.createElement('div');
      slot.className = `combo-slot ${cardObj ? 'revealed' : ''}`;
      slot.innerHTML = cardObj
        ? `<div class="lrc-ico" style="width:32px;height:32px;">${renderIcon(cardObj.icon)}</div><small>${esc(cardObj.name)}</small>`
        : `<div class="lrc-ico" style="width:32px;height:32px;opacity:0.45;">${renderIcon('lock')}</div><small>${i + 1}-karta</small>`;
      slotsRow.appendChild(slot);
    }
  }

  // Cards Grid
  const grid = document.getElementById('mineCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = (u.cards || []).filter(c => STATE.mineCat === 'all' || c.cat === STATE.mineCat);
  for (const c of filtered) {
    const canAfford = (u.holdBalance || 0) >= c.upgradeCost;
    const card = document.createElement('div');
    card.className = 'mine-card';
    card.innerHTML = `
      <div>
        <div class="mc-top">
          <div class="lrc-ico">${renderIcon(c.icon)}</div>
          <div>
            <div class="mc-title">${esc(c.name)}</div>
            <div class="mc-pph">+${fmtInt(c.nextProfitDelta)} / soat</div>
          </div>
        </div>
        <div class="mc-desc" style="margin-top:8px;">${esc(c.desc)}</div>
      </div>
      <div class="mc-foot">
        <span class="mc-lvl">Lv.${c.level}</span>
        <button type="button" class="mc-buy-btn" style="${!canAfford ? 'opacity:0.5;' : ''}">${fmtInt(c.upgradeCost)} HOLD</button>
      </div>
    `;
    card.querySelector('.mc-buy-btn')?.addEventListener('click', async () => {
      const res = await api('/api/hold/upgrade-card', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, cardId: c.id })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        haptic('medium');
        renderAll();
        if (res.comboCompletedJustNow) {
          showToast(`Kunlik Kombo ochildi! +${fmtInt(res.comboReward)} HOLD`);
        } else if (res.comboJustFound) {
          showToast(`Kombo karta topildi (${res.user.combo.foundCardIds.length}/3)`);
        } else {
          showToast(`${c.name} · Lv.${res.newLevel}`);
        }
      } else {
        showToast(res.error || 'Yetarli HOLD yoʻq');
      }
    });
    grid.appendChild(card);
  }
}

// ---- SHEET 3: Render Boosts ----
function renderBoostsSheet() {
  const u = STATE.user;
  if (!u) return;

  const ftSub = document.getElementById('uiFullTankSub');
  const rkSub = document.getElementById('uiRocketSub');
  if (ftSub) ftSub.textContent = `${u.fullTankCount ?? 3} / 3 qoldi`;
  if (rkSub) rkSub.textContent = `${u.rocketCount ?? 3} / 3 qoldi`;

  const upgList = document.getElementById('boostUpgradesList');
  if (upgList) {
    upgList.innerHTML = `
      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon('zap')}</div>
          <div>
            <div class="lrc-title">Multitap · Lv.${u.tapLevel}</div>
            <div class="lrc-sub">Har bosishda +1 HOLD qoʻshadi</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="multitap">${fmtInt(u.nextTapUpgradeCost)} HOLD</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon('battery')}</div>
          <div>
            <div class="lrc-title">Energy Limit · Lv.${u.energyLevel}</div>
            <div class="lrc-sub">Energiya sigʻimini +500 ga oshiradi</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="energy_limit">${fmtInt(u.nextEnergyUpgradeCost)} HOLD</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">${renderIcon('cpu')}</div>
          <div>
            <div class="lrc-title">24/7 Auto-Bot</div>
            <div class="lrc-sub">${u.autoBotEnabled ? 'Faol (Offline HOLD yigʻmoqda)' : 'Oʻyindan chiqqanda ham HOLD yigʻadi'}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="autobot" ${u.autoBotEnabled ? 'disabled' : ''}>
          ${u.autoBotEnabled ? 'Faol' : `${fmtInt(u.autoBotCost)} HOLD`}
        </button>
      </div>
    `;
    upgList.querySelectorAll('[data-boost-upg]').forEach(btn => {
      btn.addEventListener('click', () => triggerBoost(btn.dataset.boostUpg));
    });
  }
}

async function triggerBoost(type) {
  const res = await api('/api/hold/boost', {
    method: 'POST',
    body: JSON.stringify({ username: STATE.username, type })
  });
  if (res.ok && res.user) {
    STATE.user = res.user;
    if (res.turboDurationMs) {
      STATE.turboActiveUntil = Date.now() + res.turboDurationMs;
      setTimeout(() => renderAll(), res.turboDurationMs);
      closeAllSheets();
    }
    haptic('medium');
    renderAll();
    showToast(res.message);
  } else {
    showToast(res.error || 'Limit tugagan');
  }
}

// ---- SHEET 4: Load & Render Top-10 Prizes & Full Leaderboard ----
async function loadLeaderboardData() {
  const res = await api('/api/hold/vault');
  if (res.ok) {
    STATE.totalPlayers = res.totalPlayers || (res.leaderboard || []).length;
    STATE.top10Prizes = res.top10Prizes || [];
    STATE.leaderboard = res.leaderboard || [];
    renderTopSheet();
  }
}

function renderTopSheet() {
  const totalEl = document.getElementById('uiTotalPlayersCount');
  if (totalEl) totalEl.textContent = fmtInt(STATE.totalPlayers || STATE.leaderboard.length);

  // Top-10 Allocated Prizes (Real NFT + HOLD Bonus)
  const prizesEl = document.getElementById('top10PrizesList');
  if (prizesEl && STATE.top10Prizes.length) {
    prizesEl.innerHTML = '';
    for (const p of STATE.top10Prizes) {
      const holder = STATE.leaderboard.find(u => u.rank === p.rank);
      const nft = p.nft;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <div class="rank-pill ${p.rank <= 3 ? 'top3' : ''}">#${p.rank}</div>
          ${nft ? `
            <div class="prize-nft-thumb" style="background:radial-gradient(circle, ${esc(nft.centerColor)}, ${esc(nft.edgeColor)});">
              <img src="${esc(nft.img)}" alt="${esc(nft.title)}" loading="lazy" />
            </div>
          ` : ''}
          <div>
            <div class="lrc-title">${nft ? esc(nft.title) : `Top #${p.rank} Sovrini`}</div>
            <div class="lrc-sub">
              ${nft ? `${esc(nft.model)} · ${esc(nft.backdrop)} + ` : ''}<b style="color:#38b6ff;">+${fmtInt(p.holdBonus)} HOLD</b>
            </div>
            <div class="lrc-sub" style="color:rgba(255,255,255,0.48);">
              Daʼvogar: <b>${holder ? `@${esc(holder.username)} (${fmtInt(holder.lifetimeHold)} HOLD)` : 'Boʻsh oʻrin'}</b>
            </div>
          </div>
        </div>
      `;
      prizesEl.appendChild(row);
    }
  }

  // Full Leaderboard
  const lbList = document.getElementById('holdLeaderboardList');
  if (lbList && STATE.leaderboard.length) {
    lbList.innerHTML = '';
    for (const p of STATE.leaderboard) {
      const isTop10 = p.rank <= 10;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <div class="rank-pill ${p.rank <= 3 ? 'top3' : ''}">#${p.rank}</div>
          <div>
            <div class="lrc-title">@${esc(p.username)}</div>
            <div class="lrc-sub">${fmtInt(p.lifetimeHold)} HOLD · ${esc(p.league?.name || 'Bronze')}</div>
          </div>
        </div>
        ${isTop10 && p.prize?.nft ? `
          <span class="mc-buy-btn" style="pointer-events:none;font-size:11.5px;">${esc(p.prize.nft.title)}</span>
        ` : ''}
      `;
      lbList.appendChild(row);
    }
  }
}

// ---- Top Up Stars via @HOLDbot Invoice ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'HOLD Boost') {
  openModal('Stars Balansni Toʻldirish', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 500, 1000, 2500, 5000].map(amt => `
          <button type="button" class="mc-buy-btn" data-preset="${amt}" style="padding:10px;">${amt} Stars</button>
        `).join('')}
      </div>
      <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" class="apple-search-input" />
      <button type="button" class="btn-sapphire-primary" id="btnPayStarsInvoice">Toʻlash</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpStarsAmount');
    body.querySelectorAll('[data-preset]').forEach(b => {
      b.addEventListener('click', () => { if (inp) inp.value = b.dataset.preset; });
    });

    body.querySelector('#btnPayStarsInvoice')?.addEventListener('click', async () => {
      const amount = Math.max(1, parseInt(inp?.value, 10) || defaultAmount);
      const res = await api('/api/hold/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, amount, title: reason })
      });
      if (res.ok && res.invoiceUrl) {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(res.invoiceUrl, async (status) => {
            if (status === 'paid') {
              await syncHoldUser();
              closeModal();
              showToast(`+${amount} Stars qoʻshildi`);
            }
          });
        } else {
          window.open(res.invoiceUrl, '_blank');
        }
      } else {
        showToast(res.error || 'Hisob-faktura xatosi');
      }
    });
  });
}

// ---- Admin Panel Modal (ID 100) ----
function openHoldAdminModal() {
  const u = STATE.user;
  if (!u?.isAdmin) return;
  const curWord = (u.morse?.lettersGuide || []).map(x => x.letter).join('');

  openModal('Admin Sozlamalar', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);">Yashirin Morze Soʻzi</label>
        <input type="text" id="admMorseWord" value="${esc(curWord)}" class="apple-search-input" style="margin-top:4px;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);">Mukofot (HOLD)</label>
        <input type="number" id="admMorseReward" value="${u.morse?.reward || 1000000}" class="apple-search-input" style="margin-top:4px;" />
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnSaveHoldAdmin">Saqlash</button>
    </div>
  `, (body) => {
    body.querySelector('#btnSaveHoldAdmin')?.addEventListener('click', async () => {
      const morseWord = body.querySelector('#admMorseWord')?.value.trim();
      const morseReward = parseInt(body.querySelector('#admMorseReward')?.value, 10) || 1000000;

      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, morseWord, morseReward })
      });
      if (res.ok) {
        await syncHoldUser();
        closeModal();
        showToast('Saqlandi');
      } else {
        showToast(res.error || 'Xatolik');
      }
    });
  });
}

// ---- DOMContentLoaded Wiring ----
window.addEventListener('DOMContentLoaded', async () => {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {}

  // Bottom Dock Sheet Triggers
  document.querySelectorAll('[data-open-sheet]').forEach(btn => {
    btn.addEventListener('click', () => openSheet(btn.dataset.openSheet));
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeAllSheets);
  });

  // Top Community Pill & League Button
  document.getElementById('btnSquadPill')?.addEventListener('click', () => openSheet('market'));
  document.getElementById('btnOpenTop10')?.addEventListener('click', () => openSheet('top'));
  document.getElementById('btnOpenStarsTopup')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', openHoldAdminModal);

  // Secret Cipher Easter Egg: 3 quick taps on the balance coin icon unlocks Morse Mode!
  document.getElementById('secretCipherTrigger')?.addEventListener('click', () => {
    STATE.secretTapCount++;
    clearTimeout(STATE.secretTapTimer);
    if (STATE.secretTapCount >= 3) {
      STATE.secretTapCount = 0;
      toggleSecretCipherMode();
    } else {
      STATE.secretTapTimer = setTimeout(() => { STATE.secretTapCount = 0; }, 900);
    }
  });

  document.getElementById('btnCloseSecretCipher')?.addEventListener('click', () => {
    toggleSecretCipherMode(false);
  });

  // Mine Category Segmented Filter
  document.querySelectorAll('#mineCatTabs .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mineCatTabs .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.mineCat = btn.dataset.mcat || 'all';
      renderMineSheet();
    });
  });

  // Boosts Free Daily Triggers
  document.getElementById('btnBoostFullTank')?.addEventListener('click', () => triggerBoost('full_tank'));
  document.getElementById('btnBoostTurbo')?.addEventListener('click', () => triggerBoost('rocket'));

  // Official 3D Coin Pointer Events (Tap or Secret Morse Hold)
  const coinBtn = document.getElementById('holdCoinBtn');
  if (coinBtn) {
    coinBtn.addEventListener('pointerdown', (e) => {
      STATE.pointerDownTime = Date.now();
      const rect = coinBtn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.955)`;
    });

    const releaseCoin = (e) => {
      coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      if (!STATE.pointerDownTime) return;
      const heldMs = Date.now() - STATE.pointerDownTime;
      STATE.pointerDownTime = 0;

      if (STATE.morseMode) {
        pushMorseSymbol(heldMs >= 240 ? '-' : '.');
      } else {
        handleCoinTap(e.clientX, e.clientY);
      }
    };

    coinBtn.addEventListener('pointerup', releaseCoin);
    coinBtn.addEventListener('pointercancel', () => {
      coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      STATE.pointerDownTime = 0;
    });
  }

  // Copy Referral Link
  document.getElementById('btnCopyRefLink')?.addEventListener('click', async () => {
    const link = `https://paxta.online/HOLDbot?start=ref_${STATE.username}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Taklif havolasi nusxalandi');
    } catch {
      showToast(link);
    }
  });

  // Close Modal
  document.getElementById('btnCloseHoldModal')?.addEventListener('click', closeModal);
  document.getElementById('holdModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'holdModalBackdrop') closeModal();
  });

  await Promise.all([syncHoldUser(), loadLeaderboardData()]);

  // Energy regen ticker
  setInterval(() => {
    if (!STATE.user) return;
    if (STATE.user.energy < STATE.user.maxEnergy) {
      STATE.user.energy = Math.min(STATE.user.maxEnergy, STATE.user.energy + 6);
      const eNow = document.getElementById('uiEnergyNow');
      const eFill = document.getElementById('uiEnergyBarFill');
      if (eNow) eNow.textContent = fmtInt(STATE.user.energy);
      if (eFill) eFill.style.width = `${Math.min(100, Math.round((STATE.user.energy / Math.max(1, STATE.user.maxEnergy)) * 100))}%`;
    }
  }, 2000);
});
