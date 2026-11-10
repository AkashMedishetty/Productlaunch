import { writeFileSync } from 'node:fs';
import { W, H, buildScene } from './draw.mjs';
import * as k from './kit/iso-kit.mjs';
import { PHASES } from './phases.mjs';
import { concepts, stageAnatomyConcept } from '../src/data/concepts.ts';
import { deliveryFor } from '../src/data/deck.ts';

const VIOLET = '#5b3ecf';
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ------------------------------------------------------------------ pins */

function layoutPins(parts, P) {
  const R = 11;
  const GAP = R * 2 + 13;
  const pins = parts.map((part, index) => ({
    ...part,
    n: index + 1,
    sx: 0,
    sy: 0,
    bx: 0,
    by: 0,
  }));
  const center = { x: W / 2, y: H / 2 };
  for (const pin of pins) {
    const p = k.iso(pin.at, P);
    pin.sx = p[0];
    pin.sy = p[1];
    const inside = p[0] > 14 && p[0] < W - 14 && p[1] > 14 && p[1] < H - 14;
    pin.visible = inside;
    const a = Math.atan2(p[1] - center.y, p[0] - center.x) + (pin.id.length % 5) * 0.03 - 0.06;
    pin.bx = p[0] + Math.cos(a) * 30;
    pin.by = p[1] + Math.sin(a) * 30;
  }
  const live = pins.filter((p) => p.visible);
  for (let iter = 0; iter < 320; iter++) {
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i];
        const b = live[j];
        let dx = b.bx - a.bx;
        let dy = b.by - a.by;
        let d = Math.hypot(dx, dy);
        if (d < 0.001) {
          dx = (i % 2 ? 1 : -1) * 0.6;
          dy = 0.8;
          d = 1;
        }
        if (d < GAP) {
          const push = (GAP - d) / 2 / d;
          a.bx -= dx * push;
          a.by -= dy * push;
          b.bx += dx * push;
          b.by += dy * push;
        }
      }
    }
    for (const p of live) {
      p.bx = Math.min(W - R - 10, Math.max(R + 10, p.bx));
      p.by = Math.min(H - R - 10, Math.max(R + 10, p.by));
    }
  }
  return pins;
}

function pinsSvg(pins) {
  const live = pins.filter((p) => p.visible);
  return `<g class="pins">${live
    .map((p) => {
      const dx = p.bx - p.sx;
      const dy = p.by - p.sy;
      const len = Math.max(0.001, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const x1 = p.sx + ux * (p.sx === p.bx && p.sy === p.by ? 0 : 3.2);
      const y1 = p.sy + uy * 3.2;
      const x2 = p.bx - ux * 12.5;
      const y2 = p.by - uy * 12.5;
      return `<g class="pin"><line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/><circle class="anchor" cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="2.6"/><circle class="badge" cx="${p.bx.toFixed(1)}" cy="${p.by.toFixed(1)}" r="11"/><text x="${p.bx.toFixed(1)}" y="${(p.by + 2.4).toFixed(1)}">${p.n}</text></g>`;
    })
    .join('')}</g>`;
}

function detailCrop(mech, P) {
  if (!mech?.length) return null;
  const pts = mech.map((p) => k.iso(p.at, P));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 78;
  const x0 = Math.min(...xs) - pad;
  const x1 = Math.max(...xs) + pad;
  const y0 = Math.min(...ys) - pad;
  const y1 = Math.max(...ys) + pad;
  const side = Math.min(400, Math.max(300, Math.max(x1 - x0, y1 - y0) * 1.1));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const x = Math.min(W - side, Math.max(0, cx - side / 2));
  const y = Math.min(H - side, Math.max(0, cy - side / 2));
  return { x, y, side, zoom: Math.round((W / side) * 10) / 10 };
}

function figure(scene, kind = 'stage', { pins: withPins = true, detail = false } = {}) {
  const { body, parts, P, mech } = buildScene({}, { scene, kind });
  const pins = layoutPins(parts, P);
  const crop = detail ? detailCrop(mech, P) : null;
  return {
    svg: `<svg class="iso-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}${withPins ? pinsSvg(pins) : ''}</svg>`,
    detail: crop
      ? `<figure class="detail"><figcaption><span class="micro">DETAIL / MECHANISM</span><span class="micro">${crop.zoom}×</span></figcaption><div class="detail-frame"><svg class="iso-svg" viewBox="${crop.x.toFixed(0)} ${crop.y.toFixed(0)} ${crop.side.toFixed(0)} ${crop.side.toFixed(0)}" aria-hidden="true">${body}</svg></div></figure>`
      : '',
    parts,
    pins,
  };
}

/* ------------------------------------------------------------------ copy */

const SHORT = {
  unseen: 'Three architectural bays that open in sequence, each wider and taller than the last.',
  pulse: 'A palm on a console sends a visible line of light across the stage to the product.',
  cargo: 'A sealed cargo vault opens four walls on one cue and the object inside becomes the hero.',
  ascension: 'The product rises through a lit aperture in the deck on a certified lift.',
  veil: 'A projected world wraps a cylinder that lifts away to expose the object.',
  sculpture: 'A skeleton of LED lines draws an unknown form, then moves aside.',
  drop: 'A cargo module descends on rigging, lands, and opens its doors.',
  phantom: 'A Pepper’s Ghost image floats in a chamber, then dissolves into the real product.',
  stageproduct: 'The whole set becomes a monumental abstraction of the product, then opens.',
  laser: 'Beams draw a portal in haze; the physical portal opens.',
  colour: 'A monochrome room turns full colour at the reveal.',
  ignition: 'One touch wakes the stage and brings the product up from below.',
  kabuki: 'Eight solenoids drop six metres of cloth in under a second.',
  flybar: 'A weighted drape lifts from the hem, revealing the product like a sunrise.',
  traveler: 'Two pleated panels part from the centre and gather into the wings.',
  revolve: 'A sealed drum turns 180 degrees and brings its aperture round to the room.',
};

const pageFoot = (n, total) =>
  `<footer class="foot"><span>THE STAGE, DISSECTED</span><span>STAGECRAFT ANATOMY · LIGHT MODE</span><span>${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></footer>`;

/* ------------------------------------------------------------------ pages */

const TOTAL = 4 + concepts.length * 2 + 1;

function coverPage() {
  const fig = figure('house', 'house', { pins: false });
  return `<section class="page cover">
    <div class="cover-top">
      <span class="micro">STAGECRAFT ANATOMY</span>
      <span class="micro">LIGHT MODE / A4</span>
    </div>
    <div class="cover-copy">
      <p class="kicker">A dossier for a blind product launch</p>
      <h1>The stage,<br/><em>dissected.</em></h1>
      <p class="lede">Sixteen physical reveal concepts for three products — 2×2, 4×4 and 6×6 feet — drawn as mechanisms, not moods. Every phase is explained, every machine is visible, and every claim is tied to something a crew can build.</p>
      <div class="numbers">
        <div><b>16</b><span>concepts</span></div>
        <div><b>5</b><span>phases each</span></div>
        <div><b>3</b><span>product sizes</span></div>
        <div><b>1</b><span>18 × 9 m stage</span></div>
      </div>
      <p class="cover-note">Every plate carries an isometric anatomy with numbered parts, all five phases written out, the cue sheet, the three-size adaptation and a delivery tier. The house is drawn once and shared by all sixteen.</p>
    </div>
    <div class="cover-band">
      <div class="cover-cap"><span class="micro">THE HOUSE, BEFORE THE CONCEPT</span><span class="micro">FIG. 00</span></div>
      <div class="cover-plate">${fig.svg}</div>
    </div>
    <footer class="foot"><span>PRELIMINARY / FOR REVIEW</span><span>NOVEMBER 2026</span><span>NOT AN ENGINEERING DRAWING</span></footer>
  </section>`;
}

function contentsPage() {
  const rows = concepts
    .map((c, i) => {
      const d = deliveryFor(c.id);
      return `<li><span class="c-idx">${c.index}</span><span class="c-name">${esc(c.name)}</span><span class="c-tier t-${d.tier.toLowerCase()}">${d.tier}</span><span class="c-page">${String(5 + i * 2).padStart(2, '0')}</span></li>`;
    })
    .join('');
  return `<section class="page">
    <header class="runhead"><span class="micro">CONTENTS</span><span class="micro">SIXTEEN REVEALS / ONE ROOM</span></header>
    <div class="contents-grid">
      <div>
        <h2 class="contents-h">The mechanisms</h2>
        <ol class="contents-list">${rows}</ol>
        <p class="contents-note">Each concept occupies two plates: the anatomy and its parts on the left, the five phases, cue sheet and delivery reality on the right.</p>
      </div>
      <aside class="readkey">
        <h3>How to read the drawings</h3>
        <div class="keyrow"><span class="keyline violet"></span><p><b>Violet</b> is the mechanism — the tracks, hinges, struts, cables, rams and drives that make the reveal happen.</p></div>
        <div class="keyrow"><span class="keyline graphite"></span><p><b>Graphite</b> is the house — deck, LED wall, masking, truss, fixtures and datum. Shared by every concept.</p></div>
        <div class="keyrow"><span class="keypin">1</span><p><b>Numbered pins</b> locate each part in the drawing. The list below the figure is the legend; nothing floats.</p></div>
        <h3 class="key-h">Delivery tiers</h3>
        <p class="tierline"><b class="t-proven">PROVEN</b> — standard theatre practice, stock or hireable, rehearses predictably.</p>
        <p class="tierline"><b class="t-engineered">ENGINEERED</b> — custom scenic build with a known method and a real build window.</p>
        <p class="tierline"><b class="t-experimental">EXPERIMENTAL</b> — depends on a technical answer we do not have yet.</p>
        <h3 class="key-h">The fixed room</h3>
        <p class="keypara">18 × 9 m deck, 20 m proscenium, two 20.4 m box-truss spans at 7.4–7.8 m, eight 1 t hoists, eight 750 W profiles, two booms, wool-serge masking and a 14.2 × 5.6 m LED wall. Every figure shares this room so the concepts can be compared.</p>
        <p class="keypara dim">Product identity, weight, height and centre of gravity are unknown. Nothing in this document assumes them; where a concept depends on those numbers, it says so.</p>
      </aside>
    </div>
    <div class="classics">
      <span class="micro">FOUR CLASSICS, KEPT</span>
      <div class="classic-grid">
        <div><b>13</b><h4>THE KABUKI DROP</h4><p>Eight clamps, one cue, under a second. The fastest and cheapest reveal to rehearse.</p></div>
        <div><b>14</b><h4>THE FLY BAR</h4><p>A weighted hem lifts on a guided header. The sunrise reveal, done without a mistake.</p></div>
        <div><b>15</b><h4>THE TRAVELER</h4><p>Two pleated panels part from the centre. Theatre’s most legible reveal, unchanged.</p></div>
        <div><b>16</b><h4>THE REVOLVE</h4><p>A sealed drum turns 180 degrees and brings its aperture to the room.</p></div>
      </div>
    </div>
    ${pageFoot(2, TOTAL)}
  </section>`;
}

function systemPages() {
  const fig = figure('house', 'house');
  const c = stageAnatomyConcept;
  const phases = PHASES.stage;
  return `<section class="page">
    <header class="runhead"><span class="micro">PLATE 00 — THE STAGE SYSTEM</span><span class="micro">THE FIXED HOUSE / 18 × 9 M</span></header>
    <h2 class="plate-h">One room, <em>fully built.</em></h2>
    <p class="plate-lede">The room is fixed before a single reveal is designed. Every concept shares it, so it is drawn once, in full, and referenced by every plate that follows.</p>
    <div class="plate fig-plate">${fig.svg}
      <span class="pc tl">FIG. 00 / HOUSE</span><span class="pc tr">ISOMETRIC / LIGHT MODE</span>
      <span class="pc bl">VIOLET = ANATOMY · GRAPHITE = HOUSE</span><span class="pc br">NOT TO SCALE</span>
    </div>
    <div class="underfig">
      <div class="parts">
        <h3 class="micro-h">PARTS</h3>
        <ol class="parts-list">${fig.parts
          .map((p, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(p.name)}</li>`)
          .join('')}</ol>
      </div>
      <div class="house-spec">
        <h3 class="micro-h">THE FIXED ROOM</h3>
        <dl>${c.tech.map((t) => `<div><dt>${esc(t)}</dt></div>`).join('')}</dl>
        <p>${esc(c.techDetail)}</p>
      </div>
    </div>
    <div class="numbers-band">
      <div><b>18 × 9 m</b><span>matte-black deck</span></div>
      <div><b>20 m</b><span>proscenium opening</span></div>
      <div><b>2 × 20.4 m</b><span>box-truss spans</span></div>
      <div><b>8 × 1 t</b><span>chain hoists</span></div>
      <div><b>14.2 × 5.6 m</b><span>LED image surface</span></div>
      <div><b>1 desk</b><span>two universes, one file</span></div>
    </div>
    <p class="numbers-note">Every element is standard Indian venue stock, chosen so the room can be rebuilt in a different city without redesigning the show. The house is the constant; the mechanism is the variable.</p>
    ${pageFoot(3, TOTAL)}
  </section>

  <section class="page">
    <header class="runhead"><span class="micro">PLATE 00 — THE STAGE SYSTEM</span><span class="micro">PHASES 01–05</span></header>
    <h2 class="plate-h">Five layers, <em>one baseline.</em></h2>
    <div class="phases">${phases
      .map(
        ([label, text], i) => `<div class="phase"><div class="phase-n">${String(i + 1).padStart(2, '0')}</div><div><h3>${esc(label)}</h3><p>${esc(text)}</p></div></div>`,
      )
      .join('')}</div>
    <div class="closing-grid">
      <div>
        <h3 class="micro-h">CUE SHEET</h3>
        <ul class="cues">${c.sequence.map((s) => `<li><span>${esc(s.time)}</span><b>${esc(s.title)}</b><i>${esc(s.detail)}</i></li>`).join('')}</ul>
      </div>
      <div>
        <h3 class="micro-h">WHY IT IS FIXED</h3>
        <p class="body">${esc(c.feasibility)}</p>
        <p class="body">${esc(c.guest)}</p>
        <div class="tierbox"><span class="micro">DELIVERY</span><b>BASE INFRASTRUCTURE</b><p>Stock truss, hoists, profiles and masking, assembled once and reused by every concept in the deck.</p></div>
      </div>
    </div>
    <div class="classics">
      <span class="micro">WHAT THE CONCEPT INHERITS</span>
      <div class="classic-grid">
        <div><b>01</b><h4>FIXED</h4><p>The deck plane, the proscenium line, the LED wall and the masking. No concept may move these.</p></div>
        <div><b>02</b><h4>VARIABLE</h4><p>Fixture focus, haze, rigging positions and the two truss heights. Set per concept, from the same stock.</p></div>
        <div><b>03</b><h4>PER CONCEPT</h4><p>One mechanism, one cover, one guest action and one cue stack. Everything else is the house.</p></div>
      </div>
    </div>
    ${pageFoot(4, TOTAL)}
  </section>`;
}

function toSeconds(time) {
  const [m, s] = time.split(':').map(Number);
  return m * 60 + s;
}

function timeline(concept) {
  const cues = concept.sequence.map((s) => {
    const [, to] = s.time.split('–');
    return { ...s, seconds: Math.max(1, toSeconds(to) - toSeconds(s.time.split('–')[0])) };
  });
  const total = cues.reduce((sum, q) => sum + q.seconds, 0);
  const last = cues[cues.length - 1];
  return `<div class="timeline">
    <div class="tl-cap"><span class="micro">THE RUN OF SHOW, TO SCALE</span><span class="micro">${esc(cues[0].time.split('–')[0])} — ${esc(last.time.split('–')[1])}</span></div>
    <div class="tl-track">${cues
      .map((q, j) => {
        const narrow = q.seconds / total < 0.06;
        const dur = q.seconds >= 60 ? `${Math.floor(q.seconds / 60)}:${String(q.seconds % 60).padStart(2, '0')}` : `${q.seconds}s`;
        return `<div class="tl-seg${j === cues.length - 1 ? ' hold' : ''}${narrow ? ' narrow' : ''}" style="flex:${q.seconds}"><em>${dur}</em><b>${j === cues.length - 1 ? 'HOLD' : String(j + 1).padStart(2, '0')}</b>${narrow ? '' : `<span>${esc(q.title)}</span>`}</div>`;
      })
      .join('')}</div>
  </div>`;
}

function conceptPages(concept, i) {
  const fig = figure(concept.id, 'stage', { detail: true });
  const d = deliveryFor(concept.id);
  const phases = PHASES[concept.id] ?? concept.phases.map((p) => [p, '']);
  const plateNo = 5 + i * 2;
  const tiers = d.tier.toLowerCase();

  return `<section class="page">
    <header class="runhead"><span class="micro">PLATE ${String(i + 1).padStart(2, '0')} — ${esc(concept.name)}</span><span class="micro">${esc(concept.mechanism)} / ${esc(concept.sizeLabel)}</span></header>
    <h2 class="plate-h">${esc(concept.name)}</h2>
    <p class="plate-lede"><em>${esc(concept.tagline)}</em></p>
    <div class="plate fig-plate">${fig.svg}
      <span class="pc tl">FIG. ${String(i + 1).padStart(2, '0')}</span><span class="pc tr">ISOMETRIC / LIGHT MODE</span>
      <span class="pc bl">VIOLET = MECHANISM · GRAPHITE = HOUSE</span><span class="pc br">${esc(d.tier)} / ${esc(d.build)}</span>
    </div>
    <div class="underfig">
      <div class="parts">
        <h3 class="micro-h">PARTS</h3>
        <ol class="parts-list">${fig.parts
          .map((p, j) => `<li class="${fig.pins[j]?.visible ? '' : 'unpinned'}"><span>${String(j + 1).padStart(2, '0')}</span>${esc(p.name)}</li>`)
          .join('')}</ol>
        <blockquote class="signature">“${esc(concept.signature)}”</blockquote>
        ${fig.detail}
      </div>
      <div class="plate-copy">
        <h3 class="micro-h">THE SET</h3>
        <p>${esc(concept.stageDesign)}</p>
        <h3 class="micro-h">THE COVER</h3>
        <p>${esc(concept.concealment)}</p>
        <h3 class="micro-h">THE HAND</h3>
        <p>${esc(concept.guest)}</p>
      </div>
    </div>
    <p class="plate-caption">${esc(SHORT[concept.id] ?? '')} Drawn in the fixed house; product shown as a massing block because its identity is unknown.</p>
    ${pageFoot(plateNo, TOTAL)}
  </section>

  <section class="page phase-page">
    <header class="runhead"><span class="micro">${esc(concept.name)} — PHASES 01–05</span><span class="micro">${esc(concept.proposition)}</span></header>
    <div class="phase-head">
      <div class="phase-idx">${esc(concept.index)}</div>
      <div>
        <h2 class="phase-title">${esc(concept.name)}</h2>
        <p class="phase-prop">${esc(concept.proposition)}</p>
      </div>
      <div class="tierchip t-${tiers}"><span>${esc(d.tier)}</span><b>${esc(d.build)}</b></div>
    </div>
    <div class="phases">${phases
      .map(
        ([label, text], j) => `<div class="phase"><div class="phase-n">${String(j + 1).padStart(2, '0')}</div><div><h3>${esc(label)}</h3><p>${esc(text)}</p></div></div>`,
      )
      .join('')}</div>
    <div class="closing-grid concept-bottom">
      <div>
        <h3 class="micro-h">CUE SHEET</h3>
        <ul class="cues compact">${concept.sequence.map((s) => `<li><span>${esc(s.time)}</span><b>${esc(s.title)}</b></li>`).join('')}</ul>
        <h3 class="micro-h tech-h">TECHNICAL</h3>
        <div class="chips">${concept.tech.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <p class="body">${esc(concept.techDetail)}</p>
      </div>
      <div>
        <h3 class="micro-h">THE THREE SIZES</h3>
        <dl class="sizes">
          <div><dt>2×2 FT</dt><dd>${esc(concept.adaptation.small)}</dd></div>
          <div><dt>4×4 FT</dt><dd>${esc(concept.adaptation.medium)}</dd></div>
          <div><dt>6×6 FT</dt><dd>${esc(concept.adaptation.large)}</dd></div>
        </dl>
        <div class="risk">
          <div><h3 class="micro-h">FEASIBILITY</h3><p>${esc(concept.feasibility)}</p></div>
          <div><h3 class="micro-h">IF NOT</h3><p>${esc(concept.mitigation)}</p></div>
        </div>
        <div class="tierbox t-${tiers}"><span class="micro">DELIVERY — ${esc(d.tier)}</span><b>${esc(d.build)}</b><p>${esc(d.note)}</p></div>
      </div>
    </div>
    ${timeline(concept)}
    ${pageFoot(plateNo + 1, TOTAL)}
  </section>`;
}

function closingPage() {
  const rows = concepts
    .map((c) => {
      const d = deliveryFor(c.id);
      return `<tr><td class="m-idx">${c.index}</td><td class="m-name">${esc(c.name)}</td><td>${esc(c.mechanism)}</td><td class="t-${d.tier.toLowerCase()}">${d.tier}</td><td>${esc(d.build)}</td><td>${esc(c.complexity)}</td><td>${esc(c.sizeLabel.replace(/ · /g, ' / '))}</td></tr>`;
    })
    .join('');
  const counts = concepts.reduce((acc, c) => {
    const t = deliveryFor(c.id).tier;
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  return `<section class="page">
    <header class="runhead"><span class="micro">DELIVERY AT A GLANCE</span><span class="micro">PROVEN · ENGINEERED · EXPERIMENTAL</span></header>
    <h2 class="plate-h">What ships, <em>and what must be answered.</em></h2>
    <p class="plate-lede">Three tiers, sixteen mechanisms. ${counts.PROVEN ?? 0} are standard practice, ${counts.ENGINEERED ?? 0} are custom scenic builds with a known method, and ${counts.EXPERIMENTAL ?? 0} depends on a technical answer that does not exist yet. Nothing here is priced until the product mass, footprint and venue rigging are confirmed.</p>
    <table class="matrix"><thead><tr><th>#</th><th>CONCEPT</th><th>MECHANISM</th><th>TIER</th><th>BUILD</th><th>COMPLEXITY</th><th>FOOTPRINT</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="closing-notes">
      <div><h3 class="micro-h">THE ONE THING TO HOLD</h3><p class="body">Every concept is a machine first and an image second. The five-phase anatomy, the cue sheet and the delivery tier are the same information for the stage manager, the fabricator and the client — so a decision made on paper survives contact with the room.</p></div>
      <div><h3 class="micro-h">WHAT WE STILL NEED</h3><p class="body">Product height, weight and centre of gravity; product form and handling restrictions; actual sector and approved claims; venue rigging points, stage load and ceiling height; lift travel, sightlines and crossovers; fog, laser, confetti and fire-alarm permissions.</p></div>
      <div><h3 class="micro-h">NEXT</h3><p class="body">Choose one concept per product footprint, confirm the venue’s rigging and power, and commission a full technical drawing and load sheet for the shortlisted mechanisms.</p></div>
    </div>
    ${pageFoot(TOTAL, TOTAL)}
  </section>`;
}

/* ------------------------------------------------------------------ shell */

const css = `
@page { size: A4; margin: 0; }
:root{
  --paper:#fbfbfa; --ink:#18181a; --muted:#6c6c70; --dim:#9a9a9e; --hair:#d9d8d3; --violet:${VIOLET};
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --sans:"Helvetica Neue",Helvetica,Arial,sans-serif;
  --mono:"SF Mono",Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#e7e6e2;color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased}
.page{width:210mm;height:297mm;padding:15mm 15mm 12mm;background:var(--paper);position:relative;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto}
.page:last-child{page-break-after:auto}
.micro{font-family:var(--mono);font-size:6.4pt;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.micro-h{font-family:var(--mono);font-size:6.2pt;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);font-weight:500;margin:0 0 2mm}
.runhead{display:flex;justify-content:space-between;gap:10mm;border-top:.4pt solid var(--ink);padding-top:2mm;align-items:baseline}
.runhead .micro:last-child{text-align:right;color:var(--dim)}
.foot{position:absolute;left:15mm;right:15mm;bottom:8mm;display:flex;justify-content:space-between;border-top:.4pt solid var(--hair);padding-top:2mm;font-family:var(--mono);font-size:6.2pt;letter-spacing:.1em;color:var(--dim);text-transform:uppercase}
.plate-h{font-family:var(--serif);font-weight:400;font-size:30pt;line-height:1;letter-spacing:-.015em;margin:5mm 0 1.6mm}
.plate-h em{font-style:italic;color:var(--violet)}
.plate-lede{font-family:var(--serif);font-size:10.6pt;line-height:1.42;color:#3c3c40;margin:0 0 4mm;max-width:158mm}
.plate-lede em{color:#45454a}
.plate{position:relative;border:.4pt solid var(--hair);background:#fdfcf9;padding:1mm}
.plate .pc{position:absolute;font-family:var(--mono);font-size:5.8pt;letter-spacing:.1em;color:var(--dim);text-transform:uppercase;z-index:2}
.plate .pc.tl{top:2mm;left:2.6mm;color:var(--muted)}
.plate .pc.tr{top:2mm;right:2.6mm;text-align:right}
.plate .pc.bl{bottom:2mm;left:2.6mm}
.plate .pc.br{bottom:2mm;right:2.6mm;text-align:right;color:var(--muted)}
.iso-svg{display:block;width:100%;height:auto;overflow:hidden}
.iso-svg path,.iso-svg circle,.iso-svg line{vector-effect:non-scaling-stroke}
.iso-shade{stroke:none}
.iso-shade[data-shade="0"]{fill:#c3c2ba}.iso-shade[data-shade="1"]{fill:#d6d5cd}
.iso-shade[data-shade="2"]{fill:#e6e5dd}.iso-shade[data-shade="3"]{fill:#f2f1ea}
.iso-top{fill:#fff;stroke:none}
.iso-solid[data-lit]>.iso-shade{fill:#ebeae3}
.iso-halo{fill:#8a8a80;stroke:none;opacity:.28;filter:blur(9px)}
.iso-line{fill:none;stroke:#a3a3a6;stroke-width:.7;stroke-linecap:round;stroke-linejoin:round}
.iso-line[data-tone="hi"]{stroke:#232326}.iso-line[data-tone="mid"]{stroke:#77777c}
.iso-line[data-tone="lo"]{stroke:#a3a3a6}.iso-line[data-tone="faint"]{stroke:#c8c8ca}
.iso-line[data-tone="lit"]{stroke:#18181a}
.iso-dots circle{fill:#3a3a3e;opacity:.28}
.iso-wire-end{fill:#fdfcf9;stroke:#a3a3a6}
.anat{fill:none;stroke:${VIOLET};stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.mech .iso-edge{stroke:${VIOLET};stroke-width:1}
.mech .anat{stroke:${VIOLET};stroke-width:1.1;opacity:1}
.mech .iso-crease{stroke:#b3a5e6}
.mech .iso-dots circle{fill:${VIOLET};opacity:.42}
.mech .cloth .iso-top{fill:#e9e7da}
.mech .cloth .iso-shade[data-shade="0"]{fill:#c6c2ae}
.mech .cloth .iso-shade[data-shade="1"]{fill:#d2cebb}
.mech .cloth .iso-shade[data-shade="2"]{fill:#dcd8c7}
.mech .cloth .iso-shade[data-shade="3"]{fill:#e7e4d6}
.cloth-fill{fill:#e9e6d9;opacity:.55}
[data-dotted]{stroke-dasharray:.4 2.4;stroke-linecap:round}
[data-dashed]{stroke-dasharray:3 2.2}
[data-flow]{stroke-dasharray:1 3.4}
.mech .product .iso-edge{stroke:#232326}
.mech .product .iso-top{fill:#f7f2e6}
.mech .product .iso-shade[data-shade="1"]{fill:#ede5d2}
.mech .product .iso-shade[data-shade="2"]{fill:#e4dbc6}
.cloth .iso-shade[data-shade="1"]{fill:#d0cfc7}
.cloth .iso-shade[data-shade="2"]{fill:#dcdbd3}
.led .iso-top{fill:#f0efe8}
.deck .iso-top{fill:#fff}
.pins line{stroke:${VIOLET};stroke-width:.7;opacity:.55;vector-effect:non-scaling-stroke}
.pins .anchor{fill:${VIOLET}}
.pins .badge{fill:${VIOLET};stroke:#fdfcf9;stroke-width:2.4}
.pins text{fill:#fff;font-family:var(--mono);font-size:9.6px;text-anchor:middle;font-weight:600}
.underfig{display:grid;grid-template-columns:1.02fr .98fr;gap:9mm;margin-top:4.6mm}
.parts-list{list-style:none;margin:0;padding:0;columns:2;column-gap:6mm}
.parts-list li{font-size:7.6pt;line-height:1.5;color:#3c3c40;display:flex;gap:2.2mm;break-inside:avoid;padding:.4mm 0}
.parts-list li span{font-family:var(--mono);font-size:6.2pt;color:var(--violet);padding-top:.35mm;min-width:4mm}
.parts-list li.unpinned{color:var(--dim)}
.plate-copy p,.house-spec p{font-size:7.8pt;line-height:1.52;color:#3c3c40;margin:0 0 2.4mm}
.plate-copy .micro-h{margin-top:2.6mm}
.plate-copy .micro-h:first-child,.house-spec .micro-h:first-child{margin-top:0}
.house-spec dl{display:grid;grid-template-columns:1fr 1fr;gap:1.4mm 4mm;margin:0 0 2.6mm}
.house-spec dt{font-family:var(--mono);font-size:6.4pt;letter-spacing:.04em;color:#45454a;border-top:.4pt solid var(--hair);padding-top:1.2mm}
.plate-caption{font-size:7pt;line-height:1.45;color:var(--dim);margin:3.4mm 0 0;padding-top:2mm;border-top:.4pt solid var(--hair);max-width:158mm}
.phase-head{display:grid;grid-template-columns:16mm 1fr auto;gap:5mm;align-items:start;border-top:.4pt solid var(--ink);margin-top:4mm;padding-top:4mm}
.phase-idx{font-family:var(--serif);font-size:30pt;line-height:1;color:var(--violet)}
.phase-title{font-family:var(--serif);font-weight:400;font-size:20pt;line-height:1.05;margin:0 0 1.4mm}
.phase-prop{font-size:8.4pt;color:var(--muted);margin:0;font-style:italic}
.tierchip{border:.5pt solid var(--hair);padding:2mm 3mm;text-align:right;min-width:32mm}
.tierchip span{display:block;font-family:var(--mono);font-size:6.2pt;letter-spacing:.1em}
.tierchip b{display:block;font-family:var(--mono);font-size:7pt;margin-top:.8mm;color:var(--ink)}
.phases{margin-top:4mm}
.phase{display:grid;grid-template-columns:13mm 1fr;gap:4mm;padding:2.1mm 0;border-top:.4pt solid var(--hair)}
.phase:last-child{border-bottom:.4pt solid var(--hair)}
.phase-n{font-family:var(--mono);font-size:7pt;color:var(--violet);padding-top:.6mm}
.phase h3{font-family:var(--mono);font-size:7.6pt;letter-spacing:.12em;text-transform:uppercase;margin:0 0 1mm;font-weight:600}
.phase p{font-size:8.5pt;line-height:1.46;color:#333338;margin:0;max-width:150mm}
.phase-page{display:flex;flex-direction:column}
.timeline{margin-top:auto;margin-bottom:13mm;border-top:.4pt solid var(--ink);padding-top:2mm}
.tl-cap{display:flex;justify-content:space-between}
.tl-track{display:flex;margin-top:2.6mm;height:13mm;border-bottom:.4pt solid var(--hair)}
.tl-seg{display:flex;flex-direction:column;justify-content:flex-end;border-left:.4pt solid var(--hair);padding:4.6mm 1.8mm 1.4mm;min-width:0;position:relative}
.tl-seg:first-child{border-left:.4pt solid var(--ink)}
.tl-seg.hold{background:#f1efe7}
.tl-seg.narrow{padding-left:.8mm;padding-right:.4mm}
.tl-seg em{font-family:var(--mono);font-style:normal;font-size:5.4pt;color:var(--muted);position:absolute;top:0;left:1.8mm}
.tl-seg b{font-family:var(--mono);font-weight:400;font-size:6pt;color:var(--violet);margin-bottom:.5mm}
.tl-seg span{font-size:6.4pt;color:#3c3c40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.closing-grid{display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:5mm}
.cues{list-style:none;margin:0;padding:0}
.cues li{display:grid;grid-template-columns:17mm 1fr;column-gap:3mm;padding:1.5mm 0;border-top:.4pt solid var(--hair)}
.cues li span{font-family:var(--mono);font-size:6pt;color:var(--violet);padding-top:.4mm}
.cues li b{font-size:7.2pt;font-weight:600;display:block;margin-bottom:.3mm}
.cues li i{font-style:normal;font-size:7pt;line-height:1.42;color:#54545a;grid-column:2}
.body{font-size:7.8pt;line-height:1.5;color:#3c3c40;margin:0 0 2.8mm}
.chips{display:flex;flex-wrap:wrap;gap:1.2mm;margin:0 0 2.4mm}
.chips span{font-family:var(--mono);font-size:5.8pt;letter-spacing:.04em;color:#45454a;border:.4pt solid var(--hair);padding:.7mm 1.4mm}
.sizes{margin:0 0 2.6mm}
.sizes>div{display:grid;grid-template-columns:17mm 1fr;gap:2.6mm;border-top:.4pt solid var(--hair);padding:1.4mm 0}
.sizes dt{font-family:var(--mono);font-size:6.2pt;color:var(--violet);padding-top:.4mm}
.sizes dd{margin:0;font-size:7.2pt;line-height:1.45;color:#3c3c40}
.risk{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:3mm 0 2.8mm}
.risk p{font-size:7pt;line-height:1.42;color:#4a4a50;margin:0}
.tierbox{border-top:1.2pt solid var(--violet);padding-top:2mm}
.tierbox .micro{color:var(--violet)}
.tierbox b{display:block;font-family:var(--mono);font-size:7.2pt;letter-spacing:.06em;margin:.8mm 0 1mm}
.tierbox p{font-size:7.2pt;line-height:1.42;color:#404046;margin:0}
.t-proven{color:#2c6f55}.t-engineered{color:#8a6a2f}.t-experimental{color:#a64b3a}
.tierchip.t-proven{border-color:#2c6f55}.tierchip.t-engineered{border-color:#8a6a2f}.tierchip.t-experimental{border-color:#a64b3a}
.tierchip span{color:inherit}
/* cover */
.cover{padding:15mm 15mm 12mm;display:flex;flex-direction:column}
.cover-top{display:flex;justify-content:space-between;border-top:.4pt solid var(--ink);padding-top:2mm}
.cover-copy{margin-top:16mm}
.kicker{font-family:var(--mono);font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:var(--violet);margin:0 0 5mm}
.cover h1{font-family:var(--serif);font-weight:400;font-size:64pt;line-height:.92;letter-spacing:-.025em;margin:0 0 7mm}
.cover h1 em{font-style:italic;color:var(--violet)}
.lede{font-family:var(--serif);font-size:11.6pt;line-height:1.45;color:#3c3c40;max-width:132mm;margin:0 0 8mm}
.numbers{display:flex;gap:12mm;border-top:.4pt solid var(--hair);padding-top:4mm}
.numbers div{display:flex;flex-direction:column;gap:1mm}
.numbers b{font-family:var(--serif);font-weight:400;font-size:22pt;line-height:1}
.numbers span{font-family:var(--mono);font-size:6pt;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.cover-band{margin-top:auto;border-top:.4pt solid var(--hair);padding-top:2mm}
.cover-cap{display:flex;justify-content:space-between;margin-bottom:1mm}
.cover-plate{border:.4pt solid #d3d2ca;background:#fff;padding:2mm 2mm 0}
.cover-band .iso-svg{height:97mm;width:100%;margin-bottom:0}
.cover-note{font-size:7.6pt;line-height:1.5;color:var(--dim);max-width:132mm;margin:7mm 0 0;padding-top:3mm;border-top:.4pt solid var(--hair)}
.classics{margin-top:7mm;border-top:.4pt solid var(--ink);padding-top:3mm}
.classic-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:3mm}
.classic-grid b{font-family:var(--mono);font-size:6pt;color:var(--violet);display:block;margin-bottom:1.4mm}
.classic-grid h4{font-family:var(--serif);font-size:9.4pt;font-weight:400;margin:0 0 1.2mm;letter-spacing:.01em}
.classic-grid p{font-size:6.9pt;line-height:1.42;color:#4a4a50;margin:0}
.numbers-band{display:grid;grid-template-columns:repeat(6,1fr);gap:4mm;margin-top:6mm;border-top:.4pt solid var(--hair);padding-top:3mm}
.numbers-band b{display:block;font-family:var(--serif);font-size:12.5pt;font-weight:400;line-height:1.05;margin-bottom:1mm}
.numbers-band span{font-family:var(--mono);font-size:5.6pt;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.numbers-note{font-size:7pt;line-height:1.45;color:var(--dim);margin:3mm 0 0;max-width:150mm}
.signature{font-family:var(--serif);font-style:italic;font-size:8.6pt;line-height:1.4;color:#4a4a50;border-left:1.2pt solid var(--violet);padding-left:3mm;margin:5mm 0 4mm;max-width:90mm}
.detail{margin:0;display:flex;gap:4mm;align-items:flex-start}
.detail figcaption{display:flex;flex-direction:column;gap:1.4mm;width:20mm;padding-top:1mm}
.detail .detail-frame{width:42mm;height:42mm;border:.4pt solid var(--hair);overflow:hidden;background:#fdfcf9}
.detail .detail-frame svg{width:100%;height:100%;display:block}
.cues.compact li{grid-template-columns:18mm 1fr;padding:1.25mm 0;align-items:baseline}
.cues.compact li b{font-size:7.2pt;margin:0}
.tech-h{margin-top:4mm!important}
/* contents */
.contents-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:12mm;margin-top:9mm}
.contents-h{font-family:var(--serif);font-weight:400;font-size:22pt;margin:0 0 4mm}
.contents-list{list-style:none;margin:0;padding:0;counter-reset:none}
.contents-list li{display:grid;grid-template-columns:10mm 1fr 22mm 8mm;align-items:baseline;gap:2mm;border-top:.4pt solid var(--hair);padding:1.9mm 0;font-size:8.4pt}
.contents-list li:last-child{border-bottom:.4pt solid var(--hair)}
.c-idx{font-family:var(--mono);font-size:6.2pt;color:var(--violet)}
.c-name{font-family:var(--serif);font-size:10.4pt}
.c-tier{font-family:var(--mono);font-size:5.8pt;letter-spacing:.06em;text-align:right}
.c-page{font-family:var(--mono);font-size:6.6pt;text-align:right;color:var(--muted)}
.contents-note{font-size:7.4pt;line-height:1.5;color:var(--dim);margin:3mm 0 0;max-width:88mm}
.readkey h3{font-family:var(--mono);font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin:0 0 2.4mm;padding-top:2mm;border-top:.4pt solid var(--ink)}
.readkey h3.key-h{margin-top:5mm}
.keyrow{display:grid;grid-template-columns:12mm 1fr;gap:3mm;align-items:start;margin-bottom:2.4mm}
.keyrow p{font-size:7.4pt;line-height:1.45;color:#44444a;margin:0}
.keyrow b{color:var(--ink)}
.keyline{height:0;border-top:1.1pt solid var(--ink);margin-top:2mm}
.keyline.violet{border-color:var(--violet)}
.keyline.graphite{border-color:#a3a3a6;border-top-width:.8pt}
.keypin{width:6.4mm;height:6.4mm;border-radius:50%;background:var(--violet);color:#fff;font-family:var(--mono);font-size:6.4pt;display:flex;align-items:center;justify-content:center}
.tierline{font-size:7.2pt;line-height:1.5;color:#44444a;margin:0 0 1.6mm}
.tierline b{font-family:var(--mono);font-size:6.2pt;letter-spacing:.06em;margin-right:1.4mm}
.keypara{font-size:7.2pt;line-height:1.5;color:#44444a;margin:0 0 2mm}
.keypara.dim{color:var(--dim)}
/* closing */
.matrix{width:100%;border-collapse:collapse;margin-top:6mm;font-size:6.9pt}
.matrix th{text-align:left;font-family:var(--mono);font-size:5.6pt;letter-spacing:.08em;color:var(--muted);border-top:.8pt solid var(--ink);border-bottom:.4pt solid var(--hair);padding:1.6mm 1.4mm;font-weight:500}
.matrix td{padding:1.9mm 1.4mm;border-bottom:.4pt solid var(--hair);color:#3c3c40;vertical-align:baseline}
.matrix .m-idx{font-family:var(--mono);font-size:5.8pt;color:var(--violet);width:7mm}
.matrix .m-name{font-family:var(--serif);font-size:8.2pt;color:var(--ink)}
.closing-notes{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:7mm;margin-top:8mm;border-top:.4pt solid var(--ink);padding-top:4mm}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>The Stage, Dissected</title><style>${css}</style></head><body>
${coverPage()}
${contentsPage()}
${systemPages()}
${concepts.map((c, i) => conceptPages(c, i)).join('')}
${closingPage()}
</body></html>`;

writeFileSync('anatomy/anatomy.html', html);
console.log(`anatomy.html written · ${TOTAL} pages · ${concepts.length} concepts`);
