/**
 * Signature visual motif for Sahay Setu ("help bridge"): a simple arch connecting
 * two pillars, representing citizens and responders joined in a moment of need.
 * Used as a decorative divider on auth screens and the dashboard header.
 */
const BridgeDivider = ({ className = '' }) => (
  <svg viewBox="0 0 400 60" fill="none" className={className} preserveAspectRatio="none">
    <path
      d="M0 60 L0 44 C 60 44, 90 4, 200 4 C 310 4, 340 44, 400 44 L400 60 Z"
      fill="currentColor"
      fillOpacity="0.12"
    />
    <path
      d="M0 44 C 60 44, 90 4, 200 4 C 310 4, 340 44, 400 44"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line x1="30" y1="44" x2="30" y2="60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="370" y1="44" x2="370" y2="60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default BridgeDivider;
