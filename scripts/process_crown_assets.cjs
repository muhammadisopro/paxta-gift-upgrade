const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = path.resolve(__dirname, '..');
const CROWN_DIR = path.join(ROOT_DIR, 'crown');
const CRAFT_DIR = path.join(ROOT_DIR, 'Craft model');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'a', 'imperialcrown');
const CACHE_DIR = path.join(ROOT_DIR, 'data', 'cache');

const BASE_TGS_PATH = 'c:\\Users\\Muham\\Downloads\\Telegram Desktop\\BlackGoldEm_by_StickerEmojiRobot-tgs\\007.tgs';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });

function evalAnimProp(prop) {
  if (!prop) return null;
  if (!prop.a) return prop.k;
  const arr = prop.k;
  if (!Array.isArray(arr) || !arr.length) return null;
  return arr[0].s !== undefined ? arr[0].s : arr[0];
}

function bezierToSvgD(bez) {
  if (!bez || !bez.v || !bez.v.length) return '';
  const { v, i, o, c } = bez;
  const n = v.length;
  let d = `M ${v[0][0].toFixed(2)} ${v[0][1].toFixed(2)}`;
  const segCount = c ? n : n - 1;
  for (let k = 0; k < segCount; k++) {
    const next = (k + 1) % n;
    const ox = o[k]?.[0] || 0;
    const oy = o[k]?.[1] || 0;
    const ix = i[next]?.[0] || 0;
    const iy = i[next]?.[1] || 0;
    if (ox === 0 && oy === 0 && ix === 0 && iy === 0) {
      d += ` L ${v[next][0].toFixed(2)} ${v[next][1].toFixed(2)}`;
    } else {
      const cp1x = (v[k][0] + ox).toFixed(2);
      const cp1y = (v[k][1] + oy).toFixed(2);
      const cp2x = (v[next][0] + ix).toFixed(2);
      const cp2y = (v[next][1] + iy).toFixed(2);
      const ex = v[next][0].toFixed(2);
      const ey = v[next][1].toFixed(2);
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
    }
  }
  if (c) d += ' Z';
  return d;
}

function rgb01ToHex(arr) {
  if (!Array.isArray(arr)) return '#ffffff';
  const r = Math.max(0, Math.min(255, Math.round((arr[0] || 0) * 255)));
  const g = Math.max(0, Math.min(255, Math.round((arr[1] || 0) * 255)));
  const b = Math.max(0, Math.min(255, Math.round((arr[2] || 0) * 255)));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function lottieToSvg(lottieData) {
  const defs = [];
  const bodyEls = [];
  let gradIdCounter = 1;

  // Find NULL CONTROL layer (parent 19)
  const nullLayer = (lottieData.layers || []).find(l => l.ty === 3 || (l.nm && l.nm.includes('NULL')));
  const nullScale = (evalAnimProp(nullLayer?.ks?.s)?.[0] ?? 100) / 100;
  const nullP = evalAnimProp(nullLayer?.ks?.p) || [252.95, 269.2, 0];
  const nullA = evalAnimProp(nullLayer?.ks?.a) || [60, 60, 0];
  let nullR = evalAnimProp(nullLayer?.ks?.r) || 0;
  if (Array.isArray(nullR)) nullR = nullR[0];

  const layersBottomUp = [...(lottieData.layers || [])].reverse();

  for (const layer of layersBottomUp) {
    if (layer.ty !== 4) continue;
    if ((layer.ip || 0) > 0) continue;
    if (layer.nm && layer.nm.toLowerCase().includes('блеск')) continue; // Skip sparkle layer in static SVG

    let layerOpVal = evalAnimProp(layer.ks?.o);
    if (Array.isArray(layerOpVal)) layerOpVal = layerOpVal[0];
    const layerOp = (layerOpVal ?? 100) / 100;
    if (layerOp <= 0.01) continue;

    const p = evalAnimProp(layer.ks?.p) || [0, 0, 0];
    const a = evalAnimProp(layer.ks?.a) || [0, 0, 0];
    const s = evalAnimProp(layer.ks?.s) || [100, 100, 100];

    const tx = p[0] || 0;
    const ty = p[1] || 0;
    const ax = -(a[0] || 0);
    const ay = -(a[1] || 0);
    const sx = (s[0] ?? 100) / 100;
    const sy = (s[1] ?? 100) / 100;

    const groupMarkup = [];
    const groupsBottomUp = [...(layer.shapes || [])].reverse();

    for (const grpEl of groupsBottomUp) {
      if (grpEl.ty !== 'gr') continue;
      const items = grpEl.it || [];
      const tr = items.find(x => x.ty === 'tr');
      let grpOpVal = evalAnimProp(tr?.o);
      if (Array.isArray(grpOpVal)) grpOpVal = grpOpVal[0];
      const grpOp = (grpOpVal ?? 100) / 100;
      if (grpOp <= 0.01) continue;

      const gp = evalAnimProp(tr?.p) || [0, 0];
      const ga = evalAnimProp(tr?.a) || [0, 0];
      const gs = evalAnimProp(tr?.s) || [100, 100];
      const gr = evalAnimProp(tr?.r) || 0;

      const paths = [];
      let fillAttr = 'none';
      let fillOp = 1;
      let strokeAttr = 'none';
      let strokeWidth = 0;

      for (const it of items) {
        if (it.ty === 'sh') {
          let bez = evalAnimProp(it.ks);
          if (Array.isArray(bez)) bez = bez[0];
          const d = bezierToSvgD(bez);
          if (d) paths.push(d);
        } else if (it.ty === 'fl') {
          fillAttr = rgb01ToHex(evalAnimProp(it.c));
          const op = evalAnimProp(it.o);
          if (typeof op === 'number') fillOp = op / 100;
        } else if (it.ty === 'gf') {
          const gid = `lg_${gradIdCounter++}`;
          const stPt = evalAnimProp(it.s) || [0, -50];
          const enPt = evalAnimProp(it.e) || [0, 50];
          const pCount = it.g?.p || 3;
          const kArr = evalAnimProp(it.g?.k) || [];
          const stops = [];
          for (let si = 0; si < pCount; si++) {
            const off = Math.round((kArr[si * 4] || 0) * 100);
            const col = rgb01ToHex([kArr[si * 4 + 1], kArr[si * 4 + 2], kArr[si * 4 + 3]]);
            let alpha = 1;
            const alphaBase = pCount * 4;
            if (kArr.length >= alphaBase + pCount * 2) {
              alpha = kArr[alphaBase + si * 2 + 1] ?? 1;
            }
            stops.push(`<stop offset="${off}%" stop-color="${col}" stop-opacity="${alpha}"/>`);
          }
          defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${stPt[0]}" y1="${stPt[1]}" x2="${enPt[0]}" y2="${enPt[1]}">${stops.join('')}</linearGradient>`);
          fillAttr = `url(#${gid})`;
          const op = evalAnimProp(it.o);
          if (typeof op === 'number') fillOp = op / 100;
        } else if (it.ty === 'st') {
          strokeAttr = rgb01ToHex(evalAnimProp(it.c));
          strokeWidth = evalAnimProp(it.w) || 2;
        }
      }

      if (paths.length) {
        const totalOp = +(layerOp * grpOp * fillOp).toFixed(3);
        const strokeOp = +(layerOp * grpOp).toFixed(3);
        const gTransform = `translate(${gp[0] || 0}, ${gp[1] || 0}) rotate(${gr || 0}) scale(${(gs[0] ?? 100) / 100}, ${(gs[1] ?? 100) / 100}) translate(${-(ga[0] || 0)}, ${-(ga[1] || 0)})`;
        const pathEls = paths.map(d => `<path d="${d}" fill="${fillAttr}" fill-opacity="${totalOp}" stroke="${strokeAttr}" stroke-opacity="${strokeOp}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
        groupMarkup.push(`<g transform="${gTransform}">${pathEls}</g>`);
      }
    }

    if (groupMarkup.length) {
      const lTransform = `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) translate(${ax.toFixed(2)}, ${ay.toFixed(2)})`;
      bodyEls.push(`<g transform="${lTransform}">${groupMarkup.join('')}</g>`);
    }
  }

  // Exact NULL CONTROL parent transform alignment
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${defs.join('')}</defs>
  <g transform="translate(${nullP[0].toFixed(2)}, ${nullP[1].toFixed(2)}) rotate(${Number(nullR).toFixed(2)}) scale(${nullScale.toFixed(3)}, ${nullScale.toFixed(3)}) translate(${(-nullA[0]).toFixed(2)}, ${(-nullA[1]).toFixed(2)})">
    ${bodyEls.join('\n    ')}
  </g>
</svg>`;
}

// Convert filename (e.g. "01_Cardboard_King.tgs") to display name and ID
function parseFilename(file) {
  const base = path.basename(file, '.tgs');
  const clean = base.replace(/^\d+_/, '');
  const id = clean.toLowerCase();
  const name = clean.replace(/_/g, ' ');
  return { id, name };
}

// Process 30 Crown standard models
const crownFiles = fs.readdirSync(CROWN_DIR).filter(f => f.endsWith('.tgs')).sort();
console.log(`Processing ${crownFiles.length} crown models from ${CROWN_DIR}...`);

const standardModels = [];
crownFiles.forEach((f, idx) => {
  const { id, name } = parseFilename(f);
  const rawTgs = fs.readFileSync(path.join(CROWN_DIR, f));
  const lottieJson = JSON.parse(zlib.gunzipSync(rawTgs).toString('utf8'));
  const svgStr = lottieToSvg(lottieJson);

  const fileKey = `crown_std_${String(idx + 1).padStart(2, '0')}_${id}`;
  const tgsPath = path.join(OUT_DIR, `${fileKey}.tgs`);
  const jsonPath = path.join(OUT_DIR, `${fileKey}.json`);
  const svgPath = path.join(OUT_DIR, `${fileKey}.svg`);

  // Write out assets
  fs.writeFileSync(tgsPath, rawTgs);
  fs.writeFileSync(jsonPath, JSON.stringify(lottieJson));
  fs.writeFileSync(svgPath, svgStr);

  // Cache them
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.tgs`), rawTgs);
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.json`), JSON.stringify(lottieJson));
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.svg`), svgStr);

  let count = 5;
  let permille = 50;
  if (idx >= 10 && idx < 20) {
    count = 3;
    permille = 30;
  } else if (idx >= 20) {
    count = 2;
    permille = 20;
  }

  standardModels.push({
    id,
    name,
    count,
    permille,
    rarity: permille,
    pct: +(permille / 10).toFixed(1),
    crafted: false,
    tier: null,
    img: `/a/imperialcrown/${fileKey}.svg`,
    tgs: `/a/imperialcrown/${fileKey}.json`
  });
});

console.log(`Standard models processed: ${standardModels.length}`);

// Process 12 Craft models
const craftFiles = fs.readdirSync(CRAFT_DIR).filter(f => f.endsWith('.tgs')).sort();
console.log(`Processing ${craftFiles.length} craft models from ${CRAFT_DIR}...`);

const craftModels = [];
craftFiles.forEach((f, idx) => {
  const { id, name } = parseFilename(f);
  const rawTgs = fs.readFileSync(path.join(CRAFT_DIR, f));
  const lottieJson = JSON.parse(zlib.gunzipSync(rawTgs).toString('utf8'));
  const svgStr = lottieToSvg(lottieJson);

  const fileKey = `crown_craft_${String(idx + 1).padStart(2, '0')}_${id}`;
  const tgsPath = path.join(OUT_DIR, `${fileKey}.tgs`);
  const jsonPath = path.join(OUT_DIR, `${fileKey}.json`);
  const svgPath = path.join(OUT_DIR, `${fileKey}.svg`);

  // Write out assets
  fs.writeFileSync(tgsPath, rawTgs);
  fs.writeFileSync(jsonPath, JSON.stringify(lottieJson));
  fs.writeFileSync(svgPath, svgStr);

  // Cache them
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.tgs`), rawTgs);
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.json`), JSON.stringify(lottieJson));
  fs.writeFileSync(path.join(CACHE_DIR, `imperialcrown__${fileKey}.svg`), svgStr);

  const permille = idx < 4 ? 84 : 83;

  craftModels.push({
    id,
    name,
    count: 0,
    permille,
    rarity: permille,
    pct: +(permille / 10).toFixed(1),
    crafted: true,
    tier: 'legendary',
    img: `/a/imperialcrown/${fileKey}.svg`,
    tgs: `/a/imperialcrown/${fileKey}.json`
  });
});

console.log(`Craft models processed: ${craftModels.length}`);

// Base Imperial Crown setup (from authentic 007.tgs if available)
let baseTgs;
if (fs.existsSync(BASE_TGS_PATH)) {
  baseTgs = fs.readFileSync(BASE_TGS_PATH);
} else {
  baseTgs = fs.readFileSync(path.join(CROWN_DIR, crownFiles[0]));
}
const baseJson = JSON.parse(zlib.gunzipSync(baseTgs).toString('utf8'));
const baseSvg = lottieToSvg(baseJson);

fs.writeFileSync(path.join(OUT_DIR, 'base.tgs'), baseTgs);
fs.writeFileSync(path.join(OUT_DIR, 'base.json'), JSON.stringify(baseJson));
fs.writeFileSync(path.join(OUT_DIR, 'thumb.svg'), baseSvg);
fs.writeFileSync(path.join(CACHE_DIR, 'imperialcrown__base.tgs'), baseTgs);
fs.writeFileSync(path.join(CACHE_DIR, 'imperialcrown__base.json'), JSON.stringify(baseJson));
fs.writeFileSync(path.join(CACHE_DIR, 'imperialcrown__thumb.svg'), baseSvg);

// Update data/collections/imperialcrown.json
const colPath = path.join(ROOT_DIR, 'data', 'collections', 'imperialcrown.json');
const crownCol = JSON.parse(fs.readFileSync(colPath, 'utf8'));

crownCol.supply = 100;
crownCol.minted = 0;
crownCol.circulating = 100;
crownCol.base = 3000;
crownCol.price = 3000;
crownCol.upgrade = 0;
crownCol.upgradePrice = 0;
crownCol.enabled = true;
crownCol.models = standardModels;
crownCol.craftModels = craftModels;

fs.writeFileSync(colPath, JSON.stringify(crownCol, null, 2));
console.log('Updated data/collections/imperialcrown.json successfully!');

// Update data/index.json
const idxPath = path.join(ROOT_DIR, 'data', 'index.json');
const index = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
const crownIdx = index.find(x => x.slug === 'imperialcrown');
if (crownIdx) {
  crownIdx.supply = 100;
  crownIdx.circulating = 100;
  crownIdx.price = 3000;
  crownIdx.base = 3000;
  crownIdx.upgrade = 0;
  crownIdx.upgradePrice = 0;
  crownIdx.modelsCount = standardModels.length;
  crownIdx.craftModelsCount = craftModels.length;
  fs.writeFileSync(idxPath, JSON.stringify(index, null, 2));
  console.log('Updated data/index.json successfully!');
}

console.log('All Crown and Craft assets successfully re-rendered and centered!');
