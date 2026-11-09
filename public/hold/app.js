// ============================================================================
// $HOLD COIN FRONTEND (@HOLDbot — Tap, Morse Cipher, Daily Combo & NFT Vault)
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
  activeTab: 'arena',
  mineCat: 'all',
  vaultFilter: 'all',
  vaultQuery: '',
  vaultItems: [],
  leaderboard: [],
  morseMode: false,
  morseCurrentSignal: '', // e.g. '.-'
  morseDecodedLetters: [], // e.g. ['H', 'O']
  morseEvalTimer: null,
  pointerDownTime: 0,
  pendingTaps: 0,
  tapSyncTimer: null,
  turboActiveUntil: 0,
  soundEnabled: localStorage.getItem('hold_sound') !== 'off'
};

// ---- WebAudio Sound Effects ----
let audioCtx = null;
function playTone(type) {
  if (!STATE.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'dot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'dash') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'win') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.3);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {}
}

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
  showToast._t = setTimeout(() => { el.hidden = true; }, 3200);
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

    // Show Passive Earnings popup if earned while offline
    if (data.user.passiveEarnedJustNow > 100 && data.user.ogBonusClaimed) {
      showToast(`🤖 Passiv daromad: +${fmtInt(data.user.passiveEarnedJustNow)} $HOLD yigʻildi!`);
    }

    // Show DOGS-style Initial OG Snapshot Modal on first visit!
    if (!data.user.ogBonusClaimed) {
      setTimeout(openOgSnapshotModal, 400);
    }
  }
}

// ---- DOGS-Style Initial OG Snapshot Modal ----
function openOgSnapshotModal() {
  openModal('🐶 PaxtaGram OG Tekshiruvi', `
    <div style="text-align:center;padding:8px 4px;">
      <div style="font-size:52px;margin-bottom:8px;">👑</div>
      <h3 style="font-size:18px;margin-bottom:6px;">Akkauntingiz Tahlil Qilindi!</h3>
      <p style="font-size:13px;color:var(--text-2);line-height:1.45;margin-bottom:14px;">
        <b>DOGS & Notcoin</b> tizimi boʻyicha sizning PaxtaGram ID raqamingiz va faolligingiz tekshirildi:
      </p>
      <div style="background:rgba(245,159,0,0.12);border:1px solid rgba(245,159,0,0.4);border-radius:14px;padding:12px;text-align:left;display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>👤 Akkaunt:</span>
          <b>@${esc(STATE.user?.username)} ${STATE.user?.paxtaId ? `(ID #${STATE.user.paxtaId})` : ''}</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>🏆 OG Maqomi:</span>
          <b style="color:var(--gold-1);">${ (STATE.user?.paxtaId && STATE.user.paxtaId <= 600) ? '🔥 Early Pioneer' : '🌟 Paxta Holder' }</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <span>🎁 Boshlangʻich Drop:</span>
          <b style="color:#10b981;">+80,000 — +280,000 $HOLD</b>
        </div>
      </div>
      <button type="button" class="btn-gold-full" id="btnClaimOgNow">
        🪙 Boshlangʻich $HOLD Bonusni Olish!
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnClaimOgNow')?.addEventListener('click', async () => {
      const res = await api('/api/hold/claim-og', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        playTone('win');
        closeModal();
        renderAll();
        showToast(`🎉 +${fmtInt(res.ogDetails?.totalBonus || 80000)} $HOLD hisobingizga qoʻshildi!`);
      }
    });
  });
}

// ---- Render UI ----
function renderAll() {
  const u = STATE.user;
  if (!u) return;

  document.body.classList.toggle('skin-obsidian', u.skin === 'obsidian');

  document.getElementById('uiAvatar').textContent = (u.displayName || u.username || 'H').charAt(0).toUpperCase();
  document.getElementById('uiDisplayName').textContent = u.displayName || u.username;
  document.getElementById('uiLeagueBadge').textContent = `${u.league?.icon || '🥉'} ${u.league?.name || 'Bronze'}`;
  document.getElementById('uiPph').textContent = `+${fmtInt(u.profitPerHour)}/s`;
  document.getElementById('uiStars').textContent = fmtInt(u.stars);
  document.getElementById('uiHoldBalance').textContent = fmtInt(u.holdBalance);

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const effTap = isTurbo ? u.tapPower * 7 : u.tapPower;
  document.getElementById('uiLeagueNameText').textContent = `${u.league?.icon || '🥉'} ${u.league?.name}`;
  document.getElementById('uiTapPowerText').textContent = isTurbo ? `🚀 +${effTap} / tap (7x TURBO!)` : `👆 +${effTap} / tap`;

  // League progress bar
  const leagues = u.allLeagues || [];
  const curIdx = leagues.findIndex(l => l.id === u.league?.id);
  const nextLg = leagues[curIdx + 1];
  const pct = nextLg
    ? Math.min(100, Math.round(((u.lifetimeHold - u.league.minHold) / (nextLg.minHold - u.league.minHold)) * 100))
    : 100;
  document.getElementById('uiLeagueBarFill').style.width = `${Math.max(6, pct)}%`;

  // Energy
  document.getElementById('uiEnergyText').textContent = `${fmtInt(u.energy)} / ${fmtInt(u.maxEnergy)}`;
  const ePct = Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100));
  document.getElementById('uiEnergyBarFill').style.width = `${ePct}%`;
  document.getElementById('uiRocketCount').textContent = u.rocketCount ?? 3;

  // Daily widgets status
  const morseBadge = document.getElementById('uiMorseStatusBadge');
  if (morseBadge) {
    morseBadge.textContent = u.morse?.solvedToday ? '✅ YECHILDI' : `+${fmtInt(u.morse?.reward || 1000000)}`;
  }
  const comboSub = document.getElementById('uiComboCountSub');
  if (comboSub) {
    comboSub.textContent = u.combo?.solvedToday ? '✅ Yutildi!' : `${(u.combo?.foundCardIds || []).length} / 3 karta`;
  }

  // Admin button (Strictly ID 100)
  const adminBtn = document.getElementById('btnOpenAdminModal');
  if (adminBtn) adminBtn.hidden = !u.isAdmin;

  renderMorsePanel();
  renderMinePane();
  renderEarnPane();
}

// ---- Morse Cipher Panel & Logic ----
function renderMorsePanel() {
  const u = STATE.user;
  if (!u || !u.morse) return;

  document.getElementById('uiMorseHint').textContent = `💡 Maslahat: ${u.morse.hint}`;
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
        <span>${decodedChar || '_'}</span>
        <small>${esc(item.morse.replace(/\./g, '•').replace(/-/g, '—'))}</small>
      `;
      slotsEl.appendChild(box);
    }
  }

  // Populate Morse Alphabet Reference Grid once
  const alphaGrid = document.getElementById('morseAlphabetGrid');
  if (alphaGrid && !alphaGrid.hasChildNodes()) {
    Object.entries(MORSE_MAP).slice(0, 26).forEach(([letter, code]) => {
      const chip = document.createElement('div');
      chip.className = 'morse-alpha-item';
      chip.innerHTML = `<b>${letter}</b><span>${code.replace(/\./g, '•').replace(/-/g, '—')}</span>`;
      chip.title = `${letter} harfini kiritish uchun bosing`;
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
    bufEl.textContent = 'Tangani bosing (qisqa = • , uzoq = —)';
  } else {
    const pretty = STATE.morseCurrentSignal.replace(/\./g, '• ').replace(/-/g, '— ');
    const matchLetter = REVERSE_MORSE[STATE.morseCurrentSignal] || '?';
    bufEl.textContent = `${pretty}  ➔  [ ${matchLetter} ]`;
  }
}

function pushMorseSymbol(sym) {
  playTone(sym === '.' ? 'dot' : 'dash');
  haptic(sym === '.' ? 'light' : 'medium');
  STATE.morseCurrentSignal += sym;
  updateMorseBufferUI();

  clearTimeout(STATE.morseEvalTimer);
  STATE.morseEvalTimer = setTimeout(finalizeCurrentMorseSignal, 880);
}

async function finalizeCurrentMorseSignal() {
  clearTimeout(STATE.morseEvalTimer);
  const sig = STATE.morseCurrentSignal;
  if (!sig) return;
  STATE.morseCurrentSignal = '';
  updateMorseBufferUI();

  const letter = REVERSE_MORSE[sig];
  if (!letter) {
    showToast(`❓ "${sig.replace(/\./g, '•').replace(/-/g, '—')}" — bunday Morze harfi topilmadi`);
    return;
  }

  const guide = STATE.user?.morse?.lettersGuide || [];
  const nextIdx = STATE.morseDecodedLetters.length;
  const expectedLetter = guide[nextIdx]?.letter;

  if (expectedLetter && letter === expectedLetter) {
    STATE.morseDecodedLetters.push(letter);
    playTone('win');
    renderMorsePanel();

    // Check if entire daily word is decoded!
    if (STATE.morseDecodedLetters.length === guide.length) {
      const fullWord = STATE.morseDecodedLetters.join('');
      await submitMorseWord(fullWord);
    }
  } else {
    showToast(`Siz "${letter}" (${sig.replace(/\./g, '•').replace(/-/g, '—')}) terdingiz. ${expectedLetter ? `Keyingi harf: "${expectedLetter}" (${guide[nextIdx].morse.replace(/\./g, '•').replace(/-/g, '—')})` : ''}`);
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
    playTone('win');
    haptic('heavy');
    renderAll();
    showToast(res.message || `🎉 Shifr topildi! +${fmtInt(res.reward)} $HOLD!`);
  } else {
    showToast(res.error || 'Shifr xato');
  }
}

// ---- Tap Handling (3D Tilt + Floating Gold Numbers + Batch Sync) ----
function handleCoinTap(clientX, clientY) {
  const u = STATE.user;
  if (!u) return;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const tapVal = isTurbo ? u.tapPower * 7 : u.tapPower;

  if (!isTurbo && u.energy < u.tapPower) {
    showToast('⚡ Energiya tugadi! Boostlar boʻlimidan Full Tank oling.');
    return;
  }

  if (!isTurbo) {
    u.energy = Math.max(0, u.energy - u.tapPower);
  }
  u.holdBalance += tapVal;
  u.lifetimeHold += tapVal;
  STATE.pendingTaps++;

  playTone('tap');
  haptic('light');

  // Update numbers immediately
  document.getElementById('uiHoldBalance').textContent = fmtInt(u.holdBalance);
  document.getElementById('uiEnergyText').textContent = `${fmtInt(u.energy)} / ${fmtInt(u.maxEnergy)}`;
  document.getElementById('uiEnergyBarFill').style.width = `${Math.min(100, Math.round((u.energy / Math.max(1, u.maxEnergy)) * 100))}%`;

  // Spawn floating +$HOLD number
  const floatEl = document.createElement('div');
  floatEl.className = 'tap-float-num';
  floatEl.textContent = `+${tapVal}`;
  floatEl.style.left = `${(clientX || window.innerWidth / 2) - 18}px`;
  floatEl.style.top = `${(clientY || window.innerHeight / 2) - 24}px`;
  document.body.appendChild(floatEl);
  setTimeout(() => floatEl.remove(), 850);

  // Schedule batch sync
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

// ---- Render TAB 2: Mine & Daily Combo ----
function renderMinePane() {
  const u = STATE.user;
  if (!u) return;

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
        : `<span>❓</span><small>Maxfiy karta</small>`;
      slotsRow.appendChild(slot);
    }
  }

  // Mine cards grid
  const grid = document.getElementById('mineCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = (u.cards || []).filter(c => STATE.mineCat === 'all' || c.cat === STATE.mineCat);
  for (const c of list) {
    const card = document.createElement('div');
    card.className = 'mine-card';
    card.innerHTML = `
      <div>
        <div class="mc-top">
          <div class="mc-icon">${c.icon}</div>
          <div>
            <div class="mc-title">${esc(c.name)}</div>
            <div class="mc-pph">+${fmtInt(c.nextProfitDelta)} / soat</div>
          </div>
        </div>
        <div class="mc-desc" style="margin-top:6px;">${esc(c.desc)}</div>
      </div>
      <div class="mc-foot">
        <span class="mc-lvl">Lv.${c.level}</span>
        <button type="button" class="mc-buy-btn">🪙 ${fmtInt(c.upgradeCost)}</button>
      </div>
    `;
    card.querySelector('.mc-buy-btn')?.addEventListener('click', async () => {
      const res = await api('/api/hold/upgrade-card', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, cardId: c.id })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        playTone('win');
        renderAll();
        if (res.comboCompletedJustNow) {
          showToast(`🎉 KUNLIK KOMBO TOʻLIQ TOPILDI! +${fmtInt(res.comboReward)} $HOLD!`);
        } else if (res.comboJustFound) {
          showToast(`🃏 Kombo kartalardan biri topildi! (${res.user.combo.foundCardIds.length}/3)`);
        } else {
          showToast(`✅ ${c.name} Lv.${res.newLevel} ga koʻtarildi!`);
        }
      } else {
        showToast(res.error || 'Xatolik');
      }
    });
    grid.appendChild(card);
  }
}

// ---- Load & Render TAB 3: Real NFT Vault ----
async function loadVaultData() {
  const res = await api('/api/hold/vault');
  if (res.ok) {
    STATE.vaultItems = res.items || [];
    STATE.leaderboard = res.leaderboard || [];
    const avail = res.totalAvailable ?? STATE.vaultItems.filter(i => !i.sold).length;
    const b1 = document.getElementById('uiVaultCountBadge');
    const b2 = document.getElementById('vCountAll');
    if (b1) b1.textContent = `${avail} NFT`;
    if (b2) b2.textContent = avail;
    renderVaultGrid();
    renderEarnPane();
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
    if (STATE.vaultFilter === 'top100' && item.number >= 100) return false;
    if (q) {
      const hay = `${item.number} ${item.model} ${item.backdrop} ${item.title}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:28px;color:var(--text-2);">Hech qanday NFT topilmadi</div>`;
    return;
  }

  for (const item of filtered.slice(0, 80)) {
    const card = document.createElement('div');
    card.className = 'vnft-card';
    card.innerHTML = `
      <div class="vnft-art-box" style="background: radial-gradient(circle, ${esc(item.centerColor)}, ${esc(item.edgeColor)});">
        <span class="vnft-badge-top">${esc(item.tierBadge)}</span>
        <span class="vnft-num-pill">#${item.number}</span>
        <img src="${esc(item.img)}" alt="${esc(item.title)}" loading="lazy" />
      </div>
      <div class="vnft-body">
        <div class="vnft-title">${esc(item.title)}</div>
        <div class="vnft-sub">${esc(item.model)} · ${esc(item.backdrop)}</div>
        <div class="vnft-req-row">
          <span>🪙 ${(item.holdRequired / 1_000_000).toFixed(1)}M $HOLD</span>
          <span style="color:var(--gold-1);font-weight:800;">⭐ ${item.starsFee}</span>
        </div>
        <button type="button" class="vnft-claim-btn">🎁 Profilingizga Olish</button>
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

  openModal(`🎁 ${item.title} (Real NFT)`, `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;gap:12px;align-items:center;background:radial-gradient(circle, ${esc(item.centerColor)}, ${esc(item.edgeColor)});padding:14px;border-radius:16px;">
        <img src="${esc(item.img)}" style="width:78px;height:78px;object-fit:contain;" />
        <div>
          <span style="font-size:10px;font-weight:800;background:rgba(0,0,0,0.6);padding:3px 8px;border-radius:99px;">${esc(item.tierBadge)}</span>
          <h3 style="font-size:17px;margin-top:5px;">${esc(item.title)}</h3>
          <p style="font-size:12px;opacity:0.9;">Model: <b>${esc(item.model)}</b> · Fon: <b>${esc(item.backdrop)}</b></p>
          <p style="font-size:11px;color:#fde047;margin-top:2px;">Bozordagi bahosi: ~⭐ ${fmtInt(item.marketValue)}</p>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border:1px solid var(--border-subtle);border-radius:13px;padding:11px;display:flex;flex-direction:column;gap:7px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;">
          <span>Talab qilinadigan $HOLD:</span>
          <b style="color:${hasHold ? '#10b981' : '#f87171'};">🪙 ${fmtInt(item.holdRequired)} $HOLD ${hasHold ? '✅' : `(Sizda: ${fmtInt(u?.holdBalance)})`}</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>Transfer & Aktivatsiya badali:</span>
          <b style="color:${hasStars ? '#fde047' : '#f87171'};">⭐ ${fmtInt(item.starsFee)} Stars ${hasStars ? '✅' : `(Sizda: ⭐ ${fmtInt(u?.stars)})`}</b>
        </div>
        <div style="display:flex;justify-content:space-between;color:#10b981;font-size:12px;padding-top:5px;border-top:1px solid rgba(255,255,255,0.08);">
          <span>Sizning sof yutugʻingiz:</span>
          <b>+${fmtInt(item.marketValue - item.starsFee)} ⭐ arzon!</b>
        </div>
      </div>

      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:5px;">Qabul qiluvchi PaxtaGram @username:</label>
        <input type="text" id="inpNftRecipient" value="${esc(u?.username || '')}" style="width:100%;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:9px 12px;color:#fff;font-size:14px;" />
      </div>

      ${!hasHold ? `
        <button type="button" class="arena-btn btn-vip-stars" id="btnQuickGetVipHold" style="justify-content:center;padding:11px;">
          ⚡ $HOLD yetmayaptimi? VIP Paket bilan darhol toʻldirish!
        </button>
      ` : ''}

      <button type="button" class="btn-gold-full" id="btnConfirmClaimNft">
        ${!hasStars ? `⭐ ${item.starsFee - (u?.stars || 0)} Stars Toʻldirish va NFTni Olish` : `🎁 Hoziroq PaxtaGram Profilimga Oʻtkazish!`}
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnQuickGetVipHold')?.addEventListener('click', () => {
      openVipPacksModal();
    });

    body.querySelector('#btnConfirmClaimNft')?.addEventListener('click', async () => {
      if (!hasHold) {
        showToast(`Avval ${fmtInt(item.holdRequired)} $HOLD yigʻing yoki VIP Paket oling!`);
        openVipPacksModal();
        return;
      }
      if (!hasStars) {
        const deficit = Math.max(50, item.starsFee - (u?.stars || 0));
        openTopUpStarsModal(deficit, `${item.title} NFT aktivatsiyasi`);
        return;
      }

      const rec = body.querySelector('#inpNftRecipient')?.value.trim();
      const btn = body.querySelector('#btnConfirmClaimNft');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ PaxtaGram orqali yuborilmoqda...'; }

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
        playTone('win');
        closeModal();
        showToast(res.message);
        await loadVaultData();
        renderAll();
      } else {
        if (btn) { btn.disabled = false; btn.textContent = '🎁 Hoziroq PaxtaGram Profilimga Oʻtkazish!'; }
        showToast(res.error || 'Xatolik');
      }
    });
  });
}

// ---- Render TAB 4: Quests, Squads & Leaderboard ----
function renderEarnPane() {
  const u = STATE.user;
  if (!u) return;

  const refCountEl = document.getElementById('uiRefCount');
  if (refCountEl) refCountEl.textContent = `${(u.referrals || []).length} ta`;

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
          <span class="lrc-ico">${q.icon}</span>
          <div>
            <div class="lrc-title">${esc(q.title)}</div>
            <div class="lrc-sub">+${fmtInt(q.reward)} $HOLD</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${isDone ? 'disabled style="opacity:0.5;"' : ''}>
          ${isDone ? '✅ Olingan' : 'Olish'}
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
            playTone('win');
            renderAll();
            showToast(res.message);
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
          <span class="lrc-ico">${sq.icon}</span>
          <div>
            <div class="lrc-title">${esc(sq.name)}</div>
            <div class="lrc-sub">${fmtInt(sq.members)} aʼzo · 🪙 ${fmtInt(sq.totalHold)}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" ${joined ? 'disabled style="background:#10b981;"' : ''}>
          ${joined ? '🛡️ Jamoangiz' : 'Qoʻshilish'}
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
            playTone('win');
            renderAll();
            showToast(res.message);
          }
        });
      }
      sList.appendChild(row);
    }
  }

  // Leaderboard
  const lbList = document.getElementById('holdLeaderboardList');
  if (lbList && STATE.leaderboard.length) {
    lbList.innerHTML = '';
    for (const p of STATE.leaderboard) {
      const isTop3 = p.rank <= 3;
      const row = document.createElement('div');
      row.className = 'list-row-card';
      row.innerHTML = `
        <div class="lrc-left">
          <strong style="width:26px;color:${isTop3 ? '#fde047' : 'var(--text-2)'};">#${p.rank}</strong>
          <div>
            <div class="lrc-title">@${esc(p.username)} ${isTop3 ? '🏆 <small style="color:#10b981;">(Bepul NFT Daʼvogari)</small>' : ''}</div>
            <div class="lrc-sub">${p.league?.icon || '🥉'} ${fmtInt(p.lifetimeHold)} $HOLD · 👥 ${p.referralsCount} doʻst</div>
          </div>
        </div>
      `;
      lbList.appendChild(row);
    }
  }
}

// ---- Boosts Modal ----
function openBoostsModal() {
  const u = STATE.user;
  if (!u) return;

  openModal('🚀 Boostlar va Kuchaytirgichlar', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div class="list-row-card">
        <div class="lrc-left">
          <span class="lrc-ico">⚡</span>
          <div>
            <div class="lrc-title">Full Energy Tank</div>
            <div class="lrc-sub">Bepul toʻldirish (${u.fullTankCount ?? 3} / 3 qoldi)</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost="full_tank">Bepul</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <span class="lrc-ico">🚀</span>
          <div>
            <div class="lrc-title">7x Turbo Raketa (10 soniya)</div>
            <div class="lrc-sub">Energiyasiz 7 barobar zarba (${u.rocketCount ?? 3} / 3)</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost="rocket">Yoqish</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <span class="lrc-ico">👆</span>
          <div>
            <div class="lrc-title">Multitap (Lv.${u.tapLevel})</div>
            <div class="lrc-sub">Har bosishda +1 $HOLD qoʻshadi</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost="multitap">🪙 ${fmtInt(u.nextTapUpgradeCost)}</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <span class="lrc-ico">🔋</span>
          <div>
            <div class="lrc-title">Energy Limit (Lv.${u.energyLevel})</div>
            <div class="lrc-sub">Sigʻimni +500 ga oshiradi</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost="energy_limit">🪙 ${fmtInt(u.nextEnergyUpgradeCost)}</button>
      </div>

      <div class="list-row-card">
        <div class="lrc-left">
          <span class="lrc-ico">🤖</span>
          <div>
            <div class="lrc-title">24/7 Hold Avto-Bot</div>
            <div class="lrc-sub">${u.autoBotEnabled ? '✅ Faol (Offline tanga yigʻadi)' : 'Oʻyindan chiqqanda ham tanga yigʻadi'}</div>
          </div>
        </div>
        <button type="button" class="mc-buy-btn" data-boost="autobot" ${u.autoBotEnabled ? 'disabled' : ''}>
          ${u.autoBotEnabled ? 'Faol' : `🪙 ${fmtInt(u.autoBotCost)}`}
        </button>
      </div>
    </div>
  `, (body) => {
    body.querySelectorAll('[data-boost]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.boost;
        const res = await api('/api/hold/boost', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, type })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          if (res.turboDurationMs) {
            STATE.turboActiveUntil = Date.now() + res.turboDurationMs;
            const aura = document.getElementById('turboAura');
            if (aura) aura.hidden = false;
            setTimeout(() => {
              if (aura) aura.hidden = true;
              renderAll();
            }, res.turboDurationMs);
          }
          playTone('win');
          closeModal();
          renderAll();
          showToast(res.message);
        } else {
          showToast(res.error || 'Xatolik');
        }
      });
    });
  });
}

// ---- VIP Stars Packs Modal ----
function openVipPacksModal() {
  const u = STATE.user;
  if (!u) return;

  openModal('💎 VIP $HOLD Paketlar (Tezkor NFT Uchun)', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <p style="font-size:12.5px;color:var(--text-2);margin-bottom:4px;">
        Desk Calendar yoki Victory Medal NFTni darhol olish uchun <b>$HOLD</b> balansingiz va Tap kuchingizni bir zumda oshiring:
      </p>
      ${(u.vipPacks || []).map(p => `
        <div class="list-row-card" style="border-color:rgba(245,159,0,0.45);background:linear-gradient(135deg,rgba(245,159,0,0.12),rgba(19,22,34,0.95));">
          <div style="flex:1;">
            <span style="font-size:9.5px;font-weight:900;background:var(--gold-2);color:#000;padding:2px 6px;border-radius:99px;">${esc(p.badge)}</span>
            <div class="lrc-title" style="margin-top:4px;">${esc(p.name)}</div>
            <div style="font-size:11.5px;color:var(--text-2);margin-top:2px;">${esc(p.desc)}</div>
          </div>
          <button type="button" class="mc-buy-btn" data-pack="${esc(p.id)}">⭐ ${p.starsPrice}</button>
        </div>
      `).join('')}
    </div>
  `, (body) => {
    body.querySelectorAll('[data-pack]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const packId = btn.dataset.pack;
        const res = await api('/api/hold/buy-vip-pack', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, packId })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          playTone('win');
          closeModal();
          renderAll();
          showToast(res.message);
        } else if (res.needStars) {
          openTopUpStarsModal(res.deficit || res.required, 'VIP $HOLD Paket xaridi');
        } else {
          showToast(res.error || 'Xatolik');
        }
      });
    });
  });
}

// ---- Top Up Stars via @HOLDbot Invoice ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'Balansni toʻldirish') {
  openModal('⭐ PaxtaGram Stars Toʻldirish', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:12.5px;color:var(--text-2);">Sabab: <b>${esc(reason)}</b></p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 400, 600, 1000, 2500].map(amt => `
          <button type="button" class="arena-btn" data-preset="${amt}" style="justify-content:center;">⭐ ${amt}</button>
        `).join('')}
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);display:block;margin-bottom:4px;">Yoki miqdorni kiriting:</label>
        <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" style="width:100%;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:9px 12px;color:#fff;font-size:15px;font-weight:700;" />
      </div>
      <button type="button" class="btn-gold-full" id="btnPayStarsInvoice">⚡ @HOLDbot Orqali Stars Toʻlash</button>
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
              showToast(`✅ +⭐ ${amount} hisobingizga qoʻshildi!`);
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

  openModal('👑 $HOLD Admin Panel (ID 100)', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);">Bugungi Morze Soʻzi (Daily Cipher):</label>
        <input type="text" id="admMorseWord" value="${esc(curWord)}" style="width:100%;background:#000;border:1px solid rgba(255,255,255,0.2);border-radius:9px;padding:8px 10px;color:#fff;margin-top:4px;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);">Morze Maslahati (Hint):</label>
        <input type="text" id="admMorseHint" value="${esc(u.morse?.hint || '')}" style="width:100%;background:#000;border:1px solid rgba(255,255,255,0.2);border-radius:9px;padding:8px 10px;color:#fff;margin-top:4px;" />
      </div>
      <div>
        <label style="font-size:12px;color:var(--text-2);">Morze Mukofoti ($HOLD):</label>
        <input type="number" id="admMorseReward" value="${u.morse?.reward || 1000000}" style="width:100%;background:#000;border:1px solid rgba(255,255,255,0.2);border-radius:9px;padding:8px 10px;color:#fff;margin-top:4px;" />
      </div>
      <button type="button" class="btn-gold-full" id="btnSaveHoldAdmin">💾 Saqlash</button>
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
        showToast('✅ Kunlik Morze sozlamalari yangilandi!');
      } else {
        showToast(res.error || 'Xatolik');
      }
    });
  });
}

// ---- Switch Tab ----
function switchHoldTab(tab) {
  STATE.activeTab = tab;
  document.querySelectorAll('.hnav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.htab === tab);
  });
  document.getElementById('paneArena').hidden = tab !== 'arena';
  document.getElementById('paneMine').hidden = tab !== 'mine';
  document.getElementById('paneVault').hidden = tab !== 'vault';
  document.getElementById('paneEarn').hidden = tab !== 'earn';

  if (tab === 'vault' && !STATE.vaultItems.length) {
    loadVaultData();
  }
}

// ---- DOMContentLoaded Wiring ----
window.addEventListener('DOMContentLoaded', async () => {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {}

  // Bottom Navigation
  document.querySelectorAll('.hnav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchHoldTab(btn.dataset.htab));
  });

  // Top Widgets
  document.getElementById('btnToggleMorseMode')?.addEventListener('click', () => {
    STATE.morseMode = !STATE.morseMode;
    document.body.classList.toggle('morse-mode-active', STATE.morseMode);
    document.getElementById('morseCipherPanel').hidden = !STATE.morseMode;
    document.getElementById('coinSubTag').textContent = STATE.morseMode ? '• — MORZE SHIFR' : 'PAXTA WEB3';
    showToast(STATE.morseMode ? '🔴 Morze Shifr rejimi yoqildi!' : '🪙 Oddiy Tap rejimiga qaytildi');
  });

  document.getElementById('btnGoCombo')?.addEventListener('click', () => switchHoldTab('mine'));
  document.getElementById('btnGoVaultQuick')?.addEventListener('click', () => switchHoldTab('vault'));

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

  // Central 3D Coin Pointer Events (Supports both Tap & Morse Hold Duration!)
  const coinBtn = document.getElementById('holdCoinBtn');
  if (coinBtn) {
    coinBtn.addEventListener('pointerdown', (e) => {
      STATE.pointerDownTime = Date.now();
      const rect = coinBtn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      coinBtn.style.transform = `rotateX(${-dy * 16}deg) rotateY(${dx * 16}deg) scale(0.95)`;
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

  // Rocket Turbo Button
  document.getElementById('btnTriggerRocket')?.addEventListener('click', async () => {
    const res = await api('/api/hold/boost', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username, type: 'rocket' })
    });
    if (res.ok && res.user) {
      STATE.user = res.user;
      STATE.turboActiveUntil = Date.now() + (res.turboDurationMs || 10000);
      playTone('win');
      renderAll();
      showToast(res.message);
    } else {
      showToast(res.error || 'Turbo limiti tugagan');
    }
  });

  // Boosts & VIP Sheets
  document.getElementById('btnOpenBoostSheet')?.addEventListener('click', openBoostsModal);
  document.getElementById('btnOpenVipSheet')?.addEventListener('click', openVipPacksModal);
  document.getElementById('btnTopAddStars')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', openHoldAdminModal);

  // Sound toggle
  const soundBtn = document.getElementById('btnToggleSound');
  if (soundBtn) {
    soundBtn.textContent = STATE.soundEnabled ? '🔊' : '🔇';
    soundBtn.addEventListener('click', () => {
      STATE.soundEnabled = !STATE.soundEnabled;
      localStorage.setItem('hold_sound', STATE.soundEnabled ? 'on' : 'off');
      soundBtn.textContent = STATE.soundEnabled ? '🔊' : '🔇';
    });
  }

  // Mine category filters
  document.querySelectorAll('#mineCatTabs .mine-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#mineCatTabs .mine-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.mineCat = btn.dataset.mcat || 'all';
      renderMinePane();
    });
  });

  // Vault filters & search
  document.querySelectorAll('#vaultFilterChips .v-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#vaultFilterChips .v-chip').forEach(c => c.classList.remove('active'));
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
      showToast('🔗 Referal havolangiz nusxalandi! Doʻstlaringizga yuboring.');
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

  // Passive energy & PPH ticker every 2 seconds
  setInterval(() => {
    if (!STATE.user) return;
    if (STATE.user.energy < STATE.user.maxEnergy) {
      STATE.user.energy = Math.min(STATE.user.maxEnergy, STATE.user.energy + 6);
      document.getElementById('uiEnergyText').textContent = `${fmtInt(STATE.user.energy)} / ${fmtInt(STATE.user.maxEnergy)}`;
      document.getElementById('uiEnergyBarFill').style.width = `${Math.min(100, Math.round((STATE.user.energy / Math.max(1, STATE.user.maxEnergy)) * 100))}%`;
    }
  }, 2000);
});
