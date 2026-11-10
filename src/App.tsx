import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BriefSlide,
  ClosingSlide,
  ConceptIndexSlide,
  ExperienceSlide,
  LabSlide,
  MatrixSlide,
  PremiseSlide,
  ProductionSlide,
  RecommendationSlide,
  StageSystemSlide,
} from './components/EditorialSlides';
import { ConceptSlide } from './components/ConceptSlide';
import { CoverSlide } from './components/CoverSlide';
import { Dossier } from './components/Dossier';
import { ArrowLeft, ArrowRight, GridIcon } from './components/Icons';
import { IndexOverlay } from './components/IndexOverlay';
import { concepts } from './data/concepts';

type SlideDef =
  | {
      kind:
        | 'cover'
        | 'brief'
        | 'premise'
        | 'experience'
        | 'system'
        | 'index'
        | 'lab'
        | 'matrix'
        | 'recommend'
        | 'production'
        | 'closing';
      chapter: string;
    }
  | { kind: 'concept'; conceptIndex: number; chapter: string };

const slides: SlideDef[] = [
  { kind: 'cover', chapter: 'OPENING' },
  { kind: 'brief', chapter: 'THE BRIEF' },
  { kind: 'premise', chapter: 'THE PREMISE' },
  { kind: 'experience', chapter: 'THE EXPERIENCE' },
  { kind: 'system', chapter: 'THE STAGE SYSTEM' },
  { kind: 'index', chapter: 'CONCEPT INDEX' },
  ...concepts.map((_, index) => ({
    kind: 'concept' as const,
    conceptIndex: index,
    chapter: `CONCEPT ${String(index + 1).padStart(2, '0')} / 16`,
  })),
  { kind: 'lab', chapter: 'THE CONCEPT LAB' },
  { kind: 'matrix', chapter: 'COMPARISON' },
  { kind: 'recommend', chapter: 'RECOMMENDATION' },
  { kind: 'production', chapter: 'PRODUCTION' },
  { kind: 'closing', chapter: 'CLOSE' },
];

const CONCEPT_START = 6;

const slideVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -32 : 32,
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  }),
};

function readInitialSlide() {
  if (typeof window === 'undefined') return 0;
  const raw = Number(window.location.hash.replace('#', ''));
  if (Number.isFinite(raw) && raw >= 1 && raw <= slides.length) return raw - 1;
  return 0;
}

export default function App() {
  const [index, setIndex] = useState(readInitialSlide);
  const [direction, setDirection] = useState(1);
  const [indexOpen, setIndexOpen] = useState(false);
  const [dossier, setDossier] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next));
      if (clamped !== index) {
        setDirection(clamped > index ? 1 : -1);
      }
      setIndex(clamped);
      setIndexOpen(false);
      setDossier(null);
    },
    [index],
  );

  useEffect(() => {
    window.history.replaceState(null, '', `#${String(index + 1).padStart(2, '0')}`);
    document.title = `${slides[index].chapter} — Reveal / Stage Dossier`;
  }, [index]);

  useEffect(() => {
    const onHashChange = () => {
      const raw = Number(window.location.hash.replace('#', ''));
      if (!Number.isFinite(raw) || raw < 1 || raw > slides.length) return;
      const next = raw - 1;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
      setIndexOpen(false);
      setDossier(null);
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dossier !== null) {
          setDossier(null);
          return;
        }
        if (indexOpen) {
          setIndexOpen(false);
        }
        return;
      }

      if (indexOpen || dossier !== null) return;

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        go(index + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        go(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        go(slides.length - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dossier, go, index, indexOpen]);

  const slide = slides[index];
  const currentConcept = slide.kind === 'concept' ? slide.conceptIndex : null;

  const renderSlide = () => {
    switch (slide.kind) {
      case 'cover':
        return <CoverSlide onEnter={() => go(1)} onOpenIndex={() => setIndexOpen(true)} />;
      case 'brief':
        return <BriefSlide />;
      case 'premise':
        return <PremiseSlide />;
      case 'experience':
        return <ExperienceSlide />;
      case 'system':
        return <StageSystemSlide onOpenConcept={(conceptIndex) => go(CONCEPT_START + conceptIndex)} />;
      case 'index':
        return <ConceptIndexSlide onOpenConcept={(conceptIndex) => go(CONCEPT_START + conceptIndex)} />;
      case 'concept':
        return (
          <ConceptSlide
            concept={concepts[slide.conceptIndex]}
            onDossier={() => setDossier(slide.conceptIndex)}
            onIndex={() => setIndexOpen(true)}
          />
        );
      case 'lab':
        return <LabSlide />;
      case 'matrix':
        return <MatrixSlide onOpenConcept={(conceptIndex) => go(CONCEPT_START + conceptIndex)} />;
      case 'recommend':
        return <RecommendationSlide onOpenConcept={(conceptIndex) => go(CONCEPT_START + conceptIndex)} />;
      case 'production':
        return <ProductionSlide onOpenIndex={() => setIndexOpen(true)} />;
      case 'closing':
        return <ClosingSlide onRestart={() => go(0)} onOpenIndex={() => setIndexOpen(true)} />;
    }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span className="brand-word">
            REVEAL <span>/ STAGE DOSSIER</span>
          </span>
        </div>

        <div className="chapter-indicator">{slide.chapter}</div>

        <div className="top-actions">
          <span className="counter">
            {String(index + 1).padStart(2, '0')} <small>/ {slides.length}</small>
          </span>
          <button className="btn btn-sm" type="button" onClick={() => setIndexOpen(true)}>
            <GridIcon /> CONCEPT INDEX
          </button>
        </div>
      </header>

      <main
        className="deck-main"
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          if (!touchStart.current) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - touchStart.current.x;
          const dy = touch.clientY - touchStart.current.y;
          touchStart.current = null;
          if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            go(index + (dx < 0 ? 1 : -1));
          }
        }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            className="slide"
            key={index}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bottombar">
        <span className="bottom-label">{slide.chapter}</span>

        <div className="progress">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / slides.length) * 100}%` }}
          />
          <div className="progress-ticks">
            {slides.map((item, tickIndex) => (
              <i key={`${item.chapter}-${tickIndex}`} />
            ))}
          </div>
        </div>

        <div className="nav-cluster">
          <span className="key-hint">← → NAVIGATE / ESC CLOSE</span>
          <button
            className="nav-btn"
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous slide"
          >
            <ArrowLeft />
          </button>
          <button
            className="nav-btn"
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === slides.length - 1}
            aria-label="Next slide"
          >
            <ArrowRight />
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {indexOpen && (
          <IndexOverlay
            current={currentConcept}
            onSelect={(conceptIndex) => go(CONCEPT_START + conceptIndex)}
            onClose={() => setIndexOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dossier !== null && (
          <Dossier concept={concepts[dossier]} onClose={() => setDossier(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
