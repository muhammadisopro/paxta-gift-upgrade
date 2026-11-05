// Scrapes REAL Telegram collectible gift data (via Fragment): every collection with its
// real models, backdrops (colors), symbols and their real distribution counts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const colDir = path.join(dataDir, 'collections');
fs.mkdirSync(colDir, { recursive: true });

const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' } };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, UA);
      if (res.ok) return await res.text();
    } catch {}
    await sleep(400 * (i + 1));
  }
  return null;
}

const num = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"');

function parseBox(html, field) {
  const start = html.indexOf(`tm-main-filter-attr-${field} `);
  if (start < 0) return [];
  const next = ['model', 'backdrop', 'symbol']
    .filter(f => f !== field)
    .map(f => html.indexOf(`tm-main-filter-attr-${f} `, start + 10))
    .filter(i => i > start);
  const end = next.length ? Math.min(...next) : html.length;
  const chunk = html.slice(start, end);
  const items = [];
  const re = /data-value="([^"]*)"[\s\S]*?<img src="([^"]+)"[\s\S]*?tm-main-filters-count">([^<]+)</g;
  let m;
  while ((m = re.exec(chunk))) {
    items.push({ name: decode(m[1]), file: m[2], count: num(m[3]) });
  }
  return items;
}

// ---- backdrop colors (global by name) ----
const backdropColors = fs.existsSync(path.join(dataDir, 'backdrops.json'))
  ? JSON.parse(fs.readFileSync(path.join(dataDir, 'backdrops.json'), 'utf8')) : {};

async function resolveBackdrop(item) {
  if (backdropColors[item.name]) return backdropColors[item.name];
  const svg = await get('https://fragment.com' + item.file);
  if (!svg) return null;
  const stops = [...svg.matchAll(/stop-color="(#[0-9a-fA-F]{3,8})"/g)].map(m => m[1]);
  if (stops.length < 2) return null;
  backdropColors[item.name] = { center: stops[0], edge: stops[stops.length - 1] };
  return backdropColors[item.name];
}

function toRarity(items) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return items.map(i => ({ ...i, permille: Math.max(1, Math.round((i.count / total) * 1000)), pct: Math.max(0.1, +(i.count / total * 100).toFixed(1)) }));
}

// Some attribute names come as raw keys ("happybrownie"); map them to the real gift name when possible.
let nameBySlug = {};
const prettify = (n) => (/^[a-z0-9]+$/.test(n) && nameBySlug[n]) ? nameBySlug[n] : n;

async function scrapeCollection(slug, pluralName, minted) {
  const [page, item1] = await Promise.all([
    get(`https://fragment.com/gifts/${slug}`),
    get(`https://fragment.com/gift/${slug}-1`)
  ]);
  if (!page) return null;

  let supply = 0;
  let singular = /(ch|sh|x|ss)es$/i.test(pluralName) ? pluralName.replace(/es$/i, '') : pluralName.replace(/s$/i, '');
  if (item1) {
    const t = item1.match(/<title>([^<]*?) #\d+/);
    if (t) singular = decode(t[1]).trim();
    const rows = [...item1.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const issued = rows.find(r => r.startsWith('Issued'));
    const mm = issued && issued.match(/of ([\d,]+)/);
    if (mm) supply = num(mm[1]);
  }

  const models = toRarity(parseBox(page, 'model')).map(m => ({
    name: m.name, count: m.count, permille: m.permille, pct: m.pct,
    img: m.file, tgs: m.file.replace(/\.webp$/, '.tgs')
  }));
  const backdropsRaw = toRarity(parseBox(page, 'backdrop'));
  const symbols = toRarity(parseBox(page, 'symbol')).map(s => ({
    name: prettify(s.name), count: s.count, permille: s.permille, pct: s.pct, img: s.file
  }));

  const backdrops = [];
  for (const b of backdropsRaw) {
    const c = await resolveBackdrop(b);
    if (c) backdrops.push({ name: b.name, count: b.count, permille: b.permille, pct: b.pct, center: c.center, edge: c.edge });
  }

  if (!models.length || !backdrops.length || !symbols.length) return null;

  return {
    slug, name: singular, plural: pluralName,
    supply: supply || minted, minted,
    thumb: `/file/gifts/${slug}/thumb.webp`,
    models, backdrops, symbols
  };
}

async function main() {
  console.log('📡 Fragment kolleksiyalar ro\'yxati olinmoqda...');
  const list = await get('https://fragment.com/gifts');
  const re = /<a href="\/gifts\/([a-z0-9]+)"[^>]*data-keywords="([^"]*)"[\s\S]*?tm-main-filters-count">([^<]+)</g;
  const cols = [];
  let m;
  while ((m = re.exec(list))) cols.push({ slug: m[1], plural: decode(m[2]), minted: num(m[3]) });
  console.log(`🎁 ${cols.length} ta kolleksiya topildi.\n`);
  // singular display names for raw-key lookups (e.g. "plushpepe" -> "Plush Pepe")
  nameBySlug = Object.fromEntries(cols.map(c => [c.slug, /(ch|sh|x|ss)es$/i.test(c.plural) ? c.plural.replace(/es$/i, '') : c.plural.replace(/s$/i, '')]));

  const index = [];
  let done = 0;
  const queue = [...cols];
  async function worker() {
    while (queue.length) {
      const c = queue.shift();
      const data = await scrapeCollection(c.slug, c.plural, c.minted);
      done++;
      if (!data) { console.log(`[${done}/${cols.length}] ⚠️  ${c.slug} — o'tkazib yuborildi`); continue; }
      fs.writeFileSync(path.join(colDir, `${c.slug}.json`), JSON.stringify(data), 'utf8');
      index.push({
        slug: data.slug, name: data.name, supply: data.supply, thumb: data.thumb,
        models: data.models.length, backdrops: data.backdrops.length, symbols: data.symbols.length
      });
      console.log(`[${done}/${cols.length}] ✅ ${data.name.padEnd(22)} supply ${String(data.supply).padStart(6)} | ${data.models.length} model, ${data.backdrops.length} fon, ${data.symbols.length} simvol`);
      await sleep(80);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);

  index.sort((a, b) => a.supply - b.supply);
  fs.writeFileSync(path.join(dataDir, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'backdrops.json'), JSON.stringify(backdropColors, null, 2), 'utf8');
  console.log(`\n🎉 Tayyor: ${index.length} kolleksiya, ${Object.keys(backdropColors).length} noyob fon.`);
}

main().catch(console.error);
