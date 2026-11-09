// ============================================================================
// HOLD — Official Web3 Mini App (3D Trophies, Mid-Air Morse, Onboarding, Admin)
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
  totalPlayers: 0,
  top10Prizes: [],
  leaderboard: [],
  leaderboardDay: [],
  openedQuestLinks: {},
  viewedLeagueIdx: 0,
  leagueMainTab: 'miners',
  leagueTimePeriod: 'day',
  onboardingStep: 0,
  adminTab: 'morse',
  // Pure Invisible Mid-Air Morse State
  morseSignal: '',
  morseDecodedLetters: [],
  morseMatchedWords: [],
  morseLetterTimer: null,
  morseClearAirTimer: null,
  dashFeedbackTimer: null,
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

function fmtOrdinal(n) {
  const num = parseInt(n, 10) || 1;
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return fmtInt(num) + (s[(v - 20) % 10] || s[v] || s[0]);
}

function showToast(msg) {
  const el = document.getElementById('holdToast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.hidden = true; }, 2900);
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
    if (el) {
      el.hidden = false;
      document.body.classList.add('sheet-open');
    }
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
  document.body.classList.remove('sheet-open');
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
      glow1: 'rgba(0, 132, 255, 0.58)',
      glow2: 'rgba(0, 68, 204, 0.30)',
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

  const coinIds = ['uiMainCoinImg', 'uiBalanceCoinIcon', 'uiDockCoinImg', 'uiBoostBalanceCoin'];
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
      showToast(`🤖 Auto-Bot: +${fmtInt(data.user.passiveEarnedJustNow)} HOLD`);
    }

    if (!data.user.ogBonusClaimed) {
      openOnboardingStory(0);
    }
  }
}

// ============================================================================
// 3-SLIDE ONBOARDING STORY (INSPIRED BY SCREENSHOT 5)
// ============================================================================
function openOnboardingStory(step = 0) {
  const overlay = document.getElementById('onboardingStoryOverlay');
  if (!overlay) return;
  STATE.onboardingStep = step;
  overlay.hidden = false;
  renderOnboardingSlide();
}

function renderOnboardingSlide() {
  const u = STATE.user;
  if (!u) return;
  const step = STATE.onboardingStep;

  [0, 1, 2].forEach(idx => {
    const bar = document.getElementById(`osBar${idx}`);
    if (bar) bar.style.width = idx <= step ? '100%' : '0%';
  });

  const wrap = document.getElementById('osSlidesWrap');
  const foot = document.getElementById('osFootNote');
  const btn = document.getElementById('btnOsContinue');
  if (!wrap || !foot || !btn) return;

  const pid = u.paxtaId || 245;
  const topPct = u.topPct || 5;
  const years = u.yearsEquivalent || 2;
  const totalReward = pid <= 150 ? 14_500 : pid <= 600 ? 10_000 : 5_500;

  if (step === 0) {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>${pid <= 500 ? 'Legendary status!' : 'Pioneer status!'}</h1>
        <p>You've joined PaxtaGram</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-watermark-bg" alt="" />
        <div class="os-giant-num">${years}</div>
        <div class="os-giant-label">${years === 1 ? 'year' : 'years'} ago</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Your account number is #${pid}.<br/>You're in the Top ${topPct}% PaxtaGram users 🔥`;
    btn.textContent = 'Continue';
  } else if (step === 1) {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>PaxtaGram Verified</h1>
        <p>You know how to get the best</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="Verified" />
        <div class="os-giant-label" style="margin-top:20px;">Verified Holder</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Status confirmed for <b>@${esc(u.username)}</b> ✨`;
    btn.textContent = 'Continue';
  } else {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>You are amazing!</h1>
        <p>Here is your HOLD reward</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="HOLD" />
        <div class="os-giant-label" style="font-size:38px;margin-top:18px;">${fmtInt(u.ogDetails?.totalBonus || totalReward)}</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Thanks for your time on PaxtaGram 🤝`;
    btn.textContent = 'Continue';
  }
}

async function advanceOnboardingStory() {
  haptic('medium');
  if (STATE.onboardingStep < 2) {
    STATE.onboardingStep++;
    renderOnboardingSlide();
    return;
  }

  const overlay = document.getElementById('onboardingStoryOverlay');
  if (!STATE.user?.ogBonusClaimed) {
    const res = await api('/api/hold/claim-og', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      STATE.user = res.user;
      renderAll();
      showToast(`🎉 +${fmtInt(res.ogDetails?.totalBonus || 5500)} HOLD!`);
    }
  }
  if (overlay) overlay.hidden = true;
}

// ============================================================================
// PURE FLOATING MID-AIR MORSE CODE (100% RELIABLE, ZERO INPUT BOX!)
// ============================================================================
function getCandidateMorseWords() {
  const daily = (STATE.user?.morse?.word || 'HOLD').toUpperCase();
  const secrets = STATE.user?.morse?.secretWords || ['WAKEUP', 'PAXTA', 'MEDAL', 'OBSIDIAN', 'MOON'];
  return Array.from(new Set([daily, ...secrets]));
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
  clearTimeout(STATE.morseLetterTimer);
  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseSignal = '';
  STATE.morseDecodedLetters = [];
  STATE.morseMatchedWords = [];
  renderMidAirFloatingLetters(false);
}

function recordCoinMorseSignal(symbol) {
  STATE.morseSignal += symbol;
  clearTimeout(STATE.morseLetterTimer);

  // Determine expected next letters at current position so we never cut off the user mid-letter!
  const allWords = getCandidateMorseWords();
  const activePool = STATE.morseDecodedLetters.length > 0 ? STATE.morseMatchedWords : allWords;
  const nextIdx = STATE.morseDecodedLetters.length;
  const expectedNextChars = Array.from(new Set(activePool.map(w => w[nextIdx]).filter(Boolean)));
  const expectedMorseCodes = expectedNextChars.map(ch => MORSE_MAP[ch]).filter(Boolean);

  const exactMatchNow = expectedMorseCodes.includes(STATE.morseSignal);
  const canGrowIntoAnotherExpected = expectedMorseCodes.some(
    code => code.length > STATE.morseSignal.length && code.startsWith(STATE.morseSignal)
  );

  // If the signal already matches the exact expected letter (e.g. '....' for H) and can't grow further, lock it in quickly (520ms)!
  // If it's a partial prefix of the expected letter (e.g. '..' on the way to '....'), give the user 1450ms!
  let waitMs = 950;
  if (exactMatchNow && !canGrowIntoAnotherExpected) {
    waitMs = 520;
  } else if (canGrowIntoAnotherExpected) {
    waitMs = 1450;
  }

  STATE.morseLetterTimer = setTimeout(evaluateInvisibleMorseLetter, waitMs);
}

async function evaluateInvisibleMorseLetter() {
  const sig = STATE.morseSignal;
  STATE.morseSignal = '';
  if (!sig) return;

  const decodedChar = REVERSE_MORSE[sig];
  if (!decodedChar) {
    // Invalid Morse sequence: if letters are already floating, keep them floating so the user can retry this letter!
    return;
  }

  const allWords = getCandidateMorseWords();

  // Case 1: First letter — only materialize in mid-air if it matches the 1st letter of a valid code!
  if (STATE.morseDecodedLetters.length === 0) {
    const matching = allWords.filter(w => w.startsWith(decodedChar));
    if (matching.length === 0) {
      // Normal tapping — show nothing at all
      return;
    }
    STATE.morseDecodedLetters = [decodedChar];
    STATE.morseMatchedWords = matching;
    haptic('heavy');
    renderMidAirFloatingLetters(false);

    clearTimeout(STATE.morseClearAirTimer);
    STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
    return;
  }

  // Case 2: Subsequent letters
  const nextPrefix = STATE.morseDecodedLetters.join('') + decodedChar;
  const stillMatching = STATE.morseMatchedWords.filter(w => w.startsWith(nextPrefix));

  if (stillMatching.length === 0) {
    // If the user accidentally tapped a single dot '.' ('E') while thinking of the next letter, keep the floating letters alive!
    if (sig === '.') {
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
      return;
    }
    // Check if the new letter starts a fresh word
    const freshMatch = allWords.filter(w => w.startsWith(decodedChar));
    if (freshMatch.length > 0) {
      STATE.morseDecodedLetters = [decodedChar];
      STATE.morseMatchedWords = freshMatch;
      haptic('heavy');
      renderMidAirFloatingLetters(false);
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
    } else {
      clearMidAirMorse();
    }
    return;
  }

  STATE.morseDecodedLetters.push(decodedChar);
  STATE.morseMatchedWords = stillMatching;
  haptic('heavy');
  renderMidAirFloatingLetters(false);

  clearTimeout(STATE.morseClearAirTimer);
  STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);

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
    }, 1800);

    if (res.ok && res.user) {
      STATE.user = res.user;
      renderAll();
      showToast(res.message || `✨ ${currentWord} · +${fmtInt(res.reward)} HOLD!`);
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

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // 1. Top Squad Pill (Exact Screenshot 3: "Join Squad ›" when not in squad, or Squad card when joined)
  const sqPill = document.getElementById('btnSquadPill');
  if (sqPill) {
    const activeSq = (u.squads || []).find(s => s.id === u.squadId);
    if (!activeSq) {
      sqPill.innerHTML = `<div class="nst-join-empty">Join Squad <span>›</span></div>`;
    } else {
      sqPill.innerHTML = `
        <div class="nst-joined-row">
          <div class="nst-left">
            <div class="cp-avatar">${esc((activeSq.name || 'S').charAt(0).toUpperCase())}</div>
            <div class="cp-meta">
              <div class="cp-name">${esc(activeSq.name)}</div>
              <div class="cp-sub">
                <img src="${esc(coinImg)}" alt="" class="cp-mini-coin" />
                <span>${fmtInt(activeSq.totalHold)}</span>
              </div>
            </div>
          </div>
          <div class="cp-badge">
            <img src="${esc(u.league?.trophyImg || '/hold/trophies/bronze.png')}" class="mini-league-cup" alt="" />
            <span>${esc(u.league?.name || 'Bronze')}</span>
          </div>
        </div>
      `;
    }
  }

  // 2. Balance & Wreath Rank + League Row (Exact Screenshot 3)
  const balEl = document.getElementById('uiHoldBalance');
  if (balEl) balEl.textContent = fmtInt(u.holdBalance);

  const rankEl = document.getElementById('uiUserRankText');
  if (rankEl) rankEl.textContent = fmtOrdinal(u.rank || 1);

  const miniCup = document.getElementById('uiMiniLeagueCup');
  if (miniCup && u.league?.trophyImg) miniCup.src = u.league.trophyImg;

  const lgText = document.getElementById('uiLeagueNameText');
  if (lgText) lgText.textContent = u.league?.name || 'Bronze';

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
// SHEET 1: LEAGUES SHOWCASE & 5 3D TROPHY CUPS
// ============================================================================
async function loadLeaderboardData() {
  const res = await api('/api/hold/vault');
  if (res.ok) {
    STATE.totalPlayers = res.totalPlayers || (res.leaderboard || []).length;
    STATE.top10Prizes = res.top10Prizes || [];
    STATE.leaderboard = res.leaderboard || [];
    STATE.leaderboardDay = res.leaderboardDay || res.leaderboard || [];
    renderLeaguesSheet();
  }
}

function renderLeaguesSheet() {
  const u = STATE.user;
  if (!u) return;

  const totalEl = document.getElementById('uiTotalPlayersCount');
  if (totalEl) totalEl.textContent = fmtInt(Math.max(1, STATE.totalPlayers || STATE.leaderboard.length));

  const leagues = u.allLeagues || [];
  if (!leagues.length) return;

  const idx = Math.max(0, Math.min(leagues.length - 1, STATE.viewedLeagueIdx));
  const lg = leagues[idx];
  const nextLg = leagues[idx + 1] || null;

  const sheetEl = document.getElementById('sheetLeagues');
  const glowEl = document.getElementById('uiLeagueTrophyGlow');
  const trophyImgEl = document.getElementById('uiLeagueTrophyImg');

  if (sheetEl && lg.glow) sheetEl.style.setProperty('--league-glow', lg.glow);
  if (glowEl && lg.glow) glowEl.style.background = lg.glow;
  if (trophyImgEl && lg.trophyImg) trophyImgEl.src = lg.trophyImg;

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
    const target = nextLg ? nextLg.minHold : Math.max(5_000_000, u.lifetimeHold);
    const pct = Math.min(100, Math.max(5, Math.round((u.lifetimeHold / Math.max(1, target)) * 100)));
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
      row.style.cursor = 'pointer';
      row.innerHTML = `
        <div class="lb-left">
          <div class="lb-medal-col">${medal}</div>
          <div class="lb-avatar-circle">${esc((sq.name || 'S').charAt(0))}</div>
          <div class="lb-user-meta">
            <div class="lb-user-name">${esc(sq.name)} ${sq.verified ? '✓' : ''}</div>
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

  // Miners Leaderboard (Day vs All Time)
  const players = STATE.leagueTimePeriod === 'day'
    ? (STATE.leaderboardDay?.length ? STATE.leaderboardDay : STATE.leaderboard)
    : (STATE.leaderboard || []);

  players.slice(0, 50).forEach((p) => {
    const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}`;
    const scoreVal = STATE.leagueTimePeriod === 'day' ? (p.dailyHold ?? p.lifetimeHold) : p.lifetimeHold;
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
            <span>${fmtInt(scoreVal)}</span>
          </div>
        </div>
      </div>
      ${p.rank <= 10 && p.prize?.nft ? `<span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;">🎁 ${esc(p.prize.nft.title)}</span>` : ''}
    `;
    listWrap.appendChild(row);
  });
}

// ============================================================================
// SHEET 2: BOOSTS & BUY SKINS
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

  // Permanent Boosters
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

  // Buy Skins List
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
          showToast(res.error || 'Not enough HOLD');
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
    showToast(res.error || 'Limit reached');
  }
}

// ============================================================================
// SHEET 3: EARN MORE COINS (ONBOARDING, SPECIALS, WEB3 WORLD)
// ============================================================================
function renderEarnSheet() {
  const u = STATE.user;
  if (!u) return;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';
  const done = u.tasksCompleted || [];
  const quests = u.quests || [];

  const renderQuestRows = (containerId, list) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    for (const q of list) {
      const isDone = done.includes(q.id);
      const isOpenedLink = !!STATE.openedQuestLinks[q.id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'not-row-item';
      btn.style.opacity = isDone ? '0.5' : '1';
      btn.innerHTML = `
        <div class="nri-icon-box">${esc(q.icon || '⭐')}</div>
        <div class="nri-center">
          <div class="nri-title">${esc(q.title)}</div>
          <div class="nri-sub">
            ${isDone ? 'Completed' : `+${fmtInt(q.reward)} <img src="${esc(coinImg)}" class="inline-c" alt="" />`}
          </div>
        </div>
        ${isDone
          ? `<span class="nri-chevron">✓</span>`
          : (q.link && isOpenedLink
              ? `<span class="skin-pill-btn" style="font-size:11px;padding:5px 10px;">Check</span>`
              : `<span class="nri-chevron">›</span>`
            )
        }
      `;
      if (!isDone) {
        btn.addEventListener('click', async () => {
          if (q.link && !STATE.openedQuestLinks[q.id]) {
            STATE.openedQuestLinks[q.id] = true;
            window.open(q.link, '_blank');
            renderEarnSheet();
            showToast('Kanalga obuna boʻling va "Check" tugmasini bosing!');
            return;
          }
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
            showToast(res.error || 'Task not completed yet');
          }
        });
      }
      el.appendChild(btn);
    }
  };

  renderQuestRows('onboardingTasksList', quests.filter(q => q.cat === 'onboarding'));
  renderQuestRows('specialsTasksList', quests.filter(q => q.cat === 'specials' || !q.cat));
  renderQuestRows('web3TasksList', quests.filter(q => q.cat === 'web3'));

  // Stars VIP Packs inside Earn
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
          showToast(res.error || 'Error');
        }
      });
    });
  }
}

// ============================================================================
// SHEET 4: INVITE FRENS & OFFICIAL PAXTAGRAM SQUADS
// ============================================================================
function renderFrensSheet() {
  const u = STATE.user;
  if (!u) return;

  const refs = u.referrals || [];
  const heroCount = document.getElementById('uiFrensHeroCount');
  if (heroCount) heroCount.textContent = `${refs.length} ${refs.length === 1 ? 'Fren' : 'Frens'}`;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  const frensList = document.getElementById('frensInvitedList');
  if (frensList) {
    if (!refs.length) {
      frensList.innerHTML = `<div style="padding:18px;text-align:center;color:var(--text-2);font-size:13.5px;">No frens invited yet. Share your link to earn +10,000 HOLD!</div>`;
    } else {
      frensList.innerHTML = refs.map(r => `
        <div class="not-row-item">
          <div class="lb-avatar-circle">${esc((r.displayName || r.username || 'F').charAt(0).toUpperCase())}</div>
          <div class="nri-center">
            <div class="nri-title">${esc(r.displayName || r.username)}</div>
            <div class="nri-sub">${esc(r.league || 'Bronze')} · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(r.lifetimeHold)}</div>
          </div>
          <span style="color:#facc15;font-size:13px;font-weight:700;">+10K</span>
        </div>
      `).join('');
    }
  }

  const sList = document.getElementById('squadsList');
  if (sList) {
    sList.innerHTML = '';
    for (const sq of u.squads || []) {
      const joined = u.squadId === sq.id;
      const row = document.createElement('div');
      row.className = 'not-row-item';
      row.innerHTML = `
        <div class="cp-avatar" style="width:44px;height:44px;border-radius:12px;">${esc((sq.name || 'S').charAt(0).toUpperCase())}</div>
        <div class="nri-center">
          <div class="nri-title">${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''}</div>
          <div class="nri-sub">${fmtInt(sq.members)} members · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(sq.totalHold)}</div>
        </div>
        <button type="button" class="skin-pill-btn ${joined ? 'enabled' : ''}">${joined ? 'Joined' : 'Join'}</button>
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
      } else if (sq.link) {
        row.addEventListener('click', () => window.open(sq.link, '_blank'));
      }
      sList.appendChild(row);
    }
  }
}

function openAddPaxtaChannelSquadModal() {
  openModal('Add PaxtaGram Channel Squad', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:13px;color:var(--text-2);line-height:1.45;">
        Rasmiy PaxtaGram kanalingiz <b>@username</b> manzilini kiriting. Bot kanalning PaxtaGramda mavjudligini avtomatik tekshiradi va Squad sifatida qoʻshadi.
      </p>
      <input type="text" id="inpSquadHandle" placeholder="@kanal_nomi" class="apple-search-input" />
      <button type="button" class="btn-sapphire-primary" id="btnVerifyAndJoinSquad">Tekshirish va Qoʻshish</button>
    </div>
  `, (body) => {
    body.querySelector('#btnVerifyAndJoinSquad')?.addEventListener('click', async () => {
      const channelHandle = body.querySelector('#inpSquadHandle')?.value.trim();
      if (!channelHandle) return;
      const res = await api('/api/hold/join-squad', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, channelHandle })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        closeModal();
        renderAll();
        showToast(res.message);
      } else {
        showToast(res.error || 'Kanal topilmadi');
      }
    });
  });
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

// ============================================================================
// COMPREHENSIVE 4-TAB ADMIN STUDIO (MORSE, TASKS, SQUADS, USERS)
// ============================================================================
function openHoldAdminModal() {
  const u = STATE.user;
  if (!u?.isAdmin) return;

  const renderAdminBody = (body) => {
    const curUser = STATE.user;
    const secretMap = curUser.morse?.secretCodesMap || {};
    const quests = curUser.quests || [];
    const squads = curUser.squads || [];

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="not-segmented-tabs">
          <button type="button" class="nseg-btn ${STATE.adminTab === 'morse' ? 'active' : ''}" data-atab="morse">Morze</button>
          <button type="button" class="nseg-btn ${STATE.adminTab === 'tasks' ? 'active' : ''}" data-atab="tasks">Tasks</button>
          <button type="button" class="nseg-btn ${STATE.adminTab === 'squads' ? 'active' : ''}" data-atab="squads">Squads</button>
          <button type="button" class="nseg-btn ${STATE.adminTab === 'users' ? 'active' : ''}" data-atab="users">Users</button>
        </div>

        ${STATE.adminTab === 'morse' ? `
          <div class="dark-group-box" style="padding:12px;gap:10px;">
            <strong style="font-size:13.5px;">Kunlik Morze Soʻzi</strong>
            <input type="text" id="admMorseWord" value="${esc(curUser.morse?.word || 'HOLD')}" placeholder="Masalan: HOLD" class="apple-search-input" />
            <input type="number" id="admMorseReward" value="${curUser.morse?.reward || 25000}" placeholder="Mukofot (HOLD)" class="apple-search-input" />
            <button type="button" class="btn-sapphire-primary" id="btnAdmSaveDailyMorse">Kunlik Morzeni Saqlash</button>
          </div>

          <div class="dark-group-box" style="padding:12px;gap:10px;">
            <strong style="font-size:13.5px;">Yangi Maxfiy Morze Kod Qoʻshish</strong>
            <input type="text" id="admSecCode" placeholder="Maxfiy soʻz (masalan: BONUS)" class="apple-search-input" />
            <input type="number" id="admSecReward" value="25000" placeholder="HOLD mukofoti" class="apple-search-input" />
            <button type="button" class="btn-sapphire-primary" id="btnAdmAddSecret">Maxfiy Kod Qoʻshish</button>
          </div>

          <div class="dark-group-box" style="padding:10px;">
            ${Object.entries(secretMap).map(([code, info]) => `
              <div class="not-row-item" style="padding:6px;">
                <div class="nri-center">
                  <div class="nri-title">${esc(code)}</div>
                  <div class="nri-sub">+${fmtInt(info.reward)} HOLD</div>
                </div>
                <button type="button" class="skin-pill-btn" data-del-secret="${esc(code)}">Oʻchirish</button>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${STATE.adminTab === 'tasks' ? `
          <div class="dark-group-box" style="padding:12px;gap:8px;">
            <strong style="font-size:13.5px;">Yangi Vazifa (Task) Qoʻshish</strong>
            <input type="text" id="admTaskTitle" placeholder="Vazifa nomi (masalan: Join @insider)" class="apple-search-input" />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <select id="admTaskCat" class="apple-search-input">
                <option value="specials">Specials</option>
                <option value="onboarding">Onboarding</option>
                <option value="web3">Web3 world</option>
              </select>
              <input type="text" id="admTaskIcon" value="📢" placeholder="Emoji (📢, ⭐, 🏆)" class="apple-search-input" />
            </div>
            <input type="number" id="admTaskReward" value="15000" placeholder="Mukofot (HOLD)" class="apple-search-input" />
            <input type="text" id="admTaskLink" placeholder="Havola yoki @kanal (ixtiyoriy)" class="apple-search-input" />
            <button type="button" class="btn-sapphire-primary" id="btnAdmAddTask">Vazifani Qoʻshish</button>
          </div>

          <div class="dark-group-box" style="padding:8px;max-height:220px;overflow-y:auto;">
            ${quests.map(q => `
              <div class="not-row-item" style="padding:6px;">
                <div class="nri-center">
                  <div class="nri-title">${esc(q.icon || '⭐')} ${esc(q.title)}</div>
                  <div class="nri-sub">${esc(q.cat)} · +${fmtInt(q.reward)} HOLD</div>
                </div>
                <button type="button" class="skin-pill-btn" data-del-task="${esc(q.id)}">✕</button>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${STATE.adminTab === 'squads' ? `
          <div class="dark-group-box" style="padding:12px;gap:8px;">
            <strong style="font-size:13.5px;">Rasmiy PaxtaGram Kanal Qoʻshish</strong>
            <input type="text" id="admSquadHandle" placeholder="@kanal_username" class="apple-search-input" />
            <input type="text" id="admSquadName" placeholder="Kanal nomi (boʻsh qolsa avtomatik oladi)" class="apple-search-input" />
            <button type="button" class="btn-sapphire-primary" id="btnAdmAddSquad">Tekshirish va Qoʻshish</button>
          </div>

          <div class="dark-group-box" style="padding:8px;">
            ${squads.map(s => `
              <div class="not-row-item" style="padding:6px;">
                <div class="nri-center">
                  <div class="nri-title">${esc(s.name)} ${s.verified ? '✓' : ''}</div>
                  <div class="nri-sub">@${esc(s.handle || s.id)} · ${fmtInt(s.totalHold)} HOLD</div>
                </div>
                <button type="button" class="skin-pill-btn" data-del-squad="${esc(s.id)}">✕</button>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${STATE.adminTab === 'users' ? `
          <div class="dark-group-box" style="padding:12px;gap:8px;">
            <strong style="font-size:13.5px;">Foydalanuvchi Balansi va Test</strong>
            <input type="text" id="admTargetUser" value="${esc(curUser.username)}" placeholder="@username" class="apple-search-input" />
            <input type="number" id="admHoldDelta" value="50000" placeholder="Qoʻshiladigan HOLD miqdori" class="apple-search-input" />
            <button type="button" class="btn-sapphire-primary" id="btnAdmGrantHold">HOLD Qoʻshish</button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
              <button type="button" class="skin-pill-btn" id="btnAdmResetMorse" style="padding:10px;">Morzeni Reset</button>
              <button type="button" class="skin-pill-btn" id="btnAdmResetOnboard" style="padding:10px;">Onboardingni Koʻrish</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Wire Admin Tab Switches
    body.querySelectorAll('[data-atab]').forEach(b => {
      b.addEventListener('click', () => {
        STATE.adminTab = b.dataset.atab;
        renderAdminBody(body);
      });
    });

    // Morse actions
    body.querySelector('#btnAdmSaveDailyMorse')?.addEventListener('click', async () => {
      const morseWord = body.querySelector('#admMorseWord')?.value.trim();
      const morseReward = parseInt(body.querySelector('#admMorseReward')?.value, 10) || 1000000;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'save_morse', morseWord, morseReward })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        showToast(res.message);
      }
    });

    body.querySelector('#btnAdmAddSecret')?.addEventListener('click', async () => {
      const code = body.querySelector('#admSecCode')?.value.trim();
      const reward = parseInt(body.querySelector('#admSecReward')?.value, 10) || 500000;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_secret_code', code, reward })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminBody(body);
        showToast(res.message);
      }
    });

    body.querySelectorAll('[data-del-secret]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_secret_code', code: b.dataset.delSecret })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminBody(body);
        }
      });
    });

    // Task actions
    body.querySelector('#btnAdmAddTask')?.addEventListener('click', async () => {
      const title = body.querySelector('#admTaskTitle')?.value.trim();
      const cat = body.querySelector('#admTaskCat')?.value;
      const icon = body.querySelector('#admTaskIcon')?.value.trim();
      const reward = parseInt(body.querySelector('#admTaskReward')?.value, 10) || 150000;
      const link = body.querySelector('#admTaskLink')?.value.trim();
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_quest', title, cat, icon, reward, link })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminBody(body);
        showToast(res.message);
      }
    });

    body.querySelectorAll('[data-del-task]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_quest', questId: b.dataset.delTask })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminBody(body);
        }
      });
    });

    // Squad actions
    body.querySelector('#btnAdmAddSquad')?.addEventListener('click', async () => {
      const handle = body.querySelector('#admSquadHandle')?.value.trim();
      const name = body.querySelector('#admSquadName')?.value.trim();
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_squad', handle, name })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminBody(body);
        showToast(res.message);
      }
    });

    body.querySelectorAll('[data-del-squad]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_squad', squadId: b.dataset.delSquad })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminBody(body);
        }
      });
    });

    // User actions
    body.querySelector('#btnAdmGrantHold')?.addEventListener('click', async () => {
      const targetUsername = body.querySelector('#admTargetUser')?.value.trim();
      const holdDelta = parseInt(body.querySelector('#admHoldDelta')?.value, 10) || 0;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername, holdDelta })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        showToast(res.message);
      }
    });

    body.querySelector('#btnAdmResetMorse')?.addEventListener('click', async () => {
      const targetUsername = body.querySelector('#admTargetUser')?.value.trim();
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername, resetMorse: true })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        closeModal();
        showToast('Morze reset qilindi!');
      }
    });

    body.querySelector('#btnAdmResetOnboard')?.addEventListener('click', () => {
      closeModal();
      openOnboardingStory(0);
    });
  };

  openModal('Admin Studio', '<div></div>', renderAdminBody);
}

// ============================================================================
// DOMCONTENTLOADED WIRING
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {}

  // Onboarding Continue Button
  document.getElementById('btnOsContinue')?.addEventListener('click', advanceOnboardingStory);
  document.getElementById('btnReplayOnboarding')?.addEventListener('click', () => {
    closeAllSheets();
    openOnboardingStory(0);
  });

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
  document.getElementById('btnAddCustomSquad')?.addEventListener('click', openAddPaxtaChannelSquadModal);

  // Switch to Top-10 NFT tab when clicking Stats pill in Leagues
  document.getElementById('btnSwitchTop10Tab')?.addEventListener('click', () => {
    document.querySelectorAll('#leagueMainTabs .nseg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.ltab === 'prizes');
    });
    STATE.leagueMainTab = 'prizes';
    renderLeaguesSheet();
  });

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
    const curWord = STATE.user?.morse?.word || 'HOLD';
    const morseHint = curWord.split('').map(c => `${c} (${(MORSE_MAP[c] || '').replace(/\./g, '•').replace(/-/g, '—')})`).join(' · ');
    openModal('Full guide', `
      <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;color:var(--text-2);line-height:1.5;">
        <p><b style="color:#fff;">🪙 Havoda Muallaq Morze Shifri:</b> Markazdagi tangani qisqa bosing (<b>•</b>) yoki bosib ushlab turing (<b>—</b>). Birinchi harf toʻgʻri terilishi bilan harflar havoda muallaq paydo boʻladi!</p>
        <p style="background:rgba(255,255,255,0.06);padding:10px;border-radius:12px;color:#fff;font-size:12.5px;">
          Bugungi shifr: <b>${esc(morseHint)}</b>
        </p>
        <p><b style="color:#fff;">🏆 Top-10 NFT:</b> Reytingda Top-10 oʻrinni egallagan ishtirokchilar haqiqiy NFT sovgʻalar va HOLD mukofotlarini qoʻlga kiritadilar.</p>
      </div>
    `);
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

  // Main 3D Coin Pointer Events (100% Reliable Tap + Hold Dash Morse!)
  const coinBtn = document.getElementById('holdCoinBtn');
  if (coinBtn) {
    // Prevent contextmenu on long-press so mobile browsers never cancel the hold!
    coinBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    coinBtn.addEventListener('dragstart', (e) => e.preventDefault());

    coinBtn.addEventListener('pointerdown', (e) => {
      try {
        coinBtn.setPointerCapture(e.pointerId);
      } catch {}
      STATE.pointerDownTime = Date.now();
      haptic('light');

      const rect = coinBtn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.955)`;

      // Haptic & visual pulse right at 195ms so the user feels their press became a Dash (—)!
      clearTimeout(STATE.dashFeedbackTimer);
      STATE.dashFeedbackTimer = setTimeout(() => {
        if (STATE.pointerDownTime > 0) {
          haptic('medium');
          coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.91)`;
        }
      }, 195);
    });

    const finishCoinPress = (e) => {
      clearTimeout(STATE.dashFeedbackTimer);
      coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      if (!STATE.pointerDownTime) return;
      const heldMs = Date.now() - STATE.pointerDownTime;
      STATE.pointerDownTime = 0;

      handleCoinTap(e.clientX, e.clientY);
      recordCoinMorseSignal(heldMs >= 195 ? '-' : '.');
    };

    coinBtn.addEventListener('pointerup', finishCoinPress);
    coinBtn.addEventListener('pointercancel', finishCoinPress);
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
