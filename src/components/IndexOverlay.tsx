import { motion } from 'framer-motion';
import { concepts } from '../data/concepts';
import { CloseIcon } from './Icons';

interface IndexOverlayProps {
  current: number | null;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function IndexOverlay({ current, onSelect, onClose }: IndexOverlayProps) {
  return (
    <motion.div
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="overlay-head">
        <div>
          <span className="eyebrow eyebrow--plain">CONCEPT INDEX / 16 DIRECTIONS</span>
          <h2 className="overlay-title">
            Choose a <em>mechanism.</em>
          </h2>
        </div>
        <button className="icon-btn" type="button" onClick={onClose} aria-label="Close concept index">
          <CloseIcon />
        </button>
      </div>

      <div className="overlay-grid">
        {concepts.map((concept, index) => (
          <button
            key={concept.id}
            type="button"
            className={`overlay-card ${current === index ? 'is-current' : ''}`}
            onClick={() => onSelect(index)}
          >
            <span className="overlay-card__num">{concept.index}</span>
            <span className="overlay-card__name">{concept.name}</span>
            <span className="overlay-card__mech">{concept.mechanism}</span>
            <span className="overlay-card__foot">
              {concept.complexity} / {String(concept.phases.length).padStart(2, '0')} CUES
            </span>
          </button>
        ))}
      </div>

      <div className="overlay-foot">
        <span>16 CONCEPTS / 3 RECOMMENDED / 1 STAGE</span>
        <span>ESC TO CLOSE / ARROWS TO MOVE</span>
      </div>
    </motion.div>
  );
}
