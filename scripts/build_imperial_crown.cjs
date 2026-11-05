const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SRC_TGS = 'c:\\Users\\Muham\\Downloads\\Telegram Desktop\\BlackGoldEm_by_StickerEmojiRobot-tgs\\007.tgs';
const OUT_ASSET_DIR = path.join(__dirname, '..', 'public', 'a', 'imperialcrown');
const OUT_JSON_PATH = path.join(__dirname, '..', 'data', 'collections', 'imperialcrown.json');
const COINFLIP_JSON_PATH = path.join(__dirname, '..', 'data', 'collections', 'coinflip.json');

fs.mkdirSync(OUT_ASSET_DIR, { recursive: true });

const rawTgs = fs.readFileSync(SRC_TGS);
const baseLottie = JSON.parse(zlib.gunzipSync(rawTgs).toString('utf8'));

// ============================================================================
// COLOR & GEOMETRY HELPERS FOR RICH LOTTIE VECTOR ART
// ============================================================================
function hexToRgb01(hex) {
  const clean = String(hex || '#ffffff').replace(/^#/, '');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function mixHex(h1, h2, t) {
  const a = hexToRgb01(h1);
  const b = hexToRgb01(h2);
  const r = Math.round((a[0] + (b[0] - a[0]) * t) * 255);
  const g = Math.round((a[1] + (b[1] - a[1]) * t) * 255);
  const bl = Math.round((a[2] + (b[2] - a[2]) * t) * 255);
  return '#' + [r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('');
}

function buildFacetColors(lightHex, midHex, darkHex) {
  return [
    mixHex(lightHex, midHex, 0.25),
    mixHex(midHex, darkHex, 0.2),
    mixHex(lightHex, '#ffffff', 0.15),
    darkHex,
    midHex,
    mixHex(midHex, darkHex, 0.35),
    mixHex(lightHex, '#ffffff', 0.45),
    lightHex,
    mixHex(midHex, darkHex, 0.55),
    lightHex,
    mixHex(lightHex, midHex, 0.5),
    mixHex(lightHex, '#ffffff', 0.25)
  ];
}

// Create a sharp or smooth Bezier path in Lottie format
// Each point can be [x, y] or [x, y, ix, iy, ox, oy]
function shPath(pts, closed = true) {
  const v = [];
  const i = [];
  const o = [];
  for (const p of pts) {
    v.push([+p[0].toFixed(2), +p[1].toFixed(2)]);
    i.push([+(p[2] || 0).toFixed(2), +(p[3] || 0).toFixed(2)]);
    o.push([+(p[4] || 0).toFixed(2), +(p[5] || 0).toFixed(2)]);
  }
  return {
    ty: 'sh',
    nm: 'Path',
    ks: { a: 0, k: { i, o, v, c: closed } }
  };
}

// Automatically compute smooth Catmull-Rom cubic Bezier tangents for organic shapes
function shSmooth(pts, closed = true, tension = 0.28) {
  const n = pts.length;
  const v = [];
  const i = [];
  const o = [];
  for (let k = 0; k < n; k++) {
    const prev = pts[(k - 1 + n) % n];
    const curr = pts[k];
    const next = pts[(k + 1) % n];
    v.push([+curr[0].toFixed(2), +curr[1].toFixed(2)]);
    if (!closed && (k === 0 || k === n - 1)) {
      i.push([0, 0]);
      o.push([0, 0]);
    } else {
      const tx = (next[0] - prev[0]) * tension;
      const ty = (next[1] - prev[1]) * tension;
      i.push([+(-tx).toFixed(2), +(-ty).toFixed(2)]);
      o.push([+tx.toFixed(2), +ty.toFixed(2)]);
    }
  }
  return {
    ty: 'sh',
    nm: 'SmoothPath',
    ks: { a: 0, k: { i, o, v, c: closed } }
  };
}

function shCircle(cx, cy, r) {
  return shEllipse(cx, cy, r, r);
}

function shEllipse(cx, cy, rx, ry) {
  const k = 0.55228475;
  const ox = rx * k;
  const oy = ry * k;
  return shPath([
    [cx, cy - ry, -ox, 0, ox, 0],
    [cx + rx, cy, 0, -oy, 0, oy],
    [cx, cy + ry, ox, 0, -ox, 0],
    [cx - rx, cy, 0, oy, 0, -oy]
  ], true);
}

function shStar(cx, cy, rOuter, rInner, points = 5, rotDeg = -90) {
  const pts = [];
  const total = points * 2;
  const baseRad = (rotDeg * Math.PI) / 180;
  for (let k = 0; k < total; k++) {
    const r = k % 2 === 0 ? rOuter : rInner;
    const a = baseRad + (k / total) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return shPath(pts, true);
}

function shRing(cx, cy, rOuter, rInner, n = 16) {
  const outer = [];
  const inner = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    outer.push([cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter]);
    const a2 = ((n - 1 - k) / n) * Math.PI * 2;
    inner.push([cx + Math.cos(a2) * rInner, cy + Math.sin(a2) * rInner]);
  }
  return [shSmooth(outer, true, 0.25), shSmooth(inner, true, 0.25)];
}

// Create a rich Lottie Group with solid fill, 3-stop linear gradient fill, and/or stroke
function grp(name, paths, opts = {}) {
  const {
    fill = null,
    grad = null, // [hex1, hex2, hex3]
    gradPts = [[0, -120], [0, 120]],
    opacity = 100,
    stroke = null,
    strokeWidth = 3.5,
    pos = [0, 0],
    scale = [100, 100],
    rot = 0
  } = opts;

  const it = Array.isArray(paths) ? [...paths] : [paths];

  if (stroke) {
    it.push({
      ty: 'st',
      nm: 'Stroke',
      c: { a: 0, k: [...hexToRgb01(stroke), 1] },
      o: { a: 0, k: opacity },
      w: { a: 0, k: strokeWidth },
      lc: 2,
      lj: 2
    });
  }

  if (grad && grad.length === 3) {
    const [c1, c2, c3] = grad.map(hexToRgb01);
    it.push({
      ty: 'gf',
      nm: 'GradFill',
      o: { a: 0, k: opacity },
      r: 1,
      bm: 0,
      g: {
        p: 3,
        k: { a: 0, k: [0, ...c1, 0.5, ...c2, 1, ...c3] }
      },
      s: { a: 0, k: gradPts[0] },
      e: { a: 0, k: gradPts[1] },
      t: 1
    });
  } else if (fill) {
    it.push({
      ty: 'fl',
      nm: 'Fill',
      c: { a: 0, k: [...hexToRgb01(fill), 1] },
      o: { a: 0, k: opacity },
      r: 1
    });
  }

  it.push({
    ty: 'tr',
    p: { a: 0, k: pos },
    a: { a: 0, k: [0, 0] },
    s: { a: 0, k: scale },
    r: { a: 0, k: rot },
    o: { a: 0, k: 100 },
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 }
  });

  return { ty: 'gr', nm: name, it };
}

// Create a Lottie Vector Layer parented to NULL CONTROL (ind: 19)
// Default pos is [63.066, 18.705, 0] which is the exact center of the crown!
// In this coordinate space:
// - Center Peak Tip = [0, -161]
// - Left Peak Tip = [-212, -44], Right Peak Tip = [213, -43]
// - Back-Left Peak = [-108, -58], Back-Right Peak = [110, -58]
// - Center Gem = [0, 66]
// - Bottom Rim = [-167, 157] .. [0, 183] .. [168, 156]
function makeCrownLayer(name, ind, shapes, animType = 'breathe', basePos = [63.066, 18.705, 0]) {
  const easeIn = { x: [0.667, 0.667, 0.667], y: [1, 1, 1] };
  const easeOut = { x: [0.333, 0.333, 0.333], y: [0, 0, 0] };
  const ease1DIn = { x: [0.667], y: [1] };
  const ease1DOut = { x: [0.333], y: [0] };

  let sProp = { a: 0, k: [100, 100, 100] };
  let rProp = { a: 0, k: 0 };
  let pProp = { a: 0, k: basePos };
  let oProp = { a: 0, k: 100 };

  if (animType === 'breathe') {
    sProp = {
      a: 1,
      k: [
        { i: easeIn, o: easeOut, t: 0, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 90, s: [106, 106, 100] },
        { t: 180, s: [100, 100, 100] }
      ]
    };
  } else if (animType === 'wings') {
    sProp = {
      a: 1,
      k: [
        { i: easeIn, o: easeOut, t: 0, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 45, s: [108, 95, 100] },
        { i: easeIn, o: easeOut, t: 90, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 135, s: [108, 95, 100] },
        { t: 180, s: [100, 100, 100] }
      ]
    };
  } else if (animType === 'float') {
    pProp = {
      a: 1,
      k: [
        { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 0, s: basePos },
        { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 90, s: [basePos[0], basePos[1] - 12, 0] },
        { t: 180, s: basePos }
      ]
    };
  } else if (animType === 'flame') {
    sProp = {
      a: 1,
      k: [
        { i: easeIn, o: easeOut, t: 0, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 30, s: [96, 109, 100] },
        { i: easeIn, o: easeOut, t: 60, s: [103, 97, 100] },
        { i: easeIn, o: easeOut, t: 90, s: [97, 111, 100] },
        { i: easeIn, o: easeOut, t: 120, s: [104, 98, 100] },
        { i: easeIn, o: easeOut, t: 150, s: [96, 108, 100] },
        { t: 180, s: [100, 100, 100] }
      ]
    };
  } else if (animType === 'spin_slow') {
    rProp = {
      a: 1,
      k: [
        { i: ease1DIn, o: ease1DOut, t: 0, s: [-6] },
        { i: ease1DIn, o: ease1DOut, t: 90, s: [6] },
        { t: 180, s: [-6] }
      ]
    };
  } else if (animType === 'static') {
    // Syncs 1:1 with crown body
  }

  // Note: In Lottie, shapes[0] is rendered ON TOP, shapes[last] is at the BOTTOM.
  // So we reverse our painter's-order array so the last item pushed by our builder renders on top!
  return {
    ddd: 0,
    ind,
    ty: 4,
    nm: name,
    parent: 19,
    sr: 1,
    ks: {
      o: oProp,
      r: rProp,
      p: pProp,
      a: { a: 0, k: [0, 0, 0] },
      s: sProp
    },
    ao: 0,
    shapes: [...shapes].reverse(),
    ip: 0,
    op: 180,
    st: 0,
    bm: 0
  };
}

// Reusable architectural building blocks for the crown
const PEAK_COORDS = [
  [0, -161],     // Center Front Peak
  [-212, -44],   // Left Front Peak
  [213, -43],    // Right Front Peak
  [-108, -58],   // Back-Left Peak
  [110, -58]     // Back-Right Peak
];

// Royal Velvet / Armored Cap Dome that sits inside the crown (between Зад and Перед)
function makeInnerRoyalDome(gradColors, strokeHex, ribColor = null) {
  const out = [];
  out.push(grp('InnerRoyalCap', [
    shSmooth([
      [-175, 40],
      [-155, -85],
      [-75, -148],
      [0, -162],
      [75, -148],
      [155, -85],
      [175, 40],
      [0, 80]
    ], true, 0.25)
  ], { grad: gradColors, gradPts: [[0, -165], [0, 80]], stroke: strokeHex, strokeWidth: 4 }));

  if (ribColor) {
    out.push(grp('CapArches', [
      shSmooth([[-145, -75], [-65, -142], [0, -160], [65, -142], [145, -75]], false, 0.25),
      shPath([[0, -162], [0, 40]], false)
    ], { stroke: ribColor, strokeWidth: 6 }));
  }
  return out;
}

// Royal Base Rim Band (Ermine fur, Gold Bezel, Chain, Slime, Lava, etc.) along bottom of crown
function makeBottomBand(gradColors, strokeHex, style = 'ermine') {
  const out = [];
  // Main curved band along the base of the crown [-175, 132] -> [0, 158] -> [175, 132] -> [168, 164] -> [0, 190] -> [-168, 164]
  out.push(grp('BaseBandMain', [
    shSmooth([
      [-176, 128],
      [-90, 148],
      [0, 155],
      [90, 148],
      [176, 128],
      [170, 164],
      [90, 184],
      [0, 190],
      [-90, 184],
      [-170, 164]
    ], true, 0.22)
  ], { grad: gradColors, gradPts: [[-175, 130], [175, 185]], stroke: strokeHex, strokeWidth: 4 }));

  if (style === 'ermine') {
    // Classic Royal black ermine tails along the white fur band
    const spots = [-135, -90, -45, 0, 45, 90, 135];
    out.push(grp('ErmineSpots', spots.map(x => {
      const y = 160 + (1 - Math.pow(x / 150, 2)) * 12;
      return shPath([[x, y - 7], [x + 5, y + 6], [x, y + 9], [x - 5, y + 6]]);
    }), { fill: '#18181b' }));
  } else if (style === 'studs') {
    const xs = [-140, -105, -70, -35, 0, 35, 70, 105, 140];
    out.push(grp('BandStuds', xs.map(x => {
      const y = 158 + (1 - Math.pow(x / 155, 2)) * 14;
      return shStar(x, y, 8, 4, 4, 45);
    }), { fill: '#ffffff', stroke: strokeHex, strokeWidth: 2 }));
  } else if (style === 'drips') {
    // Dripping liquid gold / blood / toxic slime from the bottom rim
    out.push(grp('BaseDrips', [
      shSmooth([
        [-155, 155], [-145, 195], [-132, 162],
        [-95, 168], [-82, 222], [-68, 174],
        [-25, 178], [-8, 238], [10, 180],
        [55, 174], [72, 218], [88, 170],
        [128, 162], [142, 202], [156, 155]
      ], true, 0.25)
    ], { grad: gradColors, gradPts: [[0, 150], [0, 238]], stroke: strokeHex, strokeWidth: 3.5 }));
  }
  return out;
}

// Finial Ornaments on all 5 Crown Peaks
function makePeakFinials(kind, gradColors, strokeHex) {
  return PEAK_COORDS.map(([px, py], i) => {
    const sc = i === 0 ? 1.15 : (i < 3 ? 0.95 : 0.8);
    if (kind === 'pearls') {
      return grp(`PeakPearl_${i}`, [
        shCircle(px, py - 10 * sc, 15 * sc),
        shCircle(px - 4 * sc, py - 14 * sc, 5 * sc)
      ], { grad: gradColors, gradPts: [[px, py - 25], [px, py + 5]], stroke: strokeHex, strokeWidth: 3 });
    }
    if (kind === 'stars') {
      return grp(`PeakStar_${i}`, [
        shStar(px, py - 14 * sc, 22 * sc, 9 * sc, 5)
      ], { grad: gradColors, gradPts: [[px, py - 35], [px, py + 10]], stroke: strokeHex, strokeWidth: 2.5 });
    }
    if (kind === 'flames') {
      return grp(`PeakFlame_${i}`, [
        shSmooth([
          [px, py - 48 * sc],
          [px + 18 * sc, py - 18 * sc],
          [px + 12 * sc, py + 4 * sc],
          [px - 12 * sc, py + 4 * sc],
          [px - 18 * sc, py - 18 * sc]
        ], true, 0.3)
      ], { grad: gradColors, gradPts: [[px, py - 48], [px, py + 5]], stroke: strokeHex, strokeWidth: 2.5 });
    }
    if (kind === 'diamonds') {
      return grp(`PeakDia_${i}`, [
        shPath([
          [px, py - 34 * sc],
          [px + 16 * sc, py - 12 * sc],
          [px, py + 6 * sc],
          [px - 16 * sc, py - 12 * sc]
        ])
      ], { grad: gradColors, gradPts: [[px, py - 34], [px, py + 6]], stroke: strokeHex, strokeWidth: 3 });
    }
    if (kind === 'crosses') {
      const r = 18 * sc;
      return grp(`PeakCross_${i}`, [
        shStar(px, py - 16 * sc, r, r * 0.32, 4, 0)
      ], { grad: gradColors, gradPts: [[px, py - 34], [px, py]], stroke: strokeHex, strokeWidth: 2.5 });
    }
    return grp(`PeakOrb_${i}`, [
      shCircle(px, py - 10 * sc, 13 * sc)
    ], { grad: gradColors, stroke: strokeHex, strokeWidth: 2.5 });
  });
}

// ============================================================================
// BESPOKE ARCHITECTURAL BUILDERS FOR EACH OF THE 30 MODELS
// Returns { backShapes, midShapes, frontShapes, centerEmblemShapes, frontAnim, backAnim }
// ============================================================================
function buildModelArchitecture(modelId) {
  const backShapes = [];   // Behind the entire crown (Wings, Swords, Sun, Aura, Rings, Flames)
  const midShapes = [];    // Inside the crown (Velvet cap, Dome, Turban, Brain/Energy core)
  const frontShapes = [];  // Over the crown (Horns, Plumes, Visors, Fangs, Cobras, Laurels, Base Band)
  let frontAnim = 'breathe';
  let backAnim = 'breathe';

  switch (modelId) {
    // 1. SHADOW MONARCH (Solo Leveling: Dark Obsidian + Towering Shadow Horns + Blazing Purple-Blue Aura + Shadow Eyes)
    case 'shadow_monarch': {
      backAnim = 'flame';
      // Giant rising shadow flame aura behind the crown
      backShapes.push(grp('ShadowOuterAura', [
        shSmooth([
          [-225, 90], [-250, -30], [-195, -145], [-135, -80],
          [-95, -210], [-35, -135], [0, -245], [35, -135],
          [95, -210], [135, -80], [195, -145], [250, -30],
          [225, 90], [0, 140]
        ], true, 0.25)
      ], { grad: ['#c084fc', '#6b21a8', '#1e0944'], gradPts: [[0, -245], [0, 140]], stroke: '#e9d5ff', strokeWidth: 3.5, opacity: 92 }));
      backShapes.push(grp('ShadowInnerAura', [
        shSmooth([
          [-165, 60], [-180, -40], [-120, -145], [-60, -85],
          [0, -205], [60, -85], [120, -145], [180, -40], [165, 60]
        ], true, 0.25)
      ], { grad: ['#38bdf8', '#7e22ce', '#090414'], gradPts: [[0, -205], [0, 60]], opacity: 88 }));

      // Jagged Shadow Monarch Horns & Glowing Sovereign Eyes on the front
      frontShapes.push(...makeBottomBand(['#581c87', '#1e0944', '#090414'], '#c084fc', 'studs'));
      frontShapes.push(grp('MonarchLeftHorn', [
        shSmooth([[-115, 10], [-195, -75], [-238, -195], [-175, -165], [-125, -70], [-75, -10]], true, 0.2)
      ], { grad: ['#a855f7', '#3b0764', '#090414'], gradPts: [[-238, -195], [-90, 10]], stroke: '#e9d5ff', strokeWidth: 4 }));
      frontShapes.push(grp('MonarchRightHorn', [
        shSmooth([[115, 10], [195, -75], [238, -195], [175, -165], [125, -70], [75, -10]], true, 0.2)
      ], { grad: ['#a855f7', '#3b0764', '#090414'], gradPts: [[238, -195], [90, 10]], stroke: '#e9d5ff', strokeWidth: 4 }));
      // Glowing Shadow Monarch Eyes on the brow
      frontShapes.push(grp('MonarchEyes', [
        shPath([[-110, 45], [-68, 32], [-42, 58], [-82, 62]]),
        shPath([[110, 45], [68, 32], [42, 58], [82, 62]])
      ], { fill: '#38bdf8', stroke: '#e0f2fe', strokeWidth: 2.5 }));
      frontShapes.push(...makePeakFinials('flames', ['#38bdf8', '#a855f7', '#3b0764'], '#e9d5ff'));
      break;
    }

    // 2. AMIR TEMUR (Samarkand Turquoise Dome + Royal Golden Jig'a Plume + Crossed Shamshir Swords + 3-Ring Tamgha)
    case 'amir_temur': {
      backAnim = 'breathe';
      // Crossed Golden Timurid Shamshir Scimitars behind the crown
      backShapes.push(grp('LeftScimitar', [
        shSmooth([[-235, -165], [-120, -75], [165, 145], [145, 165], [-145, -55], [-248, -135]], true, 0.2)
      ], { grad: ['#ffffff', '#fde047', '#ca8a04'], gradPts: [[-240, -165], [160, 160]], stroke: '#92400e', strokeWidth: 3.5 }));
      backShapes.push(grp('RightScimitar', [
        shSmooth([[235, -165], [120, -75], [-165, 145], [-145, 165], [145, -55], [248, -135]], true, 0.2)
      ], { grad: ['#ffffff', '#fde047', '#ca8a04'], gradPts: [[240, -165], [-160, 160]], stroke: '#92400e', strokeWidth: 3.5 }));

      // Samarkand Ribbed Turquoise Dome inside the crown
      midShapes.push(...makeInnerRoyalDome(['#22d3ee', '#0284c7', '#1e3a8a'], '#facc15', '#fde047'));

      // Royal Timurid Jig'a (Feather Plume & Ruby Holder) on the center peak + Gold Filigree Band
      frontShapes.push(...makeBottomBand(['#fef08a', '#eab308', '#b45309'], '#78350f', 'studs'));
      frontShapes.push(grp('TimurJigaPlume', [
        shSmooth([[0, -155], [34, -205], [22, -252], [0, -268], [-22, -252], [-34, -205]], true, 0.3)
      ], { grad: ['#ffffff', '#bae6fd', '#facc15'], gradPts: [[0, -268], [0, -155]], stroke: '#eab308', strokeWidth: 3.5 }));
      frontShapes.push(grp('TimurJigaRuby', [
        shPath([[0, -198], [16, -172], [0, -148], [-16, -172]])
      ], { grad: ['#fda4af', '#e11d48', '#881337'], stroke: '#fef08a', strokeWidth: 3 }));
      frontShapes.push(...makePeakFinials('stars', ['#fef08a', '#f59e0b', '#b45309'], '#ffffff'));
      break;
    }

    // 3. BLACK GOLD VIP (Luxury Carbon Velvet Cap + Golden Wings + VIP Crown Shield + Gold Chain Base)
    case 'black_gold_vip': {
      backAnim = 'wings';
      // Golden Luxury V-Wings spreading left & right behind the crown
      const leftWing = [
        [[-150, 20], [-255, -85], [-235, -30], [-265, 10], [-225, 45], [-248, 82], [-155, 95]]
      ];
      const rightWing = leftWing.map(pts => pts.map(([x, y]) => [-x, y]));
      backShapes.push(grp('VipWingLeft', leftWing.map(p => shSmooth(p, true, 0.18)), {
        grad: ['#fef08a', '#eab308', '#854d0e'], gradPts: [[-260, -85], [-150, 95]], stroke: '#fef9c3', strokeWidth: 3.5
      }));
      backShapes.push(grp('VipWingRight', rightWing.map(p => shSmooth(p, true, 0.18)), {
        grad: ['#fef08a', '#eab308', '#854d0e'], gradPts: [[260, -85], [150, 95]], stroke: '#fef9c3', strokeWidth: 3.5
      }));

      midShapes.push(...makeInnerRoyalDome(['#3f3f46', '#18181b', '#09090b'], '#eab308', '#facc15'));
      frontShapes.push(...makeBottomBand(['#fef08a', '#eab308', '#854d0e'], '#18181b', 'studs'));
      frontShapes.push(...makePeakFinials('diamonds', ['#fef08a', '#eab308', '#713f12'], '#ffffff'));
      break;
    }

    // 4. SATOSHI NAKAMOTO (Giant 3D Bitcoin Halo + Green Bullish Chart Arrows + Floating Crypto Coins)
    case 'satoshi_nakamoto': {
      backAnim = 'float';
      // Bullish green neon chart bars & arrows rising behind the crown
      backShapes.push(grp('BullishChart', [
        shPath([[-190, 60], [-190, -70], [-155, -70], [-155, 60]]),
        shPath([[-130, 60], [-130, -125], [-95, -125], [-95, 60]]),
        shPath([[95, 60], [95, -110], [130, -110], [130, 60]]),
        shPath([[155, 60], [155, -165], [190, -165], [190, 60]]),
        shPath([[172, -210], [210, -160], [135, -160]])
      ], { grad: ['#86efac', '#22c55e', '#14532d'], gradPts: [[0, -210], [0, 60]], stroke: '#bbf7d0', strokeWidth: 3 }));

      // Floating Golden Bitcoin Coins on the peaks
      frontShapes.push(...makeBottomBand(['#fde047', '#f97316', '#9a3412'], '#fef08a', 'studs'));
      frontShapes.push(grp('TopBitcoinCrest', [
        shCircle(0, -188, 36),
        shCircle(0, -188, 27)
      ], { grad: ['#fef08a', '#f59e0b', '#b45309'], gradPts: [[0, -224], [0, -152]], stroke: '#ffffff', strokeWidth: 3 }));
      frontShapes.push(grp('TopBtcGlyph', [
        shPath([[-8, -202], [6, -202], [11, -195], [6, -188], [12, -181], [7, -173], [-8, -173]], false),
        shPath([[-3, -208], [-3, -167]], false),
        shPath([[4, -208], [4, -167]], false)
      ], { stroke: '#ffffff', strokeWidth: 4 }));
      break;
    }

    // 5. EYE OF SAURON (Towering Barad-dur Dark Iron Spikes + Giant Blazing Eye Suspended Above Crown + Lava Base)
    case 'eye_of_sauron': {
      frontAnim = 'flame';
      // Blazing Ring of Fire behind the crown
      backShapes.push(grp('SauronFireRing', [
        shCircle(0, -65, 185),
        shCircle(0, -65, 130)
      ], { grad: ['#fde047', '#f97316', '#7f1d1d'], gradPts: [[0, -250], [0, 120]], stroke: '#fef08a', strokeWidth: 3.5 }));

      // Towering Barad-dur Iron Horns framing the Great Eye above the crown
      frontShapes.push(...makeBottomBand(['#f97316', '#991b1b', '#1c1917'], '#fde047', 'drips'));
      frontShapes.push(grp('BaradDurHorns', [
        shSmooth([[-95, -60], [-125, -165], [-75, -248], [-55, -165], [-45, -75]], true, 0.15),
        shSmooth([[95, -60], [125, -165], [75, -248], [55, -165], [45, -75]], true, 0.15)
      ], { grad: ['#57534e', '#1c1917', '#09090b'], gradPts: [[0, -248], [0, -60]], stroke: '#f97316', strokeWidth: 3.5 }));
      // The Great Flaming Eye suspended between the horns at [0, -195]
      frontShapes.push(grp('GreatEyeFlame', [
        shSmooth([[-62, -195], [-28, -228], [0, -236], [28, -228], [62, -195], [28, -162], [0, -154], [-28, -162]], true, 0.25)
      ], { grad: ['#fef08a', '#f97316', '#dc2626'], gradPts: [[0, -236], [0, -154]], stroke: '#fde047', strokeWidth: 3.5 }));
      frontShapes.push(grp('GreatEyeSlit', [
        shPath([[0, -228], [9, -195], [0, -162], [-9, -195]])
      ], { fill: '#090504', stroke: '#fef08a', strokeWidth: 2 }));
      break;
    }

    // 6. TON CRYSTAL (Levitating Giant 3D TON Diamond Prism + Electric Lightning Arcs + Sapphire Base)
    case 'ton_crystal': {
      frontAnim = 'float';
      // Glowing Cyan Energy Shield Hexagon behind crown
      backShapes.push(grp('TonHexShield', [
        shPath([[0, -235], [195, -125], [195, 75], [0, 175], [-195, 75], [-195, -125]])
      ], { grad: ['#e0f2fe', '#0284c7', '#1e3a8a'], gradPts: [[0, -235], [0, 175]], stroke: '#7dd3fc', strokeWidth: 4, opacity: 65 }));

      // Giant Levitating TON Prism above the crown + Lightning bolts
      frontShapes.push(...makeBottomBand(['#bae6fd', '#0284c7', '#1e3a8a'], '#ffffff', 'studs'));
      frontShapes.push(grp('LevitatingTonGem', [
        shPath([[-48, -222], [48, -222], [64, -196], [0, -135], [-64, -196]]),
        shPath([[-48, -222], [0, -196], [48, -222]], false),
        shPath([[0, -196], [0, -135]], false)
      ], { grad: ['#ffffff', '#38bdf8', '#0369a1'], gradPts: [[0, -222], [0, -135]], stroke: '#ffffff', strokeWidth: 4 }));
      frontShapes.push(...makePeakFinials('diamonds', ['#ffffff', '#7dd3fc', '#0284c7'], '#ffffff'));
      break;
    }

    // 7. JULIUS CAESAR (Roman Centurion Red Crest Plume + Full Golden Laurel Wreath + Marble Base)
    case 'julius_caesar': {
      // Majestic Roman Centurion Red Helmet Crest Plume arching over the top of the crown!
      backShapes.push(grp('RomanCrestPlume', [
        shSmooth([
          [-165, -95], [-195, -175], [-115, -242], [0, -262],
          [115, -242], [195, -175], [165, -95], [0, -135]
        ], true, 0.28)
      ], { grad: ['#fda4af', '#dc2626', '#7f1d1d'], gradPts: [[0, -262], [0, -95]], stroke: '#facc15', strokeWidth: 5 }));
      backShapes.push(grp('RomanCrestStand', [
        shPath([[-85, -110], [-65, -155], [65, -155], [85, -110]])
      ], { grad: ['#fef08a', '#eab308', '#a16207'], stroke: '#ffffff', strokeWidth: 3 }));

      // Full multi-leaf Golden Roman Laurel Wreath framing Left & Right of the crown
      const leafPairs = [-1, 1].flatMap(dir => [
        [[dir * 165, 135], [dir * 225, 110], [dir * 238, 65], [dir * 185, 85]],
        [[dir * 185, 80], [dir * 248, 45], [dir * 252, -5], [dir * 195, 25]],
        [[dir * 195, 20], [dir * 252, -25], [dir * 242, -78], [dir * 188, -40]],
        [[dir * 182, -45], [dir * 230, -95], [dir * 205, -145], [dir * 160, -95]],
        [[dir * 155, -100], [dir * 185, -152], [dir * 148, -192], [dir * 120, -138]]
      ]);
      frontShapes.push(...makeBottomBand(['#ffffff', '#e2e8f0', '#94a3b8'], '#eab308', 'studs'));
      frontShapes.push(grp('CaesarLaurelWreath', leafPairs.map(pts => shSmooth(pts, true, 0.25)), {
        grad: ['#fef08a', '#eab308', '#a16207'], gradPts: [[0, -190], [0, 140]], stroke: '#ffffff', strokeWidth: 2.5
      }));
      break;
    }

    // 8. AKATSUKI CLOUD (Iconic Red & White Akatsuki Clouds + Shinobi Scratched Forehead Protector Band + Sharingan)
    case 'akatsuki_cloud': {
      backAnim = 'float';
      // Iconic Red Akatsuki Clouds with white outlines floating behind the crown
      backShapes.push(grp('AkatsukiCloudLeft', [
        shSmooth([
          [-245, -45], [-215, -92], [-165, -85], [-135, -125],
          [-75, -110], [-65, -55], [-135, -25], [-215, -15]
        ], true, 0.32)
      ], { grad: ['#f43f5e', '#e11d48', '#881337'], stroke: '#ffffff', strokeWidth: 5 }));
      backShapes.push(grp('AkatsukiCloudRight', [
        shSmooth([
          [245, -85], [215, -132], [165, -125], [135, -165],
          [75, -150], [65, -95], [135, -65], [215, -55]
        ], true, 0.32)
      ], { grad: ['#f43f5e', '#e11d48', '#881337'], stroke: '#ffffff', strokeWidth: 5 }));

      //Metallic Shinobi Headband Plate at the base with rogue horizontal slash
      frontShapes.push(...makeBottomBand(['#cbd5e1', '#64748b', '#1e293b'], '#09090b', 'studs'));
      frontShapes.push(grp('RogueSlash', [
        shPath([[-95, 162], [95, 168]], false)
      ], { stroke: '#09090b', strokeWidth: 7 }));
      frontShapes.push(...makePeakFinials('flames', ['#fb7185', '#e11d48', '#4c0519'], '#ffffff'));
      break;
    }

    // 9. ROLEX PRESTIGE (Giant Golden Mechanical Tourbillon Cogs Behind & Above + Fluted Gold Bezel Base)
    case 'rolex_prestige': {
      backAnim = 'spin_slow';
      // Giant Golden Mechanical Watch Gear Wheel behind the crown
      backShapes.push(grp('MasterTourbillonGear', [
        shStar(0, -35, 225, 192, 18),
        shCircle(0, -35, 145)
      ], { grad: ['#fef08a', '#eab308', '#854d0e'], gradPts: [[0, -255], [0, 185]], stroke: '#fef9c3', strokeWidth: 4 }));

      midShapes.push(...makeInnerRoyalDome(['#10b981', '#047857', '#064e3b'], '#facc15', '#fde047'));
      frontShapes.push(...makeBottomBand(['#fef08a', '#eab308', '#a16207'], '#064e3b', 'studs'));
      // Iconic 5-point Rolex Coronet crest rising from the center peak
      frontShapes.push(...makePeakFinials('pearls', ['#fef08a', '#eab308', '#a16207'], '#ffffff'));
      break;
    }

    // 10. FROZEN LICH (Towering Lich King Ice Citadel Spires + Blizzard Frost Halo + Glowing Frost Runes)
    case 'frozen_lich': {
      // Towering Crystalline Ice Spires behind the crown (Lich King helmet silhouette!)
      backShapes.push(grp('GlacierCitadelSpires', [
        shPath([[0, -268], [38, -110], [-38, -110]]),
        shPath([[-115, -225], [-65, -85], [-148, -75]]),
        shPath([[115, -225], [148, -75], [65, -85]]),
        shPath([[-205, -155], [-145, -35], [-225, -15]]),
        shPath([[205, -155], [225, -15], [145, -35]])
      ], { grad: ['#ffffff', '#7dd3fc', '#0369a1'], gradPts: [[0, -268], [0, -15]], stroke: '#ffffff', strokeWidth: 4 }));

      frontShapes.push(...makeBottomBand(['#e0f2fe', '#38bdf8', '#0369a1'], '#ffffff', 'drips'));
      frontShapes.push(...makePeakFinials('diamonds', ['#ffffff', '#bae6fd', '#0284c7'], '#ffffff'));
      break;
    }

    // 11. CYBERPUNK 2077 (Futuristic Neon LED Visor Shades + Dual Cyber Antennas + Glitch Neon Cables)
    case 'cyberpunk_2077': {
      // Dual Cybernetic Radar Antennas + Neon Halo behind the crown
      backShapes.push(grp('CyberAntennas', [
        shPath([[-165, -40], [-225, -215], [-195, -215], [-140, -40]]),
        shPath([[165, -40], [225, -215], [195, -215], [140, -40]]),
        shCircle(-210, -225, 16),
        shCircle(210, -225, 16)
      ], { grad: ['#22d3ee', '#ec4899', '#7e22ce'], gradPts: [[0, -240], [0, -40]], stroke: '#67e8f9', strokeWidth: 3.5 }));

      // Giant Futuristic Neon Pink/Cyan Cyberpunk Visor Sunglasses across the front of the crown!
      frontShapes.push(...makeBottomBand(['#22d3ee', '#0284c7', '#1e1b4b'], '#ec4899', 'studs'));
      frontShapes.push(grp('CyberNeonVisor', [
        shSmooth([
          [-195, 25], [-95, 42], [0, 38], [95, 42], [195, 25],
          [175, 92], [85, 105], [0, 78], [-85, 105], [-175, 92]
        ], true, 0.15)
      ], { grad: ['#67e8f9', '#ec4899', '#7e22ce'], gradPts: [[-195, 25], [195, 105]], stroke: '#ffffff', strokeWidth: 4.5 }));
      frontShapes.push(grp('CyberVisorGlint', [
        shPath([[-155, 45], [-45, 52], [-65, 82], [-145, 72]]),
        shPath([[55, 52], [155, 45], [145, 72], [45, 82]])
      ], { fill: '#ffffff', opacity: 65 }));
      break;
    }

    // 12. PAXTA IMPERIAL (Snow-White & 24K Gold Cotton Wreath + Giant Blooming Royal Cotton Boll Dome)
    case 'paxta_imperial': {
      // Giant Lush Snow-White Cotton Boll Cloud Dome nested inside the golden crown!
      midShapes.push(grp('GiantRoyalCottonDome', [
        shCircle(-85, -85, 68),
        shCircle(85, -85, 68),
        shCircle(0, -125, 82),
        shCircle(-135, -35, 52),
        shCircle(135, -35, 52)
      ], { grad: ['#ffffff', '#f8fafc', '#bae6fd'], gradPts: [[0, -210], [0, 20]], stroke: '#facc15', strokeWidth: 4.5 }));

      // Golden Calyx Leaves & Cotton Bolls on the base band
      frontShapes.push(...makeBottomBand(['#fef08a', '#eab308', '#a16207'], '#ffffff', 'studs'));
      frontShapes.push(...makePeakFinials('stars', ['#ffffff', '#fef08a', '#eab308'], '#b45309'));
      break;
    }

    // 13. ARCHANGEL (6-Wing Seraphim Feathered Angel Wings + Radiant Levitating Golden Halo + Celestial Cross)
    case 'archangel': {
      backAnim = 'wings';
      // Huge Majestic Multi-Feathered White & Gold Angel Wings spreading from behind the crown!
      const wingLayers = [-1, 1].flatMap(dir => [
        shSmooth([[dir * 110, 40], [dir * 215, -135], [dir * 262, -110], [dir * 235, -35], [dir * 145, 55]], true, 0.25),
        shSmooth([[dir * 125, 65], [dir * 245, -45], [dir * 268, -5], [dir * 228, 45], [dir * 140, 85]], true, 0.25),
        shSmooth([[dir * 130, 95], [dir * 238, 35], [dir * 252, 75], [dir * 205, 115], [dir * 135, 120]], true, 0.25)
      ]);
      backShapes.push(grp('SeraphimWings', wingLayers, {
        grad: ['#ffffff', '#f1f5f9', '#fde047'], gradPts: [[0, -140], [0, 125]], stroke: '#eab308', strokeWidth: 4
      }));

      // Radiant Golden Halo + Celestial Cross above the center peak
      frontShapes.push(...makeBottomBand(['#ffffff', '#e2e8f0', '#cbd5e1'], '#eab308', 'ermine'));
      frontShapes.push(grp('ArchangelHaloRing', [
        ...shRing(0, -198, 95, 74, 20)
      ], { grad: ['#ffffff', '#fef08a', '#eab308'], gradPts: [[-95, -198], [95, -198]], stroke: '#ca8a04', strokeWidth: 3 }));
      frontShapes.push(...makePeakFinials('crosses', ['#ffffff', '#fef08a', '#eab308'], '#ca8a04'));
      break;
    }

    // 14. HELLFIRE DEMON (Massive Curved Demon Lord Horns + Bat Wings + Rising Hellfire Flames)
    case 'hellfire_demon': {
      backAnim = 'wings';
      // Demonic Bat Wings behind the crown
      const batWings = [-1, 1].map(dir => shSmooth([
        [dir * 120, 30], [dir * 215, -115], [dir * 265, -65],
        [dir * 235, 5], [dir * 258, 65], [dir * 195, 60],
        [dir * 185, 110], [dir * 130, 85]
      ], true, 0.15));
      backShapes.push(grp('DemonBatWings', batWings, {
        grad: ['#dc2626', '#7f1d1d', '#09090b'], gradPts: [[0, -115], [0, 110]], stroke: '#f97316', strokeWidth: 3.5
      }));

      // Massive Ribbed Demon Horns curving up from the crown
      frontShapes.push(...makeBottomBand(['#fde047', '#ea580c', '#7f1d1d'], '#09090b', 'drips'));
      frontShapes.push(grp('DemonLordHorns', [
        shSmooth([[-95, -45], [-195, -115], [-235, -225], [-165, -245], [-135, -165], [-55, -75]], true, 0.25),
        shSmooth([[95, -45], [195, -115], [235, -225], [165, -245], [135, -165], [55, -75]], true, 0.25)
      ], { grad: ['#450a0a', '#18181b', '#f97316'], gradPts: [[0, -245], [0, -45]], stroke: '#fb923c', strokeWidth: 4 }));
      frontShapes.push(...makePeakFinials('flames', ['#fde047', '#f97316', '#dc2626'], '#fef08a'));
      break;
    }

    // 15. SAKURA EMPEROR (Samurai Shogun Golden Kuwagata Antler Crest + Blooming Sakura Flowers & Petals)
    case 'sakura_emperor': {
      // Giant Golden Samurai Kabuto Kuwagata (Crescent Antler Blades) rising behind & above the crown!
      backShapes.push(grp('SamuraiKuwagataHorns', [
        shSmooth([[-25, -95], [-135, -155], [-225, -245], [-195, -125], [-85, -55]], true, 0.22),
        shSmooth([[25, -95], [135, -155], [225, -245], [195, -125], [85, -55]], true, 0.22),
        shCircle(0, -185, 42)
      ], { grad: ['#fef08a', '#f472b6', '#be185d'], gradPts: [[0, -245], [0, -55]], stroke: '#ffffff', strokeWidth: 4 }));

      // Blooming 5-petal Pink Sakura Flowers on the peaks & base
      frontShapes.push(...makeBottomBand(['#fce7f3', '#f472b6', '#9d174d'], '#ffffff', 'studs'));
      frontShapes.push(grp('SakuraPeakFlowers', [
        shStar(0, -185, 34, 16, 5),
        shStar(-212, -55, 26, 12, 5),
        shStar(213, -55, 26, 12, 5)
      ], { grad: ['#ffffff', '#fbcfe8', '#f43f5e'], stroke: '#be185d', strokeWidth: 2.5 }));
      break;
    }

    // 16. MATRIX HACKER (Cascading Neon Green Digital Code Pillars + Hacker Shades + Wireframe Grid)
    case 'matrix_hacker': {
      backAnim = 'float';
      // Cascading Neon Green Matrix Digital Rain Pillars behind the crown
      const bars = [
        [-210, -195, 16, 140], [-165, -235, 16, 180], [-115, -175, 16, 120],
        [-55, -245, 16, 160], [0, -260, 18, 170], [55, -225, 16, 150],
        [115, -190, 16, 130], [165, -240, 16, 180], [210, -180, 16, 130]
      ];
      backShapes.push(grp('MatrixRainPillars', bars.map(([x, y, w, h]) => shPath([
        [x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h], [x - w / 2, y + h]
      ])), { grad: ['#bbf7d0', '#22c55e', '#052e16'], gradPts: [[0, -260], [0, 0]], stroke: '#4ade80', strokeWidth: 2 }));

      // Agent / Neo Black & Neon Green Hacker Shades on the front of the crown
      frontShapes.push(...makeBottomBand(['#22c55e', '#14532d', '#020617'], '#4ade80', 'studs'));
      frontShapes.push(grp('HackerShades', [
        shPath([[-165, 35], [-20, 48], [-35, 95], [-155, 82]]),
        shPath([[165, 35], [20, 48], [35, 95], [155, 82]]),
        shPath([[-25, 50], [25, 50]], false)
      ], { grad: ['#052e16', '#14532d', '#22c55e'], stroke: '#4ade80', strokeWidth: 4.5 }));
      break;
    }

    // 17. PHARAOH TUT (Egyptian Nemes Striped Headdress Flaps + Golden Uraeus Cobra at Top + Lapis Band)
    case 'pharaoh_tut': {
      // Iconic Egyptian Pharaoh Gold & Blue Nemes Headdress Wings flanking both sides of the crown!
      backShapes.push(grp('PharaohNemesWings', [
        shSmooth([
          [-145, -110], [-245, -65], [-262, 65], [-215, 185], [-145, 165],
          [145, 165], [215, 185], [262, 65], [245, -65], [145, -110], [0, -165]
        ], true, 0.2)
      ], { grad: ['#facc15', '#1d4ed8', '#172554'], gradPts: [[0, -165], [0, 185]], stroke: '#fde047', strokeWidth: 5 }));

      // Golden Royal Uraeus Cobra rearing up from the center brow of the crown!
      frontShapes.push(...makeBottomBand(['#fde047', '#1d4ed8', '#b45309'], '#fef08a', 'studs'));
      frontShapes.push(grp('GoldenCobraHood', [
        shSmooth([
          [0, -238], [45, -198], [52, -145], [18, -105],
          [0, -65], [-18, -105], [-52, -145], [-45, -198]
        ], true, 0.3),
        shCircle(0, -215, 18)
      ], { grad: ['#fef08a', '#f59e0b', '#b45309'], gradPts: [[0, -238], [0, -65]], stroke: '#1e3a8a', strokeWidth: 3.5 }));
      break;
    }

    // 18. SUPERNOVA (Giant Tilted Saturn Quasar Rings + Orbiting Moons + Cosmic Nebula Dome)
    case 'supernova': {
      backAnim = 'spin_slow';
      // Cosmic Nebula Dome inside the crown
      midShapes.push(...makeInnerRoyalDome(['#e879f9', '#6366f1', '#1e1b4b'], '#f0abfc', '#38bdf8'));

      // Giant Tilted Quasar / Saturn Ring wrapping around the crown + Orbiting Planets
      frontShapes.push(...makeBottomBand(['#c084fc', '#4f46e5', '#1e1b4b'], '#f0abfc', 'studs'));
      frontShapes.push(grp('SaturnOrbitRing', [
        shSmooth([
          [-262, 55], [-145, 15], [145, -45], [262, -25],
          [145, 35], [-145, 95]
        ], true, 0.35),
        shCircle(-225, 42, 22),
        shCircle(228, -18, 18),
        shStar(0, -195, 38, 12, 4)
      ], { grad: ['#ffffff', '#e879f9', '#38bdf8'], gradPts: [[-260, 55], [260, -25]], stroke: '#ffffff', strokeWidth: 3.5 }));
      break;
    }

    // 19. MIDAS TOUCH (Overflowing Gold Bullion Bars & Coins Inside + Heavy Dripping Liquid 24K Gold Base)
    case 'midas_touch': {
      // Overflowing treasure pile of Gold Bars & Coins inside the crown
      midShapes.push(grp('GoldTreasurePile', [
        shCircle(-85, -95, 55),
        shCircle(85, -95, 55),
        shCircle(0, -130, 68),
        shPath([[-145, -55], [-45, -115], [35, -75], [-65, -15]]),
        shPath([[45, -115], [145, -55], [65, -15], [-35, -75]])
      ], { grad: ['#ffffff', '#fef08a', '#ca8a04'], gradPts: [[0, -195], [0, 0]], stroke: '#a16207', strokeWidth: 4 }));

      // Heavy melting liquid 24K gold dripping from the bottom of the crown
      frontShapes.push(...makeBottomBand(['#ffffff', '#fde047', '#ca8a04'], '#a16207', 'drips'));
      frontShapes.push(...makePeakFinials('stars', ['#ffffff', '#fef08a', '#eab308'], '#a16207'));
      break;
    }

    // 20. VENOM SYMBIOTE (Ferocious White Symbiote Eyes + Jagged Monster Fangs + Writhing Tendrils)
    case 'venom_symbiote': {
      backAnim = 'flame';
      // Writhing Black & White Symbiote Tendrils shooting out from behind the crown
      backShapes.push(grp('SymbioteTendrils', [
        shSmooth([[-145, 20], [-245, -65], [-265, -155], [-205, -115], [-135, -35]], true, 0.3),
        shSmooth([[145, 20], [245, -65], [265, -155], [205, -115], [135, -35]], true, 0.3),
        shSmooth([[-65, -95], [-115, -225], [-45, -185], [0, -255], [45, -185], [115, -225], [65, -95]], true, 0.25)
      ], { grad: ['#475569', '#0f172a', '#000000'], stroke: '#cbd5e1', strokeWidth: 3.5 }));

      // Iconic Huge Jagged White Venom Eyes & Razor Fangs along the base of the crown!
      frontShapes.push(grp('VenomEyes', [
        shSmooth([[-175, -15], [-135, -55], [-45, 25], [-95, 55], [-165, 30]], true, 0.2),
        shSmooth([[175, -15], [135, -55], [45, 25], [95, 55], [165, 30]], true, 0.2)
      ], { fill: '#ffffff', stroke: '#09090b', strokeWidth: 4 }));
      frontShapes.push(grp('VenomFangs', [
        shPath([
          [-165, 130], [-145, 195], [-122, 138], [-98, 208], [-72, 142],
          [-45, 215], [-18, 145], [0, 222], [18, 145], [45, 215],
          [72, 142], [98, 208], [122, 138], [145, 195], [165, 130]
        ], true)
      ], { grad: ['#ffffff', '#e2e8f0', '#94a3b8'], stroke: '#0f172a', strokeWidth: 3.5 }));
      break;
    }

    // 21. DIAMOND ICE (Giant Faceted Iceberg Diamonds Rising from Crown + VVS Baguette Diamond Base)
    case 'diamond_ice': {
      // Giant Prismatic Diamond Crystals jutting out from behind the crown
      backShapes.push(grp('GiantDiamondCluster', [
        shPath([[0, -255], [65, -145], [0, -45], [-65, -145]]),
        shPath([[-135, -215], [-55, -125], [-115, -35], [-195, -125]]),
        shPath([[135, -215], [195, -125], [115, -35], [55, -125]])
      ], { grad: ['#ffffff', '#bae6fd', '#38bdf8'], gradPts: [[0, -255], [0, -35]], stroke: '#ffffff', strokeWidth: 4.5 }));

      frontShapes.push(...makeBottomBand(['#ffffff', '#e0f2fe', '#7dd3fc'], '#0284c7', 'studs'));
      frontShapes.push(...makePeakFinials('diamonds', ['#ffffff', '#e0f2fe', '#38bdf8'], '#ffffff'));
      break;
    }

    // 22. BLOOD DRACULA (High Gothic Vampire Collar + Bat Wings + Dripping Crimson Blood Rim)
    case 'blood_dracula': {
      backAnim = 'wings';
      // High Royal Vampire Cape Collar & Bat Wings behind the crown
      backShapes.push(grp('VampireCollar', [
        shSmooth([
          [-235, 65], [-265, -115], [-165, -185], [-85, -125],
          [0, -215], [85, -125], [165, -185], [265, -115],
          [235, 65], [0, 135]
        ], true, 0.2)
      ], { grad: ['#e11d48', '#881337', '#09090b'], gradPts: [[0, -215], [0, 135]], stroke: '#fda4af', strokeWidth: 4 }));

      frontShapes.push(...makeBottomBand(['#f43f5e', '#9f1239', '#4c0519'], '#fda4af', 'drips'));
      frontShapes.push(...makePeakFinials('diamonds', ['#fda4af', '#e11d48', '#4c0519'], '#ffffff'));
      break;
    }

    // 23. ARCANE MAGIC (Spinning Sacred Geometry Magic Circle Behind + Levitating Amethyst Shards)
    case 'arcane_magic': {
      backAnim = 'spin_slow';
      // Giant Glowing Arcane Magic Circle & Hexagram Star behind the crown
      backShapes.push(grp('ArcaneMagicCircle', [
        ...shRing(0, -45, 220, 195, 24),
        shStar(0, -45, 195, 110, 6, 0)
      ], { grad: ['#fae8ff', '#d946ef', '#6b21a8'], gradPts: [[0, -265], [0, 175]], stroke: '#f5d0fe', strokeWidth: 3.5, opacity: 88 }));

      frontShapes.push(...makeBottomBand(['#f5d0fe', '#a855f7', '#4c1d95'], '#fae8ff', 'studs'));
      frontShapes.push(...makePeakFinials('diamonds', ['#fae8ff', '#d946ef', '#701a75'], '#ffffff'));
      break;
    }

    // 24. POSEIDON TRIDENT (Giant Golden 3-Pronged Trident Rising Above + Sea Monster Fins + Ocean Waves)
    case 'poseidon_trident': {
      // Giant Golden 3-Pronged Poseidon Trident towering behind and above the crown!
      backShapes.push(grp('GiantPoseidonTrident', [
        shPath([[-12, -235], [12, -235], [12, 20], [-12, 20]]),
        shPath([[0, -268], [26, -222], [-26, -222]]),
        shSmooth([[-95, -155], [-95, -215], [-65, -215], [-65, -135], [65, -135], [65, -215], [95, -215], [95, -155], [75, -105], [-75, -105]], true, 0.15),
        shPath([[-80, -248], [-56, -205], [-104, -205]]),
        shPath([[80, -248], [104, -205], [56, -205]])
      ], { grad: ['#fef08a', '#facc15', '#b45309'], gradPts: [[0, -268], [0, 0]], stroke: '#ffffff', strokeWidth: 3.5 }));

      // Sea-Dragon Aquatic Fins on left & right + Ocean Wave Base
      frontShapes.push(...makeBottomBand(['#99f6e4', '#0d9488', '#115e59'], '#fef08a', 'studs'));
      frontShapes.push(...makePeakFinials('pearls', ['#ccfbf1', '#2dd4bf', '#0f766e'], '#ffffff'));
      break;
    }

    // 25. EMERALD SULTAN (Lush Royal Turban Dome + Golden Crescent Moon & Star Finial + Peacock Plume)
    case 'emerald_sultan': {
      // Lush Pleated Sultan Royal Turban Dome inside the crown
      midShapes.push(grp('SultanTurbanDome', [
        shCircle(-75, -80, 75),
        shCircle(75, -80, 75),
        shCircle(0, -115, 88)
      ], { grad: ['#34d399', '#059669', '#064e3b'], gradPts: [[0, -205], [0, 0]], stroke: '#fde047', strokeWidth: 4.5 }));

      // Giant Golden Ottoman Crescent Moon & Star rising above the turban
      frontShapes.push(...makeBottomBand(['#fef08a', '#eab308', '#a16207'], '#064e3b', 'studs'));
      frontShapes.push(grp('SultanCrescentTop', [
        shSmooth([
          [0, -258], [-42, -238], [-55, -195], [-32, -155],
          [18, -148], [-12, -172], [-18, -205], [12, -235]
        ], true, 0.3),
        shStar(22, -198, 22, 9, 5)
      ], { grad: ['#ffffff', '#fef08a', '#eab308'], stroke: '#b45309', strokeWidth: 3 }));
      break;
    }

    // 26. LIQUID CHROME (Futuristic Y2K Chrome Spikes & Levitating Liquid Metal Spheres)
    case 'liquid_chrome': {
      frontAnim = 'float';
      // Sharp Y2K Chrome Metal Starburst behind the crown
      backShapes.push(grp('ChromeStarburst', [
        shStar(0, -45, 245, 115, 8)
      ], { grad: ['#ffffff', '#94a3b8', '#1e293b'], gradPts: [[0, -265], [0, 175]], stroke: '#38bdf8', strokeWidth: 3.5 }));

      // Floating Liquid Mercury Orbs around the crown
      frontShapes.push(...makeBottomBand(['#ffffff', '#cbd5e1', '#475569'], '#38bdf8', 'drips'));
      frontShapes.push(...makePeakFinials('pearls', ['#ffffff', '#cbd5e1', '#334155'], '#38bdf8'));
      break;
    }

    // 27. TOXIC NEON (Bubbling Radioactive Green Slime Cloud + Dripping Acid Base + Biohazard Core)
    case 'toxic_neon': {
      frontAnim = 'flame';
      // Bubbling Radioactive Acid Cloud & Bubbles rising from inside the crown
      midShapes.push(grp('ToxicSlimeBubbles', [
        shCircle(0, -145, 72),
        shCircle(-95, -105, 58),
        shCircle(95, -105, 58),
        shCircle(-45, -215, 28),
        shCircle(55, -228, 22),
        shCircle(0, -252, 16)
      ], { grad: ['#ecfccb', '#84cc16', '#365314'], gradPts: [[0, -265], [0, -40]], stroke: '#bef264', strokeWidth: 4 }));

      frontShapes.push(...makeBottomBand(['#ecfccb', '#a3e635', '#365314'], '#1a2e05', 'drips'));
      break;
    }

    // 28. ROYAL AMETHYST (Lush Purple Velvet Cap + Ermine Fur Trim + Sovereign Arches & Globus Cruciger)
    case 'royal_amethyst': {
      midShapes.push(...makeInnerRoyalDome(['#d946ef', '#7e22ce', '#3b0764'], '#fde047', '#fef08a'));
      frontShapes.push(...makeBottomBand(['#ffffff', '#f1f5f9', '#cbd5e1'], '#eab308', 'ermine'));
      frontShapes.push(grp('SovereignOrbCross', [
        shCircle(0, -185, 24),
        shStar(0, -228, 24, 8, 4, 0)
      ], { grad: ['#fef08a', '#eab308', '#a16207'], stroke: '#ffffff', strokeWidth: 3 }));
      frontShapes.push(...makePeakFinials('pearls', ['#fae8ff', '#c084fc', '#6b21a8'], '#fde047'));
      break;
    }

    // 29. SUNSET MIAMI (Giant Retro 80s Synthwave Sun Behind + Neon Palm Leaves + Cyan Grid)
    case 'sunset_miami': {
      // Giant Retro 80s Synthwave Glowing Sun behind the crown
      backShapes.push(grp('SynthwaveSun', [
        shCircle(0, -55, 195)
      ], { grad: ['#fef08a', '#f97316', '#be185d'], gradPts: [[0, -250], [0, 140]], stroke: '#22d3ee', strokeWidth: 5 }));
      // Synthwave horizontal scanline cutouts
      backShapes.push(grp('SynthwaveScanlines', [
        shPath([[-190, -25], [190, -25]], false),
        shPath([[-185, 5], [185, 5]], false),
        shPath([[-170, 35], [170, 35]], false)
      ], { stroke: '#1e1b4b', strokeWidth: 10 }));

      frontShapes.push(...makeBottomBand(['#67e8f9', '#06b6d4', '#0e7490'], '#f472b6', 'studs'));
      frontShapes.push(...makePeakFinials('stars', ['#67e8f9', '#22d3ee', '#0284c7'], '#ffffff'));
      break;
    }

    // 30. IMPERIAL CLASSIC (True Sovereign Monarch Crown: Crimson Velvet Dome + White Ermine Fur + Golden Globus Cruciger)
    default: {
      midShapes.push(...makeInnerRoyalDome(['#ef4444', '#b91c1c', '#7f1d1d'], '#facc15', '#fef08a'));
      frontShapes.push(...makeBottomBand(['#ffffff', '#f1f5f9', '#cbd5e1'], '#eab308', 'ermine'));
      frontShapes.push(grp('ClassicGlobusCruciger', [
        shCircle(0, -185, 24),
        shStar(0, -228, 24, 8, 4, 0)
      ], { grad: ['#ffffff', '#fef08a', '#eab308'], stroke: '#b45309', strokeWidth: 3 }));
      frontShapes.push(...makePeakFinials('pearls', ['#ffffff', '#fef08a', '#eab308'], '#b45309'));
      break;
    }
  }

  return { backShapes, midShapes, frontShapes, frontAnim, backAnim };
}

// Build rich 3D-traveling Center Emblem groups at [265.173, 339.649] inside `камни` & `камни 2`
function buildCenterEmblemGroups(emblemType, accentHex, secondaryHex = '#ffffff') {
  const c = [265.173, 339.649];
  const groups = [];

  switch (emblemType) {
    case 'shadow_flame': {
      groups.push(grp('ShadowOuterFlame', [
        shSmooth([[0, -38], [24, -12], [16, 26], [0, 38], [-16, 26], [-24, -12]], true, 0.25)
      ], { grad: ['#e9d5ff', '#9333ea', '#3b0764'], stroke: '#38bdf8', strokeWidth: 3, pos: c }));
      groups.push(grp('ShadowInnerCore', [
        shSmooth([[0, -22], [10, -2], [0, 24], [-10, -2]], true, 0.25)
      ], { fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2, pos: c }));
      break;
    }
    case 'timur_tamgha': {
      groups.push(grp('TimurRings', [
        shCircle(0, -14, 11),
        shCircle(-13, 11, 11),
        shCircle(13, 11, 11)
      ], { fill: '#fde047', stroke: '#92400e', strokeWidth: 3.5, pos: c }));
      break;
    }
    case 'vip_crown': {
      groups.push(grp('VipCrownShield', [
        shPath([[-26, 14], [-30, -14], [-12, 2], [0, -24], [12, 2], [30, -14], [26, 14]])
      ], { grad: ['#ffffff', '#facc15', '#a16207'], stroke: '#18181b', strokeWidth: 3, pos: c }));
      break;
    }
    case 'bitcoin': {
      groups.push(grp('BtcCoin', [
        shCircle(0, 0, 32)
      ], { grad: ['#fef08a', '#f59e0b', '#b45309'], stroke: '#ffffff', strokeWidth: 3.5, pos: c }));
      groups.push(grp('BtcSymbol', [
        shPath([[-9, -17], [7, -17], [13, -10], [7, -2], [15, 5], [9, 16], [-9, 16]], false),
        shPath([[-3, -24], [-3, 24]], false),
        shPath([[5, -24], [5, 24]], false)
      ], { stroke: '#ffffff', strokeWidth: 4.5, pos: c }));
      break;
    }
    case 'sauron_eye': {
      groups.push(grp('EyeOuter', [
        shSmooth([[-34, 0], [-16, -20], [0, -24], [16, -20], [34, 0], [16, 20], [0, 24], [-16, 20]], true, 0.25)
      ], { grad: ['#fef08a', '#f97316', '#991b1b'], stroke: '#fde047', strokeWidth: 3, pos: c }));
      groups.push(grp('EyeSlit', [
        shPath([[0, -20], [6, 0], [0, 20], [-6, 0]])
      ], { fill: '#090504', stroke: '#fef08a', strokeWidth: 1.8, pos: c }));
      break;
    }
    case 'ton_crystal': {
      groups.push(grp('TonGemSymbol', [
        shPath([[-26, -18], [26, -18], [0, 28]]),
        shPath([[0, -18], [0, 28]], false),
        shPath([[-26, -18], [0, -4], [26, -18]], false)
      ], { stroke: '#ffffff', strokeWidth: 4.5, pos: c }));
      break;
    }
    case 'sharingan': {
      groups.push(grp('SharinganEye', [
        shCircle(0, 0, 30)
      ], { grad: ['#fb7185', '#e11d48', '#881337'], stroke: '#09090b', strokeWidth: 4, pos: c }));
      groups.push(grp('SharinganTomoe', [
        shCircle(0, 0, 7),
        shCircle(0, -17, 5),
        shCircle(15, 9, 5),
        shCircle(-15, 9, 5)
      ], { fill: '#09090b', pos: c }));
      break;
    }
    case 'rolex_gear': {
      groups.push(grp('TourbillonCog', [
        shStar(0, 0, 30, 21, 12),
        shCircle(0, 0, 10)
      ], { grad: ['#ffffff', '#facc15', '#a16207'], stroke: '#064e3b', strokeWidth: 3, pos: c }));
      break;
    }
    case 'paxta_cotton': {
      groups.push(grp('CottonBollEmblem', [
        shCircle(0, -11, 14),
        shCircle(-12, 4, 13),
        shCircle(12, 4, 13)
      ], { fill: '#ffffff', stroke: '#eab308', strokeWidth: 3, pos: c }));
      groups.push(grp('CottonLeaves', [
        shPath([[-20, 12], [0, 26], [20, 12], [0, 6]])
      ], { fill: '#eab308', pos: c }));
      break;
    }
    case 'venom_spider': {
      groups.push(grp('VenomSpiderEmblem', [
        shPath([[0, -26], [13, 0], [0, 26], [-13, 0]]),
        shPath([[-28, -18], [-11, -4], [-28, 18]], false),
        shPath([[28, -18], [11, -4], [28, 18]], false)
      ], { fill: '#ffffff', stroke: '#ffffff', strokeWidth: 3.5, pos: c }));
      break;
    }
    default: {
      groups.push(grp('GemStarBurst', [
        shStar(0, 0, 24, 7, 4)
      ], { fill: '#ffffff', opacity: 90, pos: c }));
      break;
    }
  }
  return groups;
}

// ============================================================================
// THE 30 APPROVED IMPERIAL CROWN MODELS (Sum of rarity = 1000 permille = 100%)
// ============================================================================
const MODELS_SPEC = [
  {
    id: 'shadow_monarch',
    name: 'Shadow Monarch',
    rarity: 5,
    bodyGrad: ['#3b0764', '#1e0944', '#090414'],
    backGrad: ['#2e1065', '#0f0720', '#05020a'],
    rimGrad: ['#e9d5ff', '#9333ea', '#3b0764'],
    sheenGrad: ['#38bdf8', '#a855f7', '#581c87'],
    contour: '#c084fc',
    centerGem: ['#e9d5ff', '#9333ea', '#3b0764'],
    centerStroke: '#38bdf8',
    leftJewel: ['#38bdf8', '#0284c7'],
    rightJewel: ['#c084fc', '#6b21a8'],
    sparkle: '#38bdf8',
    emblem: 'shadow_flame'
  },
  {
    id: 'amir_temur',
    name: 'Amir Temur',
    rarity: 5,
    bodyGrad: ['#fde047', '#eab308', '#b45309'],
    backGrad: ['#06b6d4', '#0284c7', '#1e3a8a'],
    rimGrad: ['#ffffff', '#fef08a', '#f59e0b'],
    sheenGrad: ['#ffffff', '#fde047', '#f59e0b'],
    contour: '#b45309',
    centerGem: ['#fda4af', '#e11d48', '#881337'],
    centerStroke: '#fef08a',
    leftJewel: ['#2dd4bf', '#0f766e'],
    rightJewel: ['#fb7185', '#be123c'],
    sparkle: '#fef08a',
    emblem: 'timur_tamgha'
  },
  {
    id: 'black_gold_vip',
    name: 'Black Gold VIP',
    rarity: 8,
    bodyGrad: ['#3f3f46', '#18181b', '#09090b'],
    backGrad: ['#27272a', '#09090b', '#000000'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#fef9c3', '#facc15', '#ca8a04'],
    contour: '#facc15',
    centerGem: ['#71717a', '#27272a', '#09090b'],
    centerStroke: '#facc15',
    leftJewel: ['#facc15', '#a16207'],
    rightJewel: ['#facc15', '#a16207'],
    sparkle: '#fde047',
    emblem: 'vip_crown'
  },
  {
    id: 'satoshi_nakamoto',
    name: 'Satoshi Nakamoto',
    rarity: 10,
    bodyGrad: ['#fde047', '#f97316', '#9a3412'],
    backGrad: ['#f59e0b', '#ea580c', '#7c2d12'],
    rimGrad: ['#ffffff', '#fde047', '#f97316'],
    sheenGrad: ['#ffffff', '#fed7aa', '#f97316'],
    contour: '#c2410c',
    centerGem: ['#fed7aa', '#f97316', '#9a3412'],
    centerStroke: '#fef08a',
    leftJewel: ['#4ade80', '#15803d'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#4ade80',
    emblem: 'bitcoin'
  },
  {
    id: 'eye_of_sauron',
    name: 'Eye of Sauron',
    rarity: 10,
    bodyGrad: ['#44403c', '#1c1917', '#0c0a09'],
    backGrad: ['#292524', '#0c0a09', '#000000'],
    rimGrad: ['#fde047', '#f97316', '#dc2626'],
    sheenGrad: ['#fef08a', '#ef4444', '#7f1d1d'],
    contour: '#ea580c',
    centerGem: ['#fde047', '#ea580c', '#7f1d1d'],
    centerStroke: '#f97316',
    leftJewel: ['#ef4444', '#7f1d1d'],
    rightJewel: ['#f97316', '#9a3412'],
    sparkle: '#fb923c',
    emblem: 'sauron_eye'
  },
  {
    id: 'ton_crystal',
    name: 'TON Crystal',
    rarity: 15,
    bodyGrad: ['#7dd3fc', '#0284c7', '#1e3a8a'],
    backGrad: ['#0284c7', '#0369a1', '#0f172a'],
    rimGrad: ['#ffffff', '#bae6fd', '#38bdf8'],
    sheenGrad: ['#ffffff', '#7dd3fc', '#0284c7'],
    contour: '#bae6fd',
    centerGem: ['#e0f2fe', '#38bdf8', '#0369a1'],
    centerStroke: '#ffffff',
    leftJewel: ['#60a5fa', '#1d4ed8'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#ffffff',
    emblem: 'ton_crystal'
  },
  {
    id: 'julius_caesar',
    name: 'Julius Caesar',
    rarity: 15,
    bodyGrad: ['#ffffff', '#e2e8f0', '#94a3b8'],
    backGrad: ['#e2e8f0', '#cbd5e1', '#64748b'],
    rimGrad: ['#fef08a', '#eab308', '#ca8a04'],
    sheenGrad: ['#ffffff', '#fef08a', '#eab308'],
    contour: '#ca8a04',
    centerGem: ['#fca5a5', '#dc2626', '#7f1d1d'],
    centerStroke: '#facc15',
    leftJewel: ['#ef4444', '#991b1b'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'default'
  },
  {
    id: 'akatsuki_cloud',
    name: 'Akatsuki Cloud',
    rarity: 15,
    bodyGrad: ['#27272a', '#18181b', '#09090b'],
    backGrad: ['#18181b', '#09090b', '#000000'],
    rimGrad: ['#fda4af', '#e11d48', '#881337'],
    sheenGrad: ['#fecdd3', '#f43f5e', '#9f1239'],
    contour: '#e11d48',
    centerGem: ['#fda4af', '#e11d48', '#4c0519'],
    centerStroke: '#18181b',
    leftJewel: ['#f43f5e', '#881337'],
    rightJewel: ['#f43f5e', '#881337'],
    sparkle: '#fb7185',
    emblem: 'sharingan'
  },
  {
    id: 'rolex_prestige',
    name: 'Rolex Prestige',
    rarity: 18,
    bodyGrad: ['#10b981', '#047857', '#064e3b'],
    backGrad: ['#059669', '#065f46', '#022c22'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#fef9c3', '#facc15', '#ca8a04'],
    contour: '#facc15',
    centerGem: ['#fef08a', '#eab308', '#854d0e'],
    centerStroke: '#fef08a',
    leftJewel: ['#34d399', '#065f46'],
    rightJewel: ['#34d399', '#065f46'],
    sparkle: '#fde047',
    emblem: 'rolex_gear'
  },
  {
    id: 'frozen_lich',
    name: 'Frozen Lich',
    rarity: 18,
    bodyGrad: ['#e0f2fe', '#38bdf8', '#0369a1'],
    backGrad: ['#bae6fd', '#0284c7', '#1e3a8a'],
    rimGrad: ['#ffffff', '#e0f2fe', '#7dd3fc'],
    sheenGrad: ['#ffffff', '#bae6fd', '#38bdf8'],
    contour: '#ffffff',
    centerGem: ['#ffffff', '#7dd3fc', '#0369a1'],
    centerStroke: '#ffffff',
    leftJewel: ['#a5f3fc', '#0891b2'],
    rightJewel: ['#a5f3fc', '#0891b2'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'cyberpunk_2077',
    name: 'Cyberpunk 2077',
    rarity: 20,
    bodyGrad: ['#fde047', '#eab308', '#ca8a04'],
    backGrad: ['#06b6d4', '#0891b2', '#1e1b4b'],
    rimGrad: ['#22d3ee', '#ec4899', '#a855f7'],
    sheenGrad: ['#67e8f9', '#22d3ee', '#0891b2'],
    contour: '#ec4899',
    centerGem: ['#67e8f9', '#06b6d4', '#164e63'],
    centerStroke: '#ec4899',
    leftJewel: ['#f472b6', '#be185d'],
    rightJewel: ['#22d3ee', '#0e7490'],
    sparkle: '#22d3ee',
    emblem: 'default'
  },
  {
    id: 'paxta_imperial',
    name: 'Paxta Imperial',
    rarity: 20,
    bodyGrad: ['#fef08a', '#eab308', '#b45309'],
    backGrad: ['#fde047', '#ca8a04', '#92400e'],
    rimGrad: ['#ffffff', '#fef08a', '#f59e0b'],
    sheenGrad: ['#ffffff', '#fef9c3', '#facc15'],
    contour: '#b45309',
    centerGem: ['#ffffff', '#bae6fd', '#0284c7'],
    centerStroke: '#facc15',
    leftJewel: ['#34d399', '#059669'],
    rightJewel: ['#38bdf8', '#0284c7'],
    sparkle: '#ffffff',
    emblem: 'paxta_cotton'
  },
  {
    id: 'archangel',
    name: 'Archangel',
    rarity: 25,
    bodyGrad: ['#ffffff', '#f1f5f9', '#cbd5e1'],
    backGrad: ['#f8fafc', '#e2e8f0', '#94a3b8'],
    rimGrad: ['#fef08a', '#facc15', '#ca8a04'],
    sheenGrad: ['#ffffff', '#fef9c3', '#fde047'],
    contour: '#eab308',
    centerGem: ['#fef9c3', '#facc15', '#a16207'],
    centerStroke: '#ffffff',
    leftJewel: ['#bae6fd', '#0284c7'],
    rightJewel: ['#bae6fd', '#0284c7'],
    sparkle: '#fef08a',
    emblem: 'default'
  },
  {
    id: 'hellfire_demon',
    name: 'Hellfire Demon',
    rarity: 25,
    bodyGrad: ['#991b1b', '#450a0a', '#09090b'],
    backGrad: ['#7f1d1d', '#27272a', '#000000'],
    rimGrad: ['#fde047', '#f97316', '#dc2626'],
    sheenGrad: ['#fca5a5', '#ef4444', '#991b1b'],
    contour: '#f97316',
    centerGem: ['#fde047', '#ef4444', '#7f1d1d'],
    centerStroke: '#fde047',
    leftJewel: ['#f97316', '#9a3412'],
    rightJewel: ['#f97316', '#9a3412'],
    sparkle: '#fde047',
    emblem: 'default'
  },
  {
    id: 'sakura_emperor',
    name: 'Sakura Emperor',
    rarity: 30,
    bodyGrad: ['#fbcfe8', '#f472b6', '#be185d'],
    backGrad: ['#f9a8d4', '#ec4899', '#9d174d'],
    rimGrad: ['#ffffff', '#fce7f3', '#f472b6'],
    sheenGrad: ['#ffffff', '#fbcfe8', '#ec4899'],
    contour: '#be185d',
    centerGem: ['#ffe4e6', '#fb7185', '#be123c'],
    centerStroke: '#ffffff',
    leftJewel: ['#f9a8d4', '#db2777'],
    rightJewel: ['#f9a8d4', '#db2777'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'matrix_hacker',
    name: 'Matrix Hacker',
    rarity: 30,
    bodyGrad: ['#14532d', '#052e16', '#020617'],
    backGrad: ['#064e3b', '#022c22', '#000000'],
    rimGrad: ['#86efac', '#22c55e', '#15803d'],
    sheenGrad: ['#bbf7d0', '#4ade80', '#166534'],
    contour: '#4ade80',
    centerGem: ['#86efac', '#16a34a', '#052e16'],
    centerStroke: '#4ade80',
    leftJewel: ['#4ade80', '#15803d'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#4ade80',
    emblem: 'default'
  },
  {
    id: 'pharaoh_tut',
    name: 'Pharaoh Tut',
    rarity: 30,
    bodyGrad: ['#facc15', '#d97706', '#1e3a8a'],
    backGrad: ['#eab308', '#1d4ed8', '#172554'],
    rimGrad: ['#fef08a', '#f59e0b', '#1d4ed8'],
    sheenGrad: ['#fef9c3', '#facc15', '#b45309'],
    contour: '#fef08a',
    centerGem: ['#60a5fa', '#1d4ed8', '#172554'],
    centerStroke: '#facc15',
    leftJewel: ['#2dd4bf', '#0f766e'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'default'
  },
  {
    id: 'supernova',
    name: 'Supernova',
    rarity: 35,
    bodyGrad: ['#818cf8', '#4f46e5', '#1e1b4b'],
    backGrad: ['#6366f1', '#3730a3', '#0f172a'],
    rimGrad: ['#f0abfc', '#c084fc', '#6366f1'],
    sheenGrad: ['#ffffff', '#e879f9', '#6366f1'],
    contour: '#e879f9',
    centerGem: ['#f5d0fe', '#a855f7', '#3b0764'],
    centerStroke: '#ffffff',
    leftJewel: ['#38bdf8', '#0369a1'],
    rightJewel: ['#f472b6', '#be185d'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'midas_touch',
    name: 'Midas Touch',
    rarity: 35,
    bodyGrad: ['#fef08a', '#facc15', '#ca8a04'],
    backGrad: ['#fde047', '#eab308', '#a16207'],
    rimGrad: ['#ffffff', '#fef9c3', '#facc15'],
    sheenGrad: ['#ffffff', '#fef08a', '#eab308'],
    contour: '#a16207',
    centerGem: ['#fef9c3', '#facc15', '#a16207'],
    centerStroke: '#ffffff',
    leftJewel: ['#fde047', '#ca8a04'],
    rightJewel: ['#fde047', '#ca8a04'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'venom_symbiote',
    name: 'Venom Symbiote',
    rarity: 35,
    bodyGrad: ['#334155', '#0f172a', '#020617'],
    backGrad: ['#1e293b', '#09090b', '#000000'],
    rimGrad: ['#ffffff', '#cbd5e1', '#475569'],
    sheenGrad: ['#ffffff', '#94a3b8', '#1e293b'],
    contour: '#ffffff',
    centerGem: ['#f8fafc', '#475569', '#09090b'],
    centerStroke: '#ffffff',
    leftJewel: ['#f8fafc', '#334155'],
    rightJewel: ['#f8fafc', '#334155'],
    sparkle: '#ffffff',
    emblem: 'venom_spider'
  },
  {
    id: 'diamond_ice',
    name: 'Diamond Ice',
    rarity: 45,
    bodyGrad: ['#ffffff', '#e2e8f0', '#94a3b8'],
    backGrad: ['#f1f5f9', '#cbd5e1', '#64748b'],
    rimGrad: ['#ffffff', '#e0f2fe', '#bae6fd'],
    sheenGrad: ['#ffffff', '#f1f5f9', '#cbd5e1'],
    contour: '#38bdf8',
    centerGem: ['#ffffff', '#bae6fd', '#0284c7'],
    centerStroke: '#ffffff',
    leftJewel: ['#e0f2fe', '#0284c7'],
    rightJewel: ['#e0f2fe', '#0284c7'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'blood_dracula',
    name: 'Blood Dracula',
    rarity: 45,
    bodyGrad: ['#4c0519', '#18181b', '#09090b'],
    backGrad: ['#881337', '#09090b', '#000000'],
    rimGrad: ['#fda4af', '#e11d48', '#881337'],
    sheenGrad: ['#fecdd3', '#f43f5e', '#881337'],
    contour: '#f43f5e',
    centerGem: ['#fecdd3', '#e11d48', '#4c0519'],
    centerStroke: '#fda4af',
    leftJewel: ['#f43f5e', '#881337'],
    rightJewel: ['#f43f5e', '#881337'],
    sparkle: '#fda4af',
    emblem: 'default'
  },
  {
    id: 'arcane_magic',
    name: 'Arcane Magic',
    rarity: 50,
    bodyGrad: ['#c084fc', '#7e22ce', '#3b0764'],
    backGrad: ['#a855f7', '#6b21a8', '#2e1065'],
    rimGrad: ['#f5d0fe', '#d946ef', '#86198f'],
    sheenGrad: ['#fae8ff', '#e879f9', '#7e22ce'],
    contour: '#f5d0fe',
    centerGem: ['#f5d0fe', '#d946ef', '#701a75'],
    centerStroke: '#fae8ff',
    leftJewel: ['#e879f9', '#86198f'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#f5d0fe',
    emblem: 'default'
  },
  {
    id: 'poseidon_trident',
    name: 'Poseidon Trident',
    rarity: 50,
    bodyGrad: ['#2dd4bf', '#0d9488', '#115e59'],
    backGrad: ['#14b8a6', '#0f766e', '#134e4a'],
    rimGrad: ['#fef08a', '#facc15', '#ca8a04'],
    sheenGrad: ['#ccfbf1', '#2dd4bf', '#0f766e'],
    contour: '#facc15',
    centerGem: ['#99f6e4', '#14b8a6', '#134e4a'],
    centerStroke: '#facc15',
    leftJewel: ['#38bdf8', '#0369a1'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#99f6e4',
    emblem: 'default'
  },
  {
    id: 'emerald_sultan',
    name: 'Emerald Sultan',
    rarity: 55,
    bodyGrad: ['#34d399', '#059669', '#064e3b'],
    backGrad: ['#10b981', '#047857', '#022c22'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#d1fae5', '#34d399', '#047857'],
    contour: '#facc15',
    centerGem: ['#6ee7b7', '#10b981', '#064e3b'],
    centerStroke: '#fde047',
    leftJewel: ['#fde047', '#b45309'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'default'
  },
  {
    id: 'liquid_chrome',
    name: 'Liquid Chrome',
    rarity: 55,
    bodyGrad: ['#f8fafc', '#94a3b8', '#334155'],
    backGrad: ['#cbd5e1', '#64748b', '#1e293b'],
    rimGrad: ['#ffffff', '#cbd5e1', '#64748b'],
    sheenGrad: ['#ffffff', '#e2e8f0', '#64748b'],
    contour: '#38bdf8',
    centerGem: ['#e0f2fe', '#38bdf8', '#0369a1'],
    centerStroke: '#ffffff',
    leftJewel: ['#c084fc', '#6b21a8'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#ffffff',
    emblem: 'default'
  },
  {
    id: 'toxic_neon',
    name: 'Toxic Neon',
    rarity: 60,
    bodyGrad: ['#a3e635', '#4d7c0f', '#1a2e05'],
    backGrad: ['#65a30d', '#365314', '#09090b'],
    rimGrad: ['#ecfccb', '#bef264', '#65a30d'],
    sheenGrad: ['#ecfccb', '#a3e635', '#4d7c0f'],
    contour: '#ecfccb',
    centerGem: ['#ecfccb', '#84cc16', '#1a2e05'],
    centerStroke: '#ecfccb',
    leftJewel: ['#fde047', '#a16207'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#bef264',
    emblem: 'default'
  },
  {
    id: 'royal_amethyst',
    name: 'Royal Amethyst',
    rarity: 60,
    bodyGrad: ['#e879f9', '#9333ea', '#4c1d95'],
    backGrad: ['#c084fc', '#7e22ce', '#2e1065'],
    rimGrad: ['#fef08a', '#facc15', '#b45309'],
    sheenGrad: ['#fae8ff', '#d8b4fe', '#7e22ce'],
    contour: '#facc15',
    centerGem: ['#f5d0fe', '#a855f7', '#4c1d95'],
    centerStroke: '#fde047',
    leftJewel: ['#f472b6', '#be185d'],
    rightJewel: ['#c084fc', '#6b21a8'],
    sparkle: '#fae8ff',
    emblem: 'default'
  },
  {
    id: 'sunset_miami',
    name: 'Sunset Miami',
    rarity: 60,
    bodyGrad: ['#fb7185', '#f97316', '#7c2d12'],
    backGrad: ['#f43f5e', '#ea580c', '#581c87'],
    rimGrad: ['#fef08a', '#fb923c', '#e11d48'],
    sheenGrad: ['#fef9c3', '#fdba74', '#e11d48'],
    contour: '#22d3ee',
    centerGem: ['#67e8f9', '#06b6d4', '#0e7490'],
    centerStroke: '#fde047',
    leftJewel: ['#22d3ee', '#0e7490'],
    rightJewel: ['#f472b6', '#be185d'],
    sparkle: '#fde047',
    emblem: 'default'
  },
  {
    id: 'imperial_classic',
    name: 'Imperial Classic',
    rarity: 61,
    bodyGrad: ['#fde047', '#eab308', '#a16207'],
    backGrad: ['#facc15', '#ca8a04', '#854d0e'],
    rimGrad: ['#ffffff', '#fef08a', '#eab308'],
    sheenGrad: ['#ffffff', '#fef08a', '#ca8a04'],
    contour: '#9b6619',
    centerGem: ['#75d5ff', '#2ca8ee', '#137ce9'],
    centerStroke: '#004cd3',
    leftJewel: ['#22c55e', '#15803d'],
    rightJewel: ['#e11d48', '#9f1239'],
    sparkle: '#ffe605',
    emblem: 'default'
  }
];

function customizeCrownLottie(baseData, spec) {
  const data = structuredClone(baseData);

  const [b1, b2, b3] = spec.bodyGrad.map(hexToRgb01);
  const [bk1, bk2, bk3] = spec.backGrad.map(hexToRgb01);
  const [r1, r2, r3] = spec.rimGrad.map(hexToRgb01);
  const [s1, s2, s3] = spec.sheenGrad.map(hexToRgb01);
  const contourRgb = hexToRgb01(spec.contour);
  const sparkleRgb = hexToRgb01(spec.sparkle);
  const facetHexes = buildFacetColors(spec.centerGem[0], spec.centerGem[1], spec.centerGem[2]);
  const centerStrokeRgb = hexToRgb01(spec.centerStroke);
  const [ljFill, ljStroke] = spec.leftJewel.map(hexToRgb01);
  const [rjFill, rjStroke] = spec.rightJewel.map(hexToRgb01);

  for (const l of data.layers) {
    if ([1, 2, 3, 4, 5].includes(l.ind)) {
      const fl = l.shapes?.[0]?.it?.find(x => x.ty === 'fl');
      if (fl) fl.c.k = [...sparkleRgb, 1];
    }
    if (l.ind === 7) {
      const st = l.shapes?.[0]?.it?.find(x => x.ty === 'st');
      if (st) st.c.k = [...contourRgb, 1];
    }
    if (l.ind === 8 || l.ind === 9) {
      const g2 = l.shapes?.find(g => g.nm === 'Group 2');
      if (g2) {
        const st = g2.it.find(x => x.ty === 'st');
        const fl = g2.it.find(x => x.ty === 'fl');
        if (st) st.c.k = [...ljStroke, 1];
        if (fl) fl.c.k = [...ljFill, 1];
      }
    }
    if (l.ind === 10 || l.ind === 11) {
      const g2 = l.shapes?.find(g => g.nm === 'Group 2');
      if (g2) {
        const st = g2.it.find(x => x.ty === 'st');
        const fl = g2.it.find(x => x.ty === 'fl');
        if (st) st.c.k = [...rjStroke, 1];
        if (fl) fl.c.k = [...rjFill, 1];
      }
    }
    if (l.ind === 12 || l.ind === 15) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) gf.g.k.k = [0, ...s1, 0.5, ...s2, 1, ...s3];
    }
    if (l.ind === 13 || l.ind === 14) {
      const g1 = l.shapes?.find(g => g.nm === 'Group 1');
      if (g1) {
        const st = g1.it.find(x => x.ty === 'st');
        if (st) st.c.k = [...centerStrokeRgb, 1];
      }
      for (let gi = 2; gi <= 13; gi++) {
        const grpEl = l.shapes?.find(g => g.nm === `Group ${gi}`);
        if (grpEl) {
          const fl = grpEl.it.find(x => x.ty === 'fl');
          if (fl) fl.c.k = [...hexToRgb01(facetHexes[gi - 2]), 1];
        }
      }
      const emblemGroups = buildCenterEmblemGroups(spec.emblem, spec.rimGrad[0], '#ffffff');
      if (emblemGroups.length) {
        l.shapes.unshift(...emblemGroups);
      }
    }
    if (l.ind === 16) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) gf.g.k.k = [0.054, ...r1, 0.508, ...r2, 0.962, ...r3, 0.054, 1, 0.508, 0.5, 0.962, 0];
    }
    if (l.ind === 17) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) gf.g.k.k = [0, ...b1, 0.5, ...b2, 1, ...b3];
    }
    if (l.ind === 18) {
      const st = l.shapes?.[0]?.it?.find(x => x.ty === 'st');
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (st) st.c.k = [...contourRgb, 1];
      if (gf) gf.g.k.k = [0, ...bk1, 0.5, ...bk2, 1, ...bk3];
    }
  }

  // Inject bespoke 3-layer architectural transformation:
  // 1. FrontPropLayer (in front of crown body, right after sparkles ind 1..5)
  // 2. MidDomeLayer (between Перед ind 17 and Зад ind 18)
  // 3. BackPropLayer (behind Зад ind 18, right before NULL CONTROL ind 19)
  const arch = buildModelArchitecture(spec.id);

  if (arch.frontShapes.length) {
    const frontLayer = makeCrownLayer('ModelFrontArchitecture', 60, arch.frontShapes, arch.frontAnim);
    data.layers.splice(5, 0, frontLayer);
  }

  if (arch.midShapes.length) {
    const midLayer = makeCrownLayer('ModelInnerDome', 61, arch.midShapes, 'static');
    const zadIdx = data.layers.findIndex(l => l.ind === 18);
    data.layers.splice(zadIdx, 0, midLayer);
  }

  if (arch.backShapes.length) {
    const backLayer = makeCrownLayer('ModelBackAura', 62, arch.backShapes, arch.backAnim);
    const nullIdx = data.layers.findIndex(l => l.ind === 19);
    data.layers.splice(nullIdx, 0, backLayer);
  }

  // Gently scale NULL CONTROL to 88% so towering wings, tridents, plumes & halos fit inside 512x512 without clipping!
  const nullLayer = data.layers.find(l => l.ind === 19);
  if (nullLayer && nullLayer.ks) {
    nullLayer.ks.s = { a: 0, k: [88, 88, 100] };
  }

  return data;
}

// ============================================================================
// EXACT FRAME-0 LOTTIE -> SVG RENDERER (100% matching vector thumbnail!)
// ============================================================================
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

  const nullLayer = lottieData.layers.find(l => l.ind === 19);
  const nullScale = (evalAnimProp(nullLayer?.ks?.s)?.[0] ?? 100) / 100;
  const layersBottomUp = [...lottieData.layers].reverse();

  for (const layer of layersBottomUp) {
    if (layer.ty !== 4) continue;
    if ([9, 10, 13, 15].includes(layer.ind)) continue;

    const p = evalAnimProp(layer.ks?.p) || [0, 0, 0];
    const a = evalAnimProp(layer.ks?.a) || [0, 0, 0];
    let s = evalAnimProp(layer.ks?.s) || [100, 100, 100];
    if ([1, 2, 3, 4, 5].includes(layer.ind)) {
      s = [120, 120, 100];
    }

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
        const gTransform = `translate(${gp[0] || 0}, ${gp[1] || 0}) rotate(${gr || 0}) scale(${(gs[0] ?? 100) / 100}, ${(gs[1] ?? 100) / 100}) translate(${-(ga[0] || 0)}, ${-(ga[1] || 0)})`;
        const pathEls = paths.map(d => `<path d="${d}" fill="${fillAttr}" fill-opacity="${fillOp}" stroke="${strokeAttr}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
        groupMarkup.push(`<g transform="${gTransform}">${pathEls}</g>`);
      }
    }

    if (groupMarkup.length) {
      const lTransform = `translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${sx.toFixed(3)}, ${sy.toFixed(3)}) translate(${ax.toFixed(2)}, ${ay.toFixed(2)})`;
      bodyEls.push(`<g transform="${lTransform}">${groupMarkup.join('')}</g>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>${defs.join('')}</defs>
  <g transform="translate(252.95, 269.20) scale(${nullScale.toFixed(3)}, ${nullScale.toFixed(3)}) translate(-60, -60)">
    ${bodyEls.join('\n    ')}
  </g>
</svg>`;
}

// 1. Save base Imperial Crown .tgs, .json and .svg
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'base.tgs'), rawTgs);
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'base.json'), JSON.stringify(baseLottie));
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'thumb.svg'), lottieToSvg(baseLottie));

// 2. Generate all 30 Epic Upgrade Models (.tgs + .json + .svg)
const modelsOut = [];
MODELS_SPEC.forEach((spec, idx) => {
  const customLottie = customizeCrownLottie(baseLottie, spec);
  const jsonStr = JSON.stringify(customLottie);
  const tgsBuf = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
  const svgStr = lottieToSvg(customLottie);

  const jsonRel = `/a/imperialcrown/m${idx}.json`;
  const svgRel = `/a/imperialcrown/m${idx}.svg`;

  fs.writeFileSync(path.join(OUT_ASSET_DIR, `m${idx}.tgs`), tgsBuf);
  fs.writeFileSync(path.join(OUT_ASSET_DIR, `m${idx}.json`), jsonStr);
  fs.writeFileSync(path.join(OUT_ASSET_DIR, `m${idx}.svg`), svgStr);

  modelsOut.push({
    id: spec.id,
    name: spec.name,
    count: Math.max(1, Math.round((spec.rarity / 1000) * 250)),
    permille: spec.rarity,
    rarity: spec.rarity,
    pct: +(spec.rarity / 10).toFixed(1),
    crafted: false,
    tier: null,
    img: svgRel,
    tgs: jsonRel
  });
});

// 3. Load backdrops & symbols from coinflip.json, and keep craftModels: [] as requested
const coinflipCol = JSON.parse(fs.readFileSync(COINFLIP_JSON_PATH, 'utf8'));

const imperialCrownCollection = {
  slug: 'imperialcrown',
  name: 'Imperial Crown',
  plural: 'Imperial Crowns',
  supply: 250,
  minted: 0,
  circulating: 250,
  base: 1000,
  price: 1000,
  upgrade: 500,
  upgradePrice: 500,
  enabled: true,
  thumb: '/a/imperialcrown/thumb.svg',
  baseTgs: '/a/imperialcrown/base.json',
  models: modelsOut,
  craftModels: [],
  backdrops: coinflipCol.backdrops,
  symbols: coinflipCol.symbols
};

fs.writeFileSync(OUT_JSON_PATH, JSON.stringify(imperialCrownCollection, null, 2));

// 4. Update data/index.json
const indexPath = path.join(__dirname, '..', 'data', 'index.json');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const indexEntry = {
  slug: 'imperialcrown',
  name: 'Imperial Crown',
  supply: 250,
  minted: 0,
  circulating: 250,
  price: 1000,
  upgradePrice: 500,
  enabled: true,
  thumb: '/a/imperialcrown/thumb.svg',
  baseTgs: '/a/imperialcrown/base.json',
  modelsCount: modelsOut.length,
  craftModelsCount: 0,
  backdropsCount: (coinflipCol.backdrops || []).length,
  symbolsCount: (coinflipCol.symbols || []).length
};
const existingIdx = indexData.findIndex(c => c.slug === 'imperialcrown');
if (existingIdx >= 0) {
  indexData[existingIdx] = indexEntry;
} else {
  indexData.unshift(indexEntry);
}
fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));

console.log(`Generated 30 bespoke architectural Imperial Crown models (.tgs, .json, .svg) with craftModels=[]`);
