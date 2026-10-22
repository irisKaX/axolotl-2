import './AnimatedAxolotlLogo.css';

export type AnimatedAxolotlLogoProps = {
  variant?: 'logo' | 'loader' | 'assistant';
  size?: 'small' | 'medium' | 'large';
  label?: string;
  paused?: boolean;
  decorative?: boolean;
};
const labels = {logo: 'Axolotl', loader: 'Načítání…', assistant: 'Asistent Axolotl'};

/** MINI NX / Uiverse orbit with a stable flat Axolotl logo mark, separate from Mascot V3. See vendor/NOTICE.md. */
export function AnimatedAxolotlLogo({
  variant = 'logo', size = 'medium', label = labels[variant], paused = false, decorative = false,
}: AnimatedAxolotlLogoProps) {
  return <div className="axo-animated-mark" data-size={size} data-variant={variant}
    data-paused={paused || undefined}
    role={decorative ? undefined : variant === 'loader' ? 'status' : 'img'}
    aria-label={decorative || variant === 'loader' ? undefined : label}
    aria-hidden={decorative || undefined}>
    <div className="axo-animated-mark__frame" aria-hidden="true">
      <div className="axo-animated-mark__bot">
        <div className="axo-animated-mark__orbit" />
        <svg className="axo-animated-mark__symbol" viewBox="0 0 60 50" focusable="false">
          {/* One mirrored set: exactly three compact leaf-shaped gills per side. */}
          {[false, true].map(mirror => <g key={String(mirror)} data-gills={mirror ? 'right' : 'left'} transform={mirror ? 'translate(60 0) scale(-1 1)' : undefined}>
            <path data-gill d="M16 22 C10 22 6 16 7 11 C13 11 17 16 16 22Z" />
            <path data-gill d="M14 28 C8 31 3 28 2 24 C7 21 12 23 14 28Z" />
            <path data-gill d="M16 32 C15 38 10 41 6 38 C7 33 11 30 16 32Z" />
          </g>)}
          <path data-head d="M30 13 C19 13 12 20 12 29 C12 38 20 40 30 40 C40 40 48 38 48 29 C48 20 41 13 30 13Z" />
          <circle data-eye cx="23" cy="27" r="2.2" />
          <circle data-eye cx="37" cy="27" r="2.2" />
          <path data-smile d="M26 33 Q30 36 34 33" />
        </svg>
      </div>
    </div>
    {!decorative && variant === 'loader' && <span className="axo-animated-mark__status">{label}</span>}
  </div>;
}
