import { useEffect, useRef, useState } from 'react';
import type { Concept } from '../data/concepts';
import { StageCanvas } from '../scene/StageCanvas';
import { GridIcon, ReplayIcon } from './Icons';

interface StagePanelProps {
  concept: Concept;
  active?: boolean;
  hud?: boolean;
  signature?: boolean;
  cue?: boolean;
  hudLabel?: string;
}

export function StagePanel({
  concept,
  active = true,
  hud = true,
  signature = false,
  cue = false,
  hudLabel = 'STAGE SIMULATION',
}: StagePanelProps) {
  const [playKey, setPlayKey] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [playing, setPlaying] = useState(true);
  const [annotate, setAnnotate] = useState(true);
  const [phase, setPhase] = useState(0);
  const fill = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPlayKey((key) => key + 1);
    setScrub(null);
    setPlaying(true);
  }, [concept.id]);

  const handleProgress = (value: number) => {
    if (fill.current) fill.current.style.width = `${Math.min(100, value * 100)}%`;
    if (thumb.current) thumb.current.style.left = `${Math.min(100, value * 100)}%`;
    const next = Math.min(concept.phases.length - 1, Math.floor(value * concept.phases.length));
    setPhase((current) => (current === next ? current : next));
  };

  const stepIndex = Math.min(
    concept.sequence.length - 1,
    Math.round((phase / Math.max(1, concept.phases.length - 1)) * (concept.sequence.length - 1)),
  );
  const caption = concept.sequence[stepIndex];

  const positionFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = track.current?.getBoundingClientRect();
    if (!bounds) return null;
    return Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  };

  const startScrub = (event: React.PointerEvent<HTMLDivElement>) => {
    const value = positionFromEvent(event);
    if (value === null) return;
    track.current?.setPointerCapture(event.pointerId);
    setPlaying(false);
    setScrub(value);
  };

  const moveScrub = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scrub === null) return;
    const value = positionFromEvent(event);
    if (value === null) return;
    setScrub(value);
  };

  const endScrub = (event: React.PointerEvent<HTMLDivElement>) => {
    if (track.current?.hasPointerCapture(event.pointerId)) {
      track.current.releasePointerCapture(event.pointerId);
    }
  };

  const replay = () => {
    setScrub(null);
    setPlaying(true);
    setPlayKey((key) => key + 1);
  };

  return (
    <div className="stage-panel">
      <StageCanvas
        key={concept.id}
        concept={concept}
        playKey={playKey}
        active={active}
        scrub={scrub}
        annotate={annotate}
        onProgress={handleProgress}
      />

      {hud && (
        <div className="stage-hud">
          <div className="stage-hud__row">
            <div className="hud-block">
              <span className="hud-label">{hudLabel}</span>
              <span className="hud-value hud-value--accent">{concept.name}</span>
            </div>
            <div className="hud-block hud-block--right">
              <span className="hud-label">{playing ? 'AUTO CUE / 5.4 SEC' : 'SCRUB / HOLD FRAME'}</span>
              <div className="hud-actions">
                <button
                  className={`replay-btn ${annotate ? 'is-on' : ''}`}
                  type="button"
                  onClick={() => setAnnotate((value) => !value)}
                  aria-pressed={annotate}
                >
                  <GridIcon /> NOTES
                </button>
                <button className="replay-btn" type="button" onClick={replay}>
                  <ReplayIcon /> REPLAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {signature && (
        <div className="stage-signature" key={playKey}>
          <span className="micro">SIGNATURE MOMENT</span>
          <p>{concept.signature}</p>
        </div>
      )}

      {cue && (
        <div className={`cue-strip ${scrub !== null ? 'is-scrubbing' : ''}`}>
          <div className="stage-caption">
            <span className="stage-caption__time">{caption.time}</span>
            <span className="stage-caption__title">{caption.title}</span>
            <span className="stage-caption__detail">{caption.detail}</span>
          </div>
          <div
            className="cue-strip__track"
            ref={track}
            onPointerDown={startScrub}
            onPointerMove={moveScrub}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
            role="slider"
            aria-label="Cue timeline"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((scrub ?? 0) * 100)}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
              event.preventDefault();
              const step = event.key === 'ArrowRight' ? 0.05 : -0.05;
              setPlaying(false);
              setScrub((value) => Math.max(0, Math.min(1, (value ?? 0) + step)));
            }}
          >
            <div className="cue-strip__fill" ref={fill} />
            <div className="cue-strip__thumb" ref={thumb} />
          </div>
          <div className="cue-strip__phases">
            {concept.phases.map((name, index) => (
              <button
                className={`cue-strip__phase ${index === phase ? 'is-active' : ''}`}
                key={name}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setScrub((index + 0.5) / concept.phases.length);
                }}
              >
                <b>0{index + 1}</b>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
