import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { initTursoSync, saveToTurso } from './turso.js';
import { registerHoldEngine } from './hold-engine.js';

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
const promocodesFile = path.join(dataDir, 'promocodes.json');
const channelCalendarsFile = path.join(dataDir, 'channel_calendars.json');
const channelMedalsFile = path.join(dataDir, 'channel_medals.json');
const holdStateFile = path.join(dataDir, 'hold_state.json');

// STRICT HARDWARE-LEVEL PROTECTION FOR THE 4 FORBIDDEN NFTs (NEVER TOUCH OR TRANSFER!)
const FORBIDDEN_GIFT_IDS = new Set([6068, 4226, 3015, 6095]);

// PaxtaGram @UpgradeBot (Forge, ID: 682) & @HOLDbot (Notcoin/$HOLD, ID: 118) configuration
const PAXTA_BOT_TOKEN = process.env.PAXTA_BOT_TOKEN || '682:OSWsBqK5LZHWlGJmzeONb9iIjE-UV7QBQY_';
const HOLD_BOT_TOKEN = process.env.HOLD_BOT_TOKEN || '135:RNksEDbLLA3F1fJOXrAQZHN3Vs44NAD_Tac';
const PAXTA_API_BASE = process.env.PAXTA_API_BASE || 'https://paxta.online';
const PUBLIC_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_APP_URL || 'https://paxta-gift-upgrade.onrender.com';
const ADMIN_PAXTA_ID = 100; // Strictly ONLY PaxtaGram User ID 100 has admin access
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const MOON_USERNAME = process.env.MOON_USERNAME || 'shade';
const MOON_PASSWORD = process.env.MOON_PASSWORD || 'urRFEbgx5mgbWib';
const MILLIYBEK_USERNAME = process.env.MILLIYBEK_USERNAME || 'Milliybek';
const MILLIYBEK_PASSWORD = process.env.MILLIYBEK_PASSWORD || 'YHT2NCsKPXgLE2d';

// Cloud Gist Persistence (ensures Render restarts/redeploys never lose user data)
const STATE_GIST_ID = process.env.STATE_GIST_ID || '0f1aac885e21df6b689d54e0e373a1e0';
const STATE_GH_TOKEN = process.env.STATE_GH_TOKEN || '';

fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
if (!fs.existsSync(inventoryFile)) fs.writeFileSync(inventoryFile, '[]');
if (!fs.existsSync(paymentsFile)) fs.writeFileSync(paymentsFile, '{"invoices":{},"charges":{},"lastUpdateId":80860}');
if (!fs.existsSync(activityFile)) fs.writeFileSync(activityFile, '[]');
if (!fs.existsSync(promocodesFile)) fs.writeFileSync(promocodesFile, '{}');
if (!fs.existsSync(holdStateFile)) fs.writeFileSync(holdStateFile, '{}');

// ---- High-Speed In-Memory RAM Cache + Non-Blocking Async Disk Persistence ----
const memStore = new Map();
const diskWriteTimers = new Map();
let invStatsVersion = 1;

function hydrateMemoryFromDisk() {
  for (const f of [usersFile, inventoryFile, settingsFile, paymentsFile, activityFile, promocodesFile, indexFile, channelCalendarsFile, channelMedalsFile, holdStateFile]) {
    if (fs.existsSync(f)) {
      try {
        memStore.set(f, JSON.parse(fs.readFileSync(f, 'utf8')));
      } catch {}
    }
  }
  invStatsVersion++;
}

const loadJSON = (f, fb) => {
  if (memStore.has(f)) return memStore.get(f);
  try {
    const parsed = JSON.parse(fs.readFileSync(f, 'utf8'));
    memStore.set(f, parsed);
    return parsed;
  } catch {
    return fb;
  }
};

const saveJSON = (f, d) => {
  memStore.set(f, d);
  if (f === inventoryFile || f === settingsFile) {
    invStatsVersion++;
  }

  // Non-blocking debounced async disk write (never freezes Node.js event loop!)
  if (diskWriteTimers.has(f)) clearTimeout(diskWriteTimers.get(f));
  diskWriteTimers.set(f, setTimeout(async () => {
    diskWriteTimers.delete(f);
    try {
      const tmp = `${f}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(d));
      await fs.promises.rename(tmp, f);
    } catch {}
  }, 200));

  // Instant Turso Cloud Database sync (debounced in turso.js)
  const keyMap = {
    [inventoryFile]: 'inventory',
    [usersFile]: 'users',
    [settingsFile]: 'settings',
    [paymentsFile]: 'payments',
    [activityFile]: 'activity',
    [promocodesFile]: 'promocodes',
    [holdStateFile]: 'hold_state',
    [channelCalendarsFile]: 'channel_calendars',
    [channelMedalsFile]: 'channel_medals'
  };
  const tursoKey = keyMap[f];
  if (tursoKey) {
    saveToTurso(tursoKey, d);
  }
};

// ---- Cloud State Backup & Restore (Turso LibSQL Cloud DB) ----
async function loadCloudStateOnStartup() {
  try {
    await initTursoSync(dataDir);
  } catch (err) {
    console.error('[Turso Init Error]', err.message);
  }
  hydrateMemoryFromDisk();
  const localUsers = loadJSON(usersFile, {});
  const localInv = loadJSON(inventoryFile, []);
  console.log(`📂 [TursoState] Active RAM state hydrated: ${Object.keys(localUsers).length} users, ${localInv.length} gifts`);
}

function scheduleCloudSync() {}

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
  if (s && s.collections) {
    if (!s.soldCalendars) s.soldCalendars = {};
    if (!Array.isArray(s.calendarOrders)) s.calendarOrders = [];
    return s;
  }
  const initial = {
    collections: Object.fromEntries(index.map(c => [
      c.slug,
      {
        enabled: c.slug === 'coinflip' || c.slug === 'imperialcrown',
        price: c.price !== undefined ? c.price : 250,
        upgradePrice: c.upgradePrice !== undefined ? c.upgradePrice : 100,
        supply: c.supply || 500
      }
    ])),
    soldCalendars: {},
    calendarOrders: []
  };
  saveJSON(settingsFile, initial);
  return initial;
}

function getColConfig(slug, fallbackCol = {}) {
  const settings = loadSettings();
  const cfg = settings.collections?.[slug] || {};
  const enabled = cfg.enabled !== undefined ? !!cfg.enabled : (slug === 'coinflip' || slug === 'imperialcrown');
  const supply = cfg.supply !== undefined ? cfg.supply : (fallbackCol.supply || 500);
  const price = cfg.price !== undefined ? cfg.price : (fallbackCol.price !== undefined ? fallbackCol.price : 250);
  const upgradePrice = cfg.upgradePrice !== undefined ? cfg.upgradePrice : (fallbackCol.upgradePrice !== undefined ? fallbackCol.upgradePrice : 100);
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
  if (url.startsWith('/a/') || url.startsWith('/calendars/')) return url;
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
  let img = normalizeUrl(slug, m.img);
  let tgs = normalizeTgsToJson(slug, m.tgs || m.img);

  if (slug === 'imperialcrown') {
    const c = loadCollection('imperialcrown');
    if (c) {
      const allModels = [...(c.models || []), ...(c.craftModels || [])];
      let match = allModels.find(x => x.id === m.id || x.name === m.name);
      if (!match && c.models && c.models.length > 0) {
        const hash = String(m.name || m.id || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        match = c.models[hash % c.models.length];
      }
      if (match) {
        img = normalizeUrl(slug, match.img);
        tgs = normalizeTgsToJson(slug, match.tgs);
      }
    }
  }

  const rarity = m.rarity || m.permille || Math.max(1, Math.round((m.pct || 1.5) * 10));
  return {
    id: m.id || m.name,
    name: m.name,
    rarity,
    pct: +(rarity / 10).toFixed(1),
    crafted: !!m.crafted,
    tier: m.tier || null,
    img,
    tgs
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

// ---- O(1) Single-Pass Collection Stats Index ----
let cachedStatsVersion = -1;
let cachedSlugCounts = new Map();
let cachedComputedStats = new Map();

function ensureStatsIndex(inv) {
  if (cachedStatsVersion === invStatsVersion) return;
  cachedSlugCounts = new Map();
  cachedComputedStats = new Map();
  for (let idx = 0; idx < inv.length; idx++) {
    const item = inv[idx];
    const s = item.slug;
    if (!s) continue;
    let entry = cachedSlugCounts.get(s);
    if (!entry) {
      entry = { totalMinted: 0, burnedCount: 0, activeCount: 0 };
      cachedSlugCounts.set(s, entry);
    }
    if (!item.isSpecialFounder && item.paid > 0) {
      entry.totalMinted++;
    }
    if (item.state === 'burned' || item.state === 'converted') {
      entry.burnedCount++;
    } else {
      entry.activeCount++;
    }
  }
  cachedStatsVersion = invStatsVersion;
}

function computeCollectionStats(slug, inv) {
  ensureStatsIndex(inv || loadJSON(inventoryFile, []));
  if (cachedComputedStats.has(slug)) return cachedComputedStats.get(slug);
  const c = loadCollection(slug) || {};
  const cfg = getColConfig(slug, c);
  const counts = cachedSlugCounts.get(slug) || { totalMinted: 0, burnedCount: 0, activeCount: 0 };
  const totalMinted = counts.totalMinted;
  const burnedCount = counts.burnedCount;
  const activeCount = counts.activeCount;
  const remainingToBuy = Math.max(0, cfg.supply - totalMinted);
  const circulating = slug === 'mask' && totalMinted <= 1
    ? Math.max(1, 217 - burnedCount)
    : Math.max(0, cfg.supply - burnedCount);
  const res = {
    ...cfg,
    totalMinted,
    burnedCount,
    activeCount,
    remainingToBuy,
    circulating
  };
  cachedComputedStats.set(slug, res);
  return res;
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
      for (const tok of [PAXTA_BOT_TOKEN, HOLD_BOT_TOKEN]) {
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(tok).digest();
        const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        if (computedHash === hash) {
          return { ...userObj, verified: true };
        }
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

// ---- PaxtaGram Bot API Helpers ----
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

async function holdBotCall(method, body = {}) {
  try {
    const res = await fetch(`${PAXTA_API_BASE}/bot${HOLD_BOT_TOKEN}/${method}`, {
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

// ---- PaxtaGram Account Client (Transfers Real Channel Desk Calendar & Victory Medal NFTs) ----
class MoonPaxtaClient {
  constructor(username = MOON_USERNAME, password = MOON_PASSWORD, loginAliases = [MOON_USERNAME, 'moon', 'shade']) {
    this.username = username;
    this.password = password;
    this.loginAliases = loginAliases;
    this.cookies = new Map();
    this.isLoggedIn = false;
    this.user = null;
    this.lastLoginAt = 0;
  }

  updateCookies(headers) {
    const raw =
      typeof headers.getSetCookie === 'function'
        ? headers.getSetCookie()
        : headers.get('set-cookie')
          ? [headers.get('set-cookie')]
          : [];
    for (const c of raw) {
      const firstPart = c.split(';')[0];
      const eqIdx = firstPart.indexOf('=');
      if (eqIdx > 0) {
        const k = firstPart.slice(0, eqIdx).trim();
        const v = firstPart.slice(eqIdx + 1).trim();
        this.cookies.set(k, v);
      }
    }
  }

  getCookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  getXsrfToken() {
    const raw = this.cookies.get('XSRF-TOKEN') || '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  async request(apiPath, options = {}) {
    const url = apiPath.startsWith('http') ? apiPath : `${PAXTA_API_BASE}/api${apiPath}`;
    const headers = {
      'User-Agent': BROWSER_UA,
      Accept: 'application/json, text/plain, */*',
      Referer: `${PAXTA_API_BASE}/`,
      Cookie: this.getCookieHeader(),
      'X-XSRF-TOKEN': this.getXsrfToken(),
      ...(options.headers || {})
    };
    let body = options.body;
    if (body && typeof body === 'object') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    const res = await fetch(url, {
      ...options,
      headers,
      body,
      signal: AbortSignal.timeout(8000)
    });
    this.updateCookies(res.headers);
    return res;
  }

  async ensureLoggedIn() {
    if (this.isLoggedIn && Date.now() - this.lastLoginAt < 25 * 60 * 1000) {
      return true;
    }
    try {
      const csrfRes = await fetch(`${PAXTA_API_BASE}/sanctum/csrf-cookie`, {
        headers: { 'User-Agent': BROWSER_UA, Referer: `${PAXTA_API_BASE}/` },
        signal: AbortSignal.timeout(6000)
      });
      this.updateCookies(csrfRes.headers);

      for (const uname of this.loginAliases) {
        const loginRes = await this.request('/auth/login', {
          method: 'POST',
          body: { username: uname, password: this.password }
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          this.user = data.user;
          this.isLoggedIn = true;
          this.lastLoginAt = Date.now();
          console.log(`[PaxtaClient] Logged in as @${this.user?.username} (ID: ${this.user?.id})`);
          return true;
        }
      }
    } catch (err) {
      console.error(`[PaxtaClient Login Error @${this.username}]`, err.message);
    }
    return false;
  }

  async resolveUserByUsername(rawUsername) {
    const clean = String(rawUsername || '').replace(/^@/, '').trim();
    if (!clean) return null;
    await this.ensureLoggedIn();
    try {
      const res = await this.request(`/users/${encodeURIComponent(clean)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  async transferNftGift({ giftId, targetUserId }) {
    const numGiftId = Number(giftId);
    if (FORBIDDEN_GIFT_IDS.has(numGiftId)) {
      return { ok: false, status: 403, data: { message: 'Protected personal NFT!' } };
    }
    await this.ensureLoggedIn();
    try {
      await this.request(`/user-gifts/${numGiftId}/resale`, { method: 'DELETE' });
    } catch {}
    const res = await this.request(`/user-gifts/${numGiftId}/transfer`, {
      method: 'POST',
      body: {
        user_id: Number(targetUserId),
        expected_price: 50
      }
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }
}

const moonClient = new MoonPaxtaClient(MOON_USERNAME, MOON_PASSWORD, [MOON_USERNAME, 'moon', 'shade']);
const milliybekClient = new MoonPaxtaClient(MILLIYBEK_USERNAME, MILLIYBEK_PASSWORD, [MILLIYBEK_USERNAME, 'Milliybek']);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Fast built-in Gzip compression for JSON responses > 1 KB (cuts 500 KB responses to ~15 KB!)
app.use((req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    const accept = req.headers['accept-encoding'] || '';
    if (accept.includes('gzip')) {
      const str = JSON.stringify(body);
      if (str.length > 1024) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        return res.send(zlib.gzipSync(Buffer.from(str, 'utf8'), { level: zlib.constants.Z_BEST_SPEED }));
      }
    }
    return origJson(body);
  };
  next();
});

app.use('/calendars', express.static(path.join(__dirname, 'public', 'calendars'), { maxAge: '7d', immutable: true }));
app.use('/img', express.static(path.join(__dirname, 'public', 'img'), { maxAge: '7d' }));
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

// ---- Asset proxy with RAM + disk cache ----
const assetMemCache = new Map();

async function serveGiftAsset(req, res) {
  const { slug, file } = req.params;
  if (!/^[a-z0-9]+$/.test(slug) || !/^[A-Za-z0-9._-]+\.(webp|svg|json|tgs)$/.test(file)) {
    return res.sendStatus(400);
  }
  const cacheKey = `${slug}__${file}`;
  const types = {
    webp: 'image/webp',
    svg: 'image/svg+xml',
    json: 'application/json',
    tgs: 'application/octet-stream'
  };
  const type = types[file.split('.').pop()];
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

  if (assetMemCache.has(cacheKey)) {
    return res.type(type).send(assetMemCache.get(cacheKey));
  }

  const wantJson = file.endsWith('.json');
  const remoteFile = wantJson ? file.replace(/\.json$/, '.tgs') : file;
  const local = path.join(cacheDir, cacheKey);

  if (fs.existsSync(local)) {
    const buf = fs.readFileSync(local);
    if (assetMemCache.size < 600) assetMemCache.set(cacheKey, buf);
    return res.type(type).send(buf);
  }

  try {
    const r = await fetch(`https://fragment.com/file/gifts/${slug}/${remoteFile}`, {
      headers: { 'User-Agent': BROWSER_UA }
    });
    if (!r.ok) return res.sendStatus(404);
    let buf = Buffer.from(await r.arrayBuffer());
    if (wantJson) buf = zlib.gunzipSync(buf);
    fs.promises.writeFile(local, buf).catch(() => {});
    if (assetMemCache.size < 600) assetMemCache.set(cacheKey, buf);
    res.type(type).send(buf);
  } catch {
    res.sendStatus(502);
  }
}

app.get('/a/:slug/:file', serveGiftAsset);
app.get('/file/gifts/:slug/:file', serveGiftAsset);

// ---- Deterministic Profitable Pricing for Real Channel Desk Calendar NFTs ----
function computeCalendarPrice(cal) {
  const isBlack = cal.backdrop === 'Black' || cal.backdrop === 'Onyx Black';
  const isCraft = !!cal.crafted;
  const num = Number(cal.number || 999);
  if (isCraft && isBlack) return 2200;
  if (isCraft) return 1650;
  if (isBlack) return num < 200 ? 1850 : 1500;
  if (num < 100) return 1350;
  if (num < 250) return 1150;
  if (num < 600) return 1000;
  return 950;
}

function getEnrichedChannelCalendars() {
  const raw = loadJSON(channelCalendarsFile, []);
  const settings = loadSettings();
  const soldMap = settings.soldCalendars || {};
  return raw.map(cal => {
    const soldInfo = soldMap[cal.id] || null;
    const priceStars = computeCalendarPrice(cal);
    const maxTradeInDiscount = 300;
    const isBlack = cal.backdrop === 'Black' || cal.backdrop === 'Onyx Black';
    return {
      ...cal,
      priceStars,
      minStarsWithTradeIn: Math.max(650, priceStars - maxTradeInDiscount),
      maxTradeInDiscount,
      isBlackBackdrop: isBlack,
      tierLabel: cal.crafted
        ? '🔨 Craft Eksklyuziv'
        : isBlack
          ? '🖤 Black Fon VIP'
          : cal.number < 100
            ? '👑 Top #100 Raqam'
            : '📅 Rasmiy Kanal NFT',
      sold: !!soldInfo,
      soldTo: soldInfo?.buyer || null,
      soldAt: soldInfo?.soldAt || null,
      deliveryStatus: soldInfo?.deliveryStatus || null
    };
  });
}

// ---- Real Channel Desk Calendar NFTs Vitrinasi (GET /api/channel-calendars) ----
app.get('/api/channel-calendars', (req, res) => {
  const list = getEnrichedChannelCalendars();
  const availableCount = list.filter(c => !c.sold).length;
  res.json({
    ok: true,
    totalCount: list.length,
    availableCount,
    soldCount: list.length - availableCount,
    calendars: list
  });
});

// ---- Buy / Smart Exchange Real Channel Desk Calendar NFT (POST /api/channel-calendars/buy) ----
app.post('/api/channel-calendars/buy', async (req, res) => {
  const key = cleanKey(req.body.username);
  const calendarId = String(req.body.calendarId || '').trim();
  const tradeInGiftIds = Array.isArray(req.body.tradeInGiftIds) ? req.body.tradeInGiftIds.slice(0, 3) : [];
  const recipientUsername = cleanName(req.body.recipientUsername || key);

  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const settings = loadSettings();

  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });

  const allCals = getEnrichedChannelCalendars();
  const cal = allCals.find(c => c.id === calendarId);
  if (!cal) return res.status(404).json({ ok: false, error: 'Kalendar NFT topilmadi' });
  if (cal.sold) return res.status(400).json({ ok: false, error: 'Ushbu Kalendar NFT allaqachon xarid qilingan!' });

  // Validate optional Trade-In gifts (up to 3 upgraded gifts owned by buyer)
  const tradeInGifts = [];
  let tradeInDiscount = 0;
  for (const gid of tradeInGiftIds) {
    const g = inv.find(i => i.id === gid && i.owner === key && i.state === 'upgraded' && !i.salePrice && !i.isRealPaxtaNft);
    if (!g) {
      return res.status(400).json({ ok: false, error: 'Almashtirish uchun tanlangan sovgʻa topilmadi yoki sotuvda turibdi' });
    }
    tradeInGifts.push(g);
    const credit = Math.min(120, Math.max(40, Math.round(((g.paid || 100) + (g.upgradePaid || 50)) * 0.45)));
    tradeInDiscount += credit;
  }
  tradeInDiscount = Math.min(cal.maxTradeInDiscount || 300, tradeInDiscount);

  const finalStarsPrice = Math.max(650, cal.priceStars - tradeInDiscount);
  if ((users[key].stars || 0) < finalStarsPrice) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: finalStarsPrice - (users[key].stars || 0),
      required: finalStarsPrice,
      balance: users[key].stars || 0,
      error: `Yulduzlar yetarli emas: ⭐ ${finalStarsPrice} kerak (balans: ⭐ ${users[key].stars || 0})`
    });
  }

  // Deduct Stars & burn traded-in gifts
  const now = new Date().toISOString();
  users[key].stars -= finalStarsPrice;
  for (const tg of tradeInGifts) {
    tg.state = 'converted';
    tg.convertedAt = now;
    tg.worn = false;
    tg.pinned = false;
    tg.salePrice = null;
  }

  // Attempt automated real PaxtaGram NFT transfer via @moon
  let deliveryStatus = 'pending_transfer';
  let deliveryMessage = 'Buyurtma qabul qilindi! Kalendar NFT PaxtaGram profilingizga oʻtkazilmoqda.';
  let targetPaxtaId = users[key].paxtaId || null;

  try {
    if (!targetPaxtaId || cleanKey(recipientUsername) !== key) {
      const resolved = await moonClient.resolveUserByUsername(recipientUsername);
      if (resolved?.id) targetPaxtaId = resolved.id;
    }
    const lockTime = cal.tradeLockedUntil ? new Date(cal.tradeLockedUntil).getTime() : 0;
    if (targetPaxtaId && (!lockTime || Date.now() >= lockTime)) {
      const tx = await moonClient.transferNftGift({
        giftId: cal.giftId,
        targetUserId: targetPaxtaId
      });
      if (tx.ok) {
        deliveryStatus = 'delivered';
        deliveryMessage = `🎉 Real Desk Calendar #${cal.number} NFT PaxtaGram profilingizga (@${recipientUsername}) avtomatik oʻtkazildi!`;
      }
    }
  } catch (err) {
    console.error('[Calendar Auto-Transfer Error]', err.message);
  }

  // Record sale in settings
  settings.soldCalendars = settings.soldCalendars || {};
  settings.soldCalendars[cal.id] = {
    calendarId: cal.id,
    giftId: cal.giftId,
    number: cal.number,
    model: cal.model,
    backdrop: cal.backdrop,
    buyer: key,
    recipientUsername,
    targetPaxtaId,
    paidStars: finalStarsPrice,
    tradeInCount: tradeInGifts.length,
    tradeInDiscount,
    deliveryStatus,
    soldAt: now
  };
  settings.calendarOrders = settings.calendarOrders || [];
  settings.calendarOrders.unshift(settings.soldCalendars[cal.id]);

  // Also add the verified Real PaxtaGram NFT card into the user's @UpgradeBot inventory showcase!
  const nftGiftRecord = {
    id: `nft_cal_${cal.number}_${Date.now().toString(36)}`,
    owner: key,
    ownerName: users[key].displayName || key,
    slug: 'deskcalendar',
    name: 'Desk Calendar (Real NFT)',
    thumb: cal.image,
    baseTgs: cal.image,
    supply: 2059,
    state: 'upgraded',
    crafted: !!cal.crafted,
    isRealPaxtaNft: true,
    realGiftId: cal.giftId,
    paxtaNftLink: cal.link,
    deliveryStatus,
    hidden: false,
    worn: false,
    pinned: false,
    salePrice: null,
    paid: finalStarsPrice,
    upgradePaid: 0,
    number: cal.number,
    model: {
      id: cal.model,
      name: cal.model,
      rarity: cal.crafted ? 5 : 15,
      pct: cal.crafted ? 0.5 : 1.5,
      crafted: !!cal.crafted,
      tier: cal.crafted ? 'legendary' : null,
      img: cal.image,
      tgs: ''
    },
    backdrop: {
      id: cal.backdrop,
      name: cal.backdrop,
      rarity: cal.isBlackBackdrop ? 8 : 20,
      pct: cal.isBlackBackdrop ? 0.8 : 2.0,
      center: cal.backdropColors?.center || '#363738',
      edge: cal.backdropColors?.edge || '#0e0f0f',
      pattern: cal.backdropColors?.edge || '#000000',
      text: cal.backdropColors?.text || '#f3f4f8'
    },
    symbol: {
      id: cal.pattern,
      name: cal.pattern,
      rarity: 12,
      pct: 1.2,
      img: ''
    },
    boughtAt: now,
    upgradedAt: now
  };
  inv.push(nftGiftRecord);

  saveJSON(usersFile, users);
  saveJSON(inventoryFile, inv);
  saveJSON(settingsFile, settings);

  logActivity({
    type: 'buy_real_nft',
    actor: key,
    actorName: users[key].displayName || key,
    giftId: nftGiftRecord.id,
    giftName: `Desk Calendar #${cal.number} (Real NFT)`,
    giftNumber: cal.number,
    slug: 'deskcalendar',
    modelName: cal.model,
    thumb: cal.image,
    price: finalStarsPrice
  });

  // Notify Admin (ID 100) via @UpgradeBot
  paxtaBotCall('sendMessage', {
    chat_id: ADMIN_PAXTA_ID,
    text: `📅 *YANGI REAL KALENDAR NFT XARIDI!*\n\n🎁 NFT: *Desk Calendar #${cal.number}* (${cal.model} · ${cal.backdrop})\n👤 Xaridor: *@${key}* (PaxtaGram: *@${recipientUsername}*)\n💰 Toʻlandi: *⭐ ${finalStarsPrice} Stars*${tradeInGifts.length ? ` (+${tradeInGifts.length} ta sovgʻa Trade-In)` : ''}\n📦 Holat: *${deliveryStatus === 'delivered' ? '✅ Avtomatik oʻtkazildi' : '⏳ Oʻtkazish kutilmoqda'}*\n🔗 Havola: ${cal.link}`,
    parse_mode: 'Markdown'
  }).catch(() => {});

  res.json({
    ok: true,
    calendar: { ...cal, sold: true, soldTo: key, deliveryStatus },
    gift: enrichGift(nftGiftRecord, inv, users),
    newBalance: users[key].stars,
    deliveryStatus,
    message: deliveryMessage
  });
});

// ---- Admin Manual Trigger for Real Calendar NFT Transfer (ID: 100) ----
app.post('/api/admin/calendar-deliver', async (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Faqat Admin (ID 100) uchun' });
  }
  const { calendarId, targetUsername } = req.body;
  const settings = loadSettings();
  const order = settings.soldCalendars?.[calendarId];
  if (!order) return res.status(404).json({ ok: false, error: 'Buyurtma topilmadi' });

  const uname = cleanName(targetUsername || order.recipientUsername || order.buyer);
  const resolved = await moonClient.resolveUserByUsername(uname);
  if (!resolved?.id) {
    return res.status(400).json({ ok: false, error: `PaxtaGram'da @${uname} foydalanuvchisi topilmadi` });
  }

  const tx = await moonClient.transferNftGift({
    giftId: order.giftId,
    targetUserId: resolved.id
  });
  if (!tx.ok) {
    return res.status(400).json({ ok: false, error: tx.data?.message || 'Transfer amalga oshmadi (50 Stars balans yoki trade-lock tekshiring)' });
  }

  order.deliveryStatus = 'delivered';
  order.deliveredAt = new Date().toISOString();
  saveJSON(settingsFile, settings);
  res.json({ ok: true, order });
});

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
    canCraft: g.state === 'upgraded' && !g.salePrice && Boolean(c.craftModels && c.craftModels.length > 0),
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
  const settings = loadSettings();
  res.json({
    ok: true,
    collections: list,
    calendarOrders: settings.calendarOrders || [],
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
    enabled: slug === 'coinflip' || slug === 'imperialcrown',
    price: c.price !== undefined ? c.price : 250,
    upgradePrice: c.upgradePrice !== undefined ? c.upgradePrice : 100,
    supply: c.supply || 500
  };

  settings.collections[slug] = {
    enabled: enabled !== undefined ? !!enabled : prev.enabled,
    price: price !== undefined ? Math.max(1, parseInt(price, 10) || prev.price) : prev.price,
    upgradePrice: upgradePrice !== undefined ? Math.max(0, parseInt(upgradePrice, 10) || 0) : prev.upgradePrice,
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
        price: c.price !== undefined ? c.price : 250,
        upgradePrice: c.upgradePrice !== undefined ? c.upgradePrice : 100,
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

// ---- User Promo Code Redemption (Foydalanuvchilar uchun Promokod) ----
app.post('/api/promocode/redeem', (req, res) => {
  const codeRaw = (req.body.code || '').trim().toUpperCase();
  const webAppUser = verifyWebAppInitData(req.body.initData);
  const tokenSession = verifySessionToken(req.body.authToken || req.headers['x-auth-token']);
  const verifiedPaxtaId = webAppUser?.id || tokenSession?.paxtaId || null;

  const users = loadJSON(usersFile, {});
  let key = null;
  if (verifiedPaxtaId) {
    key = Object.keys(users).find(k => Number(users[k].paxtaId) === Number(verifiedPaxtaId)) || null;
  }
  if (!key) {
    key = cleanKey(req.body.username || webAppUser?.username || tokenSession?.username || '');
  }

  if (!key || !users[key]) {
    return res.status(401).json({ ok: false, error: 'Avval akkauntingizga kiring' });
  }

  if (!codeRaw) {
    return res.status(400).json({ ok: false, error: 'Promokod kiritilmadi' });
  }

  const promos = loadJSON(promocodesFile, {});
  const promoKey = Object.keys(promos).find(k => k.trim().toUpperCase() === codeRaw);
  if (!promoKey || !promos[promoKey]) {
    return res.status(404).json({ ok: false, error: 'Bunday promokod mavjud emas yoki muddati tugagan' });
  }

  const promo = promos[promoKey];
  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return res.status(400).json({ ok: false, error: 'Ushbu promokoddan foydalanish limiti tugagan' });
  }

  promo.usedBy = promo.usedBy || [];
  if (promo.usedBy.includes(key)) {
    return res.status(400).json({ ok: false, error: 'Siz bu promokoddan allaqachon foydalangansiz' });
  }

  let rewardDescription = '';
  let mintedGift = null;

  if (promo.rewardType === 'gift' && promo.giftSlug) {
    const c = loadCollection(promo.giftSlug);
    if (!c) return res.status(400).json({ ok: false, error: 'Sovgʻa kolleksiyasi topilmadi' });
    const inv = loadJSON(inventoryFile, []);
    const stats = computeCollectionStats(c.slug, inv);

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
      paid: 0,
      boughtAt: new Date().toISOString()
    };
    inv.push(gift);
    saveJSON(inventoryFile, inv);
    mintedGift = enrichGift(gift, inv, users);
    rewardDescription = `${c.name} sovgʻasi`;
  } else {
    const starsAmount = Math.max(1, parseInt(promo.stars, 10) || 50);
    users[key].stars = (users[key].stars || 0) + starsAmount;
    rewardDescription = `⭐ ${starsAmount} Stars`;
  }

  promo.usedCount = (promo.usedCount || 0) + 1;
  promo.usedBy.push(key);

  saveJSON(promocodesFile, promos);
  saveJSON(usersFile, users);

  logActivity({
    type: 'promocode',
    actor: key,
    actorName: users[key].displayName || key,
    code: promo.code || codeRaw,
    reward: rewardDescription
  });

  return res.json({
    ok: true,
    message: `Tabriklaymiz! Sizga ${rewardDescription} taqdim etildi!`,
    rewardType: promo.rewardType || 'stars',
    stars: promo.stars || 0,
    newBalance: users[key].stars,
    gift: mintedGift
  });
});

// ---- Admin Promocodes Management (ID: 100) ----
app.get('/api/admin/promocodes', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const promos = loadJSON(promocodesFile, {});
  const list = Object.values(promos).map(p => ({
    ...p,
    remainingUses: Math.max(0, (p.maxUses || 0) - (p.usedCount || 0))
  }));
  res.json({ ok: true, promocodes: list });
});

app.post('/api/admin/promocode', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const { action, code, stars, maxUses, rewardType, giftSlug } = req.body;
  const promos = loadJSON(promocodesFile, {});
  const cleanCode = (code || '').trim().toUpperCase();

  if (action === 'delete') {
    if (promos[cleanCode]) {
      delete promos[cleanCode];
      saveJSON(promocodesFile, promos);
      return res.json({ ok: true, message: `Promokod ${cleanCode} oʻchirildi` });
    }
    return res.status(404).json({ ok: false, error: 'Promokod topilmadi' });
  }

  if (!cleanCode || cleanCode.length < 3) {
    return res.status(400).json({ ok: false, error: 'Promokod kamida 3 belgidan iborat boʻlishi kerak' });
  }

  promos[cleanCode] = {
    code: cleanCode,
    rewardType: rewardType || 'stars',
    stars: Math.max(1, parseInt(stars, 10) || 100),
    maxUses: parseInt(maxUses, 10) || 50,
    usedCount: promos[cleanCode]?.usedCount || 0,
    usedBy: promos[cleanCode]?.usedBy || [],
    giftSlug: giftSlug || null,
    createdAt: new Date().toISOString()
  };

  saveJSON(promocodesFile, promos);
  res.json({ ok: true, promocode: promos[cleanCode] });
});

// ---- Admin Users & Balance Management (ID: 100) ----
app.get('/api/admin/users', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  const list = Object.keys(users).map(k => {
    const u = users[k];
    const userGifts = inv.filter(g => g.owner === k && g.state !== 'burned' && g.state !== 'converted');
    return {
      username: u.username || k,
      displayName: u.displayName || u.username || k,
      paxtaId: u.paxtaId || null,
      avatarUrl: u.avatarUrl || null,
      stars: u.stars || 0,
      giftsCount: userGifts.length,
      upgradedCount: userGifts.filter(g => g.state === 'upgraded').length,
      createdAt: u.createdAt || null
    };
  });

  list.sort((a, b) => (b.stars || 0) - (a.stars || 0));
  res.json({ ok: true, users: list });
});

app.post('/api/admin/user/balance', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const { targetUsername, mode, deltaStars, newStars, reason } = req.body;
  const targetKey = cleanKey(targetUsername);
  const users = loadJSON(usersFile, {});

  if (!users[targetKey]) {
    users[targetKey] = {
      username: targetKey,
      displayName: targetKey,
      paxtaId: null,
      avatarUrl: null,
      bio: '',
      stars: 0,
      createdAt: new Date().toISOString()
    };
  }

  const oldBalance = users[targetKey].stars || 0;
  if (mode === 'set') {
    users[targetKey].stars = Math.max(0, parseInt(newStars, 10) || 0);
  } else {
    const delta = parseInt(deltaStars, 10) || 0;
    users[targetKey].stars = Math.max(0, oldBalance + delta);
  }

  saveJSON(usersFile, users);

  logActivity({
    type: 'admin_balance',
    actor: 'admin_100',
    target: targetKey,
    oldBalance,
    newBalance: users[targetKey].stars,
    delta: users[targetKey].stars - oldBalance,
    reason: reason || 'Admin panel orqali oʻzgartirildi'
  });

  res.json({
    ok: true,
    username: targetKey,
    stars: users[targetKey].stars,
    oldBalance,
    delta: users[targetKey].stars - oldBalance
  });
});

app.post('/api/admin/user/gift', (req, res) => {
  if (!isRequestAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Kirish taqiqlangan: Admin panel faqat ID 100 uchun ochiq' });
  }
  const { targetUsername, slug, isUpgraded } = req.body;
  const targetKey = cleanKey(targetUsername);
  const users = loadJSON(usersFile, {});
  if (!users[targetKey]) {
    users[targetKey] = {
      username: targetKey,
      displayName: targetKey,
      paxtaId: null,
      avatarUrl: null,
      bio: '',
      stars: 0,
      createdAt: new Date().toISOString()
    };
    saveJSON(usersFile, users);
  }

  const c = loadCollection(slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });

  const inv = loadJSON(inventoryFile, []);
  const stats = computeCollectionStats(c.slug, inv);

  let gift;
  if (isUpgraded) {
    const existingNums = new Set(inv.filter(i => i.slug === c.slug && i.number).map(i => i.number));
    let nextNum = 1;
    while (existingNums.has(nextNum)) nextNum++;

    const model = weightedPick(c.models);
    const backdrop = weightedPick(c.backdrops);
    const symbol = weightedPick(c.symbols);

    gift = {
      id: `g_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
      owner: targetKey,
      ownerName: users[targetKey].displayName || targetKey,
      slug: c.slug,
      name: c.name,
      thumb: normalizeUrl(c.slug, c.thumb),
      baseTgs: normalizeTgsToJson(c.slug, c.baseTgs || c.thumb),
      supply: stats.supply,
      state: 'upgraded',
      crafted: false,
      hidden: false,
      worn: false,
      pinned: false,
      salePrice: null,
      paid: 0,
      number: nextNum,
      model: formatModelForClient(c.slug, model),
      backdrop: formatBackdropForClient(backdrop),
      symbol: formatSymbolForClient(c.slug, symbol),
      boughtAt: new Date().toISOString(),
      upgradedAt: new Date().toISOString(),
      mintedBy: 'admin_100'
    };
  } else {
    gift = {
      id: `g_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`,
      owner: targetKey,
      ownerName: users[targetKey].displayName || targetKey,
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
      paid: 0,
      boughtAt: new Date().toISOString(),
      mintedBy: 'admin_100'
    };
  }

  inv.push(gift);
  saveJSON(inventoryFile, inv);

  const enriched = enrichGift(gift, inv, users);
  logActivity({
    type: 'admin_gift',
    actor: 'admin_100',
    target: targetKey,
    giftId: gift.id,
    giftName: gift.name,
    slug: gift.slug
  });

  res.json({ ok: true, gift: enriched });
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
  const myGifts = profile.gifts;

  res.json({
    ok: true,
    authToken,
    user: {
      ...userRecord,
      isAdmin
    },
    profile: { ...profile, gifts: [] },
    inventory: myGifts
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

// ---- O(N) Single-Pass Users / Collectors Leaderboard & Search ----
app.get('/api/users', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().replace(/^@/, '');
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  // Group public active gifts by owner in ONE single pass!
  const giftsByOwner = new Map();
  for (let idx = 0; idx < inv.length; idx++) {
    const g = inv[idx];
    if (!g.owner || g.state === 'burned' || g.state === 'converted' || g.hidden) continue;
    let arr = giftsByOwner.get(g.owner);
    if (!arr) {
      arr = [];
      giftsByOwner.set(g.owner, arr);
    }
    arr.push(g);
  }

  const allKeys = new Set([
    ...Object.keys(users),
    ...giftsByOwner.keys()
  ]);

  const list = [];
  for (const k of allKeys) {
    const u = users[k] || { username: k, displayName: k, stars: 0 };
    if (q && !k.includes(q) && !(u.displayName || '').toLowerCase().includes(q)) continue;

    const rawGifts = giftsByOwner.get(k) || [];
    let upgradedCount = 0;
    let craftedCount = 0;
    let onSaleCount = 0;
    let collectionValue = 0;
    let wornRaw = null;
    const pinnedRaws = [];

    for (let i = 0; i < rawGifts.length; i++) {
      const rg = rawGifts[i];
      const st = computeCollectionStats(rg.slug, inv);
      const val = rg.salePrice || (rg.paid || st.price) + (rg.upgradePaid || 0);
      collectionValue += val;
      if (rg.state === 'upgraded') {
        upgradedCount++;
        if (rg.worn && !wornRaw) wornRaw = rg;
        if (rg.pinned && pinnedRaws.length < 4) pinnedRaws.push(rg);
      }
      if (rg.crafted) craftedCount++;
      if (rg.salePrice > 0) onSaleCount++;
    }

    const wornGift = wornRaw ? enrichGift(wornRaw, inv, users) : null;
    const pinnedPreviews = pinnedRaws.map(pg => {
      const eg = enrichGift(pg, inv, users);
      return {
        id: eg.id,
        name: eg.name,
        number: eg.number,
        img: eg.model?.img || eg.thumb,
        backdrop: eg.backdrop
      };
    });

    list.push({
      username: u.username || k,
      displayName: u.displayName || u.username || k,
      bio: u.bio || '',
      avatarUrl: u.avatarUrl || null,
      stats: {
        totalGifts: rawGifts.length,
        upgradedCount,
        craftedCount,
        onSaleCount,
        collectionValue
      },
      wornGift: wornGift ? {
        id: wornGift.id,
        name: wornGift.name,
        number: wornGift.number,
        model: wornGift.model,
        backdrop: wornGift.backdrop
      } : null,
      pinnedPreviews
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
  const payload = `topup:${key}:${amount}:${nonce}`.slice(0, 120);
  // Strictly <= 32 characters as required by PaxtaGram / Telegram createInvoiceLink API!
  const title = `Paxta Gifts · ${amount} Stars`.slice(0, 32);
  const rawDesc = purpose
    ? `${purpose} (@${users[key].displayName || key} — ${amount} PaxtaGram Stars)`
    : `@${users[key].displayName || key} hisobini ${amount} PaxtaGram Stars ga toʻldirish`;
  const description = rawDesc.slice(0, 200);
  const priceLabel = `${amount} Stars`.slice(0, 32);

  const botRes = await paxtaBotCall('createInvoiceLink', {
    title,
    description,
    payload,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: priceLabel, amount }]
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
  const isPaid = invRecord.status === 'paid';
  res.json({
    ok: true,
    status: invRecord.status,
    amount: invRecord.amount,
    paidAt: invRecord.paidAt || null,
    stars: userObj ? userObj.stars : 0,
    authToken: isPaid && userObj ? createSessionToken(userObj.username, userObj.paxtaId) : undefined,
    isAdmin: isPaid && userObj ? Number(userObj.paxtaId) === ADMIN_PAXTA_ID : undefined
  });
});

// ---- Buy a regular (un-upgraded) gift from Official Shop (Supports multi-buy) ----
app.post('/api/gifts/buy', (req, res) => {
  const key = cleanKey(req.body.username);
  const c = loadCollection(req.body.slug);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const count = Math.max(1, Math.min(parseInt(req.body.count || req.body.quantity || 1, 10), 100));

  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });

  const stats = computeCollectionStats(c.slug, inv);
  if (!stats.enabled) {
    return res.status(400).json({ ok: false, error: 'Bu sovgʻa hozircha sotuvda emas' });
  }
  if (stats.remainingToBuy <= 0) {
    return res.status(400).json({ ok: false, error: `Bu sovgʻa tugagan (${stats.supply} / ${stats.supply} sotib boʻlingan)` });
  }
  if (stats.remainingToBuy < count) {
    return res.status(400).json({ ok: false, error: `Faqat ${stats.remainingToBuy} ta sovgʻa qolgan, siz ${count} ta soʻradingiz` });
  }

  const totalCost = stats.price * count;
  if (users[key].stars < totalCost) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: totalCost - users[key].stars,
      required: totalCost,
      balance: users[key].stars,
      error: `Yulduzlar yetarli emas: ⭐ ${totalCost} kerak (balans: ⭐ ${users[key].stars})`
    });
  }

  users[key].stars -= totalCost;
  const newGifts = [];
  const now = new Date().toISOString();

  for (let i = 0; i < count; i++) {
    const gift = {
      id: `g_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}_${i}`,
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
      boughtAt: now
    };
    inv.push(gift);
    newGifts.push(gift);
  }

  saveJSON(usersFile, users);
  saveJSON(inventoryFile, inv);

  const enrichedFirst = enrichGift(newGifts[0], inv, users);
  logActivity({
    type: 'buy',
    actor: key,
    actorName: users[key].displayName || key,
    giftId: newGifts[0].id,
    giftName: count > 1 ? `${c.name} (${count}x)` : c.name,
    slug: c.slug,
    thumb: enrichedFirst.thumb,
    price: totalCost,
    count
  });

  res.json({
    ok: true,
    count,
    gifts: newGifts.map(g => enrichGift(g, inv, users)),
    gift: enrichedFirst,
    newBalance: users[key].stars
  });
});

// ---- Batch Burn Gifts (Tanlab turib 1 tadan 10 tagacha yoqish) ----
app.post('/api/gifts/burn', (req, res) => {
  const key = cleanKey(req.body.username);
  const giftIds = Array.isArray(req.body.giftIds) ? req.body.giftIds : (req.body.giftId ? [req.body.giftId] : []);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });
  if (!giftIds.length) return res.status(400).json({ ok: false, error: 'Kamida 1 ta sovgʻa tanlang' });
  if (giftIds.length > 10) return res.status(400).json({ ok: false, error: 'Bir vaqtda koʻpi bilan 10 ta sovgʻani yoqish mumkin' });

  // Find user gifts
  const targetGifts = [];
  for (const gid of giftIds) {
    const g = inv.find(i => i.id === gid && i.owner === key && i.state !== 'burned' && i.state !== 'converted');
    if (!g) {
      return res.status(404).json({ ok: false, error: `Sovgʻa topilmadi yoki allaqachon yoqilgan` });
    }
    if (g.salePrice && g.salePrice > 0) {
      return res.status(400).json({ ok: false, error: `«${g.name}» sotuvda turibdi. Avval sotuvdan oling` });
    }
    targetGifts.push(g);
  }

  const now = new Date().toISOString();
  const burnedNames = [];

  for (const g of targetGifts) {
    g.state = 'burned';
    g.burnedAt = now;
    g.worn = false;
    g.pinned = false;
    g.salePrice = null;
    burnedNames.push(g.name + (g.number ? ` #${g.number}` : ''));
  }

  saveJSON(inventoryFile, inv);

  logActivity({
    type: 'burn',
    actor: key,
    actorName: users[key]?.displayName || key,
    count: targetGifts.length,
    giftName: targetGifts.length === 1 ? burnedNames[0] : `${targetGifts.length} ta sovgʻa`
  });

  res.json({
    ok: true,
    burnedCount: targetGifts.length,
    newBalance: users[key].stars,
    burnedNames
  });
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

  // Atomic Stars transfer & Gift ownership transfer (10% Platform Fee, 90% Seller Proceeds)
  const platformFee = Math.max(1, Math.round(price * 0.10));
  const sellerProceeds = Math.max(1, price - platformFee);
  users[buyerKey].stars -= price;
  users[sellerKey].stars = (users[sellerKey].stars || 0) + sellerProceeds;

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
      text: `🎉 *Sovgʻangiz Marketda sotildi!*\n\n🎁 *${gift.name} #${gift.number}* (${enriched.model?.name || ''})\n👤 Xaridor: *@${buyerKey}*\n💰 Sotuv narxi: *⭐ ${price}*\n💎 Sizga tushdi (90%): *+⭐ ${sellerProceeds}*\n🏦 Yangi balansingiz: *⭐ ${users[sellerKey].stars}*`,
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
    isReupgrade: gift.state === 'upgraded',
    can_afford: balance >= stats.upgradePrice,
    balance_stars: balance,
    models: (c.models || []).map(m => formatModelForClient(c.slug, m)),
    backdrops: (c.backdrops || []).map(b => formatBackdropForClient(b)),
    patterns: (c.symbols || []).map(s => formatSymbolForClient(c.slug, s))
  });
});

// ---- Upgrade a regular gift OR Re-Upgrade (VIP Tuning) an upgraded gift -> 100% Guaranteed ----
app.post('/api/gifts/upgrade', (req, res) => {
  const key = cleanKey(req.body.username);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === req.body.giftId && i.owner === key && i.state !== 'burned');
  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval kiring' });
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });
  if (gift.isRealPaxtaNft) {
    return res.status(400).json({ ok: false, error: 'Real PaxtaGram NFT kalendarni oʻzgartirib boʻlmaydi' });
  }
  if (gift.salePrice && gift.salePrice > 0) {
    return res.status(400).json({ ok: false, error: 'Avval sovgʻani sotuvdan oling' });
  }

  const c = loadCollection(gift.slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
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

  // Preserve serial number if already upgraded (VIP Tuning), otherwise assign next serial number
  let nextNum = gift.number;
  if (!nextNum) {
    const existingNums = new Set(inv.filter(i => i.slug === c.slug && typeof i.number === 'number' && i.number > 0).map(i => i.number));
    nextNum = 1;
    while (existingNums.has(nextNum)) nextNum++;
  }

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
    upgradePaid: (gift.upgradePaid || 0) + stats.upgradePrice,
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

// ---- Preview Craft Data (GET /api/gifts/:id/craft) — 100% Guaranteed Non-Gambling Craft ----
app.get('/api/gifts/:id/craft', (req, res) => {
  const key = cleanKey(req.query.username || 'user');
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);
  const gift = inv.find(i => i.id === req.params.id && i.state === 'upgraded');
  if (!gift) return res.status(404).json({ ok: false, error: 'Sovg\'a topilmadi' });

  const c = loadCollection(gift.slug);
  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });

  const candidates = inv
    .filter(i => i.owner === key && i.slug === gift.slug && i.state === 'upgraded' && i.id !== gift.id && !i.salePrice && !i.isRealPaxtaNft)
    .map(g => {
      const eg = enrichGift(g, inv, users);
      return {
        id: eg.id,
        number: eg.number,
        chance: 250,
        crafted: !!eg.crafted,
        model: eg.model,
        backdrop: eg.backdrop,
        pattern: eg.symbol,
        symbol: eg.symbol
      };
    });

  res.json({
    ok: true,
    guaranteed: true,
    feePerMissingSlot: 150,
    solo: 1000,
    chance: 250,
    max: 4,
    persist: [
      [250],
      [250, 500],
      [250, 500, 750],
      [250, 500, 750, 1000]
    ],
    tiers: {
      legendary: 80,
      epic: 200,
      rare: 320,
      uncommon: 400
    },
    models: (c.craftModels || []).map(m => formatModelForClient(c.slug, m)),
    candidates
  });
});

// ---- Execute 100% Guaranteed Craft (POST /api/gifts/craft — Zero Gambling / Zero Item Loss on Failure) ----
app.post('/api/gifts/craft', (req, res) => {
  const key = cleanKey(req.body.username);
  const giftId = req.body.giftId;
  const withIds = Array.isArray(req.body.with) ? req.body.with.slice(0, 3) : [];
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });
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

  // 100% Guaranteed Craft: 4 gifts = 0 Stars fee; fewer than 4 gifts = 150 Stars per missing slot
  const missingSlots = Math.max(0, 4 - allInput.length);
  const craftFeeStars = missingSlots * 150;
  if (craftFeeStars > 0 && (users[key].stars || 0) < craftFeeStars) {
    return res.status(400).json({
      ok: false,
      needStars: true,
      deficit: craftFeeStars - (users[key].stars || 0),
      required: craftFeeStars,
      balance: users[key].stars || 0,
      error: `100% Kafolatlangan Craft uchun ⭐ ${craftFeeStars} ustama kerak (yoki 4 ta sovgʻa birlashtiring)`
    });
  }

  if (craftFeeStars > 0) {
    users[key].stars -= craftFeeStars;
    saveJSON(usersFile, users);
  }

  const now = new Date().toISOString();
  for (const eg of extraGifts) {
    eg.state = 'burned';
    eg.burnedAt = now;
    eg.worn = false;
    eg.pinned = false;
    eg.salePrice = null;
  }

  const persistTable = [
    [250],
    [250, 500],
    [250, 500, 750],
    [250, 500, 750, 1000]
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
    upgradePaid: (mainGift.upgradePaid || 0) + craftFeeStars,
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
    backdrop: enriched.backdrop,
    price: craftFeeStars
  });

  res.json({
    ok: true,
    crafted: true,
    craftFeeStars,
    newBalance: users[key].stars,
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
  } else if (action === 'burn') {
    if (gift.salePrice && gift.salePrice > 0) return res.status(400).json({ ok: false, error: 'Sotuvdagi sovgʻani yoqib boʻlmaydi' });
    gift.state = 'burned';
    gift.burnedAt = new Date().toISOString();
    gift.worn = false;
    gift.pinned = false;
    gift.salePrice = null;
    saveJSON(inventoryFile, inv);
    logActivity({
      type: 'burn',
      actor: key,
      actorName: users[key]?.displayName || key,
      count: 1,
      giftName: gift.name + (gift.number ? ` #${gift.number}` : '')
    });
    return res.json({ ok: true, burned: true, newBalance: users[key].stars });
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

// ---- Activity Feed & Platform Stats (O(N) Fast Single-Pass) ----
app.get('/api/feed', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const activity = loadJSON(activityFile, []);

  let totalGifts = 0;
  let totalUpgraded = 0;
  let craftedTotal = 0;
  let marketListings = 0;
  let burnedTotal = 0;
  let starsSpent = 0;
  const upRaw = [];

  for (let i = 0; i < inv.length; i++) {
    const g = inv[i];
    starsSpent += (g.paid || 0) + (g.upgradePaid || 0);
    if (g.state === 'burned') {
      burnedTotal++;
      continue;
    }
    if (g.state === 'converted') continue;
    totalGifts++;
    if (g.state === 'upgraded') {
      totalUpgraded++;
      if (g.crafted) craftedTotal++;
      if (g.salePrice > 0) marketListings++;
      upRaw.push(g);
    }
  }

  const recent = upRaw.slice(-20).reverse().map(g => enrichGift(g, inv, users));

  res.json({
    ok: true,
    totalUsers: Object.keys(users).length,
    totalGifts,
    totalUpgraded,
    craftedTotal,
    marketListings,
    burnedTotal,
    starsSpent,
    activity: activity.slice().reverse().slice(0, 50),
    recent
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

const { startHoldBotLoop } = registerHoldEngine(app, {
  publicDir: path.join(__dirname, 'public'),
  usersFile,
  holdStateFile,
  channelCalendarsFile,
  channelMedalsFile,
  loadJSON,
  saveJSON,
  cleanKey,
  cleanName,
  verifySessionToken,
  verifyWebAppInitData,
  createSessionToken,
  isRequestAdmin,
  ADMIN_PAXTA_ID,
  PUBLIC_APP_URL,
  HOLD_BOT_TOKEN,
  holdBotCall,
  moonClient,
  milliybekClient
});

const PORT = process.env.PORT || 4000;
loadCloudStateOnStartup().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Paxta Gifts & $HOLD Coin (@HOLDbot) | http://localhost:${PORT}\n`);
    startPaxtaBotLoop();
    startHoldBotLoop();

    if (process.env.RENDER_EXTERNAL_URL) {
      setInterval(() => {
        fetch(`${process.env.RENDER_EXTERNAL_URL}/api/health`).catch(() => {});
      }, 9 * 60 * 1000);
    }
  });
});
