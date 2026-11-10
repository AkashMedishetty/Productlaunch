import type { Concept } from '../data/concepts';
import { deliveryFor } from '../data/deck';
import { ArrowRight, ArrowUpRight, GridIcon } from './Icons';
import { StagePanel } from './StagePanel';

interface ConceptSlideProps {
  concept: Concept;
  onDossier: () => void;
  onIndex: () => void;
}

export function ConceptSlide({ concept, onDossier, onIndex }: ConceptSlideProps) {
  const delivery = deliveryFor(concept.id);

  return (
    <div className="concept-slide">
      <div className="concept-visual">
        <StagePanel concept={concept} cue />
      </div>

      <div className="concept-copy">
        <div className="concept-copy__head">
          <span className="concept-number">{concept.index}</span>
          <div className={`concept-complexity tier-${delivery.tier.toLowerCase()}`}>
            DELIVERY TIER
            <b>{delivery.tier}</b>
          </div>
        </div>

        <h1 className="concept-name">{concept.name}</h1>
        <p className="concept-mechanism">{concept.mechanism}</p>
        <p className="concept-proposition">{concept.proposition}</p>
        <p className="concept-audience">{concept.audience}</p>

        <div className="concept-section-label">
          <span>SIGNATURE WOW MOMENT</span>
          <span>03–05 SEC</span>
        </div>
        <div className="signature-block">
          <p>{concept.signature}</p>
        </div>

        <div className="concept-stats">
          <div className="concept-stat">
            <small>FOOTPRINT</small>
            <b>{concept.sizeLabel}</b>
          </div>
          <div className="concept-stat">
            <small>DELIVERY</small>
            <b className={`tier-${delivery.tier.toLowerCase()}`}>{delivery.tier}</b>
          </div>
          <div className="concept-stat">
            <small>BUILD</small>
            <b>{delivery.build}</b>
          </div>
        </div>

        <div className="concept-actions">
          <button className="btn btn-primary" type="button" onClick={onDossier}>
            FULL DOSSIER <ArrowRight />
          </button>
          <button className="btn" type="button" onClick={onIndex}>
            <GridIcon /> INDEX <ArrowUpRight />
          </button>
        </div>

        <div className="concept-tech">
          {concept.tech.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
