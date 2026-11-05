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

// Helper: hex '#rrggbb' -> [r, g, b] in 0..1 for Lottie
function hexToRgb01(hex) {
  const clean = String(hex).replace(/^#/, '');
  const n = parseInt(clean, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Helper: interpolate two hex colors
function mixHex(h1, h2, t) {
  const a = hexToRgb01(h1);
  const b = hexToRgb01(h2);
  const r = Math.round((a[0] + (b[0] - a[0]) * t) * 255);
  const g = Math.round((a[1] + (b[1] - a[1]) * t) * 255);
  const bl = Math.round((a[2] + (b[2] - a[2]) * t) * 255);
  return '#' + [r, g, bl].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Build a 12-facet gem palette from [lightHex, midHex, darkHex]
function buildFacetColors(lightHex, midHex, darkHex) {
  return [
    mixHex(lightHex, midHex, 0.25), // Group 2
    mixHex(midHex, darkHex, 0.2),   // Group 3
    mixHex(lightHex, '#ffffff', 0.15), // Group 4
    darkHex,                        // Group 5
    midHex,                         // Group 6
    mixHex(midHex, darkHex, 0.35),  // Group 7
    mixHex(lightHex, '#ffffff', 0.45), // Group 8
    lightHex,                       // Group 9
    mixHex(midHex, darkHex, 0.55),  // Group 10
    lightHex,                       // Group 11
    mixHex(lightHex, midHex, 0.5),  // Group 12
    mixHex(lightHex, '#ffffff', 0.25)  // Group 13
  ];
}

// Helper to create a Lottie closed polygon/bezier shape item
function makeBezierPath(pts, closed = true, inTangents = null, outTangents = null) {
  const v = pts.map(p => [p[0], p[1]]);
  const i = inTangents ? inTangents.map(p => [p[0], p[1]]) : pts.map(() => [0, 0]);
  const o = outTangents ? outTangents.map(p => [p[0], p[1]]) : pts.map(() => [0, 0]);
  return {
    ty: 'sh',
    nm: 'CustomPath',
    ks: {
      a: 0,
      k: { i, o, v, c: closed }
    }
  };
}

function makeCirclePts(cx, cy, r, n = 12) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    pts.push([+(cx + Math.cos(a) * r).toFixed(2), +(cy + Math.sin(a) * r).toFixed(2)]);
  }
  return pts;
}

function makeStarPts(cx, cy, rOuter, rInner, points = 5, rotDeg = -90) {
  const pts = [];
  const total = points * 2;
  const baseRad = (rotDeg * Math.PI) / 180;
  for (let k = 0; k < total; k++) {
    const r = k % 2 === 0 ? rOuter : rInner;
    const a = baseRad + (k / total) * Math.PI * 2;
    pts.push([+(cx + Math.cos(a) * r).toFixed(2), +(cy + Math.sin(a) * r).toFixed(2)]);
  }
  return pts;
}

function makeShapeGroup(name, paths, { fillHex = null, fillOpacity = 100, strokeHex = null, strokeWidth = 3, pos = [0, 0], scale = [100, 100], rot = 0 } = {}) {
  const it = [...paths];
  if (strokeHex) {
    it.push({
      ty: 'st',
      nm: 'Stroke',
      c: { a: 0, k: [...hexToRgb01(strokeHex), 1] },
      o: { a: 0, k: 100 },
      w: { a: 0, k: strokeWidth },
      lc: 2,
      lj: 2
    });
  }
  if (fillHex) {
    it.push({
      ty: 'fl',
      nm: 'Fill',
      c: { a: 0, k: [...hexToRgb01(fillHex), 1] },
      o: { a: 0, k: fillOpacity },
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
  return {
    ty: 'gr',
    nm: name,
    it
  };
}

// Build Center Emblem groups that sit at [265.173, 339.649] inside `камни` & `камни 2`
function buildCenterEmblemGroups(emblemType, accentHex, secondaryHex = '#ffffff') {
  const center = [265.173, 339.649];
  const groups = [];

  switch (emblemType) {
    case 'shadow_flame': {
      // Solo Leveling Shadow Monarch glowing vertical flame & dagger core
      groups.push(makeShapeGroup('ShadowOuterFlame', [
        makeBezierPath([[0, -34], [20, -10], [14, 24], [0, 34], [-14, 24], [-20, -10]])
      ], { fillHex: accentHex, strokeHex: secondaryHex, strokeWidth: 2.5, pos: center }));
      groups.push(makeShapeGroup('ShadowInnerCore', [
        makeBezierPath([[0, -20], [9, -2], [0, 22], [-9, -2]])
      ], { fillHex: '#ffffff', pos: center }));
      break;
    }
    case 'timur_tamgha': {
      // Amir Temur 3 rings (uch halqa) in golden triangle formation
      groups.push(makeShapeGroup('TimurRingTop', [
        makeBezierPath(makeCirclePts(0, -13, 10, 14))
      ], { fillHex: null, strokeHex: accentHex, strokeWidth: 4.5, pos: center }));
      groups.push(makeShapeGroup('TimurRingLeft', [
        makeBezierPath(makeCirclePts(-12, 10, 10, 14))
      ], { fillHex: null, strokeHex: accentHex, strokeWidth: 4.5, pos: center }));
      groups.push(makeShapeGroup('TimurRingRight', [
        makeBezierPath(makeCirclePts(12, 10, 10, 14))
      ], { fillHex: null, strokeHex: accentHex, strokeWidth: 4.5, pos: center }));
      break;
    }
    case 'vip_crown': {
      // Black Gold VIP monogram crown & diamond
      groups.push(makeShapeGroup('VipCrest', [
        makeBezierPath([[-22, 12], [-26, -12], [-10, 0], [0, -20], [10, 0], [26, -12], [22, 12]])
      ], { fillHex: accentHex, strokeHex: secondaryHex, strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'bitcoin': {
      // Golden Bitcoin coin + B symbol
      groups.push(makeShapeGroup('BtcCoin', [
        makeBezierPath(makeCirclePts(0, 0, 28, 16))
      ], { fillHex: accentHex, strokeHex: secondaryHex, strokeWidth: 3, pos: center }));
      groups.push(makeShapeGroup('BtcSymbol', [
        makeBezierPath([[-8, -16], [6, -16], [12, -10], [7, -2], [14, 4], [8, 15], [-8, 15]]),
        makeBezierPath([[-3, -22], [-3, 22]], false),
        makeBezierPath([[4, -22], [4, 22]], false)
      ], { fillHex: null, strokeHex: '#ffffff', strokeWidth: 4.2, pos: center }));
      break;
    }
    case 'sauron_eye': {
      // Fiery Eye of Sauron with vertical slit pupil
      groups.push(makeShapeGroup('EyeOuter', [
        makeBezierPath([[-30, 0], [-14, -18], [0, -22], [14, -18], [30, 0], [14, 18], [0, 22], [-14, 18]])
      ], { fillHex: '#ff5500', strokeHex: '#ffdd44', strokeWidth: 3, pos: center }));
      groups.push(makeShapeGroup('EyeSlit', [
        makeBezierPath([[0, -19], [5, 0], [0, 19], [-5, 0]])
      ], { fillHex: '#090504', strokeHex: '#ffea79', strokeWidth: 1.5, pos: center }));
      break;
    }
    case 'ton_crystal': {
      // Telegram TON diamond triangle symbol
      groups.push(makeShapeGroup('TonOuter', [
        makeBezierPath([[-24, -16], [24, -16], [0, 26]]),
        makeBezierPath([[0, -16], [0, 26]], false),
        makeBezierPath([[-24, -16], [0, -4], [24, -16]], false)
      ], { fillHex: null, strokeHex: '#ffffff', strokeWidth: 4, pos: center }));
      break;
    }
    case 'caesar_laurel': {
      // Roman Imperial Star & Laurel inside gem
      groups.push(makeShapeGroup('RomanStar', [
        makeBezierPath(makeStarPts(0, 0, 24, 10, 8))
      ], { fillHex: accentHex, strokeHex: '#ffffff', strokeWidth: 2, pos: center }));
      break;
    }
    case 'sharingan': {
      // Red Sharingan eye with black ring & center pupil
      groups.push(makeShapeGroup('SharinganIris', [
        makeBezierPath(makeCirclePts(0, 0, 27, 16))
      ], { fillHex: '#e11d48', strokeHex: '#111111', strokeWidth: 3.5, pos: center }));
      groups.push(makeShapeGroup('SharinganRing', [
        makeBezierPath(makeCirclePts(0, 0, 16, 12))
      ], { fillHex: null, strokeHex: '#111111', strokeWidth: 2.2, pos: center }));
      groups.push(makeShapeGroup('SharinganPupil', [
        makeBezierPath(makeCirclePts(0, 0, 6.5, 10)),
        makeBezierPath(makeCirclePts(0, -16, 4.5, 8)),
        makeBezierPath(makeCirclePts(14, 8, 4.5, 8)),
        makeBezierPath(makeCirclePts(-14, 8, 4.5, 8))
      ], { fillHex: '#09090b', pos: center }));
      break;
    }
    case 'rolex_gear': {
      // Golden Swiss Watch Tourbillon gear wheel
      groups.push(makeShapeGroup('TourbillonGear', [
        makeBezierPath(makeStarPts(0, 0, 26, 19, 12)),
        makeBezierPath(makeCirclePts(0, 0, 9, 10))
      ], { fillHex: accentHex, strokeHex: secondaryHex, strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'ice_snowflake': {
      // 6-pointed Ice Crystal Star
      groups.push(makeShapeGroup('IceCrystal', [
        makeBezierPath(makeStarPts(0, 0, 28, 8, 6))
      ], { fillHex: '#e0f7ff', strokeHex: '#38bdf8', strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'cyber_visor': {
      // Cyberpunk futuristic neon visor bar across the gem
      groups.push(makeShapeGroup('CyberVisorBar', [
        makeBezierPath([[-36, -8], [36, -8], [28, 10], [0, 6], [-28, 10]])
      ], { fillHex: '#00f5d4', strokeHex: '#ff007f', strokeWidth: 3, pos: center }));
      break;
    }
    case 'paxta_cotton': {
      // Blooming Golden & White Cotton Boll (Paxta Chanoq)
      groups.push(makeShapeGroup('CottonPuffs', [
        makeBezierPath(makeCirclePts(0, -10, 13, 10)),
        makeBezierPath(makeCirclePts(-11, 3, 12, 10)),
        makeBezierPath(makeCirclePts(11, 3, 12, 10))
      ], { fillHex: '#ffffff', strokeHex: accentHex, strokeWidth: 2.5, pos: center }));
      groups.push(makeShapeGroup('CottonCalyx', [
        makeBezierPath([[-18, 10], [0, 24], [18, 10], [8, 16], [0, 6], [-8, 16]])
      ], { fillHex: accentHex, pos: center }));
      break;
    }
    case 'archangel_halo': {
      // Celestial 4-point cross star
      groups.push(makeShapeGroup('CelestialStar', [
        makeBezierPath(makeStarPts(0, 0, 28, 7, 4))
      ], { fillHex: '#ffffff', strokeHex: '#fde047', strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'demon_sigil': {
      // Fiery Inferno Diamond Core
      groups.push(makeShapeGroup('InfernoStar', [
        makeBezierPath(makeStarPts(0, 0, 26, 10, 5, 90))
      ], { fillHex: '#ff3b1d', strokeHex: '#fde047', strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'sakura_flower': {
      // 5-petal Pink Sakura blossom
      groups.push(makeShapeGroup('SakuraBlossom', [
        makeBezierPath(makeStarPts(0, 0, 25, 12, 5))
      ], { fillHex: '#fbcfe8', strokeHex: '#f43f5e', strokeWidth: 2.5, pos: center }));
      groups.push(makeShapeGroup('SakuraCore', [
        makeBezierPath(makeCirclePts(0, 0, 6, 8))
      ], { fillHex: '#fde047', pos: center }));
      break;
    }
    case 'matrix_code': {
      // Hacker terminal bracket < / >
      groups.push(makeShapeGroup('MatrixGlyph', [
        makeBezierPath([[-10, -14], [-24, 0], [-10, 14]], false),
        makeBezierPath([[10, -14], [24, 0], [10, 14]], false),
        makeBezierPath([[4, -18], [-4, 18]], false)
      ], { fillHex: null, strokeHex: '#22c55e', strokeWidth: 4.2, pos: center }));
      break;
    }
    case 'pharaoh_ankh': {
      // Egyptian Eye / Ankh cross
      groups.push(makeShapeGroup('AnkhLoop', [
        makeBezierPath(makeCirclePts(0, -10, 10, 12)),
        makeBezierPath([[-14, 2], [14, 2]], false),
        makeBezierPath([[0, 0], [0, 24]], false)
      ], { fillHex: null, strokeHex: '#fbbf24', strokeWidth: 4.5, pos: center }));
      break;
    }
    case 'galaxy_spiral': {
      // Cosmic Supernova 6-ray star + ring
      groups.push(makeShapeGroup('SupernovaRing', [
        makeBezierPath([[-28, 6], [-10, -8], [14, -10], [28, -6], [10, 8], [-14, 10]])
      ], { fillHex: null, strokeHex: '#c084fc', strokeWidth: 3.5, pos: center }));
      groups.push(makeShapeGroup('SupernovaCore', [
        makeBezierPath(makeStarPts(0, 0, 18, 5, 4))
      ], { fillHex: '#ffffff', pos: center }));
      break;
    }
    case 'midas_gold': {
      // Pure Gold Crown bullion stamp
      groups.push(makeShapeGroup('GoldStamp', [
        makeBezierPath(makeStarPts(0, 0, 24, 11, 8))
      ], { fillHex: '#fef08a', strokeHex: '#ca8a04', strokeWidth: 2.5, pos: center }));
      break;
    }
    case 'venom_spider': {
      // White Symbiote Spider diamond + legs
      groups.push(makeShapeGroup('SymbioteCore', [
        makeBezierPath([[0, -22], [11, 0], [0, 22], [-11, 0]]),
        makeBezierPath([[-26, -16], [-10, -4], [-26, 16]], false),
        makeBezierPath([[26, -16], [10, -4], [26, 16]], false)
      ], { fillHex: '#ffffff', strokeHex: '#ffffff', strokeWidth: 3.2, pos: center }));
      break;
    }
    case 'trident': {
      // Poseidon Golden Trident
      groups.push(makeShapeGroup('Trident', [
        makeBezierPath([[0, -24], [0, 24]], false),
        makeBezierPath([[-16, -18], [-14, -2], [14, -2], [16, -18]], false)
      ], { fillHex: null, strokeHex: accentHex, strokeWidth: 4.2, pos: center }));
      break;
    }
    case 'crescent': {
      // Emerald Sultan Crescent & Star
      groups.push(makeShapeGroup('Crescent', [
        makeBezierPath([[8, -18], [-8, -14], [-18, 0], [-8, 14], [8, 18], [-2, 10], [-6, 0], [-2, -10]])
      ], { fillHex: accentHex, strokeHex: '#ffffff', strokeWidth: 2, pos: center }));
      groups.push(makeShapeGroup('CrescentStar', [
        makeBezierPath(makeStarPts(11, 0, 8, 3.5, 5))
      ], { fillHex: '#ffffff', pos: center }));
      break;
    }
    case 'toxic_bio': {
      // Neon Hazard Triangle
      groups.push(makeShapeGroup('ToxicTri', [
        makeBezierPath([[0, -22], [22, 16], [-22, 16]]),
        makeBezierPath(makeCirclePts(0, 4, 5, 8))
      ], { fillHex: null, strokeHex: '#a3e635', strokeWidth: 4, pos: center }));
      break;
    }
    default: {
      // Classicfaceted star highlight
      groups.push(makeShapeGroup('GemStarHighlight', [
        makeBezierPath(makeStarPts(0, 0, 20, 6, 4))
      ], { fillHex: '#ffffff', fillOpacity: 85, pos: center }));
      break;
    }
  }
  return groups;
}

// Build Crown-Top / Surround Accessory Layer parented to ind: 19 (NULL CONTROL)
// Note: In NULL CONTROL space, crown center is [63, 19], top rim is [63, -145], left/right are [-150, 20] & [276, 20]
function buildCrownAccessoryLayer(accType, color1, color2) {
  if (!accType) return null;
  const shapes = [];

  if (accType === 'halo') {
    // Floating Golden Angel Halo above the crown
    shapes.push(makeShapeGroup('AngelHaloOuter', [
      makeBezierPath([[-110, 0], [-75, -22], [0, -28], [75, -22], [110, 0], [75, 22], [0, 28], [-75, 22]])
    ], { fillHex: null, strokeHex: color1, strokeWidth: 12, pos: [63, -172] }));
    shapes.push(makeShapeGroup('AngelHaloInner', [
      makeBezierPath([[-110, 0], [-75, -22], [0, -28], [75, -22], [110, 0], [75, 22], [0, 28], [-75, 22]])
    ], { fillHex: null, strokeHex: '#ffffff', strokeWidth: 4, pos: [63, -172] }));
  } else if (accType === 'horns') {
    // Curved Demon / Dragon Horns rising from left & right top of crown
    shapes.push(makeShapeGroup('LeftHorn', [
      makeBezierPath([[-120, -95], [-178, -148], [-192, -205], [-145, -172], [-88, -115]])
    ], { fillHex: color1, strokeHex: color2, strokeWidth: 4, pos: [63, 18] }));
    shapes.push(makeShapeGroup('RightHorn', [
      makeBezierPath([[120, -95], [178, -148], [192, -205], [145, -172], [88, -115]])
    ], { fillHex: color1, strokeHex: color2, strokeWidth: 4, pos: [63, 18] }));
  } else if (accType === 'laurel') {
    // Golden Roman Emperor Laurel Wreath Leaves on Left & Right
    const leftLeaves = [
      [[-195, 90], [-228, 65], [-205, 42]],
      [[-210, 40], [-242, 10], [-212, -15]],
      [[-210, -15], [-238, -50], [-200, -72]],
      [[-192, -70], [-212, -108], [-172, -120]]
    ];
    const rightLeaves = leftLeaves.map(tri => tri.map(([x, y]) => [-x, y]));
    shapes.push(makeShapeGroup('LaurelLeft', leftLeaves.map(pts => makeBezierPath(pts)), {
      fillHex: color1, strokeHex: color2, strokeWidth: 3, pos: [63, 18]
    }));
    shapes.push(makeShapeGroup('LaurelRight', rightLeaves.map(pts => makeBezierPath(pts)), {
      fillHex: color1, strokeHex: color2, strokeWidth: 3, pos: [63, 18]
    }));
  } else if (accType === 'shadow_aura') {
    // Rising purple-black Shadow Monarch flame tongues above crown spikes
    shapes.push(makeShapeGroup('ShadowFlames', [
      makeBezierPath([[0, -135], [22, -185], [0, -220], [-22, -185]]),
      makeBezierPath([[-115, -110], [-95, -162], [-118, -195], [-138, -155]]),
      makeBezierPath([[115, -110], [138, -155], [118, -195], [95, -162]])
    ], { fillHex: color1, strokeHex: color2, strokeWidth: 3, pos: [63, 18] }));
  } else if (accType === 'orbit_ring') {
    // Cosmic planetary ring + moons orbiting the crown
    shapes.push(makeShapeGroup('CosmicRing', [
      makeBezierPath([[-235, 35], [-120, -25], [120, -55], [235, -15], [120, 45], [-120, 75]])
    ], { fillHex: null, strokeHex: color1, strokeWidth: 6, pos: [63, 18] }));
    shapes.push(makeShapeGroup('CosmicMoon1', [
      makeBezierPath(makeCirclePts(-215, 25, 12, 10)),
      makeBezierPath(makeCirclePts(215, -10, 10, 10))
    ], { fillHex: color2, strokeHex: '#ffffff', strokeWidth: 2, pos: [63, 18] }));
  } else if (accType === 'crown_stars') {
    // Floating sovereign stars above the 3 main crown peaks
    shapes.push(makeShapeGroup('PeakStars', [
      makeBezierPath(makeStarPts(0, -178, 20, 8, 5)),
      makeBezierPath(makeStarPts(-124, -148, 15, 6, 5)),
      makeBezierPath(makeStarPts(124, -148, 15, 6, 5))
    ], { fillHex: color1, strokeHex: color2, strokeWidth: 2.5, pos: [63, 18] }));
  } else if (accType === 'ice_spikes') {
    // Sharp crystalline ice spires rising from crown tips
    shapes.push(makeShapeGroup('IceSpires', [
      makeBezierPath([[0, -215], [18, -140], [-18, -140]]),
      makeBezierPath([[-125, -185], [-105, -120], [-142, -120]]),
      makeBezierPath([[125, -185], [142, -120], [105, -120]])
    ], { fillHex: color1, strokeHex: '#ffffff', strokeWidth: 2.5, pos: [63, 18] }));
  }

  if (!shapes.length) return null;

  return {
    ddd: 0,
    ind: 2,
    ty: 4,
    nm: 'CrownAccessory',
    parent: 19,
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [0, 0, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 0, s: [100, 100, 100] },
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 90, s: [105, 105, 100] },
          { t: 180, s: [100, 100, 100] }
        ]
      }
    },
    ao: 0,
    shapes,
    ip: 0,
    op: 180,
    st: 0,
    bm: 0
  };
}

// ============================================================================
// THE 30 APPROVED IMPERIAL CROWN MODELS (Sum of rarity = 1000 permille = 100%)
// ============================================================================
const MODELS_SPEC = [
  // I. Ultra-Rare Cult & Legend (0.5% - 1.0%)
  {
    name: 'Shadow Monarch',
    rarity: 5,
    bodyGrad: ['#2e1065', '#0f0720', '#05020a'],
    backGrad: ['#1e0944', '#090314', '#030106'],
    rimGrad: ['#c084fc', '#7e22ce', '#3b0764'],
    sheenGrad: ['#e9d5ff', '#a855f7', '#581c87'],
    contour: '#9333ea',
    centerGem: ['#e9d5ff', '#9333ea', '#3b0764'],
    centerStroke: '#d8b4fe',
    leftJewel: ['#38bdf8', '#0284c7'],
    rightJewel: ['#c084fc', '#6b21a8'],
    sparkle: '#d8b4fe',
    emblem: 'shadow_flame',
    emblemColors: ['#a855f7', '#38bdf8'],
    accessory: 'shadow_aura',
    accColors: ['#9333ea', '#e9d5ff']
  },
  {
    name: 'Amir Temur',
    rarity: 5,
    bodyGrad: ['#06b6d4', '#0284c7', '#1e3a8a'],
    backGrad: ['#0891b2', '#0369a1', '#172554'],
    rimGrad: ['#fef08a', '#f59e0b', '#b45309'],
    sheenGrad: ['#ffffff', '#fde047', '#f59e0b'],
    contour: '#d97706',
    centerGem: ['#fda4af', '#e11d48', '#881337'],
    centerStroke: '#fbbf24',
    leftJewel: ['#2dd4bf', '#0f766e'],
    rightJewel: ['#fb7185', '#be123c'],
    sparkle: '#fde047',
    emblem: 'timur_tamgha',
    emblemColors: ['#fde047', '#ffffff'],
    accessory: 'crown_stars',
    accColors: ['#fbbf24', '#38bdf8']
  },
  {
    name: 'Black Gold VIP',
    rarity: 8,
    bodyGrad: ['#3f3f46', '#18181b', '#09090b'],
    backGrad: ['#27272a', '#09090b', '#000000'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#fef9c3', '#facc15', '#ca8a04'],
    contour: '#eab308',
    centerGem: ['#71717a', '#27272a', '#09090b'],
    centerStroke: '#facc15',
    leftJewel: ['#facc15', '#a16207'],
    rightJewel: ['#facc15', '#a16207'],
    sparkle: '#fde047',
    emblem: 'vip_crown',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: 'crown_stars',
    accColors: ['#facc15', '#18181b']
  },
  {
    name: 'Satoshi Nakamoto',
    rarity: 10,
    bodyGrad: ['#fbbf24', '#f97316', '#9a3412'],
    backGrad: ['#f59e0b', '#ea580c', '#7c2d12'],
    rimGrad: ['#ffffff', '#fde047', '#f97316'],
    sheenGrad: ['#ffffff', '#fed7aa', '#f97316'],
    contour: '#c2410c',
    centerGem: ['#fed7aa', '#f97316', '#9a3412'],
    centerStroke: '#fef08a',
    leftJewel: ['#4ade80', '#15803d'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#4ade80',
    emblem: 'bitcoin',
    emblemColors: ['#f59e0b', '#fef08a'],
    accessory: 'orbit_ring',
    accColors: ['#f97316', '#fde047']
  },
  {
    name: 'Eye of Sauron',
    rarity: 10,
    bodyGrad: ['#451a03', '#1c1917', '#0c0a09'],
    backGrad: ['#292524', '#0c0a09', '#000000'],
    rimGrad: ['#fde047', '#f97316', '#dc2626'],
    sheenGrad: ['#fef08a', '#ef4444', '#7f1d1d'],
    contour: '#ea580c',
    centerGem: ['#fde047', '#ea580c', '#7f1d1d'],
    centerStroke: '#f97316',
    leftJewel: ['#ef4444', '#7f1d1d'],
    rightJewel: ['#f97316', '#9a3412'],
    sparkle: '#fb923c',
    emblem: 'sauron_eye',
    emblemColors: ['#ff5500', '#fde047'],
    accessory: 'horns',
    accColors: ['#1c1917', '#ea580c']
  },

  // II. Very Rare Luxury & Anime (1.5% - 2.0%)
  {
    name: 'TON Crystal',
    rarity: 15,
    bodyGrad: ['#38bdf8', '#0284c7', '#1e3a8a'],
    backGrad: ['#0284c7', '#0369a1', '#0f172a'],
    rimGrad: ['#ffffff', '#BAE6FD', '#38bdf8'],
    sheenGrad: ['#ffffff', '#7dd3fc', '#0284c7'],
    contour: '#0369a1',
    centerGem: ['#e0f2fe', '#38bdf8', '#0369a1'],
    centerStroke: '#ffffff',
    leftJewel: ['#60a5fa', '#1d4ed8'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#e0f2fe',
    emblem: 'ton_crystal',
    emblemColors: ['#38bdf8', '#ffffff'],
    accessory: 'orbit_ring',
    accColors: ['#38bdf8', '#e0f2fe']
  },
  {
    name: 'Julius Caesar',
    rarity: 15,
    bodyGrad: ['#f8fafc', '#e2e8f0', '#94a3b8'],
    backGrad: ['#e2e8f0', '#cbd5e1', '#64748b'],
    rimGrad: ['#fef08a', '#eab308', '#ca8a04'],
    sheenGrad: ['#ffffff', '#fef08a', '#eab308'],
    contour: '#ca8a04',
    centerGem: ['#fca5a5', '#dc2626', '#7f1d1d'],
    centerStroke: '#facc15',
    leftJewel: ['#ef4444', '#991b1b'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'caesar_laurel',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: 'laurel',
    accColors: ['#eab308', '#fef08a']
  },
  {
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
    emblem: 'sharingan',
    emblemColors: ['#e11d48', '#09090b'],
    accessory: null
  },
  {
    name: 'Rolex Prestige',
    rarity: 18,
    bodyGrad: ['#10b981', '#047857', '#064e3b'],
    backGrad: ['#059669', '#065f46', '#022c22'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#fef9c3', '#facc15', '#ca8a04'],
    contour: '#ca8a04',
    centerGem: ['#fef08a', '#eab308', '#854d0e'],
    centerStroke: '#fef08a',
    leftJewel: ['#34d399', '#065f46'],
    rightJewel: ['#34d399', '#065f46'],
    sparkle: '#fde047',
    emblem: 'rolex_gear',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: 'crown_stars',
    accColors: ['#facc15', '#047857']
  },
  {
    name: 'Frozen Lich',
    rarity: 18,
    bodyGrad: ['#e0f2fe', '#7dd3fc', '#0284c7'],
    backGrad: ['#bae6fd', '#38bdf8', '#0369a1'],
    rimGrad: ['#ffffff', '#e0f2fe', '#7dd3fc'],
    sheenGrad: ['#ffffff', '#bae6fd', '#38bdf8'],
    contour: '#0284c7',
    centerGem: ['#ffffff', '#7dd3fc', '#0369a1'],
    centerStroke: '#e0f2fe',
    leftJewel: ['#a5f3fc', '#0891b2'],
    rightJewel: ['#a5f3fc', '#0891b2'],
    sparkle: '#ffffff',
    emblem: 'ice_snowflake',
    emblemColors: ['#ffffff', '#0284c7'],
    accessory: 'ice_spikes',
    accColors: ['#7dd3fc', '#ffffff']
  },
  {
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
    emblem: 'cyber_visor',
    emblemColors: ['#00f5d4', '#ff007f'],
    accessory: null
  },
  {
    name: 'Paxta Imperial',
    rarity: 20,
    bodyGrad: ['#fef9c3', '#facc15', '#b45309'],
    backGrad: ['#fde047', '#eab308', '#92400e'],
    rimGrad: ['#ffffff', '#fef08a', '#f59e0b'],
    sheenGrad: ['#ffffff', '#fef9c3', '#facc15'],
    contour: '#b45309',
    centerGem: ['#ffffff', '#bae6fd', '#0284c7'],
    centerStroke: '#facc15',
    leftJewel: ['#34d399', '#059669'],
    rightJewel: ['#38bdf8', '#0284c7'],
    sparkle: '#ffffff',
    emblem: 'paxta_cotton',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: 'laurel',
    accColors: ['#facc15', '#ffffff']
  },

  // III. Rare Collector's Pick (2.5% - 3.5%)
  {
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
    emblem: 'archangel_halo',
    emblemColors: ['#ffffff', '#facc15'],
    accessory: 'halo',
    accColors: ['#facc15', '#ffffff']
  },
  {
    name: 'Hellfire Demon',
    rarity: 25,
    bodyGrad: ['#991b1b', '#450a0a', '#09090b'],
    backGrad: ['#7f1d1d', '#27272a', '#000000'],
    rimGrad: ['#fde047', '#f97316', '#dc2626'],
    sheenGrad: ['#fca5a5', '#ef4444', '#991b1b'],
    contour: '#dc2626',
    centerGem: ['#fde047', '#ef4444', '#7f1d1d'],
    centerStroke: '#f97316',
    leftJewel: ['#f97316', '#9a3412'],
    rightJewel: ['#f97316', '#9a3412'],
    sparkle: '#f97316',
    emblem: 'demon_sigil',
    emblemColors: ['#ef4444', '#fde047'],
    accessory: 'horns',
    accColors: ['#7f1d1d', '#f97316']
  },
  {
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
    sparkle: '#fce7f3',
    emblem: 'sakura_flower',
    emblemColors: ['#fbcfe8', '#f43f5e'],
    accessory: null
  },
  {
    name: 'Matrix Hacker',
    rarity: 30,
    bodyGrad: ['#14532d', '#052e16', '#020617'],
    backGrad: ['#064e3b', '#022c22', '#000000'],
    rimGrad: ['#86efac', '#22c55e', '#15803d'],
    sheenGrad: ['#bbf7d0', '#4ade80', '#166534'],
    contour: '#22c55e',
    centerGem: ['#86efac', '#16a34a', '#052e16'],
    centerStroke: '#4ade80',
    leftJewel: ['#4ade80', '#15803d'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#4ade80',
    emblem: 'matrix_code',
    emblemColors: ['#4ade80', '#052e16'],
    accessory: null
  },
  {
    name: 'Pharaoh Tut',
    rarity: 30,
    bodyGrad: ['#facc15', '#d97706', '#1e3a8a'],
    backGrad: ['#eab308', '#1d4ed8', '#172554'],
    rimGrad: ['#fef08a', '#f59e0b', '#1d4ed8'],
    sheenGrad: ['#fef9c3', '#facc15', '#b45309'],
    contour: '#1e40af',
    centerGem: ['#60a5fa', '#1d4ed8', '#172554'],
    centerStroke: '#facc15',
    leftJewel: ['#2dd4bf', '#0f766e'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'pharaoh_ankh',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: null
  },
  {
    name: 'Supernova',
    rarity: 35,
    bodyGrad: ['#818cf8', '#4f46e5', '#1e1b4b'],
    backGrad: ['#6366f1', '#3730a3', '#0f172a'],
    rimGrad: ['#f0abfc', '#c084fc', '#6366f1'],
    sheenGrad: ['#ffffff', '#e879f9', '#6366f1'],
    contour: '#7c3aed',
    centerGem: ['#f5d0fe', '#a855f7', '#3b0764'],
    centerStroke: '#e879f9',
    leftJewel: ['#38bdf8', '#0369a1'],
    rightJewel: ['#f472b6', '#be185d'],
    sparkle: '#f0abfc',
    emblem: 'galaxy_spiral',
    emblemColors: ['#c084fc', '#ffffff'],
    accessory: 'orbit_ring',
    accColors: ['#c084fc', '#38bdf8']
  },
  {
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
    emblem: 'midas_gold',
    emblemColors: ['#fef08a', '#a16207'],
    accessory: null
  },
  {
    name: 'Venom Symbiote',
    rarity: 35,
    bodyGrad: ['#334155', '#0f172a', '#020617'],
    backGrad: ['#1e293b', '#09090b', '#000000'],
    rimGrad: ['#ffffff', '#cbd5e1', '#475569'],
    sheenGrad: ['#ffffff', '#94a3b8', '#1e293b'],
    contour: '#cbd5e1',
    centerGem: ['#f8fafc', '#475569', '#09090b'],
    centerStroke: '#ffffff',
    leftJewel: ['#f8fafc', '#334155'],
    rightJewel: ['#f8fafc', '#334155'],
    sparkle: '#ffffff',
    emblem: 'venom_spider',
    emblemColors: ['#ffffff', '#09090b'],
    accessory: null
  },

  // IV. Core Collectible Models (4.5% - 6.1%)
  {
    name: 'Diamond Ice',
    rarity: 45,
    bodyGrad: ['#ffffff', '#e2e8f0', '#94a3b8'],
    backGrad: ['#f1f5f9', '#cbd5e1', '#64748b'],
    rimGrad: ['#ffffff', '#e0f2fe', '#bae6fd'],
    sheenGrad: ['#ffffff', '#f1f5f9', '#cbd5e1'],
    contour: '#64748b',
    centerGem: ['#ffffff', '#bae6fd', '#0284c7'],
    centerStroke: '#ffffff',
    leftJewel: ['#e0f2fe', '#0284c7'],
    rightJewel: ['#e0f2fe', '#0284c7'],
    sparkle: '#ffffff',
    emblem: 'default',
    accessory: null
  },
  {
    name: 'Blood Dracula',
    rarity: 45,
    bodyGrad: ['#4c0519', '#18181b', '#09090b'],
    backGrad: ['#881337', '#09090b', '#000000'],
    rimGrad: ['#fda4af', '#e11d48', '#881337'],
    sheenGrad: ['#fecdd3', '#f43f5e', '#881337'],
    contour: '#be123c',
    centerGem: ['#fecdd3', '#e11d48', '#4c0519'],
    centerStroke: '#fda4af',
    leftJewel: ['#f43f5e', '#881337'],
    rightJewel: ['#f43f5e', '#881337'],
    sparkle: '#fda4af',
    emblem: 'default',
    accessory: null
  },
  {
    name: 'Arcane Magic',
    rarity: 50,
    bodyGrad: ['#c084fc', '#7e22ce', '#3b0764'],
    backGrad: ['#a855f7', '#6b21a8', '#2e1065'],
    rimGrad: ['#f5d0fe', '#d946ef', '#86198f'],
    sheenGrad: ['#fae8ff', '#e879f9', '#7e22ce'],
    contour: '#6b21a8',
    centerGem: ['#f5d0fe', '#d946ef', '#701a75'],
    centerStroke: '#fae8ff',
    leftJewel: ['#e879f9', '#86198f'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#f5d0fe',
    emblem: 'archangel_halo',
    emblemColors: ['#f5d0fe', '#9333ea'],
    accessory: null
  },
  {
    name: 'Poseidon Trident',
    rarity: 50,
    bodyGrad: ['#2dd4bf', '#0d9488', '#115e59'],
    backGrad: ['#14b8a6', '#0f766e', '#134e4a'],
    rimGrad: ['#fef08a', '#facc15', '#ca8a04'],
    sheenGrad: ['#ccfbf1', '#2dd4bf', '#0f766e'],
    contour: '#0f766e',
    centerGem: ['#99f6e4', '#14b8a6', '#134e4a'],
    centerStroke: '#facc15',
    leftJewel: ['#38bdf8', '#0369a1'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#99f6e4',
    emblem: 'trident',
    emblemColors: ['#facc15', '#ffffff'],
    accessory: null
  },
  {
    name: 'Emerald Sultan',
    rarity: 55,
    bodyGrad: ['#34d399', '#059669', '#064e3b'],
    backGrad: ['#10b981', '#047857', '#022c22'],
    rimGrad: ['#fef08a', '#eab308', '#a16207'],
    sheenGrad: ['#d1fae5', '#34d399', '#047857'],
    contour: '#b45309',
    centerGem: ['#6ee7b7', '#10b981', '#064e3b'],
    centerStroke: '#fde047',
    leftJewel: ['#fde047', '#b45309'],
    rightJewel: ['#ef4444', '#991b1b'],
    sparkle: '#fde047',
    emblem: 'crescent',
    emblemColors: ['#fde047', '#ffffff'],
    accessory: null
  },
  {
    name: 'Liquid Chrome',
    rarity: 55,
    bodyGrad: ['#f8fafc', '#94a3b8', '#334155'],
    backGrad: ['#cbd5e1', '#64748b', '#1e293b'],
    rimGrad: ['#ffffff', '#cbd5e1', '#64748b'],
    sheenGrad: ['#ffffff', '#e2e8f0', '#64748b'],
    contour: '#475569',
    centerGem: ['#e0f2fe', '#38bdf8', '#0369a1'],
    centerStroke: '#ffffff',
    leftJewel: ['#c084fc', '#6b21a8'],
    rightJewel: ['#38bdf8', '#0369a1'],
    sparkle: '#ffffff',
    emblem: 'default',
    accessory: null
  },
  {
    name: 'Toxic Neon',
    rarity: 60,
    bodyGrad: ['#a3e635', '#4d7c0f', '#1a2e05'],
    backGrad: ['#65a30d', '#365314', '#09090b'],
    rimGrad: ['#ecfccb', '#bef264', '#65a30d'],
    sheenGrad: ['#ecfccb', '#a3e635', '#4d7c0f'],
    contour: '#4d7c0f',
    centerGem: ['#ecfccb', '#84cc16', '#1a2e05'],
    centerStroke: '#ecfccb',
    leftJewel: ['#fde047', '#a16207'],
    rightJewel: ['#4ade80', '#15803d'],
    sparkle: '#bef264',
    emblem: 'toxic_bio',
    emblemColors: ['#ecfccb', '#1a2e05'],
    accessory: null
  },
  {
    name: 'Royal Amethyst',
    rarity: 60,
    bodyGrad: ['#e879f9', '#9333ea', '#4c1d95'],
    backGrad: ['#c084fc', '#7e22ce', '#2e1065'],
    rimGrad: ['#fef08a', '#facc15', '#b45309'],
    sheenGrad: ['#fae8ff', '#d8b4fe', '#7e22ce'],
    contour: '#6b21a8',
    centerGem: ['#f5d0fe', '#a855f7', '#4c1d95'],
    centerStroke: '#fde047',
    leftJewel: ['#f472b6', '#be185d'],
    rightJewel: ['#c084fc', '#6b21a8'],
    sparkle: '#fae8ff',
    emblem: 'default',
    accessory: null
  },
  {
    name: 'Sunset Miami',
    rarity: 60,
    bodyGrad: ['#fb7185', '#f97316', '#7c2d12'],
    backGrad: ['#f43f5e', '#ea580c', '#581c87'],
    rimGrad: ['#fef08a', '#fb923c', '#e11d48'],
    sheenGrad: ['#fef9c3', '#fdba74', '#e11d48'],
    contour: '#be123c',
    centerGem: ['#67e8f9', '#06b6d4', '#0e7490'],
    centerStroke: '#fde047',
    leftJewel: ['#22d3ee', '#0e7490'],
    rightJewel: ['#f472b6', '#be185d'],
    sparkle: '#fde047',
    emblem: 'default',
    accessory: null
  },
  {
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
    emblem: 'default',
    accessory: null
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
    // 1..5: Sparkles
    if ([1, 2, 3, 4, 5].includes(l.ind)) {
      const fl = l.shapes?.[0]?.it?.find(x => x.ty === 'fl');
      if (fl) fl.c.k = [...sparkleRgb, 1];
    }
    // 7: Contour
    if (l.ind === 7) {
      const st = l.shapes?.[0]?.it?.find(x => x.ty === 'st');
      if (st) st.c.k = [...contourRgb, 1];
    }
    // 8 & 9: Left Emerald Jewels
    if (l.ind === 8 || l.ind === 9) {
      const g2 = l.shapes?.find(g => g.nm === 'Group 2');
      if (g2) {
        const st = g2.it.find(x => x.ty === 'st');
        const fl = g2.it.find(x => x.ty === 'fl');
        if (st) st.c.k = [...ljStroke, 1];
        if (fl) fl.c.k = [...ljFill, 1];
      }
    }
    // 10 & 11: Right Ruby Jewels
    if (l.ind === 10 || l.ind === 11) {
      const g2 = l.shapes?.find(g => g.nm === 'Group 2');
      if (g2) {
        const st = g2.it.find(x => x.ty === 'st');
        const fl = g2.it.find(x => x.ty === 'fl');
        if (st) st.c.k = [...rjStroke, 1];
        if (fl) fl.c.k = [...rjFill, 1];
      }
    }
    // 12 & 15: Sheen (блик)
    if (l.ind === 12 || l.ind === 15) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) {
        gf.g.k.k = [0, ...s1, 0.5, ...s2, 1, ...s3];
      }
    }
    // 13 & 14: Center multi-faceted Gem + Custom 3D-traveling Emblem
    if (l.ind === 13 || l.ind === 14) {
      const g1 = l.shapes?.find(g => g.nm === 'Group 1');
      if (g1) {
        const st = g1.it.find(x => x.ty === 'st');
        if (st) st.c.k = [...centerStrokeRgb, 1];
      }
      for (let gi = 2; gi <= 13; gi++) {
        const grp = l.shapes?.find(g => g.nm === `Group ${gi}`);
        if (grp) {
          const fl = grp.it.find(x => x.ty === 'fl');
          if (fl) fl.c.k = [...hexToRgb01(facetHexes[gi - 2]), 1];
        }
      }
      const emblemGroups = buildCenterEmblemGroups(
        spec.emblem,
        spec.emblemColors?.[0] || spec.rimGrad[0],
        spec.emblemColors?.[1] || '#ffffff'
      );
      if (emblemGroups.length) {
        l.shapes.unshift(...emblemGroups);
      }
    }
    // 16: Upper rim glow (корона)
    if (l.ind === 16) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) {
        gf.g.k.k = [0.054, ...r1, 0.508, ...r2, 0.962, ...r3, 0.054, 1, 0.508, 0.5, 0.962, 0];
      }
    }
    // 17: Front body (Перед)
    if (l.ind === 17) {
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (gf) {
        gf.g.k.k = [0, ...b1, 0.5, ...b2, 1, ...b3];
      }
    }
    // 18: Back body (Зад)
    if (l.ind === 18) {
      const st = l.shapes?.[0]?.it?.find(x => x.ty === 'st');
      const gf = l.shapes?.[0]?.it?.find(x => x.ty === 'gf');
      if (st) st.c.k = [...contourRgb, 1];
      if (gf) {
        gf.g.k.k = [0, ...bk1, 0.5, ...bk2, 1, ...bk3];
      }
    }
  }

  // Add Crown-Top / Surround Accessory Layer if defined
  const accLayer = buildCrownAccessoryLayer(
    spec.accessory,
    spec.accColors?.[0] || spec.rimGrad[0],
    spec.accColors?.[1] || '#ffffff'
  );
  if (accLayer) {
    // Insert right after sparkles so it renders prominently on the crown
    data.layers.splice(5, 0, accLayer);
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

  // Parent 19 (NULL CONTROL) at frame 0: pos=[252.946, 269.201], anchor=[60, 60] => translate(192.95, 209.20)
  const nullShiftX = 252.946 - 60;
  const nullShiftY = 269.201 - 60;

  // Render layers from bottom to top (reverse order of lottieData.layers)
  const layersBottomUp = [...lottieData.layers].reverse();

  for (const layer of layersBottomUp) {
    if (layer.ty !== 4) continue;
    // Skip secondary rotation duplicate layers at frame 0 (камни 2, камень з, корона р 2, блик 2)
    if ([9, 10, 13, 15].includes(layer.ind)) continue;

    const p = evalAnimProp(layer.ks?.p) || [0, 0, 0];
    const a = evalAnimProp(layer.ks?.a) || [0, 0, 0];
    let s = evalAnimProp(layer.ks?.s) || [100, 100, 100];
    // For sparkle layers (ind 1..5), show them at visible scale in the static thumbnail
    if ([1, 2, 3, 4, 5].includes(layer.ind)) {
      s = [115, 115, 100];
    }

    const tx = (p[0] || 0);
    const ty = (p[1] || 0);
    const ax = -(a[0] || 0);
    const ay = -(a[1] || 0);
    const sx = (s[0] ?? 100) / 100;
    const sy = (s[1] ?? 100) / 100;

    const groupMarkup = [];
    // In Lottie, shapes[0] is on top, shapes[last] is on bottom, so reverse shapes array for SVG painter's order
    const groupsBottomUp = [...(layer.shapes || [])].reverse();

    for (const grp of groupsBottomUp) {
      if (grp.ty !== 'gr') continue;
      const items = grp.it || [];
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
  <g transform="translate(${nullShiftX.toFixed(2)}, ${nullShiftY.toFixed(2)})">
    ${bodyEls.join('\n    ')}
  </g>
</svg>`;
}

// 1. Save base Imperial Crown .tgs, .json and .svg
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'base.tgs'), rawTgs);
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'base.json'), JSON.stringify(baseLottie));
fs.writeFileSync(path.join(OUT_ASSET_DIR, 'thumb.svg'), lottieToSvg(baseLottie));

// 2. Generate all 30 Upgrade Models (.tgs + .json + .svg)
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

  const idSlug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  modelsOut.push({
    id: idSlug,
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

// 3. Load backdrops & symbols from coinflip.json so Imperial Crown has full 51 backdrops & 64 symbols
const coinflipCol = JSON.parse(fs.readFileSync(COINFLIP_JSON_PATH, 'utf8'));

// Temporary 13 Craft models placeholder (until we design bespoke Craft models next)
const craftTiers = ['uncommon', 'uncommon', 'uncommon', 'uncommon', 'rare', 'rare', 'rare', 'epic', 'epic', 'epic', 'legendary', 'legendary', 'legendary'];
const craftModelsOut = craftTiers.map((tier, idx) => ({
  id: `craft_${idx}`,
  name: `${MODELS_SPEC[idx].name} (Craft)`,
  crafted: true,
  tier,
  img: `/a/imperialcrown/m${idx}.svg`,
  tgs: `/a/imperialcrown/m${idx}.json`
}));

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
  craftModels: craftModelsOut,
  backdrops: coinflipCol.backdrops,
  symbols: coinflipCol.symbols
};

fs.writeFileSync(OUT_JSON_PATH, JSON.stringify(imperialCrownCollection, null, 2));

// 4. Register in data/index.json and data/settings.json
const indexPath = path.join(__dirname, '..', 'data', 'index.json');
const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');

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
  craftModelsCount: craftModelsOut.length,
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

if (fs.existsSync(settingsPath)) {
  const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  settingsData.collections = settingsData.collections || {};
  settingsData.collections.imperialcrown = {
    enabled: true,
    price: 1000,
    upgradePrice: 500,
    supply: 250
  };
  fs.writeFileSync(settingsPath, JSON.stringify(settingsData, null, 2));
}

console.log(`Generated Imperial Crown base + ${modelsOut.length} models (.tgs, .json & .svg) -> ${OUT_JSON_PATH}`);
