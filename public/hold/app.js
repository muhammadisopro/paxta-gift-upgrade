// ============================================================================
// HOLD — Official Notcoin & Apple iOS Sapphire Mini App (Silent, Clean, Pro)
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

const STATE = {
  user: null,
  authToken: localStorage.getItem('hold_auth_token') || '',
  username: localStorage.getItem('hold_username') || '',
  vaultFilter: 'all',
  vaultQuery: '',
  vaultItems: [],
  leaderboard: [],
  morseMode: false,
  morseCurrentSignal: '',
  morseDecodedLetters: [],
  morseEvalTimer: null,
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
    frens: 'sheetFrens',
    earn: 'sheetEarn',
    boosts: 'sheetBoosts',
    vault: 'sheetVault'
  };
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  const targetId = map[sheetName];
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) el.hidden = false;
    if (sheetName === 'vault' && !STATE.vaultItems.length) {
      loadVaultData();
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
      showToast(`+${fmtInt(data.user.passiveEarnedJustNow)} HOLD`);
    }

    if (!data.user.ogBonusClaimed) {
      setTimeout(openOgSnapshotModal, 350);
    }
  }
}

// ---- Clean DOGS-Style Initial OG Snapshot Modal ----
function openOgSnapshotModal() {
  openModal('Welcome to HOLD', `
    <div style="text-align:center;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:14px;">
      <img src="/hold/hold-coin.png" style="width:76px;height:76px;object-fit:contain;" />
      <div>
        <h3 style="font-size:20px;font-weight:800;">Nothing to sell. Just hold.</h3>
        <p style="font-size:13.5px;color:var(--text-2);margin-top:4px;">
          PaxtaGram profilingiz tekshirildi va boshlangʻich bonus ajratildi.
        </p>
      </div>
      <div style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Account</span>
          <b>@${esc(STATE.user?.username)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Status</span>
          <b style="color:#38b6ff;">${(STATE.user?.paxtaId && STATE.user.paxtaId <= 600) ? 'Early OG' : 'Verified Holder'}</b>
        </div>
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnClaimOgNow">Claim HOLD</button>
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

  // 1. Top Squad Pill (Exact Notcoin Style)
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

  const starsEl = document.getElementById('uiStars');
  if (starsEl) starsEl.textContent = fmtInt(u.stars);

  const pphEl = document.getElementById('uiPph');
  if (pphEl) pphEl.textContent = fmtInt(u.profitPerHour);

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

  // 4. Morse Pill Status
  const morseLbl = document.getElementById('uiMorsePillLabel');
  if (morseLbl) {
    morseLbl.textContent = u.morse?.solvedToday ? 'Morse · Solved' : `Morse · +${fmtInt(u.morse?.reward || 1000000)}`;
  }

  // 5. Admin button
  const adminBtn = document.getElementById('btnOpenAdminModal');
  if (adminBtn) adminBtn.hidden = !u.isAdmin;

  renderMorsePanel();
  renderBoostsSheet();
  renderEarnSheet();
  renderFrensSheet();
}

// ---- Morse Cipher Logic ----
function renderMorsePanel() {
  const u = STATE.user;
  if (!u || !u.morse) return;

  const hintEl = document.getElementById('uiMorseHint');
  if (hintEl) hintEl.textContent = u.morse.hint || 'Daily Morse Code';

  const slotsEl = document.getElementById('morseWordSlots');
  const guideWord = u.morse.lettersGuide || [];

  if (slotsEl) {
    slotsEl.innerHTML = '';
    for (let i = 0; i < guideWord.length; i++) {
      const item = guideWord[i];
      const decodedChar = STATE.morseDecodedLetters[i] || '';
      const box = document.createElement('div');
      box.className = `morse-slot-box ${decodedChar ? 'filled' : ''}`;
      box.innerHTML = `
        <span>${decodedChar || '·'}</span>
        <small>${esc(item.morse.replace(/\./g, '•').replace(/-/g, '—'))}</small>
      `;
      slotsEl.appendChild(box);
    }
  }

  const alphaGrid = document.getElementById('morseAlphabetGrid');
  if (alphaGrid && !alphaGrid.hasChildNodes()) {
    Object.entries(MORSE_MAP).slice(0, 26).forEach(([letter, code]) => {
      const chip = document.createElement('div');
      chip.className = 'morse-alpha-item';
      chip.innerHTML = `<b>${letter}</b><span>${code.replace(/\./g, '•').replace(/-/g, '—')}</span>`;
      chip.addEventListener('click', () => {
        STATE.morseCurrentSignal = code;
        updateMorseBufferUI();
        finalizeCurrentMorseSignal();
      });
      alphaGrid.appendChild(chip);
    });
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
    renderMorsePanel();

    if (STATE.morseDecodedLetters.length === guide.length) {
      const fullWord = STATE.morseDecodedLetters.join('');
      await submitMorseWord(fullWord);
    }
  } else {
    showToast(`${letter} — keyingi harf: ${expectedLetter || ''}`);
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
    haptic('heavy');
    renderAll();
    showToast(`+${fmtInt(res.reward)} HOLD`);
  } else {
    showToast(res.error || 'Notoʻgʻri kod');
  }
}

// ---- Tap Handling (Silent, Haptic-Only, Crisp Floating Numbers) ----
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

// ---- Render Boosts Sheet ----
function renderBoostsSheet() {
  const u = STATE.user;
  if (!u) return;

  const ftSub = document.getElementById('uiFullTankSub');
  const rkSub = document.getElementById('uiRocketSub');
  if (ftSub) ftSub.textContent = `${u.fullTankCount ?? 3} / 3 available`;
  if (rkSub) rkSub.textContent = `${u.rocketCount ?? 3} / 3 available`;

  const upgList = document.getElementById('boostUpgradesList');
  if (upgList) {
    upgList.innerHTML = `
      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">👆</div>
          <div>
            <div class="lrc-title">Multitap · Lv.${u.tapLevel}</div>
            <div class="lrc-sub">+1 HOLD per tap</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="multitap">${fmtInt(u.nextTapUpgradeCost)}</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">🔋</div>
          <div>
            <div class="lrc-title">Energy Limit · Lv.${u.energyLevel}</div>
            <div class="lrc-sub">+500 max energy</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="energy_limit">${fmtInt(u.nextEnergyUpgradeCost)}</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">🤖</div>
          <div>
            <div class="lrc-title">Auto-Tap Bot</div>
            <div class="lrc-sub">${u.autoBotEnabled ? 'Active' : 'Collects HOLD while offline'}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost-upg="autobot" ${u.autoBotEnabled ? 'disabled' : ''}>
          ${u.autoBotEnabled ? 'Active' : fmtInt(u.autoBotCost)}
        </button>
      </div>
    `;
    upgList.querySelectorAll('[data-boost-upg]').forEach(btn => {
      btn.addEventListener('click', () => triggerBoost(btn.dataset.boostUpg));
    });
  }

  const vipList = document.getElementById('vipPacksList');
  if (vipList) {
    vipList.innerHTML = (u.vipPacks || []).map(p => `
      <div class="list-row-card">
        <div class="lrc-left">
          <div class="lrc-ico">💎</div>
          <div>
            <div class="lrc-title">${esc(p.name)}</div>
            <div class="lrc-sub">${esc(p.desc)}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-pack="${esc(p.id)}">★ ${p.starsPrice}</button>
      </div>
    `).join('');
    vipList.querySelectorAll('[data-pack]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packId = btn.dataset.pack;
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
          openTopUpStarsModal(res.deficit || res.required, p.name);
        } else {
          showToast(res.error || 'Error');
        }
      });
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

// ---- Render Earn Sheet (Tasks + Cards & Combo) ----
function renderEarnSheet() {
  const u = STATE.user;
  if (!u) return;

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
          <div class="lrc-ico">${q.icon}</div>
          <div>
            <div class="lrc-title">${esc(q.title)}</div>
            <div class="lrc-sub">+${fmtInt(q.reward)} HOLD</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${isDone ? 'disabled style="opacity:0.45;"' : ''}>
          ${isDone ? 'Done' : 'Claim'}
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
            showToast(res.error || 'Incomplete');
          }
        });
      }
      qList.appendChild(row);
    }
  }

  // Combo slots
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
        ? `<span>${cardObj.icon}</span><small>${esc(cardObj.name)}</small>`
        : `<span>?</span><small>Locked</small>`;
      slotsRow.appendChild(slot);
    }
  }

  // Mine cards
  const grid = document.getElementById('mineCardsGrid');
  if (grid) {
    grid.innerHTML = '';
    for (const c of u.cards || []) {
      const card = document.createElement('div');
      card.className = 'mine-card';
      card.innerHTML = `
        <div>
          <div class="mc-top">
            <div class="mc-icon">${c.icon}</div>
            <div>
              <div class="mc-title">${esc(c.name)}</div>
              <div class="mc-pph">+${fmtInt(c.nextProfitDelta)}/h</div>
            </div>
          </div>
          <div class="mc-desc" style="margin-top:6px;">${esc(c.desc)}</div>
        </div>
        <div class="mc-foot">
          <span class="mc-lvl">Lv.${c.level}</span>
          <button type="button" class="mc-buy-btn">${fmtInt(c.upgradeCost)}</button>
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
            showToast(`Combo +${fmtInt(res.comboReward)} HOLD`);
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
}

// ---- Render Frens, Squads & Leaderboard ----
function renderFrensSheet() {
  const u = STATE.user;
  if (!u) return;

  const refCountEl = document.getElementById('uiRefCount');
  if (refCountEl) refCountEl.textContent = (u.referrals || []).length;

  const sList = document.getElementById('squadsList');
  if (sList) {
    sList.innerHTML = '';
    for (const sq of u.squads || []) {
      const joined = u.squadId === sq.id;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <div class="lrc-ico">${sq.icon}</div>
          <div>
            <div class="lrc-title">${esc(sq.name)}</div>
            <div class="lrc-sub">${fmtInt(sq.members)} members · ${fmtInt(sq.totalHold)} HOLD</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${joined ? 'disabled style="opacity:0.6;"' : ''}>
          ${joined ? 'Joined' : 'Join'}
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
            showToast(sq.name);
          }
        });
      }
      sList.appendChild(row);
    }
  }

  const lbList = document.getElementById('holdLeaderboardList');
  if (lbList && STATE.leaderboard.length) {
    lbList.innerHTML = '';
    for (const p of STATE.leaderboard) {
      const isTop3 = p.rank <= 3;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <strong style="width:28px;color:${isTop3 ? '#38b6ff' : 'var(--text-2)'};">#${p.rank}</strong>
          <div>
            <div class="lrc-title">@${esc(p.username)}</div>
            <div class="lrc-sub">${fmtInt(p.lifetimeHold)} HOLD · ${p.league?.name || 'Bronze'}</div>
          </div>
        </div>
      `;
      lbList.appendChild(row);
    }
  }
}

// ---- Load & Render Vault ----
async function loadVaultData() {
  const res = await api('/api/hold/vault');
  if (res.ok) {
    STATE.vaultItems = res.items || [];
    STATE.leaderboard = res.leaderboard || [];
    const avail = res.totalAvailable ?? STATE.vaultItems.filter(i => !i.sold).length;
    const b2 = document.getElementById('vCountAll');
    if (b2) b2.textContent = avail;
    renderVaultGrid();
    renderFrensSheet();
  }
}

function renderVaultGrid() {
  const grid = document.getElementById('vaultNftGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = (STATE.vaultQuery || '').trim().toLowerCase().replace(/^#/, '');
  const filtered = STATE.vaultItems.filter(item => {
    if (item.sold) return false;
    if (STATE.vaultFilter === 'medal' && item.nftType !== 'medal') return false;
    if (STATE.vaultFilter === 'calendar' && item.nftType !== 'calendar') return false;
    if (STATE.vaultFilter === 'black' && !item.isBlack) return false;
    if (STATE.vaultFilter === 'craft' && !item.crafted) return false;
    if (q) {
      const hay = `${item.number} ${item.model} ${item.backdrop} ${item.title}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:28px;color:var(--text-2);">Nothing found</div>`;
    return;
  }

  for (const item of filtered.slice(0, 80)) {
    const card = document.createElement('div');
    card.className = 'vnft-card';
    card.innerHTML = `
      <div class="vnft-art-box" style="background: radial-gradient(circle, ${esc(item.centerColor)}, ${esc(item.edgeColor)});">
        <span class="vnft-badge-top">${esc(item.model)}</span>
        <span class="vnft-num-pill">#${item.number}</span>
        <img src="${esc(item.img)}" alt="${esc(item.title)}" loading="lazy" />
      </div>
      <div class="vnft-body">
        <div class="vnft-title">${esc(item.title)}</div>
        <div class="vnft-sub">${esc(item.backdrop)}</div>
        <div class="vnft-req-row">
          <span>${(item.holdRequired / 1_000_000).toFixed(1)}M HOLD</span>
          <span style="color:#38b6ff;font-weight:700;">★ ${item.starsFee}</span>
        </div>
        <button type="button" class="vnft-claim-btn">Claim NFT</button>
      </div>
    `;
    card.addEventListener('click', () => openClaimNftModal(item));
    grid.appendChild(card);
  }
}

function openClaimNftModal(item) {
  const u = STATE.user;
  const hasHold = (u?.holdBalance || 0) >= item.holdRequired;
  const hasStars = (u?.stars || 0) >= item.starsFee;

  openModal(item.title, `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div style="display:flex;gap:14px;align-items:center;background:radial-gradient(circle, ${esc(item.centerColor)}, ${esc(item.edgeColor)});padding:16px;border-radius:18px;">
        <img src="${esc(item.img)}" style="width:76px;height:76px;object-fit:contain;" />
        <div>
          <h3 style="font-size:18px;">${esc(item.title)}</h3>
          <p style="font-size:13px;color:rgba(255,255,255,0.82);margin-top:2px;">${esc(item.model)} · ${esc(item.backdrop)}</p>
          <p style="font-size:12px;color:#60a5fa;margin-top:4px;">Market floor: ~★ ${fmtInt(item.marketValue)}</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Required HOLD</span>
          <b style="color:${hasHold ? '#38b6ff' : '#f87171'};">${fmtInt(item.holdRequired)} HOLD</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Transfer fee</span>
          <b style="color:${hasStars ? '#38b6ff' : '#f87171'};">★ ${fmtInt(item.starsFee)} Stars</b>
        </div>
      </div>

      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:5px;">Recipient @username</label>
        <input type="text" id="inpNftRecipient" value="${esc(u?.username || '')}" class="apple-search-input" />
      </div>

      <button type="button" class="btn-sapphire-primary" id="btnConfirmClaimNft">
        ${!hasHold ? 'Need more HOLD (Get Boost)' : (!hasStars ? `Top Up ★ ${item.starsFee - (u?.stars || 0)} Stars` : 'Claim to Profile')}
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnConfirmClaimNft')?.addEventListener('click', async () => {
      if (!hasHold) {
        closeModal();
        openSheet('boosts');
        return;
      }
      if (!hasStars) {
        const deficit = Math.max(50, item.starsFee - (u?.stars || 0));
        openTopUpStarsModal(deficit, item.title);
        return;
      }

      const rec = body.querySelector('#inpNftRecipient')?.value.trim();
      const btn = body.querySelector('#btnConfirmClaimNft');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

      const res = await api('/api/hold/claim-nft', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.username,
          vaultId: item.vaultId,
          recipientUsername: rec
        })
      });

      if (res.ok) {
        STATE.user = res.user;
        haptic('heavy');
        closeModal();
        showToast(res.message);
        await loadVaultData();
        renderAll();
      } else {
        if (btn) { btn.disabled = false; btn.textContent = 'Claim to Profile'; }
        showToast(res.error || 'Error');
      }
    });
  });
}

// ---- Top Up Stars via @HOLDbot Invoice ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'HOLD Balance') {
  openModal('Add Stars', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 500, 1000, 2500, 5000].map(amt => `
          <button type="button" class="mc-buy-btn" data-preset="${amt}" style="padding:10px;">★ ${amt}</button>
        `).join('')}
      </div>
      <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" class="apple-search-input" />
      <button type="button" class="btn-sapphire-primary" id="btnPayStarsInvoice">Continue</button>
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
              showToast(`+★ ${amount}`);
            }
          });
        } else {
          window.open(res.invoiceUrl, '_blank');
        }
      } else {
        showToast(res.error || 'Invoice error');
      }
    });
  });
}

// ---- Admin Panel Modal (ID 100) ----
function openHoldAdminModal() {
  const u = STATE.user;
  if (!u?.isAdmin) return;
  const curWord = (u.morse?.lettersGuide || []).map(x => x.letter).join('');

  openModal('Admin Settings', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);">Daily Morse Word</label>
        <input type="text" id="admMorseWord" value="${esc(curWord)}" class="apple-search-input" style="margin-top:4px;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);">Hint</label>
        <input type="text" id="admMorseHint" value="${esc(u.morse?.hint || '')}" class="apple-search-input" style="margin-top:4px;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);">Reward (HOLD)</label>
        <input type="number" id="admMorseReward" value="${u.morse?.reward || 1000000}" class="apple-search-input" style="margin-top:4px;" />
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnSaveHoldAdmin">Save</button>
    </div>
  `, (body) => {
    body.querySelector('#btnSaveHoldAdmin')?.addEventListener('click', async () => {
      const morseWord = body.querySelector('#admMorseWord')?.value.trim();
      const morseHint = body.querySelector('#admMorseHint')?.value.trim();
      const morseReward = parseInt(body.querySelector('#admMorseReward')?.value, 10) || 1000000;

      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, morseWord, morseHint, morseReward })
      });
      if (res.ok) {
        await syncHoldUser();
        closeModal();
        showToast('Saved');
      } else {
        showToast(res.error || 'Error');
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

  // Bottom Glass Dock Sheet Triggers
  document.querySelectorAll('[data-open-sheet]').forEach(btn => {
    btn.addEventListener('click', () => openSheet(btn.dataset.openSheet));
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeAllSheets);
  });

  // Top Squad Pill & League Button -> Open Frens/Leaderboard
  document.getElementById('btnSquadPill')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnOpenLeaderboard')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnOpenStarsTopup')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', openHoldAdminModal);

  // Morse Toggle
  document.getElementById('btnToggleMorse')?.addEventListener('click', () => {
    STATE.morseMode = !STATE.morseMode;
    document.body.classList.toggle('morse-mode-active', STATE.morseMode);
    document.getElementById('morseCipherPanel').hidden = !STATE.morseMode;
  });

  // Morse Controls
  document.getElementById('btnMorseDot')?.addEventListener('click', () => pushMorseSymbol('.'));
  document.getElementById('btnMorseDash')?.addEventListener('click', () => pushMorseSymbol('-'));
  document.getElementById('btnResetMorseWord')?.addEventListener('click', () => {
    STATE.morseCurrentSignal = '';
    STATE.morseDecodedLetters = [];
    updateMorseBufferUI();
    renderMorsePanel();
  });
  document.getElementById('btnToggleMorseGuide')?.addEventListener('click', () => {
    const dr = document.getElementById('morseGuideDrawer');
    if (dr) dr.hidden = !dr.hidden;
  });
  document.getElementById('btnSubmitSecretWord')?.addEventListener('click', async () => {
    const inp = document.getElementById('secretCodeInput');
    const w = inp?.value.trim();
    if (w) {
      await submitMorseWord(w);
      inp.value = '';
    }
  });

  // Earn Sheet Segmented Control
  document.querySelectorAll('[data-earntab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-earntab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.earntab;
      document.getElementById('earnSubTasks').hidden = tab !== 'tasks';
      document.getElementById('earnSubMine').hidden = tab !== 'mine';
    });
  });

  // Boosts Free Daily Triggers
  document.getElementById('btnBoostFullTank')?.addEventListener('click', () => triggerBoost('full_tank'));
  document.getElementById('btnBoostTurbo')?.addEventListener('click', () => triggerBoost('rocket'));

  // Official 3D Coin Pointer Events
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

  // Vault Filters & Search
  document.querySelectorAll('#vaultFilterChips .vf-pill').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#vaultFilterChips .vf-pill').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.vaultFilter = chip.dataset.vfilter || 'all';
      renderVaultGrid();
    });
  });
  document.getElementById('vaultSearchInput')?.addEventListener('input', (e) => {
    STATE.vaultQuery = e.target.value;
    renderVaultGrid();
  });

  // Copy Referral Link
  document.getElementById('btnCopyRefLink')?.addEventListener('click', async () => {
    const link = `https://paxta.online/HOLDbot?start=ref_${STATE.username}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Invite link copied');
    } catch {
      showToast(link);
    }
  });

  // Close Modal
  document.getElementById('btnCloseHoldModal')?.addEventListener('click', closeModal);
  document.getElementById('holdModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'holdModalBackdrop') closeModal();
  });

  await Promise.all([syncHoldUser(), loadVaultData()]);

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
