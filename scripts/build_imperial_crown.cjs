const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SOURCE_TGS = 'c:\\Users\\Muham\\Downloads\\Telegram Desktop\\BlackGoldEm_by_StickerEmojiRobot-tgs\\007.tgs';
const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_ASSET_DIR = path.join(ROOT_DIR, 'public', 'a', 'imperialcrown');
const OUT_COLLECTION_JSON = path.join(ROOT_DIR, 'data', 'collections', 'imperialcrown.json');
const INDEX_JSON_PATH = path.join(ROOT_DIR, 'data', 'index.json');
const COINFLIP_JSON_PATH = path.join(ROOT_DIR, 'data', 'collections', 'coinflip.json');

fs.mkdirSync(OUT_ASSET_DIR, { recursive: true });

// Clean up old m0..m35 and vip0..vip15 files if present
for (let i = 0; i < 35; i++) {
  for (const ext of ['tgs', 'json', 'svg']) {
    for (const prefix of ['m', 'vip']) {
      const p = path.join(OUT_ASSET_DIR, `${prefix}${i}.${ext}`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
}

const rawTgs = fs.readFileSync(SOURCE_TGS);
const baseLottie = JSON.parse(zlib.gunzipSync(rawTgs).toString('utf8'));

// ============================================================================
// COLOR & GRADIENT UTILITIES
// ============================================================================
function hexToRgb01(hex) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [
    +(((n >> 16) & 255) / 255).toFixed(4),
    +(((n >> 8) & 255) / 255).toFixed(4),
    +((n & 255) / 255).toFixed(4)
  ];
}

function mixHex(h1, h2, t) {
  const c1 = hexToRgb01(h1);
  const c2 = hexToRgb01(h2);
  const r = Math.round((c1[0] * (1 - t) + c2[0] * t) * 255);
  const g = Math.round((c1[1] * (1 - t) + c2[1] * t) * 255);
  const b = Math.round((c1[2] * (1 - t) + c2[2] * t) * 255);
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

function build12GemFacets(lightHex, midHex, darkHex) {
  return [
    mixHex(lightHex, midHex, 0.25),
    midHex,
    mixHex(lightHex, '#ffffff', 0.25),
    darkHex,
    midHex,
    mixHex(midHex, darkHex, 0.25),
    mixHex(lightHex, '#ffffff', 0.55),
    lightHex,
    mixHex(midHex, darkHex, 0.45),
    lightHex,
    mixHex(lightHex, midHex, 0.5),
    lightHex
  ];
}

// ============================================================================
// SMOOTH BEZIER VECTOR PRIMITIVES (Catmull-Rom, Ellipses, Stars, Sculpted 3D)
// ============================================================================
function shPath(pts, closed = true) {
  const v = pts.map(p => [+(p[0]).toFixed(2), +(p[1]).toFixed(2)]);
  const i = pts.map(p => [+(p[2] || 0).toFixed(2), +(p[3] || 0).toFixed(2)]);
  const o = pts.map(p => [+(p[4] || 0).toFixed(2), +(p[5] || 0).toFixed(2)]);
  return {
    ty: 'sh',
    nm: 'Path',
    ks: { a: 0, k: { c: closed, v, i, o } }
  };
}

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
    ks: { a: 0, k: { c: closed, v, i, o } }
  };
}

function shEllipse(cx, cy, rx, ry) {
  const k = 0.55228475;
  const kx = +(rx * k).toFixed(2);
  const ky = +(ry * k).toFixed(2);
  return shPath([
    [cx, cy - ry, -kx, 0, kx, 0],
    [cx + rx, cy, 0, -ky, 0, ky],
    [cx, cy + ry, kx, 0, -kx, 0],
    [cx - rx, cy, 0, ky, 0, -ky]
  ], true);
}

function shCircle(cx, cy, r) {
  return shEllipse(cx, cy, r, r);
}

function shStar(cx, cy, rOuter, rInner, points = 5, rotDeg = -90) {
  const pts = [];
  const step = Math.PI / points;
  const rot = (rotDeg * Math.PI) / 180;
  for (let k = 0; k < points * 2; k++) {
    const r = k % 2 === 0 ? rOuter : rInner;
    const a = rot + k * step;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return shPath(pts, true);
}

function shRing(cx, cy, rOuter, rInner) {
  return [shCircle(cx, cy, rOuter), shCircle(cx, cy, rInner)];
}

// Build a Lottie shape group (`gr`) with rich 3-stop gradient + bold Telegram rounded stroke
function grp(name, paths, opts = {}) {
  const {
    fill = null,
    grad = null,
    gradPts = [[0, -100], [0, 100]],
    stroke = null,
    strokeWidth = 0,
    opacity = 100,
    pos = [0, 0],
    scale = [100, 100],
    rot = 0,
    animPos = null,
    animScale = null,
    animOpacity = null
  } = opts;

  const it = Array.isArray(paths) ? [...paths] : [paths];

  if (stroke && strokeWidth > 0) {
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
    p: animPos || { a: 0, k: pos },
    a: { a: 0, k: [0, 0] },
    s: animScale || { a: 0, k: scale },
    r: { a: 0, k: rot },
    o: animOpacity || { a: 0, k: 100 },
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 }
  });

  return { ty: 'gr', nm: name, it };
}

// 3-Pass Sculpted Telegram Sticker Macro:
// 1. Cast Drop Shadow (offset [0, shadowDy], dark ambient occlusion)
// 2. Main Sculpted Body (thick 12px-16px rounded contour + 3-stop gradient)
// 3. Optional Inner Bevel / Specular Highlight
function sculptedGrp(name, paths, opts = {}) {
  const {
    shadowDy = 8,
    shadowOpacity = 36,
    highlightPaths = null,
    highlightColor = '#ffffff',
    highlightOpacity = 55,
    highlightWidth = 5,
    ...mainOpts
  } = opts;

  const out = [];
  if (shadowDy > 0 && shadowOpacity > 0) {
    out.push(grp(`${name}_Shadow`, JSON.parse(JSON.stringify(paths)), {
      fill: '#05040d',
      stroke: '#05040d',
      strokeWidth: (mainOpts.strokeWidth || 10) + 2,
      opacity: shadowOpacity,
      pos: [(mainOpts.pos?.[0] || 0), (mainOpts.pos?.[1] || 0) + shadowDy],
      scale: mainOpts.scale || [100, 100],
      rot: mainOpts.rot || 0
    }));
  }
  out.push(grp(name, paths, mainOpts));
  if (highlightPaths) {
    out.push(grp(`${name}_Highlight`, highlightPaths, {
      stroke: highlightColor,
      strokeWidth: highlightWidth,
      opacity: highlightOpacity,
      pos: mainOpts.pos || [0, 0],
      scale: mainOpts.scale || [100, 100],
      rot: mainOpts.rot || 0
    }));
  }
  return out;
}

// ============================================================================
// EXACT 3D SYNCHRONIZATION ENGINE (Extracted from 007.tgs 45 Keyframes)
// ============================================================================
const peredKfs = baseLottie.layers.find(x => x.ind === 17).shapes[0].it.find(x => x.ty === 'sh').ks.k;
const zadKfs = baseLottie.layers.find(x => x.ind === 18).shapes[0].it.find(x => x.ty === 'sh').ks.k;

// Extract exact 0..360 deg rotation angle of the crown at each of the 45 keyframes
const CROWN_3D_ANGLES = peredKfs.map((kf, i) => {
  const t = kf.t;
  const pv = kf.s?.[0]?.v;
  const zv = zadKfs[i].s?.[0]?.v;
  const R = 238.4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let deg = 0;
  if (t <= 73) {
    deg = Math.asin(clamp(pv[0][0] / R, -1, 1)) * (180 / Math.PI);
  } else if (t <= 103) {
    deg = 180 - Math.asin(clamp(zv[13][0] / R, -1, 1)) * (180 / Math.PI);
  } else if (t < 179) {
    deg = 360 + Math.asin(clamp(pv[10][0] / R, -1, 1)) * (180 / Math.PI);
  } else {
    deg = 360;
  }
  return { t, deg };
});

// Exact 5 Peak Vertex Chains across all 45 keyframes:
// Returns { t, x, y, isFront, scaleX } for peakIndex 0..4
function getPeakTrajectory(peakIndex) {
  return peredKfs.map((kf, i) => {
    const t = kf.t;
    const pv = kf.s?.[0]?.v;
    const zv = zadKfs[i].s?.[0]?.v;
    let pt = [0, -161];
    let isFront = true;
    const maxR = peakIndex === 0 ? 242 : 218;

    if (peakIndex === 0) {
      // Tall Sovereign Peak
      if (t <= 73) { pt = pv[0]; isFront = true; }
      else if (t <= 103) { pt = zv[13]; isFront = false; }
      else if (t < 179) { pt = pv[10]; isFront = true; }
      else { pt = pv[0]; isFront = true; }
    } else if (peakIndex === 1) {
      // Front-Left Side Peak
      if (t <= 87) { pt = pv[2]; isFront = true; }
      else if (t <= 138) { pt = zv[11]; isFront = false; }
      else if (t < 179) { pt = pv[12]; isFront = true; }
      else { pt = pv[2]; isFront = true; }
    } else if (peakIndex === 2) {
      // Back-Left Side Peak
      if (t <= 68) { pt = zv[0]; isFront = false; }
      else if (t <= 93) { pt = pv[4]; isFront = true; }
      else if (t < 179) { pt = zv[9]; isFront = false; }
      else { pt = zv[0]; isFront = false; }
    } else if (peakIndex === 3) {
      // Back-Right Side Peak
      if (t <= 82) { pt = zv[17]; isFront = false; }
      else if (t <= 105) { pt = pv[6]; isFront = true; }
      else if (t < 179) { pt = zv[7]; isFront = false; }
      else { pt = zv[17]; isFront = false; }
    } else {
      // Front-Right Side Peak (peakIndex === 4)
      if (t <= 23) { pt = pv[16]; isFront = true; }
      else if (t <= 91) { pt = zv[15]; isFront = false; }
      else if (t < 179) { pt = pv[8]; isFront = true; }
      else { pt = pv[16]; isFront = true; }
    }

    const ratio = Math.min(0.94, Math.abs(pt[0]) / maxR);
    const scaleX = Math.max(42, Math.round(100 * Math.sqrt(1 - ratio * ratio)));
    return {
      t,
      x: +(63.066 + pt[0]).toFixed(2),
      y: +(18.705 + pt[1]).toFixed(2),
      isFront,
      scaleX
    };
  });
}

// Build synchronized Front & Back Lottie layers for all 5 3D-Orbiting Crown Peaks!
// sovereignShapes: shapes for Peak 0 (the Tall Sovereign Peak)
// sidePeakShapes: shapes for Peaks 1..4 (the 4 Secondary Peaks)
function build3DTrackedPeakLayers(sovereignShapes, sidePeakShapes) {
  const frontLayers = [];
  const backLayers = [];
  const linIn = { x: [0.667, 0.667, 0.667], y: [1, 1, 1] };
  const linOut = { x: [0.333, 0.333, 0.333], y: [0, 0, 0] };

  for (let pIdx = 0; pIdx < 5; pIdx++) {
    const shapesToUse = pIdx === 0 ? sovereignShapes : sidePeakShapes;
    if (!shapesToUse || !shapesToUse.length) continue;

    const traj = getPeakTrajectory(pIdx);
    const pKfs = [];
    const sKfs = [];
    const oFrontKfs = [];
    const oBackKfs = [];

    const ease1DIn = { x: [0.833], y: [0.833] };
    const ease1DOut = { x: [0.167], y: [0.167] };

    for (let i = 0; i < traj.length; i++) {
      const cur = traj[i];
      const prev = i > 0 ? traj[i - 1] : null;
      const isLast = i === traj.length - 1;

      if (prev && prev.isFront !== cur.isFront && cur.t - prev.t > 0.2) {
        const stepT = +(cur.t - 0.1).toFixed(2);
        oFrontKfs.push({ i: ease1DIn, o: ease1DOut, t: stepT, s: [prev.isFront ? 100 : 0] });
        oBackKfs.push({ i: ease1DIn, o: ease1DOut, t: stepT, s: [prev.isFront ? 0 : 100] });
      }

      if (isLast) {
        pKfs.push({ t: cur.t, s: [cur.x, cur.y, 0] });
        sKfs.push({ t: cur.t, s: [cur.scaleX, 100, 100] });
        oFrontKfs.push({ t: cur.t, s: [cur.isFront ? 100 : 0] });
        oBackKfs.push({ t: cur.t, s: [cur.isFront ? 0 : 100] });
      } else {
        pKfs.push({
          i: { x: 0.667, y: 0.667 },
          o: { x: 0.333, y: 0.333 },
          t: cur.t,
          s: [cur.x, cur.y, 0],
          to: [0, 0, 0],
          ti: [0, 0, 0]
        });
        sKfs.push({
          i: linIn,
          o: linOut,
          t: cur.t,
          s: [cur.scaleX, 100, 100]
        });
        oFrontKfs.push({ i: ease1DIn, o: ease1DOut, t: cur.t, s: [cur.isFront ? 100 : 0] });
        oBackKfs.push({ i: ease1DIn, o: ease1DOut, t: cur.t, s: [cur.isFront ? 0 : 100] });
      }
    }

    const reversedShapes = JSON.parse(JSON.stringify([...shapesToUse].reverse()));

    frontLayers.push({
      ddd: 0,
      ind: 70 + pIdx,
      ty: 4,
      nm: `Peak3D_Front_${pIdx}`,
      parent: 19,
      sr: 1,
      ks: {
        o: { a: 1, k: oFrontKfs },
        r: { a: 0, k: 0 },
        p: { a: 1, k: JSON.parse(JSON.stringify(pKfs)) },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: JSON.parse(JSON.stringify(sKfs)) }
      },
      ao: 0,
      shapes: JSON.parse(JSON.stringify(reversedShapes)),
      ip: 0,
      op: 180,
      st: 0,
      bm: 0
    });

    backLayers.push({
      ddd: 0,
      ind: 80 + pIdx,
      ty: 4,
      nm: `Peak3D_Back_${pIdx}`,
      parent: 19,
      sr: 1,
      ks: {
        o: { a: 1, k: oBackKfs },
        r: { a: 0, k: 0 },
        p: { a: 1, k: JSON.parse(JSON.stringify(pKfs)) },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: JSON.parse(JSON.stringify(sKfs)) }
      },
      ao: 0,
      shapes: JSON.parse(JSON.stringify(reversedShapes)),
      ip: 0,
      op: 180,
      st: 0,
      bm: 0
    });
  }

  return { frontLayers, backLayers };
}

// Compute 3D perspective foreshortening scale keyframes for custom groups attached to rotating gem layers (8, 9, 10, 11, 13, 14)
function buildSocket3DScaleKfs(layer) {
  const pProp = layer.ks?.p;
  if (!pProp || !pProp.a || !Array.isArray(pProp.k)) {
    return { a: 0, k: [100, 100] };
  }
  const lin2DIn = { x: [0.667, 0.667], y: [1, 1] };
  const lin2DOut = { x: [0.333, 0.333], y: [0, 0] };
  const kfs = pProp.k.map((kf, idx) => {
    const pos = kf.s || [63, 85, 0];
    // Crown center in NULL CONTROL space is x = 63.07; radius of gem ring is ~185
    const dx = pos[0] - 63.07;
    const ratio = Math.min(0.96, Math.abs(dx) / 192);
    const sx = Math.max(18, Math.round(100 * Math.sqrt(1 - ratio * ratio)));
    if (idx === pProp.k.length - 1) {
      return { t: kf.t, s: [sx, 100] };
    }
    return { i: lin2DIn, o: lin2DOut, t: kf.t, s: [sx, 100] };
  });
  return { a: 1, k: kfs };
}

// Build 3D-Sweeping Meridian Arches inside the Inner Royal Dome so the dome visibly rotates 360°!
function buildRotatingDomeMeridians(ribColor, strokeWidth = 10, studColor = null) {
  const out = [];
  // 3 meridian ribs at phase offsets -60°, 0°, +60°
  const phases = [-60, 0, 60];
  phases.forEach((phaseDeg, rIdx) => {
    const pKfs = [];
    const oKfs = [];
    const ease1DIn = { x: [0.833], y: [0.833] };
    const ease1DOut = { x: [0.167], y: [0.167] };
    let prevVis = null;
    for (let i = 0; i < CROWN_3D_ANGLES.length; i++) {
      const { t, deg } = CROWN_3D_ANGLES[i];
      let a = ((phaseDeg + deg) % 360 + 540) % 360 - 180;
      const rad = (a * Math.PI) / 180;
      const x = +(135 * Math.sin(rad)).toFixed(1);
      const vis = Math.cos(rad) > 0.15 ? 85 : 0;
      const isLast = i === CROWN_3D_ANGLES.length - 1;
      if (prevVis !== null && prevVis !== vis && t > 0.2) {
        oKfs.push({ i: ease1DIn, o: ease1DOut, t: +(t - 0.1).toFixed(2), s: [prevVis] });
      }
      prevVis = vis;
      if (isLast) {
        pKfs.push({ t, s: [x, 0] });
        oKfs.push({ t, s: [vis] });
      } else {
        pKfs.push({
          i: { x: 0.667, y: 0.667 },
          o: { x: 0.333, y: 0.333 },
          t,
          s: [x, 0],
          to: [0, 0],
          ti: [0, 0]
        });
        oKfs.push({ i: ease1DIn, o: ease1DOut, t, s: [vis] });
      }
    }

    const ribPaths = [
      shSmooth([[0, -158], [0, -65], [0, 45]], false, 0.25)
    ];
    if (studColor) {
      ribPaths.push(
        shCircle(0, -125, 6),
        shCircle(0, -85, 6.5),
        shCircle(0, -45, 7)
      );
    }

    out.push(grp(`DomeRotatingRib_${rIdx}`, ribPaths, {
      fill: studColor || null,
      stroke: ribColor,
      strokeWidth,
      animPos: { a: 1, k: pKfs },
      animOpacity: { a: 1, k: oKfs }
    }));
  });
  return out;
}

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
        { i: easeIn, o: easeOut, t: 90, s: [105, 105, 100] },
        { t: 180, s: [100, 100, 100] }
      ]
    };
  } else if (animType === 'wings') {
    sProp = {
      a: 1,
      k: [
        { i: easeIn, o: easeOut, t: 0, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 45, s: [107, 95, 100] },
        { i: easeIn, o: easeOut, t: 90, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 135, s: [107, 95, 100] },
        { t: 180, s: [100, 100, 100] }
      ]
    };
  } else if (animType === 'float') {
    pProp = {
      a: 1,
      k: [
        { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 0, s: basePos },
        { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 90, s: [basePos[0], basePos[1] - 11, 0] },
        { t: 180, s: basePos }
      ]
    };
  } else if (animType === 'flame') {
    sProp = {
      a: 1,
      k: [
        { i: easeIn, o: easeOut, t: 0, s: [100, 100, 100] },
        { i: easeIn, o: easeOut, t: 30, s: [97, 108, 100] },
        { i: easeIn, o: easeOut, t: 60, s: [103, 97, 100] },
        { i: easeIn, o: easeOut, t: 90, s: [97, 110, 100] },
        { i: easeIn, o: easeOut, t: 120, s: [103, 98, 100] },
        { i: easeIn, o: easeOut, t: 150, s: [97, 107, 100] },
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
  }

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

// ============================================================================
// REUSABLE SCULPTED ROYAL DOMES, BASE COLLARS & PEAK FINIALS (12px-16px Contours!)
// ============================================================================
function makeSculptedInnerDome(gradColors, strokeHex, ribColor = null, studColor = null) {
  const out = [];
  // Main plush inner dome with 16px bold contour matching 007.tgs
  out.push(grp('InnerDomeBody', [
    shSmooth([
      [-182, 48],
      [-164, -85],
      [-82, -152],
      [0, -168],
      [82, -152],
      [164, -85],
      [182, 48],
      [0, 86]
    ], true, 0.26)
  ], { grad: gradColors, gradPts: [[0, -168], [0, 86]], stroke: strokeHex, strokeWidth: 16 }));

  // Soft 3D Specular Sheen on top-left of the dome
  out.push(grp('InnerDomeSpecular', [
    shSmooth([
      [-132, -62],
      [-72, -132],
      [-10, -148],
      [-45, -95],
      [-105, -25]
    ], true, 0.28)
  ], { fill: '#ffffff', opacity: 28 }));

  // Outer arch border along top of dome
  if (ribColor) {
    out.push(grp('InnerDomeOuterArch', [
      shSmooth([[-162, -75], [-78, -148], [0, -164], [78, -148], [162, -75]], false, 0.26)
    ], { stroke: ribColor, strokeWidth: 11 }));
    // 3D-Rotating Meridian Ribs that sweep across the dome in sync with the crown's 360° spin!
    out.push(...buildRotatingDomeMeridians(ribColor, 10, studColor));
  }

  // Deep Inner Rim Ambient Occlusion Shadow where the crown walls meet the dome
  out.push(grp('InnerDomeAOShadow', [
    shSmooth([
      [-180, 15],
      [-90, 48],
      [0, 58],
      [90, 48],
      [180, 15],
      [175, 65],
      [0, 92],
      [-175, 65]
    ], true, 0.25)
  ], { fill: '#05040d', opacity: 42 }));

  return out;
}

function makeSculptedBaseCollar(gradColors, strokeHex, style = 'ermine', accentHex = '#fbbf24') {
  const out = [];
  // Upper Cast Shadow onto the lower crown wall
  out.push(grp('BaseCollarUpperShadow', [
    shSmooth([
      [-178, 118], [-90, 138], [0, 146], [90, 138], [178, 118],
      [172, 162], [90, 182], [0, 188], [-90, 182], [-172, 162]
    ], true, 0.22)
  ], { fill: '#05040d', opacity: 40 }));

  if (style === 'ermine') {
    // Fluffy Scalloped Royal White Ermine Fur Band with 14px contour
    out.push(grp('ErmineFurBody', [
      shSmooth([
        [-180, 126], [-135, 136], [-90, 146], [-45, 150], [0, 154],
        [45, 150], [90, 146], [135, 136], [180, 126],
        [176, 168], [140, 180], [95, 189], [48, 194], [0, 197],
        [-48, 194], [-95, 189], [-140, 180], [-176, 168]
      ], true, 0.25)
    ], { grad: gradColors, gradPts: [[0, 125], [0, 197]], stroke: strokeHex, strokeWidth: 14 }));

    // Top Fur Highlight
    out.push(grp('ErmineFurHighlight', [
      shSmooth([[-164, 136], [-85, 155], [0, 162], [85, 155], [164, 136]], false, 0.25)
    ], { stroke: '#ffffff', strokeWidth: 7, opacity: 80 }));

    // Sculpted Black & Gold Ermine Tail Spots
    const spots = [-136, -92, -46, 0, 46, 92, 136];
    spots.forEach((x, idx) => {
      const y = 160 + (1 - Math.pow(x / 155, 2)) * 14;
      out.push(grp(`ErmineTail_${idx}`, [
        shCircle(x, y - 9, 4),
        shPath([[x, y - 5], [x + 7, y + 9], [x, y + 14], [x - 7, y + 9]])
      ], { fill: '#09090b', stroke: accentHex, strokeWidth: 2 }));
    });
  } else if (style === 'girih' || style === 'studs') {
    // Armored / Mosaic Royal Collar with 14px contour
    out.push(grp('ArmoredCollarBody', [
      shSmooth([
        [-178, 126], [-90, 146], [0, 154], [90, 146], [178, 126],
        [172, 166], [90, 186], [0, 193], [-90, 186], [-172, 166]
      ], true, 0.22)
    ], { grad: gradColors, gradPts: [[-178, 126], [178, 193]], stroke: strokeHex, strokeWidth: 14 }));

    // Inner Bevel Highlight
    out.push(grp('ArmoredCollarHighlight', [
      shSmooth([[-162, 136], [-85, 154], [0, 161], [85, 154], [162, 136]], false, 0.22)
    ], { stroke: '#ffffff', strokeWidth: 5, opacity: 60 }));

    const xs = [-136, -92, -46, 0, 46, 92, 136];
    xs.forEach((x, idx) => {
      const y = 158 + (1 - Math.pow(x / 155, 2)) * 14;
      out.push(grp(`CollarJewel_${idx}`, [
        shStar(x, y, 12, 6, 4, 0)
      ], { fill: accentHex, stroke: strokeHex, strokeWidth: 4 }));
    });
  } else if (style === 'lava') {
    // Heavy Molten Lava Dripping Iron Rim with 14px contour
    out.push(grp('LavaRimBody', [
      shSmooth([
        [-178, 124], [-90, 145], [0, 152], [90, 145], [178, 124],
        [172, 165], [148, 206], [128, 170],
        [92, 178], [74, 224], [54, 180],
        [16, 184], [-2, 238], [-22, 184],
        [-62, 178], [-82, 218], [-102, 172],
        [-138, 198], [-156, 164], [-172, 162]
      ], true, 0.25)
    ], { grad: gradColors, gradPts: [[0, 124], [0, 238]], stroke: strokeHex, strokeWidth: 13 }));

    out.push(grp('LavaRimGlow', [
      shSmooth([
        [-148, 156], [-82, 204], [-2, 222], [74, 208], [146, 158]
      ], false, 0.25)
    ], { stroke: '#fef08a', strokeWidth: 6, opacity: 80 }));
  }
  return out;
}

// ============================================================================
// BESPOKE 3D ARCHITECTURAL BUILDERS FOR THE TOP 10 ELITE VIP MODELS
// ============================================================================
function buildVIPModelArchitecture(modelId) {
  const backShapes = [];       // Behind the crown (Scimitars, Wings, Charts, Clouds, Spires, Halos)
  const midShapes = [];        // Inside the crown (3D Rotating Domes, Velvet Caps, Cotton Bolls)
  const frontShapes = [];      // Foreground props on crown (Horns, Laurel Wreath, Shinobi Plate, Base Collars)
  const sovereignPeak = [];    // 3D-Tracked Topper on Peak 0 (rotates 360° around the crown!)
  const sidePeakFinials = [];  // 3D-Tracked Finials on Peaks 1..4 (orbit 360° around the crown!)
  let frontAnim = 'breathe';
  let backAnim = 'breathe';

  switch (modelId) {
    // ========================================================================
    // 1. SHADOW MONARCH (3.0% — Solo Leveling Sovereign of Shadows)
    // ========================================================================
    case 'shadow_monarch': {
      backAnim = 'flame';
      // Swept-back Abyssal Monarch Wings + Rising Violet-Cyan Soul Flame Aura (with bold 14px contours)
      backShapes.push(...sculptedGrp('ShadowOuterFlame', [
        shSmooth([
          [-235, 95], [-265, -35], [-205, -165], [-140, -90],
          [-100, -225], [-40, -145], [0, -255], [40, -145],
          [100, -225], [140, -90], [205, -165], [265, -35],
          [235, 95], [0, 145]
        ], true, 0.25)
      ], {
        grad: ['#c084fc', '#6b21a8', '#090414'],
        gradPts: [[0, -255], [0, 145]],
        stroke: '#2e1065',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[-195, -135], [-100, -205], [0, -235], [100, -205], [195, -135]], false, 0.25)],
        highlightColor: '#e9d5ff',
        highlightWidth: 6
      }));

      backShapes.push(grp('ShadowInnerSoulFire', [
        shSmooth([
          [-175, 65], [-190, -45], [-125, -155], [-60, -95],
          [0, -215], [60, -95], [125, -155], [190, -45], [175, 65]
        ], true, 0.25)
      ], { grad: ['#38bdf8', '#7e22ce', '#090414'], gradPts: [[0, -215], [0, 65]], stroke: '#bae6fd', strokeWidth: 6, opacity: 92 }));

      // 3D Rotating Dark Armored Helm Core inside the crown
      midShapes.push(...makeSculptedInnerDome(['#3b0764', '#1e0944', '#05020a'], '#581c87', '#38bdf8', '#e9d5ff'));

      // 3D-Tracked Sovereign Peak 0: Blazing Shadow Monarch Crown Diadem & Soul Flame
      sovereignPeak.push(...sculptedGrp('SovereignShadowPlume', [
        shSmooth([
          [0, -105], [34, -52], [22, -8], [0, 8], [-22, -8], [-34, -52]
        ], true, 0.25)
      ], {
        grad: ['#e9d5ff', '#9333ea', '#1e0944'],
        gradPts: [[0, -105], [0, 8]],
        stroke: '#2e1065',
        strokeWidth: 12,
        shadowDy: 4
      }));
      sovereignPeak.push(grp('SovereignShadowCore', [
        shSmooth([[0, -82], [16, -42], [0, -8], [-16, -42]], true, 0.25)
      ], { grad: ['#ffffff', '#38bdf8', '#7e22ce'], gradPts: [[0, -82], [0, -8]] }));

      // 3D-Tracked Side Peaks 1..4: Orbiting Soul Flames
      sidePeakFinials.push(grp('SideShadowFlame', [
        shSmooth([[0, -56], [22, -24], [14, 4], [-14, 4], [-22, -24]], true, 0.25)
      ], { grad: ['#38bdf8', '#9333ea', '#1e0944'], gradPts: [[0, -56], [0, 4]], stroke: '#2e1065', strokeWidth: 10 }));

      // Front Architecture: Armored Shadow Collar + Towering Curved Monarch Horns + Glowing Sovereign Eyes
      frontShapes.push(...makeSculptedBaseCollar(['#581c87', '#1e0944', '#05020a'], '#2e1065', 'studs', '#38bdf8'));

      frontShapes.push(...sculptedGrp('MonarchLeftHorn', [
        shSmooth([[-108, 18], [-192, -68], [-244, -198], [-172, -162], [-120, -64], [-68, -4]], true, 0.22)
      ], {
        grad: ['#c084fc', '#4c1d95', '#090414'],
        gradPts: [[-244, -198], [-80, 18]],
        stroke: '#1e0944',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[-230, -182], [-178, -148], [-125, -58]], false, 0.22)],
        highlightColor: '#e9d5ff',
        highlightWidth: 5
      }));

      frontShapes.push(...sculptedGrp('MonarchRightHorn', [
        shSmooth([[108, 18], [192, -68], [244, -198], [172, -162], [120, -64], [68, -4]], true, 0.22)
      ], {
        grad: ['#c084fc', '#4c1d95', '#090414'],
        gradPts: [[244, -198], [80, 18]],
        stroke: '#1e0944',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[230, -182], [178, -148], [125, -58]], false, 0.22)],
        highlightColor: '#e9d5ff',
        highlightWidth: 5
      }));

      // Fierce Glowing Monarch Eyes on the Brow
      frontShapes.push(grp('MonarchEyesGlow', [
        shSmooth([[-108, -10], [-62, -32], [-24, -4], [-68, 8]], true, 0.2),
        shSmooth([[108, -10], [62, -32], [24, -4], [68, 8]], true, 0.2)
      ], { grad: ['#ffffff', '#38bdf8', '#9333ea'], gradPts: [[0, -32], [0, 8]], stroke: '#1e0944', strokeWidth: 8 }));
      break;
    }

    // ========================================================================
    // 2. AMIR TEMUR (4.0% — Sohibqiron Saltanati: Crossed Shamshirs + Registan Dome + Royal Jig'a)
    // ========================================================================
    case 'amir_temur': {
      backAnim = 'breathe';
      // Crossed Golden & Damascus Steel Shamshir Scimitars behind the crown (with 14px bold contours!)
      backShapes.push(...sculptedGrp('LeftShamshirBlade', [
        shSmooth([
          [-75, 110], [-165, 10], [-235, -95], [-265, -205],
          [-215, -165], [-155, -55], [-60, 70]
        ], true, 0.25)
      ], {
        grad: ['#ffffff', '#bae6fd', '#0284c7'],
        gradPts: [[-265, -205], [-60, 110]],
        stroke: '#78350f',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[-248, -185], [-185, -85], [-115, 20]], false, 0.25)],
        highlightColor: '#ffffff',
        highlightWidth: 6
      }));

      backShapes.push(...sculptedGrp('RightShamshirBlade', [
        shSmooth([
          [75, 110], [165, 10], [235, -95], [265, -205],
          [215, -165], [155, -55], [60, 70]
        ], true, 0.25)
      ], {
        grad: ['#ffffff', '#bae6fd', '#0284c7'],
        gradPts: [[265, -205], [60, 110]],
        stroke: '#78350f',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[248, -185], [185, -85], [115, 20]], false, 0.25)],
        highlightColor: '#ffffff',
        highlightWidth: 6
      }));

      // Jeweled Golden Shamshir Crossguards (Baldoq)
      backShapes.push(grp('ShamshirGuards', [
        shPath([[-235, 65], [-165, 135], [-150, 118], [-220, 48]]),
        shPath([[235, 65], [165, 135], [150, 118], [220, 48]]),
        shCircle(-228, 125, 20),
        shCircle(228, 125, 20)
      ], { grad: ['#fef08a', '#eab308', '#a16207'], stroke: '#78350f', strokeWidth: 12 }));

      // 3D-Rotating Samarkand Registan Turquoise Ribbed Dome inside the crown!
      midShapes.push(...makeSculptedInnerDome(['#67e8f9', '#0284c7', '#0c4a6e'], '#78350f', '#fde047', '#ffffff'));

      // 3D-Tracked Sovereign Peak 0: Royal Timurid Jig'a (Sorguch Feather Plume + Ruby Clasp)
      sovereignPeak.push(...sculptedGrp('TimuridJigaPlume', [
        shSmooth([
          [0, -4], [-34, -58], [-22, -118], [8, -142],
          [36, -96], [28, -42]
        ], true, 0.3)
      ], {
        grad: ['#ffffff', '#bae6fd', '#38bdf8'],
        gradPts: [[0, -142], [0, -4]],
        stroke: '#78350f',
        strokeWidth: 12,
        shadowDy: 5,
        highlightPaths: [shSmooth([[0, -18], [-4, -75], [6, -124]], false, 0.3)],
        highlightColor: '#ffffff',
        highlightWidth: 5
      }));

      sovereignPeak.push(grp('TimuridJigaRubyMount', [
        shCircle(0, -12, 22),
        shStar(0, -12, 14, 7, 8, 0)
      ], { grad: ['#fda4af', '#e11d48', '#881337'], stroke: '#78350f', strokeWidth: 10 }));

      // 3D-Tracked Side Peaks 1..4: Samarkand Turquoise & Gold Pearls
      sidePeakFinials.push(grp('SideTurquoisePearl', [
        shCircle(0, -16, 18),
        shCircle(-5, -21, 6)
      ], { grad: ['#a5f3fc', '#0284c7', '#0c4a6e'], gradPts: [[0, -34], [0, 2]], stroke: '#78350f', strokeWidth: 10 }));

      // Front Architecture: Samarkand Turquoise & Gold Girih Mosaic Collar
      frontShapes.push(...makeSculptedBaseCollar(['#0284c7', '#0369a1', '#0c4a6e'], '#78350f', 'girih', '#fde047'));
      break;
    }

    // ========================================================================
    // 3. SATOSHI NAKAMOTO (5.0% — Crypto Whale Bullish Chart + 3D Bitcoin Medallion)
    // ========================================================================
    case 'satoshi_nakamoto': {
      backAnim = 'float';
      // Sculpted 3D Bullish Green Candlesticks + Golden Breakout Arrow behind the crown
      const candles = [
        { x: -225, yTop: 10, yBot: 95, wTop: -25, wBot: 115 },
        { x: -165, yTop: -55, yBot: 45, wTop: -90, wBot: 70 },
        { x: 165, yTop: -85, yBot: 25, wTop: -125, wBot: 55 },
        { x: 225, yTop: -155, yBot: -25, wTop: -195, wBot: 10 }
      ];
      candles.forEach((c, i) => {
        backShapes.push(grp(`BullWick_${i}`, [
          shPath([[c.x, c.wTop], [c.x, c.wBot]], false)
        ], { stroke: '#064e3b', strokeWidth: 12 }));
        backShapes.push(...sculptedGrp(`BullCandle_${i}`, [
          shPath([[c.x - 20, c.yTop], [c.x + 20, c.yTop], [c.x + 20, c.yBot], [c.x - 20, c.yBot]])
        ], {
          grad: ['#86efac', '#22c55e', '#15803d'],
          gradPts: [[c.x, c.yTop], [c.x, c.yBot]],
          stroke: '#064e3b',
          strokeWidth: 11,
          shadowDy: 6
        }));
      });

      // Soaring Golden Bull Breakout Arrow
      backShapes.push(...sculptedGrp('BullBreakoutArrow', [
        shPath([[225, -230], [268, -172], [244, -172], [244, -125], [206, -125], [206, -172], [182, -172]])
      ], {
        grad: ['#fef08a', '#f59e0b', '#b45309'],
        gradPts: [[225, -230], [225, -125]],
        stroke: '#78350f',
        strokeWidth: 12
      }));

      // 3D-Rotating Crypto Vault Circuit Dome inside the crown
      midShapes.push(...makeSculptedInnerDome(['#065f46', '#064e3b', '#022c22'], '#78350f', '#f59e0b', '#4ade80'));

      // 3D-Tracked Sovereign Peak 0: Giant Sculpted 24K Gold Bitcoin (₿) Medallion!
      sovereignPeak.push(...sculptedGrp('SovereignBtcCoin', [
        shCircle(0, -34, 42),
        shCircle(0, -34, 31)
      ], {
        grad: ['#fef08a', '#f59e0b', '#b45309'],
        gradPts: [[0, -76], [0, 8]],
        stroke: '#78350f',
        strokeWidth: 12,
        shadowDy: 5
      }));
      sovereignPeak.push(grp('SovereignBtcGlyph', [
        shPath([[-11, -54], [6, -54], [15, -48], [15, -39], [7, -34], [17, -29], [17, -18], [6, -13], [-11, -13]]),
        shPath([[-5, -62], [-5, -5]], false),
        shPath([[5, -62], [5, -5]], false)
      ], { fill: '#ffffff', stroke: '#78350f', strokeWidth: 6 }));

      // 3D-Tracked Side Peaks 1..4: Golden Crypto Coins
      sidePeakFinials.push(grp('SideCryptoCoin', [
        shCircle(0, -18, 20),
        shStar(0, -18, 11, 5, 4, 0)
      ], { grad: ['#fef08a', '#f59e0b', '#b45309'], stroke: '#78350f', strokeWidth: 10 }));

      // Front Architecture: Gold Bullion & Emerald LED Base Collar
      frontShapes.push(...makeSculptedBaseCollar(['#fef08a', '#f59e0b', '#92400e'], '#78350f', 'studs', '#22c55e'));
      break;
    }

    // ========================================================================
    // 4. BLACK GOLD VIP (6.0% — Billionaire Matte Carbon-Obsidian & 24K Gold Eagle Wings)
    // ========================================================================
    case 'black_gold_vip': {
      backAnim = 'wings';
      // 3-Tiered Sweeping 24K Gold Imperial Wings behind the crown (14px bold contours!)
      backShapes.push(...sculptedGrp('VipWingLeft', [
        shSmooth([[-145, 35], [-268, -115], [-242, -35], [-275, -18], [-222, 32], [-255, 62], [-155, 92]], true, 0.2),
        shSmooth([[-125, -5], [-245, -175], [-202, -88], [-135, 18]], true, 0.2)
      ], {
        grad: ['#fef08a', '#eab308', '#854d0e'],
        gradPts: [[-275, -175], [-135, 92]],
        stroke: '#713f12',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[-235, -155], [-190, -85], [-145, -10]], false, 0.2)],
        highlightColor: '#ffffff',
        highlightWidth: 6
      }));

      backShapes.push(...sculptedGrp('VipWingRight', [
        shSmooth([[145, 35], [268, -115], [242, -35], [275, -18], [222, 32], [255, 62], [155, 92]], true, 0.2),
        shSmooth([[125, -5], [245, -175], [202, -88], [135, 18]], true, 0.2)
      ], {
        grad: ['#fef08a', '#eab308', '#854d0e'],
        gradPts: [[275, -175], [135, 92]],
        stroke: '#713f12',
        strokeWidth: 14,
        highlightPaths: [shSmooth([[235, -155], [190, -85], [145, -10]], false, 0.2)],
        highlightColor: '#ffffff',
        highlightWidth: 6
      }));

      // 3D-Rotating Quilted Black Velvet Royal Cap with 24K Gold Arches & Studs
      midShapes.push(...makeSculptedInnerDome(['#3f3f46', '#18181b', '#09090b'], '#ca8a04', '#facc15', '#fef08a'));

      // 3D-Tracked Sovereign Peak 0: Giant Black & Gold VVS Diamond Star Finial
      sovereignPeak.push(...sculptedGrp('VipSovereignDiamond', [
        shStar(0, -34, 46, 18, 4, 0),
        shStar(0, -34, 28, 11, 4, 45)
      ], {
        grad: ['#fef08a', '#eab308', '#854d0e'],
        gradPts: [[0, -80], [0, 12]],
        stroke: '#713f12',
        strokeWidth: 11,
        shadowDy: 5
      }));

      // 3D-Tracked Side Peaks 1..4: Faceted 24K Gold Diamonds
      sidePeakFinials.push(grp('VipSideDiamond', [
        shPath([[0, -44], [20, -18], [0, 6], [-20, -18]])
      ], { grad: ['#fef08a', '#eab308', '#854d0e'], stroke: '#713f12', strokeWidth: 10 }));

      // Front Architecture: Matte Carbon-Black & 24K Gold Studded Collar
      frontShapes.push(...makeSculptedBaseCollar(['#27272a', '#18181b', '#09090b'], '#eab308', 'studs', '#fef08a'));
      break;
    }

    // ========================================================================
    // 5. EYE OF SAURON (8.0% — Dark Lord of Mordor: Barad-dûr Spires + Blazing Lidless Eye)
    // ========================================================================
    case 'eye_of_sauron': {
      backAnim = 'flame';
      // Blazing Ring of Mordor Fire behind the crown
      backShapes.push(grp('SauronFireHalo', [
        shSmooth([
          [-185, -35], [-215, -145], [-135, -235], [0, -268],
          [135, -235], [215, -145], [185, -35], [0, 15]
        ], true, 0.28)
      ], { grad: ['#fef08a', '#f97316', '#7f1d1d'], gradPts: [[0, -268], [0, 15]], stroke: '#450a0a', strokeWidth: 12, opacity: 92 }));

      // Towering Barad-dûr Dark Forged Iron Horns framing the Eye
      backShapes.push(...sculptedGrp('BaradDurSpires', [
        shSmooth([[-145, 25], [-195, -95], [-145, -235], [-98, -255], [-122, -125], [-85, -10]], true, 0.2),
        shSmooth([[145, 25], [195, -95], [145, -235], [98, -255], [122, -125], [85, -10]], true, 0.2)
      ], {
        grad: ['#57534e', '#1c1917', '#09090b'],
        gradPts: [[0, -255], [0, 25]],
        stroke: '#09090b',
        strokeWidth: 14,
        highlightPaths: [
          shSmooth([[-138, -225], [-175, -100]], false, 0.2),
          shSmooth([[138, -225], [175, -100]], false, 0.2)
        ],
        highlightColor: '#f97316',
        highlightWidth: 5
      }));

      // The Great Blazing Lidless Eye of Sauron suspended between the spires
      backShapes.push(...sculptedGrp('GreatEyeOuter', [
        shSmooth([[-108, -168], [-52, -216], [0, -226], [52, -216], [108, -168], [52, -120], [0, -110], [-52, -120]], true, 0.28)
      ], {
        grad: ['#fef08a', '#f97316', '#dc2626'],
        gradPts: [[0, -226], [0, -110]],
        stroke: '#450a0a',
        strokeWidth: 12,
        shadowDy: 6
      }));
      backShapes.push(grp('GreatEyeIris', [
        shEllipse(0, -168, 52, 36)
      ], { grad: ['#fef9c3', '#facc15', '#ea580c'], stroke: '#dc2626', strokeWidth: 5 }));
      backShapes.push(grp('GreatEyeSlitPupil', [
        shSmooth([[0, -206], [11, -168], [0, -130], [-11, -168]], true, 0.2)
      ], { fill: '#09090b', stroke: '#fef08a', strokeWidth: 3 }));

      // 3D-Rotating Volcanic Magma Core inside the crown
      midShapes.push(...makeSculptedInnerDome(['#ea580c', '#991b1b', '#1c1917'], '#09090b', '#facc15'));

      // 3D-Tracked Sovereign Peak 0: Dark Iron Morgul Spire & Fire Orb
      sovereignPeak.push(grp('SauronSovereignFinial', [
        shSmooth([[0, -64], [24, -22], [14, 6], [-14, 6], [-24, -22]], true, 0.25),
        shCircle(0, -24, 12)
      ], { grad: ['#fef08a', '#f97316', '#7f1d1d'], stroke: '#09090b', strokeWidth: 11 }));

      // 3D-Tracked Side Peaks 1..4: Blazing Hellfire Orbs
      sidePeakFinials.push(grp('SauronSideFlame', [
        shSmooth([[0, -48], [20, -20], [12, 4], [-12, 4], [-20, -20]], true, 0.25)
      ], { grad: ['#fef08a', '#f97316', '#991b1b'], stroke: '#09090b', strokeWidth: 10 }));

      // Front Architecture: Dripping Molten Lava Rim
      frontShapes.push(...makeSculptedBaseCollar(['#fef08a', '#f97316', '#991b1b'], '#450a0a', 'lava'));
      break;
    }

    // ========================================================================
    // 6. TON CRYSTAL (9.0% — Telegram Open Network 3D Prism & Spinning Hex Halo)
    // ========================================================================
    case 'ton_crystal': {
      backAnim = 'float';
      // Sacred Hexagonal Cyber Energy Shield & Crystalline Wings behind the crown
      backShapes.push(grp('TonHexShield', [
        shStar(0, -85, 225, 195, 6, 0),
        shRing(0, -85, 175, 155)
      ].flat(), { grad: ['#e0f2fe', '#38bdf8', '#0284c7'], stroke: '#0369a1', strokeWidth: 12, opacity: 75 }));

      // Crystalline Cyan Spires flanking left and right
      backShapes.push(...sculptedGrp('TonCrystalWings', [
        shPath([[-155, 25], [-258, -95], [-210, -145], [-125, -25]]),
        shPath([[155, 25], [258, -95], [210, -145], [125, -25]])
      ], {
        grad: ['#ffffff', '#38bdf8', '#0369a1'],
        gradPts: [[0, -145], [0, 25]],
        stroke: '#0c4a6e',
        strokeWidth: 13
      }));

      // 3D-Rotating Sapphire Crystal Core inside the crown
      midShapes.push(...makeSculptedInnerDome(['#7dd3fc', '#0284c7', '#0c4a6e'], '#075985', '#e0f2fe', '#ffffff'));

      // 3D-Tracked Sovereign Peak 0: Giant Faceted 3D TON Crystal Prism!
      sovereignPeak.push(...sculptedGrp('TonSovereignPrism', [
        shPath([[0, -96], [54, -48], [0, 14], [-54, -48]])
      ], {
        grad: ['#ffffff', '#38bdf8', '#0284c7'],
        gradPts: [[0, -96], [0, 14]],
        stroke: '#0c4a6e',
        strokeWidth: 12,
        shadowDy: 5
      }));
      sovereignPeak.push(grp('TonPrismFacets', [
        shPath([[-54, -48], [54, -48]], false),
        shPath([[0, -96], [0, 14]], false),
        shPath([[-26, -72], [0, -48], [26, -72]], false)
      ], { stroke: '#ffffff', strokeWidth: 6 }));

      // 3D-Tracked Side Peaks 1..4: Faceted Cyan Diamond Shards
      sidePeakFinials.push(grp('TonSideShard', [
        shPath([[0, -44], [19, -18], [0, 6], [-19, -18]])
      ], { grad: ['#ffffff', '#38bdf8', '#0284c7'], stroke: '#0c4a6e', strokeWidth: 10 }));

      // Front Architecture: Titanium & Cyan Energy Collar
      frontShapes.push(...makeSculptedBaseCollar(['#e0f2fe', '#0284c7', '#0c4a6e'], '#075985', 'studs', '#ffffff'));
      break;
    }

    // ========================================================================
    // 7. JULIUS CAESAR (11.0% — Roman Emperor Centurion Plume + Sculpted Golden Laurel Wreath)
    // ========================================================================
    case 'julius_caesar': {
      backAnim = 'breathe';
      // Majestic Roman Centurion Helmet Crest (Crista) arching grandly over the crown (15px bold contour!)
      backShapes.push(...sculptedGrp('RomanCenturionCrest', [
        shSmooth([
          [-195, -55], [-225, -165], [-135, -245], [0, -268],
          [135, -245], [225, -165], [195, -55],
          [125, -118], [0, -142], [-125, -118]
        ], true, 0.25)
      ], {
        grad: ['#fca5a5', '#dc2626', '#7f1d1d'],
        gradPts: [[0, -268], [0, -55]],
        stroke: '#78350f',
        strokeWidth: 15,
        highlightPaths: [
          shSmooth([[-165, -165], [-85, -225], [0, -242], [85, -225], [165, -165]], false, 0.25)
        ],
        highlightColor: '#fecaca',
        highlightWidth: 6
      }));

      // Golden Crest Comb Holder & Feather Texture Lines
      backShapes.push(grp('RomanCrestComb', [
        shSmooth([[-135, -110], [0, -142], [135, -110], [115, -80], [0, -108], [-115, -80]], true, 0.25),
        shPath([[-95, -222], [-65, -125]], false),
        shPath([[-45, -245], [-30, -135]], false),
        shPath([[0, -254], [0, -140]], false),
        shPath([[45, -245], [30, -135]], false),
        shPath([[95, -222], [65, -125]], false)
      ], { grad: ['#fef08a', '#eab308', '#a16207'], stroke: '#78350f', strokeWidth: 10 }));

      // 3D-Rotating Imperial Crimson Casque Dome inside the crown
      midShapes.push(...makeSculptedInnerDome(['#ef4444', '#b91c1c', '#7f1d1d'], '#78350f', '#fde047', '#fef08a'));

      // 3D-Tracked Sovereign Peak 0: Golden Roman Imperial Eagle / Sun Medallion
      sovereignPeak.push(...sculptedGrp('RomanSovereignMedallion', [
        shCircle(0, -24, 28),
        shStar(0, -24, 22, 9, 8, 0)
      ], {
        grad: ['#fef08a', '#eab308', '#a16207'],
        stroke: '#78350f',
        strokeWidth: 11,
        shadowDy: 4
      }));

      // 3D-Tracked Side Peaks 1..4: Imperial Roman Gold Pearls
      sidePeakFinials.push(grp('RomanSidePearl', [
        shCircle(0, -16, 17)
      ], { grad: ['#fef9c3', '#eab308', '#a16207'], stroke: '#78350f', strokeWidth: 10 }));

      // Front Architecture: Sculpted 24K Golden Laurel Wreath wrapping both sides of the crown!
      const laurelPairs = [
        { x: -182, y: 118, a: -35 },
        { x: -162, y: 68, a: -22 },
        { x: -135, y: 18, a: -10 },
        { x: -100, y: -26, a: 8 },
        { x: -58, y: -58, a: 25 }
      ];
      const leftLeaves = [];
      const rightLeaves = [];
      laurelPairs.forEach(({ x, y }) => {
        leftLeaves.push(
          shSmooth([[x, y + 26], [x - 36, y - 6], [x - 10, y - 42], [x + 16, y - 8]], true, 0.28),
          shSmooth([[x, y + 26], [x + 30, y - 4], [x + 12, y - 38], [x - 10, y - 8]], true, 0.28)
        );
        rightLeaves.push(
          shSmooth([[-x, y + 26], [-x + 36, y - 6], [-x + 10, y - 42], [-x - 16, y - 8]], true, 0.28),
          shSmooth([[-x, y + 26], [-x - 30, y - 4], [-x - 12, y - 38], [-x + 10, y - 8]], true, 0.28)
        );
      });

      frontShapes.push(...makeSculptedBaseCollar(['#dc2626', '#991b1b', '#450a0a'], '#78350f', 'studs', '#fef08a'));
      frontShapes.push(...sculptedGrp('LaurelWreathLeft', leftLeaves, {
        grad: ['#fef08a', '#eab308', '#a16207'],
        gradPts: [[-200, -70], [-60, 140]],
        stroke: '#78350f',
        strokeWidth: 11,
        shadowDy: 7
      }));
      frontShapes.push(...sculptedGrp('LaurelWreathRight', rightLeaves, {
        grad: ['#fef08a', '#eab308', '#a16207'],
        gradPts: [[200, -70], [60, 140]],
        stroke: '#78350f',
        strokeWidth: 11,
        shadowDy: 7
      }));
      break;
    }

    // ========================================================================
    // 8. AKATSUKI CLOUD (14.0% — Rogue Shinobi: Iconic Red Clouds + Scratched Forehead Plate + Sharingan)
    // ========================================================================
    case 'akatsuki_cloud': {
      backAnim = 'float';
      // Two Iconic Red-and-White Akatsuki Clouds floating behind the crown (thick 14px double-bordered!)
      const cloudLeft = shSmooth([
        [-268, 22], [-282, -36], [-234, -78], [-192, -52],
        [-152, -98], [-92, -66], [-108, 12], [-182, 34]
      ], true, 0.32);
      const cloudRight = shSmooth([
        [268, 22], [282, -36], [234, -78], [192, -52],
        [152, -98], [92, -66], [108, 12], [182, 34]
      ], true, 0.32);

      backShapes.push(grp('AkatsukiCloudOuterBorder', [
        JSON.parse(JSON.stringify(cloudLeft)),
        JSON.parse(JSON.stringify(cloudRight))
      ], { stroke: '#09090b', strokeWidth: 24 }));

      backShapes.push(grp('AkatsukiCloudMain', [
        cloudLeft,
        cloudRight
      ], { grad: ['#f87171', '#dc2626', '#991b1b'], gradPts: [[0, -100], [0, 35]], stroke: '#ffffff', strokeWidth: 12 }));

      // Inner Akatsuki Cloud Swirl Lines
      backShapes.push(grp('AkatsukiCloudSwirls', [
        shSmooth([[-235, -18], [-200, -45], [-165, -18]], false, 0.3),
        shSmooth([[235, -18], [200, -45], [165, -18]], false, 0.3)
      ], { stroke: '#ffffff', strokeWidth: 7 }));

      // 3D-Rotating Dark Uchiha Crimson Chakra Core inside the crown
      midShapes.push(...makeSculptedInnerDome(['#991b1b', '#450a0a', '#09090b'], '#09090b', '#ef4444', '#ffffff'));

      // 3D-Tracked Sovereign Peak 0: Sculpted Shinobi Kunai / Sharingan Finial
      sovereignPeak.push(...sculptedGrp('AkatsukiSovereignKunai', [
        shPath([[0, -92], [24, -36], [0, -12], [-24, -36]]),
        shCircle(0, 0, 12)
      ], {
        grad: ['#f4f4f5', '#a1a1aa', '#3f3f46'],
        gradPts: [[0, -92], [0, 10]],
        stroke: '#09090b',
        strokeWidth: 11,
        shadowDy: 4
      }));

      // 3D-Tracked Side Peaks 1..4: Crimson Sharingan Orbs
      sidePeakFinials.push(grp('AkatsukiSideOrb', [
        shCircle(0, -16, 17),
        shCircle(0, -16, 6)
      ], { grad: ['#f87171', '#dc2626', '#7f1d1d'], stroke: '#09090b', strokeWidth: 10 }));

      // Front Architecture: Dark Shinobi Cloth Band + Brushed Steel Scratched Forehead Protector Plate!
      frontShapes.push(...makeSculptedBaseCollar(['#27272a', '#18181b', '#09090b'], '#09090b', 'studs', '#ef4444'));

      frontShapes.push(...sculptedGrp('ShinobiSteelPlate', [
        shSmooth([
          [-118, 118], [0, 128], [118, 118],
          [112, 178], [0, 188], [-112, 178]
        ], true, 0.16)
      ], {
        grad: ['#f4f4f5', '#a1a1aa', '#52525b'],
        gradPts: [[-118, 118], [118, 188]],
        stroke: '#09090b',
        strokeWidth: 12,
        shadowDy: 6,
        highlightPaths: [shSmooth([[-98, 128], [0, 136], [98, 128]], false, 0.16)],
        highlightColor: '#ffffff',
        highlightWidth: 5
      }));

      // 6 Bolts + Deep Rogue Slash Scratch across the Steel Plate
      frontShapes.push(grp('ShinobiRogueSlash', [
        shCircle(-94, 136, 5), shCircle(-94, 166, 5),
        shCircle(94, 136, 5), shCircle(94, 166, 5),
        shSmooth([[-28, 154], [0, 136], [28, 154], [0, 172]], true, 0.25),
        shPath([[-78, 154], [78, 152]], false)
      ], { fill: '#09090b', stroke: '#09090b', strokeWidth: 9 }));
      break;
    }

    // ========================================================================
    // 9. PAXTA IMPERIAL (18.0% — Milliy Oq Oltin: Plush Cotton Boll Dome + Golden Calyx + Khan-Atlas)
    // ========================================================================
    case 'paxta_imperial': {
      backAnim = 'breathe';
      // Radiant Bukhara Golden Sunburst & Turquoise Floral Leaves behind the crown
      backShapes.push(...sculptedGrp('PaxtaSunburstLeaves', [
        shSmooth([[-145, 25], [-248, -65], [-212, -135], [-125, -45]], true, 0.28),
        shSmooth([[145, 25], [248, -65], [212, -135], [125, -45]], true, 0.28),
        shStar(0, -55, 225, 165, 12, 0)
      ], {
        grad: ['#fef08a', '#eab308', '#ca8a04'],
        gradPts: [[0, -230], [0, 60]],
        stroke: '#854d0e',
        strokeWidth: 12,
        opacity: 90
      }));

      // Plush, Billowy Snow-White Royal Cotton Boll (Paxta Chanoqlari) Dome nestled inside the crown!
      midShapes.push(...sculptedGrp('PaxtaCottonCloudDome', [
        shCircle(-92, -52, 68),
        shCircle(92, -52, 68),
        shCircle(-46, -108, 74),
        shCircle(46, -108, 74),
        shCircle(0, -128, 78),
        shCircle(0, -48, 82)
      ], {
        grad: ['#ffffff', '#f8fafc', '#cbd5e1'],
        gradPts: [[0, -206], [0, 35]],
        stroke: '#854d0e',
        strokeWidth: 15,
        shadowDy: 6
      }));

      // Soft Cream Inner Puff Shading & Golden-Green Calyx Leaves hugging the Cotton Dome
      midShapes.push(grp('PaxtaCottonFluffLines', [
        shSmooth([[-75, -85], [-35, -125], [0, -95], [35, -125], [75, -85]], false, 0.3),
        shSmooth([[-105, -35], [-45, -68], [0, -42], [45, -68], [105, -35]], false, 0.3)
      ], { stroke: '#94a3b8', strokeWidth: 7, opacity: 65 }));

      midShapes.push(grp('PaxtaGoldenCalyx', [
        shSmooth([[-145, 25], [-105, -52], [-58, 12]], true, 0.22),
        shSmooth([[-55, 32], [0, -64], [55, 32]], true, 0.22),
        shSmooth([[58, 12], [105, -52], [145, 25]], true, 0.22)
      ], { grad: ['#fef08a', '#eab308', '#15803d'], gradPts: [[0, -64], [0, 32]], stroke: '#713f12', strokeWidth: 10 }));

      // 3D-Tracked Sovereign Peak 0: Blooming Royal Cotton Boll in a Golden Cup!
      sovereignPeak.push(...sculptedGrp('PaxtaSovereignBoll', [
        shCircle(-14, -24, 18),
        shCircle(14, -24, 18),
        shCircle(0, -38, 20),
        shPath([[-22, -10], [0, -28], [22, -10], [0, 6]])
      ], {
        grad: ['#ffffff', '#f8fafc', '#fde047'],
        gradPts: [[0, -58], [0, 6]],
        stroke: '#854d0e',
        strokeWidth: 11,
        shadowDy: 4
      }));

      // 3D-Tracked Side Peaks 1..4: Miniature Snow-White Cotton Bolls
      sidePeakFinials.push(grp('PaxtaSideBoll', [
        shCircle(-8, -18, 12),
        shCircle(8, -18, 12),
        shCircle(0, -26, 13)
      ], { grad: ['#ffffff', '#f1f5f9', '#cbd5e1'], stroke: '#854d0e', strokeWidth: 10 }));

      // Front Architecture: Bukhara Turquoise & Gold Mosaic Collar
      frontShapes.push(...makeSculptedBaseCollar(['#fef08a', '#eab308', '#a16207'], '#854d0e', 'girih', '#06b6d4'));
      break;
    }

    // ========================================================================
    // 10. IMPERIAL CLASSIC (22.0% — Sovereign Monarchy: Crimson Velvet Cap + Ermine Fur + Orb & Cross)
    // ========================================================================
    case 'imperial_classic':
    default: {
      backAnim = 'breathe';
      // Radiant Sovereign Gold Sunburst Halo behind the crown
      backShapes.push(grp('ImperialClassicHalo', [
        shStar(0, -65, 220, 175, 16, 0)
      ], { grad: ['#fef9c3', '#facc15', '#b45309'], stroke: '#78350f', strokeWidth: 12, opacity: 80 }));

      // 3D-Rotating Crimson Velvet Cap of Estate with Pearl-Studded Gold Arches!
      midShapes.push(...makeSculptedInnerDome(['#f87171', '#dc2626', '#7f1d1d'], '#78350f', '#fde047', '#ffffff'));

      // 3D-Tracked Sovereign Peak 0: Classic Globus Cruciger (Royal Golden Orb & Jewelled Cross)!
      sovereignPeak.push(...sculptedGrp('ImperialGlobusCruciger', [
        shCircle(0, -22, 24),
        shPath([[-24, -22], [24, -22]], false),
        shPath([[0, -46], [0, 2]], false),
        shStar(0, -68, 26, 9, 4, 0)
      ], {
        grad: ['#fef08a', '#eab308', '#a16207'],
        gradPts: [[0, -94], [0, 2]],
        stroke: '#78350f',
        strokeWidth: 11,
        shadowDy: 4
      }));

      // 3D-Tracked Side Peaks 1..4: Large Sovereign White Pearls in Golden Cups
      sidePeakFinials.push(grp('ImperialSidePearl', [
        shCircle(0, -18, 18),
        shCircle(-5, -23, 6)
      ], { grad: ['#ffffff', '#fef08a', '#ca8a04'], stroke: '#78350f', strokeWidth: 10 }));

      // Front Architecture: Plush Royal White Ermine Fur Base Collar with Black Tails
      frontShapes.push(...makeSculptedBaseCollar(['#ffffff', '#f1f5f9', '#cbd5e1'], '#78350f', 'ermine', '#eab308'));
      break;
    }
  }

  return { backShapes, midShapes, frontShapes, sovereignPeak, sidePeakFinials, frontAnim, backAnim };
}

// ============================================================================
// 3D-ROTATING SOCKET EMBLEMS (Injected into Center 13/14, Left 8/9, Right 10/11)
// Automatically foreshortens in 3D as each socket rotates around the crown!
// ============================================================================
const CENTER_GEM_POS = [265.173, 339.649];
const LEFT_GEM_POS = [100.638, 364.696];
const RIGHT_GEM_POS = [420.285, 366.047];

function buildCenterSocketEmblem(emblemType, strokeHex, fillHex, animScaleProp) {
  const cx = 0;
  const cy = 0;
  const baseOpts = {
    pos: CENTER_GEM_POS,
    animScale: animScaleProp
  };

  // Every center socket gets an ornate sculpted Golden/Themed Filigree Setting Ring around the gem + center emblem!
  const settingRing = grp('CenterFiligreeRing', [
    shStar(cx, cy, 56, 44, 8, 0),
    ...shRing(cx, cy, 46, 38)
  ], { ...baseOpts, fill: fillHex, stroke: strokeHex, strokeWidth: 7 });

  switch (emblemType) {
    case 'shadow':
      return [
        settingRing,
        grp('EmblemShadowRune', [
          shStar(cx, cy, 34, 11, 4, 0),
          shCircle(cx, cy, 9)
        ], { ...baseOpts, fill: '#ffffff', stroke: strokeHex, strokeWidth: 5 })
      ];
    case 'temur':
      return [
        settingRing,
        grp('EmblemTemurTamgha', [
          ...shRing(cx, cy - 13, 12, 6),
          ...shRing(cx - 13, cy + 10, 12, 6),
          ...shRing(cx + 13, cy + 10, 12, 6)
        ], { ...baseOpts, fill: '#fef08a', stroke: '#78350f', strokeWidth: 4 })
      ];
    case 'btc':
      return [
        settingRing,
        grp('EmblemBitcoin', [
          shCircle(cx, cy, 30),
          shPath([[-10, -18], [5, -18], [13, -12], [13, -4], [5, 0], [15, 4], [15, 14], [5, 18], [-10, 18]]),
          shPath([[-4, -25], [-4, 25]], false),
          shPath([[4, -25], [4, 25]], false)
        ], { ...baseOpts, fill: '#ffffff', stroke: '#78350f', strokeWidth: 5 })
      ];
    case 'vip':
      return [
        settingRing,
        grp('EmblemVipCrest', [
          shStar(cx, cy, 30, 12, 4, 0),
          shCircle(cx, cy, 8)
        ], { ...baseOpts, fill: '#fef08a', stroke: '#713f12', strokeWidth: 5 })
      ];
    case 'eye':
      return [
        settingRing,
        grp('EmblemSauronEye', [
          shEllipse(cx, cy, 30, 18),
          shPath([[cx, cy - 22], [cx + 6, cy], [cx, cy + 22], [cx - 6, cy]])
        ], { ...baseOpts, fill: '#09090b', stroke: '#fef08a', strokeWidth: 5 })
      ];
    case 'ton':
      return [
        settingRing,
        grp('EmblemTonPrism', [
          shPath([[cx - 24, cy - 16], [cx + 24, cy - 16], [cx, cy + 24]]),
          shPath([[cx, cy - 16], [cx, cy + 24]], false)
        ], { ...baseOpts, fill: '#ffffff', stroke: '#0c4a6e', strokeWidth: 5 })
      ];
    case 'caesar':
      return [
        settingRing,
        grp('EmblemCaesarSun', [
          shStar(cx, cy, 28, 12, 8, 0),
          shCircle(cx, cy, 9)
        ], { ...baseOpts, fill: '#fef08a', stroke: '#78350f', strokeWidth: 5 })
      ];
    case 'sharingan':
      return [
        settingRing,
        grp('EmblemSharingan', [
          shCircle(cx, cy, 9),
          ...shRing(cx, cy, 24, 20),
          shCircle(cx, cy - 21, 5.5),
          shCircle(cx - 18, cy + 11, 5.5),
          shCircle(cx + 18, cy + 11, 5.5)
        ], { ...baseOpts, fill: '#09090b', stroke: '#09090b', strokeWidth: 2 })
      ];
    case 'cotton':
      return [
        settingRing,
        grp('EmblemPaxtaCotton', [
          shCircle(cx, cy - 12, 13),
          shCircle(cx - 12, cy, 13),
          shCircle(cx + 12, cy, 13),
          shCircle(cx, cy + 10, 12)
        ], { ...baseOpts, fill: '#ffffff', stroke: '#854d0e', strokeWidth: 5 })
      ];
    case 'imperial':
    default:
      return [
        settingRing,
        grp('EmblemImperialCross', [
          shStar(cx, cy, 28, 9, 4, 0),
          shCircle(cx, cy, 8)
        ], { ...baseOpts, fill: '#ffffff', stroke: '#78350f', strokeWidth: 5 })
      ];
  }
}

// Build 3D-Rotating Side Filigree / Reliefs for Left Socket (8/9) and Right Socket (10/11)
function buildSideSocketRelief(pos, strokeHex, accentHex, animScaleProp) {
  return grp('SideSocketFiligree', [
    shStar(0, 0, 36, 22, 4, 0),
    shCircle(0, 0, 10)
  ], {
    pos,
    animScale: animScaleProp,
    fill: accentHex,
    stroke: strokeHex,
    strokeWidth: 5
  });
}

// ============================================================================
// TOP 10 ELITE VIP MODELS SPECIFICATION (Sum of rarity = 1000 permille = 100.0%)
// ============================================================================
const MODELS_SPEC = [
  {
    id: 'shadow_monarch',
    name: 'Shadow Monarch',
    rarity: 30, // 3.0%
    bodyGrad: ['#3b0764', '#1e0944', '#05020a'],
    backGrad: ['#1e0944', '#090414', '#020105'],
    contour: '#a855f7',
    rimGrad: ['#38bdf8', '#c084fc', '#6b21a8'],
    sheenGrad: ['#e0f2fe', '#c084fc', '#581c87'],
    sparkle: '#38bdf8',
    centerGem: ['#e0f2fe', '#a855f7', '#3b0764', '#2e1065'],
    leftGem: ['#38bdf8', '#0284c7'],
    rightGem: ['#c084fc', '#6b21a8'],
    emblem: 'shadow'
  },
  {
    id: 'amir_temur',
    name: 'Amir Temur',
    rarity: 40, // 4.0%
    bodyGrad: ['#fef08a', '#eab308', '#a16207'],
    backGrad: ['#ca8a04', '#854d0e', '#422006'],
    contour: '#78350f',
    rimGrad: ['#ffffff', '#67e8f9', '#0284c7'],
    sheenGrad: ['#ffffff', '#fef08a', '#f59e0b'],
    sparkle: '#38bdf8',
    centerGem: ['#a5f3fc', '#06b6d4', '#0e7490', '#78350f'],
    leftGem: ['#f43f5e', '#881337'],
    rightGem: ['#10b981', '#064e3b'],
    emblem: 'temur'
  },
  {
    id: 'satoshi_nakamoto',
    name: 'Satoshi Nakamoto',
    rarity: 50, // 5.0%
    bodyGrad: ['#fef08a', '#f59e0b', '#b45309'],
    backGrad: ['#d97706', '#92400e', '#451a03'],
    contour: '#78350f',
    rimGrad: ['#ffffff', '#fde047', '#f59e0b'],
    sheenGrad: ['#ffffff', '#fef08a', '#f97316'],
    sparkle: '#4ade80',
    centerGem: ['#fef08a', '#f97316', '#c2410c', '#7c2d12'],
    leftGem: ['#4ade80', '#14532d'],
    rightGem: ['#4ade80', '#14532d'],
    emblem: 'btc'
  },
  {
    id: 'black_gold_vip',
    name: 'Black Gold VIP',
    rarity: 60, // 6.0%
    bodyGrad: ['#3f3f46', '#18181b', '#09090b'],
    backGrad: ['#18181b', '#09090b', '#000000'],
    contour: '#eab308',
    rimGrad: ['#ffffff', '#fef08a', '#ca8a04'],
    sheenGrad: ['#fef9c3', '#eab308', '#713f12'],
    sparkle: '#fde047',
    centerGem: ['#fef9c3', '#eab308', '#854d0e', '#422006'],
    leftGem: ['#facc15', '#713f12'],
    rightGem: ['#facc15', '#713f12'],
    emblem: 'vip'
  },
  {
    id: 'eye_of_sauron',
    name: 'Eye of Sauron',
    rarity: 80, // 8.0%
    bodyGrad: ['#451a03', '#1c1917', '#09090b'],
    backGrad: ['#1c1917', '#09090b', '#000000'],
    contour: '#ea580c',
    rimGrad: ['#fef08a', '#f97316', '#dc2626'],
    sheenGrad: ['#fde047', '#f97316', '#991b1b'],
    sparkle: '#fb923c',
    centerGem: ['#fef08a', '#f97316', '#b91c1c', '#450a0a'],
    leftGem: ['#ef4444', '#7f1d1d'],
    rightGem: ['#f97316', '#7c2d12'],
    emblem: 'eye'
  },
  {
    id: 'ton_crystal',
    name: 'TON Crystal',
    rarity: 90, // 9.0%
    bodyGrad: ['#e0f2fe', '#38bdf8', '#0284c7'],
    backGrad: ['#0284c7', '#0369a1', '#0c4a6e'],
    contour: '#075985',
    rimGrad: ['#ffffff', '#bae6fd', '#38bdf8'],
    sheenGrad: ['#ffffff', '#e0f2fe', '#0284c7'],
    sparkle: '#ffffff',
    centerGem: ['#ffffff', '#38bdf8', '#0284c7', '#0c4a6e'],
    leftGem: ['#a5f3fc', '#0e7490'],
    rightGem: ['#bae6fd', '#0369a1'],
    emblem: 'ton'
  },
  {
    id: 'julius_caesar',
    name: 'Julius Caesar',
    rarity: 110, // 11.0%
    bodyGrad: ['#fef9c3', '#eab308', '#a16207'],
    backGrad: ['#b91c1c', '#7f1d1d', '#450a0a'],
    contour: '#78350f',
    rimGrad: ['#ffffff', '#fef08a', '#ca8a04'],
    sheenGrad: ['#ffffff', '#fef08a', '#eab308'],
    sparkle: '#fef08a',
    centerGem: ['#fca5a5', '#ef4444', '#991b1b', '#7f1d1d'],
    leftGem: ['#4ade80', '#14532d'],
    rightGem: ['#4ade80', '#14532d'],
    emblem: 'caesar'
  },
  {
    id: 'akatsuki_cloud',
    name: 'Akatsuki Cloud',
    rarity: 140, // 14.0%
    bodyGrad: ['#3f3f46', '#18181b', '#09090b'],
    backGrad: ['#7f1d1d', '#450a0a', '#09090b'],
    contour: '#dc2626',
    rimGrad: ['#ffffff', '#f87171', '#dc2626'],
    sheenGrad: ['#fecaca', '#ef4444', '#7f1d1d'],
    sparkle: '#ef4444',
    centerGem: ['#fca5a5', '#ef4444', '#991b1b', '#09090b'],
    leftGem: ['#ef4444', '#09090b'],
    rightGem: ['#ef4444', '#09090b'],
    emblem: 'sharingan'
  },
  {
    id: 'paxta_imperial',
    name: 'Paxta Imperial',
    rarity: 180, // 18.0%
    bodyGrad: ['#fef08a', '#eab308', '#ca8a04'],
    backGrad: ['#ca8a04', '#854d0e', '#422006'],
    contour: '#854d0e',
    rimGrad: ['#ffffff', '#f8fafc', '#fde047'],
    sheenGrad: ['#ffffff', '#fef9c3', '#eab308'],
    sparkle: '#ffffff',
    centerGem: ['#ffffff', '#38bdf8', '#0284c7', '#854d0e'],
    leftGem: ['#34d399', '#065f46'],
    rightGem: ['#38bdf8', '#075985'],
    emblem: 'cotton'
  },
  {
    id: 'imperial_classic',
    name: 'Imperial Classic',
    rarity: 220, // 22.0%
    bodyGrad: ['#fef08a', '#eab308', '#a16207'],
    backGrad: ['#ca8a04', '#854d0e', '#422006'],
    contour: '#78350f',
    rimGrad: ['#ffffff', '#fef9c3', '#eab308'],
    sheenGrad: ['#ffffff', '#fef08a', '#ca8a04'],
    sparkle: '#fef08a',
    centerGem: ['#bae6fd', '#0284c7', '#1d4ed8', '#78350f'],
    leftGem: ['#22c55e', '#14532d'],
    rightGem: ['#f43f5e', '#881337'],
    emblem: 'imperial'
  }
];

function customizeCrownLottie(baseObj, spec) {
  const data = JSON.parse(JSON.stringify(baseObj));
  const [b1, b2, b3] = spec.bodyGrad.map(hexToRgb01);
  const [bk1, bk2, bk3] = spec.backGrad.map(hexToRgb01);
  const contourRgb = hexToRgb01(spec.contour);
  const [r1, r2, r3] = spec.rimGrad.map(hexToRgb01);
  const [s1, s2, s3] = spec.sheenGrad.map(hexToRgb01);
  const sparkleRgb = hexToRgb01(spec.sparkle);

  const [cLight, cMid, cDark, cStroke] = spec.centerGem;
  const facetHexes = build12GemFacets(cLight, cMid, cDark);
  const centerStrokeRgb = hexToRgb01(cStroke);

  const [ljFill, ljStroke] = spec.leftGem.map(hexToRgb01);
  const [rjFill, rjStroke] = spec.rightGem.map(hexToRgb01);

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
      const animScale = buildSocket3DScaleKfs(l);
      l.shapes.unshift(buildSideSocketRelief(LEFT_GEM_POS, spec.contour, spec.rimGrad[1], animScale));
    }
    if (l.ind === 10 || l.ind === 11) {
      const g2 = l.shapes?.find(g => g.nm === 'Group 2');
      if (g2) {
        const st = g2.it.find(x => x.ty === 'st');
        const fl = g2.it.find(x => x.ty === 'fl');
        if (st) st.c.k = [...rjStroke, 1];
        if (fl) fl.c.k = [...rjFill, 1];
      }
      const animScale = buildSocket3DScaleKfs(l);
      l.shapes.unshift(buildSideSocketRelief(RIGHT_GEM_POS, spec.contour, spec.rimGrad[1], animScale));
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
      const animScale = buildSocket3DScaleKfs(l);
      const emblemGroups = buildCenterSocketEmblem(spec.emblem, spec.contour, spec.rimGrad[1], animScale);
      if (emblemGroups.length) {
        l.shapes.unshift(...emblemGroups.reverse());
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

  // Build bespoke 3D-synchronized architecture for this VIP model
  const arch = buildVIPModelArchitecture(spec.id);
  const { frontLayers: peakFrontLayers, backLayers: peakBackLayers } = build3DTrackedPeakLayers(
    arch.sovereignPeak,
    arch.sidePeakFinials
  );

  // 1. Insert Front Peak Finials + Front Architecture right after Sparkles (ind 1..5)
  const frontInsertLayers = [];
  if (peakFrontLayers.length) frontInsertLayers.push(...peakFrontLayers);
  if (arch.frontShapes.length) {
    frontInsertLayers.push(makeCrownLayer('ModelFrontArchitecture', 60, arch.frontShapes, arch.frontAnim));
  }
  if (frontInsertLayers.length) {
    data.layers.splice(5, 0, ...frontInsertLayers);
  }

  // 2. Insert 3D-Rotating Inner Royal Dome between Перед (ind 17) and Зад (ind 18)
  if (arch.midShapes.length) {
    const midLayer = makeCrownLayer('ModelInnerDome', 61, arch.midShapes, 'static');
    const zadIdx = data.layers.findIndex(l => l.ind === 18);
    data.layers.splice(zadIdx, 0, midLayer);
  }

  // 3. Insert Back Peak Finials + Back Architecture behind Зад (ind 18), right before NULL CONTROL (ind 19)
  const backInsertLayers = [];
  if (peakBackLayers.length) backInsertLayers.push(...peakBackLayers);
  if (arch.backShapes.length) {
    backInsertLayers.push(makeCrownLayer('ModelBackAura', 62, arch.backShapes, arch.backAnim));
  }
  if (backInsertLayers.length) {
    const nullIdx = data.layers.findIndex(l => l.ind === 19);
    data.layers.splice(nullIdx, 0, ...backInsertLayers);
  }

  // Scale NULL CONTROL to 86% so towering plumes, scimitars, wings, and spires fit cleanly inside 512x512
  const nullLayer = data.layers.find(l => l.ind === 19);
  if (nullLayer && nullLayer.ks) {
    nullLayer.ks.s = { a: 0, k: [86, 86, 100] };
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
    if ((layer.ip || 0) > 0) continue;
    if ([9, 10, 13, 15].includes(layer.ind)) continue;

    let layerOpVal = evalAnimProp(layer.ks?.o);
    if (Array.isArray(layerOpVal)) layerOpVal = layerOpVal[0];
    const layerOp = (layerOpVal ?? 100) / 100;
    if (layerOp <= 0.01) continue;

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

// 2. Generate all 10 Elite VIP Models (.tgs + .json + .svg)
const modelsOut = [];
MODELS_SPEC.forEach((spec, idx) => {
  const customLottie = customizeCrownLottie(baseLottie, spec);
  const jsonStr = JSON.stringify(customLottie);
  const tgsBuf = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
  const svgStr = lottieToSvg(customLottie);

  const jsonRel = `/a/imperialcrown/vip${idx}.json`;
  const svgRel = `/a/imperialcrown/vip${idx}.svg`;

  fs.writeFileSync(path.join(OUT_ASSET_DIR, `vip${idx}.tgs`), tgsBuf);
  fs.writeFileSync(path.join(OUT_ASSET_DIR, `vip${idx}.json`), jsonStr);
  fs.writeFileSync(path.join(OUT_ASSET_DIR, `vip${idx}.svg`), svgStr);

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

// 3. Load backdrops & symbols from coinflip.json, and keep craftModels: []
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
  patterns: coinflipCol.patterns || coinflipCol.symbols,
  symbols: coinflipCol.symbols || coinflipCol.patterns
};

fs.writeFileSync(OUT_COLLECTION_JSON, JSON.stringify(imperialCrownCollection, null, 2));

const indexArr = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, 'utf8'));
const existingIdx = indexArr.findIndex(c => c.slug === 'imperialcrown');
const indexEntry = {
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
  modelsCount: modelsOut.length,
  craftModelsCount: 0,
  backdropsCount: (coinflipCol.backdrops || []).length,
  patternsCount: (coinflipCol.patterns || coinflipCol.symbols || []).length
};

if (existingIdx >= 0) {
  indexArr[existingIdx] = { ...indexArr[existingIdx], ...indexEntry };
} else {
  indexArr.unshift(indexEntry);
}
fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(indexArr, null, 2));

console.log(`Generated ${modelsOut.length} Elite VIP 3D-Synchronized Imperial Crown models (.tgs, .json, .svg)`);
