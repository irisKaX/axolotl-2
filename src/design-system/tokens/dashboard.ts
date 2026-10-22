import type { CSSProperties } from 'react';
import { paints } from './paints';

// Exact 523c983 composition values. Approval is scoped to this composition,
// not a promotion of every palette option to a global application token.
export const dashboardTokens = {
  '--pg-font-body': 'Manrope, Arial, sans-serif',
  '--pg-font-title': 'Space, Manrope, sans-serif',
  '--pg-font-header': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '--pg-office-ink': '#272539',
  '--pg-office-line': '#32304e26',
  '--pg-office-shadow-compact': 'inset 0 1px #ffffff50,0 6px 0 #0001',
  '--pg-office-shadow': 'inset 0 1px #ffffff70,0 6px 0 #00000010,0 22px 40px -30px #38304b55',
  '--pg-inset': 'clamp(16px, 1.5vw, 32px)',
  '--bento-gap': 'clamp(14px, 1.2vw, 18px)',
  '--pg-cell-padding': 'clamp(18px, 1.8vw, 34px)',
  '--pg-cell-radius': 'clamp(24px, 2.1vw, 40px)',
  '--pg-label-size': 'clamp(16px, 1.3vw, 24px)',
  '--pg-office-label-size': 'clamp(26px, 2.5vw, 44px)',
  '--pg-label-weight': '600',
  '--pg-label-leading': '1.2',
  '--pg-label-tracking': '-.025em',
  '--pg-hover-duration': '280ms',
  '--pg-hover-easing': 'cubic-bezier(.22,1,.36,1)',
  '--pg-hover-lift': '-3px',
  '--pg-beam-duration': '12s',
  '--pg-beam-width': '2px',
  '--pg-card-shadow': 'inset 0 1px 0 var(--pg-glint),inset 0 -1px 0 color-mix(in srgb,var(--pg-black) 12%,transparent),0 3px 6px -3px var(--pg-shadow),0 18px 36px -20px var(--pg-shadow)',
  '--pg-card-hover-shadow': 'inset 0 1px var(--pg-glint),0 8px 16px -12px var(--pg-shadow),0 24px 44px -23px var(--pg-shadow),0 0 24px -12px color-mix(in srgb,var(--pg-axolotl-violet) 25%,transparent)',
};
export const dashboardThemes = {
  dark: {
    '--pg-fg': 'var(--pg-light)',
    '--pg-secondary': 'color-mix(in srgb,var(--pg-light) 69%,var(--pg-black))',
    '--pg-edge': 'color-mix(in srgb,var(--pg-light) 16%,transparent)',
    '--pg-glint': 'color-mix(in srgb,var(--pg-white) 17%,transparent)',
    '--pg-shadow': 'color-mix(in srgb,var(--pg-black) 55%,transparent)',
    '--pg-widget-3': 'linear-gradient(130deg,color-mix(in srgb,var(--pg-black) 93%,transparent),color-mix(in srgb,var(--pg-black) 98%,transparent)),var(--pg-electric-blue)',
    '--pg-widget-4': 'linear-gradient(130deg,color-mix(in srgb,var(--pg-black) 90%,transparent),color-mix(in srgb,var(--pg-black) 94%,transparent)),var(--pg-neon-purple)',
    '--pg-header-backdrop': 'var(--pg-black)',
    '--pg-office': '#b0aecf',
    '--pg-ambient-opacity': '.09',
  },
  light: {
    '--pg-fg': 'var(--pg-black)',
    '--pg-secondary': 'color-mix(in srgb,var(--pg-black) 66%,var(--pg-light))',
    '--pg-edge': 'color-mix(in srgb,var(--pg-axolotl-violet) 15%,transparent)',
    '--pg-glint': 'var(--pg-white)',
    '--pg-shadow': 'color-mix(in srgb,var(--pg-axolotl-violet) 13%,transparent)',
    '--pg-widget-3': 'linear-gradient(130deg,color-mix(in srgb,var(--pg-white) 98%,transparent),color-mix(in srgb,var(--pg-light) 95%,transparent)),var(--pg-electric-blue)',
    '--pg-widget-4': 'linear-gradient(130deg,color-mix(in srgb,var(--pg-white) 98%,transparent),color-mix(in srgb,var(--pg-light) 92%,transparent)),var(--pg-neon-purple)',
    '--pg-header-backdrop': 'var(--pg-light)',
    '--pg-office': '#c8c3e9',
    '--pg-ambient-opacity': '.055',
  },
};
export function dashboardStyle(theme: 'dark' | 'light'): CSSProperties {
  return { ...Object.fromEntries(paints.map(p => [`--pg-${p.id}`, p.css])), ...dashboardTokens, ...dashboardThemes[theme] } as CSSProperties;
}
