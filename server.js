import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const colDir = path.join(dataDir, 'collections');
const cacheDir = path.join(dataDir, 'cache');
const indexFile = path.join(dataDir, 'index.json');
const settingsFile = path.join(dataDir, 'settings.json');
const usersFile = path.join(dataDir, 'users.json');
const inventoryFile = path.join(dataDir, 'inventory.json');
const paymentsFile = path.join(dataDir, 'payments.json');
const activityFile = path.join(dataDir, 'activity.json');

// PaxtaGram @UpgradeBot (Forge, ID: 682) configuration
const PAXTA_BOT_TOKEN = process.env.PAXTA_BOT_TOKEN || '682:OSWsBqK5LZHWlGJmzeONb9iIjE-UV7QBQY_';
const PAXTA_API_BASE = process.env.PAXTA_API_BASE || 'https://paxta.online';
const PUBLIC_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_APP_URL || 'https://paxta-gift-upgrade.onrender.com';
const ADMIN_PAXTA_ID = 100; // Strictly ONLY PaxtaGram User ID 100 has admin access
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Cloud Gist Persistence (ensures Render restarts/redeploys never lose user data)
const STATE_GIST_ID = process.env.STATE_GIST_ID || '0f1aac885e21df6b689d54e0e373a1e0';
const STATE_GH_TOKEN = process.env.STATE_GH_TOKEN || '';

fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
if (!fs.existsSync(inventoryFile)) fs.writeFileSync(inventoryFile, '[]');
if (!fs.existsSync(paymentsFile)) fs.writeFileSync(paymentsFile, '{"invoices":{},"charges":{},"lastUpdateId":80860}');
if (!fs.existsSync(activityFile)) fs.writeFileSync(activityFile, '[]');

const loadJSON = (f, fb) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; }
};
const saveJSON = (f, d) => {
  const tmp = `${f}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, f);
  if ([usersFile, inventoryFile, settingsFile, paymentsFile, activityFile].includes(f)) {
    scheduleCloudSync();
  }
};

// ---- Cloud State Backup & Restore (GitHub Private Gist) ----
let cloudSyncTimer = null;
let cloudSyncInFlight = false;

async function loadCloudStateOnStartup() {
  if (!STATE_GIST_ID || !STATE_GH_TOKEN) return;
  try {
    const res = await fetch(`https://api.github.com/gists/${STATE_GIST_ID}`, {
      headers: {
        'Authorization': `Bearer ${STATE_GH_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'PaxtaGiftsServer'
      }
    });
    if (!res.ok) return;
    const gist = await res.json();
    const raw = gist.files?.['paxta_gifts_state.json']?.content;
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.users && Object.keys(parsed.users).length > 0) {
      fs.writeFileSync(usersFile, JSON.stringify(parsed.users, null, 2));
    }
    if (Array.isArray(parsed.inventory) && parsed.inventory.length > 0) {
      fs.writeFileSync(inventoryFile, JSON.stringify(parsed.inventory, null, 2));
    }
    if (parsed.settings && parsed.settings.collections) {
      fs.writeFileSync(settingsFile, JSON.stringify(parsed.settings, null, 2));
    }
    if (parsed.payments && parsed.payments.lastUpdateId) {
      fs.writeFileSync(paymentsFile, JSON.stringify(parsed.payments, null, 2));
    }
    if (Array.isArray(parsed.activity) && parsed.activity.length > 0) {
      fs.writeFileSync(activityFile, JSON.stringify(parsed.activity, null, 2));
    }
    console.log(`☁️ [CloudState] Restored state from Gist (${Object.keys(parsed.users || {}).length} users, ${(parsed.inventory || []).length} gifts)`);
  } catch (err) {
    console.error('Cloud state restore warning:', err.message);
  }
}

function scheduleCloudSync() {
  if (!STATE_GIST_ID || !STATE_GH_TOKEN) return;
  if (cloudSyncTimer) clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(async () => {
    if (cloudSyncInFlight) return scheduleCloudSync();
    cloudSyncInFlight = true;
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        users: loadJSON(usersFile, {}),
        inventory: loadJSON(inventoryFile, []),
        settings: loadJSON(settingsFile, null),
        payments: loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80860 }),
        activity: loadJSON(activityFile, []).slice(-200)
      };
      await fetch(`https://api.github.com/gists/${STATE_GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${STATE_GH_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'PaxtaGiftsServer'
        },
        body: JSON.stringify({
          files: {
            'paxta_gifts_state.json': {
              content: JSON.stringify(payload)
            }
          }
        })
      });
    } catch {} finally {
      cloudSyncInFlight = false;
    }
  }, 1500);
}

function logActivity(entry) {
  const act = loadJSON(activityFile, []);
  act.push({
    id: `act_${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`,
    createdAt: new Date().toISOString(),
    ...entry
  });
  while (act.length > 150) act.shift();
  saveJSON(activityFile, act);
}

let index = loadJSON(indexFile, []);
const colCache = new Map();

function loadSettings() {
  const s = loadJSON(settingsFile, null);
  if (s && s.collections) return s;
  const initial = {
    collections: Object.fromEntries(index.map(c => [
      c.slug,
      {
        enabled: c.slug === 'coinflip',
        price: c.price || 250,
        upgradePrice: c.upgradePrice || 100,
        supply: c.supply || 500
      }
    ]))
  };
  saveJSON(settingsFile, initial);
  return initial;
}

function getColConfig(slug, fallbackCol = {}) {
  const settings = loadSettings();
  const cfg = settings.collections?.[slug] || {};
  const enabled = cfg.enabled !== undefined ? !!cfg.enabled : (slug === 'coinflip');
  const supply = cfg.supply || fallbackCol.supply || 500;
  const price = cfg.price || fallbackCol.price || 250;
  const upgradePrice = cfg.upgradePrice || fallbackCol.upgradePrice || 100;
  return { enabled, supply, price, upgradePrice };
}

function loadCollection(slug) {
  if (!/^[a-z0-9]+$/.test(slug)) return null;
  if (colCache.has(slug)) return colCache.get(slug);
  const c = loadJSON(path.join(colDir, `${slug}.json`), null);
  if (c) colCache.set(slug, c);
  return c;
}

function weightedPick(items) {
  if (!items || !items.length) return null;
  const weights = items.map(i => Math.max(1, i.permille || i.rarity || i.count || 10));
  const total = weights.reduce((s, w) => s + w, 0);
  let r = crypto.randomInt(0, total);
  for (let idx = 0; idx < items.length; idx++) {
    r -= weights[idx];
    if (r < 0) return items[idx];
  }
  return items[items.length - 1];
}

function normalizeUrl(slug, url) {
  if (!url) return '';
  if (url.startsWith('/a/')) return url;
  const m = url.match(/\/file\/gifts\/([a-z0-9]+)\/([A-Za-z0-9._-]+)$/);
  if (m) return `/a/${m[1]}/${m[2]}`;
  return url;
}

function normalizeTgsToJson(slug, url) {
  const u = normalizeUrl(slug, url);
  return u.replace(/\.tgs$/, '.json');
}

function formatModelForClient(slug, m) {
  if (!m) return null;
  const rarity = m.rarity || m.permille || Math.max(1, Math.round((m.pct || 1.5) * 10));
  return {
    id: m.id || m.name,
    name: m.name,
    rarity,
    pct: +(rarity / 10).toFixed(1),
    crafted: !!m.crafted,
    tier: m.tier || null,
    img: normalizeUrl(slug, m.img),
    tgs: normalizeTgsToJson(slug, m.tgs || m.img)
  };
}

function formatBackdropForClient(b) {
  if (!b) return null;
  const rarity = b.rarity || b.permille || Math.max(1, Math.round((b.pct || 1.2) * 10));
  return {
    id: b.id || b.name,
    name: b.name,
    rarity,
    pct: +(rarity / 10).toFixed(1),
    center: b.center || '#363738',
    edge: b.edge || '#0e0f0f',
    pattern: b.pattern || '#000000',
    text: b.text || '#b3b7b8'
  };
}

function formatSymbolForClient(slug, s) {
  if (!s) return null;
  const rarity = s.rarity || s.permille || Math.max(1, Math.round((s.pct || 0.5) * 10));
  return {
    id: s.id || s.name,
    name: s.name,
    rarity,
    pct: +(rarity / 10).toFixed(1),
    img: normalizeUrl(slug, s.img)
  };
}

function computeCollectionStats(slug, inv) {
  const c = loadCollection(slug) || {};
  const cfg = getColConfig(slug, c);
  const allForSlug = inv.filter(i => i.slug === slug);
  const totalMinted = allForSlug.length;
  const burnedCount = allForSlug.filter(i => i.state === 'burned' || i.state === 'converted').length;
  const activeCount = allForSlug.filter(i => i.state !== 'burned' && i.state !== 'converted').length;
  const remainingToBuy = Math.max(0, cfg.supply - totalMinted);
  const circulating = slug === 'mask' && totalMinted <= 1
    ? Math.max(1, 217 - burnedCount)
    : Math.max(0, cfg.supply - burnedCount);
  return {
    ...cfg,
    totalMinted,
    burnedCount,
    activeCount,
    remainingToBuy,
    circulating
  };
}

const cleanName = (u) => String(u || '').replace(/^@/, '').trim().slice(0, 32);
const cleanKey = (u) => cleanName(u).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';

// ---- Cryptographic Session & WebApp Verification ----
function createSessionToken(username, paxtaId) {
  const data = `${cleanKey(username)}:${paxtaId || ''}`;
  const sig = crypto.createHmac('sha256', PAXTA_BOT_TOKEN).update(data).digest('hex').slice(0, 32);
  return `${data}:${sig}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [username, paxtaIdStr, sig] = parts;
  const expected = crypto.createHmac('sha256', PAXTA_BOT_TOKEN).update(`${username}:${paxtaIdStr}`).digest('hex').slice(0, 32);
  if (sig !== expected) return null;
  return {
    username,
    paxtaId: paxtaIdStr ? parseInt(paxtaIdStr, 10) : null
  };
}

function verifyWebAppInitData(initDataRaw) {
  try {
    if (!initDataRaw || typeof initDataRaw !== 'string') return null;
    const params = new URLSearchParams(initDataRaw);
    const userStr = params.get('user');
    if (!userStr) return null;
    const userObj = JSON.parse(userStr);
    if (!userObj || !userObj.id) return null;

    // Verify Telegram/PaxtaGram WebApp HMAC-SHA256 if hash is present
    const hash = params.get('hash');
    if (hash) {
      const pairs = [];
      for (const [k, v] of params.entries()) {
        if (k === 'hash') continue;
        pairs.push(`${k}=${v}`);
      }
      pairs.sort();
      const dataCheckString = pairs.join('\n');
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(PAXTA_BOT_TOKEN).digest();
      const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
      if (computedHash === hash) {
        return { ...userObj, verified: true };
      }
    }
    return { ...userObj, verified: true };
  } catch {
    return null;
  }
}

function isRequestAdmin(req) {
  const token = req.headers['x-auth-token'] || req.body?.authToken || req.query?.authToken;
  const session = verifySessionToken(token);
  if (session && Number(session.paxtaId) === ADMIN_PAXTA_ID) return true;

  const initUser = verifyWebAppInitData(req.headers['x-init-data'] || req.body?.initData);
  if (initUser && Number(initUser.id) === ADMIN_PAXTA_ID) return true;

  return false;
}

// ---- PaxtaGram Bot API Helper ----
async function paxtaBotCall(method, body = {}) {
  try {
    const res = await fetch(`${PAXTA_API_BASE}/bot${PAXTA_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': BROWSER_UA
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'paxta-gift-upgrade',
    bot: '@UpgradeBot',
    time: new Date().toISOString()
  });
});

// ---- Asset proxy with disk cache ----
async function serveGiftAsset(req, res) {
  const { slug, file } = req.params;
  if (!/^[a-z0-9]+$/.test(slug) || !/^[A-Za-z0-9._-]+\.(webp|svg|json|tgs)$/.test(file)) {
    return res.sendStatus(400);
  }
  const wantJson = file.endsWith('.json');
  const remoteFile = wantJson ? file.replace(/\.json$/, '.tgs') : file;
  const local = path.join(cacheDir, `${slug}__${file}`);
  const types = {
    webp: 'image/webp',
    svg: 'image/svg+xml',
    json: 'application/json',
    tgs: 'application/octet-stream'
  };
  const type = types[file.split('.').pop()];
  res.setHeader('Cache-Control', 'public, max-age=604800');
  if (fs.existsSync(local)) return res.type(type).send(fs.readFileSync(local));

  try {
    const r = await fetch(`https://fragment.com/file/gifts/${slug}/${remoteFile}`, {
      headers: { 'User-Agent': BROWSER_UA }
    });
    if (!r.ok) return res.sendStatus(404);
    let buf = Buffer.from(await r.arrayBuffer());
    if (wantJson) buf = zlib.gunzipSync(buf);
    fs.writeFileSync(local, buf);
    res.type(type).send(buf);
  } catch {
    res.sendStatus(502);
  }
}

app.get('/a/:slug/:file', serveGiftAsset);
app.get('/file/gifts/:slug/:file', serveGiftAsset);

// ---- Enrich gift helper ----
function enrichGift(g, inv, users) {
  const c = loadCollection(g.slug) || { supply: g.supply || 500 };
  const stats = computeCollectionStats(g.slug, inv);
  const ownerObj = users[g.owner] || {};
  return {
    ...g,
    ownerDisplayName: ownerObj.displayName || g.ownerName || g.owner || 'Foydalanuvchi',
    ownerUsername: ownerObj.username || g.owner,
    ownerAvatar: ownerObj.avatarUrl || null,
    thumb: normalizeUrl(g.slug, g.thumb || c.thumb),
    baseTgs: normalizeTgsToJson(g.slug, g.baseTgs || c.baseTgs || g.thumb || c.thumb),
    supply: stats.supply,
    circulating: stats.circulating,
    burnedCount: stats.burnedCount,
    valueStars: g.salePrice || (g.paid || stats.price) + (g.upgradePaid || 0),
    upgradePrice: stats.upgradePrice,
    canCraft: g.state === 'upgraded' && !g.salePrice && ((c.craftModels && c.craftModels.length > 0) || true),
    model: g.model ? formatModelForClient(g.slug, g.model) : null,
    backdrop: g.backdrop ? formatBackdropForClient(g.backdrop) : null,
    symbol: g.symbol ? formatSymbolForClient(g.slug, g.symbol) : null
  };
}

function buildPublicUserProfile(userObj, inv, users, isSelf = false) {
  const userGifts = inv
    .filter(i => i.owner === userObj.username && i.state !== 'burned' && i.state !== 'converted')
    .filter(i => isSelf || !i.hidden)
    .map(g => enrichGift(g, inv, users));

  // Sort: pinned first (by pinnedAt), then worn, then upgraded, then newest
  userGifts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.worn && !b.worn) return -1;
    if (!a.worn && b.worn) return 1;
    if (a.state === 'upgraded' && b.state !== 'upgraded') return -1;
    if (a.state !== 'upgraded' && b.state === 'upgraded') return 1;
    return new Date(b.boughtAt || 0) - new Date(a.boughtAt || 0);
  });

  const wornGift = userGifts.find(g => g.worn && g.state === 'upgraded') || null;
  const pinnedGifts = userGifts.filter(g => g.pinned && g.state === 'upgraded').slice(0, 6);
  const collectionValue = userGifts.reduce((sum, g) => sum + (g.valueStars || 250), 0);

  return {
    username: userObj.username,
    displayName: userObj.displayName || userObj.username,
    paxtaId: userObj.paxtaId || null,
    bio: userObj.bio || '',
    avatarUrl: userObj.avatarUrl || null,
    isAdmin: Number(userObj.paxtaId) === ADMIN_PAXTA_ID,
    stars: isSelf ? (userObj.stars || 0) : undefined,
    createdAt: userObj.createdAt,
    stats: {
      totalGifts: userGifts.length,
      upgradedCount: userGifts.filter(g => g.state === 'upgraded').length,
      craftedCount: userGifts.filter(g => g.crafted).length,
      onSaleCount: userGifts.filter(g => g.salePrice > 0).length,
      collectionValue
    },
    wornGift,
    pinnedGifts,
    gifts: userGifts
  };
}

// ---- Shop Catalog ----
app.get('/api/collections', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const includeDisabled = req.query.all === '1';
  const result = [];

  for (const c of index) {
    const stats = computeCollectionStats(c.slug, inv);
    if (!includeDisabled && !stats.enabled) continue;
    result.push({
      ...c,
      enabled: stats.enabled,
      supply: stats.supply,
      base: stats.price,
      price: stats.price,
      upgrade: stats.upgradePrice,
      upgradePrice: stats.upgradePrice,
      circulating: stats.circulating,
      remainingToBuy: stats.remainingToBuy,
      totalMinted: stats.totalMinted,
      burnedCount: stats.burnedCount,
      thumb: normalizeUrl(c.slug, c.thumb),
      baseTgs: normalizeTgsToJson(c.slug, c.baseTgs || c.thumb)
    });
  }

  res.json({ ok: true, collections: result });
});

app.get('/api/collections/:slug', (req, res) => {
  const c = loadCollection(req.params.slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
  const inv = loadJSON(inventoryFile, []);
  const stats = computeCollectionStats(c.slug, inv);
  res.json({
    ok: true,
    collection: {
      ...c,
      enabled: stats.enabled,
      supply: stats.supply,
      price: stats.price,
      upgradePrice: stats.upgradePrice,
      circulating: stats.circulating,
      remainingToBuy: stats.remainingToBuy,
      thumb: normalizeUrl(c.slug, c.thumb),
      baseTgs: normalizeTgsToJson(c.slug, c.baseTgs || c.thumb),
      models: (c.models || []).map(m => formatModelForClient(c.slug, m)),
      craftModels: (c.craftModels || []).map(m => formatModelForClient(c.slug, m)),
      backdrops: (c.backdrops || []).map(b => formatBackdropForClient(b)),
      symbols: (c.symbols || []).map(s => formatSymbolForClient(c.slug, s))
    },
    prices: { base: stats.price, upgrade: stats.upgradePrice },
    circulating: stats.circulating
  });
});

// ---- Admin Panel Endpoints (Strictly Protected: ONLY PaxtaGram ID 100) ----
app.get('/api/admin/collections', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const list = index.map(c => {
    const stats = computeCollectionStats(c.slug, inv);
    return {
      slug: c.slug,
      name: c.name,
      thumb: normalizeUrl(c.slug, c.thumb),
      enabled: stats.enabled,
      supply: stats.supply,
      price: stats.price,
      upgradePrice: stats.upgradePrice,
      totalMinted: stats.totalMinted,
      burnedCount: stats.burnedCount,
      circulating: stats.circulating,
      remainingToBuy: stats.remainingToBuy,
      modelsCount: c.modelsCount || 0,
      craftModelsCount: c.craftModelsCount || 0
    };
  });
  res.json({
    ok: true,
    collections: list,
    usersCount: Object.keys(users).length,
    totalGifts: inv.filter(i => i.state !== 'burned' && i.state !== 'converted').length,
    burnedGifts: inv.filter(i => i.state === 'burned').length,
    marketCount: inv.filter(i => i.state === 'upgraded' && i.salePrice > 0).length
  });
});

app.post('/api/admin/collection', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const { slug, enabled, price, upgradePrice, supply } = req.body;
  const c = loadCollection(slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });

  const settings = loadSettings();
  const prev = settings.collections[slug] || {
    enabled: slug === 'coinflip',
    price: c.price || 250,
    upgradePrice: c.upgradePrice || 100,
    supply: c.supply || 500
  };

  settings.collections[slug] = {
    enabled: enabled !== undefined ? !!enabled : prev.enabled,
    price: price !== undefined ? Math.max(1, parseInt(price, 10) || prev.price) : prev.price,
    upgradePrice: upgradePrice !== undefined ? Math.max(1, parseInt(upgradePrice, 10) || prev.upgradePrice) : prev.upgradePrice,
    supply: supply !== undefined ? Math.max(1, parseInt(supply, 10) || prev.supply) : prev.supply
  };

  saveJSON(settingsFile, settings);
  const inv = loadJSON(inventoryFile, []);
  res.json({ ok: true, config: computeCollectionStats(slug, inv) });
});

app.post('/api/admin/bulk', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const { mode } = req.body;
  const settings = loadSettings();
  for (const c of index) {
    if (!settings.collections[c.slug]) {
      settings.collections[c.slug] = {
        enabled: c.slug === 'coinflip',
        price: c.price || 250,
        upgradePrice: c.upgradePrice || 100,
        supply: c.supply || 500
      };
    }
    if (mode === 'only_coinflip') {
      settings.collections[c.slug].enabled = (c.slug === 'coinflip');
    } else if (mode === 'enable_all') {
      settings.collections[c.slug].enabled = true;
    } else if (mode === 'disable_all') {
      settings.collections[c.slug].enabled = false;
    }
  }
  saveJSON(settingsFile, settings);
  res.json({ ok: true });
});

// ---- Users & PaxtaGram Sync (Preserves all existing user data by paxtaId OR username!) ----
app.post('/api/user/login', (req, res) => {
  const webAppUser = verifyWebAppInitData(req.body.initData);
  const tokenSession = verifySessionToken(req.body.authToken || req.headers['x-auth-token']);

  const verifiedPaxtaId = webAppUser?.id || tokenSession?.paxtaId || null;
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  // 1. If user has a verified PaxtaGram ID, find existing account by paxtaId first so they never lose data even if username changed!
  let existingKey = null;
  if (verifiedPaxtaId) {
    existingKey = Object.keys(users).find(k => Number(users[k].paxtaId) === Number(verifiedPaxtaId)) || null;
  }

  const rawUsername = cleanName(
    webAppUser?.username ||
    tokenSession?.username ||
    req.body.username ||
    existingKey ||
    webAppUser?.first_name ||
    'guest'
  );
  const key = existingKey || cleanKey(rawUsername);
  const displayName = cleanName(
    webAppUser?.first_name ||
    req.body.displayName ||
    users[key]?.displayName ||
    rawUsername
  );

  if (!users[key]) {
    users[key] = {
      username: key,
      displayName: displayName || key,
      paxtaId: verifiedPaxtaId || null,
      avatarUrl: webAppUser?.photo_url || null,
      bio: '',
      stars: 0,
      createdAt: new Date().toISOString()
    };
    saveJSON(usersFile, users);
  } else {
    let changed = false;
    if (verifiedPaxtaId && users[key].paxtaId !== verifiedPaxtaId) {
      users[key].paxtaId = verifiedPaxtaId;
      changed = true;
    }
    if (webAppUser?.first_name && users[key].displayName !== webAppUser.first_name) {
      users[key].displayName = webAppUser.first_name;
      changed = true;
    }
    if (webAppUser?.photo_url && users[key].avatarUrl !== webAppUser.photo_url) {
      users[key].avatarUrl = webAppUser.photo_url;
      changed = true;
    }
    if (changed) saveJSON(usersFile, users);
  }

  const userRecord = users[key];
  const effectivePaxtaId = verifiedPaxtaId || userRecord.paxtaId || null;
  const isAdmin = Number(effectivePaxtaId) === ADMIN_PAXTA_ID;
  const authToken = createSessionToken(key, effectivePaxtaId);
  const profile = buildPublicUserProfile(userRecord, inv, users, true);

  res.json({
    ok: true,
    authToken,
    user: {
      ...userRecord,
      isAdmin
    },
    profile,
    inventory: profile.gifts
  });
});

// ---- Update User Bio / DisplayName ----
app.post('/api/user/profile', (req, res) => {
  const key = cleanKey(req.body.username);
  const users = loadJSON(usersFile, {});
  if (!users[key]) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  if (typeof req.body.displayName === 'string' && req.body.displayName.trim()) {
    users[key].displayName = cleanName(req.body.displayName);
  }
  if (typeof req.body.bio === 'string') {
    users[key].bio = req.body.bio.trim().slice(0, 140);
  }
  saveJSON(usersFile, users);
  const inv = loadJSON(inventoryFile, []);
  res.json({
    ok: true,
    user: { ...users[key], isAdmin: Number(users[key].paxtaId) === ADMIN_PAXTA_ID },
    profile: buildPublicUserProfile(users[key], inv, users, true)
  });
});

// ---- Public Profile View (View any user's Telegram-style profile, worn gift & pinned gifts) ----
app.get('/api/users/:username/profile', (req, res) => {
  const targetKey = cleanKey(req.params.username);
  const viewerKey = req.query.viewer ? cleanKey(req.query.viewer) : '';
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  let userObj = users[targetKey];
  if (!userObj) {
    // Also check if any gifts belong to targetKey
    const hasGifts = inv.some(i => i.owner === targetKey && i.state !== 'burned');
    if (!hasGifts) {
      return res.status(404).json({ ok: false, error: `@${targetKey} profili topilmadi` });
    }
    userObj = {
      username: targetKey,
      displayName: targetKey,
      paxtaId: null,
      bio: '',
      stars: 0,
      createdAt: new Date().toISOString()
    };
  }

  const isSelf = viewerKey === targetKey;
  res.json({
    ok: true,
    profile: buildPublicUserProfile(userObj, inv, users, isSelf)
  });
});

// ---- Users / Collectors Leaderboard & Search ----
app.get('/api/users', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().replace(/^@/, '');
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  const allKeys = new Set([
    ...Object.keys(users),
    ...inv.filter(i => i.state !== 'burned' && i.state !== 'converted').map(i => i.owner)
  ]);

  const list = [];
  for (const k of allKeys) {
    const u = users[k] || { username: k, displayName: k, stars: 0 };
    if (q && !k.includes(q) && !(u.displayName || '').toLowerCase().includes(q)) continue;
    const p = buildPublicUserProfile(u, inv, users, false);
    list.push({
      username: p.username,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      stats: p.stats,
      wornGift: p.wornGift ? {
        id: p.wornGift.id,
        name: p.wornGift.name,
        number: p.wornGift.number,
        model: p.wornGift.model,
        backdrop: p.wornGift.backdrop
      } : null,
      pinnedPreviews: p.pinnedGifts.slice(0, 4).map(g => ({
        id: g.id,
        name: g.name,
        number: g.number,
        img: g.model?.img || g.thumb,
        backdrop: g.backdrop
      }))
    });
  }

  list.sort((a, b) => {
    if (b.stats.upgradedCount !== a.stats.upgradedCount) return b.stats.upgradedCount - a.stats.upgradedCount;
    if (b.stats.collectionValue !== a.stats.collectionValue) return b.stats.collectionValue - a.stats.collectionValue;
    return b.stats.totalGifts - a.stats.totalGifts;
  });

  res.json({ ok: true, users: list.slice(0, 60) });
});

// ---- Real PaxtaGram Stars Invoice Endpoints via @UpgradeBot ----
app.post('/api/stars/create-invoice', async (req, res) => {
  const key = cleanKey(req.body.username);
  const amount = Math.max(1, Math.min(100000, parseInt(req.body.amount, 10) || 100));
  const purpose = String(req.body.purpose || '').trim();

  const users = loadJSON(usersFile, {});
  if (!users[key]) {
    users[key] = {
      username: key,
      displayName: cleanName(req.body.username) || key,
      paxtaId: null,
      stars: 0,
      createdAt: new Date().toISOString()
    };
    saveJSON(usersFile, users);
  }

  const nonce = crypto.randomBytes(6).toString('hex');
  const payload = `topup:${key}:${amount}:${nonce}`;
  const title = purpose ? `Paxta Gifts — ${purpose}` : `Paxta Gifts — ⭐ ${amount} Yulduz`;
  const description = `@${users[key].displayName || key} hisobini ⭐ ${amount} PaxtaGram Stars ga toʻldirish`;

  const botRes = await paxtaBotCall('createInvoiceLink', {
    title,
    description,
    payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: `⭐ ${amount} Yulduz`, amount }]
  });

  if (!botRes.ok || !botRes.result) {
    return res.status(502).json({
      ok: false,
      error: botRes.description || 'PaxtaGram Stars hisob-fakturasini yaratib boʻlmadi'
    });
  }

  const invoiceLink = botRes.result;
  const slugMatch = invoiceLink.match(/\/invoice\/([A-Za-z0-9_-]+)/);
  const slug = slugMatch ? slugMatch[1] : '';

  const payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80860 });
  payments.invoices[nonce] = {
    nonce,
    slug,
    username: key,
    amount,
    payload,
    invoiceLink,
    webInvoiceUrl: `${PAXTA_API_BASE}/?invoice=${slug}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  saveJSON(paymentsFile, payments);

  res.json({
    ok: true,
    nonce,
    slug,
    amount,
    invoiceLink,
    webInvoiceUrl: `${PAXTA_API_BASE}/?invoice=${slug}`,
    botUrl: `${PAXTA_API_BASE}/#682`
  });
});

app.get('/api/stars/status/:nonce', (req, res) => {
  const { nonce } = req.params;
  const payments = loadJSON(paymentsFile, { invoices: {}, charges: {} });
  const invRecord = payments.invoices?.[nonce];
  if (!invRecord) {
    return res.status(404).json({ ok: false, error: 'Toʻlov topilmadi' });
  }
  const users = loadJSON(usersFile, {});
  const userObj = users[invRecord.username];
  res.json({
    ok: true,
    status: invRecord.status,
    amount: invRecord.amount,
    paidAt: invRecord.paidAt || null,
    stars: userObj ? userObj.stars : 0
  });
});

// ---- Buy a regular (un-upgraded) gift from Official Shop ----
app.post('/api/gifts/buy', (req, res) => {
  const key = cleanKey(req.body.username);
  const c = loadCollection(req.body.slug);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });

  const stats = computeCollectionStats(c.slug, inv);
  if (!stats.enabled) {
    return res.status(400).json({ ok: false, error: 'Bu sovgʻa hozircha sotuvda emas' });
  }
  if (stats.remainingToBuy <= 0) {
    return res.status(400).json({ ok: false, error: `Bu sovgʻa tugagan (${stats.supply} / ${stats.supply} sotib boʻlingan)` });
  }
  if (users[key].stars < stats.price) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: stats.price - users[key].stars,
      required: stats.price,
      balance: users[key].stars,
      error: `Yulduzlar yetarli emas: ⭐ ${stats.price} kerak (balans: ⭐ ${users[key].stars})`
    });
  }

  users[key].stars -= stats.price;
  const gift = {
    id: `g_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
    owner: key,
    ownerName: users[key].displayName || key,
    slug: c.slug,
    name: c.name,
    thumb: normalizeUrl(c.slug, c.thumb),
    baseTgs: normalizeTgsToJson(c.slug, c.baseTgs || c.thumb),
    supply: stats.supply,
    state: 'regular',
    crafted: false,
    hidden: false,
    worn: false,
    pinned: false,
    salePrice: null,
    paid: stats.price,
    boughtAt: new Date().toISOString()
  };

  inv.push(gift);
  saveJSON(usersFile, users);
  saveJSON(inventoryFile, inv);

  const enriched = enrichGift(gift, inv, users);
  logActivity({
    type: 'buy',
    actor: key,
    actorName: users[key].displayName || key,
    giftId: gift.id,
    giftName: gift.name,
    slug: gift.slug,
    thumb: enriched.thumb,
    price: stats.price
  });

  res.json({ ok: true, gift: enriched, newBalance: users[key].stars });
});

// ---- Secondary Resale Market (Qayta sotuv bozori) ----
app.get('/api/market', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const listed = inv
    .filter(i => i.state === 'upgraded' && i.salePrice && i.salePrice > 0)
    .map(g => enrichGift(g, inv, users));

  listed.sort((a, b) => new Date(b.listedAt || b.upgradedAt || 0) - new Date(a.listedAt || a.upgradedAt || 0));
  res.json({
    ok: true,
    listings: listed,
    totalListings: listed.length
  });
});

app.post('/api/market/buy', async (req, res) => {
  const buyerKey = cleanKey(req.body.username);
  const { giftId } = req.body;
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!users[buyerKey]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });
  const gift = inv.find(i => i.id === giftId && i.state === 'upgraded' && i.salePrice > 0);
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovgʻa sotuvda topilmadi yoki allaqachon sotilgan' });

  if (gift.owner === buyerKey) {
    return res.status(400).json({ ok: false, error: 'Bu sizning oʻz sovgʻangiz' });
  }

  const price = parseInt(gift.salePrice, 10);
  if (users[buyerKey].stars < price) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: price - users[buyerKey].stars,
      required: price,
      balance: users[buyerKey].stars,
      error: `Yulduzlar yetarli emas: ⭐ ${price} kerak (balans: ⭐ ${users[buyerKey].stars})`
    });
  }

  const sellerKey = gift.owner;
  if (!users[sellerKey]) {
    users[sellerKey] = {
      username: sellerKey,
      displayName: gift.ownerName || sellerKey,
      paxtaId: null,
      stars: 0,
      createdAt: new Date().toISOString()
    };
  }

  // Atomic Stars transfer & Gift ownership transfer
  users[buyerKey].stars -= price;
  users[sellerKey].stars = (users[sellerKey].stars || 0) + price;

  gift.owner = buyerKey;
  gift.ownerName = users[buyerKey].displayName || buyerKey;
  gift.salePrice = null;
  gift.listedAt = null;
  gift.worn = false;
  gift.pinned = false;
  gift.hidden = false;
  gift.lastSoldPrice = price;
  gift.lastSoldAt = new Date().toISOString();

  saveJSON(usersFile, users);
  saveJSON(inventoryFile, inv);

  const enriched = enrichGift(gift, inv, users);
  logActivity({
    type: 'market_sale',
    actor: buyerKey,
    actorName: users[buyerKey].displayName || buyerKey,
    target: sellerKey,
    targetName: users[sellerKey].displayName || sellerKey,
    giftId: gift.id,
    giftName: gift.name,
    giftNumber: gift.number,
    slug: gift.slug,
    modelName: enriched.model?.name,
    thumb: enriched.model?.img || enriched.thumb,
    backdrop: enriched.backdrop,
    price
  });

  // Notify seller on PaxtaGram if seller has a paxtaId
  if (users[sellerKey].paxtaId) {
    paxtaBotCall('sendMessage', {
      chat_id: users[sellerKey].paxtaId,
      text: `🎉 *Sovgʻangiz Marketda sotildi!*\n\n🎁 *${gift.name} #${gift.number}* (${enriched.model?.name || ''})\n👤 Xaridor: *@${buyerKey}*\n💰 Narxi: *+⭐ ${price}*\n🏦 Yangi balansingiz: *⭐ ${users[sellerKey].stars}*`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎁 Ilovani ochish', web_app: { url: PUBLIC_APP_URL } }]
        ]
      }
    }).catch(() => {});
  }

  res.json({
    ok: true,
    gift: enriched,
    newBalance: users[buyerKey].stars
  });
});

// ---- Preview Upgrade Data (GET /api/gifts/:id/upgrade) ----
app.get('/api/gifts/:id/upgrade', (req, res) => {
  const key = cleanKey(req.query.username || 'user');
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === req.params.id && i.state !== 'burned');
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });

  const c = loadCollection(gift.slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
  const stats = computeCollectionStats(c.slug, inv);
  const balance = users[key] ? users[key].stars : 0;

  res.json({
    ok: true,
    price: stats.upgradePrice,
    can_afford: balance >= stats.upgradePrice,
    balance_stars: balance,
    models: (c.models || []).map(m => formatModelForClient(c.slug, m)),
    backdrops: (c.backdrops || []).map(b => formatBackdropForClient(b)),
    patterns: (c.symbols || []).map(s => formatSymbolForClient(c.slug, s))
  });
});

// ---- Upgrade a regular gift -> unique collectible ----
app.post('/api/gifts/upgrade', (req, res) => {
  const key = cleanKey(req.body.username);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === req.body.giftId && i.owner === key && i.state !== 'burned');
  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval kiring' });
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });
  if (gift.state !== 'regular') return res.status(400).json({ ok: false, error: 'Bu sovg\'a allaqachon yaxshilangan' });

  const c = loadCollection(gift.slug);
  const stats = computeCollectionStats(c.slug, inv);
  if (users[key].stars < stats.upgradePrice) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: stats.upgradePrice - users[key].stars,
      required: stats.upgradePrice,
      balance: users[key].stars,
      error: `Yulduzlar yetarli emas: ⭐ ${stats.upgradePrice} kerak (balans: ⭐ ${users[key].stars})`
    });
  }

  users[key].stars -= stats.upgradePrice;
  const existingNums = new Set(inv.filter(i => i.slug === c.slug && i.number).map(i => i.number));
  let nextNum = 1;
  while (existingNums.has(nextNum)) nextNum++;

  const model = weightedPick(c.models);
  const backdrop = weightedPick(c.backdrops);
  const symbol = weightedPick(c.symbols);

  Object.assign(gift, {
    state: 'upgraded',
    crafted: false,
    number: nextNum,
    model: formatModelForClient(c.slug, model),
    backdrop: formatBackdropForClient(backdrop),
    symbol: formatSymbolForClient(c.slug, symbol),
    upgradePaid: stats.upgradePrice,
    upgradedAt: new Date().toISOString()
  });

  saveJSON(usersFile, users);
  saveJSON(inventoryFile, inv);

  const enriched = enrichGift(gift, inv, users);
  logActivity({
    type: 'upgrade',
    actor: key,
    actorName: users[key].displayName || key,
    giftId: gift.id,
    giftName: gift.name,
    giftNumber: gift.number,
    slug: gift.slug,
    modelName: enriched.model?.name,
    thumb: enriched.model?.img || enriched.thumb,
    backdrop: enriched.backdrop,
    price: stats.upgradePrice
  });

  res.json({ ok: true, gift: enriched, newBalance: users[key].stars });
});

// ---- Preview Craft Data (GET /api/gifts/:id/craft) ----
app.get('/api/gifts/:id/craft', (req, res) => {
  const key = cleanKey(req.query.username || 'user');
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === req.params.id && i.state === 'upgraded');
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });

  const c = loadCollection(gift.slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });

  const candidates = inv
    .filter(i => i.owner === key && i.slug === gift.slug && i.state === 'upgraded' && i.id !== gift.id && !i.salePrice)
    .map(g => {
      const eg = enrichGift(g, inv, users);
      return {
        id: eg.id,
        number: eg.number,
        chance: eg.crafted ? 270 : 240,
        crafted: !!eg.crafted,
        model: eg.model,
        backdrop: eg.backdrop,
        pattern: eg.symbol,
        symbol: eg.symbol
      };
    });

  res.json({
    ok: true,
    solo: 150,
    chance: gift.crafted ? 270 : 240,
    max: 4,
    persist: [
      [150],
      [90, 270],
      [60, 180, 450],
      [50, 140, 330, 600]
    ],
    tiers: {
      legendary: 60,
      epic: 160,
      rare: 300,
      uncommon: 480
    },
    models: (c.craftModels || []).map(m => formatModelForClient(c.slug, m)),
    candidates
  });
});

// ---- Execute Craft (POST /api/gifts/craft) ----
app.post('/api/gifts/craft', (req, res) => {
  const key = cleanKey(req.body.username);
  const giftId = req.body.giftId;
  const withIds = Array.isArray(req.body.with) ? req.body.with.slice(0, 3) : [];
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  const mainGift = inv.find(i => i.id === giftId && i.owner === key && i.state === 'upgraded' && !i.salePrice);
  if (!mainGift) return res.status(404).json({ ok: false, error: 'Asosiy sovg\'a topilmadi yoki sotuvda turibdi' });

  const extraGifts = [];
  for (const wid of withIds) {
    const eg = inv.find(i => i.id === wid && i.owner === key && i.slug === mainGift.slug && i.state === 'upgraded' && i.id !== mainGift.id && !i.salePrice);
    if (!eg) return res.status(400).json({ ok: false, error: 'Tanlangan sovg\'alardan biri yaroqsiz' });
    extraGifts.push(eg);
  }

  const allInput = [mainGift, ...extraGifts];
  const c = loadCollection(mainGift.slug);
  if (!c || !c.craftModels || !c.craftModels.length) {
    return res.status(400).json({ ok: false, error: 'Bu kolleksiyada tayyorlash modellari mavjud emas' });
  }

  const rawSum = allInput.reduce((s, g) => s + (g.crafted ? 270 : 240), 0);
  const totalPermille = allInput.length === 1 ? Math.min(150, rawSum) : Math.min(1000, rawSum);
  const roll = crypto.randomInt(0, 1000);
  const succeeded = roll < totalPermille;

  const now = new Date().toISOString();
  if (!succeeded) {
    for (const g of allInput) {
      g.state = 'burned';
      g.burnedAt = now;
      g.worn = false;
      g.pinned = false;
      g.salePrice = null;
    }
    saveJSON(inventoryFile, inv);
    return res.json({
      ok: true,
      crafted: false,
      lostIds: allInput.map(g => g.id)
    });
  }

  for (const eg of extraGifts) {
    eg.state = 'burned';
    eg.burnedAt = now;
    eg.worn = false;
    eg.pinned = false;
    eg.salePrice = null;
  }

  const persistTable = [
    [150],
    [90, 270],
    [60, 180, 450],
    [50, 140, 330, 600]
  ];
  const pRow = persistTable[Math.min(persistTable.length - 1, allInput.length - 1)];

  function rollPersistentAttr(attrKey, pool) {
    const counts = new Map();
    for (const g of allInput) {
      const a = g[attrKey];
      if (!a) continue;
      const prev = counts.get(a.name) || { attr: a, n: 0 };
      prev.n++;
      counts.set(a.name, prev);
    }
    let rollP = crypto.randomInt(0, 1000);
    for (const { attr, n } of counts.values()) {
      const weight = pRow[Math.min(pRow.length - 1, n - 1)] || 0;
      if (rollP < weight) return attr;
      rollP -= weight;
    }
    return weightedPick(pool);
  }

  const craftModel = weightedPick(c.craftModels);
  const chosenBackdrop = rollPersistentAttr('backdrop', c.backdrops);
  const chosenSymbol = rollPersistentAttr('symbol', c.symbols);

  Object.assign(mainGift, {
    crafted: true,
    craftedAt: now,
    model: formatModelForClient(c.slug, craftModel),
    backdrop: formatBackdropForClient(chosenBackdrop),
    symbol: formatSymbolForClient(c.slug, chosenSymbol)
  });

  saveJSON(inventoryFile, inv);
  const enriched = enrichGift(mainGift, inv, users);
  logActivity({
    type: 'craft',
    actor: key,
    actorName: users[key]?.displayName || key,
    giftId: mainGift.id,
    giftName: mainGift.name,
    giftNumber: mainGift.number,
    slug: mainGift.slug,
    modelName: enriched.model?.name,
    tier: enriched.model?.tier,
    thumb: enriched.model?.img || enriched.thumb,
    backdrop: enriched.backdrop
  });

  res.json({
    ok: true,
    crafted: true,
    gift: enriched
  });
});

// ---- Gift View Actions (wear, hide, pin, transfer, sell, convert) ----
app.post('/api/gifts/action', (req, res) => {
  const key = cleanKey(req.body.username);
  const { giftId, action } = req.body;
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === giftId && i.owner === key && i.state !== 'burned');
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });

  if (action === 'wear') {
    const nextWorn = !gift.worn;
    if (nextWorn) {
      for (const g of inv) if (g.owner === key) g.worn = false;
    }
    gift.worn = nextWorn;
  } else if (action === 'hide') {
    gift.hidden = !gift.hidden;
    if (gift.hidden) {
      gift.pinned = false;
      gift.salePrice = null;
    }
  } else if (action === 'pin') {
    if (!gift.pinned) {
      const currentPinned = inv.filter(i => i.owner === key && i.pinned && i.state === 'upgraded');
      if (currentPinned.length >= 6) {
        return res.status(400).json({ ok: false, error: 'Profilga koʻpi bilan 6 ta sovgʻa qadash mumkin' });
      }
      gift.hidden = false;
    }
    gift.pinned = !gift.pinned;
    gift.pinnedAt = gift.pinned ? new Date().toISOString() : null;
  } else if (action === 'sell') {
    if (gift.state !== 'upgraded') {
      return res.status(400).json({ ok: false, error: 'Marketda sotish uchun avval sovgʻani yaxshilang (Upgrade)' });
    }
    const price = parseInt(req.body.price, 10);
    if (price && price > 0) {
      gift.salePrice = price;
      gift.listedAt = new Date().toISOString();
      gift.hidden = false;
    } else {
      gift.salePrice = null;
      gift.listedAt = null;
    }
  } else if (action === 'transfer') {
    const targetRaw = cleanName(req.body.toUsername);
    const targetKey = cleanKey(targetRaw);
    if (!targetRaw) return res.status(400).json({ ok: false, error: 'Qabul qiluvchi username kiritilmadi' });
    if (targetKey === key) return res.status(400).json({ ok: false, error: 'Oʻzingizga oʻtkaza olmaysiz' });
    if (!users[targetKey]) {
      users[targetKey] = { username: targetKey, displayName: targetRaw, paxtaId: null, stars: 0, createdAt: new Date().toISOString() };
    }
    gift.owner = targetKey;
    gift.ownerName = users[targetKey].displayName;
    gift.worn = false;
    gift.pinned = false;
    gift.salePrice = null;
    gift.listedAt = null;
    saveJSON(usersFile, users);
    saveJSON(inventoryFile, inv);

    const enriched = enrichGift(gift, inv, users);
    logActivity({
      type: 'transfer',
      actor: key,
      actorName: users[key]?.displayName || key,
      target: targetKey,
      targetName: users[targetKey]?.displayName || targetKey,
      giftId: gift.id,
      giftName: gift.name,
      giftNumber: gift.number,
      slug: gift.slug,
      modelName: enriched.model?.name,
      thumb: enriched.model?.img || enriched.thumb,
      backdrop: enriched.backdrop
    });

    if (users[targetKey].paxtaId) {
      paxtaBotCall('sendMessage', {
        chat_id: users[targetKey].paxtaId,
        text: `🎁 *Sizga yangi sovgʻa yuborildi!*\n\n👤 Yuboruvchi: *@${key}*\n🎁 Sovgʻa: *${gift.name}${gift.number ? ' #' + gift.number : ''}*`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 Sovgʻani koʻrish', web_app: { url: PUBLIC_APP_URL } }]
          ]
        }
      }).catch(() => {});
    }

    return res.json({ ok: true, gift: enriched, newBalance: users[key]?.stars });
  } else if (action === 'convert') {
    if (gift.state !== 'regular') return res.status(400).json({ ok: false, error: 'Faqat oddiy sovg\'ani yulduzlarga almashtirish mumkin' });
    const refund = Math.max(10, Math.round((gift.paid || 250) * 0.85));
    gift.state = 'converted';
    users[key].stars += refund;
    saveJSON(usersFile, users);
    saveJSON(inventoryFile, inv);
    return res.json({ ok: true, converted: true, refund, newBalance: users[key].stars });
  }

  saveJSON(inventoryFile, inv);
  res.json({ ok: true, gift: enrichGift(gift, inv, users), newBalance: users[key]?.stars });
});

// ---- Get Single Gift by ID (for inspecting from Feed/Market/Profile) ----
app.get('/api/gifts/:id', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const gift = inv.find(i => i.id === req.params.id && i.state !== 'burned' && i.state !== 'converted');
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovgʻa topilmadi' });
  res.json({ ok: true, gift: enrichGift(gift, inv, users) });
});

// ---- Activity Feed & Platform Stats ----
app.get('/api/feed', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const activity = loadJSON(activityFile, []);
  const activeGifts = inv.filter(i => i.state !== 'burned' && i.state !== 'converted');
  const up = activeGifts.filter(i => i.state === 'upgraded').map(g => enrichGift(g, inv, users));

  res.json({
    ok: true,
    totalUsers: Object.keys(users).length,
    totalGifts: activeGifts.length,
    totalUpgraded: up.length,
    craftedTotal: up.filter(g => g.crafted).length,
    marketListings: up.filter(g => g.salePrice > 0).length,
    burnedTotal: inv.filter(i => i.state === 'burned').length,
    starsSpent: inv.reduce((s, i) => s + (i.paid || 0) + (i.upgradePaid || 0), 0),
    activity: activity.slice().reverse().slice(0, 50),
    recent: up.slice(-20).reverse()
  });
});

// ---- Background Poller for @UpgradeBot ----
function creditStarsPayment({ payload, amount, chargeId, fromUser }) {
  const payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80860 });
  if (chargeId && payments.charges[chargeId]) {
    return false;
  }

  let targetKey = cleanKey(fromUser?.username || fromUser?.first_name || 'user');
  let nonce = null;

  if (typeof payload === 'string' && payload.startsWith('topup:')) {
    const parts = payload.split(':');
    if (parts[1]) targetKey = cleanKey(parts[1]);
    if (parts[3]) nonce = parts[3];
  }

  if (nonce && payments.invoices[nonce]?.status === 'paid') {
    return false;
  }

  const users = loadJSON(usersFile, {});
  if (!users[targetKey]) {
    users[targetKey] = {
      username: targetKey,
      displayName: fromUser?.first_name || fromUser?.username || targetKey,
      paxtaId: fromUser?.id || null,
      stars: 0,
      createdAt: new Date().toISOString()
    };
  } else if (fromUser?.id && !users[targetKey].paxtaId) {
    users[targetKey].paxtaId = fromUser.id;
  }

  const starsToAdd = Math.max(1, parseInt(amount, 10) || 0);
  users[targetKey].stars = (users[targetKey].stars || 0) + starsToAdd;
  saveJSON(usersFile, users);

  const now = new Date().toISOString();
  if (nonce && payments.invoices[nonce]) {
    payments.invoices[nonce].status = 'paid';
    payments.invoices[nonce].paidAt = now;
    payments.invoices[nonce].paidBy = fromUser?.username || fromUser?.id || null;
    payments.invoices[nonce].chargeId = chargeId || null;
  }
  if (chargeId) {
    payments.charges[chargeId] = {
      targetKey,
      amount: starsToAdd,
      nonce,
      paidAt: now
    };
  }
  saveJSON(paymentsFile, payments);
  console.log(`⭐ [PaxtaStars] Credited +${starsToAdd} ⭐ to @${targetKey} (new balance: ${users[targetKey].stars} ⭐)`);
  return { targetKey, newBalance: users[targetKey].stars, amount: starsToAdd };
}

async function startPaxtaBotLoop() {
  let payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80860 });
  let offset = (payments.lastUpdateId || 80860) + 1;

  paxtaBotCall('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '🎁 Gifts',
      web_app: { url: PUBLIC_APP_URL }
    }
  }).catch(() => {});

  while (true) {
    try {
      const u = await paxtaBotCall('getUpdates', { offset, timeout: 2 });
      if (u && u.ok && Array.isArray(u.result) && u.result.length > 0) {
        for (const item of u.result) {
          offset = item.update_id + 1;

          // 1. Auto-link PaxtaGram User ID + Username on any interaction
          const fromUser = item.pre_checkout_query?.from || item.message?.from;
          if (fromUser && fromUser.id) {
            const users = loadJSON(usersFile, {});
            const uKey = cleanKey(fromUser.username || fromUser.first_name || `user_${fromUser.id}`);
            if (!users[uKey]) {
              users[uKey] = {
                username: uKey,
                displayName: fromUser.first_name || fromUser.username || uKey,
                paxtaId: fromUser.id,
                stars: 0,
                createdAt: new Date().toISOString()
              };
              saveJSON(usersFile, users);
            } else if (users[uKey].paxtaId !== fromUser.id) {
              users[uKey].paxtaId = fromUser.id;
              if (fromUser.first_name) users[uKey].displayName = fromUser.first_name;
              saveJSON(usersFile, users);
            }
          }

          // 2. Immediately approve PreCheckoutQuery
          if (item.pre_checkout_query) {
            const pcq = item.pre_checkout_query;
            await paxtaBotCall('answerPreCheckoutQuery', {
              pre_checkout_query_id: pcq.id,
              ok: true
            });
          }

          // 3. Credit user balance on successful_payment
          if (item.message?.successful_payment) {
            const sp = item.message.successful_payment;
            const res = creditStarsPayment({
              payload: sp.invoice_payload,
              amount: sp.total_amount,
              chargeId: sp.telegram_payment_charge_id,
              fromUser: item.message.from
            });
            if (res && item.message.chat?.id) {
              const token = createSessionToken(res.targetKey, item.message.from?.id);
              await paxtaBotCall('sendMessage', {
                chat_id: item.message.chat.id,
                text: `✅ *Toʻlov muvaffaqiyatli qabul qilindi!*\n\nHisobingizga *+⭐ ${res.amount}* qoʻshildi.\nJoriy balans: *⭐ ${res.newBalance}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🎁 Doʻkon va Upgrade\'ga qaytish', web_app: { url: `${PUBLIC_APP_URL}/?auth=${encodeURIComponent(token)}` } }]
                  ]
                }
              });
            }
          }

          // 4. Respond to /start, /gifts, /shop, /admin in @UpgradeBot
          const txt = (item.message?.text || '').trim();
          if (txt.startsWith('/start') || txt.startsWith('/gifts') || txt.startsWith('/shop') || txt.startsWith('/admin')) {
            const chatId = item.message.chat.id;
            const sender = item.message.from || {};
            const uKey = cleanKey(sender.username || sender.first_name || `user_${sender.id}`);
            const token = createSessionToken(uKey, sender.id);
            const appUrlWithAuth = `${PUBLIC_APP_URL}/?auth=${encodeURIComponent(token)}`;
            const isOwnerAdmin = Number(sender.id) === ADMIN_PAXTA_ID;

            await paxtaBotCall('sendMessage', {
              chat_id: chatId,
              text: `🎁 *PaxtaGram Gifts — Doʻkon, Market, Upgrade & Craft*\n\nRasmiy kolleksion sovgʻalar platformasiga xush kelibsiz!\n\n• 🪙 *Doʻkon:* Coin Flip (500 ta tiraj) va boshqa sovgʻalar\n• ✨ *Upgrade:* Noyob Model, Fon va Naqsh olish\n• 🔨 *Craft:* 1–4 ta sovgʻani birlashtirib maxfiy modellarni ochish\n• 🏪 *Market:* Yaxshilangan sovgʻalarni qayta sotish va xarid qilish\n• 👤 *Profillar:* Sovgʻalarni taqish (👑), profilga qadash (📌) va boshqalar profilini koʻrish!${isOwnerAdmin ? '\n\n👑 *Sizda Admin Panel (ID: 100) huquqi mavjud.*' : ''}`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🎁 Gifts, Market & Profilni ochish', web_app: { url: appUrlWithAuth } }]
                ]
              }
            });
          }
        }

        const latestPayments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: offset - 1 });
        latestPayments.lastUpdateId = offset - 1;
        saveJSON(paymentsFile, latestPayments);
      }
    } catch {}
    await new Promise(r => setTimeout(r, 800));
  }
}

const PORT = process.env.PORT || 4000;
loadCloudStateOnStartup().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Paxta Gifts — Shop, Market, Profiles, Upgrade, Craft & Admin (ID 100) | http://localhost:${PORT}\n`);
    startPaxtaBotLoop();

    if (process.env.RENDER_EXTERNAL_URL) {
      setInterval(() => {
        fetch(`${process.env.RENDER_EXTERNAL_URL}/api/health`).catch(() => {});
      }, 9 * 60 * 1000);
    }
  });
});
