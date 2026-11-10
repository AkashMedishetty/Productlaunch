import { trilogyConcept } from '../data/concepts';
import { ArrowRight, GridIcon } from './Icons';
import { StagePanel } from './StagePanel';

interface CoverSlideProps {
  onEnter: () => void;
  onOpenIndex: () => void;
}

export function CoverSlide({ onEnter, onOpenIndex }: CoverSlideProps) {
  return (
    <div className="cover">
      <div className="cover-copy stagger">
        <span className="eyebrow">A GOVERNMENT PRODUCT LAUNCH / CREATIVE DIRECTION</span>
        <h1 className="cover-title">
          <span>STAGE DOSSIER / 2026</span>
          THE ART
          <em>OF REVEAL</em>
        </h1>
        <p className="cover-sub">
          Sixteen stage mechanisms for unveiling three unknown products in front of two thousand people. Every
          mechanism is sequenced, engineered and modelled in real time.
        </p>
        <div className="cover-meta">
          <span>
            CONCEPTS <b>16</b>
          </span>
          <span>
            ACTS <b>3</b>
          </span>
          <span>
            AUDIENCE <b>2,000</b>
          </span>
          <span>
            STAGES <b>1</b>
          </span>
          <span>
            MODEL <b>REAL-TIME R3F</b>
          </span>
        </div>
        <div className="cover-actions">
          <button className="btn btn-primary" type="button" onClick={onEnter}>
            ENTER THE DOSSIER <ArrowRight />
          </button>
          <button className="btn" type="button" onClick={onOpenIndex}>
            <GridIcon /> ALL 16 CONCEPTS
          </button>
        </div>
      </div>

      <div className="cover-visual">
        <StagePanel concept={trilogyConcept} hudLabel="STAGE SIMULATION / TRILOGY" />
        <div className="cover-index">
          <span>REAL-TIME STAGE MODEL</span>
          <b>ONE ROOM / THREE MECHANISMS</b>
        </div>
      </div>
    </div>
  );
}
