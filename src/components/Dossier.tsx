import { motion } from 'framer-motion';
import type { Concept } from '../data/concepts';
import { deliveryFor } from '../data/deck';
import { CloseIcon } from './Icons';

interface DossierProps {
  concept: Concept;
  onClose: () => void;
}

export function Dossier({ concept, onClose }: DossierProps) {
  const delivery = deliveryFor(concept.id);

  return (
    <>
      <motion.div
        className="dossier-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.aside
        className="dossier"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      >
        <div className="dossier-head">
          <div>
            <span className="eyebrow eyebrow--plain">CONCEPT {concept.index} / PRODUCTION DOSSIER</span>
            <h2 className="dossier-title">{concept.name}</h2>
            <p className="dossier-sub">{concept.mechanism}</p>
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close dossier">
            <CloseIcon />
          </button>
        </div>

        <div className="dossier-section">
          <h4>01 / AUDIENCE EXPERIENCE</h4>
          <p>{concept.audience}</p>
          <p className="dossier-quote">{concept.tagline}</p>
        </div>

        <div className="dossier-section">
          <h4>02 / STAGE DESIGN</h4>
          <div className="dossier-two">
            <div>
              <p className="micro">ARCHITECTURE</p>
              <p>{concept.stageDesign}</p>
            </div>
            <div>
              <p className="micro">CONCEALMENT</p>
              <p>{concept.concealment}</p>
            </div>
          </div>
        </div>

        <div className="dossier-section">
          <h4>03 / CHIEF GUEST INTERACTION</h4>
          <p>{concept.guest}</p>
        </div>

        <div className="dossier-section">
          <h4>04 / REVEAL SEQUENCE</h4>
          <ol className="sequence-list">
            {concept.sequence.map((step) => (
              <li className="sequence-item" key={`${step.time}-${step.title}`}>
                <span className="sequence-time">{step.time}</span>
                <div>
                  <h5>{step.title}</h5>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="chip-row">
            {concept.phases.map((phase) => (
              <span key={phase}>{phase}</span>
            ))}
          </div>
        </div>

        <div className="dossier-section">
          <h4>05 / TECHNICAL EXECUTION</h4>
          <p>{concept.techDetail}</p>
          <div className="chip-row">
            {concept.tech.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="dossier-section">
          <h4>06 / THREE-PRODUCT ADAPTATION</h4>
          <div className="dossier-adapt">
            <article>
              <b>2 × 2 FT / ACT I</b>
              <p>{concept.adaptation.small}</p>
            </article>
            <article>
              <b>4 × 4 FT / ACT II</b>
              <p>{concept.adaptation.medium}</p>
            </article>
            <article>
              <b>6 × 6 FT / ACT III</b>
              <p>{concept.adaptation.large}</p>
            </article>
          </div>
        </div>

        <div className="dossier-section">
          <h4>07 / FEASIBILITY &amp; SAFETY</h4>
          <p>{concept.feasibility}</p>
          <p className="micro dossier-mitigation">MITIGATION</p>
          <p>{concept.mitigation}</p>
        </div>

        <div className="dossier-section">
          <h4>08 / DELIVERY &amp; BUILD</h4>
          <div className={`dossier-delivery tier-${delivery.tier.toLowerCase()}`}>
            <div>
              <p className="micro">TIER</p>
              <b>{delivery.tier}</b>
            </div>
            <div>
              <p className="micro">BUILD WINDOW</p>
              <b>{delivery.build}</b>
            </div>
          </div>
          <p>{delivery.note}</p>
        </div>

        <div className="dossier-section">
          <h4>09 / SIGNATURE WOW MOMENT</h4>
          <p className="dossier-quote">{concept.signature}</p>
        </div>

        <div className="dossier-section">
          <h4>10 / VISUAL DIRECTION</h4>
          <p>{concept.visualDirection}</p>
        </div>
      </motion.aside>
    </>
  );
}
