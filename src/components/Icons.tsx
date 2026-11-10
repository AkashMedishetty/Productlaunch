interface IconProps {
  size?: number;
}

export function ArrowRight({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ArrowLeft({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M14 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ArrowUpRight({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12L12 4M5.5 4H12v6.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function GridIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="2" width="5" height="5" stroke="currentColor" strokeWidth="1" />
      <rect x="2" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="9" width="5" height="5" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function CloseIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ReplayIcon({ size = 11 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.2 6.2A5 5 0 1 1 3 9.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3 2.6v3.8h3.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
