// Paxta Gifts — Do'kon, Profil, Upgrade, Craft & Admin Panel (No Sound Effects)

const STATE = {
  user: null,
  inventory: [],
  collections: [],
  adminCollections: [],
  adminStats: { usersCount: 0, totalGifts: 0, burnedGifts: 0 },
  activeTab: 'shop',
  invFilter: 'all',
  adminFilter: 'all',
  adminQuery: '',
  activeGift: null,
  modalView: 'view',
  cleanupModal: null
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
  return Number(n || 0).toLocaleString('ru-RU');
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

async function drawUniqueBackdrop(canvas, backdrop, pattern, opts = {}) {
  if (!canvas || !backdrop) return;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, opts.width || rect.width || canvas.clientWidth || 380);
  const h = Math.max(1, opts.height || rect.height || canvas.clientHeight || 260);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h * 0.44;
  const rad = Math.hypot(w, h) * 0.62;
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rad);
  grad.addColorStop(0, backdrop.center || '#363738');
  grad.addColorStop(1, backdrop.edge || '#0e0f0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const patUrl = pattern?.img || pattern?.image_url;
  if (!patUrl) return;

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
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
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
    return webApp.user.username || webApp.user.first_name || 'Muhammadiso';
  }
  const params = new URLSearchParams(window.location.search);
  const qUser = params.get('user') || params.get('username');
  if (qUser) return qUser;
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) return tgUser.username || tgUser.first_name || 'Muhammadiso';
  return localStorage.getItem('paxta_gift_user') || 'Muhammadiso';
}

async function loginUser(username) {
  const webApp = parsePaxtaWebAppData();
  const saved = username || detectPaxtaGramUser();
  const data = await api('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({
      username: saved,
      displayName: !username && webApp?.user?.first_name ? webApp.user.first_name : undefined,
      paxtaId: !username && webApp?.user?.id ? webApp.user.id : undefined,
      initData: !username && webApp?.initData ? webApp.initData : undefined
    })
  });
  if (data.ok) {
    STATE.user = data.user;
    STATE.inventory = data.inventory || [];
    localStorage.setItem('paxta_gift_user', STATE.user.username || STATE.user.displayName);
    renderHeaderUser();
    renderInventory();
  }
}

async function loadCollections() {
  const data = await api('/api/collections');
  if (data.ok) {
    STATE.collections = data.collections || [];
    document.getElementById('shopCountBadge').textContent = STATE.collections.length;
    renderCatalog();
  }
}

async function loadAdminData() {
  const data = await api('/api/admin/collections');
  if (data.ok) {
    STATE.adminCollections = data.collections || [];
    STATE.adminStats = {
      usersCount: data.usersCount || 0,
      totalGifts: data.totalGifts || 0,
      burnedGifts: data.burnedGifts || 0
    };
    renderAdminPanel();
  }
}

function renderHeaderUser() {
  if (!STATE.user) return;
  const disp = STATE.user.displayName || STATE.user.username || 'Muhammadiso';
  const initial = disp.charAt(0).toUpperCase();
  document.getElementById('userStars').textContent = fmtInt(STATE.user.stars);
  document.getElementById('userDisplayName').textContent = disp;
  document.getElementById('userAvatar').textContent = initial;
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('profileName').textContent = disp;
  document.getElementById('invCountBadge').textContent = STATE.inventory.length;

  const wornGift = STATE.inventory.find(g => g.worn && g.state === 'upgraded');
  const badge = document.getElementById('profileWornBadge');
  if (wornGift && wornGift.model) {
    badge.hidden = false;
    badge.innerHTML = `<img src="${esc(wornGift.model.img)}" alt="" /><span>${esc(wornGift.name)} #${wornGift.number}</span>`;
  } else {
    badge.hidden = true;
  }
}

// ---- Render Shop Catalog (Only enabled collections, e.g. Coin Flip 500 supply) ----
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!STATE.collections.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>Hozircha doʻkonda faol sovgʻalar yoʻq</strong>
        <span>⚙️ Admin boʻlimiga oʻtib istalgan sovgʻani yoqishingiz mumkin.</span>
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
      <div class="catalog-card-meta">${c.modelsCount || 28} oddiy · ${c.craftModelsCount || 13} craft model</div>
      <div class="catalog-card-price">${svgStar(14)}<span>${fmtInt(c.base)}</span></div>
    `;
    el.addEventListener('click', () => openBuyCollectionSheet(c));
    grid.appendChild(el);
  }
}

// ---- Render Profile Inventory Grid ----
function renderInventory() {
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = STATE.inventory.filter(g => {
    if (STATE.invFilter === 'upgraded') return g.state === 'upgraded';
    if (STATE.invFilter === 'crafted') return g.state === 'upgraded' && g.crafted;
    if (STATE.invFilter === 'regular') return g.state === 'regular';
    return true;
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <strong>Profilingizda hozircha sovgʻalar yoʻq</strong>
        <span>Doʻkon boʻlimidan <b>Coin Flip</b> sovgʻasini sotib oling, soʻng bu yerda Upgrade va Craft qiling!</span>
        <button type="button" class="btn btn-primary btn-sm" id="btnGoToShopEmpty">Doʻkonga oʻtish</button>
      </div>
    `;
    grid.querySelector('#btnGoToShopEmpty')?.addEventListener('click', () => switchTab('shop'));
    return;
  }

  filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.state !== b.state) return a.state === 'regular' ? -1 : 1; // Show un-upgraded gifts ready to upgrade first or newest
    return (b.boughtAt || '').localeCompare(a.boughtAt || '');
  });

  for (const g of filtered) {
    grid.appendChild(buildGiftCard(g));
  }
}

function buildGiftCard(g) {
  const card = document.createElement('div');
  card.className = `gift-card ${g.state === 'regular' ? 'is-regular' : 'is-upgraded'}`;

  if (g.state === 'upgraded' && g.backdrop) {
    const cvs = document.createElement('canvas');
    cvs.className = 'unique-backdrop';
    card.appendChild(cvs);
    requestAnimationFrame(() => drawUniqueBackdrop(cvs, g.backdrop, g.symbol, { compact: true }));
  }

  if (g.crafted) {
    const rib = document.createElement('div');
    rib.className = 'gift-card-crafted-ribbon';
    rib.textContent = '✨ CRAFT';
    card.appendChild(rib);
  }

  const top = document.createElement('div');
  top.className = 'gift-card-top';
  if (g.state === 'upgraded') {
    top.innerHTML = `
      <span></span>
      <span class="gift-card-num">#${fmtInt(g.number)}</span>
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
  card.appendChild(img);

  const foot = document.createElement('div');
  foot.className = 'gift-card-foot';
  if (g.state === 'upgraded') {
    foot.innerHTML = `
      <div class="gift-card-title">${esc(g.name)} #${fmtInt(g.number)}</div>
      <div class="gift-card-sub">${esc(g.model?.name || '')}</div>
    `;
  } else {
    foot.innerHTML = `
      <div class="gift-card-title">${esc(g.name)}</div>
      <div class="gift-card-sub">✨ Yaxshilash (Upgrade)</div>
    `;
  }
  card.appendChild(foot);

  card.addEventListener('click', () => openGiftModal(g, 'view'));
  return card;
}

// ---- Render Admin Panel ----
function renderAdminPanel() {
  const statsRow = document.getElementById('adminStatsRow');
  const listEl = document.getElementById('adminList');
  if (!statsRow || !listEl) return;

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
      <strong>${fmtInt(STATE.adminStats.burnedGifts)}</strong>
      <span>Craftda yoqilgan (oʻchib ketgan) sovgʻalar</span>
    </div>
    <div class="admin-stat-card">
      <strong>${fmtInt(STATE.adminStats.usersCount)}</strong>
      <span>Roʻyxatdan oʻtgan foydalanuvchilar</span>
    </div>
  `;

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
        await Promise.all([loadAdminData(), loadCollections(), loginUser(STATE.user?.displayName)]);
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
      }
    });

    listEl.appendChild(row);
  }
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
      <button class="icon-btn" id="gvBtnCraft" title="Sovgʻa tayyorlash (Craft)">
        ${svgCraftIcon(22)}
      </button>
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

  const ownerInitial = (gift.ownerDisplayName || 'M').charAt(0).toUpperCase();
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
            <b>${esc(gift.name)} <span class="gv-unique-num">#${fmtInt(gift.number)}</span></b>
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

      <dl class="gv-table">
        <div>
          <dt>Egasi</dt>
          <dd>
            <button type="button" class="gv-from gv-owner">
              <span class="avatar">${esc(ownerInitial)}</span>
              <span>${esc(gift.ownerDisplayName || 'Muhammadiso')}</span>
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
          <dt>Qiymati</dt>
          <dd class="gv-stars">
            ${svgStar(16)}
            <span>${fmtInt(gift.valueStars)}</span>
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
              <span>#${fmtInt(gift.number)}</span>
              <span class="gv-muted">/ ${fmtInt(gift.supply)}</span>
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
  document.getElementById('gvBtnCraft')?.addEventListener('click', () => openGiftModal(gift, 'craft'));
  document.getElementById('gvBtnOpenUpgrade')?.addEventListener('click', () => openGiftModal(gift, 'upgrade'));

  document.getElementById('gvBtnMore')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const existing = document.getElementById('gvCtxMenu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'ctx-menu-pop';
    menu.id = 'gvCtxMenu';
    menu.innerHTML = `
      ${isUpgraded ? `
        <button class="ctx-item" id="ctxCraft">
          ${svgCraftIcon(18)}
          <span>Tayyorlash (Craft)</span>
        </button>
      ` : ''}
      <button class="ctx-item" id="ctxPin">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
        <span>${gift.pinned ? 'Qadashdan olish' : 'Qadab qoʻyish'}</span>
      </button>
      <button class="ctx-item" id="ctxHide">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>${gift.hidden ? 'Profilda koʻrsatish' : 'Sovgʻani yashirish'}</span>
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
    menu.querySelector('#ctxHide')?.addEventListener('click', async () => {
      menu.remove();
      await performGiftAction(gift, 'hide');
    });
  });

  document.getElementById('gvActWear')?.addEventListener('click', () => performGiftAction(gift, 'wear'));
  document.getElementById('gvToggleHide')?.addEventListener('click', () => performGiftAction(gift, 'hide'));
  document.getElementById('gvActTransfer')?.addEventListener('click', () => openTransferPrompt(gift));
  document.getElementById('gvActSell')?.addEventListener('click', () => {
    if (gift.salePrice) performGiftAction(gift, 'sell', { price: null });
    else openSellPrompt(gift);
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
  await loginUser(STATE.user.displayName);
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
  const hasEnough = (STATE.user?.stars || 0) >= c.base;
  const deficit = Math.max(0, c.base - (STATE.user?.stars || 0));
  openSubModal(`${c.name} sotib olish`, `
    <div class="form-stack" style="text-align:center;align-items:center;">
      <div style="width:170px;height:170px;position:relative;display:grid;place-items:center;">
        <div class="gift-glow" style="width:170px;height:170px;background:radial-gradient(circle, rgba(255,190,70,0.38) 0%, rgba(255,150,40,0) 70%);"></div>
        <div id="buyPreviewLottie" style="width:136px;height:136px;position:relative;z-index:1;"></div>
      </div>
      <div style="font-size:13.5px;color:var(--text-2);line-height:1.45;">
        Qolgan tiraj: <b>${fmtInt(c.remainingToBuy)} / ${fmtInt(c.supply)}</b><br>
        Sotib olgach, <b>Profil</b> boʻlimida uni <b>⭐ ${fmtInt(c.upgrade)}</b> evaziga noyob modelga yaxshilashingiz (upgrade) mumkin.
      </div>
      <div style="font-size:12.5px;color:var(--text-2);">
        Joriy balans: <b style="color:var(--saffron);">⭐ ${fmtInt(STATE.user?.stars || 0)}</b>
        ${!hasEnough ? ` · Yetmayapti: <b style="color:#ff8585;">⭐ ${fmtInt(deficit)}</b>` : ''}
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnBuyRegularOnly" ${c.remainingToBuy <= 0 ? 'disabled' : ''}>
        <span>${hasEnough ? `Sotib olish · ${svgStar(15)} ${fmtInt(c.base)}` : `PaxtaGram Stars orqali olish · ${svgStar(15)} ${fmtInt(deficit)}`}</span>
      </button>
    </div>
  `, (body) => {
    mountLottieOrImg(body.querySelector('#buyPreviewLottie'), {
      imgUrl: c.thumb,
      jsonUrl: c.baseTgs,
      size: 136,
      loop: true,
      autoplay: true
    });

    body.querySelector('#btnBuyRegularOnly')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      if ((STATE.user?.stars || 0) < c.base) {
        const need = Math.max(1, c.base - (STATE.user?.stars || 0));
        openAddStarsModal(need, `${c.name} sotib olish`, async () => {
          const buyRes = await api('/api/gifts/buy', {
            method: 'POST',
            body: JSON.stringify({ username: STATE.user.username, slug: c.slug })
          });
          if (buyRes.ok) {
            await Promise.all([loginUser(STATE.user.displayName), loadCollections()]);
            showToast(`${c.name} sotib olindi! Endi uni yaxshilashingiz mumkin.`);
            switchTab('inventory');
            openGiftModal(buyRes.gift, 'view');
          }
        });
        return;
      }

      btn.disabled = true;
      const res = await api('/api/gifts/buy', {
        method: 'POST',
        body: JSON.stringify({ username: STATE.user.username, slug: c.slug })
      });
      if (!res.ok) {
        btn.disabled = false;
        if (res.needStars) {
          openAddStarsModal(res.deficit || c.base, `${c.name} sotib olish`);
          return;
        }
        return showToast(res.error);
      }
      closeSubModal();
      await Promise.all([loginUser(STATE.user.displayName), loadCollections()]);
      showToast(`${c.name} sotib olindi! Endi uni yaxshilashingiz mumkin.`);
      switchTab('inventory');
      openGiftModal(res.gift, 'view');
    });
  });
}

function openTransferPrompt(gift) {
  openSubModal('Sovgʻani oʻtkazish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:14px;"><b>${esc(gift.name)} #${fmtInt(gift.number)}</b> sovgʻasini qaysi PaxtaGram foydalanuvchisiga yubormoqchisiz?</p>
      <div class="form-field">
        <span>@</span>
        <input type="text" id="inpTransferTo" placeholder="username" autocomplete="off" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnConfirmTransfer">Oʻtkazish</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpTransferTo');
    inp.focus();
    body.querySelector('#btnConfirmTransfer').addEventListener('click', async () => {
      const toUsername = inp.value.trim();
      if (!toUsername) return showToast('Username kiriting');
      closeSubModal();
      await performGiftAction(gift, 'transfer', { toUsername });
      showToast(`Sovgʻa @${toUsername} ga oʻtkazildi!`);
    });
  });
}

function openSellPrompt(gift) {
  openSubModal('Sovgʻani sotuvga qoʻyish', `
    <div class="form-stack">
      <p style="margin:0;color:var(--text-2);font-size:14px;"><b>${esc(gift.name)} #${fmtInt(gift.number)}</b> uchun yulduzlar narxini belgilang:</p>
      <div class="form-field">
        <span style="color:var(--saffron)">${svgStar(18)}</span>
        <input type="number" id="inpSellPrice" value="${gift.valueStars || 250}" min="1" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnConfirmSell">Sotuvga qoʻyish</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpSellPrice');
    inp.focus();
    body.querySelector('#btnConfirmSell').addEventListener('click', async () => {
      const price = parseInt(inp.value, 10);
      if (!(price > 0)) return showToast('Narxni toʻgʻri kiriting');
      closeSubModal();
      await performGiftAction(gift, 'sell', { price });
      showToast(`Sotuvga qoʻyildi: ⭐ ${fmtInt(price)}`);
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

      // 1. If inside PaxtaGram Mini App iframe, trigger native InvoiceDialog overlay!
      if (isInsidePaxtaMiniApp() && res.slug) {
        notifyPaxtaMiniApp('web_app_open_invoice', { slug: res.slug });
      } else {
        // 2. If in standalone browser, open PaxtaGram with ?invoice=<slug>
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
            renderHeaderUser();
            closeSubModal();
            launchEdgeConfetti();
            showToast(`✅ +⭐ ${fmtInt(st.amount)} PaxtaGram Stars hisobingizga tushdi!`);
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
      <p style="margin:0;color:var(--text-2);font-size:14px;">PaxtaGram username yoki ismingiz:</p>
      <div class="form-field">
        <input type="text" id="inpUserName" value="${esc(STATE.user?.displayName || 'Muhammadiso')}" />
      </div>
      <button type="button" class="btn btn-primary gv-btn" id="btnSaveUser">Kirish / Saqlash</button>
    </div>
  `, (body) => {
    const inp = body.querySelector('#inpUserName');
    inp.focus();
    body.querySelector('#btnSaveUser').addEventListener('click', async () => {
      const val = inp.value.trim();
      if (!val) return;
      closeSubModal();
      await loginUser(val);
      showToast(`Profil: ${val}`);
    });
  });
}

function switchTab(tab) {
  STATE.activeTab = tab;
  document.querySelectorAll('.main-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('paneShop').hidden = tab !== 'shop';
  document.getElementById('paneInventory').hidden = tab !== 'inventory';
  document.getElementById('paneAdmin').hidden = tab !== 'admin';
  if (tab === 'admin') loadAdminData();
  if (tab === 'shop') loadCollections();
}

window.addEventListener('DOMContentLoaded', async () => {
  document.querySelectorAll('.main-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('#paneInventory .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#paneInventory .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      STATE.invFilter = chip.dataset.filter;
      renderInventory();
    });
  });

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
  await Promise.all([loginUser(), loadCollections()]);
});
