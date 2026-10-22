import type { CSSProperties } from 'react';
import { mascotVariables } from '../tokens/mascot';
import './AnimatedAxolotlLogo.css';

export type AnimatedAxolotlLogoProps = {
  variant?: 'logo' | 'loader' | 'assistant';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  paused?: boolean;
  decorative?: boolean;
};
const labels = {logo: 'Axolotl', loader: 'Načítání…', assistant: 'Asistent Axolotl'};

/** Uiverse Jelly AI motion adapted to the user-supplied axolotl head. See vendor/NOTICE.md. */
export function AnimatedAxolotlLogo({
  variant = 'logo', size = 'medium', label = labels[variant], paused = false, decorative = false,
}: AnimatedAxolotlLogoProps) {
  return <div className="axo-animated-mark" data-size={size} data-variant={variant}
    data-paused={paused || undefined} style={mascotVariables as CSSProperties}
    role={decorative ? undefined : variant === 'loader' ? 'status' : 'img'}
    aria-label={decorative || variant === 'loader' ? undefined : label}
    aria-hidden={decorative || undefined}>
    <div className="axo-animated-mark__frame" aria-hidden="true">
      <div className="axo-animated-mark__bot">
        <div className="axo-animated-mark__orbit" />
        <svg className="axo-animated-mark__gills" viewBox="0 0 60 50" focusable="false">
          {/* Three feather-like branches on each side, following the supplied silhouette. */}
          {[false, true].map(mirror => <g key={String(mirror)} transform={mirror ? 'translate(60 0) scale(-1 1)' : undefined}>
            <path d="M17 21 C12 20 7 18 6 14 C3 12 2 8 5 9 C1 4 3 1 5 3 L7 7 C7 2 10 4 10 9 C12 5 13 8 13 11 C13 14 16 16 19 17 Z" />
            <path d="M14 27 C9 29 6 29 6 27 C2 27 1 25 4 24 C0 22 -1 18 2 18 L5 21 C3 15 6 16 8 21 C8 17 10 19 11 23 L15 24 Z" />
            <path d="M16 32 C14 35 12 38 10 37 C9 40 6 40 7 36 C4 40 2 38 4 35 C0 37 -1 33 2 32 L5 33 C3 29 6 29 8 32 C7 28 10 29 11 32 L15 30 Z" />
          </g>)}
        </svg>
        <div className="axo-animated-mark__body">
          <div className="axo-animated-mark__eyes">
            <div className="axo-animated-mark__eye axo-animated-mark__eye--left" />
            <div className="axo-animated-mark__eye axo-animated-mark__eye--right" />
          </div>
          <svg className="axo-animated-mark__smile" viewBox="0 0 38 31" focusable="false">
            <ellipse cx="16" cy="21" rx=".65" ry=".4" transform="rotate(30 16 21)" />
            <ellipse cx="22" cy="21" rx=".65" ry=".4" transform="rotate(-30 22 21)" />
            <path d="M10.5 23.5 C14 26.5 24 26.5 27.5 23.5" />
          </svg>
        </div>
      </div>
    </div>
    {!decorative && variant === 'loader' && <span className="axo-animated-mark__status">{label}</span>}
  </div>;
}
