// ============================================================================
// HOLD — Official Web3 Mini App (Skins Theme Engine, Mid-Air Morse, Leagues)
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

const CARD_EMOJIS = {
  server: '🖥️',
  shield: '🛡️',
  star: '⭐',
  target: '🎯',
  layers: '💎',
  chart: '📈',
  radio: '📡',
  lock: '🔐',
  cpu: '⚡',
  award: '🏅',
  calendar: '📅',
  diamond: '💠'
};

const STATE = {
  user: null,
  authToken: localStorage.getItem('hold_auth_token') || '',
  username: localStorage.getItem('hold_username') || '',
  totalPlayers: 0,
  top10Prizes: [],
  leaderboard: [],
  viewedLeagueIdx: 0,
  leagueMainTab: 'miners',
  leagueTimePeriod: 'day',
  // Pure Invisible Mid-Air Morse State
  morseSignal: '',
  morseDecodedLetters: [],
  morseMatchedWords: [],
  morseLetterTimer: null,
  morseClearAirTimer: null,
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
    leagues: 'sheetLeagues'
  };
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  const targetId = map[sheetName];
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) el.hidden = false;
    if (sheetName === 'leagues') {
      const leagues = STATE.user?.allLeagues || [];
      const curIdx = leagues.findIndex(l => l.id === STATE.user?.league?.id);
      if (curIdx >= 0) STATE.viewedLeagueIdx = curIdx;
      renderLeaguesSheet();
      if (!STATE.leaderboard.length) loadLeaderboardData();
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

// ---- Apply Skin Theme & Coin Images Globally ----
function applyActiveSkinTheme() {
  const u = STATE.user;
  if (!u) return;
  const skins = u.allSkins || [];
  const activeSkin = skins.find(s => s.id === u.skin) || skins[0] || {
    img: '/hold/skins/skin-4.png',
    theme: {
      accent: '#38b6ff',
      secondary: '#0066ff',
      glow1: 'rgba(0, 132, 255, 0.60)',
      glow2: 'rgba(0, 68, 204, 0.34)',
      bgBottom: '#041b4d'
    }
  };

  const t = activeSkin.theme;
  if (t) {
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', t.accent);
    root.style.setProperty('--theme-secondary', t.secondary);
    root.style.setProperty('--theme-glow-1', t.glow1);
    root.style.setProperty('--theme-glow-2', t.glow2);
    root.style.setProperty('--theme-bg-bottom', t.bgBottom);
  }

  // Update all coin images across the app to match the equipped skin
  const coinIds = ['uiMainCoinImg', 'uiBalanceCoinIcon', 'uiTopMiniCoin', 'uiDockCoinImg', 'uiBoostBalanceCoin'];
  for (const id of coinIds) {
    const el = document.getElementById(id);
    if (el && el.getAttribute('src') !== activeSkin.img) {
      el.setAttribute('src', activeSkin.img);
    }
  }
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
      showToast(`+${fmtInt(data.user.passiveEarnedJustNow)} HOLD (Offline mining)`);
    }

    if (!data.user.ogBonusClaimed) {
      setTimeout(openOgSnapshotModal, 350);
    }
  }
}

// ---- Initial OG Snapshot Modal ----
function openOgSnapshotModal() {
  openModal('Welcome to HOLD', `
    <div style="text-align:center;padding:8px 4px;display:flex;flex-direction:column;align-items:center;gap:14px;">
      <img src="/hold/skins/skin-4.png" style="width:80px;height:80px;object-fit:contain;" />
      <div>
        <h3 style="font-size:20px;font-weight:800;">Nothing to sell. Just hold.</h3>
        <p style="font-size:13.5px;color:var(--text-2);margin-top:4px;">
          PaxtaGram profilingiz tekshirildi va boshlangʻich HOLD bonusingiz tayyor.
        </p>
      </div>
      <div style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px;font-size:13.5px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Account</span>
          <b>@${esc(STATE.user?.username)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-2);">Status</span>
          <b style="color:var(--theme-accent);">${(STATE.user?.paxtaId && STATE.user.paxtaId <= 600) ? 'Early Pioneer' : 'Verified Holder'}</b>
        </div>
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnClaimOgNow">Claim HOLD Bonus</button>
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

// ============================================================================
// PURE FLOATING MID-AIR MORSE CODE (ZERO INPUT BOX, FLOATS IN MID-AIR ONLY!)
// ============================================================================
function getCandidateMorseWords() {
  const daily = (STATE.user?.morse?.word || 'HOLD').toUpperCase();
  const secrets = STATE.user?.morse?.secretWords || ['WAKEUP', 'PAXTA', 'MEDAL', 'OBSIDIAN', 'MOON'];
  return Array.from(new Set([daily, ...secrets]));
}

function recordCoinMorseSignal(symbol) {
  STATE.morseSignal += symbol;
  clearTimeout(STATE.morseLetterTimer);
  STATE.morseLetterTimer = setTimeout(evaluateInvisibleMorseLetter, 680);
}

function renderMidAirFloatingLetters(isSolved = false) {
  const airEl = document.getElementById('floatingMidAirMorse');
  if (!airEl) return;

  if (!STATE.morseDecodedLetters.length) {
    airEl.classList.remove('solved');
    airEl.innerHTML = '';
    return;
  }

  airEl.classList.toggle('solved', isSolved);
  airEl.innerHTML = STATE.morseDecodedLetters
    .map(ch => `<span class="midair-letter">${esc(ch)}</span>`)
    .join('');
}

function clearMidAirMorse() {
  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseSignal = '';
  STATE.morseDecodedLetters = [];
  STATE.morseMatchedWords = [];
  renderMidAirFloatingLetters(false);
}

async function evaluateInvisibleMorseLetter() {
  const sig = STATE.morseSignal;
  STATE.morseSignal = '';
  if (!sig) return;

  const decodedChar = REVERSE_MORSE[sig];
  if (!decodedChar) {
    if (STATE.morseDecodedLetters.length > 0) {
      clearMidAirMorse();
    }
    return;
  }

  const allWords = getCandidateMorseWords();

  // Case 1: First letter — only show in mid-air if it matches the 1st letter of a valid code!
  if (STATE.morseDecodedLetters.length === 0) {
    const matching = allWords.filter(w => w.startsWith(decodedChar));
    if (matching.length === 0) {
      // Normal tapping — do not show anything at all!
      return;
    }
    STATE.morseDecodedLetters = [decodedChar];
    STATE.morseMatchedWords = matching;
    haptic('medium');
    renderMidAirFloatingLetters(false);

    clearTimeout(STATE.morseClearAirTimer);
    STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 5500);
    return;
  }

  // Case 2: Subsequent letters
  const nextPrefix = STATE.morseDecodedLetters.join('') + decodedChar;
  const stillMatching = STATE.morseMatchedWords.filter(w => w.startsWith(nextPrefix));

  if (stillMatching.length === 0) {
    // Check if the new letter itself starts a fresh code word
    const freshMatch = allWords.filter(w => w.startsWith(decodedChar));
    if (freshMatch.length > 0) {
      STATE.morseDecodedLetters = [decodedChar];
      STATE.morseMatchedWords = freshMatch;
      haptic('medium');
      renderMidAirFloatingLetters(false);
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 5500);
    } else {
      clearMidAirMorse();
    }
    return;
  }

  STATE.morseDecodedLetters.push(decodedChar);
  STATE.morseMatchedWords = stillMatching;
  haptic('medium');
  renderMidAirFloatingLetters(false);

  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 5500);

  // Check if an exact word is now completed!
  const currentWord = STATE.morseDecodedLetters.join('');
  if (stillMatching.includes(currentWord)) {
    clearTimeout(STATE.morseClearAirTimer);
    renderMidAirFloatingLetters(true);
    haptic('heavy');

    const res = await api('/api/hold/solve-morse', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username, word: currentWord })
    });

    setTimeout(() => {
      clearMidAirMorse();
    }, 1500);

    if (res.ok && res.user) {
      STATE.user = res.user;
      renderAll();
      showToast(`✨ ${currentWord} · +${fmtInt(res.reward)} HOLD!`);
    } else if (res.error) {
      showToast(res.error);
    }
  }
}

// ============================================================================
// RENDER ALL VIEWS
// ============================================================================
function renderAll() {
  const u = STATE.user;
  if (!u) return;

  applyActiveSkinTheme();

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  document.body.classList.toggle('turbo-active', isTurbo);

  // 1. Top Community Pill
  const squads = u.squads || [];
  const activeSq = squads.find(s => s.id === u.squadId) || squads[0] || {
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
  if (pphTop) pphTop.textContent = `+${fmtInt(u.profitPerHour)}/h`;

  const starsEl = document.getElementById('uiStars');
  if (starsEl) starsEl.textContent = fmtInt(u.stars);

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

  renderBoostsAndSkinsSheet();
  renderEarnSheet();
  renderFrensSheet();
  renderLeaguesSheet();
}

// ---- Tap Handling ----
function handleCoinTap(clientX, clientY) {
  const u = STATE.user;
  if (!u) return;

  const isTurbo = Date.now() < STATE.turboActiveUntil;
  const tapVal = isTurbo ? u.tapPower * 7 : u.tapPower;

  if (!isTurbo && u.energy < u.tapPower) {
    showToast('⚡ Energiya toʻlmoqda...');
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
  floatEl.style.left = `${(clientX || window.innerWidth / 2) - 18}px`;
  floatEl.style.top = `${(clientY || window.innerHeight / 2) - 28}px`;
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

// ============================================================================
// SHEET 1: LEAGUES SHOWCASE & TOP-10 NFT PRIZES (SCREENSHOT 2)
// ============================================================================
async function loadLeaderboardData() {
  const res = await api('/api/hold/vault');
  if (res.ok) {
    STATE.totalPlayers = res.totalPlayers || (res.leaderboard || []).length;
    STATE.top10Prizes = res.top10Prizes || [];
    STATE.leaderboard = res.leaderboard || [];
    renderLeaguesSheet();
  }
}

function renderLeaguesSheet() {
  const u = STATE.user;
  if (!u) return;

  const totalEl = document.getElementById('uiTotalPlayersCount');
  if (totalEl) totalEl.textContent = fmtInt(Math.max(1240, STATE.totalPlayers || STATE.leaderboard.length));

  const leagues = u.allLeagues || [];
  if (!leagues.length) return;

  const idx = Math.max(0, Math.min(leagues.length - 1, STATE.viewedLeagueIdx));
  const lg = leagues[idx];
  const nextLg = leagues[idx + 1] || null;

  const sheetEl = document.getElementById('sheetLeagues');
  const glowEl = document.getElementById('uiLeagueTrophyGlow');
  if (sheetEl && lg.glow) sheetEl.style.setProperty('--league-glow', lg.glow);
  if (glowEl && lg.glow) glowEl.style.background = lg.glow;

  const prevBtn = document.getElementById('btnPrevLeague');
  const nextBtn = document.getElementById('btnNextLeague');
  if (prevBtn) prevBtn.disabled = idx <= 0;
  if (nextBtn) nextBtn.disabled = idx >= leagues.length - 1;

  const titleEl = document.getElementById('uiShowcaseLeagueTitle');
  const subEl = document.getElementById('uiShowcaseLeagueSub');
  const barEl = document.getElementById('uiShowcaseLeagueBar');

  if (titleEl) titleEl.textContent = `${lg.name} league`;
  if (subEl) {
    if (lg.id === u.league?.id) {
      const targetStr = nextLg ? fmtInt(nextLg.minHold) : '∞';
      subEl.textContent = `${fmtInt(u.lifetimeHold)} / ${targetStr}`;
    } else {
      subEl.textContent = `from ${fmtInt(lg.minHold)} HOLD`;
    }
  }
  if (barEl) {
    const target = nextLg ? nextLg.minHold : Math.max(10_000_000, u.lifetimeHold);
    const pct = Math.min(100, Math.max(6, Math.round((u.lifetimeHold / Math.max(1, target)) * 100)));
    barEl.style.width = `${pct}%`;
  }

  const listWrap = document.getElementById('leagueBoardList');
  if (!listWrap) return;
  listWrap.innerHTML = '';

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  if (STATE.leagueMainTab === 'squads') {
    const squads = u.squads || [];
    squads.forEach((sq, sIdx) => {
      const rank = sIdx + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
      const row = document.createElement('div');
      row.className = 'lb-row-item';
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-medal-col">${medal}</div>
          <div class="lb-avatar-circle">${esc((sq.name || 'S').charAt(0))}</div>
          <div class="lb-user-meta">
            <div class="lb-user-name">${esc(sq.name)}</div>
            <div class="lb-user-score">
              <img src="${esc(coinImg)}" class="inline-c" alt="" />
              <span>${fmtInt(sq.totalHold)}</span>
            </div>
          </div>
        </div>
        <span class="nri-chevron">›</span>
      `;
      row.addEventListener('click', () => openSheet('frens'));
      listWrap.appendChild(row);
    });
    return;
  }

  if (STATE.leagueMainTab === 'prizes') {
    for (const p of STATE.top10Prizes) {
      const holder = STATE.leaderboard.find(x => x.rank === p.rank);
      const nft = p.nft;
      const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;
      const row = document.createElement('div');
      row.className = 'lb-row-item';
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-medal-col">${medal}</div>
          ${nft ? `
            <div class="prize-nft-thumb" style="background:radial-gradient(circle, ${esc(nft.centerColor)}, ${esc(nft.edgeColor)});">
              <img src="${esc(nft.img)}" alt="${esc(nft.title)}" loading="lazy" />
            </div>
          ` : `<div class="lb-avatar-circle">#${p.rank}</div>`}
          <div class="lb-user-meta">
            <div class="lb-user-name">${nft ? esc(nft.title) : `Top #${p.rank} Prize`}</div>
            <div class="lb-user-score">
              <span style="color:var(--theme-accent);font-weight:700;">+${fmtInt(p.holdBonus)} HOLD</span>
              <span>· ${holder ? `@${esc(holder.username)}` : 'Open'}</span>
            </div>
          </div>
        </div>
      `;
      listWrap.appendChild(row);
    }
    return;
  }

  // Default: Miners leaderboard
  const players = STATE.leaderboard || [];
  players.slice(0, 50).forEach((p) => {
    const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}`;
    const row = document.createElement('div');
    row.className = 'lb-row-item';
    row.innerHTML = `
      <div class="lb-left">
        <div class="lb-medal-col">${medal}</div>
        <div class="lb-avatar-circle">${esc((p.displayName || p.username || 'U').charAt(0).toUpperCase())}</div>
        <div class="lb-user-meta">
          <div class="lb-user-name">${esc(p.displayName || p.username)}</div>
          <div class="lb-user-score">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <span>${fmtInt(p.lifetimeHold)}</span>
          </div>
        </div>
      </div>
      ${p.rank <= 10 && p.prize?.nft ? `<span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;">🎁 ${esc(p.prize.nft.title)}</span>` : ''}
    `;
    listWrap.appendChild(row);
  });
}

// ============================================================================
// SHEET 2: BOOSTS & BUY SKINS (SCREENSHOT 1 & 3)
// ============================================================================
function renderBoostsAndSkinsSheet() {
  const u = STATE.user;
  if (!u) return;

  const balNum = document.getElementById('uiBoostBalanceNum');
  if (balNum) balNum.textContent = fmtInt(u.holdBalance);

  const rkSub = document.getElementById('uiRocketSub');
  const ftSub = document.getElementById('uiFullTankSub');
  if (rkSub) rkSub.textContent = (u.rocketCount ?? 3) > 0 ? `${u.rocketCount} / 3 available` : '12 hours left';
  if (ftSub) ftSub.textContent = (u.fullTankCount ?? 3) > 0 ? `${u.fullTankCount} / 3 available` : '12 hours left';

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // Permanent Boosters (Exact Screenshot 3 layout)
  const upgList = document.getElementById('boostUpgradesList');
  if (upgList) {
    const rMaxed = (u.rechargingSpeedLevel || 1) >= (u.rechargingSpeedMax || 5);
    upgList.innerHTML = `
      <button type="button" class="not-row-item" data-boost-upg="energy_limit">
        <div class="nri-icon-box">🔋</div>
        <div class="nri-center">
          <div class="nri-title">Energy Limit</div>
          <div class="nri-sub">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <b>${fmtInt(u.nextEnergyUpgradeCost)}</b> · ${u.energyLevel} level
          </div>
        </div>
        <span class="nri-chevron">›</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="recharging_speed" ${rMaxed ? 'disabled' : ''}>
        <div class="nri-icon-box">⚡</div>
        <div class="nri-center">
          <div class="nri-title">Recharging speed</div>
          <div class="nri-sub">
            ${rMaxed
              ? 'Max level reached'
              : `<img src="${esc(coinImg)}" class="inline-c" alt="" /> <b>${fmtInt(u.nextRechargingUpgradeCost)}</b> · ${u.rechargingSpeedLevel || 1} level`
            }
          </div>
        </div>
        <span class="nri-chevron">${rMaxed ? '✓' : '›'}</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="multitap">
        <div class="nri-icon-box">☝️</div>
        <div class="nri-center">
          <div class="nri-title">Multitap</div>
          <div class="nri-sub">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <b>${fmtInt(u.nextTapUpgradeCost)}</b> · ${u.tapLevel} level
          </div>
        </div>
        <span class="nri-chevron">›</span>
      </button>

      <button type="button" class="not-row-item" data-boost-upg="autobot" ${u.autoBotEnabled ? 'disabled' : ''}>
        <div class="nri-icon-box">🤖</div>
        <div class="nri-center">
          <div class="nri-title">Auto tap bot</div>
          <div class="nri-sub ${!u.autoBotEnabled ? 'gold-lock' : ''}">
            ${u.autoBotEnabled ? 'Active (24/7 mining)' : `🪙 ${fmtInt(u.autoBotCost)} HOLD`}
          </div>
        </div>
        <span class="nri-chevron">${u.autoBotEnabled ? '✓' : '›'}</span>
      </button>
    `;

    upgList.querySelectorAll('[data-boost-upg]').forEach(btn => {
      btn.addEventListener('click', () => triggerBoost(btn.dataset.boostUpg));
    });
  }

  // Buy Skins List (Exact Screenshot 1 layout)
  const skinsWrap = document.getElementById('skinsListContainer');
  if (skinsWrap) {
    const owned = u.ownedSkins || ['basic'];
    skinsWrap.innerHTML = (u.allSkins || []).map(sk => {
      const isOwned = owned.includes(sk.id);
      const isEnabled = u.skin === sk.id;
      return `
        <div class="not-row-item" data-skin-id="${esc(sk.id)}">
          <div class="nri-skin-box">
            <img src="${esc(sk.img)}" alt="${esc(sk.name)}" />
          </div>
          <div class="nri-center">
            <div class="nri-title">${esc(sk.name)}</div>
            <div class="nri-sub ${!isOwned ? 'gold-lock' : ''}">
              ${isOwned ? 'You own it' : `🔒 ${fmtInt(sk.priceHold)} HOLD`}
            </div>
          </div>
          <button type="button" class="skin-pill-btn ${isEnabled ? 'enabled' : ''}" data-skin-action="${esc(sk.id)}">
            ${isEnabled ? 'enabled' : isOwned ? 'turn on' : 'buy'}
          </button>
        </div>
      `;
    }).join('');

    skinsWrap.querySelectorAll('[data-skin-id]').forEach(row => {
      row.addEventListener('click', async () => {
        const skinId = row.dataset.skinId;
        if (u.skin === skinId) return;
        const res = await api('/api/hold/skin', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, skinId })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          haptic('heavy');
          renderAll();
          showToast(res.message);
        } else {
          showToast(res.error || 'Yetarli HOLD yoʻq');
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

// ============================================================================
// SHEET 3: EARN MORE COINS + DAILY STREAK + MINE COMBO (SCREENSHOT 4)
// ============================================================================
function renderEarnSheet() {
  const u = STATE.user;
  if (!u) return;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // 1. Daily 7-Day Streak
  const streakRow = document.getElementById('streakDaysRow');
  const streakBtn = document.getElementById('btnClaimDailyStreak');
  if (streakRow && u.streak) {
    const curDay = u.streak.currentDay || 0;
    const claimedToday = !!u.streak.claimedToday;
    const nextDay = (curDay % 7) + 1;

    streakRow.innerHTML = (u.streak.rewards || []).map(r => {
      const isClaimed = r.day <= curDay;
      const isNext = !claimedToday && r.day === nextDay;
      return `
        <div class="streak-day-pill ${isClaimed ? 'claimed' : ''} ${isNext ? 'next' : ''}">
          <span>D${r.day}</span>
          <strong>+${r.reward >= 1000000 ? '1M' : `${r.reward / 1000}K`}</strong>
        </div>
      `;
    }).join('');

    if (streakBtn) {
      streakBtn.disabled = claimedToday;
      streakBtn.style.opacity = claimedToday ? '0.5' : '1';
      streakBtn.textContent = claimedToday ? 'Bugungi bonus olingan ✓' : `Day ${nextDay} bonusni olish`;
    }
  }

  // 2. Onboarding Tasks & Specials (Screenshot 4)
  const done = u.tasksCompleted || [];
  const quests = u.quests || [];
  const onboardingIds = ['daily_checkin', 'join_squad', 'invite_1_friend', 'upgrade_3_cards'];
  const onboardingQuests = quests.filter(q => onboardingIds.includes(q.id));
  const specialQuests = quests.filter(q => !onboardingIds.includes(q.id));

  const qEmojiMap = {
    daily_checkin: '🐣',
    join_squad: '🛡️',
    invite_1_friend: '🧸',
    invite_3_friends: '🔥',
    upgrade_3_cards: '⚡',
    solve_first_morse: '📡',
    reach_silver: '🥈',
    reach_gold: '🏆'
  };

  const renderQuestRows = (containerId, list) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (const q of list) {
      const isDone = done.includes(q.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'not-row-item';
      btn.style.opacity = isDone ? '0.55' : '1';
      btn.innerHTML = `
        <div class="nri-icon-box">${qEmojiMap[q.id] || '⭐'}</div>
        <div class="nri-center">
          <div class="nri-title">${esc(q.title)}</div>
          <div class="nri-sub">
            ${isDone ? 'Completed' : `+${fmtInt(q.reward)} <img src="${esc(coinImg)}" class="inline-c" alt="" />`}
          </div>
        </div>
        <span class="nri-chevron">${isDone ? '✓' : '›'}</span>
      `;
      if (!isDone) {
        btn.addEventListener('click', async () => {
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
      el.appendChild(btn);
    }
  };

  renderQuestRows('onboardingTasksList', onboardingQuests);
  renderQuestRows('specialsTasksList', specialQuests);

  // 3. Mine & Daily 3-Card Combo
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
        ? `<span style="font-size:22px;">${CARD_EMOJIS[cardObj.icon] || '⚡'}</span><strong>${esc(cardObj.name)}</strong>`
        : `<span style="font-size:20px;opacity:0.45;">🔒</span><span>${i + 1}-karta</span>`;
      slotsRow.appendChild(slot);
    }
  }

  const grid = document.getElementById('mineCardsGrid');
  if (grid) {
    grid.innerHTML = '';
    for (const c of u.cards || []) {
      const canAfford = (u.holdBalance || 0) >= c.upgradeCost;
      const card = document.createElement('div');
      card.className = 'mine-card';
      card.innerHTML = `
        <div class="mc-top">
          <span style="font-size:24px;">${CARD_EMOJIS[c.icon] || '⚡'}</span>
          <div>
            <div class="mc-title">${esc(c.name)}</div>
            <div class="mc-pph">+${fmtInt(c.nextProfitDelta)} / h</div>
          </div>
        </div>
        <div class="mc-foot">
          <span class="mc-lvl">Lv.${c.level}</span>
          <button type="button" class="mc-buy-btn" style="${!canAfford ? 'opacity:0.45;' : ''}">${fmtInt(c.upgradeCost)}</button>
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
            showToast(`🎉 Daily Combo! +${fmtInt(res.comboReward)} HOLD`);
          } else if (res.comboJustFound) {
            showToast(`✨ Combo card found (${res.user.combo.foundCardIds.length}/3)`);
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

// ============================================================================
// SHEET 4: FRENS, STARS VIP PACKS & SQUADS
// ============================================================================
function renderFrensSheet() {
  const u = STATE.user;
  if (!u) return;

  const refCountEl = document.getElementById('uiRefCount');
  if (refCountEl) refCountEl.textContent = `${(u.referrals || []).length} frens`;

  const vipList = document.getElementById('vipPacksList');
  if (vipList) {
    vipList.innerHTML = (u.vipPacks || []).map(p => `
      <div class="not-row-item" data-pack="${esc(p.id)}">
        <div class="nri-icon-box">⭐</div>
        <div class="nri-center">
          <div class="nri-title">${esc(p.name)}</div>
          <div class="nri-sub">${esc(p.desc)}</div>
        </div>
        <span class="skin-pill-btn">${p.starsPrice} ⭐</span>
      </div>
    `).join('');

    vipList.querySelectorAll('[data-pack]').forEach(row => {
      row.addEventListener('click', async () => {
        const packId = row.dataset.pack;
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

  const sList = document.getElementById('squadsList');
  if (sList) {
    sList.innerHTML = '';
    for (const sq of u.squads || []) {
      const joined = u.squadId === sq.id;
      const row = document.createElement('div');
      row.className = 'not-row-item';
      row.innerHTML = `
        <div class="nri-icon-box">🛡️</div>
        <div class="nri-center">
          <div class="nri-title">${esc(sq.name)}</div>
          <div class="nri-sub">${fmtInt(sq.members)} members · ${fmtInt(sq.totalHold)} HOLD</div>
        </div>
        <span class="skin-pill-btn ${joined ? 'enabled' : ''}">${joined ? 'Joined' : 'Join'}</span>
      `;
      if (!joined) {
        row.addEventListener('click', async () => {
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

// ---- Top Up Stars via @HOLDbot Invoice ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'HOLD Boost') {
  openModal('Top Up Stars', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 500, 1000, 2500, 5000].map(amt => `
          <button type="button" class="skin-pill-btn" data-preset="${amt}" style="padding:10px;">⭐ ${amt}</button>
        `).join('')}
      </div>
      <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" class="apple-search-input" />
      <button type="button" class="btn-sapphire-primary" id="btnPayStarsInvoice">Pay with Stars</button>
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
              showToast(`+${amount} Stars added`);
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
  const curWord = u.morse?.word || 'HOLD';

  openModal('Admin Config', `
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div>
        <label style="font-size:12px;color:var(--text-2);">Daily Morse Word</label>
        <input type="text" id="admMorseWord" value="${esc(curWord)}" class="apple-search-input" style="margin-top:4px;" />
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
      const morseReward = parseInt(body.querySelector('#admMorseReward')?.value, 10) || 1000000;

      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, morseWord, morseReward })
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

  // Bottom Dock Sheet Triggers
  document.querySelectorAll('[data-open-sheet]').forEach(btn => {
    btn.addEventListener('click', () => openSheet(btn.dataset.openSheet));
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeAllSheets);
  });

  // Top Pill & League Triggers
  document.getElementById('btnSquadPill')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnOpenLeagues')?.addEventListener('click', () => openSheet('leagues'));
  document.getElementById('btnOpenStarsTopup')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', openHoldAdminModal);
  document.getElementById('btnEarnInviteCard')?.addEventListener('click', () => openSheet('frens'));

  // How Boost Works & Earn Guide Modals
  document.getElementById('btnHowBoostWorks')?.addEventListener('click', () => {
    openModal('How boost works', `
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;">
        <p><b style="color:#fff;">🚀 3 x Turbo:</b> 10 soniya davomida har bir bosishni 7 barobar koʻpaytiradi va energiya sarflamaydi.</p>
        <p><b style="color:#fff;">⚡ Full energy:</b> Energiya zaxirasini bir zumda 100% ga toʻldiradi.</p>
        <p><b style="color:#fff;">☝️ Multitap & 🔋 Energy Limit:</b> Har bir bosish kuchini va maksimal energiyani doimiy oshiradi.</p>
        <p><b style="color:#fff;">🎨 Buy Skins:</b> Markazdagi tanga koʻrinishi va butun ilova ranglar palitrasini oʻzgartiradi.</p>
      </div>
    `);
  });

  document.getElementById('btnOpenEarnGuide')?.addEventListener('click', () => {
    openModal('Full guide', `
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;">
        <p><b style="color:#fff;">🪙 Tap & Hold:</b> Tangani bosib HOLD yigʻing. Tanga ustida qisqa (•) va uzun (—) bosish orqali yashirin Morze soʻzining 1-harfini topsangiz, harflar havoda muallaq paydo boʻladi (+1,000,000 HOLD).</p>
        <p><b style="color:#fff;">⚡ Daily Combo:</b> Har kuni 3 ta yashirin Mine kartani yangilab +3,000,000 HOLD oling.</p>
        <p><b style="color:#fff;">🏆 Top-10 NFT:</b> Reytingda Top-10 oʻrinni egallagan ishtirokchilar haqiqiy NFT sovgʻalar va HOLD mukofotlarini qoʻlga kiritadilar.</p>
      </div>
    `);
  });

  // Daily Streak Claim
  document.getElementById('btnClaimDailyStreak')?.addEventListener('click', async () => {
    const res = await api('/api/hold/claim-streak', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      STATE.user = res.user;
      haptic('heavy');
      renderAll();
      showToast(res.message);
    } else {
      showToast(res.error || 'Bugun olingan');
    }
  });

  // Leagues Carousel Arrows & Tabs
  document.getElementById('btnPrevLeague')?.addEventListener('click', () => {
    if (STATE.viewedLeagueIdx > 0) {
      STATE.viewedLeagueIdx--;
      haptic('light');
      renderLeaguesSheet();
    }
  });
  document.getElementById('btnNextLeague')?.addEventListener('click', () => {
    const maxIdx = (STATE.user?.allLeagues?.length || 1) - 1;
    if (STATE.viewedLeagueIdx < maxIdx) {
      STATE.viewedLeagueIdx++;
      haptic('light');
      renderLeaguesSheet();
    }
  });

  document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.leagueMainTab = btn.dataset.ltab || 'miners';
      renderLeaguesSheet();
    });
  });

  document.querySelectorAll('#leagueTimeTabs .dsub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#leagueTimeTabs .dsub-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.leagueTimePeriod = btn.dataset.tperiod || 'day';
      renderLeaguesSheet();
    });
  });

  // Boosts Free Daily Triggers
  document.getElementById('btnBoostFullTank')?.addEventListener('click', () => triggerBoost('full_tank'));
  document.getElementById('btnBoostTurbo')?.addEventListener('click', () => triggerBoost('rocket'));

  // Main 3D Coin Pointer Events (Handles BOTH Tapping AND Invisible Mid-Air Morse!)
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

      // Always award tap AND invisibly evaluate Morse signal (dot < 215ms, dash >= 215ms)
      handleCoinTap(e.clientX, e.clientY);
      recordCoinMorseSignal(heldMs >= 215 ? '-' : '.');
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
      showToast('Invite link copied!');
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
      const speedBonus = ((STATE.user.rechargingSpeedLevel || 1) - 1) * 2;
      STATE.user.energy = Math.min(STATE.user.maxEnergy, STATE.user.energy + 6 + speedBonus);
      const eNow = document.getElementById('uiEnergyNow');
      const eFill = document.getElementById('uiEnergyBarFill');
      if (eNow) eNow.textContent = fmtInt(STATE.user.energy);
      if (eFill) eFill.style.width = `${Math.min(100, Math.round((STATE.user.energy / Math.max(1, STATE.user.maxEnergy)) * 100))}%`;
    }
  }, 2000);
});
