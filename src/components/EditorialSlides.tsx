import { useMemo, useState } from 'react';
import {
  concepts,
  labIdeas,
  recommendedSlate,
  stageAnatomyConcept,
  trilogyConcept,
  type Concept,
  type ConceptScores,
} from '../data/concepts';
import {
  designPrinciples,
  eventFacts,
  experienceActs,
  matrixColumns,
  productionNotes,
  unknowns,
} from '../data/deck';
import { ArrowRight, ArrowUpRight, GridIcon } from './Icons';
import { StagePanel } from './StagePanel';

interface NavigationProps {
  onOpenConcept: (index: number) => void;
  onOpenIndex: () => void;
}

function conceptByScene(scene: Concept['scene']) {
  return concepts.find((concept) => concept.scene === scene) ?? concepts[0];
}

export function BriefSlide() {
  return (
    <div className="editorial">
      <div className="editorial-head">
        <div>
          <span className="eyebrow">01 / THE BRIEF</span>
          <h2 className="display">
            A launch for <em>three unknowns.</em>
          </h2>
        </div>
        <p className="lede">
          Three physical products, three footprints, one auditorium and no confirmed technical detail. The stage
          cannot depend on what the objects look like. It has to make their arrival mean something.
        </p>
      </div>

      <div className="brief-scale">
        {[
          { size: '2×2', note: 'ACT I / THE INTIMATE OPENING' },
          { size: '4×4', note: 'ACT II / THE IMMERSIVE ESCALATION' },
          { size: '6×6', note: 'ACT III / THE PHYSICAL CLIMAX' },
        ].map((item) => (
          <div className="scale-cell" key={item.size}>
            <strong>
              {item.size}
              <span>FT</span>
            </strong>
            <p>{item.note}</p>
          </div>
        ))}
      </div>

      <div className="fact-row">
        {eventFacts.map((fact) => (
          <div className="fact" key={fact.label}>
            <small>{fact.label}</small>
            <b>{fact.value}</b>
            <small>{fact.note}</small>
          </div>
        ))}
      </div>

      <div className="unknown-list">
        <span className="micro unknown-label">OPEN VARIABLES / TO BE CONFIRMED</span>
        {unknowns.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

export function PremiseSlide() {
  return (
    <div className="editorial">
      <div className="editorial-head">
        <div>
          <span className="eyebrow">02 / THE PREMISE</span>
          <h2 className="display">
            The stage is <em>the story.</em>
          </h2>
        </div>
        <p className="lede">
          The audience should not watch a curtain open. They should watch architecture decide, light travel, a
          structure change its mind. The product is the last thing to move — and the first thing they remember.
        </p>
      </div>

      <div className="principles">
        {designPrinciples.map((principle, index) => (
          <article className="principle" key={principle.title}>
            <span className="principle-num">0{index + 1}</span>
            <h3>{principle.title}</h3>
            <p className="body-copy">{principle.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ExperienceSlide() {
  return (
    <div className="editorial">
      <div className="editorial-head">
        <div>
          <span className="eyebrow">03 / THE EXPERIENCE</span>
          <h2 className="display">
            Five acts. <em>One room.</em>
          </h2>
        </div>
        <p className="lede">
          Each launch follows the same four-minute emotional contract: hook, story, activation, reveal, hold.
          The mechanism changes. The rhythm stays legible from the back row.
        </p>
      </div>

      <div className="acts">
        {experienceActs.map((act) => (
          <article className="act" key={act.number}>
            <div className="act-top">
              <span className="act-num">{act.number}</span>
              <span className="act-time">{act.time}</span>
            </div>
            <h3>{act.title}</h3>
            <p>{act.body}</p>
            <span className="act-foot">PRODUCT {act.number}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

export function StageSystemSlide({ onOpenConcept }: Pick<NavigationProps, 'onOpenConcept'>) {
  return (
    <div className="system is-anatomy">
      <div className="system-visual">
        <StagePanel concept={stageAnatomyConcept} hudLabel="STAGE ANATOMY" />
      </div>

      <div className="system-copy">
        <span className="eyebrow">04 / THE STAGE SYSTEM</span>
        <h2 className="display display-sm">
          The room is <em>the first reveal.</em>
        </h2>
        <p className="lede">
          Before a single mechanism is chosen, one stage is built and dressed: an 18 × 9 m deck inside a 20 m
          proscenium, two truss spans on eight chain hoists, masking that closes every sightline, and one control
          position that owns every cue. Each concept in this deck is an insert into this room.
        </p>

        <div className="stage-specs">
          <div className="stage-spec">
            <small>DECK</small>
            <b>18 × 9 M</b>
            <span>25 mm ply on steel legs, recessed cable ramp</span>
          </div>
          <div className="stage-spec">
            <small>PROSCENIUM</small>
            <b>20 M / 8.8 M</b>
            <span>Matte-black towers and header, brass sightline</span>
          </div>
          <div className="stage-spec">
            <small>RIGGING</small>
            <b>2 SPANS · 8 HOISTS</b>
            <span>20.4 m box truss, 1 t chain hoists, secondary bonds</span>
          </div>
          <div className="stage-spec">
            <small>LIGHTING</small>
            <b>8 PROFILES + 2 BOOMS</b>
            <span>Warm key stage left, cool rim stage right</span>
          </div>
          <div className="stage-spec">
            <small>MASKING</small>
            <b>4 LEGS · 2 BORDERS</b>
            <span>Wool serge; hides wings, crew and cable</span>
          </div>
          <div className="stage-spec">
            <small>CONTROL</small>
            <b>1 DESK · 2 UNIVERSES</b>
            <span>Printed show file, spare dimmer rack, cue light</span>
          </div>
          <div className="stage-spec">
            <small>SCREEN</small>
            <b>14.2 × 5.6 M</b>
            <span>2.5 mm LED wall; the only moving image surface</span>
          </div>
          <div className="stage-spec">
            <small>SAFETY</small>
            <b>LIMITS + OVERRIDES</b>
            <span>Hard stops, position sensors, manual fallback</span>
          </div>
        </div>

        <div className="system-acts">
          <span className="micro">THE THREE-ACT PROGRAMME</span>
          {recommendedSlate.map((item) => {
            const index = concepts.findIndex((concept) => concept.id === item.conceptId);
            return (
              <button
                className="system-row"
                type="button"
                key={item.act}
                onClick={() => onOpenConcept(index)}
              >
                <span className="system-act">{item.act}</span>
                <span className="system-size">{item.scale}</span>
                <span className="system-name">
                  {item.concept}
                  <small>{item.role}</small>
                </span>
                <ArrowUpRight />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ConceptIndexSlide({ onOpenConcept }: Pick<NavigationProps, 'onOpenConcept'>) {
  return (
    <div className="editorial">
      <div className="index-intro">
        <div>
          <span className="eyebrow">05 / CONCEPT INDEX</span>
          <h2 className="display">
            Sixteen ways to <em>reveal.</em>
          </h2>
        </div>
        <span className="index-count">16</span>
      </div>

      <div className="index-grid">
        {concepts.map((concept, index) => (
          <button className="index-card" type="button" key={concept.id} onClick={() => onOpenConcept(index)}>
            <div className="index-card__top">
              <span className="index-card__num">{concept.index}</span>
              <span className="index-card__complexity">{concept.complexity}</span>
            </div>
            <span className="index-card__name">{concept.name}</span>
            <span className="index-card__mech">{concept.mechanism}</span>
            <span className="index-card__arrow">
              OPEN DOSSIER <ArrowRight size={10} />
            </span>
          </button>
        ))}
      </div>

      <div className="index-foot">
        <span>ONE STAGE / SIXTEEN INDEPENDENT MECHANISMS</span>
        <span>SELECT ANY CARD TO OPEN THE DOSSIER</span>
      </div>
    </div>
  );
}

export function LabSlide() {
  return (
    <div className="editorial">
      <div className="index-intro">
        <div>
          <span className="eyebrow">06 / THE CONCEPT LAB</span>
          <h2 className="display display-sm">
            Explored. Parked. <em>Kept on file.</em>
          </h2>
        </div>
        <span className="index-count">12</span>
      </div>
      <div className="lab-grid">
        {labIdeas.map((idea) => (
          <article className="lab-card" key={idea.name}>
            <span className="lab-family">{idea.family}</span>
            <h3>{idea.name}</h3>
            <p>{idea.line}</p>
            <span className="lab-status">{idea.status}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

type SortKey = 'curated' | keyof ConceptScores;

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'curated', label: 'CURATED' },
  { key: 'wow', label: 'WOW' },
  { key: 'originality', label: 'ORIGINALITY' },
  { key: 'readability', label: 'BACK ROW' },
  { key: 'adaptability', label: 'ADAPTABILITY' },
];

export function MatrixSlide({ onOpenConcept }: Pick<NavigationProps, 'onOpenConcept'>) {
  const [sort, setSort] = useState<SortKey>('curated');

  const rows = useMemo(() => {
    const rowsWithIndex = concepts.map((concept, index) => ({ concept, index }));
    if (sort === 'curated') return rowsWithIndex;
    return rowsWithIndex.sort((a, b) => b.concept.scores[sort] - a.concept.scores[sort]);
  }, [sort]);

  return (
    <div className="editorial">
      <div className="matrix-head">
        <div>
          <span className="eyebrow">07 / COMPARISON</span>
          <h2 className="display display-sm">
            The honest <em>scorecard.</em>
          </h2>
        </div>
        <div className="matrix-controls">
          {sortOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={sort === option.key ? 'is-active' : ''}
              onClick={() => setSort(option.key)}
            >
              SORT / {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="matrix-wrap">
        <div className="matrix-row matrix-row--head">
          <span>#</span>
          <span>CONCEPT</span>
          <span>MECHANISM</span>
          {matrixColumns.map((column) => (
            <span key={column.key}>{column.label}</span>
          ))}
        </div>

        {rows.map(({ concept, index }) => (
          <button
            className="matrix-row"
            type="button"
            key={concept.id}
            onClick={() => onOpenConcept(index)}
          >
            <span className="matrix-num">{concept.index}</span>
            <span className="matrix-name">{concept.name}</span>
            <span className="matrix-mech">{concept.mechanism}</span>
            {(Object.keys(concept.scores) as (keyof ConceptScores)[]).map((key) => (
              <span
                className={`score ${key === 'complexity' ? 'score--complexity' : ''}`}
                key={key}
                aria-label={`${matrixColumns.find((column) => column.key === key)?.label}: ${concept.scores[key]} out of 10`}
              >
                {[1, 2, 3, 4, 5].map((bar) => (
                  <i key={bar} className={bar <= Math.round(concept.scores[key] / 2) ? 'on' : ''} />
                ))}
              </span>
            ))}
          </button>
        ))}
      </div>

      <div className="matrix-note">
        <span>SCORES / 10 · COMPLEXITY IS PRODUCTION LOAD, NOT CREATIVE QUALITY</span>
        <span>CLICK ANY ROW TO OPEN THE DOSSIER</span>
      </div>
    </div>
  );
}

export function RecommendationSlide({ onOpenConcept }: Pick<NavigationProps, 'onOpenConcept'>) {
  return (
    <div className="recommend">
      <div className="recommend-copy">
        <span className="eyebrow">08 / RECOMMENDATION</span>
        <h2 className="display display-sm">
          One stage. <em>Three escalating reveals.</em>
        </h2>
        <p className="lede">
          If the three products share one programme, we recommend a single architectural language with a
          different physical mechanism in each act. The audience learns the room, then watches it escalate.
        </p>

        <div className="recommend-list">
          {recommendedSlate.map((item) => {
            const index = concepts.findIndex((concept) => concept.id === item.conceptId);
            return (
              <button className="slate-card" type="button" key={item.act} onClick={() => onOpenConcept(index)}>
                <span className="slate-act">{item.act}</span>
                <span className="slate-size">{item.scale}</span>
                <span className="slate-name">
                  {item.concept}
                  <small>{item.role}</small>
                </span>
                <ArrowUpRight />
              </button>
            );
          })}
        </div>

        <p className="recommend-note">
          Act I earns trust with a quiet architectural reveal. Act II creates immersion with a projected world
          that lifts away. Act III delivers the physical climax and the photograph the event will be remembered
          by.
        </p>
      </div>

      <div className="recommend-visual">
        <StagePanel concept={trilogyConcept} hudLabel="STAGE SIMULATION / RECOMMENDED SLATE" />
      </div>
    </div>
  );
}

export function ProductionSlide({ onOpenIndex }: Pick<NavigationProps, 'onOpenIndex'>) {
  return (
    <div className="editorial">
      <div className="editorial-head">
        <div>
          <span className="eyebrow">09 / PRODUCTION</span>
          <h2 className="display display-sm">
            What we need. <em>What we protect.</em>
          </h2>
        </div>
        <p className="lede">
          The creative is only as ambitious as the engineering behind it. These are the inputs that unlock final
          design — and the controls that keep every cue safe, repeatable and recoverable.
        </p>
      </div>

      <div className="production">
        {productionNotes.map((group) => (
          <div className="production-col" key={group.title}>
            <h3>{group.title}</h3>
            <ol className="production-list">
              {group.items.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="next-steps">
        <div className="next-step">
          <b>STEP 01</b>
          <p>Confirm product dimensions, mass and handling restrictions.</p>
        </div>
        <div className="next-step">
          <b>STEP 02</b>
          <p>Survey the auditorium, rigging plan and stage load capacity.</p>
        </div>
        <div className="next-step">
          <b>STEP 03</b>
          <p>Lock one hero composition, then engineer backwards from it.</p>
        </div>
      </div>

      <button className="btn btn-sm production-cta" type="button" onClick={onOpenIndex}>
        <GridIcon /> RETURN TO THE CONCEPT INDEX
      </button>
    </div>
  );
}

export function ClosingSlide({
  onRestart,
  onOpenIndex,
}: {
  onRestart: () => void;
  onOpenIndex: () => void;
}) {
  return (
    <div className="closing">
      <div className="closing-copy">
        <span className="eyebrow">10 / CLOSE</span>
        <h2 className="closing-title">
          MAKE THE ROOM
          <br />
          <em>REMEMBER.</em>
        </h2>
        <p className="lede">
          The products can stay hidden until the event. The experience cannot. These sixteen mechanisms are
          ready to become one stage, one sequence and one unforgettable image.
        </p>
        <div className="cover-meta">
          <span>
            CONCEPTS <b>16</b>
          </span>
          <span>
            RECOMMENDED <b>03</b>
          </span>
          <span>
            BUILD <b>ONE STAGE</b>
          </span>
        </div>
        <div className="cover-actions">
          <button className="btn btn-primary" type="button" onClick={onRestart}>
            RESTART THE DOSSIER <ArrowRight />
          </button>
          <button className="btn" type="button" onClick={onOpenIndex}>
            <GridIcon /> CONCEPT INDEX
          </button>
        </div>
      </div>

      <div className="closing-visual">
        <StagePanel concept={conceptByScene('revolve')} hudLabel="STAGE SIMULATION / FINAL FRAME" />
      </div>
    </div>
  );
}
