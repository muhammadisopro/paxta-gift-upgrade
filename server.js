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

// PaxtaGram @UpgradeBot (Forge, ID: 682) configuration
const PAXTA_BOT_TOKEN = process.env.PAXTA_BOT_TOKEN || '682:OSWsBqK5LZHWlGJmzeONb9iIjE-UV7QBQY_';
const PAXTA_API_BASE = process.env.PAXTA_API_BASE || 'https://paxta.online';
const PUBLIC_APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_APP_URL || 'https://paxta-gift-upgrade.onrender.com';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '{}');
if (!fs.existsSync(inventoryFile)) fs.writeFileSync(inventoryFile, '[]');
if (!fs.existsSync(paymentsFile)) fs.writeFileSync(paymentsFile, '{"invoices":{},"charges":{},"lastUpdateId":80852}');

const loadJSON = (f, fb) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; }
};
const saveJSON = (f, d) => {
  const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
  fs.renameSync(tmp, f);
};

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
const cleanKey = (u) => cleanName(u).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'muhammadiso';

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

function verifyWebAppInitData(initDataRaw) {
  try {
    if (!initDataRaw) return null;
    const params = new URLSearchParams(initDataRaw);
    const userStr = params.get('user');
    if (!userStr) return null;
    const userObj = JSON.parse(userStr);
    return userObj;
  } catch {
    return null;
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
    ownerDisplayName: g.ownerName || ownerObj.displayName || g.owner || 'Muhammadiso',
    thumb: normalizeUrl(g.slug, g.thumb || c.thumb),
    baseTgs: normalizeTgsToJson(g.slug, g.baseTgs || c.baseTgs || g.thumb || c.thumb),
    supply: stats.supply,
    circulating: stats.circulating,
    burnedCount: stats.burnedCount,
    valueStars: g.paid || stats.price,
    upgradePrice: stats.upgradePrice,
    canCraft: g.state === 'upgraded' && ((c.craftModels && c.craftModels.length > 0) || true),
    model: g.model ? formatModelForClient(g.slug, g.model) : null,
    backdrop: g.backdrop ? formatBackdropForClient(g.backdrop) : null,
    symbol: g.symbol ? formatSymbolForClient(g.slug, g.symbol) : null
  };
}

// ---- Shop Catalog (only enabled collections for regular shop view) ----
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

// ---- Admin Panel Endpoints ----
app.get('/api/admin/collections', (req, res) => {
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
    burnedGifts: inv.filter(i => i.state === 'burned').length
  });
});

app.post('/api/admin/collection', (req, res) => {
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

// ---- Users & PaxtaGram Sync (Initial balance is strictly 0 Stars!) ----
app.post('/api/user/login', (req, res) => {
  const webAppUser = verifyWebAppInitData(req.body.initData);
  const rawName = cleanName(
    webAppUser?.username ||
    webAppUser?.first_name ||
    req.body.username ||
    'Muhammadiso'
  );
  const displayName = cleanName(
    req.body.displayName ||
    webAppUser?.first_name ||
    rawName ||
    'Muhammadiso'
  );
  const key = cleanKey(rawName);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!users[key]) {
    users[key] = {
      username: key,
      displayName: displayName || rawName || 'Muhammadiso',
      paxtaId: webAppUser?.id || req.body.paxtaId || null,
      stars: 0,
      createdAt: new Date().toISOString()
    };
    saveJSON(usersFile, users);
  } else {
    let changed = false;
    if (displayName && users[key].displayName !== displayName) {
      users[key].displayName = displayName;
      changed = true;
    }
    if (webAppUser?.id && users[key].paxtaId !== webAppUser.id) {
      users[key].paxtaId = webAppUser.id;
      changed = true;
    }
    if (changed) saveJSON(usersFile, users);
  }

  const myGifts = inv
    .filter(i => i.owner === key && i.state !== 'burned' && i.state !== 'converted')
    .map(g => enrichGift(g, inv, users));

  res.json({ ok: true, user: users[key], inventory: myGifts });
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

  const invoiceLink = botRes.result; // e.g. https://paxta.online/invoice/<slug>
  const slugMatch = invoiceLink.match(/\/invoice\/([A-Za-z0-9_-]+)/);
  const slug = slugMatch ? slugMatch[1] : '';

  const payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80852 });
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

// ---- Buy a regular (un-upgraded) gift from Shop ----
app.post('/api/gifts/buy', (req, res) => {
  const key = cleanKey(req.body.username);
  const c = loadCollection(req.body.slug);
  const users = loadJSON(usersFile, {});
  const inv = loadJSON(inventoryFile, []);

  if (!c) return res.status(404).json({ ok: false, error: 'Kolleksiya topilmadi' });
  if (!users[key]) return res.status(401).json({ ok: false, error: 'Avval tizimga kiring' });

  const stats = computeCollectionStats(c.slug, inv);
  if (!stats.enabled) {
    return res.status(400).json({ ok: false, error: 'Bu sovgʻa hozircha sotuvda emas (Admin panel orqali yoqing)' });
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
  res.json({ ok: true, gift: enrichGift(gift, inv, users), newBalance: users[key].stars });
});

// ---- Preview Upgrade Data (GET /api/gifts/:id/upgrade) ----
app.get('/api/gifts/:id/upgrade', (req, res) => {
  const key = cleanKey(req.query.username || 'muhammadiso');
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
  res.json({ ok: true, gift: enrichGift(gift, inv, users), newBalance: users[key].stars });
});

// ---- Preview Craft Data (GET /api/gifts/:id/craft) ----
app.get('/api/gifts/:id/craft', (req, res) => {
  const key = cleanKey(req.query.username || 'muhammadiso');
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

  const mainGift = inv.find(i => i.id === giftId && i.owner === key && i.state === 'upgraded');
  if (!mainGift) return res.status(404).json({ ok: false, error: 'Asosiy sovg\'a topilmadi' });

  const extraGifts = [];
  for (const wid of withIds) {
    const eg = inv.find(i => i.id === wid && i.owner === key && i.slug === mainGift.slug && i.state === 'upgraded' && i.id !== mainGift.id);
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
  res.json({
    ok: true,
    crafted: true,
    gift: enrichGift(mainGift, inv, users)
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
  } else if (action === 'pin') {
    gift.pinned = !gift.pinned;
  } else if (action === 'sell') {
    const price = parseInt(req.body.price, 10);
    gift.salePrice = (price && price > 0) ? price : null;
  } else if (action === 'transfer') {
    const targetRaw = cleanName(req.body.toUsername);
    const targetKey = cleanKey(targetRaw);
    if (!targetRaw) return res.status(400).json({ ok: false, error: 'Qabul qiluvchi username kiritilmadi' });
    if (!users[targetKey]) {
      users[targetKey] = { username: targetKey, displayName: targetRaw, stars: 0, createdAt: new Date().toISOString() };
    }
    gift.owner = targetKey;
    gift.ownerName = users[targetKey].displayName;
    gift.worn = false;
    gift.salePrice = null;
    saveJSON(usersFile, users);
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

// ---- Feed ----
app.get('/api/feed', (req, res) => {
  const inv = loadJSON(inventoryFile, []);
  const users = loadJSON(usersFile, {});
  const up = inv.filter(i => i.state === 'upgraded').map(g => enrichGift(g, inv, users));
  res.json({
    ok: true,
    total: up.length,
    craftedTotal: up.filter(g => g.crafted).length,
    starsSpent: inv.reduce((s, i) => s + (i.paid || 0) + (i.upgradePaid || 0), 0),
    recent: up.slice(-20).reverse()
  });
});

// ---- Background Poller for @UpgradeBot (PaxtaGram Stars PreCheckout + Payment + /start) ----
function creditStarsPayment({ payload, amount, chargeId, fromUser }) {
  const payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80852 });
  if (chargeId && payments.charges[chargeId]) {
    return false; // Already processed idempotently
  }

  let targetKey = cleanKey(fromUser?.username || fromUser?.first_name || 'muhammadiso');
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
  let payments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: 80852 });
  let offset = (payments.lastUpdateId || 80852) + 1;

  // Set bot menu button on startup
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

          // 1. Immediately approve PreCheckoutQuery so PaxtaGram completes Star payment in <1s
          if (item.pre_checkout_query) {
            const pcq = item.pre_checkout_query;
            await paxtaBotCall('answerPreCheckoutQuery', {
              pre_checkout_query_id: pcq.id,
              ok: true
            });
          }

          // 2. Credit user balance on successful_payment
          if (item.message?.successful_payment) {
            const sp = item.message.successful_payment;
            const res = creditStarsPayment({
              payload: sp.invoice_payload,
              amount: sp.total_amount,
              chargeId: sp.telegram_payment_charge_id,
              fromUser: item.message.from
            });
            if (res && item.message.chat?.id) {
              await paxtaBotCall('sendMessage', {
                chat_id: item.message.chat.id,
                text: `✅ *Toʻlov muvaffaqiyatli qabul qilindi!*\n\nHisobingizga *+⭐ ${res.amount}* qoʻshildi.\nJoriy balans: *⭐ ${res.newBalance}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🎁 Doʻkon va Upgrade\'ga qaytish', web_app: { url: PUBLIC_APP_URL } }]
                  ]
                }
              });
            }
          }

          // 3. Respond to /start or /gifts in @UpgradeBot
          const txt = (item.message?.text || '').trim();
          if (txt.startsWith('/start') || txt.startsWith('/gifts') || txt.startsWith('/shop')) {
            const chatId = item.message.chat.id;
            await paxtaBotCall('sendMessage', {
              chat_id: chatId,
              text: `🎁 *PaxtaGram Gifts — Upgrade & Craft*\n\nRasmiy kolleksion sovgʻalar doʻkoni, Upgrade va Craft tizimiga xush kelibsiz!\n\n• 🪙 *Coin Flip* (500 ta cheklangan tiraj) va boshqa eksklyuziv sovgʻalar\n• ✨ *Upgrade* — noyob Model, Fon va Naqsh olish\n• 🔨 *Craft* — 1 tadan 4 tagacha sovgʻani birlashtirib maxfiy modellarni ochish\n• ⭐ Toʻlovlar bevosita *PaxtaGram Stars* orqali ishlaydi!`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🎁 Sovgʻalar Doʻkoni va Upgrade', web_app: { url: PUBLIC_APP_URL } }]
                ]
              }
            });
          }
        }

        const latestPayments = loadJSON(paymentsFile, { invoices: {}, charges: {}, lastUpdateId: offset - 1 });
        latestPayments.lastUpdateId = offset - 1;
        saveJSON(paymentsFile, latestPayments);
      }
    } catch (err) {
      // ignore transient network errors
    }
    await new Promise(r => setTimeout(r, 800));
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 Paxta Gifts — Coin Flip & 124 Collectible Gifts  |  http://localhost:${PORT}\n`);
  startPaxtaBotLoop();

  // Keep Render awake 24/7
  if (process.env.RENDER_EXTERNAL_URL) {
    setInterval(() => {
      fetch(`${process.env.RENDER_EXTERNAL_URL}/api/health`).catch(() => {});
    }, 9 * 60 * 1000);
  }
});
