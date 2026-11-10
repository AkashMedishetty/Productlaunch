import * as k from './kit/iso-kit.mjs';

export const W = 1000;
export const H = 620;

const DECK = { x: -9, y: -4.5, w: 18, d: 9, r: 0.18 };
const RULER = '#6a4bd6';

const planAt = (x, y, w, d, r = 0.05) => ({ x, y, w, d, r });

function fit(points, pad = 30, azimuth = 40, elevation = 31) {
  return k.fitProjection(points, W, H, { pad, azimuth, elevation });
}

/* framing boxes: the figure is a crop of the stage around the mechanism,
   not a wide shot, so the anatomy can be printed at A4 scale. */
const FOCUS = {
  unseen: { x: -8.5, y: -2.3, w: 18.6, d: 5.6, h: 8.3 },
  pulse: { x: -3.6, y: -2.7, w: 7.2, d: 5.4, h: 8.3 },
  cargo: { x: -4.6, y: -2.9, w: 9.2, d: 5.8, h: 8.3 },
  ascension: { x: -3.4, y: -2.4, w: 6.8, d: 5.0, h: 8.3 },
  veil: { x: -3.6, y: -2.4, w: 7.2, d: 5.0, h: 8.3 },
  sculpture: { x: -3.8, y: -2.5, w: 7.6, d: 5.2, h: 8.3 },
  drop: { x: -3.6, y: -2.4, w: 7.2, d: 5.0, h: 8.3 },
  phantom: { x: -3.6, y: -2.7, w: 7.2, d: 5.4, h: 8.3 },
  stageproduct: { x: -4.2, y: -2.7, w: 8.4, d: 5.4, h: 8.3 },
  laser: { x: -4.6, y: -2.7, w: 9.2, d: 5.4, h: 8.3 },
  colour: { x: -7.4, y: -3.2, w: 14.8, d: 6.4, h: 8.3 },
  ignition: { x: -4.0, y: -2.6, w: 8.0, d: 5.2, h: 8.3 },
  kabuki: { x: -6.4, y: -2.9, w: 12.8, d: 5.8, h: 8.3 },
  flybar: { x: -6.8, y: -2.9, w: 13.6, d: 5.8, h: 8.3 },
  traveler: { x: -6.8, y: -2.9, w: 13.6, d: 5.8, h: 8.3 },
  revolve: { x: -4.4, y: -2.9, w: 8.8, d: 5.8, h: 8.3 },
};

function focusPoints(box) {
  const { x, y, w, d, h } = box;
  return [
    [x, y + d, 0],
    [x + w, y + d, 0],
    [x, y, 0],
    [x + w, y, 0],
    [x, y + d, h],
    [x + w, y + d, h],
    [x, y, h],
    [x + w, y, h],
  ];
}

export function makeProjection(kind, scene) {
  if (kind === 'house') {
    return fit(
      [
        [-11.1, 4.7, 0],
        [11.1, -4.9, 0],
        [0, 0, 12.2],
        [-11.1, -4.9, 12.2],
        [11.1, 4.7, 12.2],
        [10.6, 5.6, -0.4],
        [-10.6, 5.6, -0.4],
        [0, 5.6, -0.4],
      ],
      26,
      38,
      30,
    );
  }
  const box = FOCUS[scene] ?? { x: -6.5, y: -3, w: 13, d: 6, h: 7.8 };
  return fit(focusPoints(box), 38, 40, 31);
}

function svgQuad(points, P, shade = 1) {
  return `<path class="iso-shade" data-shade="${shade}" d="${k.pathOf(points.map((p) => k.iso(p, P)), true)}"/>`;
}

export function buildScene(concept, variant) {
  const P = makeProjection(variant.kind === 'house' ? 'house' : 'stage', variant.scene);
  const out = [];
  const parts = [];
  const reg = (name, at, id) => {
    parts.push({ id: id ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, at });
  };
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const AL = (d, style = {}) => k.lineSvg(d, { ...style, className: 'anat' });
  const D = (points, style) => k.dotsSvg(points, style);
  const at = (p) => k.iso(p, P);
  const wire = (a, b, via = [], style = {}) => k.wireSvg(at(a), at(b), { via: via.map(at), ...style });

  /* ---------- deck ---------- */
  const deckShadow = k.haloOf(DECK, -0.92, 0.4, P);
  out.push(`<path class="iso-halo" d="${deckShadow}" style="filter:blur(10px)"/>`);

  for (const [x, y] of k.corners(DECK, 1.1)) {
    out.push(S(k.cylinder(x, y, 0.26, -0.92, 0.42, P, 18), { tone: 'lo' }));
  }
  out.push(S(k.slabOf(DECK, -0.5, 0.5, P, 6, 0.03), { tone: 'lo', className: 'deck' }));
  out.push(S(k.slabOf(k.insetPlan(DECK, 0.16), 0, 0.012, P, 6), { tone: 'faint', crease: 'none' }));

  for (let x = -8; x <= 8; x += 1.6) {
    out.push(L(k.lineOnTop([x, -4.32], [x, 4.32], 0.014, P), { tone: 'faint' }));
  }
  for (const y of [-2.2, 2.2]) {
    out.push(L(k.lineOnTop([-8.9, y], [8.9, y], 0.018, P), { tone: 'faint' }));
  }
  reg('18 × 9 m deck', variant.kind === 'house' ? [-4.4, 3.4, 0.06] : [-2.0, 2.2, 0.05], 'deck');

  /* ---------- upstage LED wall ---------- */
  const WALL = planAt(-7.1, -4.36, 14.2, 0.16, 0.04);
  out.push(S(k.slabOf(WALL, 0.55, 5.6, P, 4, 0.02), { tone: 'mid', className: 'led' }));
  for (let x = -7; x <= 7.001; x += 0.71) {
    out.push(L(k.segment([x, -4.19, 0.68], [x, -4.19, 6.03], P), { tone: 'faint' }));
  }
  for (let z = 0.9; z < 6; z += 1.28) {
    out.push(L(k.segment([-7.05, -4.19, z], [7.05, -4.19, z], P), { tone: 'faint' }));
  }
  out.push(L(k.segment([-7.1, -4.19, 0.55], [-7.1, -4.19, 6.15], P), { tone: 'lo' }));
  out.push(L(k.segment([7.1, -4.19, 0.55], [7.1, -4.19, 6.15], P), { tone: 'lo' }));
  reg('LED image surface', [0, -4.15, 3.4], 'led-wall');

  /* ---------- upstage masking ---------- */
  for (const x of [-8.9, 8.9]) {
    out.push(S(k.slabOf(planAt(x, -3.35, 1.4, 0.05), 0.04, 8.3, P, 2), { tone: 'lo', crease: 'none', className: 'cloth' }));
    for (let i = -2; i <= 2; i++) {
      out.push(L(k.segment([x + i * 0.26, -3.31, 0.12], [x + i * 0.26, -3.31, 8.28], P), { tone: 'faint' }));
    }
    const hem = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      hem.push([x - 0.7 + t * 1.4, -3.31, 0.1 + (i % 2) * 0.045]);
    }
    out.push(L(k.pathOf(hem.map(at)), { tone: 'lo' }));
  }
  for (const z of [0.55]) {
    out.push(L(k.segment([-9.9, -3.32, z], [9.9, -3.32, z], P), { tone: 'mid' }));
  }
  reg('Wool-serge masking', [-8.9, -3.3, 4.4], 'masking');

  /* ---------- mechanism (purple anatomy) ---------- */
  const mechanism = VARIANTS[variant.scene] ?? (() => {});
  const mechStart = out.length;
  const mechPartStart = parts.length;
  mechanism({ out, reg, S, L, AL, D, at, wire, P, concept, svgQuad });
  const mechPartEnd = parts.length;
  const mechBody = out.splice(mechStart).join('');
  out.push(`<g class="mech">${mechBody}</g>`);

  /* ---------- front masking legs ---------- */
  for (const x of [-9.35, 9.35]) {
    out.push(S(k.slabOf(planAt(x + 0.35, 1.95, 1.5, 0.05), 0.04, 8.3, P, 2), { tone: 'lo', crease: 'none', className: 'cloth' }));
    for (let i = -2; i <= 2; i++) {
      out.push(L(k.segment([x + 0.35 + i * 0.26, 1.99, 0.12], [x + 0.35 + i * 0.26, 1.99, 8.28], P), { tone: 'faint' }));
    }
  }

  /* ---------- rigging / truss ---------- */
  const truss = (y, z) => {
    const x0 = -10.2;
    const w = 20.4;
    for (const dz of [0, 0.4]) {
      for (const dy of [-0.17, 0.17]) {
        out.push(S(k.slabOf(planAt(x0, y + dy, w, 0.05), z + dz, 0.05, P, 2), { tone: 'mid', crease: 'none' }));
      }
    }
    for (let x = x0; x <= x0 + w - 0.5; x += 0.8) {
      const up = Math.round((x - x0) / 0.8) % 2 === 0;
      out.push(
        L(
          k.segment([x, y - 0.17, up ? z : z + 0.4], [x + 0.8, y - 0.17, up ? z + 0.4 : z], P),
          { tone: 'lo' },
        ),
      );
      out.push(
        L(
          k.segment([x, y + 0.17, up ? z : z + 0.4], [x + 0.8, y + 0.17, up ? z + 0.4 : z], P),
          { tone: 'faint' },
        ),
      );
    }
    for (let x = x0; x <= x0 + w; x += 1.6) {
      out.push(L(k.segment([x, y - 0.17, z], [x, y - 0.17, z + 0.4], P), { tone: 'lo' }));
      out.push(L(k.segment([x, y - 0.17, z + 0.4], [x, y + 0.17, z + 0.4], P), { tone: 'faint' }));
    }
  };
  truss(-2.5, 7.45);
  truss(0.55, 7.05);

  for (const x of [-8.4, -3.6, 3.6, 8.4]) {
    out.push(S(k.slabOf(planAt(x - 0.22, -2.32, 0.44, 0.44), 7.85, 0.34, P, 3), { tone: 'mid' }));
    out.push(L(k.segment([x, -2.1, 7.85], [x, -2.1, 8.5], P), { tone: 'lo' }));
  }

  for (const x of [-7.8, -5.4, -3.2, -1, 1.2, 3.4, 5.6, 7.8]) {
    out.push(S(k.slabOf(planAt(x - 0.13, 0.42, 0.26, 0.26), 6.24, 0.3, P, 3), { tone: 'mid' }));
    out.push(L(k.segment([x, 0.55, 6.54], [x, 0.55, 7.02], P), { tone: 'lo' }));
    out.push(D([at([x, 0.32, 6.3])], { size: 1.5, tone: 'lo' }));
  }
  reg('Box truss + eight hoists', [6.9, 0.55, 7.3], 'truss');
  reg('Profile fixtures', [-5.4, 0.4, 6.4], 'fixtures');

  /* ---------- front edge, ruler, datum ---------- */
  out.push(S(k.slabOf(planAt(-9, 4.4, 18, 0.1), 0, 0.05, P, 3), { tone: 'mid', crease: 'none' }));
  const ticks = k.topTicks(-8.6, 8.6, 0.5, 4, 4.3, 0.06, [0.09, 0.24], P);
  out.push(AL(ticks.minor, { tone: 'lo' }), AL(ticks.major, { tone: 'mid' }));
  out.push(AL(k.lineOnTop([-8.8, 4.31], [8.8, 4.31], 0.06, P), { tone: 'lo' }));

  const datumX = -8.72;
  out.push(AL(k.segment([datumX, 4.34, 0.06], [datumX, 4.34, 7], P), { tone: 'lo' }));
  for (let z = 1; z <= 7; z++) {
    out.push(AL(k.segment([datumX, 4.34, z], [datumX + 0.16, 4.34, z], P), { tone: 'lo' }));
  }
  for (let z = 0; z <= 7; z += 0.5) {
    out.push(AL(k.segment([datumX, 4.34, z], [datumX + 0.08, 4.34, z], P), { tone: 'faint' }));
  }
  reg('Height datum', [datumX, 4.3, 3.5], 'datum');

  /* ---------- house dressing ---------- */
  if (variant.kind === 'house') {
    house(out, S, L, AL, D, at, P, reg);
  }

  return { body: out.join(''), parts, P, mech: parts.slice(mechPartStart, mechPartEnd) };
}

/* ================================================================
   HOUSE
   ================================================================ */
function house(out, S, L, AL, D, at, P, reg) {
  for (const x of [-10.3, 10.3]) {
    out.push(S(k.slabOf(planAt(x - 0.25, 1.8, 0.5, 1.2), 0, 8.8, P, 3), { tone: 'mid' }));
    out.push(AL(k.segment([x + (x < 0 ? 0.27 : -0.27), 2.38, 0.1], [x + (x < 0 ? 0.27 : -0.27), 2.38, 8.5], P), { tone: 'mid' }));
    out.push(S(k.slabOf(planAt(x - 0.31, 1.8, 0.62, 1.3), 0, 0.28, P, 3), { tone: 'hi' }));
  }
  out.push(S(k.slabOf(planAt(-10.5, 1.8, 21, 1.2), 8.7, 0.7, P, 3), { tone: 'mid' }));
  out.push(AL(k.segment([-10.2, 2.98, 8.33], [10.2, 2.98, 8.33], P), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-10.5, 1.76, 21, 0.04), 10.4, 3.3, P, 2), { tone: 'lo', crease: 'none' }));
  for (const x of [-9.4, -6.3, -3.1, 0, 3.1, 6.3, 9.4]) {
    out.push(L(k.segment([x, 1.73, 10.42], [x, 1.73, 13.6], P), { tone: 'lo' }));
  }
  reg('20 m proscenium', [10.3, 2.4, 5.2], 'proscenium');
  reg('Fly tower facade', [0, 1.75, 12.1], 'flytower');

  for (const [x, y] of [
    [-9.8, -3.3],
    [9.8, -3.3],
  ]) {
    out.push(S(k.slabOf(planAt(x - 0.75, y, 1.5, 0.05), 0.04, 8.3, P, 2), { tone: 'lo', crease: 'none' }));
    for (let i = -2; i <= 2; i++) {
      out.push(L(k.segment([x + i * 0.26, y + 0.04, 0.12], [x + i * 0.26, y + 0.04, 8.28], P), { tone: 'faint' }));
    }
  }

  // control desk
  out.push(S(k.slabOf(planAt(-7.15, 2.5, 2.5, 1.25), 0.09, 0.18, P, 4), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-6.35, 2.55, 1.55, 0.72), 0.27, 0.62, P, 4), { tone: 'mid' }));
  for (const dx of [-0.6, -0.42, -0.24, -0.06, 0.12, 0.3]) {
    out.push(AL(k.lineOnTop([dx - 0.3, 2.62], [dx - 0.3, 2.72], 0.93, P), { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(-4.95, 2.6, 0.62, 0.05), 0.65, 0.42, P, 2), { tone: 'lo' }));
  reg('Control position', [-5.4, 2.7, 0.9], 'control');

  // dimmer rack
  out.push(S(k.slabOf(planAt(-9.15, 1.5, 0.9, 1.3), 0, 2.1, P, 3), { tone: 'mid' }));
  for (let z = 0.3; z < 2; z += 0.28) {
    out.push(L(k.segment([-8.65, 2.81, z], [-8.25, 2.81, z], P), { tone: 'lo' }));
  }
  reg('Dimmer + show rack', [-8.7, 1.5, 2.1], 'rack');

  // flight cases and wedges
  out.push(S(k.slabOf(planAt(-8.2, 3.2, 1.15, 0.7), 0, 0.72, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(7.1, 3.1, 1.05, 0.62), 0, 0.62, P, 3), { tone: 'mid' }));
  for (const x of [-7.4, 6.6]) {
    out.push(S(k.slabOf(planAt(x, 3.85, 0.8, 0.5), 0, 0.3, P, 2), { tone: 'hi' }));
    out.push(svgQuadStatic([[x, 3.85, 0.3], [x + 0.8, 3.85, 0.3], [x + 0.62, 3.72, 0.55], [x + 0.18, 3.72, 0.55]], P));
  }
  reg('Flight cases + wedges', [-7.6, 3.2, 0.8], 'cases');

  out.push(S(k.slabOf(planAt(-2.2, 3.5, 4.4, 0.45), 0, 0.09, P, 2), { tone: 'lo', crease: 'none' }));
  for (let x = -1.8; x < 2; x += 0.4) {
    out.push(L(k.segment([x, 3.73, 0.09], [x + 0.2, 3.73, 0.09], P), { tone: 'faint' }));
  }
  reg('Cable ramp', [0, 3.6, 0.12], 'ramp');

  // hero product plinth
  out.push(S(k.slabOf(planAt(-1.7, 0.35, 3.4, 3.2), 0, 0.24, P, 4), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.55, 0.5, 3.1, 2.9), 0.24, 0.02, P, 4), { tone: 'faint', crease: 'none' }));
  out.push(S(k.slabOf(planAt(-0.75, 1.3, 1.5, 1.5), 0.26, 1.5, P, 4), { tone: 'hi', className: 'product' }));
  reg('Hero product / 4 × 4 ft', [0, 2.05, 1.0], 'product');
}

function svgQuadStatic(points, P) {
  return `<path class="iso-shade" data-shade="2" d="${k.pathOf(points.map((p) => k.iso(p, P)), true)}"/>`;
}

/* ================================================================
   MECHANISMS
   ================================================================ */
const VARIANTS = {};

/* --- 01 THE UNSEEN --- */
VARIANTS.unseen = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const bays = [
    { x: -6.4, w: 3.2, h: 3.9, size: 1.05, label: '2 × 2 ft' },
    { x: -1.6, w: 4.2, h: 4.4, size: 1.5, label: '4 × 4 ft' },
    { x: 4.4, w: 5.2, h: 5.0, size: 2.0, label: '6 × 6 ft' },
  ];
  for (const [i, bay] of bays.entries()) {
    const z = 0.02;
    const y = -1.4;
    const depth = 2.3;
    out.push(S(k.slabOf(planAt(bay.x - 0.08, y, bay.w + 0.16, depth), z, 0.14, P, 3), { tone: 'lo' }));
    for (const x of [bay.x, bay.x + bay.w - 0.08]) {
      out.push(S(k.slabOf(planAt(x, y, 0.08, depth), z + 0.14, bay.h, P, 2), { tone: 'mid', crease: 'none' }));
    }
    out.push(S(k.slabOf(planAt(bay.x, y, bay.w, depth), z + bay.h, 0.18, P, 3), { tone: 'mid' }));
    out.push(S(k.slabOf(planAt(bay.x + 0.1, y + 0.12, bay.w - 0.2, 0.06), z + 0.14, bay.h - 0.2, P, 2), { tone: 'lo', crease: 'none' }));
    for (let t = 0.12; t < 0.9; t += 0.16) {
      out.push(L(k.segment([bay.x + 0.1 + (bay.w - 0.2) * t, y + 0.19, z + 0.2], [bay.x + 0.1 + (bay.w - 0.2) * t, y + 0.19, z + bay.h - 0.08], P), { tone: 'faint' }));
    }
    // parked face panels, clear of the aperture
    const pw = bay.w / 2 - 0.1;
    out.push(S(k.slabOf(planAt(bay.x - pw + 0.04, y + depth - 0.02, pw, 0.05), z + 0.16, bay.h - 0.3, P, 2), { tone: 'hi', crease: 'none' }));
    out.push(S(k.slabOf(planAt(bay.x + bay.w - 0.04, y + depth - 0.02, pw, 0.05), z + 0.16, bay.h - 0.3, P, 2), { tone: 'hi', crease: 'none' }));
    out.push(AL(k.lineOnTop([bay.x - pw + 0.08, y + depth + 0.01], [bay.x - 0.06, y + depth + 0.01], z + 0.2, P), { tone: 'lo' }));
    out.push(AL(k.lineOnTop([bay.x + bay.w + 0.06, y + depth + 0.01], [bay.x + bay.w + pw - 0.08, y + depth + 0.01], z + 0.2, P), { tone: 'lo' }));
    out.push(S(k.slabOf(planAt(bay.x + bay.w / 2 - bay.size / 2 - 0.12, y + 0.7, bay.size + 0.24, bay.size + 0.24), z + 0.14, 0.12, P, 3), { tone: 'mid' }));
    out.push(S(k.slabOf(planAt(bay.x + bay.w / 2 - bay.size / 2, y + 0.82, bay.size, bay.size), z + 0.26, bay.size * 1.18, P, 3), { tone: 'hi', className: 'product' }));
    out.push(AL(k.planOutline(planAt(bay.x + bay.w / 2 - bay.size / 2, y + 0.82, bay.size, bay.size), z + 0.26 + bay.size * 1.18 + 0.002, P), { tone: 'mid' }));
    if (i === 1) reg('Product / 4 × 4 ft', [bay.x + bay.w / 2, y + 1.2, z + 1.2], 'product');
  }
  reg('Three scenic bays', [7.1, -1.4, 2.6], 'bays');
  reg('Sliding face panels', [3.2, 0.93, 2.2], 'panels');
  reg('LED skin + plinth', [-1.6, -0.6, 1.3], 'skin');

  // lectern key
  out.push(S(k.slabOf(planAt(-8.1, 2.3, 0.9, 0.62), 0, 1.1, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-8.02, 2.36, 0.74, 0.5), 1.1, 0.06, P, 3), { tone: 'hi' }));
  out.push(S(k.cylinder(-7.65, 2.58, 0.05, 1.16, 0.18, P, 12), { tone: 'hi' }));
  out.push(D([at([-7.65, 2.58, 1.36])], { size: 1.6, tone: 'hi' }));
  reg('Architectural key', [-7.65, 2.55, 1.3], 'key');
};

/* --- 02 THE PULSE --- */
VARIANTS.pulse = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -1.6;
  const y = -0.9;
  const w = 3.2;
  out.push(S(k.slabOf(planAt(x, y, w, w), 0, 0.16, P, 3), { tone: 'lo' }));
  out.push(S(k.slabOf(planAt(x + 0.08, y + 0.08, w - 0.16, w - 0.16), 0.16, 2.1, P, 3), { tone: 'mid', crease: 'none' }));
  for (const t of [0.25, 0.5, 0.75]) {
    out.push(L(k.segment([x + 0.08 + (w - 0.16) * t, y + 0.06, 0.25], [x + 0.08 + (w - 0.16) * t, y + 0.06, 2.2], P), { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(x + 0.12, y + 0.12, w - 0.24, 0.06), 0.2, 1.9, P, 2), { tone: 'lo', crease: 'none' }));
  // open lid: tilted back plane + hinge barrels
  out.push(svgQuad([[x + 0.1, y + 0.1, 2.26], [x + w - 0.1, y + 0.1, 2.26], [x + w - 0.1, y + 0.55, 2.72], [x + 0.1, y + 0.55, 2.72]], P, 2));
  out.push(AL(k.pathOf([[x + 0.1, y + 0.1, 2.26], [x + w - 0.1, y + 0.1, 2.26], [x + w - 0.1, y + 0.55, 2.72], [x + 0.1, y + 0.55, 2.72]].map(at)), { tone: 'mid' }));
  for (const dx of [0.2, 0.8, 2.4, 3.0]) {
    out.push(S(k.cylinder(x + dx, y + 0.1, 0.045, 2.16, 0.14, P, 10), { tone: 'hi' }));
  }
  // interior LEDs and product
  for (let i = 0; i < 3; i++) {
    out.push(AL(k.segment([x + 0.45, y + 0.5 + i * 0.5, 2.08], [x + w - 0.45, y + 0.5 + i * 0.5, 2.08], P), { tone: 'lo', dotted: true }));
  }
  out.push(S(k.slabOf(planAt(x + 0.9, y + 0.9, 1.4, 1.4), 0.16, 0.1, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 1.05, y + 1.05, 1.1, 1.1), 0.26, 1.05, P, 3), { tone: 'hi', className: 'product' }));
  // palm plate on pedestal at the edge
  out.push(S(k.slabOf(planAt(-5.2, 1.2, 1.2, 1.2), 0, 0.9, P, 3), { tone: 'mid' }));
  out.push(S(k.cylinder(-4.6, 1.8, 0.34, 0.9, 0.08, P, 24), { tone: 'hi' }));
  out.push(AL(k.ring(-4.6, 1.8, 0.22, 0.99, P, 24), { tone: 'mid' }));
  out.push(D([at([-4.6, 1.8, 1.02])], { size: 2.4, tone: 'hi' }));
  out.push(AL(k.pathOf([[-4.6, 2.15, 0.94], [-3.8, 2.9, 0.8], [-3.2, 2.9, 0.6]].map(at)), { tone: 'mid' }));
  reg('Crate shell / 2.4 m', [x, -0.8, 2.2], 'crate');
  reg('Hinged lid + gas struts', [0, 0.1, 2.5], 'lid');
  reg('Palm reader', [-4.6, 1.8, 1.0], 'plate');
  reg('Product', [0.4, 1.5, 1.3], 'product');
};

/* --- 03 THE CARGO VAULT --- */
VARIANTS.cargo = ({ out, reg, S, L, AL, D, at, wire, P, svgQuad }) => {
  const x = -2.8;
  const y = -1.2;
  const w = 5.6;
  const d = 3.4;
  out.push(S(k.slabOf(planAt(x, y, w, d), 0, 0.3, P, 3), { tone: 'lo' }));
  out.push(S(k.slabOf(planAt(x + 0.15, y + 0.15, w - 0.3, d - 0.3), 0.3, 0.12, P, 3), { tone: 'mid' }));
  // four leaves opened flat around the vault
  const leaves = [
    [[x, y, 0.42], [x + w, y, 0.42], [x + w, y - 1.55, 0.2], [x, y - 1.55, 0.2]],
    [[x, y + d, 0.42], [x + w, y + d, 0.42], [x + w, y + d + 1.55, 0.2], [x, y + d + 1.55, 0.2]],
    [[x, y, 0.42], [x - 1.3, y, 0.2], [x - 1.3, y + d, 0.2], [x, y + d, 0.42]],
    [[x + w, y, 0.42], [x + w + 1.3, y, 0.2], [x + w + 1.3, y + d, 0.2], [x + w, y + d, 0.42]],
  ];
  for (const leaf of leaves) {
    out.push(svgQuad(leaf, P, 2));
    out.push(AL(k.pathOf(leaf.map(at)), { tone: 'lo' }));
    for (let i = 1; i < 5; i++) {
      const a = leaf[0];
      const b = leaf[1];
      const c = leaf[3];
      const t = i / 5;
      const p0 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const p1 = [c[0] + (b[0] - a[0]) * (1 - t), c[1] + (b[1] - a[1]) * (1 - t), c[2] + (b[2] - a[2]) * (1 - t)];
      out.push(L(k.segment(p0, p1, P), { tone: 'faint' }));
    }
  }
  for (const [cx, cy] of [[x + 0.2, y + 0.2], [x + w - 0.2, y + 0.2], [x + 0.2, y + d - 0.2], [x + w - 0.2, y + d - 0.2]]) {
    out.push(S(k.cylinder(cx, cy, 0.07, 0.3, 0.34, P, 10), { tone: 'hi' }));
  }
  out.push(S(k.slabOf(planAt(x + 1.4, y + 0.8, 2.8, 1.8), 0.42, 0.2, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 1.7, y + 1.0, 2.2, 1.4), 0.62, 1.6, P, 3), { tone: 'hi', className: 'product' }));
  out.push(S(k.slabOf(planAt(x + 1.7, y + 1.0, 2.2, 1.4), 2.22, 0.05, P, 3), { tone: 'faint', crease: 'none' }));
  for (const dx of [0.55, 2.75]) {
    out.push(wire([x + dx, y + d - 0.2, 0.5], [x + dx, y + d - 0.2, 2.1], [[x + dx, y + d + 0.3, 1.2]], { tone: 'mid' }));
  }
  out.push(AL(k.segment([x + w / 2, y + d + 0.5, 0.32], [x + w / 2, y + d + 2.1, 0.32], P), { tone: 'lo' }));
  reg('Vault base', [x + w / 2, y + d / 2, 0.3], 'base');
  reg('Four shell leaves', [x + w + 0.8, y + d / 2, 0.35], 'leaves');
  reg('Gas struts', [x + 0.55, y + d + 0.1, 1.2], 'struts');
  reg('Product / 6 × 6 ft', [x + 2.8, y + 1.7, 1.4], 'product');
};

/* --- 04 THE ASCENSION --- */
VARIANTS.ascension = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -2.2;
  const y = -1.2;
  const w = 4.4;
  const d = 2.8;
  out.push(S(k.slabOf(planAt(x, y, w, d), 0, 0.28, P, 3), { tone: 'mid' }));
  for (const [cx, cy] of [[x + 0.3, y + 0.3], [x + w - 0.3, y + 0.3], [x + 0.3, y + d - 0.3], [x + w - 0.3, y + d - 0.3]]) {
    out.push(S(k.cylinder(cx, cy, 0.08, 0, 0.3, P, 12), { tone: 'hi' }));
  }
  // scissor arms, two pairs
  for (const dy of [0.35, d - 0.35]) {
    const a = [x + 0.6, y + dy, 0.28];
    const b = [x + w - 0.6, y + dy, 1.5];
    const c = [x + 0.6, y + dy, 1.5];
    const e = [x + w - 0.6, y + dy, 0.28];
    out.push(S(k.slabOf(planAt(a[0], a[1] - 0.06, Math.hypot(b[0] - a[0], b[2] - a[2]) * 0.62, 0.12), 0.28, 0.08, P, 2), { tone: 'mid' }));
    for (const [p, q] of [[a, b], [c, e]]) {
      out.push(AL(k.segment(p, q, P), { tone: 'mid' }));
      out.push(AL(k.segment([p[0] + 0.05, p[1], p[2] + 0.1], [q[0] + 0.05, q[1], q[2] + 0.1], P), { tone: 'lo' }));
    }
    out.push(D([at([x + w / 2, y + dy, 0.9])], { size: 1.6, tone: 'hi' }));
  }
  out.push(S(k.slabOf(planAt(x + 0.15, y + 0.1, w - 0.3, d - 0.2), 1.5, 0.16, P, 3), { tone: 'mid' }));
  // hydraulic ram
  out.push(S(k.cylinder(x + 0.55, y + d / 2, 0.09, 0.28, 1.1, P, 12), { tone: 'hi' }));
  out.push(S(k.cylinder(x + 0.55, y + d / 2, 0.05, 1.38, 0.4, P, 12), { tone: 'hi' }));
  // skirt bellows
  for (let i = 0; i < 6; i++) {
    out.push(AL(k.segment([x + 0.2, y + 0.12 + i * 0.06, 0.3 + i * 0.19], [x + w - 0.2, y + 0.12 + i * 0.06, 0.3 + i * 0.19], P), { tone: 'faint' }));
  }
  // guardrail
  for (const [cx, cy] of [[x + 0.15, y + 0.1], [x + w - 0.15, y + 0.1], [x + 0.15, y + d - 0.1], [x + w - 0.15, y + d - 0.1]]) {
    out.push(AL(k.segment([cx, cy, 1.66], [cx, cy, 2.6], P), { tone: 'lo' }));
  }
  for (const z of [2.0, 2.55]) {
    out.push(AL(k.segment([x + 0.15, y + 0.1, z], [x + w - 0.15, y + 0.1, z], P), { tone: 'lo' }));
    out.push(AL(k.segment([x + 0.15, y + d - 0.1, z], [x + w - 0.15, y + d - 0.1, z], P), { tone: 'faint' }));
  }
  out.push(S(k.slabOf(planAt(x + 1.1, y + 0.7, 2.2, 1.5), 1.66, 0.08, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 1.35, y + 0.82, 1.7, 1.25), 1.74, 1.55, P, 3), { tone: 'hi', className: 'product' }));
  reg('Scissor stack', [x + w / 2, y + 0.35, 1.1], 'scissor');
  reg('Hydraulic ram', [x + 0.55, y + d / 2, 0.7], 'ram');
  reg('Guardrail', [x + w - 0.15, y + 0.1, 2.3], 'rail');
  reg('Product platform', [x + 2.2, y + 1.4, 2.0], 'product');
};

/* --- 05 THE DIGITAL VEIL --- */
VARIANTS.veil = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const cx = 0;
  const cy = -0.4;
  const r = 2.7;
  const z = 5.2;
  out.push(S(k.slabOf(planAt(-1.8, 1.1, 3.6, 3.2), 0, 0.25, P, 4), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.35, 1.55, 2.7, 2.3), 0.25, 1.7, P, 4), { tone: 'hi', className: 'product' }));
  // hoop: upper and lower rings with vertical spacers
  out.push(AL(k.ring(cx, cy, r, z, P, 64), { tone: 'mid' }));
  out.push(AL(k.ring(cx, cy, r, z - 0.22, P, 64), { tone: 'mid' }));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    out.push(L(k.segment([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z - 0.22], [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], P), { tone: 'faint' }));
  }
  // gathered fabric sleeve above the hoop
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const rx = r * 0.72;
    out.push(AL(k.segment([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], [cx + Math.cos(a) * rx, cy + Math.sin(a) * rx, z + 1.15], P), { tone: 'lo' }));
  }
  out.push(AL(k.ring(cx, cy, r * 0.72, z + 1.15, P, 48), { tone: 'mid' }));
  out.push(AL(k.ring(cx, cy, r * 0.55, z + 1.3, P, 40), { tone: 'lo' }));
  // bridle lines to the truss
  for (const [dx, dy] of [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]]) {
    out.push(wire([cx + dx * r, cy + dy * r, z], [cx + dx * 6.4, cy + dy * 1.6, 7.0], [], { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(cx - r - 0.5, cy - 0.5, 0.1, 1.0), z - 0.24, 0.04, P, 2), { tone: 'mid', crease: 'none' }));
  reg('Flown hoop', [cx + r, cy, z], 'hoop');
  reg('Gathered veil', [cx, cy + r * 0.8, z + 0.7], 'veil');
  reg('Four-point bridle', [cx + 4.8, cy + 1.2, 6.3], 'bridle');
  reg('Product / 4 × 4 ft', [cx, cy + 1.2, 1.6], 'product');
};

/* --- 06 THE LIGHT SCULPTURE --- */
VARIANTS.sculpture = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -2.4;
  const y = -1.1;
  const w = 4.8;
  const d = 3.4;
  const h = 4.4;
  out.push(S(k.slabOf(planAt(x - 0.3, y - 0.3, w + 0.6, d + 0.6), 0, 0.28, P, 4), { tone: 'mid' }));
  // four corner posts and top frame
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + d], [x + w, y + d]]) {
    out.push(S(k.slabOf(planAt(cx - 0.07, cy - 0.07, 0.14, 0.14), 0.28, h, P, 2), { tone: 'mid', crease: 'none' }));
  }
  for (const [a, b] of [[[x, y, h], [x + w, y, h]], [[x, y + d, h], [x + w, y + d, h]], [[x, y, h], [x, y + d, h]], [[x + w, y, h], [x + w, y + d, h]]]) {
    out.push(AL(k.segment(a, b, P), { tone: 'mid' }));
    const a2 = [a[0], a[1], h - 0.12];
    const b2 = [b[0], b[1], h - 0.12];
    out.push(AL(k.segment(a2, b2, P), { tone: 'lo' }));
  }
  // diagonal braces
  for (const [a, b] of [[[x, y, h], [x + w, y, 0.4]], [[x + w, y, h], [x, y, 0.4]], [[x, y + d, h], [x + w, y + d, 0.4]], [[x + w, y + d, h], [x, y + d, 0.4]]]) {
    out.push(L(k.segment(a, b, P), { tone: 'faint' }));
  }
  // lifted cover above
  out.push(svgQuad([[x - 0.2, y - 0.2, 5.1], [x + w + 0.2, y - 0.2, 5.1], [x + w * 0.72, y + d * 0.72, 5.75], [x + 0.8, y + 0.8, 5.75]], P, 2));
  out.push(AL(k.pathOf([[x - 0.2, y - 0.2, 5.1], [x + w + 0.2, y - 0.2, 5.1], [x + w * 0.72, y + d * 0.72, 5.75], [x + 0.8, y + 0.8, 5.75]].map(at)), { tone: 'mid' }));
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    out.push(wire([x + dx * w, y + dy * d, h], [x + 0.8 + dx * (w * 0.72 - 0.8), y + 0.8 + dy * (d * 0.72 - 0.8), 5.15], [], { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(x + 1.1, y + 0.9, 2.6, 2.0), 0.28, 0.18, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 1.55, y + 1.2, 1.7, 1.5), 0.46, 1.55, P, 3), { tone: 'hi', className: 'product' }));
  reg('Tube frame', [x + w, y, h - 0.4], 'frame');
  reg('Hoisted cover', [x + w * 0.7, y + 0.3, 5.5], 'cover');
  reg('Lift lines', [x + w * 0.55, y + d * 0.5, 4.7], 'lines');
  reg('Product / 6 × 6 ft', [x + 2.4, y + 1.9, 1.3], 'product');
};

/* --- 07 THE DROP --- */
VARIANTS.drop = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -1.8;
  const y = -0.6;
  const w = 3.6;
  const d = 3.0;
  const z = 3.6;
  out.push(S(k.slabOf(planAt(-2.6, 0.6, 5.2, 3.6), 0, 0.26, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.6, 1.0, 3.2, 2.4), 0.26, 0.14, P, 3), { tone: 'lo' }));
  // suspended shell
  out.push(S(k.slabOf(planAt(x, y, w, d), z, 2.5, P, 4), { tone: 'hi' }));
  out.push(S(k.slabOf(k.insetPlan(planAt(x, y, w, d), 0.18), z + 0.1, 0.08, P, 4), { tone: 'faint', crease: 'none' }));
  out.push(S(k.slabOf(k.insetPlan(planAt(x, y, w, d), 0.18), z + 2.3, 0.08, P, 4), { tone: 'faint', crease: 'none' }));
  for (const t of [0.22, 0.5, 0.78]) {
    out.push(L(k.segment([x + w * t, y - 0.01, z + 0.15], [x + w * t, y - 0.01, z + 2.35], P), { tone: 'faint' }));
  }
  for (const [cx, cy] of [[x + 0.25, y + 0.25], [x + w - 0.25, y + 0.25], [x + 0.25, y + d - 0.25], [x + w - 0.25, y + d - 0.25]]) {
    out.push(S(k.cylinder(cx, cy, 0.07, z + 2.5, 0.12, P, 10), { tone: 'mid' }));
    out.push(wire([cx, cy, z + 2.62], [cx, cy, 7.0], [], { tone: 'lo' }));
    out.push(AL(k.segment([x - 0.1, cy, z - 0.05], [x - 0.1, cy, 0.3], P), { tone: 'faint' }));
  }
  out.push(wire([x + w / 2, y + d / 2, z + 2.6], [x + w / 2, y + d / 2, 7.45], [], { tone: 'mid' }));
  out.push(S(k.cylinder(x + w / 2, y + d / 2, 0.13, 7.05, 0.26, P, 14), { tone: 'hi' }));
  out.push(S(k.slabOf(planAt(x + 0.7, y + 0.6, 2.2, 1.8), 0.26, 1.4, P, 3), { tone: 'hi', className: 'product' }));
  reg('Cargo shell', [x + w, y + d, z + 1.4], 'shell');
  reg('Single winch', [x + w / 2, y + d / 2, 7.2], 'winch');
  reg('Four-point sling', [x + w / 2, y + 0.2, z + 2.9], 'sling');
  reg('Product / 6 × 6 ft', [x + 1.8, y + 1.5, 1.2], 'product');
};

/* --- 08 THE PHANTOM --- */
VARIANTS.phantom = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -2.0;
  const y = -1.2;
  const w = 4.0;
  const d = 2.6;
  const h = 3.0;
  out.push(S(k.slabOf(planAt(x - 0.25, y - 0.25, w + 0.5, d + 0.5), 0, 0.3, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x, y, w, d), 0.3, 0.12, P, 3), { tone: 'lo' }));
  out.push(S(k.slabOf(planAt(x, y, w, d), 0.42, h, P, 3), { tone: 'hi', crease: 'none' }));
  // cut-away front: frame posts and top
  for (const [cx, cy] of [[x, y], [x + w, y], [x, y + d], [x + w, y + d]]) {
    out.push(S(k.slabOf(planAt(cx - 0.05, cy - 0.05, 0.1, 0.1), 0.42, h, P, 2), { tone: 'mid', crease: 'none' }));
  }
  out.push(S(k.slabOf(planAt(x, y, w, 0.1), 0.42 + h, 0.14, P, 3), { tone: 'mid' }));
  // 45° glass plate and light trap
  out.push(AL(k.pathOf([[x + 0.2, y + 0.25, 0.55], [x + w - 0.2, y + 0.25, 0.55], [x + w - 0.2, y + 0.25, 2.3], [x + 0.2, y + 0.25, 2.3]].map(at)), { tone: 'lo' }));
  out.push(L(k.segment([x + 0.25, y + 0.3, 0.58], [x + w - 0.25, y + 0.3, 2.25], P), { tone: 'mid' }));
  out.push(L(k.segment([x + 0.25, y + 0.3, 2.25], [x + w - 0.25, y + 0.3, 0.58], P), { tone: 'faint' }));
  // product behind the glass, ghost above the plinth
  out.push(S(k.slabOf(planAt(x + 0.9, y + 1.1, 2.2, 1.2), 0.42, 0.5, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 1.25, y + 1.3, 1.5, 0.9), 0.92, 1.0, P, 3), { tone: 'hi', className: 'product' }));
  out.push(AL(k.pathOf([[x + 1.35, y + 1.25, 2.15], [x + 2.65, y + 1.25, 2.15], [x + 2.5, y + 1.25, 2.85], [x + 1.5, y + 1.25, 2.85]].map(at)), { tone: 'mid', dotted: true }));
  // projector and hood
  out.push(S(k.slabOf(planAt(x + w - 0.45, y + 0.55, 0.4, 0.4), 0.42 + h, 0.16, P, 2), { tone: 'mid' }));
  out.push(AL(k.segment([x + w - 0.25, y + 0.75, 3.5], [x + w - 1.4, y + 1.6, 1.9], P), { tone: 'lo', dotted: true }));
  out.push(S(k.slabOf(planAt(x + w - 0.55, y + 0.35, 0.6, 0.7), 0.42 + h + 0.16, 0.2, P, 2), { tone: 'hi' }));
  reg('Mirror cabinet', [x + w, y + d, 1.8], 'cabinet');
  reg('Pepper’s ghost plate', [x + 1.9, y + 0.3, 1.6], 'plate');
  reg('Light trap hood', [x + w - 0.3, y + 0.6, 3.7], 'hood');
  reg('Projector', [x + w - 0.5, y + 0.7, 3.9], 'projector');
  reg('Product / 4 × 4 ft', [x + 2.0, y + 1.7, 1.4], 'product');
};

/* --- 09 THE STAGE IS THE PRODUCT --- */
VARIANTS.stageproduct = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const x = -4.2;
  const y = -1.6;
  const w = 8.4;
  const d = 3.0;
  const h = 4.6;
  out.push(S(k.slabOf(planAt(x - 0.4, y - 0.3, w + 0.8, d + 0.7), 0, 0.3, P, 3), { tone: 'mid' }));
  for (const cx of [x, x + w - 0.45]) {
    out.push(S(k.slabOf(planAt(cx, y, 0.45, d), 0.3, h, P, 3), { tone: 'mid' }));
    for (const t of [0.33, 0.66]) {
      out.push(L(k.segment([cx + 0.45, y + d * t, 0.5], [cx + 0.45, y + d * t, h + 0.2], P), { tone: 'faint' }));
    }
  }
  out.push(S(k.slabOf(planAt(x, y, w, d), 0.3 + h, 0.5, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(x + 0.2, y - 0.06, w - 0.4, 0.08), 0.4, h - 0.3, P, 2), { tone: 'lo', crease: 'none' }));
  // two sliding faces parked at the jambs
  for (const [cx, sign] of [[x + 0.55, 1], [x + w - 0.55, -1]]) {
    out.push(S(k.slabOf(planAt(cx - 0.9, y + d - 0.02, 1.8, 0.06), 0.32, h - 0.25, P, 2), { tone: 'hi', crease: 'none' }));
    out.push(AL(k.lineOnTop([cx - 0.9, y + d + 0.03], [cx + 0.9, y + d + 0.03], 0.36, P), { tone: 'lo' }));
    out.push(S(k.slabOf(planAt(cx - 0.9, y + d + 0.02, 1.8, 0.12), 0.32 + h - 0.25, 0.06, P, 2), { tone: 'mid' }));
    out.push(sign > 0 ? L(k.segment([cx - 0.9, y + d + 0.12, 0.32 + h - 0.25], [cx - 0.4, y + d + 0.12, 0.32 + h - 0.25], P), { tone: 'lo' }) : '');
  }
  // floor tracks
  for (const z of [0.3, 0.32]) {
    out.push(AL(k.lineOnTop([x + 0.4, y + d + 0.2], [x + w - 0.4, y + d + 0.2], z, P), { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(-1.2, 0.2, 2.4, 2.4), 0.3, 0.18, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.0, 0.35, 2.0, 2.1), 0.48, 1.9, P, 3), { tone: 'hi', className: 'product' }));
  out.push(S(k.slabOf(planAt(x + w / 2 - 0.8, y - 0.04, 1.6, 0.04), h - 0.7, 0.4, P, 2), { tone: 'mid' }));
  reg('Scenic arch', [x + w, y, 3.2], 'arch');
  reg('Two sliding faces', [x + 1.0, y + d + 0.2, 2.4], 'faces');
  reg('Floor tracks', [x + w - 1.0, y + d + 0.2, 0.35], 'tracks');
  reg('Product / 6 × 6 ft', [0, 1.4, 1.5], 'product');
};

/* --- 10 THE LASER DRAW --- */
VARIANTS.laser = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  out.push(S(k.slabOf(planAt(-2.0, 0.0, 4.0, 3.2), 0, 0.3, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.5, 0.5, 3.0, 2.2), 0.3, 1.9, P, 3), { tone: 'hi', className: 'product' }));
  // two laser heads
  for (const [x, y, dir] of [[-6.0, 2.2, 1], [6.0, 2.2, -1]]) {
    out.push(S(k.slabOf(planAt(x - 0.35, y - 0.35, 0.7, 0.7), 0, 0.24, P, 3), { tone: 'mid' }));
    out.push(S(k.cylinder(x, y, 0.07, 0.24, 1.5, P, 12), { tone: 'mid' }));
    out.push(S(k.slabOf(planAt(x - 0.16, y - 0.1, 0.32, 0.32), 1.74, 0.26, P, 2), { tone: 'hi' }));
    out.push(AL(k.segment([x, y, 1.86], [x + dir * 0.12, y - 0.1, 1.86], P), { tone: 'mid' }));
    out.push(D([at([x + dir * 0.1, y - 0.12, 1.86])], { size: 1.8, tone: 'hi' }));
    // beams trace the near face of the portal: top and bottom corners
    for (const target of [
      [dir * 2.6, 2.6, 3.3],
      [dir * 2.6, 2.6, 0.1],
    ]) {
      out.push(AL(k.segment([x + dir * 0.12, y - 0.1, 1.86], target, P), { tone: 'lo' }));
    }
  }
  // wireframe cage around the product
  const cage = [
    [-2.6, -0.2, 0.1],
    [2.6, -0.2, 0.1],
    [2.6, 2.6, 0.1],
    [-2.6, 2.6, 0.1],
    [-2.6, -0.2, 3.3],
    [2.6, -0.2, 3.3],
    [2.6, 2.6, 3.3],
    [-2.6, 2.6, 3.3],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  for (const [a, b] of edges) {
    out.push(AL(k.segment(cage[a], cage[b], P), { tone: 'lo', dotted: true }));
  }
  for (const p of cage) out.push(D([at(p)], { size: 1.2, tone: 'hi' }));
  reg('Laser heads', [6.0, 2.2, 1.9], 'heads');
  reg('Beam cage', [2.6, 2.6, 3.3], 'cage');
  reg('Product / 6 × 6 ft', [0, 1.6, 1.4], 'product');
};

/* --- 11 THE COLOUR RELEASE --- */
VARIANTS.colour = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  out.push(S(k.slabOf(planAt(-1.8, 0.2, 3.6, 2.8), 0, 0.28, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.3, 0.55, 2.6, 2.1), 0.28, 1.8, P, 3), { tone: 'hi', className: 'product' }));
  // flown drape bar with lifted drape
  out.push(S(k.slabOf(planAt(-5.2, 0.0, 10.4, 0.08), 5.8, 0.08, P, 2), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-5.0, 0.02, 10.0, 0.02), 3.6, 2.1, P, 2), { tone: 'hi', crease: 'none' }));
  for (let x = -4.9; x < 5; x += 0.55) {
    out.push(L(k.segment([x, 0.05, 3.65], [x, 0.05, 5.65], P), { tone: 'faint' }));
  }
  for (let x = -5.0; x < 5; x += 0.275) {
    out.push(L(k.segment([x, 0.05, 3.6], [x, 0.09, 3.52], P), { tone: 'lo' }));
  }
  for (const x of [-3.6, 3.6]) {
    out.push(AL(k.segment([x, 0.04, 5.88], [x, -2.3, 7.35], P), { tone: 'mid' }));
  }
  // six air cannons along the front
  for (let i = 0; i < 6; i++) {
    const x = -6.2 + i * 2.48;
    out.push(S(k.cylinder(x, 3.6, 0.16, 0, 0.9, P, 16), { tone: 'mid' }));
    out.push(S(k.cylinder(x, 3.6, 0.22, 0.9, 0.18, P, 16), { tone: 'hi' }));
    out.push(AL(k.segment([x, 3.6, 1.08], [x, 2.2, 2.2], P), { tone: 'lo', dotted: true }));
    for (let j = 0; j < 9; j++) {
      const a = (i * 1.7 + j * 0.9) % (Math.PI * 2);
      const rr = 0.8 + ((i + j) % 4) * 0.35;
      out.push(D([at([x + Math.cos(a) * rr, 2.2 + Math.sin(a) * rr * 0.6, 2.3 + ((i + j) % 6) * 0.42])], { size: 2.6, tone: (i + j) % 3 === 0 ? 'hi' : 'mid' }));
    }
  }
  out.push(AL(k.segment([-6.6, 4.3, 0.05], [6.6, 4.3, 0.05], P), { tone: 'lo' }));
  reg('Flown drape', [4.8, 0.03, 4.7], 'drape');
  reg('Air cannons', [-6.2, 3.6, 1.0], 'cannons');
  reg('Confetti cloud', [0, 2.1, 2.8], 'confetti');
  reg('Product / 4 × 4 ft', [0, 1.6, 1.2], 'product');
};

/* --- 12 THE IGNITION --- */
VARIANTS.ignition = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  out.push(S(k.slabOf(planAt(-2.2, 0.4, 4.4, 3.2), 0, 0.26, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.75, 1.0, 3.0, 2.2), 0.26, 0.24, P, 3), { tone: 'lo' }));
  // hero lift raised
  out.push(S(k.slabOf(planAt(-1.75, 1.0, 3.0, 2.2), 1.4, 0.16, P, 3), { tone: 'mid' }));
  for (const [cx, cy] of [[-1.6, 1.15], [1.15, 1.15], [-1.6, 2.95], [1.15, 2.95]]) {
    out.push(AL(k.segment([cx, cy, 0.3], [cx, cy, 1.4], P), { tone: 'lo' }));
  }
  out.push(S(k.slabOf(planAt(-1.1, 1.35, 1.7, 1.5), 1.56, 1.6, P, 3), { tone: 'hi', className: 'product' }));
  // charge cube
  out.push(S(k.slabOf(planAt(-5.4, 2.6, 1.2, 1.2), 0, 1.2, P, 3), { tone: 'mid' }));
  for (let z = 0.2; z < 1.1; z += 0.18) {
    out.push(L(k.segment([-4.75, 3.81, z], [-4.75, 3.81, z + 0.08], P), { tone: 'lo' }));
  }
  out.push(AL(k.segment([-5.4, 3.81, 0.15], [-4.2, 3.81, 0.15], P), { tone: 'mid' }));
  // pedestal + palm
  out.push(S(k.slabOf(planAt(4.3, 2.7, 1.0, 0.9), 0, 1.05, P, 3), { tone: 'mid' }));
  out.push(S(k.cylinder(4.8, 3.15, 0.28, 1.05, 0.06, P, 20), { tone: 'hi' }));
  out.push(D([at([4.8, 3.15, 1.14])], { size: 2.2, tone: 'hi' }));
  // conduit route
  out.push(AL(k.pathOf([[4.8, 3.6, 0.2], [2.8, 4.0, 0.16], [0, 4.05, 0.14], [-2.2, 4.0, 0.16], [-4.8, 3.8, 0.2]].map(at)), { tone: 'mid' }));
  out.push(AL(k.pathOf([[-5.4, 2.6, 0.9], [-3.4, 2.4, 0.4], [-1.6, 2.6, 0.24]].map(at)), { tone: 'mid' }));
  out.push(S(k.cylinder(4.8, 3.15, 0.04, 0.2, 0.9, P, 10), { tone: 'mid' }));
  reg('Palm pedestal', [4.8, 3.15, 1.1], 'pedestal');
  reg('Charge cube', [-4.8, 3.2, 1.0], 'charge');
  reg('Conduit run', [0, 4.0, 0.2], 'conduit');
  reg('Hero lift', [0, 2.0, 1.6], 'lift');
  reg('Product / 4 × 4 ft', [0, 2.1, 2.2], 'product');
};

/* --- 13 THE KABUKI DROP --- */
VARIANTS.kabuki = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const barY = 0.4;
  const barZ = 5.6;
  out.push(S(k.slabOf(planAt(-5.6, barY, 11.2, 0.1), barZ, 0.1, P, 2), { tone: 'mid' }));
  for (let x = -5.2; x <= 5.2; x += 1.3) {
    out.push(S(k.slabOf(planAt(x - 0.06, barY - 0.09, 0.12, 0.24), barZ + 0.1, 0.16, P, 2), { tone: 'hi' }));
    out.push(wire([x, barY, barZ + 0.26], [x, -0.2, 7.4], [], { tone: 'faint' }));
  }
  out.push(AL(k.pathOf([[3.4, barY, barZ + 0.2], [3.4, 1.6, 4.8], [3.4, 2.2, 3.4]].map(at)), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(3.25, 2.4, 0.3, 0.3), 3.15, 0.3, P, 2), { tone: 'mid' }));
  // released cloth: a soft heap spread across the deck
  const clothFront = (t) => 1.0 + 0.16 * Math.sin(t * Math.PI * 3.1 + 0.5) + 0.24 * Math.sin(t * Math.PI);
  const front = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    front.push([-5.2 + 10.4 * t, clothFront(t), 0.56]);
  }
  const back = [];
  for (let i = 40; i >= 0; i--) {
    const t = i / 40;
    back.push([-5.2 + 10.4 * t, 0.5 + 0.05 * Math.sin(t * Math.PI * 2.2), 0.56]);
  }
  const clothPath = k.pathOf([...back, ...front].map(at), true);
  out.push(`<path class="cloth-fill" d="${clothPath}"/>`);
  out.push(AL(clothPath, { tone: 'mid' }));
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const x = -5.05 + 10.1 * t;
    out.push(L(k.segment([x, 0.52, 0.57], [x + 0.12 * Math.sin(t * 11), clothFront(t), 0.57], P), { tone: 'lo' }));
  }
  // product behind
  out.push(S(k.slabOf(planAt(-1.4, -1.6, 2.8, 2.2), 0, 0.3, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-0.9, -1.15, 1.8, 1.5), 0.3, 1.8, P, 3), { tone: 'hi', className: 'product' }));
  reg('Header pipe + eight clamps', [5.2, barY, barZ], 'header');
  reg('Quick-release cloth', [0.4, 2.4, 0.6], 'cloth');
  reg('Release cable', [3.3, 1.8, 4.6], 'release');
  reg('Product / 6 × 6 ft', [0, -0.4, 1.4], 'product');
};

/* --- 14 THE FLY BAR --- */
VARIANTS.flybar = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const barY = 0.0;
  const barZ = 5.9;
  out.push(S(k.slabOf(planAt(-4.6, barY, 9.2, 0.12), barZ, 0.12, P, 2), { tone: 'mid' }));
  for (const x of [-4.3, 4.3]) {
    out.push(S(k.slabOf(planAt(x - 0.14, barY - 0.12, 0.28, 0.36), barZ + 0.12, 0.3, P, 2), { tone: 'hi' }));
    for (const z of [barZ, barZ + 0.42]) {
      out.push(wire([x, barY, z], [x, barY, 7.0], [], { tone: 'faint' }));
    }
    out.push(S(k.slabOf(planAt(x - 0.3, barY - 0.2, 0.6, 0.4), 6.65, 0.3, P, 2), { tone: 'mid' }));
  }
  // drape lifted: hem 1.6 m
  out.push(S(k.slabOf(planAt(-4.45, barY + 0.03, 8.9, 0.03), 1.6, barZ - 1.6, P, 2), { tone: 'hi', crease: 'none', className: 'cloth' }));
  for (let x = -4.2; x < 4.25; x += 0.42) {
    out.push(L(k.segment([x, barY + 0.07, 1.65], [x, barY + 0.07, barZ], P), { tone: 'faint' }));
  }
  for (let x = -4.45; x < 4.45; x += 0.31) {
    out.push(L(k.segment([x, barY + 0.07, 1.6], [x + 0.1, barY + 0.07, 1.52], P), { tone: 'lo' }));
  }
  // weight pocket
  out.push(S(k.slabOf(planAt(-4.45, barY + 0.02, 8.9, 0.05), 1.5, 0.14, P, 2), { tone: 'mid', className: 'cloth' }));
  // product revealed beneath
  out.push(S(k.slabOf(planAt(-1.4, -1.2, 2.8, 2.0), 0, 0.28, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-0.9, -0.75, 1.8, 1.4), 0.28, 1.7, P, 3), { tone: 'hi', className: 'product' }));
  reg('Flown bar', [4.4, barY, barZ + 0.2], 'bar');
  reg('Two chain hoists', [-4.3, barY, 6.8], 'hoists');
  reg('Guided header', [0, barY, barZ + 0.2], 'header');
  reg('Weighted hem', [4.2, barY + 0.08, 1.55], 'hem');
  reg('Product / 6 × 6 ft', [0, -0.1, 1.3], 'product');
};

/* --- 15 THE TRAVELER --- */
VARIANTS.traveler = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const trY = 2.9;
  const trZ = 4.7;
  out.push(S(k.slabOf(planAt(-6.4, trY, 12.8, 0.1), trZ, 0.1, P, 2), { tone: 'mid' }));
  for (let x = -6.0; x <= 6.0; x += 1.5) {
    out.push(S(k.slabOf(planAt(x - 0.05, trY - 0.08, 0.1, 0.22), trZ + 0.1, 0.14, P, 2), { tone: 'hi' }));
    out.push(wire([x, trY, trZ + 0.24], [x, -1.8, 7.4], [], { tone: 'faint' }));
  }
  // two panels parted to the sides
  for (const [cx, sign] of [[-4.6, 1], [4.6, -1]]) {
    out.push(S(k.slabOf(planAt(cx - 1.5, trY + 0.04, 3.0, 0.03), 0.4, trZ - 0.5, P, 2), { tone: 'hi', crease: 'none' }));
    for (let x = -1.4; x <= 1.45; x += 0.34) {
      out.push(L(k.segment([cx + x, trY + 0.08, 0.45], [cx + x, trY + 0.08, trZ - 0.1], P), { tone: 'faint' }));
    }
    for (let x = -1.5; x <= 1.5; x += 0.25) {
      out.push(L(k.segment([cx + x, trY + 0.08, 0.4], [cx + x, trY + 0.08, 0.48], P), { tone: 'lo' }));
    }
    out.push(S(k.slabOf(planAt(cx - 0.25 * sign, trY - 0.06, 0.28, 0.26), trZ + 0.08, 0.16, P, 2), { tone: 'mid' }));
    out.push(AL(k.segment([cx - 0.25 * sign, trY + 0.03, trZ + 0.24], [cx - 0.25 * sign, trY + 0.03, trZ + 0.5], P), { tone: 'lo' }));
  }
  out.push(AL(k.lineOnTop([-6.2, trY + 0.05], [6.2, trY + 0.05], trZ + 0.15, P), { tone: 'lo' }));
  out.push(S(k.slabOf(planAt(-1.3, 0.0, 2.6, 2.0), 0, 0.28, P, 3), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-0.8, 0.45, 1.6, 1.4), 0.28, 1.75, P, 3), { tone: 'hi', className: 'product' }));
  reg('Track', [6.2, trY, trZ], 'track');
  reg('Carriers', [-4.6, trY, trZ + 0.2], 'carriers');
  reg('Two panels + overlaps', [4.6, trY + 0.1, 2.4], 'panels');
  reg('Product / 4 × 4 ft', [0, 1.1, 1.2], 'product');
};

/* --- 16 THE REVOLVE --- */
VARIANTS.revolve = ({ out, reg, S, L, AL, D, at, wire, P }) => {
  const cx = 0;
  const cy = -0.2;
  const r = 3.1;
  out.push(S(k.cylinder(cx, cy, r, -0.5, 0.55, P, 64), { tone: 'lo' }));
  out.push(S(k.cylinder(cx, cy, r - 0.12, 0.05, 0.06, P, 64), { tone: 'mid' }));
  out.push(AL(k.ring(cx, cy, r - 0.05, 0.56, P, 64), { tone: 'lo' }));
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    out.push(AL(k.segment([cx + Math.cos(a) * (r - 0.28), cy + Math.sin(a) * (r - 0.28), 0.57], [cx + Math.cos(a) * (r - 0.12), cy + Math.sin(a) * (r - 0.12), 0.57], P), { tone: i % 3 === 0 ? 'mid' : 'faint' }));
  }
  // shell drum with an aperture facing the audience
  out.push(S(k.cylinder(cx, cy, r - 0.35, 0.57, 3.9, P, 64), { tone: 'hi' }));
  out.push(AL(k.ring(cx, cy, r - 0.35, 4.47, P, 64), { tone: 'mid' }));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    out.push(L(k.segment([cx + Math.cos(a) * (r - 0.35), cy + Math.sin(a) * (r - 0.35), 0.6], [cx + Math.cos(a) * (r - 0.35), cy + Math.sin(a) * (r - 0.35), 4.4], P), { tone: 'faint' }));
  }
  // aperture: frame + recess + product
  out.push(S(k.slabOf(planAt(-1.35, cy + r - 0.5, 2.7, 0.05), 0.6, 2.9, P, 3), { tone: 'lo', crease: 'none' }));
  out.push(AL(k.pathOf([[-1.3, cy + r - 0.42, 0.7], [1.3, cy + r - 0.42, 0.7], [1.3, cy + r - 0.42, 3.4], [-1.3, cy + r - 0.42, 3.4]].map(at)), { tone: 'mid' }));
  out.push(S(k.slabOf(planAt(-1.05, cy + 0.6, 2.1, 1.6), 0.63, 1.5, P, 3), { tone: 'hi', className: 'product' }));
  // drive motor under the deck
  out.push(S(k.cylinder(cx, cy, 0.55, -1.15, 0.5, P, 24), { tone: 'mid' }));
  out.push(S(k.cylinder(cx + 0.5, cy, 0.16, -0.65, 0.16, P, 12), { tone: 'hi' }));
  out.push(wire([cx + 0.5, cy + 0.4, -0.55], [cx - 4.6, cy + 2.4, -0.55], [[cx - 2.4, cy + 2.0, -0.55]], { tone: 'lo' }));
  out.push(AL(k.ring(cx, cy, r + 0.55, 0.02, P, 64), { tone: 'faint', dashed: true }));
  reg('Turntable disc', [cx + r - 0.2, cy + 1.8, 0.5], 'turntable');
  reg('Shell + aperture', [cx + 2.6, cy + 2.6, 2.5], 'shell');
  reg('Drive motor', [cx + 0.9, cy, -0.9], 'motor');
  reg('Product / 6 × 6 ft', [0, cy + 1.4, 1.6], 'product');
};

export { VARIANTS };
