import type { ComponentType, ReactNode } from 'react';
/** Type boundary only. The accompanying upstream JSX/CSS are byte-for-byte originals. */
declare const StarBorder: ComponentType<{
  as?: ComponentType<any> | string;
  children?: ReactNode;
  color?: string;
  duration?: number;
  radius?: number;
  theme?: 'dark' | 'light';
  stars?: number;
  hover?: 'lap' | 'brighten' | 'reveal' | 'none';
  clickPulse?: boolean;
  sparkle?: boolean;
}>;
export default StarBorder;
