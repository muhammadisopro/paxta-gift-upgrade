
// ==================== 8-HOUR PASSIVE FARMING ENGINE ====================
let farmTickerInterval = null;

function renderFarmSheet() {
  const u = STATE.user;
  if (!u) return;

  const farm = u.farm || {
    startedAt: Date.now() - 3600_000,
    durationMs: 8 * 3600 * 1000,
    ratePerHour: 300,
    totalFarmReward: 2400,
    currentFarmed: 300,
    elapsedMs: 3600_000,
    remainingMs: 7 * 3600 * 1000,
    canClaim: false,
    refEarnings: 0
  };

  const updateFarmUI = () => {
    const now = Date.now();
    const duration = farm.durationMs || (8 * 3600 * 1000);
    const elapsed = Math.max(0, now - (farm.startedAt || now));
    const ratio = Math.min(1, elapsed / duration);
    const maxReward = farm.totalFarmReward || 2400;
    const currentFarmed = Math.min(maxReward, Math.floor(maxReward * ratio));
    const remainingMs = Math.max(0, duration - elapsed);
    const canClaim = elapsed >= duration;

    const elAmount = document.getElementById('uiFarmLiveAmount');
    const elFill = document.getElementById('uiFarmProgressFill');
    const elTimer = document.getElementById('uiFarmTimerText');
    const elRate = document.getElementById('uiFarmRateText');
    const elBtn = document.getElementById('btnClaimFarm');
    const elBtnLabel = document.getElementById('uiFarmBtnLabel');
    const elDot = document.getElementById('uiDockFarmDot');

    if (elAmount) elAmount.textContent = fmtInt(currentFarmed);
    if (elFill) elFill.style.width = `${Math.min(100, Math.round(ratio * 100))}%`;
    if (elRate) elRate.textContent = `⚡ ${farm.ratePerHour || 300} / soat`;

    if (canClaim) {
      if (elTimer) elTimer.textContent = '✨ Hosil yigʻishga tayyor!';
      if (elBtn) {
        elBtn.disabled = false;
        elBtn.classList.add('ready-claim');
      }
      if (elBtnLabel) elBtnLabel.textContent = `🌾 Claim +${maxReward.toLocaleString()} $HOLD`;
      if (elDot) elDot.hidden = false;
    } else {
      const h = String(Math.floor(remainingMs / 3600_000)).padStart(2, '0');
      const m = String(Math.floor((remainingMs % 3600_000) / 60_000)).padStart(2, '0');
      const s = String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, '0');
      if (elTimer) elTimer.textContent = `⏳ ${h}:${m}:${s} qoldi`;
      if (elBtn) {
        elBtn.disabled = true;
        elBtn.classList.remove('ready-claim');
      }
      if (elBtnLabel) elBtnLabel.textContent = `⏳ Farming in progress... (${h}:${m})`;
      if (elDot) elDot.hidden = true;
    }

    // Referral kickback farm stats
    const refEarnings = farm.refEarnings || 0;
    const elRefAmount = document.getElementById('uiFarmRefAmount');
    const elBtnRef = document.getElementById('btnClaimFarmRef');
    if (elRefAmount) elRefAmount.textContent = `+${refEarnings.toLocaleString()} $HOLD`;
    if (elBtnRef) elBtnRef.disabled = refEarnings <= 0;
  };

  updateFarmUI();
  if (farmTickerInterval) clearInterval(farmTickerInterval);
  farmTickerInterval = setInterval(updateFarmUI, 1000);
}

async function claimFarmYield() {
  const btn = document.getElementById('btnClaimFarm');
  if (btn) btn.disabled = true;
  haptic('medium');
  try {
    const res = await api('/api/hold/farm-claim', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      STATE.user = res.user;
      haptic('heavy');
      renderAll();
      renderFarmSheet();
      showToast(res.message || 'Hosil muvaffaqiyatli olindi!');
    } else {
      showToast(res?.error || 'Hosil hali toʻlmadi');
      renderFarmSheet();
    }
  } catch (err) {
    showToast('Tarmoqda xatolik yuz berdi');
  }
}

async function claimFarmRefYield() {
  const btn = document.getElementById('btnClaimFarmRef');
  if (btn) btn.disabled = true;
  haptic('medium');
  try {
    const res = await api('/api/hold/farm-claim-ref', {
      method: 'POST',
      body: JSON.stringify({ username: STATE.username })
    });
    if (res.ok && res.user) {
      STATE.user = res.user;
      haptic('heavy');
      renderAll();
      renderFarmSheet();
      showToast(res.message || 'Ulush olindi!');
    } else {
      showToast(res?.error || 'Ulush mavjud emas');
    }
  } catch (err) {
    showToast('Tarmoqda xatolik yuz berdi');
  }
}

// ==================== PAWS-STYLE 5-SLIDE IDENTITY STORY ====================
let fpCurrentSlide = 0;

function openFootprintStoryModal() {
  const u = STATE.user || {};
  const fp = u.footprint || {
    claimed: false,
    tierName: 'Pioneer Genesis',
    ageBonus: 25000,
    nftCount: 2,
    nftBonus: 30000,
    communityBonus: 10000,
    totalAirdrop: 65000,
    paxtaId: u.paxtaId || 142
  };

  const slides = [
    {
      icon: '🆔',
      title: 'PaxtaGram Tarixingiz',
      sub: `Siz PaxtaGramga dastlabki toʻlqinda qoʻshilgansiz. Sizning ID raqamingiz: <b>#${fp.paxtaId || 999}</b>!`,
      valLabel: 'Pioneer Maqomi',
      val: `${fp.tierName} (+${fp.ageBonus.toLocaleString()} $HOLD)`
    },
    {
      icon: '💎',
      title: 'NFT & Nufuz Portfeli',
      sub: `Profilingizdagi rasmiy Victory Medal va Desk Kalendarlar aniqlandi (${fp.nftCount} ta)!`,
      valLabel: 'Kolleksiya Nufuzi',
      val: `+${fp.nftBonus.toLocaleString()} $HOLD`
    },
    {
      icon: '🐾',
      title: 'Hamjamiyat Sodiqligi',
      sub: `Siz shunchaki oʻyinchi emassiz. Siz $HOLD oilasining rasmiy va qadrli aʼzosisiz!`,
      valLabel: 'Hamjamiyat Bonusi',
      val: `+${fp.communityBonus.toLocaleString()} $HOLD`
    },
    {
      icon: '🎯',
      title: 'Shaffof Listing & Muddat',
      sub: 'Hech qanday noaniqlik yoʻq! Listing sanasi va barcha mehnatlar mukofoti aniq belgilangan.',
      valLabel: 'Rasmiy Listing Sanasi',
      val: '15 · Dekabr · 2026'
    },
    {
      icon: '🏆',
      title: 'Kafolatlangan Airdrop',
      sub: 'Barcha qadriyatlaringiz yigʻindisi boʻyicha sizga kafolatlangan ulush ajratildi:',
      valLabel: 'Jami Kafolatlangan Ulush',
      val: `+${fp.totalAirdrop.toLocaleString()} $HOLD`
    }
  ];

  fpCurrentSlide = 0;
  const modal = document.getElementById('footprintStoryModal');
  if (!modal) return;
  modal.hidden = false;

  const renderCurrentSlide = () => {
    // Fill story bars
    for (let i = 0; i < 5; i++) {
      const bar = document.getElementById(`fsmFill${i}`);
      if (bar) {
        bar.style.width = i < fpCurrentSlide ? '100%' : (i === fpCurrentSlide ? '100%' : '0%');
      }
    }

    const slideData = slides[fpCurrentSlide];
    const container = document.getElementById('fsmSlidesWrap');
    if (container) {
      container.innerHTML = `
        <div class="fsm-slide">
          <div class="fsm-slide-icon">${slideData.icon}</div>
          <div class="fsm-slide-title">${slideData.title}</div>
          <div class="fsm-slide-sub">${slideData.sub}</div>
          <div class="fsm-stat-box">
            <span class="fsm-stat-label">${slideData.valLabel}</span>
            <span class="fsm-stat-val">${slideData.val}</span>
          </div>
        </div>
      `;
    }

    const nextBtn = document.getElementById('btnFootprintNext');
    if (nextBtn) {
      if (fpCurrentSlide < 4) {
        nextBtn.textContent = 'Davom etish ➔';
      } else {
        if (!fp.claimed) {
          nextBtn.textContent = `🎉 Airdropni Olish (+${fp.totalAirdrop.toLocaleString()} $HOLD)`;
        } else {
          nextBtn.textContent = '🚀 Natijani Telegramda Ulashish';
        }
      }
    }
  };

  renderCurrentSlide();

  const nextBtn = document.getElementById('btnFootprintNext');
  if (nextBtn) {
    nextBtn.onclick = async () => {
      haptic('light');
      if (fpCurrentSlide < 4) {
        fpCurrentSlide++;
        renderCurrentSlide();
      } else {
        if (!fp.claimed) {
          const res = await api('/api/hold/footprint-claim', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.username })
          });
          if (res.ok && res.user) {
            STATE.user = res.user;
            haptic('heavy');
            renderAll();
            showToast(res.message);
            modal.hidden = true;
          }
        } else {
          // Share footprint in Telegram
          const shareText = `🐾 *$HOLD da mening PaxtaGram Raqamli Izim aniqlandi!*\n\nID: #${fp.paxtaId || 999}\nKafolatlangan Airdrop: +${fp.totalAirdrop.toLocaleString()} $HOLD\n\nO'zing ham tekshir: https://paxta.online/u/HOLDbot`;
          try {
            await navigator.clipboard.writeText(shareText);
            showToast('Natijangiz nusxalandi! Doʻstlaringizga yuboring');
          } catch {
            showToast('Natijangiz saqlandi');
          }
          modal.hidden = true;
        }
      }
    };
  }

  document.getElementById('btnCloseFootprintStory').onclick = () => { modal.hidden = true; };
  document.getElementById('fsmBackdrop').onclick = () => { modal.hidden = true; };
}

// ==================== SOLAR ECLIPSE SECRET EASTER EGG ====================
let eclipseCountdownTimer = null;

function triggerSolarEclipseEasterEgg() {
  haptic('heavy');
  setTimeout(() => haptic('heavy'), 180);
  setTimeout(() => haptic('heavy'), 360);

  const coinBtn = document.getElementById('holdCoinBtn');
  if (coinBtn) {
    coinBtn.style.transition = 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
    coinBtn.style.transform = 'rotateY(180deg) scale(1.05)';
  }

  const modal = document.getElementById('eclipseSecretModal');
  if (!modal) return;
  modal.hidden = false;

  const updateCountdown = () => {
    // 15 December 2026, 00:00:00 UTC+5
    const target = new Date('2026-12-15T00:00:00+05:00').getTime();
    const diff = Math.max(0, target - Date.now());

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const elD = document.getElementById('eclipseDays');
    const elH = document.getElementById('eclipseHours');
    const elM = document.getElementById('eclipseMinutes');
    const elS = document.getElementById('eclipseSeconds');

    if (elD) elD.textContent = String(days).padStart(2, '0');
    if (elH) elH.textContent = String(hours).padStart(2, '0');
    if (elM) elM.textContent = String(minutes).padStart(2, '0');
    if (elS) elS.textContent = String(seconds).padStart(2, '0');
  };

  updateCountdown();
  if (eclipseCountdownTimer) clearInterval(eclipseCountdownTimer);
  eclipseCountdownTimer = setInterval(updateCountdown, 1000);

  document.getElementById('btnShareEclipse').onclick = async () => {
    const text = '🌑 *$HOLD ning maxfiy quyosh tutilishi (Solar Eclipse) kodini ochdim!* \n\n📅 Rasmiy listing: 15-Dekabr 2026.\nTangani 3 marta aylantirib o\'zing ham ko\'r: https://paxta.online/u/HOLDbot';
    try {
      await navigator.clipboard.writeText(text);
      showToast('Sirli xabar nusxalandi! Doʻstlaringizga yuboring');
    } catch {
      showToast('15-Dekabr 2026 — Rasmiy Listing!');
    }
  };

  document.getElementById('btnCloseEclipse').onclick = () => {
    modal.hidden = true;
    if (eclipseCountdownTimer) clearInterval(eclipseCountdownTimer);
    if (coinBtn) {
      coinBtn.style.transition = 'transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1)';
      coinBtn.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
  };
}


// ==================== GLOBAL NATIVE SELECTION & CONTEXT MENU SUPPRESSION ====================
// Completely disables "Copy", "Look up", "Share", and long-press callouts across the whole Mini App
window.addEventListener('contextmenu', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { capture: true, passive: false });

document.addEventListener('contextmenu', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
}, { capture: true, passive: false });

document.addEventListener('selectstart', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  e.preventDefault();
  return false;
}, { capture: true, passive: false });

document.addEventListener('dragstart', (e) => {
  e.preventDefault();
  return false;
}, { capture: true, passive: false });

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

// Purge any legacy fake holder_XXX localStorage from earlier versions
(() => {
  const savedUser = localStorage.getItem('hold_username') || '';
  if (/^(holder_|guest_)/i.test(savedUser)) {
    localStorage.removeItem('hold_username');
    localStorage.removeItem('hold_auth_token');
  }
})();

const STATE = {
  user: null,
  authToken: localStorage.getItem('hold_auth_token') || localStorage.getItem('paxta_gift_auth_token') || '',
  username: localStorage.getItem('hold_username') || '',
  webAppInitData: '',
  webAppUser: null,
  totalPlayers: 0,
  top10Prizes: [],
  leaderboard: [],
  leaderboardDay: [],
  openedQuestLinks: {},
  viewedLeagueIdx: 0,
  leagueMainTab: 'miners',
  leagueTimePeriod: 'day',
  onboardingStep: 0,
  adminTab: 'overview',
  adminUsersData: null,
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
  turboActiveUntil: 0,
  invoicePollTimer: null
};

// ---- PaxtaGram Mini App PostMessage & InitData Parser (Zero External Tab Redirects) ----
function notifyPaxtaMiniApp(eventType, eventData = {}) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType, eventData }), '*');
    }
    if (window.TelegramWebviewProxy?.postEvent) {
      window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
    }
  } catch {}
}

function parsePaxtaWebAppData() {
  try {
    // 1. Check standard Telegram.WebApp if populated
    const tg = window.Telegram?.WebApp;
    if (tg?.initData && tg?.initDataUnsafe?.user) {
      STATE.webAppInitData = tg.initData;
      STATE.webAppUser = tg.initDataUnsafe.user;
      return;
    }

    // 2. Check #tgWebAppData in window.location.hash or search (How PaxtaGram Mini Apps pass user data!)
    const rawHash = window.location.hash ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(rawHash);
    const searchParams = new URLSearchParams(window.location.search);
    const tgWebAppData = hashParams.get('tgWebAppData') || searchParams.get('tgWebAppData') || tg?.initData || '';

    if (tgWebAppData) {
      STATE.webAppInitData = tgWebAppData;
      const innerParams = new URLSearchParams(tgWebAppData);
      const userJson = innerParams.get('user');
      if (userJson) {
        STATE.webAppUser = JSON.parse(userJson);
        return;
      }
      try {
        const decoded = decodeURIComponent(tgWebAppData);
        const inner2 = new URLSearchParams(decoded);
        const userJson2 = inner2.get('user');
        if (userJson2) {
          STATE.webAppUser = JSON.parse(userJson2);
          return;
        }
      } catch {}
    }

    // 3. Fallback to shared paxta_gift_user in same-origin localStorage
    const sharedUserRaw = localStorage.getItem('paxta_gift_user');
    if (sharedUserRaw) {
      const parsed = JSON.parse(sharedUserRaw);
      if (parsed?.username && !/^(holder_|guest_)/i.test(parsed.username)) {
        STATE.webAppUser = {
          id: parsed.paxtaId || parsed.id || null,
          username: parsed.username,
          first_name: parsed.displayName || parsed.username
        };
      }
    }
  } catch {}
}

function openInternalPaxtaChannel(linkOrHandle) {
  const raw = String(linkOrHandle || '').trim();
  if (!raw) return;
  const cleanHandle = raw
    .replace(/^https?:\/\/(www\.)?(paxta\.online|t\.me)\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim();

  if (cleanHandle) {
    // Tell PaxtaGram parent frame to navigate internally without opening a new tab
    notifyPaxtaMiniApp('web_app_open_tg_link', { path_full: `/${cleanHandle}` });
    try {
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/${cleanHandle}`);
      }
    } catch {}
  }
}

function haptic(style = 'light') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
  } catch {}
  notifyPaxtaMiniApp('web_app_trigger_haptic_feedback', { type: 'impact', impact_style: style });
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
  if (STATE.invoicePollTimer) {
    clearInterval(STATE.invoicePollTimer);
    STATE.invoicePollTimer = null;
  }
  const bd = document.getElementById('holdModalBackdrop');
  if (bd) bd.hidden = true;
}

function openSheet(sheetName) {
  const map = {
    frens: 'sheetFrens',
    earn: 'sheetEarn',
    boosts: 'sheetBoosts',
    leagues: 'sheetLeagues',
    admin: 'sheetAdmin',
    farm: 'sheetFarm'
  };
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  const targetId = map[sheetName];
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) {
      el.hidden = false;
      document.body.classList.add('sheet-open');
    }
    if (sheetName === 'farm') {
      renderFarmSheet();
    } else if (sheetName === 'leagues') {
      const leagues = STATE.user?.allLeagues || [];
      const curIdx = leagues.findIndex(l => l.id === STATE.user?.league?.id);
      if (curIdx >= 0) STATE.viewedLeagueIdx = curIdx;
      renderLeaguesSheet();
      loadLeaderboardData();
    } else if (sheetName === 'admin') {
      renderAdminSheet();
    }
  }
}

function closeAllSheets() {
  if (farmTickerInterval) {
    clearInterval(farmTickerInterval);
    farmTickerInterval = null;
  }
  document.querySelectorAll('.apple-sheet').forEach(s => { s.hidden = true; });
  document.body.classList.remove('sheet-open');
}

// ---- API Helper ----
function getWebAppInitData() {
  if (STATE.webAppInitData) return STATE.webAppInitData;
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

// ---- Sync User State (Official PaxtaGram Profile Only — Never Fake holder_XXX) ----
async function syncHoldUser() {
  parsePaxtaWebAppData();

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.slice(1) : '');
  const urlAuth = params.get('auth') || hashParams.get('auth');
  const urlRef = params.get('ref') || hashParams.get('ref') || params.get('start') || hashParams.get('tgWebAppStartParam') || '';

  if (urlAuth) {
    STATE.authToken = urlAuth;
    localStorage.setItem('hold_auth_token', urlAuth);
  }

  const tgUser = STATE.webAppUser;
  const candidateUsername = tgUser?.username || STATE.username || '';
  const cleanCandidate = /^(holder_|guest_)/i.test(candidateUsername) ? '' : candidateUsername;
  const displayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')
    : cleanCandidate;
  const paxtaId = tgUser?.id || null;

  const data = await api('/api/hold/sync', {
    method: 'POST',
    body: JSON.stringify({
      username: cleanCandidate,
      displayName,
      paxtaId,
      ref: urlRef ? String(urlRef).replace(/^ref_/i, '') : null
    })
  });

  const loginOverlay = document.getElementById('paxtaLoginOverlay');

  if (data.needPaxtaLogin) {
    if (loginOverlay) loginOverlay.hidden = false;
    return;
  }

  if (loginOverlay) loginOverlay.hidden = true;

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

async function handlePaxtaLoginSubmit() {
  const inp = document.getElementById('inpPaxtaLoginUsername');
  const errEl = document.getElementById('paxtaLoginError');
  const btn = document.getElementById('btnPaxtaLoginSubmit');
  const raw = (inp?.value || '').trim().replace(/^@/, '');
  if (!raw) {
    if (errEl) {
      errEl.textContent = 'Iltimos, PaxtaGram @username kiriting';
      errEl.hidden = false;
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Tekshirilmoqda...';
  }
  if (errEl) errEl.hidden = true;

  const params = new URLSearchParams(window.location.search);
  const urlRef = params.get('ref') || params.get('start') || '';

  const res = await api('/api/hold/login-paxta', {
    method: 'POST',
    body: JSON.stringify({
      username: raw,
      ref: urlRef ? String(urlRef).replace(/^ref_/i, '') : null
    })
  });

  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Davom etish';
  }

  if (res.ok && res.user) {
    STATE.user = res.user;
    STATE.username = res.user.username;
    localStorage.setItem('hold_username', STATE.username);
    if (res.authToken) {
      STATE.authToken = res.authToken;
      localStorage.setItem('hold_auth_token', res.authToken);
    }
    const loginOverlay = document.getElementById('paxtaLoginOverlay');
    if (loginOverlay) loginOverlay.hidden = true;
    renderAll();
    loadLeaderboardData();
    if (!res.user.ogBonusClaimed) {
      openOnboardingStory(0);
    }
  } else {
    if (errEl) {
      errEl.textContent = res.error || 'PaxtaGram profil topilmadi';
      errEl.hidden = false;
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
    foot.innerHTML = `Account <b>@${esc(u.username)}</b> (#${pid}).<br/>You're in the Top ${topPct}% PaxtaGram users 🔥`;
    btn.textContent = 'Continue';
  } else if (step === 1) {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>PaxtaGram Verified</h1>
        <p>Official profile connected</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="Verified" />
        <div class="os-giant-label" style="margin-top:20px;">@${esc(u.username)}</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Official PaxtaGram identity confirmed for <b>${esc(u.displayName || u.username)}</b> ✨`;
    btn.textContent = 'Continue';
  } else {
    wrap.innerHTML = `
      <div class="os-top-headings">
        <h1>You are amazing!</h1>
        <p>Here is your HOLD welcome reward</p>
      </div>
      <div class="os-center-hero">
        <img src="/hold/skins/skin-4.png" class="os-emblem-img" alt="HOLD" />
        <div class="os-giant-label" style="font-size:38px;margin-top:18px;">+${fmtInt(u.ogDetails?.totalBonus || totalReward)}</div>
      </div>
      <div></div>
    `;
    foot.innerHTML = `Welcome to the official $HOLD Arena 🤝`;
    btn.textContent = 'Start Mining $HOLD';
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
      loadLeaderboardData();
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

  const allWords = getCandidateMorseWords();
  const activePool = STATE.morseDecodedLetters.length > 0 ? STATE.morseMatchedWords : allWords;
  const nextIdx = STATE.morseDecodedLetters.length;
  const expectedNextChars = Array.from(new Set(activePool.map(w => w[nextIdx]).filter(Boolean)));
  const expectedMorseCodes = expectedNextChars.map(ch => MORSE_MAP[ch]).filter(Boolean);

  const exactMatchNow = expectedMorseCodes.includes(STATE.morseSignal);
  const canGrowIntoAnotherExpected = expectedMorseCodes.some(
    code => code.length > STATE.morseSignal.length && code.startsWith(STATE.morseSignal)
  );

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
  if (!decodedChar) return;

  const allWords = getCandidateMorseWords();

  if (STATE.morseDecodedLetters.length === 0) {
    const matching = allWords.filter(w => w.startsWith(decodedChar));
    if (matching.length === 0) return;
    STATE.morseDecodedLetters = [decodedChar];
    STATE.morseMatchedWords = matching;
    haptic('heavy');
    renderMidAirFloatingLetters(false);

    clearTimeout(STATE.morseClearAirTimer);
    STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
    return;
  }

  const nextPrefix = STATE.morseDecodedLetters.join('') + decodedChar;
  const stillMatching = STATE.morseMatchedWords.filter(w => w.startsWith(nextPrefix));

  if (stillMatching.length === 0) {
    if (sig === '.') {
      clearTimeout(STATE.morseClearAirTimer);
      STATE.morseClearAirTimer = setTimeout(clearMidAirMorse, 8000);
      return;
    }
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

  // 1. Top Squad Pill
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

  // 2. Balance & Wreath Rank + League Row
  const balEl = document.getElementById('uiHoldBalance');
  if (balEl) balEl.textContent = fmtInt(u.holdBalance);

  // Footprint status bar
  const fpBadge = document.getElementById('uiFootprintBadge');
  if (fpBadge && u.footprint) {
    fpBadge.hidden = !u.footprint.claimed;
  }

  // Live farm indicator dot on bottom dock
  const dockFarmDot = document.getElementById('uiDockFarmDot');
  if (dockFarmDot && u.farm) {
    dockFarmDot.hidden = !u.farm.canClaim;
  }

  const rankEl = document.getElementById('uiUserRankText');
  if (rankEl) rankEl.textContent = fmtOrdinal(u.rank || 1);

  const miniCup = document.getElementById('uiMiniLeagueCup');
  if (miniCup && u.league?.trophyImg) miniCup.src = u.league.trophyImg;

  const lgText = document.getElementById('uiLeagueNameText');
  if (lgText) lgText.textContent = u.league?.name || 'Bronze';

  const starsEl = document.getElementById('uiStars');
  if (starsEl) starsEl.textContent = fmtInt(u.stars);

  // 2b. Arena Live Pills (Daily Streak & 2x Happy Hour)
  const streakPill = document.getElementById('btnArenaStreakPill');
  const streakText = document.getElementById('uiArenaStreakText');
  if (streakPill && streakText && u.streak) {
    const canClaim = u.streak.canClaimToday;
    streakPill.classList.toggle('ready', !!canClaim);
    streakText.textContent = canClaim
      ? `Day ${u.streak.nextDay} Bonus!`
      : `Day ${u.streak.currentDay || 1} Streak`;
  }

  const hhPill = document.getElementById('uiArenaHappyHourPill');
  if (hhPill) {
    hhPill.hidden = !u.happyHour?.active;
  }

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
  const hhMult = u.happyHour?.active ? 2 : 1;
  const tapVal = (isTurbo ? u.tapPower * 7 : u.tapPower) * hhMult;

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
// SHEET 1: LEAGUES SHOWCASE & 5 3D TROPHY CUPS (PER-LEAGUE FILTERED!)
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
    if (lg.id === u.league?.id) {
      const target = nextLg ? nextLg.minHold : Math.max(10_000_000, u.lifetimeHold);
      const pct = Math.min(100, Math.max(4, Math.round((u.lifetimeHold / Math.max(1, target)) * 100)));
      barEl.style.width = `${pct}%`;
    } else if (u.lifetimeHold >= lg.minHold) {
      barEl.style.width = '100%';
    } else {
      const pct = Math.min(100, Math.max(2, Math.round((u.lifetimeHold / Math.max(1, lg.minHold)) * 100)));
      barEl.style.width = `${pct}%`;
    }
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
              <span>${fmtInt(sq.totalHold)} · ${fmtInt(sq.members || 0)} a'zo</span>
            </div>
          </div>
        </div>
        ${rank === 1 ? `<span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;color:#facc15;">⚔️ #1 Squad</span>` : `<span class="nri-chevron">›</span>`}
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
              <span>· ${holder ? `@${esc(holder.username)}` : 'Boʻsh oʻrin'}</span>
            </div>
          </div>
        </div>
      `;
      listWrap.appendChild(row);
    }
    return;
  }

  // Miners Leaderboard — STRICTLY FILTERED BY VIEWED LEAGUE (`lg.id`)
  // When a user advances to Silver/Gold/Platinum/Diamond, they no longer appear in Bronze!
  const sourceList = STATE.leagueTimePeriod === 'day'
    ? (STATE.leaderboardDay?.length ? STATE.leaderboardDay : STATE.leaderboard)
    : (STATE.leaderboard || []);

  const leaguePlayers = sourceList.filter(p => (p.league?.id || 'bronze') === lg.id);

  if (!leaguePlayers.length) {
    listWrap.innerHTML = `
      <div style="padding:26px 14px;text-align:center;color:var(--text-2);font-size:13.5px;">
        Hozircha <b>${esc(lg.name)}</b> ligasida ishtirokchilar yoʻq.<br/>
        <span style="font-size:12px;opacity:0.75;">Kerakli chegara: ${fmtInt(lg.minHold)} HOLD</span>
      </div>
    `;
    return;
  }

  leaguePlayers.slice(0, 50).forEach((p, idxInLeague) => {
    const pos = idxInLeague + 1;
    const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}`;
    const scoreVal = STATE.leagueTimePeriod === 'day' ? (p.dailyHold ?? p.lifetimeHold) : p.lifetimeHold;
    const isMe = p.username === u.username;
    const row = document.createElement('div');
    row.className = 'lb-row-item';
    if (isMe) row.style.background = 'rgba(56, 182, 255, 0.10)';
    row.style.borderRadius = '12px';
    row.innerHTML = `
      <div class="lb-left">
        <div class="lb-medal-col">${medal}</div>
        <div class="lb-avatar-circle">${esc((p.displayName || p.username || 'U').charAt(0).toUpperCase())}</div>
        <div class="lb-user-meta">
          <div class="lb-user-name">${esc(p.displayName || p.username)} <span style="opacity:0.55;font-size:12px;">@${esc(p.username)}</span></div>
          <div class="lb-user-score">
            <img src="${esc(coinImg)}" class="inline-c" alt="" />
            <span>${fmtInt(scoreVal)}</span>
          </div>
        </div>
      </div>
      ${p.rank <= 10 && p.prize?.nft ? `<span class="skin-pill-btn" style="font-size:11px;padding:4px 9px;">🎁 #${p.rank} ${esc(p.prize.nft.title)}</span>` : ''}
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
// SHEET 3: EARN MORE COINS (5 RETENTION FEATURES + 100% IN-APP VERIFICATION)
// ============================================================================
function renderEarnSheet() {
  const u = STATE.user;
  if (!u) return;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';
  const done = u.tasksCompleted || [];
  const quests = u.quests || [];

  const lockedByLeague = (q) => {
    if (!q.minLeague) return false;
    const order = (u.allLeagues || []).map(l => l.id);
    const need = order.indexOf(q.minLeague);
    const mine = order.indexOf(u.league?.id || 'bronze');
    return need > -1 && mine < need;
  };

  const rowHtml = ({ icon, title, sub, subClass = '', right = '›', done: isDone = false }) => `
    <div class="nri-icon-box">${icon}</div>
    <div class="nri-center">
      <div class="nri-title">${title}</div>
      <div class="nri-sub ${subClass}">${sub}</div>
    </div>
    <span class="nri-chevron ${isDone ? 'done' : ''}">${right}</span>
  `;

  const coinTag = `<img src="${esc(coinImg)}" class="inline-c" alt="" />`;

  // Invite card coin follows active skin
  const invCoin = document.getElementById('uiEarnInviteCoin');
  if (invCoin) invCoin.src = coinImg;

  // 1. Daily section: Streak · Happy Hour · Weekly Lucky Draw (Morse stays 100% hidden)
  const dailyEl = document.getElementById('dailyTasksList');
  if (dailyEl) {
    dailyEl.innerHTML = '';
    const st = u.streak || {};
    const hh = u.happyHour || {};
    const lt = u.luckyDraw || {};

    const streakBtn = document.createElement('button');
    streakBtn.type = 'button';
    streakBtn.className = 'not-row-item';
    streakBtn.innerHTML = rowHtml({
      icon: '🔥',
      title: 'Daily reward',
      sub: st.canClaimToday
        ? `<b>+${fmtInt(st.nextRewardHold || 1000)}</b> ${coinTag} · Day ${st.nextDay || 1}/7`
        : `Day ${st.currentDay || 0}/7 · come back tomorrow`,
      right: st.canClaimToday ? '<span class="earn-claim-dot"></span>›' : '✓',
      done: !st.canClaimToday
    });
    streakBtn.addEventListener('click', openDailyStreakModal);
    dailyEl.appendChild(streakBtn);

    const hhRow = document.createElement('div');
    hhRow.className = 'not-row-item static';
    hhRow.innerHTML = rowHtml({
      icon: '⚡',
      title: 'Happy Hour',
      sub: hh.active ? '<b style="color:#4ade80;">Live now · 2x per tap</b>' : `2x per tap · ${esc(hh.scheduleText || '20:00 – 21:00')}`,
      right: hh.active ? '<span class="earn-live-badge">LIVE</span>' : ''
    });
    dailyEl.appendChild(hhRow);

    const ltRow = document.createElement('div');
    ltRow.className = 'not-row-item static';
    ltRow.innerHTML = rowHtml({
      icon: '🎟️',
      title: 'Weekly Lucky Draw',
      sub: `${esc(lt.prizeTitle || 'NFT + 100K HOLD')}`,
      right: `<span class="earn-count-badge">${fmtInt(lt.myTickets || 0)}</span>`
    });
    dailyEl.appendChild(ltRow);
  }

  // 2. Quests — Notcoin-style rows, verified in-app (no external tabs)
  const renderQuestRows = (containerId, list) => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = `<div class="earn-empty">New tasks coming soon</div>`;
      return;
    }
    // Pending first, completed last
    const sorted = [...list].sort((a, b) => Number(done.includes(a.id)) - Number(done.includes(b.id)));
    for (const q of sorted) {
      const isDone = done.includes(q.id);
      const isLocked = !isDone && lockedByLeague(q);
      const lockLeagueName = isLocked ? ((u.allLeagues || []).find(l => l.id === q.minLeague)?.name || 'Silver') : '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `not-row-item${isDone ? ' is-done' : ''}`;
      btn.innerHTML = rowHtml({
        icon: esc(q.icon || '⭐'),
        title: esc(q.title),
        sub: isDone
          ? 'Completed'
          : isLocked
            ? `🔒 ${esc(lockLeagueName)} league`
            : `<b>+${fmtInt(q.reward)}</b> ${coinTag}`,
        subClass: isLocked ? 'gold-lock' : '',
        right: isDone ? '✓' : '›',
        done: isDone
      });
      if (!isDone) {
        btn.addEventListener('click', () => {
          if (isLocked) {
            showToast(`${lockLeagueName} ligasiga chiqing`);
            return;
          }
          openQuestVerificationModal(q);
        });
      }
      el.appendChild(btn);
    }
  };

  const web3List = quests.filter(q => q.cat === 'web3');
  renderQuestRows('onboardingTasksList', quests.filter(q => q.cat === 'onboarding'));
  renderQuestRows('specialsTasksList', quests.filter(q => q.cat === 'specials' || !q.cat));
  renderQuestRows('web3TasksList', web3List);

  const web3Count = document.getElementById('uiWeb3Count');
  if (web3Count) web3Count.textContent = `${web3List.filter(q => done.includes(q.id)).length}/${web3List.length}`;

  // 4. Stars VIP Packs inside Earn
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
        if (!packObj) return;

        haptic('light');
        showToast('Toʻlov oynasi ochilmoqda...');
        const res = await api('/api/hold/create-invoice', {
          method: 'POST',
          body: JSON.stringify({
            username: STATE.username,
            amount: packObj.starsPrice,
            title: packObj.name
          })
        });

        if (res.ok && res.invoiceUrl) {
          const slug = res.slug || String(res.invoiceUrl).split('/').pop();
          notifyPaxtaMiniApp('web_app_open_invoice', { slug, url: res.invoiceUrl });
          try {
            if (window.Telegram?.WebApp?.openInvoice) {
              window.Telegram.WebApp.openInvoice(res.invoiceUrl, async (st) => {
                if (st === 'paid') {
                  await syncHoldUser();
                  showToast(`🎉 ${packObj.name} muvaffaqiyatli faollashtirildi!`);
                }
              });
            }
          } catch {}

          if (res.invoiceId) {
            if (STATE.invoicePollTimer) clearInterval(STATE.invoicePollTimer);
            STATE.invoicePollTimer = setInterval(async () => {
              const stRes = await api(`/api/hold/invoice-status/${encodeURIComponent(res.invoiceId)}`);
              if (stRes.ok && stRes.status === 'paid') {
                clearInterval(STATE.invoicePollTimer);
                STATE.invoicePollTimer = null;
                await syncHoldUser();
                showToast(`🎉 ${packObj.name} muvaffaqiyatli faollashtirildi!`);
              }
            }, 2000);
          }
        } else {
          showToast(res.error || 'Invoice ochilmadi');
        }
      });
    });
  }
}

function openDailyStreakModal() {
  const u = STATE.user;
  if (!u) return;
  const st = u.streak || {};
  const rewards = st.rewards?.length ? st.rewards : [1000, 2500, 5000, 10000, 15000, 25000, 50000].map((hold, i) => ({ day: i + 1, hold }));
  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  openModal('Daily reward', `
    <div class="streak-modal">
      <p class="streak-modal-sub">Har kuni kiring — zanjir uzilmasa mukofot oʻsib boradi. 7-kun: Cookie skin.</p>
      <div class="streak-days-grid">
        ${rewards.map(r => {
          const isClaimed = st.canClaimToday ? r.day < (st.nextDay || 1) : r.day <= (st.currentDay || 0);
          const isToday = st.canClaimToday && r.day === (st.nextDay || 1);
          const val = r.hold >= 1000 ? `${Math.round(r.hold / 1000)}K` : fmtInt(r.hold);
          return `
            <div class="streak-day-cell ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''}">
              <span class="streak-day-num">Day ${r.day}</span>
              <img src="${esc(coinImg)}" class="streak-day-coin" alt="" />
              <span class="streak-day-val">${isClaimed ? '✓' : val}</span>
            </div>
          `;
        }).join('')}
      </div>
      <button type="button" class="btn-sapphire-primary" id="btnClaimDailyStreak" ${st.canClaimToday ? '' : 'disabled'}>
        ${st.canClaimToday ? `Claim +${fmtInt(st.nextRewardHold || rewards[0].hold)}` : 'Come back tomorrow'}
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnClaimDailyStreak')?.addEventListener('click', async () => {
      await claimDailyStreakBonus();
      closeModal();
    });
  });
}

async function claimDailyStreakBonus() {
  const res = await api('/api/hold/claim-streak', {
    method: 'POST',
    body: JSON.stringify({ username: STATE.username })
  });
  if (res.ok && res.user) {
    STATE.user = res.user;
    haptic('heavy');
    renderAll();
    showToast(res.message || '🔥 Kunlik bonus olindi!');
  } else {
    showToast(res.error || 'Bugungi bonus olingan');
  }
}

// ---- 100% Verified In-App Task Modal (Zero External Tab Redirect!) ----
function openQuestVerificationModal(q) {
  const cleanHandle = String(q.link || '')
    .replace(/^https?:\/\/(www\.)?(paxta\.online|t\.me)\//i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0]
    .trim();

  openModal(q.title, `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="dark-group-box" style="padding:14px;text-align:center;gap:6px;">
        <div style="font-size:34px;">${esc(q.icon || '📢')}</div>
        <div style="font-size:16px;font-weight:700;color:#fff;">${esc(q.title)}</div>
        <div style="font-size:13.5px;color:var(--theme-accent);font-weight:700;">Mukofot: +${fmtInt(q.reward)} HOLD</div>
      </div>

      ${cleanHandle ? `
        <p style="font-size:13px;color:var(--text-2);line-height:1.45;text-align:center;">
          1. Quyidagi tugma orqali PaxtaGram ichida <b>@${esc(cleanHandle)}</b> kanaliga oʻting yoki nomini nusxalab obuna boʻling.<br/>
          2. Soʻng <b>"Tekshirish va Olish"</b> tugmasini bosing (bot aʼzolikni 100% tekshiradi).
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="skin-pill-btn" id="btnInternalOpenQuest" style="padding:12px;font-size:13px;">
            📢 @${esc(cleanHandle)} ochish
          </button>
          <button type="button" class="skin-pill-btn" id="btnCopyQuestHandle" style="padding:12px;font-size:13px;">
            📋 @${esc(cleanHandle)} nusxalash
          </button>
        </div>
      ` : `
        <p style="font-size:13px;color:var(--text-2);line-height:1.45;text-align:center;">
          Ushbu vazifa shartini bajargan boʻlsangiz, quyidagi tekshirish tugmasini bosing.
        </p>
      `}

      <button type="button" class="btn-sapphire-primary" id="btnVerifyQuestNow">
        ${cleanHandle ? '1. Avval kanalni oching' : 'Tekshirish va Olish'}
      </button>
    </div>
  `, (body) => {
    const verifyBtn = body.querySelector('#btnVerifyQuestNow');
    let started = !!STATE.openedQuestLinks[q.id] || !cleanHandle;

    const triggerStartQuest = async () => {
      STATE.openedQuestLinks[q.id] = Date.now();
      started = true;
      await api('/api/hold/start-quest', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, questId: q.id })
      });
      if (verifyBtn) {
        let sec = 4;
        verifyBtn.disabled = true;
        verifyBtn.textContent = `Tekshirish (${sec}s)...`;
        const iv = setInterval(() => {
          sec--;
          if (sec <= 0) {
            clearInterval(iv);
            verifyBtn.disabled = false;
            verifyBtn.textContent = '✅ Tekshirish va Olish';
          } else {
            verifyBtn.textContent = `Tekshirish (${sec}s)...`;
          }
        }, 1000);
      }
    };

    body.querySelector('#btnInternalOpenQuest')?.addEventListener('click', async () => {
      await triggerStartQuest();
      openInternalPaxtaChannel(cleanHandle);
      showToast(`@${cleanHandle} PaxtaGram ichida ochildi!`);
    });

    body.querySelector('#btnCopyQuestHandle')?.addEventListener('click', async () => {
      await triggerStartQuest();
      try {
        await navigator.clipboard.writeText(`@${cleanHandle}`);
      } catch {}
      showToast(`@${cleanHandle} nusxalandi!`);
    });

    verifyBtn?.addEventListener('click', async () => {
      if (!started && cleanHandle) {
        await triggerStartQuest();
        openInternalPaxtaChannel(cleanHandle);
        return;
      }
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Tekshirilmoqda...';
      const res = await api('/api/hold/claim-quest', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, questId: q.id })
      });
      verifyBtn.disabled = false;
      verifyBtn.textContent = '✅ Tekshirish va Olish';

      if (res.ok && res.user) {
        STATE.user = res.user;
        haptic('heavy');
        closeModal();
        renderAll();
        showToast(`🎉 +${fmtInt(res.reward)} HOLD qoʻshildi!`);
      } else {
        showToast(res.error || 'Shart hali bajarilmagan');
      }
    });
  });
}

// ============================================================================
// SHEET 4: INVITE FRENS & OFFICIAL PAXTAGRAM SQUADS (100% IN-APP, NO NEW TAB)
// ============================================================================
function renderFrensSheet() {
  const u = STATE.user;
  if (!u) return;

  const refs = u.referrals || [];
  const heroCount = document.getElementById('uiFrensHeroCount');
  if (heroCount) heroCount.textContent = `${refs.length} ${refs.length === 1 ? 'Fren' : 'Frens'}`;

  const coinImg = (u.allSkins || []).find(s => s.id === u.skin)?.img || '/hold/skins/skin-4.png';

  // In-app referral claim box (so users never need to open an external browser tab!)
  const refClaimBox = document.getElementById('inAppRefClaimBox');
  if (refClaimBox) {
    if (u.referredBy) {
      refClaimBox.innerHTML = `
        <div style="font-size:13px;color:var(--text-2);display:flex;align-items:center;justify-content:space-between;">
          <span>Sizni taklif qilgan doʻstingiz:</span>
          <b style="color:var(--theme-accent);">@${esc(u.referredBy)} ✓</b>
        </div>
      `;
    } else {
      refClaimBox.innerHTML = `
        <div style="font-size:13px;font-weight:600;color:#fff;">Doʻstingiz taklif qildimi? (+5,000 HOLD)</div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="inpInviterUsername" placeholder="Doʻstingiz @username" class="apple-search-input" style="padding:9px 12px;" />
          <button type="button" class="skin-pill-btn" id="btnClaimRefCode" style="padding:0 16px;">Olish</button>
        </div>
      `;
      refClaimBox.querySelector('#btnClaimRefCode')?.addEventListener('click', async () => {
        const refVal = refClaimBox.querySelector('#inpInviterUsername')?.value.trim();
        if (!refVal) return;
        const res = await api('/api/hold/claim-ref', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, refUsername: refVal, friendUsername: refVal })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          haptic('heavy');
          renderAll();
          showToast(res.message);
        } else {
          showToast(res.error || 'Topilmadi');
        }
      });
    }
  }

  const frensList = document.getElementById('frensInvitedList');
  if (frensList) {
    if (!refs.length) {
      frensList.innerHTML = `
        <div style="padding:18px;text-align:center;color:var(--text-2);font-size:13.5px;">
          Hozircha doʻstlar yoʻq. Doʻstingizga @HOLDbot ga <b>/start ${esc(u.username)}</b> yozishini ayting va <b>+10,000 HOLD</b> oling!
        </div>
      `;
    } else {
      frensList.innerHTML = refs.map(r => `
        <div class="not-row-item">
          <div class="lb-avatar-circle">${esc((r.displayName || r.username || 'F').charAt(0).toUpperCase())}</div>
          <div class="nri-center">
            <div class="nri-title">${esc(r.displayName || r.username)} <span style="opacity:0.55;font-size:12px;">@${esc(r.username)}</span></div>
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
    (u.squads || []).forEach((sq, idx) => {
      const joined = u.squadId === sq.id;
      const row = document.createElement('div');
      row.className = 'not-row-item';
      row.innerHTML = `
        <div class="cp-avatar" style="width:44px;height:44px;border-radius:12px;">${esc((sq.name || 'S').charAt(0).toUpperCase())}</div>
        <div class="nri-center">
          <div class="nri-title">${idx === 0 ? '👑 ' : ''}${esc(sq.name)} ${sq.verified ? '<span style="color:#38b6ff;">✓</span>' : ''}</div>
          <div class="nri-sub">${fmtInt(sq.members)} a'zo · <img src="${esc(coinImg)}" class="inline-c" alt="" /> ${fmtInt(sq.totalHold)}</div>
        </div>
        <button type="button" class="skin-pill-btn ${joined ? 'enabled' : ''}">${joined ? 'Joined' : 'Join'}</button>
      `;
      row.addEventListener('click', async () => {
        if (!joined) {
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
        } else {
          openModal(sq.name, `
            <div style="display:flex;flex-direction:column;gap:12px;text-align:center;">
              <div style="font-size:14px;color:var(--text-2);">
                Rasmiy Squad: <b>@${esc(sq.handle || sq.id)}</b> · Jami: <b>${fmtInt(sq.totalHold)} HOLD</b>
              </div>
              <button type="button" class="btn-sapphire-primary" id="btnOpenSquadInternal">PaxtaGram ichida kanalga oʻtish</button>
            </div>
          `, (b) => {
            b.querySelector('#btnOpenSquadInternal')?.addEventListener('click', () => {
              openInternalPaxtaChannel(sq.handle || sq.link || sq.id);
              closeModal();
            });
          });
        }
      });
      sList.appendChild(row);
    });
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

// ---- Top Up Stars via @HOLDbot Invoice (100% In-App — Never Opens New Tab!) ----
function openTopUpStarsModal(defaultAmount = 250, reason = 'HOLD Boost') {
  openModal('Top Up Stars', `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[100, 250, 500, 1000, 2500, 5000].map(amt => `
          <button type="button" class="skin-pill-btn" data-preset="${amt}" style="padding:10px;">⭐ ${amt}</button>
        `).join('')}
      </div>
      <input type="number" id="inpStarsAmount" value="${defaultAmount}" min="10" max="100000" class="apple-search-input" />
      <div id="starsInvoiceStatusBox" hidden style="padding:10px;border-radius:12px;background:rgba(56,182,255,0.12);color:#e0f2fe;font-size:13px;text-align:center;"></div>
      <button type="button" class="btn-sapphire-primary" id="btnPayStarsInvoice">Pay with Stars</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpStarsAmount');
    const statusBox = body.querySelector('#starsInvoiceStatusBox');
    const payBtn = body.querySelector('#btnPayStarsInvoice');

    body.querySelectorAll('[data-preset]').forEach(b => {
      b.addEventListener('click', () => { if (inp) inp.value = b.dataset.preset; });
    });

    payBtn?.addEventListener('click', async () => {
      const amount = Math.max(1, parseInt(inp?.value, 10) || defaultAmount);
      payBtn.disabled = true;
      payBtn.textContent = 'Invoice yaratilmoqda...';

      const res = await api('/api/hold/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, amount, title: reason })
      });

      payBtn.disabled = false;
      payBtn.textContent = 'Pay with Stars';

      if (res.ok && res.invoiceUrl) {
        const slug = res.slug || String(res.invoiceUrl).split('/').pop();
        // Trigger PaxtaGram in-app invoice sheet via postMessage (Zero external tab!)
        notifyPaxtaMiniApp('web_app_open_invoice', { slug, url: res.invoiceUrl });
        try {
          if (window.Telegram?.WebApp?.openInvoice) {
            window.Telegram.WebApp.openInvoice(res.invoiceUrl, async (st) => {
              if (st === 'paid') {
                await syncHoldUser();
                closeModal();
                showToast(`🎉 +${amount} Stars qoʻshildi!`);
              }
            });
          }
        } catch {}

        if (statusBox) {
          statusBox.hidden = false;
          statusBox.innerHTML = `⏳ Toʻlov oynasi ochildi (<b>${amount} ⭐</b>). Tasdiqlashingiz bilan avtomatik tushadi...`;
        }

        if (res.invoiceId) {
          if (STATE.invoicePollTimer) clearInterval(STATE.invoicePollTimer);
          STATE.invoicePollTimer = setInterval(async () => {
            const stRes = await api(`/api/hold/invoice-status/${encodeURIComponent(res.invoiceId)}`);
            if (stRes.ok && stRes.status === 'paid') {
              clearInterval(STATE.invoicePollTimer);
              STATE.invoicePollTimer = null;
              await syncHoldUser();
              closeModal();
              showToast(`🎉 +${amount} Stars hisobingizga qoʻshildi!`);
            }
          }, 2000);
        }
      } else {
        showToast(res.error || 'Invoice xatosi');
      }
    });
  });
}

// ============================================================================
// SHEET 5: DEDICATED FULL-SCREEN ADMIN STUDIO (`#sheetAdmin` — NOT A POPUP!)
// ============================================================================
async function loadAdminUsersData() {
  const res = await api(`/api/hold/admin-users?username=${encodeURIComponent(STATE.username)}`);
  if (res.ok) {
    STATE.adminUsersData = res;
  }
}

async function renderAdminSheet() {
  const u = STATE.user;
  if (!u?.isAdmin) return;

  const container = document.getElementById('adminSheetBody');
  if (!container) return;

  await loadAdminUsersData();
  const adm = STATE.adminUsersData || {};
  const usersList = adm.users || [];
  const stats = adm.stats || {};
  const curUser = STATE.user;
  const secretMap = curUser.morse?.secretCodesMap || {};
  const quests = curUser.quests || [];
  const squads = curUser.squads || [];

  if (STATE.adminTab === 'overview') {
    container.innerHTML = `
      <div class="admin-stat-grid">
        <div class="admin-stat-card">
          <span>Rasmiy Ishtirokchilar</span>
          <strong>${fmtInt(stats.totalPlayers || usersList.length)}</strong>
        </div>
        <div class="admin-stat-card">
          <span>Jami Muomaladagi HOLD</span>
          <strong>${fmtInt(stats.totalHoldInCirculation || 0)}</strong>
        </div>
        <div class="admin-stat-card">
          <span>2x Happy Hour Holati</span>
          <strong style="color:${stats.happyHourActive ? '#4ade80' : '#facc15'};">${stats.happyHourActive ? 'YOQILGAN (2X)' : 'Jadval (20:00)'}</strong>
        </div>
        <div class="admin-stat-card">
          <span>Lucky Ticket Gʻolibi</span>
          <strong style="font-size:15px;">${stats.lastLuckyWinner ? `@${esc(stats.lastLuckyWinner.username)}` : 'Oʻynalmagan'}</strong>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14.5px;">⚡ Tezkor Boshqaruv va Eventlar</strong>
        <button type="button" class="btn-sapphire-primary" id="btnAdmToggleHH">
          ${stats.happyHourForceEnabled ? '🛑 2x Happy Hour Oʻchirish' : '⚡ 2x Happy Hour Yoqish (Barchaga)'}
        </button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="skin-pill-btn" id="btnAdmRewardSquad" style="padding:12px;">⚔️ #1 Squadga +25K</button>
          <button type="button" class="skin-pill-btn" id="btnAdmDrawLucky" style="padding:12px;">🎟️ Lucky Ticket Gʻolibi</button>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14.5px;">🔄 Hisoblarni Reset Qilish (0 HOLD + Onboarding)</strong>
        <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">
          Oʻz hisobingizni yoki barcha ishtirokchilarni 0 HOLD va 3-qadamli Onboarding holatiga qaytarish:
        </p>
        <button type="button" class="skin-pill-btn" id="btnAdmResetSelf" style="padding:12px;width:100%;">
          🔄 Oʻz Hisobimni Reset Qilish (@${esc(curUser.username)})
        </button>
        <button type="button" class="skin-pill-btn danger" id="btnAdmResetAllUsers" style="padding:12px;width:100%;">
          ⚠️ BARCHA Foydalanuvchilarni Reset Qilish (Full Season Reset)
        </button>
      </div>
    `;

    container.querySelector('#btnAdmToggleHH')?.addEventListener('click', async () => {
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'toggle_happy_hour' })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      }
    });

    container.querySelector('#btnAdmRewardSquad')?.addEventListener('click', async () => {
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'reward_top_squad', rewardAmount: 25000 })
      });
      if (res.ok) {
        if (res.user) STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      } else {
        showToast(res.error || 'Xato');
      }
    });

    container.querySelector('#btnAdmDrawLucky')?.addEventListener('click', async () => {
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'draw_lucky_winner' })
      });
      if (res.ok) {
        if (res.user) STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      } else {
        showToast(res.error || 'Chiptali ishtirokchi yoʻq');
      }
    });

    container.querySelector('#btnAdmResetSelf')?.addEventListener('click', async () => {
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername: STATE.username })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        closeAllSheets();
        renderAll();
        loadLeaderboardData();
        openOnboardingStory(0);
        showToast('Hisobingiz 0 HOLD va Onboarding holatiga qaytarildi!');
      }
    });

    container.querySelector('#btnAdmResetAllUsers')?.addEventListener('click', async () => {
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'reset_all_users' })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        closeAllSheets();
        renderAll();
        loadLeaderboardData();
        openOnboardingStory(0);
        showToast(res.message);
      }
    });
    return;
  }

  if (STATE.adminTab === 'users') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">👤 Foydalanuvchini Boshqarish (Grant / Reset)</strong>
        <input type="text" id="admTargetUser" value="${esc(curUser.username)}" placeholder="@username" class="apple-search-input" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="number" id="admHoldDelta" value="50000" placeholder="HOLD (+/-)" class="apple-search-input" />
          <input type="number" id="admStarsDelta" value="0" placeholder="Stars (+/-)" class="apple-search-input" />
        </div>
        <select id="admGrantSkin" class="apple-search-input">
          <option value="">Skin berish (ixtiyoriy)</option>
          ${(curUser.allSkins || []).map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
        </select>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="btn-sapphire-primary" id="btnAdmGrantUser">Saqlash / Qoʻshish</button>
          <button type="button" class="skin-pill-btn danger" id="btnAdmResetTargetUser" style="padding:12px;">🔄 Shu Userni Reset (0)</button>
        </div>
      </div>

      <div class="not-section-heading">Barcha Foydalanuvchilar (${usersList.length})</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${usersList.map(uRow => `
          <div class="admin-user-card">
            <div class="admin-user-head">
              <div>
                <strong style="font-size:14px;color:#fff;">#${uRow.rank} ${esc(uRow.displayName || uRow.username)}</strong>
                <span style="font-size:12px;color:var(--text-2);margin-left:6px;">@${esc(uRow.username)} · ${esc(uRow.league)}</span>
              </div>
              <b style="color:var(--theme-accent);font-size:13.5px;">${fmtInt(uRow.holdBalance)} HOLD</b>
            </div>
            <div style="font-size:11.5px;color:var(--text-2);">
              Lifetime: ${fmtInt(uRow.lifetimeHold)} · Streak: D${uRow.streakDays} · Tickets: ${uRow.luckyTickets} 🎟️ · Onboarding: ${uRow.ogBonusClaimed ? 'Ha' : 'Yoʻq'}
            </div>
            <div class="admin-user-actions">
              <button type="button" class="skin-pill-btn" data-quick-select="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Tanlash</button>
              <button type="button" class="skin-pill-btn" data-quick-reset="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">🔄 Reset 0</button>
              <button type="button" class="skin-pill-btn" data-quick-morse="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Morze Reset</button>
              ${uRow.username !== curUser.username ? `<button type="button" class="skin-pill-btn danger" data-quick-del="${esc(uRow.username)}" style="font-size:11.5px;padding:5px 10px;">Oʻchirish</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnAdmGrantUser')?.addEventListener('click', async () => {
      const targetUsername = container.querySelector('#admTargetUser')?.value.trim();
      const holdDelta = parseInt(container.querySelector('#admHoldDelta')?.value, 10) || 0;
      const starsDelta = parseInt(container.querySelector('#admStarsDelta')?.value, 10) || 0;
      const grantSkin = container.querySelector('#admGrantSkin')?.value || '';
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername, holdDelta, starsDelta, grantSkin })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        loadLeaderboardData();
        renderAdminSheet();
        showToast(res.message);
      } else {
        showToast(res.error || 'Xato');
      }
    });

    container.querySelector('#btnAdmResetTargetUser')?.addEventListener('click', async () => {
      const targetUsername = container.querySelector('#admTargetUser')?.value.trim();
      if (!targetUsername) return;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        loadLeaderboardData();
        renderAdminSheet();
        showToast(res.message);
      }
    });

    container.querySelectorAll('[data-quick-select]').forEach(b => {
      b.addEventListener('click', () => {
        const inp = container.querySelector('#admTargetUser');
        if (inp) {
          inp.value = b.dataset.quickSelect;
          inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });

    container.querySelectorAll('[data-quick-reset]').forEach(b => {
      b.addEventListener('click', async () => {
        const target = b.dataset.quickReset;
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'reset_user', targetUsername: target })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          loadLeaderboardData();
          renderAdminSheet();
          showToast(res.message);
        }
      });
    });

    container.querySelectorAll('[data-quick-morse]').forEach(b => {
      b.addEventListener('click', async () => {
        const target = b.dataset.quickMorse;
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'user_grant', targetUsername: target, resetMorse: true })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminSheet();
          showToast(`@${target} uchun Morze reset qilindi!`);
        }
      });
    });

    container.querySelectorAll('[data-quick-del]').forEach(b => {
      b.addEventListener('click', async () => {
        const target = b.dataset.quickDel;
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_user', targetUsername: target })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          loadLeaderboardData();
          renderAdminSheet();
          showToast(res.message);
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'broadcast') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">📢 Barcha Foydalanuvchilarga E'lon (Broadcast)</strong>
        <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">
          Xabar @HOLDbot orqali botdan roʻyxatdan oʻtgan barcha faol PaxtaGram foydalanuvchilariga yetkaziladi. Markdown formatlash (**qalin**, *kursiv*) va emojilar qoʻllab-quvvatlanadi.
        </p>
        <textarea id="admBroadcastText" rows="4" placeholder="E'lon matnini kiriting..." class="apple-search-input" style="resize:vertical;min-height:90px;font-family:inherit;"></textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="text" id="admBroadcastBtnText" value="🪙 $HOLD ga kirish" placeholder="Tugma matni (ixtiyoriy)" class="apple-search-input" />
          <input type="text" id="admBroadcastBtnUrl" value="https://paxta.online/u/HOLDbot" placeholder="Tugma havolasi" class="apple-search-input" />
        </div>
        <div id="admBroadcastProgress" hidden style="padding:10px;border-radius:12px;background:rgba(56,182,255,0.12);color:#e0f2fe;font-size:13px;text-align:center;"></div>
        <button type="button" class="btn-sapphire-primary" id="btnAdmSendBroadcast">🚀 Xabarni Barchaga Yuborish</button>
      </div>

      <div class="dark-group-box" style="padding:12px;gap:6px;">
        <strong style="font-size:13px;color:#fff;">💡 Foydali shablonlar:</strong>
        <button type="button" class="skin-pill-btn" id="tplHappyHour" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          ⚡ 2x Happy Hour e'loni
        </button>
        <button type="button" class="skin-pill-btn" id="tplStreakAlert" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          🔥 Kunlik zanjir eslatmasi
        </button>
        <button type="button" class="skin-pill-btn" id="tplNewTask" style="text-align:left;padding:8px 12px;width:100%;font-size:12px;">
          🎁 Yangi vazifa va bonus e'loni
        </button>
      </div>
    `;

    container.querySelector('#tplHappyHour')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '⚡ <b>Happy Hour boshlandi!</b>\n\nKeyingi 1 soat (20:00 – 21:00) davomida barcha bosishlar <b>2 barobar (2x)</b> koʻproq $HOLD beradi! 🚀';
    });
    container.querySelector('#tplStreakAlert')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '🔥 <b>Kunlik bonus kutmoqda!</b>\n\nBugungi kunlik zanjir mukofotingizni olishni unutmang. 7-kuni bepul Cookie skin beriladi! 🍪';
    });
    container.querySelector('#tplNewTask')?.addEventListener('click', () => {
      const txt = container.querySelector('#admBroadcastText');
      if (txt) txt.value = '🎁 <b>Yangi vazifalar qoʻshildi!</b>\n\nEarn boʻlimida yangi rasmiy kanallar paydo boʻldi. Bajarib qoʻshimcha $HOLD toʻplang!';
    });

    container.querySelector('#btnAdmSendBroadcast')?.addEventListener('click', async () => {
      const text = container.querySelector('#admBroadcastText')?.value.trim();
      if (!text) {
        showToast('Iltimos, xabar matnini kiriting!');
        return;
      }
      const buttonText = container.querySelector('#admBroadcastBtnText')?.value.trim();
      const buttonUrl = container.querySelector('#admBroadcastBtnUrl')?.value.trim();
      const prg = container.querySelector('#admBroadcastProgress');
      const btn = container.querySelector('#btnAdmSendBroadcast');

      if (!confirm('Haqiqatan ham barcha foydalanuvchilarga ushbu xabarni yubormoqchimisiz?')) return;

      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Yuborilmoqda...';
      }
      if (prg) {
        prg.hidden = false;
        prg.textContent = '⏳ Xabar barcha ishtirokchilarga uzatilmoqda...';
      }

      const res = await api('/api/hold/admin-broadcast', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.username,
          text,
          buttonText,
          buttonUrl
        })
      });

      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Xabarni Barchaga Yuborish';
      }

      if (res.ok) {
        if (prg) prg.innerHTML = `✅ <b>Muvaffaqiyatli:</b> ${res.sent} ta yetkazildi (Jami: ${res.total}).`;
        showToast(res.message || 'Xabar yuborildi!');
      } else {
        if (prg) prg.innerHTML = `❌ Xatolik: ${esc(res.error || 'Yuborilmadi')}`;
        showToast(res.error || 'Xatolik');
      }
    });
    return;
  }

  if (STATE.adminTab === 'morse') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">🕵️ Kunlik Morze Soʻzi va Maslahati (Hint)</strong>
        <input type="text" id="admMorseWord" value="${esc(curUser.morse?.word || 'HOLD')}" placeholder="Masalan: HOLD" class="apple-search-input" />
        <input type="text" id="admMorseHint" value="${esc(curUser.morse?.hint || '')}" placeholder="Earn boʻlimida koʻrinadigan maslahat (hint)" class="apple-search-input" />
        <input type="number" id="admMorseReward" value="${curUser.morse?.reward || 50000}" placeholder="Mukofot (HOLD)" class="apple-search-input" />
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button type="button" class="btn-sapphire-primary" id="btnAdmSaveDailyMorse" style="flex:1;">Saqlash</button>
          <button type="button" class="btn-sapphire-primary" id="btnAdmPostMorseChannel" style="flex:1.2;background:linear-gradient(135deg, #0284c7, #2563eb);">📢 @insider ga post</button>
        </div>
      </div>

      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">➕ Yangi Maxfiy Morze Kod Qoʻshish</strong>
        <input type="text" id="admSecCode" placeholder="Maxfiy soʻz (masalan: BONUS)" class="apple-search-input" />
        <input type="number" id="admSecReward" value="25000" placeholder="HOLD mukofoti" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddSecret">Maxfiy Kod Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:10px;">
        ${Object.entries(secretMap).map(([code, info]) => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(code)}</div>
              <div class="nri-sub">+${fmtInt(info.reward)} HOLD</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-secret="${esc(code)}">Oʻchirish</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnAdmSaveDailyMorse')?.addEventListener('click', async () => {
      const morseWord = container.querySelector('#admMorseWord')?.value.trim();
      const morseHint = container.querySelector('#admMorseHint')?.value.trim();
      const morseReward = parseInt(container.querySelector('#admMorseReward')?.value, 10) || 50000;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'save_morse', morseWord, morseHint, morseReward })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      }
    });

    container.querySelector('#btnAdmPostMorseChannel')?.addEventListener('click', async () => {
      const morseWord = container.querySelector('#admMorseWord')?.value.trim();
      const morseReward = parseInt(container.querySelector('#admMorseReward')?.value, 10) || 50000;
      showToast('Kanalga post qilinmoqda...');
      const res = await api('/api/hold/admin-post-morse-channel', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, word: morseWord, reward: morseReward })
      });
      if (res.ok) {
        showToast(res.message);
      } else {
        showToast(res.error || 'Xatolik yuz berdi');
      }
    });

    container.querySelector('#btnAdmAddSecret')?.addEventListener('click', async () => {
      const code = container.querySelector('#admSecCode')?.value.trim();
      const reward = parseInt(container.querySelector('#admSecReward')?.value, 10) || 25000;
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_secret_code', code, reward })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      }
    });

    container.querySelectorAll('[data-del-secret]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_secret_code', code: b.dataset.delSecret })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminSheet();
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'tasks') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">📋 Yangi Vazifa (Task) Qoʻshish</strong>
        <input type="text" id="admTaskTitle" placeholder="Vazifa nomi (masalan: Join @kanal)" class="apple-search-input" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <select id="admTaskCat" class="apple-search-input">
            <option value="specials">Specials</option>
            <option value="onboarding">Onboarding</option>
            <option value="web3">Web3 world</option>
          </select>
          <input type="text" id="admTaskIcon" value="📢" placeholder="Icon (📢, ⭐, 🏆)" class="apple-search-input" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input type="number" id="admTaskReward" value="15000" placeholder="Mukofot (HOLD)" class="apple-search-input" />
          <select id="admTaskMinLeague" class="apple-search-input">
            <option value="">Liga cheklovi yoʻq</option>
            <option value="silver">Silver ligadan boshlab</option>
            <option value="gold">Gold ligadan boshlab</option>
            <option value="platinum">Platinum ligadan boshlab</option>
            <option value="diamond">Diamond ligadan boshlab</option>
          </select>
        </div>
        <input type="text" id="admTaskLink" placeholder="@kanal_username (bot obunani 100% tekshiradi)" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddTask">Vazifani Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:8px;">
        ${quests.map(q => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(q.icon || '⭐')} ${esc(q.title)}</div>
              <div class="nri-sub">${esc(q.cat)} · +${fmtInt(q.reward)} HOLD ${q.minLeague ? `· 🔒 ${esc(q.minLeague)}` : ''} ${q.link ? `· ${esc(q.link)}` : ''}</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-task="${esc(q.id)}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnAdmAddTask')?.addEventListener('click', async () => {
      const title = container.querySelector('#admTaskTitle')?.value.trim();
      const cat = container.querySelector('#admTaskCat')?.value;
      const icon = container.querySelector('#admTaskIcon')?.value.trim();
      const reward = parseInt(container.querySelector('#admTaskReward')?.value, 10) || 15000;
      const minLeague = container.querySelector('#admTaskMinLeague')?.value || null;
      const link = container.querySelector('#admTaskLink')?.value.trim();
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_quest', title, cat, icon, reward, link, minLeague })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      }
    });

    container.querySelectorAll('[data-del-task]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_quest', questId: b.dataset.delTask })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminSheet();
        }
      });
    });
    return;
  }

  if (STATE.adminTab === 'squads') {
    container.innerHTML = `
      <div class="dark-group-box" style="padding:14px;gap:10px;">
        <strong style="font-size:14px;">🏛 Rasmiy PaxtaGram Kanal Squad Qoʻshish</strong>
        <input type="text" id="admSquadHandle" placeholder="@kanal_username" class="apple-search-input" />
        <input type="text" id="admSquadName" placeholder="Kanal nomi (boʻsh qolsa avtomatik oladi)" class="apple-search-input" />
        <button type="button" class="btn-sapphire-primary" id="btnAdmAddSquad">Tekshirish va Qoʻshish</button>
      </div>

      <div class="dark-group-box" style="padding:8px;">
        ${squads.map(s => `
          <div class="not-row-item" style="padding:8px;">
            <div class="nri-center">
              <div class="nri-title">${esc(s.name)} ${s.verified ? '✓' : ''}</div>
              <div class="nri-sub">@${esc(s.handle || s.id)} · ${fmtInt(s.members || 0)} a'zo · ${fmtInt(s.totalHold)} HOLD</div>
            </div>
            <button type="button" class="skin-pill-btn danger" data-del-squad="${esc(s.id)}">✕</button>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelector('#btnAdmAddSquad')?.addEventListener('click', async () => {
      const handle = container.querySelector('#admSquadHandle')?.value.trim();
      const name = container.querySelector('#admSquadName')?.value.trim();
      const res = await api('/api/hold/admin-config', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.username, action: 'add_squad', handle, name })
      });
      if (res.ok && res.user) {
        STATE.user = res.user;
        renderAll();
        renderAdminSheet();
        showToast(res.message);
      } else {
        showToast(res.error || 'Kanal topilmadi');
      }
    });

    container.querySelectorAll('[data-del-squad]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await api('/api/hold/admin-config', {
          method: 'POST',
          body: JSON.stringify({ username: STATE.username, action: 'delete_squad', squadId: b.dataset.delSquad })
        });
        if (res.ok && res.user) {
          STATE.user = res.user;
          renderAll();
          renderAdminSheet();
        }
      });
    });
  }
}

// ============================================================================
// DOMCONTENTLOADED WIRING
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  try {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  } catch {}
  notifyPaxtaMiniApp('web_app_ready');
  notifyPaxtaMiniApp('web_app_expand');

  // Official PaxtaGram Login Overlay Wiring
  document.getElementById('btnPaxtaLoginSubmit')?.addEventListener('click', handlePaxtaLoginSubmit);
  document.getElementById('inpPaxtaLoginUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePaxtaLoginSubmit();
  });

  // Onboarding Continue Button
  document.getElementById('btnOsContinue')?.addEventListener('click', advanceOnboardingStory);
  document.getElementById('btnReplayOnboarding')?.addEventListener('click', () => {
    closeAllSheets();
    openOnboardingStory(0);
  });

  // PAWS Footprint Bar & Farm Triggers
  document.getElementById('btnOpenFootprint')?.addEventListener('click', (e) => {
    e.preventDefault();
    haptic('light');
    openFootprintStoryModal();
  });
  document.getElementById('btnDockFarm')?.addEventListener('click', (e) => {
    e.preventDefault();
    openSheet('farm');
  });
  document.getElementById('btnClaimFarm')?.addEventListener('click', claimFarmYield);
  document.getElementById('btnClaimFarmRef')?.addEventListener('click', claimFarmRefYield);
  document.getElementById('btnCloseFootprintStory')?.addEventListener('click', () => {
    const m = document.getElementById('footprintStoryModal');
    if (m) m.hidden = true;
  });
  document.getElementById('fsmBackdrop')?.addEventListener('click', () => {
    const m = document.getElementById('footprintStoryModal');
    if (m) m.hidden = true;
  });

  // Bottom Dock Sheet Triggers
  document.querySelectorAll('[data-open-sheet]').forEach(btn => {
    btn.addEventListener('click', () => openSheet(btn.dataset.openSheet));
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', closeAllSheets);
  });

  // Top Pill, Arena Streak Pill, League & Admin Sheet Triggers
  document.getElementById('btnSquadPill')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnOpenLeagues')?.addEventListener('click', () => openSheet('leagues'));
  document.getElementById('btnArenaStreakPill')?.addEventListener('click', () => {
    if (STATE.user?.streak?.canClaimToday) {
      claimDailyStreakBonus();
    } else {
      openSheet('earn');
    }
  });
  document.getElementById('btnOpenStarsTopup')?.addEventListener('click', () => openTopUpStarsModal(250));
  document.getElementById('btnOpenAdminModal')?.addEventListener('click', () => openSheet('admin'));
  document.getElementById('btnEarnInviteCard')?.addEventListener('click', () => openSheet('frens'));
  document.getElementById('btnAddCustomSquad')?.addEventListener('click', openAddPaxtaChannelSquadModal);

  // Admin Full-Screen Sheet Tab Switcher
  document.querySelectorAll('#adminMainTabs .nseg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#adminMainTabs .nseg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.adminTab = btn.dataset.atab || 'overview';
      renderAdminSheet();
    });
  });

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
    openModal('Full guide', `
      <div class="guide-list">
        <div class="guide-item"><span>🪙</span><div><b>Tap</b><p>Tangani bosing — har bosish HOLD beradi. Energiya oʻz-oʻzidan tiklanadi.</p></div></div>
        <div class="guide-item"><span>✅</span><div><b>Tasks</b><p>Vazifani bajaring va “Tekshirish” tugmasini bosing. Bot bajarilganini 100% tekshiradi.</p></div></div>
        <div class="guide-item"><span>🔥</span><div><b>Daily reward</b><p>Har kuni kiring. 7 kun ketma-ket — +50K HOLD va Cookie skin.</p></div></div>
        <div class="guide-item"><span>⚡</span><div><b>Happy Hour</b><p>Har kuni 20:00–21:00 da har bosish 2 barobar.</p></div></div>
        <div class="guide-item"><span>🏆</span><div><b>Top-10</b><p>Reytingning eng yaxshi 10 tasi NFT sovgʻa va HOLD oladi.</p></div></div>
        <div class="guide-item"><span>✦</span><div><b>Sirlar</b><p>Tangada yashirin sirlar bor. Kuzatib boring…</p></div></div>
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
    coinBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; }, { capture: true });
    coinBtn.addEventListener('dragstart', (e) => { e.preventDefault(); return false; });
    coinBtn.addEventListener('selectstart', (e) => { e.preventDefault(); return false; });

    coinBtn.addEventListener('pointerdown', (e) => {
      if (e.cancelable) e.preventDefault();
      try {
        coinBtn.setPointerCapture(e.pointerId);
      } catch {}
      STATE.pointerDownTime = Date.now();
      haptic('light');

      const rect = coinBtn.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      coinBtn.style.transform = `rotateX(${-dy * 15}deg) rotateY(${dx * 15}deg) scale(0.955)`;

      // Secret Compass Direction Detection (Top -> Right -> Down -> Left -> Top)
      if (Math.hypot(dx, dy) >= 0.35) {
        const dir = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'up' : 'down') : (dx > 0 ? 'right' : 'left');
        if (!STATE.compassSequence) STATE.compassSequence = [];
        clearTimeout(STATE.compassTimer);
        STATE.compassSequence.push(dir);
        STATE.compassTimer = setTimeout(() => { STATE.compassSequence = []; }, 2800);

        const expectedCompass = ['up', 'right', 'down', 'left', 'up'];
        if (STATE.compassSequence.length > expectedCompass.length) {
          STATE.compassSequence = STATE.compassSequence.slice(-expectedCompass.length);
        }

        if (
          STATE.compassSequence.length === expectedCompass.length &&
          STATE.compassSequence.every((v, i) => v === expectedCompass[i])
        ) {
          STATE.compassSequence = [];
          clearTimeout(STATE.compassTimer);
          (async () => {
            haptic('heavy');
            const airEl = document.getElementById('floatingMidAirMorse');
            if (airEl) {
              airEl.classList.add('solved');
              airEl.innerHTML = `<span class="midair-letter" style="font-size:22px;letter-spacing:1px;">🧭 VAULT UNLOCKED</span>`;
              setTimeout(() => { airEl.innerHTML = ''; airEl.classList.remove('solved'); }, 2200);
            }
            const res = await api('/api/hold/solve-compass', {
              method: 'POST',
              body: JSON.stringify({ username: STATE.username, sequence: expectedCompass })
            });
            if (res.ok && res.user) {
              STATE.user = res.user;
              renderAll();
              showToast(res.message);
            } else if (res.error) {
              showToast(res.error);
            }
          })();
        }
      }

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

  // Copy Referral Link / Username In-App (Never opens an external browser tab!)
  document.getElementById('btnCopyRefLink')?.addEventListener('click', async () => {
    const shareText = `🪙 **$HOLD ga qoʻshiling!**\n\n1. https://paxta.online/u/HOLDbot ga kiring\n2. **/start ${STATE.username}** deb yozing\n\nHar ikkalamizga bepul $HOLD beriladi! 🚀`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(`Taklif xabari nusxalandi! Doʻstlaringizga yuboring`);
    } catch {
      showToast(`Nikingiz: @${STATE.username}`);
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
