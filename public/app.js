// Paxta Gifts — Do'kon, Market, Profil, Upgrade, Craft & Admin Panel (No Sound Effects)

const STATE = {
  user: null,
  authToken: localStorage.getItem('paxta_gift_auth_token') || '',
  initData: '',
  myProfile: null,
  viewedProfile: null, // null = viewing own profile, otherwise another user's profile object
  inventory: [],
  collections: [],
  channelCalendars: [],
  calendarFilter: 'all',
  calendarQuery: '',
  shopMode: 'all',
  marketListings: [],
  marketFilter: 'all',
  marketQuery: '',
  collectors: [],
  activity: [],
  adminCollections: [],
  adminCalendarOrders: [],
  adminUsers: [],
  adminPromos: [],
  adminStats: { usersCount: 0, totalGifts: 0, burnedGifts: 0, marketCount: 0 },
  adminSubtab: 'collections',
  adminUserQuery: '',
  activeTab: 'shop',
  invFilter: 'all',
  adminFilter: 'all',
  adminQuery: '',
  activeGift: null,
  modalView: 'view',
  cleanupModal: null,
  selectMode: false,
  selectedGiftIds: new Set()
};

const TIER_LABELS = {
  legendary: 'Afsonaviy',
  epic: 'Epik',
  rare: 'Noyob',
  uncommon: 'Gʻayrioddiy'
};
const TIER_ORDER = ['legendary', 'epic', 'rare', 'uncommon'];

const CRAFT_BG_NORMAL = { center: '#26414b', edge: '#121d24', pattern: '#2d4954', text: '#b8dce8' };
const CRAFT_BG_FAIL   = { center: '#5c3027', edge: '#2a1410', pattern: '#6e3a2f', text: '#ffbeaf' };
const CRAFT_PATTERN   = { img: '/img/craft-anvil.svg' };

function fmtInt(n) {
  if (typeof n === 'string' && isNaN(Number(n))) return n;
  return Number(n || 0).toLocaleString('ru-RU');
}

function formatGiftNum(n) {
  if (n == null || n === '') return '';
  if (typeof n === 'string') {
    if (n.startsWith('👑') || n.startsWith('#')) return n;
    return `#${n}`;
  }
  return `#${Number(n || 0).toLocaleString('ru-RU')}`;
}

function fmtPct(permille) {
  if (permille == null) return '';
  const val = +(permille / 10).toFixed(1);
  return `${String(val).replace('.', ',')}%`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const wrap = document.getElementById('toastContainer');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s';
    setTimeout(() => el.remove(), 260);
  }, 2600);
}

// ---- Exact SVG Icons from paxta.online ----
function svgStar(size = 16) {
  return `<svg class="star-svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="M12 1.8l2.9 6.2 6.8.8-5 4.6 1.4 6.7L12 16.7 5.9 20.1l1.4-6.7-5-4.6 6.8-.8z"/></svg>`;
}

function svgUpgradeIcon(size = 20) {
  const uid = 'ug_' + Math.random().toString(36).slice(2, 8);
  return `<svg class="upgrade-icon" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">
    <defs>
      <mask id="${uid}">
        <rect width="24" height="24" fill="#fff"/>
        <path fill="#000" d="M12 6.4 13.45 10.55 17.6 12 13.45 13.45 12 17.6 10.55 13.45 6.4 12 10.55 10.55Z"/>
      </mask>
    </defs>
    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-dasharray="2.4 3.45"/>
    <circle cx="12" cy="12" r="7.2" fill="currentColor" mask="url(#${uid})"/>
  </svg>`;
}

function svgCraftIcon(size = 22) {
  return `<svg class="craft-icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true">
    <path d="M9.6 2.3c.4-.4 1-.4 1.4 0l2.7 2.7c.4.4.4 1 0 1.4l-1.6 1.6-4.1-4.1 1.6-1.6ZM3.3 8.6l4.5-4.5 4.1 4.1-4.5 4.5c-.4.4-1 .4-1.4 0L3.3 10c-.4-.4-.4-1 0-1.4Zm7.5-.7 5.3 5.3-1.1 1.1-5.3-5.3 1.1-1.1Z"/>
    <path d="M5 14h13v1c0 1.9-1.4 3.4-3.2 3.7l1.5 2.3H7.7l1.5-2.3C7.4 18.4 6 16.9 6 15h-1c-1.7 0-3-.9-3-2h3v1Zm13 .5h3.5c-.3 1.7-1.6 3-3.5 3v-3Z"/>
  </svg>`;
}

function svgActionIcon(name, size = 20) {
  if (name === 'wear') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M3.5 18.5h17v2h-17v-2Zm.4-1.5L2.5 7.5l5.2 3.6L12 4.5l4.3 6.6 5.2-3.6-1.4 9.5H3.9Z"/></svg>`;
  }
  if (name === 'unwear') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M3.5 18.5h12.7l2 2H3.5v-2Zm3.9-1.5H3.9L2.5 7.5l3.7 2.5 1.2 7ZM12 4.5l4.3 6.6 5.2-3.6-1.4 9.5h-2.3L9.9 9.2 12 4.5ZM3.1 2.7l18.2 18.2-1.4 1.4L1.7 4.1l1.4-1.4Z"/></svg>`;
  }
  if (name === 'transfer') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
  }
  if (name === 'sell') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM6.5 8C5.67 8 5 7.33 5 6.5S5.67 5 6.5 5 8 5.67 8 6.5 7.33 8 6.5 8z"/></svg>`;
  }
  if (name === 'unsell') {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H6.83l14.6 14.6 0-.02c.36-.36.57-.86.57-1.41 0-.55-.23-1.06-.59-1.59zM2.39 1.73 1.11 3l1.1 1.1C2.08 4.38 2 4.68 2 5v6c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.32 0 .62-.08.89-.21l5.38 5.38 1.27-1.27L2.39 1.73z"/></svg>`;
  }
  return '';
}

// ---- Exact UniqueBackdrop Renderer (4 concentric elliptical rings + source-in tinting) ----
const BACKDROP_RINGS = [
  { r: 92,  size: 26, n: 6,  opacity: 0.46, turn: 0 },
  { r: 136, size: 22, n: 8,  opacity: 0.32, turn: 22.5 },
  { r: 180, size: 19, n: 12, opacity: 0.20, turn: 7 },
  { r: 226, size: 16, n: 14, opacity: 0.12, turn: 19 }
];
const ELLIPSE_Y = 0.82;
const imgCache = new Map();
const tintCache = new Map();

function loadPatternImage(url) {
  if (!url) return Promise.resolve(null);
  if (imgCache.has(url)) return imgCache.get(url);
  const p = new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  imgCache.set(url, p);
  return p;
}

function getTintedPatternCanvas(img, url, color) {
  const key = `${url}__${color}`;
  if (tintCache.has(key)) return tintCache.get(key);
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, 64, 64);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  tintCache.set(key, c);
  return c;
}

const compactBackdropCache = new Map();

const backdropLazyObserver = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const cvs = entry.target;
        backdropLazyObserver.unobserve(cvs);
        if (cvs.__bdArgs) {
          const { backdrop, pattern, opts } = cvs.__bdArgs;
          cvs.__bdArgs = null;
          drawUniqueBackdrop(cvs, backdrop, pattern, opts);
        }
      }
    }, { rootMargin: '260px 0px' })
  : null;

function scheduleBackdropDraw(canvas, backdrop, pattern, opts = {}) {
  if (!canvas || !backdrop) return;
  if (opts.compact && backdropLazyObserver) {
    canvas.__bdArgs = { backdrop, pattern, opts };
    backdropLazyObserver.observe(canvas);
    return;
  }
  requestAnimationFrame(() => drawUniqueBackdrop(canvas, backdrop, pattern, opts));
}

function renderGridInChunks(gridEl, items, buildCardFn, chunkSize = 48) {
  if (!gridEl) return;
  gridEl.innerHTML = '';
  if (!items || !items.length) return;

  let cursor = 0;
  const appendNextBatch = () => {
    const frag = document.createDocumentFragment();
    const end = Math.min(items.length, cursor + chunkSize);
    for (; cursor < end; cursor++) {
      frag.appendChild(buildCardFn(items[cursor]));
    }
    gridEl.appendChild(frag);
  };

  appendNextBatch();

  if (cursor < items.length && typeof IntersectionObserver !== 'undefined') {
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.gridColumn = '1 / -1';
    gridEl.appendChild(sentinel);

    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        sentinel.remove();
        appendNextBatch();
        if (cursor < items.length) {
          gridEl.appendChild(sentinel);
        } else {
          obs.disconnect();
        }
      }
    }, { rootMargin: '360px 0px' });
    obs.observe(sentinel);
  }
}

async function drawUniqueBackdrop(canvas, backdrop, pattern, opts = {}) {
  if (!canvas || !backdrop) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, opts.width || rect.width || canvas.clientWidth || (opts.compact ? 160 : 380));
  const h = Math.max(1, opts.height || rect.height || canvas.clientHeight || (opts.compact ? 172 : 260));
  const dpr = Math.min(window.devicePixelRatio || 1, opts.compact ? 1.5 : 2);

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const patUrl = pattern?.img || pattern?.image_url || '';
  const cacheKey = opts.compact ? `${backdrop.center}_${backdrop.edge}_${backdrop.pattern}_${patUrl}` : '';

  if (cacheKey && compactBackdropCache.has(cacheKey)) {
    ctx.drawImage(compactBackdropCache.get(cacheKey), 0, 0, w, h);
    return;
  }

  const cx = w / 2;
  const cy = h * 0.44;
  const rad = Math.hypot(w, h) * 0.62;
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
  grad.addColorStop(0, backdrop.center || '#363738');
  grad.addColorStop(1, backdrop.edge || '#0e0f0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (!patUrl) {
    if (cacheKey && compactBackdropCache.size < 250) {
      const off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      off.getContext('2d').drawImage(canvas, 0, 0);
      compactBackdropCache.set(cacheKey, off);
    }
    return;
  }

  const img = await loadPatternImage(patUrl);
  if (!img || !canvas.isConnected) return;

  const tintColor = backdrop.pattern || backdrop.edge || '#000000';
  const sprite = getTintedPatternCanvas(img, patUrl, tintColor);

  const u = Math.max(w / 420, h / 300);
  const rings = opts.compact ? BACKDROP_RINGS.slice(0, 2) : BACKDROP_RINGS;

  ctx.save();
  for (const ring of rings) {
    const sz = ring.size * u;
    ctx.globalAlpha = ring.opacity;
    for (let i = 0; i < ring.n; i++) {
      const deg = (i / ring.n) * 360 + ring.turn;
      const radAngle = (deg * Math.PI) / 180;
      const x = cx + Math.cos(radAngle) * ring.r * u;
      const y = cy + Math.sin(radAngle) * ring.r * u * ELLIPSE_Y;
      if (x + sz < 0 || x - sz > w || y + sz < 0 || y - sz > h) continue;
      ctx.drawImage(sprite, x - sz / 2, y - sz / 2, sz, sz);
    }
  }
  ctx.restore();

  if (cacheKey && compactBackdropCache.size < 250) {
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    off.getContext('2d').drawImage(canvas, 0, 0);
    compactBackdropCache.set(cacheKey, off);
  }
}

// ---- Lottie Helper ----
const lottieJsonCache = new Map();

async function fetchLottieData(jsonUrl) {
  if (!jsonUrl) return null;
  if (lottieJsonCache.has(jsonUrl)) return lottieJsonCache.get(jsonUrl);
  const p = fetch(jsonUrl)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  lottieJsonCache.set(jsonUrl, p);
  return p;
}

function mountLottieOrImg(container, { imgUrl, jsonUrl, size = 132, loop = false, autoplay = true }) {
  if (!container) return { play: () => {}, destroy: () => {} };
  container.innerHTML = '';
  container.style.width = `${size}px`;
  container.style.height = `${size}px`;

  const fallbackImg = document.createElement('img');
  fallbackImg.src = imgUrl || '';
  fallbackImg.alt = '';
  fallbackImg.style.width = `${size}px`;
  fallbackImg.style.height = `${size}px`;
  fallbackImg.style.objectFit = 'contain';
  fallbackImg.onerror = () => {
    if (fallbackImg.src.includes('/a/imperialcrown/') && !fallbackImg.src.endsWith('/thumb.svg')) {
      fallbackImg.src = '/a/imperialcrown/thumb.svg';
    }
  };
  container.appendChild(fallbackImg);

  let anim = null;
  let destroyed = false;

  if (jsonUrl && window.lottie) {
    fetchLottieData(jsonUrl).then(data => {
      if (destroyed || !data || !container.isConnected) return;
      container.innerHTML = '';
      anim = window.lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: !!loop,
        autoplay: !!autoplay,
        animationData: structuredClone(data)
      });
    });
  }

  return {
    play() {
      if (anim) anim.goToAndPlay(0, true);
    },
    destroy() {
      destroyed = true;
      if (anim) anim.destroy();
    }
  };
}

// ---- Edge Confetti ----
const CONFETTI_COLORS = ['#ff6b8b', '#ffb84d', '#ffd93d', '#6ee7b7', '#60a5fa', '#a78bfa', '#f472b6'];

function launchEdgeConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  canvas.hidden = false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  for (const side of [-1, 1]) {
    const startX = side < 0 ? 0 : w;
    const baseAngle = side < 0 ? -Math.PI * 0.28 : -Math.PI * 0.72;
    for (let i = 0; i < 48; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * 0.7;
      const speed = 9 + Math.random() * 14;
      particles.push({
        x: startX,
        y: h * (0.35 + Math.random() * 0.3),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        w: 6 + Math.random() * 5,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        life: 0,
        ttl: 90 + Math.random() * 50,
        round: i % 4 === 0
      });
    }
  }

  let raf = 0;
  function step() {
    ctx.clearRect(0, 0, w, h);
    let alive = false;
    for (const p of particles) {
      p.life++;
      if (p.life >= p.ttl) continue;
      alive = true;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.34;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const alpha = p.life > p.ttl - 25 ? (p.ttl - p.life) / 25 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (alive) {
      raf = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(raf);
      canvas.hidden = true;
    }
  }
  raf = requestAnimationFrame(step);
}

// ---- API Calls & State Sync ----
async function api(url, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(STATE.authToken ? { 'x-auth-token': STATE.authToken } : {}),
    ...(STATE.initData ? { 'x-init-data': STATE.initData } : {}),
    ...(opts.headers || {})
  };
  const res = await fetch(url, {
    ...opts,
    headers
  });
  return res.json();
}

function parsePaxtaWebAppData() {
  try {
    const hash = window.location.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(hash);
    const initData = hashParams.get('tgWebAppData') || window.Telegram?.WebApp?.initData || '';
    if (!initData) return null;
    const p = new URLSearchParams(initData);
    const userStr = p.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return { initData, user };
  } catch {
    return null;
  }
}

function isInsidePaxtaMiniApp() {
  return !!(window.parent && window.parent !== window);
}

function notifyPaxtaMiniApp(eventType, eventData = {}) {
  try {
    if (isInsidePaxtaMiniApp()) {
      window.parent.postMessage(JSON.stringify({ eventType, eventData }), '*');
    }
  } catch {}
}

function detectPaxtaGramUser() {
  const webApp = parsePaxtaWebAppData();
  if (webApp?.user) {
    return webApp.user.username || webApp.user.first_name || (webApp.user.id ? `user_${webApp.user.id}` : null);
  }
  const params = new URLSearchParams(window.location.search);
  const qUser = params.get('user') || params.get('username');
  if (qUser) return qUser;
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) return tgUser.username || tgUser.first_name || (tgUser.id ? `user_${tgUser.id}` : null);
  const local = localStorage.getItem('paxta_gift_user');
  if (local) return local;
  const guest = 'guest_' + Math.floor(1000 + Math.random() * 9000);
  localStorage.setItem('paxta_gift_user', guest);
  return guest;
}

async function loginUser(username) {
  const webApp = parsePaxtaWebAppData();
  if (webApp?.initData) {
    STATE.initData = webApp.initData;
  }

  const params = new URLSearchParams(window.location.search);
  const urlAuthToken = params.get('auth');
  if (urlAuthToken) {
    STATE.authToken = urlAuthToken;
    localStorage.setItem('paxta_gift_auth_token', urlAuthToken);
  }

  const saved = username || detectPaxtaGramUser();
  const data = await api('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({
      username: saved,
      displayName: !username && webApp?.user?.first_name ? webApp.user.first_name : undefined,
      paxtaId: !username && webApp?.user?.id ? webApp.user.id : undefined,
      initData: !username && webApp?.initData ? webApp.initData : undefined,
      authToken: !username ? STATE.authToken : undefined
    })
  });
  if (data.ok) {
    STATE.user = data.user;
    STATE.inventory = data.inventory || [];
    STATE.myProfile = data.profile || {};
    STATE.myProfile.gifts = STATE.inventory;
    if (data.authToken) {
      STATE.authToken = data.authToken;
      localStorage.setItem('paxta_gift_auth_token', data.authToken);
    }
    localStorage.setItem('paxta_gift_user', STATE.user.username || STATE.user.displayName);

    // Strictly hide/show Admin Tab ONLY for PaxtaGram ID === 100
    const adminTabBtn = document.getElementById('tabAdmin');
    const adminTabMobileBtn = document.getElementById('tabAdminMobile');
    if (adminTabBtn) adminTabBtn.hidden = !STATE.user.isAdmin;
    if (adminTabMobileBtn) adminTabMobileBtn.hidden = !STATE.user.isAdmin;
    if (!STATE.user.isAdmin && STATE.activeTab === 'admin') {
      switchTab('shop');
    }

    // If currently viewing own profile, keep it synced
    if (!STATE.viewedProfile || STATE.viewedProfile.username === STATE.user.username) {
      STATE.viewedProfile = null;
    }

    renderHeaderUser();
    renderProfileView();
  }
}

async function loadCollections() {
  const [data, calData] = await Promise.all([
    api('/api/collections'),
    api('/api/channel-calendars')
  ]);
  if (data.ok) {
    STATE.collections = data.collections || [];
    document.getElementById('shopCountBadge').textContent = STATE.collections.length;
    renderCatalog();
  }
  if (calData && calData.ok) {
    STATE.channelCalendars = calData.calendars || [];
    const availEl = document.getElementById('calendarAvailBadge');
    if (availEl) availEl.textContent = calData.availableCount ?? STATE.channelCalendars.filter(c => !c.sold).length;
    renderChannelCalendars();
  }
}

function setShopMode(mode) {
  STATE.shopMode = mode || 'all';
  document.querySelectorAll('.shop-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shopMode === STATE.shopMode);
  });
  const officialSec = document.getElementById('officialCatalogSection');
  const calSec = document.getElementById('channelCalendarsSection');
  if (officialSec) officialSec.hidden = STATE.shopMode === 'calendars';
  if (calSec) calSec.hidden = STATE.shopMode === 'collections';
}

function renderChannelCalendars() {
  const grid = document.getElementById('channelCalendarsGrid');
  if (!grid) return;

  const q = (STATE.calendarQuery || '').trim().toLowerCase().replace(/^#/, '');
  let list = (STATE.channelCalendars || []).filter(c => {
    if (STATE.calendarFilter === 'craft' && !c.crafted) return false;
    if (STATE.calendarFilter === 'black' && !c.isBlackBackdrop) return false;
    if (STATE.calendarFilter === 'top100' && Number(c.number) >= 100) return false;
    if (q) {
      const matchNum = String(c.number || '').includes(q);
      const matchModel = (c.model || '').toLowerCase().includes(q);
      const matchBg = (c.backdrop || '').toLowerCase().includes(q);
      const matchPat = (c.pattern || '').toLowerCase().includes(q);
      if (!matchNum && !matchModel && !matchBg && !matchPat) return false;
    }
    return true;
  });

  if (STATE.calendarFilter === 'price_asc') {
    list.sort((a, b) => (a.priceStars || 0) - (b.priceStars || 0));
  } else if (STATE.calendarFilter === 'num_asc') {
    list.sort((a, b) => (a.number || 9999) - (b.number || 9999));
  } else {
    // Default sort: available first, then crafted/black/low number
    list.sort((a, b) => {
      if (a.sold !== b.sold) return a.sold ? 1 : -1;
      if (a.crafted !== b.crafted) return a.crafted ? -1 : 1;
      if (a.isBlackBackdrop !== b.isBlackBackdrop) return a.isBlackBackdrop ? -1 : 1;
      return (a.number || 9999) - (b.number || 9999);
    });
  }

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>Qidiruv boʻyicha Kalendar NFT topilmadi</strong>
        <span>Boshqa filtrni tanlang yoki qidiruv soʻzini oʻzgartiring.</span>
      </div>
    `;
    return;
  }

  renderGridInChunks(grid, list, buildCalendarCard, 36);
}

function buildCalendarCard(cal) {
  const card = document.createElement('div');
  card.className = `gift-card is-upgraded`;

  const cvs = document.createElement('canvas');
  cvs.className = 'unique-backdrop';
  card.appendChild(cvs);
  scheduleBackdropDraw(cvs, {
    center: cal.backdropColors?.center || '#363738',
    edge: cal.backdropColors?.edge || '#0e0f0f',
    pattern: cal.backdropColors?.edge || '#000000'
  }, null, { compact: true });

  if (cal.crafted) {
    const rib = document.createElement('div');
    rib.className = 'gift-card-crafted-ribbon';
    rib.textContent = '🔨 CRAFT NFT';
    card.appendChild(rib);
  } else {
    const rib = document.createElement('div');
    rib.className = 'real-nft-ribbon';
    rib.textContent = cal.isBlackBackdrop ? '🖤 BLACK NFT' : '📅 REAL NFT';
    card.appendChild(rib);
  }

  const top = document.createElement('div');
  top.className = 'gift-card-top';
  top.innerHTML = `
    <span class="gift-card-badge" style="visibility:hidden">·</span>
    <span class="gift-card-num">#${fmtInt(cal.number)}</span>
  `;
  card.appendChild(top);

  const img = document.createElement('img');
  img.className = 'gift-card-art';
  img.src = cal.image;
  img.alt = cal.name;
  img.loading = 'lazy';
  card.appendChild(img);

  const foot = document.createElement('div');
  foot.className = 'gift-card-foot';
  foot.innerHTML = `
    <div class="gift-card-title">Desk Calendar #${fmtInt(cal.number)}</div>
    <div class="gift-card-sub">${esc(cal.model)} · ${esc(cal.backdrop)}</div>
    ${cal.sold ? `
      <button type="button" class="market-buy-pill" disabled style="opacity:0.55;background:rgba(255,255,255,0.12);color:#fff;">
        <span>Sotilgan (@${esc(cal.soldTo || 'user')})</span>
      </button>
    ` : `
      <button type="button" class="market-buy-pill" title="Real PaxtaGram NFT xarid qilish">
        ${svgStar(14)}
        <span>${fmtInt(cal.priceStars)}</span>
        <span class="market-buy-txt">Xarid</span>
      </button>
    `}
  `;
  card.appendChild(foot);

  card.addEventListener('click', () => openBuyCalendarModal(cal));
  return card;
}

function openBuyCalendarModal(cal) {
  if (cal.sold) {
    return showToast(`Ushbu Kalendar NFT allaqachon @${cal.soldTo || 'foydalanuvchi'} tomonidan xarid qilingan`);
  }

  const myUpgradedCandidates = (STATE.inventory || []).filter(
    g => g.state === 'upgraded' && !g.salePrice && !g.isRealPaxtaNft
  );
  const selectedTradeIds = new Set();

  function calcSummary() {
    let discount = 0;
    for (const gid of selectedTradeIds) {
      const g = myUpgradedCandidates.find(x => x.id === gid);
      if (g) {
        const credit = Math.min(120, Math.max(40, Math.round(((g.paid || 100) + (g.upgradePaid || 50)) * 0.45)));
        discount += credit;
      }
    }
    discount = Math.min(cal.maxTradeInDiscount || 300, discount);
    const finalPrice = Math.max(650, (cal.priceStars || 950) - discount);
    const userStars = STATE.user?.stars || 0;
    const hasEnough = userStars >= finalPrice;
    const deficit = Math.max(0, finalPrice - userStars);
    return { discount, finalPrice, userStars, hasEnough, deficit };
  }

  const initSum = calcSummary();

  openSubModal(`📅 Desk Calendar #${cal.number} (Real NFT)`, `
    <div class="form-stack" style="align-items:center;text-align:center;">
      <div style="width:100%;height:175px;border-radius:18px;position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.14);">
        <canvas id="calBuyModalCanvas" class="unique-backdrop"></canvas>
        <img src="${esc(cal.image)}" alt="" style="width:108px;height:108px;object-fit:contain;position:relative;z-index:2;filter:drop-shadow(0 8px 18px rgba(0,0,0,0.45));" />
        <div style="position:relative;z-index:2;margin-top:6px;font-weight:800;font-size:15px;color:${esc(cal.backdropColors?.text || '#fff')};">
          Desk Calendar #${fmtInt(cal.number)} · ${esc(cal.model)}
        </div>
        <div style="position:relative;z-index:2;font-size:12px;opacity:0.88;color:${esc(cal.backdropColors?.text || '#fff')};">
          Fon: <b>${esc(cal.backdrop)}</b> · Naqsh: <b>${esc(cal.pattern)}</b>
        </div>
      </div>

      <div style="display:flex;gap:8px;width:100%;justify-content:center;flex-wrap:wrap;">
        <span class="filter-chip active" style="font-size:11.5px;">${esc(cal.tierLabel || '📅 Real PaxtaGram NFT')}</span>
        <a href="${esc(cal.link)}" target="_blank" rel="noopener" class="filter-chip" style="text-decoration:none;font-size:11.5px;color:#60a5fa;">
          🔗 PaxtaGram NFT sahifasi ↗
        </a>
      </div>

      ${myUpgradedCandidates.length > 0 ? `
        <div class="trade-in-box">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-size:12.5px;color:#fff;">🔄 Smart Trade-In (Ixtiyoriy chegirma -300 ⭐ gacha)</strong>
            <span style="font-size:11.5px;color:#34d399;font-weight:700;" id="calTradeDiscountLbl">0 ⭐ chegirma</span>
          </div>
          <span style="font-size:11.5px;color:var(--text-2);display:block;margin-top:2px;">
            Oʻzingizdagi 3 tagacha Upgraded sovgʻani qoʻshib, Kalendar NFT narxini arzonlashtirishingiz mumkin:
          </span>
          <div class="trade-in-grid" id="calTradeInGrid">
            ${myUpgradedCandidates.slice(0, 24).map(g => {
              const cr = Math.min(120, Math.max(40, Math.round(((g.paid || 100) + (g.upgradePaid || 50)) * 0.45)));
              return `
                <div class="trade-in-item" data-trade-id="${esc(g.id)}">
                  <img src="${esc(g.model?.img || g.thumb)}" alt="" loading="lazy" />
                  <strong>${esc(g.name)} #${fmtInt(g.number)}</strong>
                  <span>-${cr} ⭐</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div style="width:100%;text-align:left;">
        <label style="font-size:12px;color:var(--text-2);font-weight:600;display:block;margin-bottom:4px;">
          Qabul qiluvchi PaxtaGram @username (NFT shu profilga oʻtkaziladi):
        </label>
        <div class="form-field">
          <span>@</span>
          <input type="text" id="inpCalRecipient" value="${esc(STATE.user?.username || '')}" placeholder="PaxtaGram username..." />
        </div>
      </div>

      <div class="buy-summary-box" style="width:100%;">
        <div style="display:flex;justify-content:space-between;width:100%;font-size:13px;color:var(--text-2);">
          <span>Asl narxi:</span>
          <b>⭐ ${fmtInt(cal.priceStars)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;width:100%;font-size:13px;color:#34d399;margin-top:3px;" id="calDiscountRow" hidden>
          <span>Trade-In chegirma:</span>
          <b id="calDiscountVal">-0 ⭐</b>
        </div>
        <div style="display:flex;justify-content:space-between;width:100%;font-size:15px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
          <span>Toʻlov miqdori:</span>
          <b style="color:var(--saffron);" id="calFinalPriceVal">${svgStar(15)} ${fmtInt(initSum.finalPrice)}</b>
        </div>
      </div>

      <button type="button" class="btn btn-primary gv-btn" id="btnConfirmBuyCalendar" style="height:46px;font-size:14.5px;">
        <span id="btnConfirmBuyCalendarTxt">${initSum.hasEnough
          ? `📅 Xarid qilish va PaxtaGram'ga olish · ${svgStar(15)} ${fmtInt(initSum.finalPrice)}`
          : `⭐ Stars toʻldirish va olish (+${fmtInt(initSum.deficit)} ⭐)`}</span>
      </button>
    </div>
  `, (body) => {
    const cvs = body.querySelector('#calBuyModalCanvas');
    if (cvs) {
      drawUniqueBackdrop(cvs, {
        center: cal.backdropColors?.center || '#363738',
        edge: cal.backdropColors?.edge || '#0e0f0f',
        pattern: cal.backdropColors?.edge || '#000000'
      }, null);
    }

    const updateUI = () => {
      const s = calcSummary();
      const discLbl = body.querySelector('#calTradeDiscountLbl');
      const discRow = body.querySelector('#calDiscountRow');
      const discVal = body.querySelector('#calDiscountVal');
      const finalEl = body.querySelector('#calFinalPriceVal');
      const btnTxt = body.querySelector('#btnConfirmBuyCalendarTxt');

      if (discLbl) discLbl.textContent = `-${fmtInt(s.discount)} ⭐ chegirma`;
      if (discRow) discRow.hidden = s.discount <= 0;
      if (discVal) discVal.textContent = `-${fmtInt(s.discount)} ⭐`;
      if (finalEl) finalEl.innerHTML = `${svgStar(15)} ${fmtInt(s.finalPrice)}`;
      if (btnTxt) {
        btnTxt.innerHTML = s.hasEnough
          ? `📅 Xarid qilish va PaxtaGram'ga olish · ${svgStar(15)} ${fmtInt(s.finalPrice)}`
          : `⭐ Stars toʻldirish va olish (+${fmtInt(s.deficit)} ⭐)`;
      }
    };

    body.querySelectorAll('[data-trade-id]').forEach(el => {
      el.addEventListener('click', () => {
        const gid = el.getAttribute('data-trade-id');
        if (selectedTradeIds.has(gid)) {
          selectedTradeIds.delete(gid);
          el.classList.remove('selected');
        } else {
          if (selectedTradeIds.size >= 3) {
            return showToast('Koʻpi bilan 3 ta sovgʻa Trade-In qilish mumkin');
          }
          selectedTradeIds.add(gid);
          el.classList.add('selected');
        }
        updateUI();
      });
    });

    const executePurchase = async () => {
      const s = calcSummary();
      const recipientUsername = (body.querySelector('#inpCalRecipient')?.value || STATE.user?.username || '').trim().replace(/^@/, '');
      if (!recipientUsername) return showToast('PaxtaGram @username kiriting');

      if (!s.hasEnough) {
        openAddStarsModal(s.deficit, `Desk Calendar #${cal.number} (Real NFT) xaridi`, async () => {
          await executePurchase();
        });
        return;
      }

      const btn = body.querySelector('#btnConfirmBuyCalendar');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ PaxtaGram NFT rasmiylashtirilmoqda...';
      }

      const res = await api('/api/channel-calendars/buy', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.user.username,
          calendarId: cal.id,
          tradeInGiftIds: Array.from(selectedTradeIds),
          recipientUsername
        })
      });

      if (!res.ok) {
        if (btn) {
          btn.disabled = false;
          updateUI();
        }
        if (res.needStars) {
          openAddStarsModal(res.deficit || s.finalPrice, `Desk Calendar #${cal.number} (Real NFT) xaridi`);
          return;
        }
        return showToast(res.error || 'Xatolik yuz berdi');
      }

      closeSubModal();
      launchEdgeConfetti();
      showToast(res.message || `🎉 Desk Calendar #${cal.number} xarid qilindi!`);
      await Promise.all([loginUser(STATE.user.username), loadCollections()]);
      STATE.viewedProfile = null;
      switchTab('inventory');
      if (res.gift) openGiftModal(res.gift, 'view');
    };

    body.querySelector('#btnConfirmBuyCalendar')?.addEventListener('click', executePurchase);
  });
}

async function loadMarket() {
  const data = await api('/api/market');
  if (data.ok) {
    STATE.marketListings = data.listings || [];
    const badge = document.getElementById('marketCountBadge');
    if (badge) badge.textContent = STATE.marketListings.length;
    renderMarket();
  }
}

async function loadExploreData(query = '') {
  const [uRes, fRes] = await Promise.all([
    api(`/api/users?q=${encodeURIComponent(query)}`),
    api('/api/feed')
  ]);
  if (uRes.ok) STATE.collectors = uRes.users || [];
  if (fRes.ok) STATE.activity = fRes.activity || [];
  renderExplore();
}

async function loadAdminData() {
  if (!STATE.user?.isAdmin) return;
  const [dataCols, dataUsers, dataPromos] = await Promise.all([
    api('/api/admin/collections'),
    api('/api/admin/users'),
    api('/api/admin/promocodes')
  ]);
  if (dataCols && dataCols.ok) {
    STATE.adminCollections = dataCols.collections || [];
    STATE.adminStats = {
      usersCount: dataCols.usersCount || 0,
      totalGifts: dataCols.totalGifts || 0,
      burnedGifts: dataCols.burnedGifts || 0,
      marketCount: dataCols.marketCount || 0
    };
  }
  if (dataUsers && dataUsers.ok) {
    STATE.adminUsers = dataUsers.users || [];
  }
  if (dataPromos && dataPromos.ok) {
    STATE.adminPromos = dataPromos.promocodes || [];
  }
  renderAdminPanel();
}

async function openUserProfile(username) {
  if (!username) return;
  const clean = String(username).replace(/^@/, '').trim().toLowerCase();
  if (STATE.user && clean === STATE.user.username) {
    STATE.viewedProfile = null;
    switchTab('inventory');
    renderProfileView();
    return;
  }
  const res = await api(`/api/users/${encodeURIComponent(clean)}/profile?viewer=${encodeURIComponent(STATE.user?.username || '')}`);
  if (!res.ok) {
    return showToast(res.error || 'Profil topilmadi');
  }
  STATE.viewedProfile = res.profile;
  STATE.invFilter = 'all';
  document.querySelectorAll('#paneInventory .filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.filter === 'all');
  });
  switchTab('inventory');
  renderProfileView();
}

function renderHeaderUser() {
  if (!STATE.user) return;
  const disp = STATE.user.displayName || STATE.user.username || 'Foydalanuvchi';
  const initial = disp.charAt(0).toUpperCase();
  document.getElementById('userStars').textContent = fmtInt(STATE.user.stars);
  document.getElementById('userDisplayName').textContent = disp;
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('invCountBadge').textContent = STATE.inventory.length;
}

// ---- Render Shop Catalog ----
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!STATE.collections.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>Hozircha doʻkonda faol sovgʻalar yoʻq</strong>
        <span>Tez orada yangi kolleksiyalar qoʻshiladi.</span>
      </div>
    `;
    return;
  }

  for (const c of STATE.collections) {
    const el = document.createElement('div');
    el.className = 'catalog-card';
    el.innerHTML = `
      <span class="catalog-card-supply">${fmtInt(c.remainingToBuy)} / ${fmtInt(c.supply)}</span>
      <img class="catalog-card-art" src="${esc(c.thumb)}" alt="${esc(c.name)}" loading="lazy" />
      <div class="catalog-card-name">${esc(c.name)}</div>
      <div class="catalog-card-meta">${c.modelsCount || 28} noyob model${c.craftModelsCount ? ` · ${c.craftModelsCount} craft model` : ''}</div>
      <div class="catalog-card-price">${svgStar(14)}<span>${fmtInt(c.base)}</span></div>
    `;
    el.addEventListener('click', () => openBuyCollectionSheet(c));
    grid.appendChild(el);
  }
}

// ---- Update Market Live Stats (Fragment / OpenSea style) ----
function updateMarketStats() {
  const list = STATE.marketListings || [];
  const totalCount = list.length;
  const prices = list.map(g => g.salePrice || 0).filter(p => p > 0);
  const floorPrice = prices.length ? Math.min(...prices) : 0;
  const totalVolume = prices.reduce((s, p) => s + p, 0);
  const sellers = new Set(list.map(g => g.owner).filter(Boolean)).size;

  const totalEl = document.getElementById('marketStatTotalCount');
  const floorEl = document.getElementById('marketStatFloorPrice');
  const volEl = document.getElementById('marketStatTotalVolume');
  const sellersEl = document.getElementById('marketStatSellersCount');

  if (totalEl) totalEl.textContent = `${fmtInt(totalCount)} ta`;
  if (floorEl) floorEl.textContent = floorPrice > 0 ? `${fmtInt(floorPrice)} ⭐` : '--';
  if (volEl) volEl.textContent = totalVolume > 0 ? `${fmtInt(totalVolume)} ⭐` : '--';
  if (sellersEl) sellersEl.textContent = `${fmtInt(sellers)} ta`;
}

// ---- Render Secondary Resale Market (Qayta Sotuv Bozori) ----
function renderMarket() {
  updateMarketStats();
  const grid = document.getElementById('marketGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const q = STATE.marketQuery.trim().toLowerCase().replace(/^#/, '').replace(/^@/, '');
  let list = STATE.marketListings.filter(g => {
    if (STATE.marketFilter === 'crafted' && !g.crafted) return false;
    if (STATE.marketFilter === 'durovscap' && g.slug !== 'durovscap') return false;
    if (STATE.marketFilter === 'imperialcrown' && g.slug !== 'imperialcrown') return false;
    if (STATE.marketFilter === 'icecream' && g.slug !== 'icecream') return false;
    if (q) {
      const matchName = (g.name || '').toLowerCase().includes(q);
      const matchModel = (g.model?.name || '').toLowerCase().includes(q);
      const matchOwner = (g.owner || '').toLowerCase().includes(q) || (g.ownerDisplayName || '').toLowerCase().includes(q);
      const matchNum = String(g.number || '') === q;
      if (!matchName && !matchModel && !matchOwner && !matchNum) return false;
    }
    return true;
  });

  if (STATE.marketFilter === 'price_asc') {
    list.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
  } else if (STATE.marketFilter === 'price_desc') {
    list.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
  } else if (STATE.marketFilter === 'num_asc') {
    list.sort((a, b) => (a.number || 999999) - (b.number || 999999));
  }

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>Marketda mos sovgʻalar topilmadi</strong>
        <span>Profilingizdagi yaxshilangan (Upgraded) sovgʻani «Sotish» tugmasi orqali Marketga chiqarishingiz mumkin!</span>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyListGift">+ Sovgʻamni sotuvga qoʻyish</button>
      </div>
    `;
    grid.querySelector('#btnEmptyListGift')?.addEventListener('click', openListMyGiftPickerModal);
    return;
  }

  renderGridInChunks(grid, list, g => buildGiftCard(g, { isMarketCard: true }), 48);
}

async function buyMarketGift(gift) {
  if (!STATE.user) return showToast('Avval tizimga kiring');
  if (gift.owner === STATE.user.username) {
    return showToast('Bu sizning oʻz sovgʻangiz');
  }
  const price = gift.salePrice || 250;
  if ((STATE.user.stars || 0) < price) {
    const deficit = Math.max(1, price - (STATE.user.stars || 0));
    openAddStarsModal(deficit, `${gift.name} #${gift.number} xarid qilish`, async () => {
      await buyMarketGift(gift);
    });
    return;
  }

  const res = await api('/api/market/buy', {
    method: 'POST',
    body: JSON.stringify({
      username: STATE.user.username,
      giftId: gift.id
    })
  });
  if (!res.ok) {
    if (res.needStars) {
      openAddStarsModal(res.deficit || price, `${gift.name} #${gift.number} xarid qilish`);
      return;
    }
    return showToast(res.error || 'Sotib olishda xatolik');
  }

  closeGiftModal();
  launchEdgeConfetti();
  showToast(`🎉 ${gift.name} #${gift.number} xarid qilindi!`);
  await Promise.all([loginUser(STATE.user.username), loadMarket()]);
  switchTab('inventory');
  openGiftModal(res.gift, 'view');
}

// ---- Render Telegram-Style Collectible Profile (Own Profile OR Another User's Profile) ----
function renderProfileView() {
  const prof = STATE.viewedProfile || STATE.myProfile || {
    username: STATE.user?.username || 'user',
    displayName: STATE.user?.displayName || 'Foydalanuvchi',
    bio: STATE.user?.bio || '',
    stats: {
      totalGifts: STATE.inventory.length,
      upgradedCount: STATE.inventory.filter(g => g.state === 'upgraded').length,
      craftedCount: STATE.inventory.filter(g => g.crafted).length,
      onSaleCount: STATE.inventory.filter(g => g.salePrice > 0).length,
      collectionValue: STATE.inventory.reduce((s, g) => s + (g.valueStars || 250), 0)
    },
    wornGift: STATE.inventory.find(g => g.worn && g.state === 'upgraded') || null,
    pinnedGifts: STATE.inventory.filter(g => g.pinned && g.state === 'upgraded').slice(0, 6),
    gifts: STATE.inventory
  };

  const isOwn = !STATE.viewedProfile || (STATE.user && prof.username === STATE.user.username);
  const disp = prof.displayName || prof.username || 'Foydalanuvchi';
  const initial = disp.charAt(0).toUpperCase();

  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = disp;
  document.getElementById('profileUsernameHandle').textContent = `@${prof.username}`;
  document.getElementById('profileBioText').textContent =
    prof.bio || (isOwn
      ? 'Sovgʻani bosing — Upgrade, Craft, profilga qadash, sarlavhaga taqish yoki boshqa profilga oʻtkazish uchun'
      : `@${prof.username} ning rasmiy Paxta Gifts kolleksiyasi`);

  document.getElementById('btnBackToMyProfile').hidden = isOwn;
  document.getElementById('btnEditBio').hidden = !isOwn;
  const profActShop = document.getElementById('profActShop');
  const profActStars = document.getElementById('profActStars');
  if (profActShop) profActShop.hidden = !isOwn;
  if (profActStars) profActStars.hidden = !isOwn;
  const regFilterBtn = document.getElementById('filterBtnRegular');
  if (regFilterBtn) regFilterBtn.hidden = !isOwn;

  // Paxta ID Pill
  const idEl = document.getElementById('profileIdTag');
  if (idEl) {
    const pId = prof.paxtaId || prof.id || (isOwn && STATE.user?.paxtaId) || (isOwn && STATE.user?.id) || 100;
    idEl.textContent = `ID: ${pId}`;
  }

  // Worn Gift Status Badge (Crown + Gift Icon next to Name)
  const wornGift = prof.wornGift;
  const badge = document.getElementById('profileWornBadge');
  const crown = document.getElementById('profileAvatarCrown');
  if (wornGift && wornGift.model) {
    badge.hidden = false;
    crown.hidden = false;
    badge.innerHTML = `<img src="${esc(wornGift.model.img)}" alt="" /><span>${esc(wornGift.name)} #${wornGift.number}</span>`;
    badge.onclick = () => openGiftModal(wornGift, 'view');
  } else {
    badge.hidden = true;
    crown.hidden = true;
    badge.onclick = null;
  }

  // Draw Telegram-style Radial Backdrop Banner from Worn Gift or Top Pinned Gift
  const bannerCanvas = document.getElementById('profileBannerCanvas');
  const heroGift = wornGift || (prof.pinnedGifts && prof.pinnedGifts[0]) || (prof.gifts || []).find(g => g.state === 'upgraded');
  if (bannerCanvas) {
    if (heroGift && heroGift.backdrop) {
      requestAnimationFrame(() => drawUniqueBackdrop(bannerCanvas, heroGift.backdrop, heroGift.symbol));
    } else {
      requestAnimationFrame(() => drawUniqueBackdrop(bannerCanvas, {
        center: '#283048',
        edge: '#111522',
        pattern: '#323c59'
      }, null));
    }
  }

  // Floating Pinned Gift Icons around the Telegram Profile Banner
  const floatWrap = document.getElementById('profileFloatingPins');
  if (floatWrap) {
    floatWrap.innerHTML = '';
    const pinPositions = [
      { top: '16%', left: '6%', delay: '0s' },
      { top: '52%', left: '10%', delay: '0.7s' },
      { top: '16%', right: '6%', delay: '0.35s' },
      { top: '52%', right: '10%', delay: '1.1s' },
      { top: '34%', left: '18%', delay: '0.5s' },
      { top: '34%', right: '18%', delay: '0.9s' }
    ];
    (prof.pinnedGifts || []).slice(0, 6).forEach((pg, idx) => {
      const pos = pinPositions[idx % pinPositions.length];
      const pinEl = document.createElement('div');
      pinEl.className = 'tg-floating-pin';
      if (pos.top) pinEl.style.top = pos.top;
      if (pos.left) pinEl.style.left = pos.left;
      if (pos.right) pinEl.style.right = pos.right;
      pinEl.style.animationDelay = pos.delay;
      pinEl.title = `${pg.name} #${pg.number}`;
      pinEl.innerHTML = `<img src="${esc(pg.model?.img || pg.thumb)}" alt="" />`;
      pinEl.addEventListener('click', () => openGiftModal(pg, 'view'));
      floatWrap.appendChild(pinEl);
    });
  }

  // Profile Stats Row (Modern Glass Metrics)
  const stats = prof.stats || {};
  const statsRow = document.getElementById('profileStatsRow');
  if (statsRow) {
    statsRow.innerHTML = `
      <div class="tg-stat-pill">
        <div class="stat-pill-icon">🎁</div>
        <div class="stat-pill-data">
          <strong>${fmtInt(stats.totalGifts || 0)}</strong>
          <span>Jami sovgʻa</span>
        </div>
      </div>
      <div class="tg-stat-pill">
        <div class="stat-pill-icon">🌟</div>
        <div class="stat-pill-data">
          <strong>${fmtInt(stats.upgradedCount || 0)}</strong>
          <span>Noyob (Upgraded)</span>
        </div>
      </div>
      <div class="tg-stat-pill">
        <div class="stat-pill-icon">🔮</div>
        <div class="stat-pill-data">
          <strong>${fmtInt(stats.craftedCount || 0)}</strong>
          <span>Craft modellar</span>
        </div>
      </div>
      <div class="tg-stat-pill tg-stat-gold">
        <div class="stat-pill-icon gold-star">${svgStar(16)}</div>
        <div class="stat-pill-data">
          <strong style="color:var(--saffron);">${fmtInt(stats.collectionValue || 0)} ⭐</strong>
          <span>Kolleksiya qiymati</span>
        </div>
      </div>
    `;
  }

  // Pinned Showcase Section (📌 Profilga qadalgan sovgʻalar / Vitrina)
  const pinnedSec = document.getElementById('pinnedShowcaseSection');
  const pinnedGrid = document.getElementById('pinnedGiftsGrid');
  const pinnedCountLbl = document.getElementById('pinnedCountLabel');
  const pinnedList = prof.pinnedGifts || [];
  if (pinnedSec && pinnedGrid) {
    if (pinnedList.length > 0) {
      pinnedSec.hidden = false;
      if (pinnedCountLbl) pinnedCountLbl.textContent = `${pinnedList.length} / 6 qadalgan`;
      pinnedGrid.innerHTML = '';
      for (const pg of pinnedList) {
        pinnedGrid.appendChild(buildGiftCard(pg));
      }
    } else {
      pinnedSec.hidden = !isOwn;
      if (isOwn) {
        pinnedGrid.innerHTML = `
          <div class="empty-showcase-box">
            <span>✨ Vitrinangiz hozircha boʻsh. Sovgʻangizni ochib «Profilga qadash» tugmasini bossangiz, bu yerda koʻrinadi!</span>
          </div>
        `;
        if (pinnedCountLbl) pinnedCountLbl.textContent = `0 / 6`;
      }
    }
  }

  renderInventoryGrid(prof.gifts || [], isOwn, prof.username);
}

function renderInventory() {
  renderProfileView();
}

function renderInventoryGrid(giftsList, isOwn, profileUsername) {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const selectBtn = document.getElementById('btnToggleSelectMode');
  const selectText = document.getElementById('btnToggleSelectModeText');
  const batchBar = document.getElementById('batchBurnBar');

  if (selectBtn) {
    selectBtn.style.display = isOwn ? 'inline-flex' : 'none';
    selectBtn.classList.toggle('active', STATE.selectMode);
    if (selectText) selectText.textContent = STATE.selectMode ? 'Bekor qilish' : 'Tanlash';
  }

  if (batchBar) {
    batchBar.hidden = !(STATE.selectMode && isOwn);
  }

  const filtered = giftsList.filter(g => {
    if (STATE.invFilter === 'worn') return !!g.worn;
    if (STATE.invFilter === 'pinned') return !!g.pinned;
    if (STATE.invFilter === 'upgraded') return g.state === 'upgraded';
    if (STATE.invFilter === 'crafted') return g.state === 'upgraded' && g.crafted;
    if (STATE.invFilter === 'regular') return g.state === 'regular';
    if (STATE.invFilter === 'sale') return g.salePrice > 0;
    return true;
  });

  if (STATE.selectMode && isOwn) {
    updateBatchBurnBar(filtered);
  }

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>${isOwn ? 'Bu boʻlimda hozircha sovgʻalar yoʻq' : `@${esc(profileUsername)} profilida hozircha sovgʻalar yoʻq`}</strong>
        <span>${isOwn ? 'Doʻkon yoki Market boʻlimidan sovgʻa xarid qiling!' : 'Boshqa kolleksionerlarni «🏆 Odamlar & Jonli» boʻlimidan koʻrishingiz mumkin.'}</span>
        ${isOwn ? `<button type="button" class="btn btn-primary btn-sm" id="btnGoToShopEmpty">Doʻkonga oʻtish</button>` : ''}
      </div>
    `;
    grid.querySelector('#btnGoToShopEmpty')?.addEventListener('click', () => switchTab('shop'));
    return;
  }

  renderGridInChunks(grid, filtered, g => buildGiftCard(g, {
    isSelectMode: STATE.selectMode && isOwn,
    isSelected: STATE.selectedGiftIds.has(g.id),
    onToggleSelect: (gift) => handleToggleGiftSelection(gift, filtered)
  }), 48);
}

function handleToggleGiftSelection(g, allGifts) {
  if (g.salePrice && g.salePrice > 0) {
    return showToast('Sotuvda turgan sovgʻani yoqib boʻlmaydi. Avval sotuvdan oling.');
  }

  if (STATE.selectedGiftIds.has(g.id)) {
    STATE.selectedGiftIds.delete(g.id);
  } else {
    if (STATE.selectedGiftIds.size >= 10) {
      return showToast('⚠️ Bir vaqtda koʻpi bilan 10 ta sovgʻa tanlash mumkin');
    }
    STATE.selectedGiftIds.add(g.id);
  }
  updateBatchBurnBar(allGifts);
  renderInventory();
}

function updateBatchBurnBar(giftsList) {
  const bar = document.getElementById('batchBurnBar');
  if (!bar) return;
  const count = STATE.selectedGiftIds.size;
  const countEl = document.getElementById('batchBurnCount');
  const refundEl = document.getElementById('batchBurnRefund');
  const submitBtn = document.getElementById('btnBatchBurnSubmit');

  if (countEl) countEl.textContent = `${count} / 10`;

  if (refundEl) {
    refundEl.innerHTML = count > 0 ? `<span style="color:#ff8585;font-weight:600;">Butunlay yoʻq qilish</span>` : `Sovgʻalarni tanlang`;
  }
  if (submitBtn) {
    submitBtn.disabled = count === 0;
    submitBtn.innerHTML = count > 0 ? `🔥 Yoqish (${count} ta)` : '🔥 Yoqish (Burn)';
  }
}

async function executeBatchBurn() {
  const count = STATE.selectedGiftIds.size;
  if (!count) return;

  const prof = STATE.viewedProfile || STATE.myProfile || {};
  const allGifts = prof.gifts || [];
  const selectedNames = [];

  for (const g of allGifts) {
    if (STATE.selectedGiftIds.has(g.id)) {
      selectedNames.push(g.name + (g.number ? ` #${g.number}` : ''));
    }
  }

  openSubModal(`🔥 Sovgʻalarni yoqish (Burn)`, `
    <div class="form-stack" style="text-align:center;align-items:center;">
      <div style="font-size:46px;margin:4px 0;animation:burnPulse 1s infinite alternate;">🔥</div>
      <h3 style="margin:0;font-size:18px;">${count} ta sovgʻani yoqmoqchimisiz?</h3>
      <p style="font-size:13px;color:var(--text-2);line-height:1.45;margin:4px 0 10px 0;">
        Diqqat: Tanlangan sovgʻalar <b>butunlay yoʻq qilinadi (burn qilinadi)</b> va muomaladan chiqariladi. Bu amalni ortga qaytarib boʻlmaydi.
      </p>
      <div style="background:rgba(255,255,255,0.06);padding:10px 14px;border-radius:12px;width:100%;text-align:left;max-height:130px;overflow-y:auto;font-size:12.5px;">
        ${selectedNames.map(n => `<div style="padding:4px 0;display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05);"><span>${esc(n)}</span><span style="color:#ff8585;font-weight:600;">🔥 Yoqiladi</span></div>`).join('')}
      </div>
      <button type="button" class="btn btn-danger gv-btn" id="btnConfirmBatchBurn" style="height:44px;font-size:15px;margin-top:10px;">
        🔥 Ha, butunlay yoqish (${count} ta)
      </button>
      <button type="button" class="btn btn-secondary gv-btn" id="btnCancelBatchBurn" style="height:38px;">
        Bekor qilish
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnCancelBatchBurn')?.addEventListener('click', closeSubModal);
    body.querySelector('#btnConfirmBatchBurn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Yoqilmoqda...';

      const res = await api('/api/gifts/burn', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.user.username,
          giftIds: Array.from(STATE.selectedGiftIds)
        })
      });

      if (!res.ok) {
        btn.disabled = false;
        btn.textContent = 'Qayta urinish';
        return showToast(res.error || 'Xatolik yuz berdi');
      }

      closeSubModal();
      STATE.selectMode = false;
      STATE.selectedGiftIds.clear();
      const bBar = document.getElementById('batchBurnBar');
      if (bBar) bBar.hidden = true;

      await loginUser(STATE.user.username);
      showToast(`🔥 ${res.burnedCount} ta sovgʻa butunlay yoqildi!`);
      renderProfileView();
    });
  });
}

function buildGiftCard(g, opts = {}) {
  const card = document.createElement('div');
  card.className = `gift-card ${g.state === 'regular' ? 'is-regular' : 'is-upgraded'}`;

  if (opts.isSelectMode) {
    card.classList.add('is-select-mode');
    const isSel = !!opts.isSelected;
    if (isSel) card.classList.add('is-selected');

    const check = document.createElement('div');
    check.className = 'gift-card-check';
    check.innerHTML = isSel ? '✓' : '';
    card.appendChild(check);
  }

  if (g.state === 'upgraded' && g.backdrop) {
    const cvs = document.createElement('canvas');
    cvs.className = 'unique-backdrop';
    card.appendChild(cvs);
    scheduleBackdropDraw(cvs, g.backdrop, g.symbol, { compact: true });
  }

  if (g.isRealPaxtaNft) {
    const rib = document.createElement('div');
    rib.className = 'real-nft-ribbon';
    rib.textContent = '📅 REAL NFT';
    card.appendChild(rib);
  } else if (g.crafted) {
    const rib = document.createElement('div');
    rib.className = 'gift-card-crafted-ribbon';
    rib.textContent = '✨ CRAFT';
    card.appendChild(rib);
  }

  const top = document.createElement('div');
  top.className = 'gift-card-top';
  if (g.state === 'upgraded') {
    const leftBadges = [];
    if (g.pinned && !opts.isMarketCard) leftBadges.push('📌');
    if (g.worn && !opts.isMarketCard) leftBadges.push('👑');
    if (g.salePrice > 0 && !opts.isMarketCard) leftBadges.push(`🏷 ⭐${fmtInt(g.salePrice)}`);
    top.innerHTML = `
      <span class="gift-card-badge" style="${leftBadges.length ? '' : 'visibility:hidden'}">${leftBadges.join(' ') || '·'}</span>
      <span class="gift-card-num">${formatGiftNum(g.number)}</span>
    `;
  } else {
    top.innerHTML = `
      <span class="gift-card-badge">Oddiy</span>
      <span class="gift-card-num">Upgrade: ⭐ ${fmtInt(g.upgradePrice)}</span>
    `;
  }
  card.appendChild(top);

  const img = document.createElement('img');
  img.className = 'gift-card-art';
  img.src = g.state === 'upgraded' && g.model ? g.model.img : g.thumb;
  img.alt = g.name;
  img.loading = 'lazy';
  img.onerror = () => {
    if (g.thumb && img.src !== g.thumb) {
      img.src = g.thumb;
    }
  };
  card.appendChild(img);

  const foot = document.createElement('div');
  foot.className = 'gift-card-foot';
  if (opts.isMarketCard) {
    const sInit = (g.owner || 'U').charAt(0).toUpperCase();
    foot.innerHTML = `
      <div class="gift-card-title">${esc(g.name)} ${formatGiftNum(g.number)}</div>
      <div class="gift-card-sub">${esc(g.model?.name || '')}</div>
      <div class="market-seller-row" data-seller="${esc(g.owner)}">
        <span class="seller-avatar-mini">${esc(sInit)}</span>
        <span class="seller-uname">@${esc(g.owner)}</span>
        <svg class="seller-verified-mini" viewBox="0 0 24 24" width="13" height="13" fill="#3b99fc"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </div>
      <button type="button" class="market-buy-pill" title="Xarid qilish">
        ${svgStar(14)}
        <span>${fmtInt(g.salePrice)}</span>
        <span class="market-buy-txt">Xarid</span>
      </button>
    `;
    foot.querySelector('[data-seller]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openUserProfile(g.owner);
    });
    foot.querySelector('.market-buy-pill')?.addEventListener('click', (e) => {
      e.stopPropagation();
      buyMarketGift(g);
    });
  } else if (g.state === 'upgraded') {
    foot.innerHTML = `
      <div class="gift-card-title">${esc(g.name)} ${formatGiftNum(g.number)}</div>
      <div class="gift-card-sub">${esc(g.model?.name || '')}</div>
    `;
  } else {
    foot.innerHTML = `
      <div class="gift-card-title">${esc(g.name)}</div>
      <div class="gift-card-sub">✨ Yaxshilash (Upgrade)</div>
    `;
  }
  card.appendChild(foot);

  if (opts.isSelectMode) {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onToggleSelect && opts.onToggleSelect(g);
    });
  } else {
    card.addEventListener('click', () => openGiftModal(g, 'view'));
  }

  return card;
}

// ---- Render Collectors Directory & Live Activity Feed ----
function renderExplore() {
  const colEl = document.getElementById('collectorsList');
  const actEl = document.getElementById('activityList');
  if (colEl) {
    colEl.innerHTML = '';
    if (!STATE.collectors.length) {
      colEl.innerHTML = `<div class="empty-box" style="padding:24px;"><span>Hozircha kolleksionerlar topilmadi</span></div>`;
    } else {
      STATE.collectors.forEach((u, idx) => {
        const row = document.createElement('div');
        row.className = 'collector-row';
        const init = (u.displayName || u.username || 'U').charAt(0).toUpperCase();
        row.innerHTML = `
          <div class="collector-left">
            <span class="collector-rank">#${idx + 1}</span>
            <span class="avatar avatar-sm">${esc(init)}</span>
            <div class="collector-info">
              <div class="collector-name">
                <span>${esc(u.displayName || u.username)}</span>
                ${u.wornGift?.model?.img ? `<img src="${esc(u.wornGift.model.img)}" title="👑 ${esc(u.wornGift.name)} #${u.wornGift.number}" />` : ''}
              </div>
              <div class="collector-sub">@${esc(u.username)} · ${fmtInt(u.stats?.totalGifts || 0)} ta sovgʻa · ⭐ ${fmtInt(u.stats?.collectionValue || 0)}</div>
            </div>
          </div>
          <div class="collector-pins">
            ${(u.pinnedPreviews || []).map(p => `<img src="${esc(p.img)}" title="📌 ${esc(p.name)} #${p.number}" />`).join('')}
          </div>
        `;
        row.addEventListener('click', () => openUserProfile(u.username));
        colEl.appendChild(row);
      });
    }
  }

  if (actEl) {
    actEl.innerHTML = '';
    if (!STATE.activity.length) {
      actEl.innerHTML = `<div class="empty-box" style="padding:24px;"><span>Hozircha harakatlar tarixi boʻsh</span></div>`;
    } else {
      for (const a of STATE.activity) {
        const row = document.createElement('div');
        row.className = 'activity-row';
        let descHtml = '';
        if (a.type === 'upgrade') {
          descHtml = `<b data-u="${esc(a.actor)}">@${esc(a.actor)}</b> oʻzining <b data-g="${esc(a.giftId)}">${esc(a.giftName)} #${fmtInt(a.giftNumber)}</b> sovgʻasini yaxshiladi (${esc(a.modelName || '')})`;
        } else if (a.type === 'craft') {
          descHtml = `🔨 <b data-u="${esc(a.actor)}">@${esc(a.actor)}</b> maxfiy <b data-g="${esc(a.giftId)}">${esc(a.giftName)} #${fmtInt(a.giftNumber)} (${esc(a.modelName || '')})</b> modelini Craft qildi!`;
        } else if (a.type === 'market_sale') {
          descHtml = `🏷 <b data-u="${esc(a.actor)}">@${esc(a.actor)}</b> Marketdan <b data-g="${esc(a.giftId)}">${esc(a.giftName)} #${fmtInt(a.giftNumber)}</b> ni <b>⭐ ${fmtInt(a.price)}</b> ga sotib oldi`;
        } else if (a.type === 'transfer') {
          descHtml = `🔄 <b data-u="${esc(a.actor)}">@${esc(a.actor)}</b> → <b data-u="${esc(a.target)}">@${esc(a.target)}</b> ga <b data-g="${esc(a.giftId)}">${esc(a.giftName)}${a.giftNumber ? ' #' + a.giftNumber : ''}</b> yubordi`;
        } else {
          descHtml = `🎁 <b data-u="${esc(a.actor)}">@${esc(a.actor)}</b> doʻkondan <b>${esc(a.giftName)}</b> xarid qildi`;
        }

        row.innerHTML = `
          <div class="activity-left">
            <img class="activity-thumb" src="${esc(a.thumb || '/a/coinflip/thumb.webp')}" alt="" />
            <div class="activity-text">${descHtml}</div>
          </div>
        `;
        row.querySelectorAll('[data-u]').forEach(el => {
          el.addEventListener('click', () => openUserProfile(el.getAttribute('data-u')));
        });
        const openActGift = async (gid) => {
          if (!gid) return;
          const r = await api(`/api/gifts/${encodeURIComponent(gid)}`);
          if (r.ok && r.gift) openGiftModal(r.gift, 'view');
        };
        row.querySelectorAll('[data-g]').forEach(el => {
          el.addEventListener('click', () => openActGift(el.getAttribute('data-g')));
        });
        row.querySelector('.activity-thumb')?.addEventListener('click', () => openActGift(a.giftId));
        actEl.appendChild(row);
      }
    }
  }
}

// ---- Render Admin Panel (Strictly ID 100 Only) ----
function renderAdminPanel() {
  if (!STATE.user?.isAdmin) return;
  const statsRow = document.getElementById('adminStatsRow');
  if (!statsRow) return;

  const enabledCount = STATE.adminCollections.filter(c => c.enabled).length;
  statsRow.innerHTML = `
    <div class="admin-stat-card">
      <strong>${enabledCount} / ${STATE.adminCollections.length}</strong>
      <span>Doʻkonda yoqilgan kolleksiyalar</span>
    </div>
    <div class="admin-stat-card">
      <strong>${fmtInt(STATE.adminStats.totalGifts)}</strong>
      <span>Foydalanuvchilardagi faol sovgʻalar</span>
    </div>
    <div class="admin-stat-card">
      <strong>${fmtInt(STATE.adminStats.marketCount || 0)}</strong>
      <span>Marketda sotuvdagi sovgʻalar</span>
    </div>
    <div class="admin-stat-card">
      <strong>${fmtInt(STATE.adminStats.usersCount || STATE.adminUsers.length)}</strong>
      <span>Roʻyxatdan oʻtgan foydalanuvchilar</span>
    </div>
  `;

  // Subtabs switching
  document.querySelectorAll('.admin-subnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === STATE.adminSubtab);
  });

  const paneCols = document.getElementById('adminSubpaneCollections');
  const paneUsers = document.getElementById('adminSubpaneUsers');
  const panePromos = document.getElementById('adminSubpanePromos');

  if (paneCols) paneCols.hidden = STATE.adminSubtab !== 'collections';
  if (paneUsers) paneUsers.hidden = STATE.adminSubtab !== 'users';
  if (panePromos) panePromos.hidden = STATE.adminSubtab !== 'promos';

  if (STATE.adminSubtab === 'collections') {
    renderAdminCollections();
  } else if (STATE.adminSubtab === 'users') {
    renderAdminUsers();
  } else if (STATE.adminSubtab === 'promos') {
    renderAdminPromos();
  }
}

function renderAdminCollections() {
  const listEl = document.getElementById('adminList');
  if (!listEl) return;

  const q = STATE.adminQuery.trim().toLowerCase();
  const filtered = STATE.adminCollections.filter(c => {
    if (STATE.adminFilter === 'enabled' && !c.enabled) return false;
    if (STATE.adminFilter === 'disabled' && c.enabled) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.slug.includes(q)) return false;
    return true;
  });

  listEl.innerHTML = '';
  for (const c of filtered) {
    const row = document.createElement('div');
    row.className = `admin-row ${c.enabled ? 'is-enabled' : ''}`;
    row.innerHTML = `
      <div class="admin-row-left">
        <img class="admin-row-thumb" src="${esc(c.thumb)}" alt="" loading="lazy" />
        <div class="admin-row-info">
          <strong>
            <span>${esc(c.name)}</span>
            <span class="admin-status-pill ${c.enabled ? 'on' : 'off'}">${c.enabled ? 'Sotuvda' : 'Oʻchirilgan'}</span>
          </strong>
          <small>Sotilgan: ${fmtInt(c.totalMinted)} / ${fmtInt(c.supply)} · Yoqilgan: ${fmtInt(c.burnedCount)} · Modellar: ${c.modelsCount} oddiy + ${c.craftModelsCount} craft</small>
        </div>
      </div>

      <div class="admin-controls">
        <div class="admin-input-group">
          <label>Narxi (⭐)</label>
          <input type="number" data-field="price" value="${c.price}" min="1" />
        </div>
        <div class="admin-input-group">
          <label>Upgrade (⭐)</label>
          <input type="number" data-field="upgradePrice" value="${c.upgradePrice}" min="1" />
        </div>
        <div class="admin-input-group">
          <label>Tiraj (soni)</label>
          <input type="number" data-field="supply" value="${c.supply}" min="1" />
        </div>
        <button type="button" class="btn btn-tonal btn-sm" data-save="${esc(c.slug)}">Saqlash</button>
        <button type="button" class="btn ${c.enabled ? 'btn-tonal' : 'btn-primary'} btn-sm" data-toggle="${esc(c.slug)}">
          ${c.enabled ? 'Oʻchirish' : 'Yoqish'}
        </button>
      </div>
    `;

    row.querySelector(`[data-save="${c.slug}"]`).addEventListener('click', async () => {
      const price = parseInt(row.querySelector('[data-field="price"]').value, 10);
      const upgradePrice = parseInt(row.querySelector('[data-field="upgradePrice"]').value, 10);
      const supply = parseInt(row.querySelector('[data-field="supply"]').value, 10);
      const res = await api('/api/admin/collection', {
        method: 'POST',
        body: JSON.stringify({ slug: c.slug, price, upgradePrice, supply })
      });
      if (res.ok) {
        showToast(`${c.name} sozlamalari saqlandi!`);
        await Promise.all([loadAdminData(), loadCollections(), loginUser(STATE.user?.username)]);
      } else {
        showToast(res.error || 'Xatolik');
      }
    });

    row.querySelector(`[data-toggle="${c.slug}"]`).addEventListener('click', async () => {
      const res = await api('/api/admin/collection', {
        method: 'POST',
        body: JSON.stringify({ slug: c.slug, enabled: !c.enabled })
      });
      if (res.ok) {
        showToast(`${c.name}: ${!c.enabled ? 'Doʻkonda yoqildi' : 'Doʻkondan oʻchirildi'}`);
        await Promise.all([loadAdminData(), loadCollections()]);
      } else {
        showToast(res.error || 'Xatolik');
      }
    });

    listEl.appendChild(row);
  }
}

function renderAdminUsers() {
  const usersListEl = document.getElementById('adminUsersList');
  if (!usersListEl) return;

  const q = (STATE.adminUserQuery || '').trim().toLowerCase();
  const filtered = STATE.adminUsers.filter(u => {
    if (!q) return true;
    return (u.username && u.username.toLowerCase().includes(q)) ||
           (u.displayName && u.displayName.toLowerCase().includes(q)) ||
           (u.paxtaId && String(u.paxtaId).includes(q));
  });

  if (filtered.length === 0) {
    usersListEl.innerHTML = `<div class="empty-box">Foydalanuvchi topilmadi</div>`;
    return;
  }

  usersListEl.innerHTML = '';
  for (const u of filtered) {
    const card = document.createElement('div');
    card.className = 'admin-user-card';

    const letter = (u.displayName || u.username || 'U')[0].toUpperCase();
    const avatarHtml = u.avatarUrl
      ? `<img class="avatar" src="${esc(u.avatarUrl)}" alt="" />`
      : `<span class="avatar">${letter}</span>`;

    card.innerHTML = `
      <div class="admin-user-meta">
        ${avatarHtml}
        <div class="admin-user-details">
          <strong>
            <span>${esc(u.displayName || u.username)}</span>
            <small style="color:var(--text-3);">@${esc(u.username)}</small>
          </strong>
          <small>ID: ${u.paxtaId ? `<b>${u.paxtaId}</b>` : '—'} · Sovgʻalar: <b>${u.giftsCount || 0} ta</b> ${u.upgradedCount ? `(${u.upgradedCount} upgrade)` : ''}</small>
        </div>
      </div>

      <div class="admin-user-actions">
        <span class="admin-user-balance-badge" title="Joriy balans">
          ⭐ ${fmtInt(u.stars)}
        </span>
        <button type="button" class="btn btn-tonal btn-sm" data-quick-star="100" data-user="${esc(u.username)}">+100 ⭐</button>
        <button type="button" class="btn btn-tonal btn-sm" data-quick-star="500" data-user="${esc(u.username)}">+500 ⭐</button>
        <button type="button" class="btn btn-tonal btn-sm" data-quick-star="-100" data-user="${esc(u.username)}">-100 ⭐</button>
        <button type="button" class="btn btn-tonal btn-sm" data-edit-bal="${esc(u.username)}">✏️ Balans</button>
        <button type="button" class="btn btn-primary btn-sm" data-grant-gift="${esc(u.username)}">🎁 Sovgʻa berish</button>
      </div>
    `;

    // Quick star buttons
    card.querySelectorAll('[data-quick-star]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const delta = parseInt(btn.dataset.quickStar, 10);
        btn.disabled = true;
        const res = await api('/api/admin/user/balance', {
          method: 'POST',
          body: JSON.stringify({
            targetUsername: u.username,
            mode: 'delta',
            deltaStars: delta,
            reason: `Admin tezkor ${delta > 0 ? '+' : ''}${delta} ⭐`
          })
        });
        btn.disabled = false;
        if (res.ok) {
          showToast(`@${u.username} balansi: ⭐ ${fmtInt(res.stars)} (${delta > 0 ? '+' : ''}${delta})`);
          await loadAdminData();
          if (STATE.user && STATE.user.username === u.username) {
            STATE.user.stars = res.stars;
            const el = document.getElementById('userStars');
            if (el) el.textContent = fmtInt(res.stars);
          }
        } else {
          showToast(res.error || 'Xatolik');
        }
      });
    });

    // Custom balance edit
    card.querySelector(`[data-edit-bal="${u.username}"]`).addEventListener('click', () => {
      openAdminBalanceModal(u.username, u.stars);
    });

    // Grant gift
    card.querySelector(`[data-grant-gift="${u.username}"]`).addEventListener('click', () => {
      openAdminGrantGiftModal(u.username);
    });

    usersListEl.appendChild(card);
  }
}

function renderAdminPromos() {
  const promosListEl = document.getElementById('adminPromosList');
  if (!promosListEl) return;

  if (STATE.adminPromos.length === 0) {
    promosListEl.innerHTML = `<div class="empty-box">Hozircha hech qanday promokod yoʻq</div>`;
    return;
  }

  promosListEl.innerHTML = '';
  for (const p of STATE.adminPromos) {
    const card = document.createElement('div');
    card.className = 'admin-promo-card';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span class="admin-promo-code-badge">${esc(p.code)}</span>
        <div>
          <strong style="font-size:14px;display:block;">⭐ ${fmtInt(p.stars)} Stars</strong>
          <small style="color:var(--text-2);font-size:12px;">
            Foydalanildi: <b>${p.usedCount || 0} / ${p.maxUses || 0}</b> · Qoldi: <b>${p.remainingUses || 0}</b>
          </small>
        </div>
      </div>
      <div>
        <button type="button" class="btn btn-tonal btn-sm" data-del-promo="${esc(p.code)}" style="color:#ff6b6b;">
          🗑 Oʻchirish
        </button>
      </div>
    `;

    card.querySelector(`[data-del-promo="${p.code}"]`).addEventListener('click', async () => {
      if (!confirm(`Haqiqatan ham "${p.code}" promokodini oʻchirmoqchimisiz?`)) return;
      const res = await api('/api/admin/promocode', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', code: p.code })
      });
      if (res.ok) {
        showToast(`Promokod "${p.code}" oʻchirildi`);
        await loadAdminData();
      } else {
        showToast(res.error || 'Xatolik');
      }
    });

    promosListEl.appendChild(card);
  }
}

function openAdminBalanceModal(targetUsername, currentStars) {
  const html = `
    <div class="sheet-form">
      <div style="margin-bottom:12px;">
        <strong>Foydalanuvchi:</strong> @${esc(targetUsername)}<br/>
        <strong>Joriy balans:</strong> ⭐ ${fmtInt(currentStars)}
      </div>
      <div class="sheet-field">
        <label>Amal turi</label>
        <select id="adminBalMode" style="background:var(--field);color:var(--text);border:1px solid var(--line-strong);border-radius:10px;padding:8px 12px;font-weight:600;width:100%;">
          <option value="delta_add">Qoʻshish (+)</option>
          <option value="delta_sub">Kamaytirish (-)</option>
          <option value="set">Aniq balansni belgilash (=)</option>
        </select>
      </div>
      <div class="sheet-field" style="margin-top:10px;">
        <label>Miqdor (Stars ⭐)</label>
        <input type="number" id="adminBalAmount" value="100" min="0" style="font-size:16px;font-weight:700;width:100%;" autofocus />
      </div>
      <div class="sheet-field" style="margin-top:10px;">
        <label>Sabab (Izoh)</label>
        <input type="text" id="adminBalReason" placeholder="Masalan: Tanlov gʻolibi" style="width:100%;" />
      </div>
      <button type="button" class="btn btn-primary" id="adminBtnSaveBal" style="width:100%;padding:12px;margin-top:14px;">
        Balansni saqlash
      </button>
    </div>
  `;

  openSubModal(`Balansni oʻzgartirish: @${targetUsername}`, html, (modalBody) => {
    const btn = modalBody.querySelector('#adminBtnSaveBal');
    btn.addEventListener('click', async () => {
      const modeSelect = modalBody.querySelector('#adminBalMode').value;
      const amount = parseInt(modalBody.querySelector('#adminBalAmount').value, 10) || 0;
      const reason = modalBody.querySelector('#adminBalReason').value.trim();

      let mode = 'delta';
      let deltaStars = amount;
      let newStars = amount;

      if (modeSelect === 'delta_add') {
        mode = 'delta';
        deltaStars = Math.abs(amount);
      } else if (modeSelect === 'delta_sub') {
        mode = 'delta';
        deltaStars = -Math.abs(amount);
      } else if (modeSelect === 'set') {
        mode = 'set';
        newStars = Math.max(0, amount);
      }

      btn.disabled = true;
      btn.textContent = 'Saqlanmoqda...';

      const res = await api('/api/admin/user/balance', {
        method: 'POST',
        body: JSON.stringify({
          targetUsername,
          mode,
          deltaStars,
          newStars,
          reason: reason || 'Admin panel orqali'
        })
      });

      if (res.ok) {
        closeSubModal();
        showToast(`@${targetUsername} balansi yangilandi: ⭐ ${fmtInt(res.stars)}`);
        await loadAdminData();
        if (STATE.user && STATE.user.username === targetUsername) {
          STATE.user.stars = res.stars;
          const el = document.getElementById('userStars');
          if (el) el.textContent = fmtInt(res.stars);
        }
      } else {
        btn.disabled = false;
        btn.textContent = 'Balansni saqlash';
        showToast(res.error || 'Xatolik');
      }
    });
  });
}

function openAdminGrantGiftModal(targetUsername) {
  const options = STATE.collections.map(c => `
    <option value="${esc(c.slug)}">${esc(c.name)} (${c.slug})</option>
  `).join('');

  const html = `
    <div class="sheet-form">
      <div style="margin-bottom:12px;">
        <strong>Qabul qiluvchi:</strong> @${esc(targetUsername)}
      </div>
      <div class="sheet-field">
        <label>Sovgʻa kolleksiyasi</label>
        <select id="adminGiftSlug" style="background:var(--field);color:var(--text);border:1px solid var(--line-strong);border-radius:10px;padding:8px 12px;font-weight:600;width:100%;">
          ${options}
        </select>
      </div>
      <div class="sheet-field" style="margin-top:12px;">
        <label>Sovgʻa holati</label>
        <select id="adminGiftState" style="background:var(--field);color:var(--text);border:1px solid var(--line-strong);border-radius:10px;padding:8px 12px;font-weight:600;width:100%;">
          <option value="upgraded">Yaxshilangan (Upgraded - Seriya raqam va model bilan)</option>
          <option value="regular">Oddiy (Regular - Baza sovgʻa)</option>
        </select>
      </div>
      <button type="button" class="btn btn-primary" id="adminBtnGrantSubmit" style="width:100%;padding:12px;margin-top:16px;">
        Sovgʻani topshirish 🎁
      </button>
    </div>
  `;

  openSubModal(`Sovgʻa berish: @${targetUsername}`, html, (modalBody) => {
    const btn = modalBody.querySelector('#adminBtnGrantSubmit');
    btn.addEventListener('click', async () => {
      const slug = modalBody.querySelector('#adminGiftSlug').value;
      const isUpgraded = modalBody.querySelector('#adminGiftState').value === 'upgraded';

      btn.disabled = true;
      btn.textContent = 'Sovgʻa tayyorlanmoqda...';

      const res = await api('/api/admin/user/gift', {
        method: 'POST',
        body: JSON.stringify({
          targetUsername,
          slug,
          isUpgraded
        })
      });

      if (res.ok) {
        closeSubModal();
        launchEdgeConfetti();
        showToast(`@${targetUsername} foydalanuvchisiga ${res.gift?.name || 'sovgʻa'} muvaffaqiyatli topshirildi!`);
        await loadAdminData();
      } else {
        btn.disabled = false;
        btn.textContent = 'Sovgʻani topshirish 🎁';
        showToast(res.error || 'Xatolik');
      }
    });
  });
}

function openPromoModal() {
  const html = `
    <div class="sheet-form">
      <div style="text-align:center;margin-bottom:14px;">
        <div style="font-size:42px;margin-bottom:4px;">🎟</div>
        <p style="color:var(--text-2);font-size:13.5px;margin:0;">
          Maxsus promokodni kiriting va bepul Stars yoki eksklyuziv sovgʻalarni qoʻlga kiriting!
        </p>
      </div>

      <div class="sheet-field">
        <label>Promokod kodi</label>
        <input type="text" id="promoCodeInput" placeholder="Masalan: PAXTA100" style="text-transform:uppercase;font-weight:800;letter-spacing:1.5px;font-size:16px;text-align:center;" autofocus />
      </div>

      <button type="button" class="btn btn-primary" id="btnSubmitPromo" style="width:100%;padding:12px;font-size:15px;margin-top:12px;">
        Faollashtirish
      </button>
    </div>
  `;

  openSubModal('🎟 Promokodni faollashtirish', html, (modalBody) => {
    const input = modalBody.querySelector('#promoCodeInput');
    const btn = modalBody.querySelector('#btnSubmitPromo');

    const handleRedeem = async () => {
      const code = (input.value || '').trim();
      if (!code) {
        showToast('Iltimos, promokodni kiriting');
        input.focus();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Tekshirilmoqda...';

      const res = await api('/api/promocode/redeem', {
        method: 'POST',
        body: JSON.stringify({
          code,
          username: STATE.user?.username,
          initData: STATE.initData,
          authToken: STATE.authToken
        })
      });

      if (res.ok) {
        closeSubModal();
        launchEdgeConfetti();
        showToast(res.message || 'Promokod muvaffaqiyatli faollashtirildi!');
        if (res.newBalance != null && STATE.user) {
          STATE.user.stars = res.newBalance;
          const starsEl = document.getElementById('userStars');
          if (starsEl) starsEl.textContent = fmtInt(res.newBalance);
        }
        await Promise.all([loginUser(STATE.user?.username), loadCollections()]);
      } else {
        btn.disabled = false;
        btn.textContent = 'Faollashtirish';
        showToast(res.error || 'Promokod xato yoki muddati oʻtgan');
      }
    };

    btn.addEventListener('click', handleRedeem);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleRedeem();
    });
  });
}

// ============================================================================
// 1:1 MODAL SYSTEM: GiftViewDialog (.gv), GiftUpgradePanel (.up), GiftCraftPanel (.cr)
// ============================================================================

function closeGiftModal() {
  if (STATE.cleanupModal) {
    STATE.cleanupModal();
    STATE.cleanupModal = null;
  }
  const bd = document.getElementById('giftModalBackdrop');
  bd.hidden = true;
  STATE.activeGift = null;
}

function openGiftModal(gift, view = 'view') {
  if (STATE.cleanupModal) {
    STATE.cleanupModal();
    STATE.cleanupModal = null;
  }
  STATE.activeGift = gift;
  STATE.modalView = view;

  const bd = document.getElementById('giftModalBackdrop');
  const panel = document.getElementById('giftModalPanel');
  const head = document.getElementById('giftModalHead');
  const body = document.getElementById('giftModalBody');

  bd.hidden = false;
  panel.classList.toggle('gv-dark-head', view === 'craft' || view === 'upgrade' || gift.state === 'upgraded');

  if (view === 'view') {
    renderGiftViewDialog(gift, head, body);
  } else if (view === 'upgrade') {
    renderGiftUpgradePanel(gift, head, body);
  } else if (view === 'craft') {
    renderGiftCraftPanel(gift, head, body);
  }
}

// ---- 1. Exact GiftViewDialog (.gv) ----
function renderGiftViewDialog(gift, head, body) {
  const isUpgraded = gift.state === 'upgraded';
  const isMine = STATE.user && gift.owner === STATE.user.username;

  head.innerHTML = `
    <div class="modal-head-spacer"></div>
    ${isUpgraded && isMine ? `
      <button class="icon-btn" id="gvBtnPin" title="${gift.pinned ? 'Profil qadashdan olish' : 'Profilga qadab qoʻyish (📌)'}" style="${gift.pinned ? 'background:rgba(251,191,36,0.28);color:#fde68a;' : ''}">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="${gift.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
      </button>
      ${gift.canCraft ? `
      <button class="icon-btn" id="gvBtnCraft" title="Sovgʻa tayyorlash (Craft)">
        ${svgCraftIcon(22)}
      </button>
      ` : ''}
    ` : ''}
    ${isMine ? `
      <button class="icon-btn" id="gvBtnMore" title="Yana">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <circle cx="12" cy="5.5" r="1.8"/>
          <circle cx="12" cy="12" r="1.8"/>
          <circle cx="12" cy="18.5" r="1.8"/>
        </svg>
      </button>
    ` : ''}
    <button class="icon-btn" id="gvBtnClose" title="Yopish">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    </button>
  `;

  const ownerInitial = (gift.ownerDisplayName || gift.owner || 'M').charAt(0).toUpperCase();
  const modelRarityLabel = gift.crafted && gift.model?.tier
    ? (TIER_LABELS[gift.model.tier] || gift.model.tier)
    : fmtPct(gift.model?.rarity);
  const modelTierClass = gift.crafted && gift.model?.tier ? `gv-tier tier-${gift.model.tier}` : '';

  body.innerHTML = `
    <div class="gv">
      ${isUpgraded ? `
        <div class="gv-unique" id="gvUniqueHero">
          <canvas class="unique-backdrop" id="gvUniqueCanvas"></canvas>
          ${gift.crafted ? `<span class="gv-crafted">✨ tayyorlangan</span>` : ''}
          <button type="button" class="gv-unique-model" id="gvStickerBtn" title="Animatsiyani koʻrish"></button>
          <div class="gv-unique-caption" style="color: ${esc(gift.backdrop?.text || '#b3b7b8')}">
            <b>${esc(gift.name)} <span class="gv-unique-num">${formatGiftNum(gift.number)}</span></b>
            <span>${esc(gift.model?.name || '')}</span>
          </div>
          ${gift.salePrice ? `
            <div class="gv-onsale">Sotuvda · ${svgStar(14)} ${fmtInt(gift.salePrice)}</div>
          ` : ''}
          ${isMine ? `
            <div class="gv-actions">
              <button type="button" id="gvActWear">
                ${svgActionIcon(gift.worn ? 'unwear' : 'wear', 20)}
                <span>${gift.worn ? 'yechish' : 'taqish'}</span>
              </button>
              <button type="button" id="gvActTransfer">
                ${svgActionIcon('transfer', 20)}
                <span>oʻtkazish</span>
              </button>
              <button type="button" id="gvActSell">
                ${svgActionIcon(gift.salePrice ? 'unsell' : 'sell', 20)}
                <span>${gift.salePrice ? 'yechish' : 'sotish'}</span>
              </button>
            </div>
          ` : ''}
        </div>
      ` : `
        <button type="button" class="gv-sticker" id="gvStickerBtn" title="Animatsiyani koʻrish">
          <div class="gift-glow" style="width: 245px; height: 245px; background: radial-gradient(circle, rgba(255,190,70,0.40) 0%, rgba(255,150,40,0.16) 42%, rgba(255,150,40,0) 72%);"></div>
          <div id="gvRegularLottie" style="width:150px;height:150px;position:relative;z-index:1;"></div>
        </button>
        <h3 class="gv-title">${esc(gift.name)}</h3>
        <p class="gv-sub">Yaxshilanganda kolleksiyaviy boʻladi</p>
        ${isMine ? `
          <button type="button" class="btn btn-primary gv-btn gv-upgrade" id="gvBtnOpenUpgrade">
            ${svgUpgradeIcon(20)}
            <span>Noyobgacha yaxshilash · ${svgStar(14)} ${fmtInt(gift.upgradePrice)}</span>
          </button>
        ` : ''}
      `}

      ${!isMine && gift.salePrice > 0 ? `
        <button type="button" class="btn btn-primary gv-btn" id="gvBtnBuyMarket" style="margin:12px 16px 2px;width:calc(100% - 32px);background:linear-gradient(135deg,#f59e0b,#d97706);">
          <span>🏪 Sotib olish · ${svgStar(15)} ${fmtInt(gift.salePrice)}</span>
        </button>
      ` : ''}

      <dl class="gv-table">
        <div>
          <dt>Egasi</dt>
          <dd>
            <button type="button" class="gv-from gv-owner" id="gvOwnerProfileBtn" title="@${esc(gift.owner)} profilini koʻrish">
              <span class="avatar">${esc(ownerInitial)}</span>
              <span>${esc(gift.ownerDisplayName || gift.owner)}</span>
              <span style="font-size:12px;opacity:0.65;">@${esc(gift.owner)} ›</span>
            </button>
          </dd>
        </div>
        ${isUpgraded && gift.model ? `
          <div>
            <dt>Model</dt>
            <dd>
              <span>${esc(gift.model.name)}</span>
              <span class="gv-rarity ${modelTierClass}">${esc(modelRarityLabel)}</span>
            </dd>
          </div>
        ` : ''}
        ${isUpgraded && gift.backdrop ? `
          <div>
            <dt>Fon</dt>
            <dd>
              <span>${esc(gift.backdrop.name)}</span>
              <span class="gv-rarity">${fmtPct(gift.backdrop.rarity)}</span>
            </dd>
          </div>
        ` : ''}
        ${isUpgraded && gift.symbol ? `
          <div>
            <dt>Naqsh</dt>
            <dd>
              <span>${esc(gift.symbol.name)}</span>
              <span class="gv-rarity">${fmtPct(gift.symbol.rarity)}</span>
            </dd>
          </div>
        ` : ''}
        <div>
          <dt>${gift.salePrice ? 'Sotuv narxi' : 'Qiymati'}</dt>
          <dd class="gv-stars">
            ${svgStar(16)}
            <span>${fmtInt(gift.salePrice || gift.valueStars)}</span>
          </dd>
        </div>
        ${!isUpgraded ? `
          <div>
            <dt>Mavjud</dt>
            <dd>${fmtInt(gift.circulating)} / ${fmtInt(gift.supply)}</dd>
          </div>
          <div>
            <dt>Yaxshilash</dt>
            <dd class="gv-stars">mumkin</dd>
          </div>
        ` : `
          <div>
            <dt>Raqam</dt>
            <dd>
              <span>${formatGiftNum(gift.number)}</span>
              <span class="gv-muted">${gift.isSpecialFounder ? '(GENESIS)' : `/ ${fmtInt(gift.supply)}`}</span>
            </dd>
          </div>
          <div>
            <dt>Muomalada</dt>
            <dd>
              <span>${fmtInt(gift.circulating)}</span>
              <span class="gv-muted gv-note">qolganlari yulduzlarga almashtirilgan yoki yoqilgan</span>
            </dd>
          </div>
        `}
      </dl>

      ${isMine ? `
        <div class="gv-visibility">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${gift.hidden
              ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
              : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'}
          </svg>
          <span>${gift.hidden ? 'Sovgʻa yashirilgan.' : 'Sovgʻa profilda koʻrinadi.'}</span>
          <button type="button" class="gv-link" id="gvToggleHide">
            <span>${gift.hidden ? 'Profilda koʻrsatish' : 'Yashirish'}</span> ›
          </button>
        </div>
      ` : ''}
    </div>
  `;

  let lottieCtrl = null;
  if (isUpgraded) {
    const cvs = document.getElementById('gvUniqueCanvas');
    requestAnimationFrame(() => drawUniqueBackdrop(cvs, gift.backdrop, gift.symbol));
    const stickerBtn = document.getElementById('gvStickerBtn');
    lottieCtrl = mountLottieOrImg(stickerBtn, {
      imgUrl: gift.model?.img || gift.thumb,
      jsonUrl: gift.model?.tgs || gift.baseTgs,
      size: 132,
      loop: false,
      autoplay: true
    });
    stickerBtn.addEventListener('click', () => lottieCtrl.play());
  } else {
    const regEl = document.getElementById('gvRegularLottie');
    lottieCtrl = mountLottieOrImg(regEl, {
      imgUrl: gift.thumb,
      jsonUrl: gift.baseTgs,
      size: 150,
      loop: false,
      autoplay: true
    });
    document.getElementById('gvStickerBtn')?.addEventListener('click', () => lottieCtrl.play());
  }

  document.getElementById('gvBtnClose')?.addEventListener('click', closeGiftModal);
  document.getElementById('gvBtnPin')?.addEventListener('click', async () => {
    await performGiftAction(gift, 'pin');
    showToast(gift.pinned ? 'Qadashdan olindi' : '📌 Profilga qadab qoʻyildi!');
  });
  document.getElementById('gvBtnCraft')?.addEventListener('click', () => {
    if (gift.salePrice > 0) return showToast('Craft qilish uchun avval sovgʻani sotuvdan oling');
    openGiftModal(gift, 'craft');
  });
  document.getElementById('gvBtnOpenUpgrade')?.addEventListener('click', () => openGiftModal(gift, 'upgrade'));
  document.getElementById('gvBtnBuyMarket')?.addEventListener('click', () => buyMarketGift(gift));
  document.getElementById('gvOwnerProfileBtn')?.addEventListener('click', () => {
    closeGiftModal();
    openUserProfile(gift.owner);
  });

  document.getElementById('gvBtnMore')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const existing = document.getElementById('gvCtxMenu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'ctx-menu-pop';
    menu.id = 'gvCtxMenu';
    menu.innerHTML = `
      ${isUpgraded ? `
        ${gift.canCraft ? `
        <button class="ctx-item" id="ctxCraft">
          ${svgCraftIcon(18)}
          <span>Tayyorlash (Craft)</span>
        </button>
        ` : ''}
        <button class="ctx-item" id="ctxPin">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
          <span>${gift.pinned ? 'Qadashdan olish' : '📌 Profilga qadab qoʻyish'}</span>
        </button>
      ` : `
        <button class="ctx-item" id="ctxTransferReg">
          ${svgActionIcon('transfer', 18)}
          <span>Boshqa profilga oʻtkazish</span>
        </button>
      `}
      <button class="ctx-item" id="ctxHide">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>${gift.hidden ? 'Profilda koʻrsatish' : 'Sovgʻani yashirish'}</span>
      </button>
      <button class="ctx-item" id="ctxBurnSingle" style="color:#ff8585;">
        <span style="font-size:16px;">🔥</span>
        <span>Sovgʻani yoqish (Burn)</span>
      </button>
    `;
    document.getElementById('giftModalPanel').appendChild(menu);

    menu.querySelector('#ctxCraft')?.addEventListener('click', () => {
      menu.remove();
      openGiftModal(gift, 'craft');
    });
    menu.querySelector('#ctxPin')?.addEventListener('click', async () => {
      menu.remove();
      await performGiftAction(gift, 'pin');
    });
    menu.querySelector('#ctxTransferReg')?.addEventListener('click', () => {
      menu.remove();
      openTransferPrompt(gift);
    });
    menu.querySelector('#ctxHide')?.addEventListener('click', async () => {
      menu.remove();
      await performGiftAction(gift, 'hide');
    });
    menu.querySelector('#ctxBurnSingle')?.addEventListener('click', () => {
      menu.remove();

      openSubModal(`🔥 Sovgʻani yoqish (Burn)`, `
        <div class="form-stack" style="text-align:center;align-items:center;">
          <div style="font-size:46px;margin:4px 0;animation:burnPulse 1s infinite alternate;">🔥</div>
          <h3 style="margin:0;font-size:18px;">${esc(gift.name)}${gift.number ? ` #${gift.number}` : ''} yoqilsinmi?</h3>
          <p style="font-size:13px;color:var(--text-2);line-height:1.45;margin:6px 0 12px 0;">
            Diqqat: Bu sovgʻa <b>butunlay yoʻq qilinadi (burn qilinadi)</b> va muomaladan chiqariladi. Bu amalni ortga qaytarib boʻlmaydi.
          </p>
          <button type="button" class="btn btn-danger gv-btn" id="btnConfirmSingleBurn" style="height:44px;font-size:15px;margin-top:6px;">
            🔥 Ha, butunlay yoqish
          </button>
          <button type="button" class="btn btn-secondary gv-btn" id="btnCancelSingleBurn" style="height:38px;">
            Bekor qilish
          </button>
        </div>
      `, (sBody) => {
        sBody.querySelector('#btnCancelSingleBurn')?.addEventListener('click', closeSubModal);
        sBody.querySelector('#btnConfirmSingleBurn')?.addEventListener('click', async (eBtn) => {
          eBtn.currentTarget.disabled = true;
          const res = await api('/api/gifts/burn', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.user.username, giftIds: [gift.id] })
          });
          if (!res.ok) {
            eBtn.currentTarget.disabled = false;
            return showToast(res.error || 'Xatolik yuz berdi');
          }
          closeSubModal();
          closeGiftModal();
          await loginUser(STATE.user.username);
          showToast(`🔥 Sovgʻa butunlay yoqildi!`);
          renderProfileView();
        });
      });
    });
  });

  document.getElementById('gvActWear')?.addEventListener('click', async () => {
    await performGiftAction(gift, 'wear');
    showToast(gift.worn ? 'Taqishdan olindi' : '👑 Profil sarlavhasiga taqildi!');
  });
  document.getElementById('gvToggleHide')?.addEventListener('click', () => performGiftAction(gift, 'hide'));
  document.getElementById('gvActTransfer')?.addEventListener('click', () => openTransferPrompt(gift));
  document.getElementById('gvActSell')?.addEventListener('click', () => {
    if (gift.salePrice) {
      performGiftAction(gift, 'sell', { price: null });
      showToast('Sovgʻa Marketdan olindi');
    } else {
      openSellPrompt(gift);
    }
  });

  STATE.cleanupModal = () => {
    if (lottieCtrl) lottieCtrl.destroy();
    document.getElementById('gvCtxMenu')?.remove();
  };
}

async function performGiftAction(gift, action, extra = {}) {
  const res = await api('/api/gifts/action', {
    method: 'POST',
    body: JSON.stringify({
      username: STATE.user.username,
      giftId: gift.id,
      action,
      ...extra
    })
  });
  if (!res.ok) {
    showToast(res.error || 'Xatolik yuz berdi');
    return;
  }
  await Promise.all([loginUser(STATE.user.username), loadMarket()]);
  const updated = STATE.inventory.find(i => i.id === gift.id);
  if (updated && STATE.activeGift && STATE.activeGift.id === gift.id) {
    openGiftModal(updated, 'view');
  } else {
    closeGiftModal();
  }
}

// ============================================================================
// 2. Exact GiftUpgradePanel (.up) — Horizontal Carousel + Vertical Rolling Table
// ============================================================================
async function renderGiftUpgradePanel(gift, head, body) {
  head.innerHTML = `
    <div class="modal-head-spacer"></div>
    <button class="icon-btn" id="upBtnClose" title="Yopish">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    </button>
  `;
  document.getElementById('upBtnClose')?.addEventListener('click', () => openGiftModal(gift, 'view'));

  body.innerHTML = `<div class="up"><div class="up-scene"><div class="up-scene-wait">Yuklanmoqda...</div></div></div>`;

  const data = await api(`/api/gifts/${encodeURIComponent(gift.id)}/upgrade?username=${encodeURIComponent(STATE.user.username)}`);
  if (!data.ok) {
    body.innerHTML = `<div class="up-error">${esc(data.error || 'Maʼlumot topilmadi')}</div>`;
    return;
  }

  const models = data.models || [];
  const backdrops = data.backdrops || [];
  const patterns = data.patterns || [];
  const price = data.price || gift.upgradePrice || 100;

  let phase = 'preview';
  let pos = 0;
  let raf = 0;
  let previewTimer = 0;
  let winResult = null;
  let winTargetIdx = null;
  let liveLottieCtrl = null;

  body.innerHTML = `
    <div class="up">
      <div class="up-scene">
        <canvas class="unique-backdrop up-bg" id="upBgA"></canvas>
        <canvas class="unique-backdrop up-bg" id="upBgB"></canvas>
        <div class="up-flash" id="upFlash" hidden></div>
        <div class="up-stage" id="upStage"></div>
        <div class="up-caption" id="upCaption">
          <h3 class="up-title">${esc(gift.name)}</h3>
          <span class="up-num" id="upSubText">Noyob sovgʻa</span>
        </div>
      </div>

      <div id="upBodySection" style="align-self: stretch;">
        <div class="up-intro" id="upIntro">
          <h4 class="up-head">Noyob sovgʻaga yaxshilash</h4>
          <ul class="up-features">
            <li>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/></svg>
              <div>
                <b>Noyob model</b>
                <span>Noyob koʻrinishga ega oʻnlab variantlar</span>
              </div>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 1 0 10 10c0-1.1-.9-2-2-2h-1.8c-1.1 0-2-.9-2-2 0-.5.2-1 .6-1.4l.8-.8c.4-.4.6-.9.6-1.4 0-1.3-2.7-2.4-6.2-2.4Z"/></svg>
              <div>
                <b>Oʻz foni va naqshi</b>
                <span>Har bir sovgʻa uchun tasodifiy birikma</span>
              </div>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></svg>
              <div>
                <b>Raqam — navbat bilan</b>
                <span>Sovgʻani profil sarlavhasiga taqish mumkin</span>
              </div>
            </li>
          </ul>
        </div>

        <dl class="up-table" id="upTable" hidden>
          <div>
            <dt>Model</dt>
            <dd>
              <span class="up-cell" id="upCellModel"></span>
              <span class="up-rarity" id="upRarityModel" hidden></span>
            </dd>
          </div>
          <div>
            <dt>Fon</dt>
            <dd>
              <span class="up-cell" id="upCellBackdrop"></span>
              <span class="up-rarity" id="upRarityBackdrop" hidden></span>
            </dd>
          </div>
          <div>
            <dt>Naqsh</dt>
            <dd>
              <span class="up-cell" id="upCellPattern"></span>
              <span class="up-rarity" id="upRarityPattern" hidden></span>
            </dd>
          </div>
        </dl>
      </div>

      <button type="button" class="btn btn-primary up-btn" id="upStartBtn">
        ${svgUpgradeIcon(20)}
        <span>Yaxshilash:</span>
        ${svgStar(15)}
        <span>${fmtInt(price)}</span>
      </button>
      <p class="up-balance" id="upBalHint">Balans: ⭐ ${fmtInt(STATE.user.stars)}</p>
      <button type="button" class="up-cancel" id="upCancelBtn">Bekor qilish</button>
    </div>
  `;

  const bgA = document.getElementById('upBgA');
  const bgB = document.getElementById('upBgB');
  const stage = document.getElementById('upStage');
  const caption = document.getElementById('upCaption');
  const subText = document.getElementById('upSubText');

  const modItem = (arr, idx) => {
    if (!arr.length) return null;
    if (winTargetIdx !== null && idx === winTargetIdx && winResult) {
      if (arr === models) return winResult.model;
      if (arr === backdrops) return winResult.backdrop;
      if (arr === patterns) return winResult.symbol;
    }
    return arr[((idx % arr.length) + arr.length) % arr.length];
  };

  let lastDrawnBaseIdx = -999;

  function renderFrame() {
    const baseIdx = Math.floor(pos);
    const frac = pos - baseIdx;

    const bdA = modItem(backdrops, baseIdx);
    const bdB = modItem(backdrops, baseIdx + 1);
    const patA = modItem(patterns, baseIdx);
    const patB = modItem(patterns, baseIdx + 1);

    if (baseIdx !== lastDrawnBaseIdx) {
      lastDrawnBaseIdx = baseIdx;
      drawUniqueBackdrop(bgA, bdA, patA);
      drawUniqueBackdrop(bgB, bdB, patB);
    }

    const zoomA = 1 + 0.08 * frac;
    const zoomB = 1 + 0.08 * Math.max(0, frac - 1);
    bgA.style.opacity = '1';
    bgA.style.transform = `scale(${zoomA.toFixed(4)})`;
    bgB.style.opacity = frac.toFixed(3);
    bgB.style.transform = `scale(${zoomB.toFixed(4)})`;

    const activeBd = frac < 0.5 ? bdA : bdB;
    if (activeBd?.text) caption.style.color = activeBd.text;

    if (phase !== 'done') {
      stage.innerHTML = '';
      for (let k = baseIdx - 2; k <= baseIdx + 3; k++) {
        const offset = k - pos;
        if (Math.abs(offset) > 2.2) continue;
        const m = modItem(models, k);
        if (!m) continue;
        const dist = Math.min(1, Math.abs(offset));
        const sc = 1 - dist * 0.3;
        const op = Math.max(0, 1 - Math.max(0, Math.abs(offset) - 0.85) * 1.1);
        const img = document.createElement('img');
        img.className = 'up-model';
        img.src = m.img;
        img.alt = m.name;
        img.style.transform = `translate3d(${(offset * 118).toFixed(1)}px, 0, 0) scale(${sc.toFixed(3)})`;
        img.style.opacity = op.toFixed(3);
        img.style.zIndex = String(10 - Math.round(dist * 5));
        stage.appendChild(img);
      }
    }

    if (phase === 'spinning') {
      const mPrev = modItem(models, baseIdx + 1)?.name || '';
      const mCurr = modItem(models, baseIdx)?.name || '';
      const bPrev = bdB?.name || '';
      const bCurr = bdA?.name || '';
      const pPrev = patB?.name || '';
      const pCurr = patA?.name || '';

      document.getElementById('upCellModel').innerHTML = `
        <span class="up-roll" style="transform:translateY(${((frac - 1) * 100).toFixed(1)}%)">${esc(mPrev)}</span>
        <span class="up-roll" style="transform:translateY(${(frac * 100).toFixed(1)}%)">${esc(mCurr)}</span>
      `;
      document.getElementById('upCellBackdrop').innerHTML = `
        <span class="up-roll" style="transform:translateY(${((frac - 1) * 100).toFixed(1)}%)">${esc(bPrev)}</span>
        <span class="up-roll" style="transform:translateY(${(frac * 100).toFixed(1)}%)">${esc(bCurr)}</span>
      `;
      document.getElementById('upCellPattern').innerHTML = `
        <span class="up-roll" style="transform:translateY(${((frac - 1) * 100).toFixed(1)}%)">${esc(pPrev)}</span>
        <span class="up-roll" style="transform:translateY(${(frac * 100).toFixed(1)}%)">${esc(pCurr)}</span>
      `;
    }
  }

  function startPreviewStep() {
    if (phase !== 'preview') return;
    const fromPos = Math.round(pos);
    const toPos = fromPos + 1;
    const t0 = performance.now();
    const dur = 1150;

    function tick(now) {
      if (phase !== 'preview') return;
      const t = Math.min(1, (now - t0) / dur);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      pos = fromPos + (toPos - fromPos) * ease;
      renderFrame();
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        pos = toPos;
        renderFrame();
        previewTimer = setTimeout(startPreviewStep, 1100);
      }
    }
    raf = requestAnimationFrame(tick);
  }

  renderFrame();
  previewTimer = setTimeout(startPreviewStep, 900);

  document.getElementById('upStartBtn')?.addEventListener('click', async () => {
    if (phase !== 'preview') return;
    if ((STATE.user?.stars || 0) < price) {
      const deficit = Math.max(1, price - (STATE.user?.stars || 0));
      openAddStarsModal(deficit, `${gift.name} yaxshilash`, () => {
        const hint = document.getElementById('upBalHint');
        if (hint) hint.textContent = `Balans: ⭐ ${fmtInt(STATE.user.stars)}`;
      });
      return;
    }
    cancelAnimationFrame(raf);
    clearTimeout(previewTimer);

    phase = 'spinning';
    document.getElementById('upIntro').hidden = true;
    document.getElementById('upTable').hidden = false;
    document.getElementById('upStartBtn').disabled = true;
    document.getElementById('upStartBtn').innerHTML = `<span>Yaxshilanmoqda...</span>`;
    document.getElementById('upCancelBtn').classList.add('off');
    document.getElementById('upBalHint').hidden = true;
    subText.textContent = 'Yaratilmoqda...';

    let lastTime = performance.now();
    let speed = 1.6;
    let decelStart = 0;
    let decelFromPos = 0;

    api('/api/gifts/upgrade', {
      method: 'POST',
      body: JSON.stringify({
        username: STATE.user.username,
        giftId: gift.id
      })
    }).then(res => {
      if (!res.ok) {
        showToast(res.error || 'Xatolik yuz berdi');
        openGiftModal(gift, 'view');
        return;
      }
      winResult = res.gift;
      winTargetIdx = Math.ceil(pos) + 13;
      decelFromPos = pos;
      decelStart = performance.now();
    });

    function spinLoop(now) {
      if (phase !== 'spinning') return;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      if (winTargetIdx === null) {
        speed = Math.min(7.5, speed + dt * 9);
        pos += speed * dt;
        renderFrame();
        raf = requestAnimationFrame(spinLoop);
        return;
      }

      const elapsed = now - decelStart;
      const t = Math.min(1, elapsed / 3200);
      const easeOutCubic = 1 - Math.pow(1 - t, 3);
      pos = decelFromPos + (winTargetIdx - decelFromPos) * easeOutCubic;
      lastDrawnBaseIdx = -999;
      renderFrame();

      if (t < 1) {
        raf = requestAnimationFrame(spinLoop);
      } else {
        pos = winTargetIdx;
        phase = 'done';
        lastDrawnBaseIdx = -999;
        renderFrame();

        subText.textContent = `#${fmtInt(winResult.number)}`;
        document.getElementById('upCellModel').innerHTML = `<span class="up-roll up-roll-final">${esc(winResult.model.name)}</span>`;
        document.getElementById('upCellBackdrop').innerHTML = `<span class="up-roll up-roll-final">${esc(winResult.backdrop.name)}</span>`;
        document.getElementById('upCellPattern').innerHTML = `<span class="up-roll up-roll-final">${esc(winResult.symbol.name)}</span>`;

        const rm = document.getElementById('upRarityModel');
        const rb = document.getElementById('upRarityBackdrop');
        const rp = document.getElementById('upRarityPattern');
        rm.textContent = fmtPct(winResult.model.rarity); rm.hidden = false;
        rb.textContent = fmtPct(winResult.backdrop.rarity); rb.hidden = false;
        rp.textContent = fmtPct(winResult.symbol.rarity); rp.hidden = false;

        document.getElementById('upFlash').hidden = false;
        stage.innerHTML = `<div class="up-model up-model-live" id="upLiveModel"></div>`;
        liveLottieCtrl = mountLottieOrImg(document.getElementById('upLiveModel'), {
          imgUrl: winResult.model.img,
          jsonUrl: winResult.model.tgs,
          size: 150,
          loop: false,
          autoplay: true
        });
        launchEdgeConfetti();

        loginUser(STATE.user.displayName);
        loadCollections();
        setTimeout(() => {
          if (STATE.activeGift && STATE.activeGift.id === gift.id) {
            openGiftModal(winResult, 'view');
          }
        }, 1250);
      }
    }
    raf = requestAnimationFrame(spinLoop);
  });

  document.getElementById('upCancelBtn')?.addEventListener('click', () => openGiftModal(gift, 'view'));

  STATE.cleanupModal = () => {
    phase = 'done';
    cancelAnimationFrame(raf);
    clearTimeout(previewTimer);
    if (liveLottieCtrl) liveLottieCtrl.destroy();
  };
}

// ============================================================================
// 3. Exact GiftCraftPanel (.cr) — 1 to 4 Gifts Anvil Station + Permanent Burn
// ============================================================================
async function renderGiftCraftPanel(gift, head, body) {
  head.innerHTML = `
    <div class="modal-head-spacer"></div>
    <button class="icon-btn" id="crBtnClose" title="Yopish">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    </button>
  `;
  document.getElementById('crBtnClose')?.addEventListener('click', () => openGiftModal(gift, 'view'));

  body.innerHTML = `<div class="cr"><h3 class="cr-title">Sovgʻa tayyorlash</h3><div class="cr-wait">Yuklanmoqda...</div></div>`;

  const craftData = await api(`/api/gifts/${encodeURIComponent(gift.id)}/craft?username=${encodeURIComponent(STATE.user.username)}`);
  if (!craftData.ok) {
    body.innerHTML = `<div class="cr"><div class="cr-error">${esc(craftData.error || 'Xatolik')}</div></div>`;
    return;
  }

  const slot0Gift = {
    id: gift.id,
    number: gift.number,
    chance: craftData.chance || 240,
    model: gift.model,
    backdrop: gift.backdrop,
    pattern: gift.symbol
  };

  let slots = [slot0Gift, null, null, null];
  let activeSlotPick = 1;
  let sheet = null; // null | 'pick' | 'models'
  let phase = 'idle'; // 'idle' | 'crafting' | 'win' | 'burst' | 'failed'
  let absorbedSlots = [false, false, false, false];
  let cubeFaces = {};
  let lostGiftsSnapshot = [];
  let cubeRaf = 0;
  let timers = [];

  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };

  function getSelectedGifts() {
    return slots.filter(Boolean);
  }

  function getTotalPermille() {
    const sel = getSelectedGifts();
    const sum = sel.reduce((s, g) => s + (g.chance || 240), 0);
    if (sel.length === 1) return Math.min(craftData.solo || 150, sum);
    return Math.min(1000, sum);
  }

  function getPersistAttributes() {
    const sel = getSelectedGifts();
    const table = craftData.persist || [[150], [90, 270], [60, 180, 450], [50, 140, 330, 600]];
    const row = table[Math.min(table.length - 1, Math.max(0, sel.length - 1))] || [];
    const bdCounts = new Map();
    const patCounts = new Map();

    for (const g of sel) {
      if (g.backdrop) {
        const prev = bdCounts.get(g.backdrop.name) || { item: g.backdrop, count: 0 };
        prev.count++;
        bdCounts.set(g.backdrop.name, prev);
      }
      if (g.pattern) {
        const prev = patCounts.get(g.pattern.name) || { item: g.pattern, count: 0 };
        prev.count++;
        patCounts.set(g.pattern.name, prev);
      }
    }

    const attrs = [];
    for (const { item, count } of bdCounts.values()) {
      attrs.push({
        key: 'b_' + item.name,
        kind: 'backdrop',
        center: item.center,
        edge: item.edge,
        permille: row[Math.min(row.length - 1, count - 1)] || 0
      });
    }
    for (const { item, count } of patCounts.values()) {
      attrs.push({
        key: 'p_' + item.name,
        kind: 'pattern',
        img: item.img,
        permille: row[Math.min(row.length - 1, count - 1)] || 0
      });
    }
    return attrs;
  }

  function renderCraftDOM() {
    const totalPermille = getTotalPermille();
    const ringDash = `${((totalPermille / 1000) * 212).toFixed(1)} 283`;
    const persistAttrs = getPersistAttributes();
    const previewThumbs = (craftData.models || []).slice(0, 3);

    body.innerHTML = `
      <div class="cr ${phase === 'failed' || phase === 'burst' ? 'failed' : ''}" id="crRoot">
        <canvas class="unique-backdrop cr-bg" id="crBgNormal"></canvas>
        <canvas class="unique-backdrop cr-bg cr-bg-fail" id="crBgFail"></canvas>

        ${sheet ? `
          <button type="button" class="cr-back" id="crBtnBack" aria-label="Orqaga">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        ` : ''}

        <h3 class="cr-title">${sheet === 'models' ? 'Tayyorlash modellari' : 'Sovgʻa tayyorlash'}</h3>

        ${renderCraftContent(totalPermille, ringDash, persistAttrs, previewThumbs)}
      </div>
    `;

    drawUniqueBackdrop(document.getElementById('crBgNormal'), CRAFT_BG_NORMAL, CRAFT_PATTERN);
    drawUniqueBackdrop(document.getElementById('crBgFail'), CRAFT_BG_FAIL, CRAFT_PATTERN);

    body.querySelectorAll('canvas[data-bd]').forEach(cvs => {
      try {
        const bd = JSON.parse(cvs.getAttribute('data-bd'));
        const pat = JSON.parse(cvs.getAttribute('data-pat') || 'null');
        drawUniqueBackdrop(cvs, bd, pat, { compact: true });
      } catch {}
    });

    bindCraftEvents();
  }

  function renderCraftContent(totalPermille, ringDash, persistAttrs, previewThumbs) {
    if (sheet === 'pick') {
      const candidates = craftData.candidates || [];
      return `
        <div class="cr-sheet">
          <h4 class="cr-sub">Sovgʻani tanlang</h4>
          <p class="cr-muted">Bir xil rang yoki naqshli sovgʻalar bu xususiyatlarni yangi sovgʻada saqlab qolish imkoniyatini oshiradi.</p>
          ${candidates.length ? `
            <div class="cr-grid">
              ${candidates.map(c => {
                const used = slots.some(s => s && s.id === c.id);
                return `
                  <button type="button" class="cr-card ${used ? 'off' : ''}" data-pick-id="${esc(c.id)}">
                    <canvas class="unique-backdrop" data-bd='${esc(JSON.stringify(c.backdrop))}' data-pat='${esc(JSON.stringify(c.pattern))}'></canvas>
                    <span class="cr-card-num">#${fmtInt(c.number)}</span>
                    <img class="cr-card-model" src="${esc(c.model?.img || '')}" alt="" />
                    <span class="cr-card-chance">+${fmtPct(c.chance)}</span>
                  </button>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="cr-muted" style="margin-top: 22px;">Sizda hozircha boshqa yaxshilangan <b>${esc(gift.name)}</b> yoʻq.<br>Avval Doʻkondan <b>${esc(gift.name)}</b> sotib olib, Profil boʻlimida Upgrade qiling.</p>
          `}
        </div>
      `;
    }

    if (sheet === 'models') {
      const grouped = [];
      for (const t of TIER_ORDER) {
        const list = (craftData.models || []).filter(m => m.tier === t);
        if (list.length) {
          grouped.push({
            key: t,
            label: TIER_LABELS[t],
            chance: craftData.tiers?.[t] != null ? fmtPct(craftData.tiers[t]) : '',
            items: list
          });
        }
      }
      return `
        <div class="cr-sheet">
          <h4 class="cr-sub">${esc(gift.name)}</h4>
          <p class="cr-muted">Noyob craft sovgʻalarni faqat tayyorlash orqali olish mumkin — boshqa sovgʻalarni birlashtirib va yoqib.</p>
          ${grouped.map(g => `
            <div class="cr-tier">
              <h4 class="tier-${esc(g.key)}">${esc(g.label)} <span>${esc(g.chance)}</span></h4>
              <div class="cr-models">
                ${g.items.map(m => `
                  <figure>
                    <img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" />
                    <figcaption>${esc(m.name)}</figcaption>
                  </figure>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <ul class="cr-rules">
            <li>
              ${svgCraftIcon(22)}
              <div>
                <b>Yoqish orqali kamyoblik</b>
                <span>Qoʻshilgan sovgʻalar tayyorlash jarayonida butunlay yoqiladi va muomaladan chiqadi.</span>
              </div>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.2 1 5.9L12 16.5 6.8 19.3l1-5.9-4.3-4.2 5.9-.9Z"/></svg>
              <div>
                <b>Faqat Craftda tushadigan modellar</b>
                <span>Ushbu ${craftData.models?.length || 0} ta maxsus model oddiy upgrade orqali hech qachon tushmaydi.</span>
              </div>
            </li>
          </ul>
        </div>
      `;
    }

    if (phase === 'failed') {
      return `
        <div class="cr-fail">
          <div class="cr-anvil cr-anvil-fail">
            <svg class="cr-ring" viewBox="0 0 100 100">
              <circle class="track" cx="50" cy="50" r="45" stroke-dasharray="212 283"/>
            </svg>
            ${svgCraftIcon(38)}
            <b>0%</b>
          </div>
          <h4 class="cr-fail-title">Sovgʻani tayyorlab boʻlmadi</h4>
          <p class="cr-text"><b>${lostGiftsSnapshot.length} ta sovgʻangiz</b> tayyorlash jarayonida yoqildi va ularni tiklab boʻlmaydi.</p>
          <div class="cr-lost">
            ${lostGiftsSnapshot.map(g => `
              <div class="cr-lost-card">
                <div class="cr-face-art">
                  <canvas class="unique-backdrop" data-bd='${esc(JSON.stringify(g.backdrop))}' data-pat='${esc(JSON.stringify(g.pattern))}'></canvas>
                  <img src="${esc(g.model?.img || '')}" alt="" />
                </div>
                <span class="cr-lost-num">#${fmtInt(g.number)}</span>
              </div>
            `).join('')}
          </div>
          <button type="button" class="cr-btn cr-btn-glass" id="crFailDoneBtn">Tushunarli</button>
        </div>
      `;
    }

    return `
      <div class="cr-main">
        <div class="cr-board">
          ${[0, 1, 2, 3].map(idx => {
            const s = slots[idx];
            const flyStyle = absorbedSlots[idx]
              ? `transform: translate(${idx % 2 === 0 ? 106 : -106}px, ${idx < 2 ? 45 : -45}px) scale(0.28); opacity: 0; pointer-events: none;`
              : '';
            if (s) {
              return `
                <div class="cr-slot s${idx}" style="${flyStyle}">
                  <canvas class="unique-backdrop" data-bd='${esc(JSON.stringify(s.backdrop))}' data-pat='${esc(JSON.stringify(s.pattern))}'></canvas>
                  <img class="cr-slot-model" src="${esc(s.model?.img || '')}" alt="" />
                  <span class="cr-slot-chance">${fmtPct(idx === 0 && getSelectedGifts().length === 1 ? totalPermille : s.chance)}</span>
                  ${idx > 0 && phase === 'idle' ? `
                    <button type="button" class="cr-slot-x" data-clear-slot="${idx}" aria-label="Olib tashlash">
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                    </button>
                  ` : ''}
                </div>
              `;
            }
            return `
              <button type="button" class="cr-slot cr-slot-empty s${idx}" data-open-pick="${idx}" ${phase !== 'idle' ? 'disabled' : ''}>
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            `;
          }).join('')}

          <div class="cr-center">
            ${phase === 'idle' ? `
              <div class="cr-anvil">
                <svg class="cr-ring" viewBox="0 0 100 100">
                  <circle class="track" cx="50" cy="50" r="45" stroke-dasharray="212 283"/>
                  <circle class="fill" cx="50" cy="50" r="45" stroke-dasharray="${ringDash}"/>
                </svg>
                ${svgCraftIcon(38)}
                <b>${fmtPct(totalPermille)}</b>
              </div>
            ` : `
              <div class="cr-cube-wrap">
                <div class="cr-cube ${phase === 'burst' ? 'burst' : ''} ${phase === 'win' ? 'win' : ''}" id="crSpinCube">
                  ${['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => {
                    const fg = cubeFaces[face];
                    return `
                      <div class="cr-face ${face}">
                        ${fg ? `
                          <span class="cr-face-art">
                            <canvas class="unique-backdrop" data-bd='${esc(JSON.stringify(fg.backdrop))}' data-pat='${esc(JSON.stringify(fg.pattern))}'></canvas>
                            <img src="${esc(fg.model?.img || '')}" alt="" />
                          </span>
                        ` : svgCraftIcon(34)}
                      </div>
                    `;
                  }).join('')}
                </div>
                ${phase === 'win' ? `<div class="cr-flash"></div>` : ''}
              </div>
            `}
          </div>
        </div>

        <div class="cr-info">
          ${phase === 'idle' ? `
            <p class="cr-text">
              <img class="cr-inline" src="${esc(gift.model?.img || gift.thumb)}" alt="" />
              Yangisini tayyorlash uchun <b>4 tagacha ${esc(gift.name)}</b> qoʻshing.
            </p>
            <p class="cr-muted">Har bir sovgʻa muvaffaqiyat imkoniyatini oshiradi. Omadsizlikda barcha tanlangan sovgʻalar yoqiladi.</p>
            <div class="cr-persist">
              ${persistAttrs.map(a => {
                const dash = `${((a.permille / 1000) * 94.2).toFixed(1)} 125.7`;
                return `
                  <div class="cr-attr">
                    <svg class="cr-attr-ring" viewBox="0 0 48 48">
                      <circle class="track" cx="24" cy="24" r="20" stroke-dasharray="94.2 125.7"/>
                      <circle class="fill" cx="24" cy="24" r="20" stroke-dasharray="${dash}"/>
                    </svg>
                    ${a.kind === 'backdrop'
                      ? `<span class="cr-attr-dot" style="background: radial-gradient(circle, ${esc(a.center)}, ${esc(a.edge)})"></span>`
                      : `<span class="cr-attr-dot cr-attr-pattern" style="--img: url('${esc(a.img)}')"></span>`}
                    <small>${fmtPct(a.permille)}</small>
                  </div>
                `;
              }).join('')}
            </div>
            ${previewThumbs.length ? `
              <button type="button" class="cr-all" id="crOpenModelsBtn">
                <span class="cr-all-thumbs">
                  ${previewThumbs.map(m => `<img src="${esc(m.img)}" alt="" />`).join('')}
                </span>
                <span>Barcha tayyorlash modellari (${craftData.models?.length || 0})</span>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 4 4 4-4 4"/></svg>
              </button>
            ` : ''}
          ` : `
            <h4 class="cr-crafting">Sovgʻa tayyorlanmoqda...</h4>
            <p class="cr-muted">Tanlangan sovgʻalaringiz yoqilmoqda:<br><b>${getSelectedGifts().map(g => `${esc(gift.name)} #${g.number}`).join(', ')}</b></p>
            <div class="cr-chance">Muvaffaqiyat imkoniyati: <b>${fmtPct(totalPermille)}</b></div>
          `}
        </div>

        <button type="button" class="cr-btn ${phase !== 'idle' ? 'off' : ''}" id="crStartCraftBtn" style="background: linear-gradient(135deg, ${esc(slot0Gift.backdrop?.center || '#584ee8')}, ${esc(slot0Gift.backdrop?.edge || '#352ea8')})">
          <span>Sovgʻa tayyorlash</span>
          <small>Muvaffaqiyat imkoniyati ${fmtPct(totalPermille)}</small>
        </button>
      </div>
    `;
  }

  function bindCraftEvents() {
    document.getElementById('crBtnBack')?.addEventListener('click', () => {
      sheet = null;
      renderCraftDOM();
    });

    document.getElementById('crOpenModelsBtn')?.addEventListener('click', () => {
      sheet = 'models';
      renderCraftDOM();
    });

    body.querySelectorAll('[data-open-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSlotPick = parseInt(btn.getAttribute('data-open-pick'), 10);
        sheet = 'pick';
        renderCraftDOM();
      });
    });

    body.querySelectorAll('[data-clear-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-clear-slot'), 10);
        slots[idx] = null;
        renderCraftDOM();
      });
    });

    body.querySelectorAll('[data-pick-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-pick-id');
        const cand = (craftData.candidates || []).find(c => c.id === cid);
        if (!cand) return;
        const existingIdx = slots.findIndex((s, i) => i > 0 && s && s.id === cid);
        if (existingIdx > 0) {
          slots[existingIdx] = null;
          sheet = null;
          renderCraftDOM();
          return;
        }
        slots[activeSlotPick] = cand;
        sheet = null;
        renderCraftDOM();
      });
    });

    document.getElementById('crFailDoneBtn')?.addEventListener('click', () => {
      closeGiftModal();
    });

    document.getElementById('crStartCraftBtn')?.addEventListener('click', () => {
      if (phase !== 'idle') return;
      startCubeCraftAnimation();
    });
  }

  function startCubeCraftAnimation() {
    phase = 'crafting';
    absorbedSlots = [false, false, false, false];
    cubeFaces = {};
    lostGiftsSnapshot = getSelectedGifts();
    renderCraftDOM();

    let rx = -14;
    let ry = 24;
    let lastT = performance.now();
    function spinCube(now) {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      ry -= 720 * dt;
      rx = -14 + Math.sin(now / 260) * 14;
      const cubeEl = document.getElementById('crSpinCube');
      if (cubeEl && phase === 'crafting') {
        cubeEl.style.transform = `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
      }
      if (phase === 'crafting') {
        cubeRaf = requestAnimationFrame(spinCube);
      }
    }
    cubeRaf = requestAnimationFrame(spinCube);

    const faceOrder = ['right', 'back', 'left', 'top'];
    const filledIndices = [0, 1, 2, 3].filter(i => slots[i]);
    filledIndices.forEach((slotIdx, k) => {
      const tStart = 120 + k * 230;
      addTimer(() => {
        absorbedSlots[slotIdx] = true;
        const slotEl = body.querySelector(`.cr-slot.s${slotIdx}`);
        if (slotEl) {
          slotEl.style.transform = `translate(${slotIdx % 2 === 0 ? 106 : -106}px, ${slotIdx < 2 ? 45 : -45}px) scale(0.28)`;
          slotEl.style.opacity = '0';
        }
      }, tStart);

      addTimer(() => {
        cubeFaces[faceOrder[k]] = slots[slotIdx];
        const faceEl = body.querySelector(`.cr-face.${faceOrder[k]}`);
        if (faceEl && slots[slotIdx]) {
          const fg = slots[slotIdx];
          faceEl.innerHTML = `
            <span class="cr-face-art">
              <canvas class="unique-backdrop" id="crFaceCvs_${k}"></canvas>
              <img src="${esc(fg.model?.img || '')}" alt="" />
            </span>
          `;
          drawUniqueBackdrop(document.getElementById(`crFaceCvs_${k}`), fg.backdrop, fg.pattern, { compact: true });
        }
      }, tStart + 360);
    });

    const minAnimTime = 2300 + filledIndices.length * 180;
    const t0 = performance.now();

    api('/api/gifts/craft', {
      method: 'POST',
      body: JSON.stringify({
        username: STATE.user.username,
        giftId: gift.id,
        with: slots.slice(1).filter(Boolean).map(s => s.id)
      })
    }).then(res => {
      const wait = Math.max(0, minAnimTime - (performance.now() - t0));
      addTimer(async () => {
        cancelAnimationFrame(cubeRaf);
        await Promise.all([loginUser(STATE.user.displayName), loadCollections(), loadAdminData()]);

        if (!res.ok) {
          showToast(res.error || 'Xatolik yuz berdi');
          phase = 'idle';
          absorbedSlots = [false, false, false, false];
          renderCraftDOM();
          return;
        }

        if (res.crafted && res.gift) {
          phase = 'win';
          renderCraftDOM();
          launchEdgeConfetti();
          addTimer(() => {
            openGiftModal(res.gift, 'view');
          }, 550);
        } else {
          phase = 'burst';
          renderCraftDOM();
          addTimer(() => {
            phase = 'failed';
            renderCraftDOM();
          }, 520);
        }
      }, wait);
    });
  }

  renderCraftDOM();

  STATE.cleanupModal = () => {
    cancelAnimationFrame(cubeRaf);
    timers.forEach(clearTimeout);
  };
}

// ============================================================================
// Secondary Modals: Shop Buy (ONLY regular buy!) / Transfer / Sell / Stars / User
// ============================================================================
function openSubModal(title, html, onMount) {
  const bd = document.getElementById('subModalBackdrop');
  document.getElementById('subModalTitle').textContent = title;
  const body = document.getElementById('subModalBody');
  body.innerHTML = html;
  bd.hidden = false;
  if (onMount) onMount(body);
}

let activeInvoicePollTimer = 0;

function closeSubModal() {
  if (activeInvoicePollTimer) {
    clearInterval(activeInvoicePollTimer);
    activeInvoicePollTimer = 0;
  }
  document.getElementById('subModalBackdrop').hidden = true;
}

function openBuyCollectionSheet(c) {
  let qty = 1;
  const maxBuy = Math.min(100, Math.max(1, c.remainingToBuy || 1));

  function calc(q) {
    const totalCost = (c.base || c.price || 250) * q;
    const userStars = STATE.user?.stars || 0;
    const hasEnough = userStars >= totalCost;
    const deficit = Math.max(0, totalCost - userStars);
    return { totalCost, userStars, hasEnough, deficit };
  }

  const initial = calc(qty);

  openSubModal(`${c.name} sotib olish`, `
    <div class="form-stack" style="text-align:center;align-items:center;">
      <div style="width:150px;height:150px;position:relative;display:grid;place-items:center;">
        <div class="gift-glow" style="width:150px;height:150px;background:radial-gradient(circle, rgba(255,190,70,0.38) 0%, rgba(255,150,40,0) 70%);"></div>
        <div id="buyPreviewLottie" style="width:120px;height:120px;position:relative;z-index:1;"></div>
      </div>
      <div style="font-size:13px;color:var(--text-2);line-height:1.4;">
        Qolgan tiraj: <b>${fmtInt(c.remainingToBuy)} / ${fmtInt(c.supply)}</b> · Bitta narxi: <b>${svgStar(14)} ${fmtInt(c.base || c.price || 250)}</b>
      </div>

      <!-- Quantity Stepper & Presets -->
      <div class="buy-qty-card">
        <div class="buy-qty-head">
          <span>Sotib olish miqdori:</span>
          <span class="buy-qty-stock-hint">(Maks: ${maxBuy} dona)</span>
        </div>
        <div class="buy-qty-row">
          <button type="button" class="qty-btn" id="btnQtyMinus" ${qty <= 1 ? 'disabled' : ''}>−</button>
          <input type="number" class="qty-input" id="inputBuyQty" value="${qty}" min="1" max="${maxBuy}" />
          <button type="button" class="qty-btn" id="btnQtyPlus" ${qty >= maxBuy ? 'disabled' : ''}>+</button>
        </div>
        <div class="buy-qty-chips">
          <button type="button" class="qty-chip ${qty === 1 ? 'active' : ''}" data-q="1">1x</button>
          <button type="button" class="qty-chip ${qty === 2 ? 'active' : ''}" data-q="2">2x</button>
          <button type="button" class="qty-chip ${qty === 3 ? 'active' : ''}" data-q="3">3x</button>
          <button type="button" class="qty-chip ${qty === 4 ? 'active' : ''}" data-q="4">4x</button>
          <button type="button" class="qty-chip ${qty === 5 ? 'active' : ''}" data-q="5">5x</button>
          <button type="button" class="qty-chip ${qty === 10 ? 'active' : ''}" data-q="10">10x</button>
          <button type="button" class="qty-chip ${qty === maxBuy ? 'active' : ''}" data-q="${maxBuy}">Maks</button>
        </div>
      </div>

      <!-- Price & Balance Summary -->
      <div class="buy-summary-box">
        <div style="display:flex;justify-content:space-between;width:100%;font-size:14px;">
          <span>Jami toʻlov (<span id="buyQtyLabel">${qty}</span> dona):</span>
          <b id="buyTotalAmount" style="color:var(--saffron);">${svgStar(15)} ${fmtInt(initial.totalCost)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;width:100%;font-size:12.5px;color:var(--text-2);margin-top:4px;">
          <span>Balansingiz:</span>
          <b>⭐ ${fmtInt(initial.userStars)}</b>
        </div>
        <div id="buyDeficitWrap" style="font-size:12px;color:#ff8585;margin-top:4px;${initial.hasEnough ? 'display:none;' : ''}">
          Yetmayapti: <b id="buyDeficitAmount">⭐ ${fmtInt(initial.deficit)}</b>
        </div>
      </div>

      <button type="button" class="btn btn-primary gv-btn" id="btnBuyRegularOnly" ${c.remainingToBuy <= 0 ? 'disabled' : ''}>
        <span id="btnBuyLabel">${initial.hasEnough ? `Sotib olish (${qty} dona) · ${svgStar(15)} ${fmtInt(initial.totalCost)}` : `Stars orqali olish · ${svgStar(15)} ${fmtInt(initial.deficit)}`}</span>
      </button>
      <button type="button" class="btn btn-tonal gv-btn" id="btnPreviewModelsList" style="height:38px;font-size:13px;">
        <span>👁 Modellar va % ehtimolliklarni koʻrish (${c.modelsCount || 28} model${c.craftModelsCount ? ` · ${c.craftModelsCount} craft` : ''})</span>
      </button>
    </div>
  `, (body) => {
    mountLottieOrImg(body.querySelector('#buyPreviewLottie'), {
      imgUrl: c.thumb,
      jsonUrl: c.baseTgs,
      size: 120,
      loop: true,
      autoplay: true
    });

    const minusBtn = body.querySelector('#btnQtyMinus');
    const plusBtn = body.querySelector('#btnQtyPlus');
    const inputQty = body.querySelector('#inputBuyQty');
    const chips = body.querySelectorAll('.qty-chip');
    const qtyLbl = body.querySelector('#buyQtyLabel');
    const totalAmt = body.querySelector('#buyTotalAmount');
    const deficitWrap = body.querySelector('#buyDeficitWrap');
    const deficitAmt = body.querySelector('#buyDeficitAmount');
    const buyBtnLabel = body.querySelector('#btnBuyLabel');

    function updateQty(newQ) {
      qty = Math.max(1, Math.min(maxBuy, parseInt(newQ, 10) || 1));
      if (inputQty) inputQty.value = qty;
      if (minusBtn) minusBtn.disabled = qty <= 1;
      if (plusBtn) plusBtn.disabled = qty >= maxBuy;

      chips.forEach(ch => {
        const qVal = parseInt(ch.getAttribute('data-q'), 10);
        ch.classList.toggle('active', qVal === qty);
      });

      const { totalCost, hasEnough, deficit } = calc(qty);
      if (qtyLbl) qtyLbl.textContent = qty;
      if (totalAmt) totalAmt.innerHTML = `${svgStar(15)} ${fmtInt(totalCost)}`;
      if (deficitWrap) deficitWrap.style.display = hasEnough ? 'none' : 'block';
      if (deficitAmt) deficitAmt.textContent = `⭐ ${fmtInt(deficit)}`;
      if (buyBtnLabel) {
        buyBtnLabel.innerHTML = hasEnough
          ? `Sotib olish (${qty} dona) · ${svgStar(15)} ${fmtInt(totalCost)}`
          : `Stars orqali olish · ${svgStar(15)} ${fmtInt(deficit)}`;
      }
    }

    minusBtn?.addEventListener('click', () => updateQty(qty - 1));
    plusBtn?.addEventListener('click', () => updateQty(qty + 1));
    inputQty?.addEventListener('input', (e) => updateQty(e.target.value));
    chips.forEach(ch => {
      ch.addEventListener('click', () => {
        const qVal = parseInt(ch.getAttribute('data-q'), 10);
        updateQty(qVal);
      });
    });

    body.querySelector('#btnPreviewModelsList')?.addEventListener('click', () => {
      openCollectionModelsExplorer(c);
    });

    body.querySelector('#btnBuyRegularOnly')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const { totalCost, hasEnough, deficit } = calc(qty);

      if (!hasEnough) {
        const need = Math.max(1, deficit);
        openAddStarsModal(need, `${c.name} (${qty} dona) sotib olish`, async () => {
          const buyRes = await api('/api/gifts/buy', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.user.username, slug: c.slug, count: qty })
          });
          if (buyRes.ok) {
            await Promise.all([loginUser(STATE.user.username), loadCollections()]);
            showToast(`🎉 ${qty} ta ${c.name} sotib olindi!`);
            STATE.viewedProfile = null;
            switchTab('inventory');
            if (buyRes.gift) openGiftModal(buyRes.gift, 'view');
          }
        });
        return;
      }

      btn.disabled = true;
      const res = await api('/api/gifts/buy', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.user.username, slug: c.slug, count: qty })
      });

      if (!res.ok) {
        btn.disabled = false;
        if (res.needStars) {
          openAddStarsModal(res.deficit || totalCost, `${c.name} (${qty} dona) sotib olish`);
          return;
        }
        return showToast(res.error || 'Xarid amalga oshmadi');
      }

      closeSubModal();
      await Promise.all([loginUser(STATE.user.username), loadCollections()]);
      showToast(`🎉 ${qty} ta ${c.name} sotib olindi!`);
      STATE.viewedProfile = null;
      switchTab('inventory');
      if (res.gift) openGiftModal(res.gift, 'view');
    });
  });
}

async function openCollectionModelsExplorer(c) {
  openSubModal(`${c.name} — Modellar katalogi`, `<div style="text-align:center;padding:24px;color:var(--text-2);">Yuklanmoqda...</div>`, async (body) => {
    const res = await api(`/api/collections/${encodeURIComponent(c.slug)}`);
    if (!res.ok || !res.collection) {
      body.innerHTML = `<div style="padding:20px;color:#ff8585;">Xatolik yuz berdi</div>`;
      return;
    }
    const col = res.collection;
    const regModels = col.models || [];
    const craftModels = col.craftModels || [];

    body.innerHTML = `
      <div class="form-stack">
        <div id="expLiveStage" style="display:flex;flex-direction:column;align-items:center;padding:12px;border-radius:18px;background:radial-gradient(circle, rgba(108,99,255,0.22) 0%, rgba(18,20,30,0.92) 78%);border:1px solid rgba(255,255,255,0.12);">
          <div id="expLiveLottie" style="width:128px;height:128px;cursor:pointer;" title="Qayta oʻynatish uchun bosing"></div>
          <strong id="expLiveName" style="font-size:15px;margin-top:4px;color:#fff;"></strong>
          <span id="expLiveRarity" style="font-size:12px;color:#93c5fd;font-weight:700;"></span>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="filter-chip active" id="expTabReg">Noyob Upgrade Modellar (${regModels.length})</button>
          ${craftModels.length ? `<button type="button" class="filter-chip" id="expTabCraft">Maxfiy Craft (${craftModels.length})</button>` : ''}
        </div>
        <div class="models-explorer-grid" id="expGrid"></div>
        <button type="button" class="btn btn-tonal gv-btn" id="btnBackToBuySheet" style="height:40px;">← Orqaga qaytish</button>
      </div>
    `;

    const grid = body.querySelector('#expGrid');
    const lottieBox = body.querySelector('#expLiveLottie');
    const nameEl = body.querySelector('#expLiveName');
    const rarityEl = body.querySelector('#expLiveRarity');
    let activeLottie = null;

    const previewModel = (m, isCraft) => {
      if (!m) return;
      if (activeLottie) activeLottie.destroy();
      nameEl.textContent = m.name;
      rarityEl.textContent = isCraft && m.tier ? (TIER_LABELS[m.tier] || m.tier) : `Kamyoblik: ${fmtPct(m.rarity)}`;
      activeLottie = mountLottieOrImg(lottieBox, {
        imgUrl: m.img,
        jsonUrl: m.tgs,
        size: 128,
        loop: true,
        autoplay: true
      });
    };

    lottieBox?.addEventListener('click', () => {
      if (activeLottie) activeLottie.play();
    });

    const renderItems = (items, isCraft) => {
      grid.innerHTML = items.map((m, idx) => `
        <div class="model-preview-card" data-midx="${idx}" style="cursor:pointer;">
          <img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" />
          <strong>${esc(m.name)}</strong>
          <span>${isCraft && m.tier ? esc(TIER_LABELS[m.tier] || m.tier) : fmtPct(m.rarity)}</span>
        </div>
      `).join('');
      grid.querySelectorAll('[data-midx]').forEach(card => {
        card.addEventListener('click', () => {
          const i = parseInt(card.getAttribute('data-midx'), 10);
          previewModel(items[i], isCraft);
        });
      });
      if (items[0]) previewModel(items[0], isCraft);
    };

    renderItems(regModels, false);

    body.querySelector('#expTabReg')?.addEventListener('click', (e) => {
      e.currentTarget.classList.add('active');
      body.querySelector('#expTabCraft')?.classList.remove('active');
      renderItems(regModels, false);
    });
    body.querySelector('#expTabCraft')?.addEventListener('click', (e) => {
      e.currentTarget.classList.add('active');
      body.querySelector('#expTabReg')?.classList.remove('active');
      renderItems(craftModels, true);
    });
    body.querySelector('#btnBackToBuySheet')?.addEventListener('click', () => {
      if (activeLottie) activeLottie.destroy();
      openBuyCollectionSheet(c);
    });
  });
}

function openListMyGiftPickerModal() {
  const candidates = STATE.inventory.filter(g => g.state === 'upgraded' && !g.salePrice);
  if (!candidates.length) {
    showToast('Sotuvga qoʻyish uchun avval sovgʻangizni Upgrade qiling!');
    STATE.viewedProfile = null;
    switchTab('inventory');
    return;
  }
  openSubModal('Marketga sovgʻa chiqarish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:13.5px;">Sotuvga qoʻymoqchi boʻlgan noyob sovgʻangizni tanlang:</p>
      <div class="models-explorer-grid">
        ${candidates.map(g => `
          <div class="model-preview-card" data-pick-sell="${esc(g.id)}" style="cursor:pointer;">
            <img src="${esc(g.model?.img || g.thumb)}" alt="" />
            <strong>${esc(g.name)} #${fmtInt(g.number)}</strong>
            <span>${esc(g.model?.name || '')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `, (body) => {
    body.querySelectorAll('[data-pick-sell]').forEach(el => {
      el.addEventListener('click', () => {
        const gid = el.getAttribute('data-pick-sell');
        const g = candidates.find(x => x.id === gid);
        if (g) openSellPrompt(g);
      });
    });
  });
}

function openEditBioModal() {
  openSubModal('Profil maʼlumotlarini tahrirlash', `
    <div class="form-stack">
      <label style="font-size:12.5px;color:var(--text-2);font-weight:600;">Koʻrinadigan ism:</label>
      <div class="form-field">
        <input type="text" id="inpEditDispName" value="${esc(STATE.user?.displayName || '')}" maxlength="32" />
      </div>
      <label style="font-size:12.5px;color:var(--text-2);font-weight:600;">Profil bio (status matni):</label>
      <div class="form-field">
        <input type="text" id="inpEditBioText" value="${esc(STATE.user?.bio || '')}" placeholder="Masalan: Kolleksioner · Noyob sovgʻalar savdosi" maxlength="140" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnSaveBio">Saqlash</button>
    </div>
  `, (body) => {
    body.querySelector('#btnSaveBio')?.addEventListener('click', async () => {
      const displayName = body.querySelector('#inpEditDispName').value.trim();
      const bio = body.querySelector('#inpEditBioText').value.trim();
      const res = await api('/api/user/profile', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.user.username,
          displayName,
          bio
        })
      });
      if (res.ok) {
        STATE.user = res.user;
        STATE.myProfile = res.profile;
        closeSubModal();
        renderHeaderUser();
        renderProfileView();
        showToast('Profil yangilandi!');
      }
    });
  });
}

function openTransferPrompt(gift) {
  openSubModal('Sovgʻani boshqa profilga oʻtkazish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:14px;"><b>${esc(gift.name)}${gift.number ? ' #' + fmtInt(gift.number) : ''}</b> sovgʻasini qaysi foydalanuvchining profiliga oʻtkazmoqchisiz?</p>
      <div class="form-field">
        <span>@</span>
        <input type="text" id="inpTransferTo" placeholder="username kiriting..." autocomplete="off" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnConfirmTransfer">🔄 Oʻtkazish</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpTransferTo');
    inp.focus();
    body.querySelector('#btnConfirmTransfer').addEventListener('click', async () => {
      const toUsername = inp.value.trim().replace(/^@/, '');
      if (!toUsername) return showToast('Qabul qiluvchi username kiriting');
      closeSubModal();
      await performGiftAction(gift, 'transfer', { toUsername });
      showToast(`🎁 Sovgʻa @${toUsername} profiliga oʻtkazildi!`);
    });
  });
}

function openSellPrompt(gift) {
  openSubModal('🏪 Marketda sotuvga qoʻyish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:14px;"><b>${esc(gift.name)} #${fmtInt(gift.number)} (${esc(gift.model?.name || '')})</b> uchun yulduzlar narxini belgilang. Xaridor topilishi bilan yulduzlar balansingizga tushadi:</p>
      <div class="form-field">
        <span style="color:var(--saffron)">${svgStar(18)}</span>
        <input type="number" id="inpSellPrice" value="${gift.salePrice || gift.valueStars || 350}" min="1" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnConfirmSell">🏷 Marketga chiqarish</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpSellPrice');
    inp.focus();
    body.querySelector('#btnConfirmSell').addEventListener('click', async () => {
      const price = parseInt(inp.value, 10);
      if (!(price > 0)) return showToast('Narxni toʻgʻri kiriting');
      closeSubModal();
      await performGiftAction(gift, 'sell', { price });
      showToast(`🏷 Marketga chiqarildi: ⭐ ${fmtInt(price)}`);
    });
  });
}

function openAddStarsModal(defaultAmount = 250, purpose = '', onPaid = null) {
  const initAmt = typeof defaultAmount === 'number' && defaultAmount > 0 ? defaultAmount : 250;
  const presets = [50, 100, 250, 500, 1000, 2500];

  openSubModal('PaxtaGram Stars orqali toʻldirish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:13.5px;line-height:1.45;">
        ${purpose ? `<b>${esc(purpose)}</b> uchun ` : ''}<b>@UpgradeBot</b> orqali rasmiy <b>PaxtaGram Stars</b> hisobingizdan yulduzlar oʻtkazing:
      </p>
      <div class="star-packages">
        ${presets.map(amt => `
          <button type="button" class="star-pkg-btn" data-amt="${amt}">
            <span style="color:var(--saffron);display:inline-flex;align-items:center;gap:4px;font-size:16px;">${svgStar(17)} +${fmtInt(amt)}</span>
            <small style="color:var(--text-2);font-weight:500;">PaxtaGram Stars</small>
          </button>
        `).join('')}
      </div>
      <div class="form-field" style="margin-top:4px;">
        <span style="color:var(--saffron)">${svgStar(18)}</span>
        <input type="number" id="inpCustomStars" value="${initAmt}" min="1" max="100000" placeholder="Miqdorni kiriting..." />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnPayPaxtaStars">
        <span>PaxtaGram Stars bilan toʻlash · ${svgStar(15)} <span id="lblPayStarsAmt">${fmtInt(initAmt)}</span></span>
      </button>
      <div id="invoiceWaitBox" hidden style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid var(--border);text-align:center;font-size:13px;color:var(--text-2);">
        <div style="margin-bottom:8px;color:var(--text);font-weight:600;">⏳ PaxtaGram toʻlovi kutilmoqda...</div>
        <div style="margin-bottom:10px;">PaxtaGram oynasida <b>«Toʻlash»</b> tugmasini bosing. Toʻlov tasdiqlanishi bilan balans avtomatik yangilanadi.</div>
        <a id="lnkOpenInvoice" href="#" target="_blank" rel="noopener" class="btn btn-primary gv-btn" style="display:inline-flex;text-decoration:none;height:38px;font-size:13px;padding:0 16px;">
          ⭐ PaxtaGram toʻlov oynasini ochish
        </a>
      </div>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpCustomStars');
    const lbl = body.querySelector('#lblPayStarsAmt');
    const payBtn = body.querySelector('#btnPayPaxtaStars');
    const waitBox = body.querySelector('#invoiceWaitBox');
    const lnkOpen = body.querySelector('#lnkOpenInvoice');

    inp.addEventListener('input', () => {
      const v = Math.max(1, parseInt(inp.value, 10) || 1);
      lbl.textContent = fmtInt(v);
    });

    async function startInvoicePayment(amount) {
      if (!(amount > 0)) return showToast('Miqdorni toʻgʻri kiriting');
      payBtn.disabled = true;
      payBtn.innerHTML = `<span>Hisob-faktura yaratilmoqda...</span>`;

      const res = await api('/api/stars/create-invoice', {
        method: 'POST',
        body: JSON.stringify({
          username: STATE.user.username,
          amount,
          purpose
        })
      });

      if (!res.ok) {
        payBtn.disabled = false;
        payBtn.innerHTML = `<span>PaxtaGram Stars bilan toʻlash · ${svgStar(15)} <span id="lblPayStarsAmt">${fmtInt(amount)}</span></span>`;
        return showToast(res.error || 'Xatolik yuz berdi');
      }

      waitBox.hidden = false;
      lnkOpen.href = res.webInvoiceUrl;

      if (isInsidePaxtaMiniApp() && res.slug) {
        notifyPaxtaMiniApp('web_app_open_invoice', { slug: res.slug });
      } else {
        window.open(res.webInvoiceUrl, '_blank', 'noopener');
      }

      if (activeInvoicePollTimer) clearInterval(activeInvoicePollTimer);
      activeInvoicePollTimer = setInterval(async () => {
        try {
          const st = await api(`/api/stars/status/${encodeURIComponent(res.nonce)}`);
          if (st.ok && st.status === 'paid') {
            clearInterval(activeInvoicePollTimer);
            activeInvoicePollTimer = 0;
            STATE.user.stars = st.stars;
            if (st.authToken) {
              STATE.authToken = st.authToken;
              localStorage.setItem('paxta_gift_auth_token', st.authToken);
            }
            if (st.isAdmin) {
              STATE.user.isAdmin = true;
              const adminTabBtn = document.getElementById('tabAdmin');
              const adminTabMobileBtn = document.getElementById('tabAdminMobile');
              if (adminTabBtn) adminTabBtn.hidden = false;
              if (adminTabMobileBtn) adminTabMobileBtn.hidden = false;
            }
            renderHeaderUser();
            closeSubModal();
            launchEdgeConfetti();
            showToast(`+${fmtInt(st.amount)} PaxtaGram Stars hisobingizga tushdi!`);
            if (typeof onPaid === 'function') onPaid();
          }
        } catch {}
      }, 1000);
    }

    body.querySelectorAll('[data-amt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = parseInt(btn.getAttribute('data-amt'), 10);
        inp.value = amt;
        lbl.textContent = fmtInt(amt);
        startInvoicePayment(amt);
      });
    });

    payBtn.addEventListener('click', () => {
      const amt = Math.max(1, parseInt(inp.value, 10) || initAmt);
      startInvoicePayment(amt);
    });
  });
}

function openSwitchUserModal() {
  openSubModal('PaxtaGram Profil', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:14px;">PaxtaGram username orqali kirish (avvalgi barcha sovgʻa va yulduzlaringiz saqlanadi):</p>
      <div class="form-field">
        <span>@</span>
        <input type="text" id="inpUserName" value="${esc(STATE.user?.username || 'Muhammadiso')}" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnSaveUser">Kirish</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpUserName');
    inp.focus();
    body.querySelector('#btnSaveUser').addEventListener('click', async () => {
      const val = inp.value.trim().replace(/^@/, '');
      if (!val) return;
      closeSubModal();
      STATE.viewedProfile = null;
      await loginUser(val);
      showToast(`Profil: @${STATE.user?.username || val}`);
    });
  });
}

function switchTab(tab) {
  if (tab === 'admin' && !STATE.user?.isAdmin) {
    return showToast('Admin panel faqat ID 100 uchun ochiq');
  }
  STATE.activeTab = tab;
  document.querySelectorAll('.main-tab, .ios-tab-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('paneShop').hidden = tab !== 'shop';
  document.getElementById('paneMarket').hidden = tab !== 'market';
  document.getElementById('paneInventory').hidden = tab !== 'inventory';
  document.getElementById('paneExplore').hidden = tab !== 'explore';
  document.getElementById('paneAdmin').hidden = tab !== 'admin';

  if (tab !== 'inventory') {
    STATE.selectMode = false;
    STATE.selectedGiftIds.clear();
    const bBar = document.getElementById('batchBurnBar');
    if (bBar) bBar.hidden = true;
  }

  if (tab === 'shop') loadCollections();
  if (tab === 'market') loadMarket();
  if (tab === 'inventory') renderProfileView();
  if (tab === 'explore') loadExploreData();
  if (tab === 'admin') loadAdminData();
}

let shopCarouselTimer = null;
let currentShopSlide = 0;

function initShopCarousel() {
  const slides = document.querySelectorAll('.shop-slide');
  const dots = document.querySelectorAll('.shop-dot');
  if (!slides.length) return;

  function setSlide(index) {
    currentShopSlide = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('active', i === currentShopSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentShopSlide));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = parseInt(dot.dataset.slideTarget || '0', 10);
      setSlide(target);
      restartShopTimer();
    });
  });

  document.querySelectorAll('[data-buy-slug]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const slug = btn.dataset.buySlug;
      const col = (STATE.collections || []).find(c => c.slug === slug || c.id === slug);
      if (col) {
        openBuyCollectionSheet(col);
      } else {
        const fallback = {
          slug,
          id: slug,
          name: slug === 'durovscap' ? "Durov’s Cap" : slug === 'imperialcrown' ? 'Imperial Crown' : 'Ice Cream',
          base: slug === 'durovscap' ? 5000 : slug === 'imperialcrown' ? 250 : 25,
          upgrade: slug === 'durovscap' ? 500 : slug === 'imperialcrown' ? 100 : 25,
          supply: slug === 'durovscap' ? 30 : slug === 'imperialcrown' ? 250 : 342255,
          remainingToBuy: slug === 'durovscap' ? 30 : slug === 'imperialcrown' ? 250 : 342255
        };
        openBuyCollectionSheet(fallback);
      }
    });
  });

  slides.forEach(slide => {
    slide.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (slide.dataset.action === 'scroll-calendars') {
        setShopMode('calendars');
        const sec = document.getElementById('channelCalendarsSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const slug = slide.dataset.slug;
      if (slug) {
        const col = (STATE.collections || []).find(c => c.slug === slug || c.id === slug);
        if (col) openBuyCollectionSheet(col);
      }
    });
  });

  function startShopTimer() {
    stopShopTimer();
    shopCarouselTimer = setInterval(() => {
      setSlide(currentShopSlide + 1);
    }, 5500);
  }

  function stopShopTimer() {
    if (shopCarouselTimer) clearInterval(shopCarouselTimer);
    shopCarouselTimer = null;
  }

  function restartShopTimer() {
    startShopTimer();
  }

  const wrap = document.querySelector('.shop-hero-carousel-wrap');
  if (wrap) {
    wrap.addEventListener('mouseenter', stopShopTimer);
    wrap.addEventListener('mouseleave', startShopTimer);
    wrap.addEventListener('touchstart', stopShopTimer, { passive: true });
    wrap.addEventListener('touchend', startShopTimer, { passive: true });
  }

  startShopTimer();
}

function checkAndShowAnnouncementModal() {
  const seenKey = 'paxta_notice_seen_v5k_stars';
  if (localStorage.getItem(seenKey)) return;

  openSubModal('🛠 Texnik Yangilanish & Kompensatsiya', `
    <div class="announcement-modal-body">
      <div class="announcement-badge">
        <span class="announcement-icon">💎</span>
        <span>Rasmiy Xabarnoma</span>
      </div>
      <h3 class="announcement-title">Hurmatli foydalanuvchilar!</h3>
      <p class="announcement-desc">
        Ilovada maʼlumotlar xavfsizligini taʼminlash uchun keng koʻlamli texnik ishlar olib borildi va barcha xatoliklar bartaraf etildi. Maʼlumotlar bazasi mustaqil <b>Turso Cloud</b> tizimiga ulandi.
      </p>
      <div class="announcement-alert">
        <p>Keltirilgan noqulayliklar uchun <b>uzr soʻraymiz!</b></p>
        <p>Barcha sovgʻalar qayta tartibga solindi va kompensatsiya sifatida barcha top foydalanuvchilar hisobiga toʻliq <b style="color:var(--saffron);">5,000 ⭐ Stars</b> taqdim etildi!</p>
      </div>
      <div class="announcement-perks">
        <div class="aperk-item">
          <span>👑</span>
          <div><b>Durov's Cap (Genesis)</b> — 30 dona tiraj toʻliq tiklandi</div>
        </div>
        <div class="aperk-item">
          <span>👑</span>
          <div><b>Imperial Crown VIP</b> — Doʻkonda mavjud</div>
        </div>
        <div class="aperk-item">
          <span>🍦</span>
          <div><b>Ice Cream Classic</b> — 25 ⭐ bilan ochiq</div>
        </div>
      </div>
      <button type="button" class="btn btn-primary announcement-btn" id="btnCloseNoticeModal">
        🚀 Tushunarli, rahmat! (5,000 ⭐ bilan boshlash)
      </button>
    </div>
  `, (body) => {
    body.querySelector('#btnCloseNoticeModal')?.addEventListener('click', () => {
      localStorage.setItem(seenKey, 'true');
      closeSubModal();
      launchEdgeConfetti();
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.main-tab, .ios-tab-item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'inventory') {
        STATE.viewedProfile = null;
      }
      switchTab(btn.dataset.tab);
    });
  });

  document.getElementById('brandHome')?.addEventListener('click', () => switchTab('shop'));

  // Hero Calendar Vitrina Banner Click
  document.getElementById('btnHeroGoCalendars')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setShopMode('calendars');
    const sec = document.getElementById('channelCalendarsSection');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Shop Mode Switcher (Barchasi / Rasmiy / Real Kalendarlar)
  document.querySelectorAll('.shop-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setShopMode(btn.dataset.shopMode || 'all');
    });
  });

  // Real Channel Desk Calendars Search & Filters
  document.getElementById('calendarSearch')?.addEventListener('input', (e) => {
    STATE.calendarQuery = e.target.value;
    renderChannelCalendars();
  });

  document.querySelectorAll('#calendarFilterChips .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#calendarFilterChips .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.calendarFilter = chip.dataset.cfilter || 'all';
      renderChannelCalendars();
    });
  });

  // Profile filters
  document.querySelectorAll('#paneInventory .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#paneInventory .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.invFilter = chip.dataset.filter;
      renderProfileView();
    });
  });

  // Profile Select Mode & Batch Burn listeners
  document.getElementById('btnToggleSelectMode')?.addEventListener('click', () => {
    STATE.selectMode = !STATE.selectMode;
    if (!STATE.selectMode) {
      STATE.selectedGiftIds.clear();
    }
    renderProfileView();
  });

  document.getElementById('btnCancelSelectMode')?.addEventListener('click', () => {
    STATE.selectMode = false;
    STATE.selectedGiftIds.clear();
    renderProfileView();
  });

  document.getElementById('btnBatchBurnSubmit')?.addEventListener('click', () => {
    executeBatchBurn();
  });

  document.getElementById('btnBackToMyProfile')?.addEventListener('click', () => {
    STATE.viewedProfile = null;
    renderProfileView();
  });
  document.getElementById('profActShop')?.addEventListener('click', () => switchTab('shop'));
  document.getElementById('profActStars')?.addEventListener('click', () => openAddStarsModal(250));
  document.getElementById('profActPromo')?.addEventListener('click', openPromoModal);
  document.getElementById('btnMarketRules')?.addEventListener('click', () => {
    openSubModal('Qayta Sotuv Bozori Qoidalari', `
      <div class="form-stack" style="font-size:14px;line-height:1.6;color:var(--text-2);">
        <p><b style="color:#fff;">1. Komissiya 10%:</b> Sovgʻangiz sotilganda, mablagʻning 90% qismi darhol va avtomatik Stars balansingizga oʻtkaziladi (10% platforma komissiyasi).</p>
        <p><b style="color:#fff;">2. Tezkor hisob-kitob:</b> Boshqa foydalanuvchi sovgʻangizni sotib olgan soniyadayoq Stars balansingizga oʻtadi va PaxtaGram botingizga xabar yuboriladi.</p>
        <p><b style="color:#fff;">3. Qaytarib olish:</b> Istalgan vaqtda sovgʻangizni bepul sotuvdan qaytarib olishingiz mumkin.</p>
        <p><b style="color:#fff;">4. Faqat Upgraded:</b> Bozorga faqat yaxshilangan (Upgraded) va Craft qilingan noyob sovgʻalar chiqariladi.</p>
      </div>
    `);
  });
  document.getElementById('btnEditBio')?.addEventListener('click', openEditBioModal);
  document.getElementById('btnShareProfile')?.addEventListener('click', async () => {
    const profUser = (STATE.viewedProfile || STATE.user)?.username || 'user';
    const url = `${window.location.origin}/?profile=${encodeURIComponent(profUser)}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(`@${profUser} profil havolasi nusxalandi!`);
    } catch {
      showToast(url);
    }
  });

  // Market filters & search
  document.querySelectorAll('#paneMarket .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#paneMarket .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.marketFilter = chip.dataset.mfilter;
      renderMarket();
    });
  });
  document.getElementById('marketSearch')?.addEventListener('input', (e) => {
    STATE.marketQuery = e.target.value;
    renderMarket();
  });
  document.getElementById('btnGoListMyGift')?.addEventListener('click', openListMyGiftPickerModal);

  // Explore / Collectors search
  const dirInp = document.getElementById('userDirectorySearch');
  dirInp?.addEventListener('input', (e) => {
    loadExploreData(e.target.value);
  });
  document.getElementById('btnOpenSearchedProfile')?.addEventListener('click', () => {
    const v = dirInp?.value.trim().replace(/^@/, '');
    if (v) openUserProfile(v);
  });

  // Admin filters & actions
  document.querySelectorAll('#paneAdmin .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#paneAdmin .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.adminFilter = chip.dataset.afilter;
      renderAdminPanel();
    });
  });

  document.getElementById('adminSearch')?.addEventListener('input', (e) => {
    STATE.adminQuery = e.target.value;
    renderAdminPanel();
  });

  document.getElementById('adminBtnOnlyCoinflip')?.addEventListener('click', async () => {
    await api('/api/admin/bulk', { method: 'POST', body: JSON.stringify({ mode: 'only_coinflip' }) });
    showToast('Faqat Coin Flip doʻkonda qoldirildi!');
    await Promise.all([loadAdminData(), loadCollections()]);
  });

  document.getElementById('adminBtnEnableAll')?.addEventListener('click', async () => {
    await api('/api/admin/bulk', { method: 'POST', body: JSON.stringify({ mode: 'enable_all' }) });
    showToast('Barcha 125 ta gift doʻkonda yoqildi!');
    await Promise.all([loadAdminData(), loadCollections()]);
  });

  // Admin Sub-Navigation Tabs
  document.querySelectorAll('.admin-subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.adminSubtab = btn.dataset.subtab || 'collections';
      renderAdminPanel();
    });
  });

  // Admin User Search & Refresh
  document.getElementById('adminUserSearch')?.addEventListener('input', (e) => {
    STATE.adminUserQuery = e.target.value;
    renderAdminUsers();
  });
  document.getElementById('adminBtnRefreshUsers')?.addEventListener('click', async () => {
    showToast('Foydalanuvchilar yangilanmoqda...');
    await loadAdminData();
  });

  // Admin Create Promo Code
  document.getElementById('adminBtnCreatePromo')?.addEventListener('click', async () => {
    const codeEl = document.getElementById('adminNewPromoCode');
    const starsEl = document.getElementById('adminNewPromoStars');
    const maxEl = document.getElementById('adminNewPromoMax');
    const code = (codeEl?.value || '').trim();
    const stars = parseInt(starsEl?.value, 10) || 100;
    const maxUses = parseInt(maxEl?.value, 10) || 50;

    if (!code || code.length < 3) {
      showToast('Promokod kamida 3 belgidan iborat boʻlishi kerak');
      codeEl?.focus();
      return;
    }

    const res = await api('/api/admin/promocode', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        code,
        stars,
        maxUses
      })
    });

    if (res.ok) {
      showToast(`Promokod "${res.promocode.code}" muvaffaqiyatli yaratildi!`);
      if (codeEl) codeEl.value = '';
      await loadAdminData();
    } else {
      showToast(res.error || 'Xatolik');
    }
  });

  // Promo Code Button in Header
  document.getElementById('btnOpenPromo')?.addEventListener('click', openPromoModal);

  document.getElementById('btnAddStars')?.addEventListener('click', () => openAddStarsModal(250));
  document.getElementById('btnSwitchUser')?.addEventListener('click', openSwitchUserModal);
  document.getElementById('subModalClose')?.addEventListener('click', closeSubModal);

  document.getElementById('giftModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'giftModalBackdrop') closeGiftModal();
  });
  document.getElementById('subModalBackdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'subModalBackdrop') closeSubModal();
  });

  notifyPaxtaMiniApp('web_app_ready');
  notifyPaxtaMiniApp('web_app_expand');
  initShopCarousel();
  await Promise.all([loginUser(), loadCollections(), loadMarket()]);
  setTimeout(checkAndShowAnnouncementModal, 700);

  // Support deep-linking to any user's profile via ?profile=username
  const urlParams = new URLSearchParams(window.location.search);
  const deepProfile = urlParams.get('profile');
  if (deepProfile) {
    openUserProfile(deepProfile);
  }
});
